//! The host view: renders the tree with GPUI, sends events to JS, and draws
//! the router's tabs and stacks the way the current platform does.
use std::cell::RefCell;
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Instant;

use gpui::{
    AnyElement, App, Context, Div, ElementId, Entity, FocusHandle, FontWeight, Image, ImageFormat, KeyBinding,
    MouseButton, NavigationDirection, ObjectFit, Rgba, ScrollWheelEvent, SharedString, Styled, TouchPhase, Window,
    actions, div, img, prelude::*, px, rgba, white,
};

use crate::engine::{Engine, Value};
use crate::input::{InputEvent, TextInput};
use crate::look::{Layer, Look};
use crate::tree::{Align, Changes, Kind, Node, Style, Tree};

actions!(nuclo, [Back]);

pub fn bind_keys(cx: &mut App) {
    let context = Some("NucloHost");
    cx.bind_keys([KeyBinding::new("cmd-[", Back, context), KeyBinding::new("alt-left", Back, context)]);
    // gpui-mobile delivers Android's back button as escape.
    if cfg!(target_os = "android") {
        cx.bind_keys([KeyBinding::new("escape", Back, context)]);
    }
}

/// A push, pop or cancelled swipe, animated between two `reveal` values (see Look::layers).
struct Transition {
    top: u32,
    below: u32,
    from: f32,
    to: f32,
    start: Instant,
}

#[derive(Default)]
struct StackState {
    /// The screens on screen after the last batch, bottom to top.
    shown: Vec<u32>,
    transition: Option<Transition>,
}

/// An interactive back: the top screen follows the finger.
struct Swipe {
    stack: u32,
    offset: f32,
    /// Horizontal on its first move, or it is a scroll, not a swipe.
    decided: bool,
}

pub struct Host {
    engine: Engine,
    tree: Tree,
    stacks: HashMap<u32, StackState>,
    inputs: HashMap<u32, Entity<TextInput>>,
    /// Asset paths in the bundle are relative to app.js.
    dir: PathBuf,
    look: Look,
    swipe: Option<Swipe>,
    tab_switch: Option<Instant>,
    pub focus: FocusHandle,
    /// Safe-area top and bottom, in points.
    insets: (f32, f32),
    /// The last device data sent to JS, by name.
    devices: HashMap<String, String>,
    icons: RefCell<HashMap<(&'static str, u32), Arc<Image>>>,
}

impl Host {
    pub fn new(bundle: PathBuf, look: Look, insets: (f32, f32), cx: &mut Context<Self>) -> Self {
        let source = std::fs::read_to_string(&bundle).unwrap_or_else(|e| panic!("{}: {e}", bundle.display()));
        let mut host = Self {
            engine: Engine::new(),
            tree: Tree::new(),
            stacks: HashMap::new(),
            inputs: HashMap::new(),
            dir: bundle.parent().map(PathBuf::from).unwrap_or_default(),
            look,
            swipe: None,
            tab_switch: None,
            focus: cx.focus_handle(),
            insets,
            devices: HashMap::new(),
            icons: RefCell::default(),
        };
        let batches = host.engine.eval(source);
        host.apply(batches, cx);
        for name in host.engine.watched() {
            host.devices.insert(name.clone(), crate::device::read(&name));
        }
        // Device data has no change events here: read it again every few seconds.
        cx.spawn(async move |this, cx| {
            loop {
                cx.background_executor().timer(std::time::Duration::from_secs(5)).await;
                if this.update(cx, |host, cx| host.poll_devices(cx)).is_err() {
                    break;
                }
            }
        })
        .detach();
        host
    }

    fn poll_devices(&mut self, cx: &mut Context<Self>) {
        for name in self.engine.watched() {
            let json = crate::device::read(&name);
            if self.devices.get(&name) != Some(&json) {
                self.devices.insert(name.clone(), json.clone());
                let batches = self.engine.device_changed(&name, json);
                self.apply(batches, cx);
            }
        }
    }

    // ── JS ↔ host ────────────────────────────────────────────────────────

    fn emit(&mut self, id: u32, kind: &str, value: Value, cx: &mut Context<Self>) {
        let batches = self.engine.emit(id, kind, value);
        self.apply(batches, cx);
    }

    fn apply(&mut self, batches: Vec<String>, cx: &mut Context<Self>) {
        let mut changes = Changes::default();
        for json in &batches {
            self.tree.apply(json, &mut changes);
        }
        for id in changes.created_inputs {
            let input = cx.new(TextInput::new);
            cx.subscribe(&input, move |this: &mut Self, _, event: &InputEvent, cx| match event {
                InputEvent::Changed(text) => this.emit(id, "input", Value::Text(text.clone()), cx),
                InputEvent::Submitted => this.emit(id, "change", Value::None, cx),
            })
            .detach();
            self.inputs.insert(id, input);
        }
        for id in changes.values {
            let (Some(node), Some(input)) = (self.tree.get(id), self.inputs.get(&id)) else { continue };
            let (value, placeholder, password) = (node.value.clone(), node.placeholder.clone(), node.password);
            input.update(cx, |input, cx| {
                input.placeholder = placeholder.into();
                input.password = password;
                input.set_text(&value, cx);
            });
        }
        for stack in changes.stacks {
            self.sync(stack);
        }
        self.sweep();
        cx.notify();
    }

    /// Animates a stack to its new model: a new top is a push, a removed top a pop.
    fn sync(&mut self, stack: u32) {
        let model = self.tree.get(stack).map(|n| n.children.clone()).unwrap_or_default();
        let state = self.stacks.entry(stack).or_default();
        if let (Some(&old), Some(&new)) = (state.shown.last(), model.last())
            && old != new
        {
            let start = Instant::now();
            if !state.shown.contains(&new) {
                state.transition = Some(Transition { top: new, below: old, from: 1., to: 0., start });
            } else if !model.contains(&old) {
                state.transition = Some(Transition { top: old, below: new, from: 0., to: 1., start });
            }
        }
        state.shown = model;
    }

    /// Lets go of removed screens once nothing shows them.
    fn sweep(&mut self) {
        let mut keep = HashSet::new();
        for state in self.stacks.values() {
            keep.extend(state.shown.iter().copied());
            if let Some(t) = &state.transition {
                keep.extend([t.top, t.below]);
            }
        }
        self.tree.sweep(&keep);
        let tree = &self.tree;
        self.inputs.retain(|id, _| tree.nodes.contains_key(id));
    }

    // ── Navigation ───────────────────────────────────────────────────────

    fn active_stack(&self) -> Option<u32> {
        let root = self.tree.root_nav?;
        let node = self.tree.get(root)?;
        match node.kind {
            Kind::Tabs => node.children.get(node.selected.min(node.children.len().saturating_sub(1))).copied(),
            _ => Some(root),
        }
    }

    /// The user went back: pop natively first, then tell JS the depth left.
    fn go_back(&mut self, stack: u32, from: f32, cx: &mut Context<Self>) -> bool {
        let Some(node) = self.tree.nodes.get_mut(&stack) else { return false };
        if node.children.len() < 2 {
            return false;
        }
        let top = node.children.pop().unwrap();
        let below = *node.children.last().unwrap();
        let depth = node.children.len();
        let state = self.stacks.entry(stack).or_default();
        state.shown = node.children.clone();
        state.transition = Some(Transition { top, below, from, to: 1., start: Instant::now() });
        self.emit(stack, "pop", Value::Number(depth as f64), cx);
        true
    }

    fn pop_to_root(&mut self, stack: u32, cx: &mut Context<Self>) {
        let Some(node) = self.tree.nodes.get_mut(&stack) else { return };
        if node.children.len() < 2 {
            return;
        }
        let top = *node.children.last().unwrap();
        node.children.truncate(1);
        let state = self.stacks.entry(stack).or_default();
        state.shown = node.children.clone();
        state.transition = Some(Transition { top, below: node.children[0], from: 0., to: 1., start: Instant::now() });
        self.emit(stack, "pop", Value::Number(1.), cx);
    }

    fn back(&mut self, cx: &mut Context<Self>) {
        if let Some(stack) = self.active_stack() {
            self.go_back(stack, 0., cx);
        }
    }

    fn select_tab(&mut self, tabs: u32, index: usize, cx: &mut Context<Self>) {
        let Some(node) = self.tree.nodes.get_mut(&tabs) else { return };
        if node.selected == index {
            // Re-tapping the current tab goes back to its root.
            if let Some(&stack) = node.children.get(index) {
                self.pop_to_root(stack, cx);
            }
            return;
        }
        node.selected = index;
        self.tab_switch = Some(Instant::now());
        self.emit(tabs, "select", Value::Number(index as f64), cx);
    }

    fn swipe_event(&mut self, stack: u32, event: &ScrollWheelEvent, width: f32, cx: &mut Context<Self>) {
        if !self.look.swipes_back() {
            return;
        }
        let depth = self.tree.get(stack).map_or(0, |n| n.children.len());
        let delta = event.delta.pixel_delta(px(16.));
        let (dx, dy) = (f32::from(delta.x), f32::from(delta.y));
        match event.touch_phase {
            TouchPhase::Started => {
                let at_edge = f32::from(event.position.x) < 28.;
                if depth > 1 && (at_edge || !self.look.swipe_from_edge()) {
                    self.swipe = Some(Swipe { stack, offset: 0., decided: false });
                }
            }
            TouchPhase::Moved => {
                let Some(swipe) = self.swipe.as_mut().filter(|s| s.stack == stack) else { return };
                if !swipe.decided && (dx != 0. || dy != 0.) {
                    swipe.decided = true;
                    if dy.abs() > dx.abs() || dx < 0. {
                        self.swipe = None;
                        return;
                    }
                }
                swipe.offset = (swipe.offset + dx).clamp(0., width);
                cx.notify();
            }
            _ => {
                let Some(swipe) = self.swipe.take() else { return };
                let reveal = swipe.offset / width.max(1.);
                if reveal > 0.3 {
                    self.go_back(stack, reveal, cx);
                } else if reveal > 0. {
                    let node = self.tree.get(stack).unwrap();
                    let (top, below) = (node.children[depth - 1], node.children[depth - 2]);
                    let state = self.stacks.entry(stack).or_default();
                    state.transition = Some(Transition { top, below, from: reveal, to: 0., start: Instant::now() });
                }
                cx.notify();
            }
        }
    }

    /// Ends finished transitions; keeps frames coming while one runs.
    fn tick(&mut self, window: &mut Window) {
        let duration = self.look.duration().as_secs_f32();
        let mut ended = false;
        for state in self.stacks.values_mut() {
            if let Some(t) = &state.transition {
                if t.start.elapsed().as_secs_f32() >= duration {
                    state.transition = None;
                    ended = true;
                } else {
                    window.request_animation_frame();
                }
            }
        }
        if self.tab_switch.is_some_and(|start| start.elapsed().as_secs_f32() > 0.3) {
            self.tab_switch = None;
        } else if self.tab_switch.is_some() {
            window.request_animation_frame();
        }
        if ended {
            self.sweep();
        }
    }

    // ── Icons: Material Symbols paths (Apache-2.0), tinted per use ─────────

    fn icon(&self, name: &str, color: Rgba, size: f32) -> AnyElement {
        let (name, path): (&'static str, &str) = match name {
            "chart" => ("chart", "M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"),
            "photo" => ("photo", "M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4 2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"),
            "person" => ("person", "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.43-.82-6.14-2.88a9.947 9.947 0 0 1 12.28 0C16.43 19.18 14.03 20 12 20z"),
            "chevron" => ("chevron", "M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"),
            "arrow" => ("arrow", "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"),
            "check" => ("check", "M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"),
            _ => return div().size(px(size)).into_any_element(),
        };
        let key = color_key(color);
        let image = self
            .icons
            .borrow_mut()
            .entry((name, key))
            .or_insert_with(|| {
                let svg = format!(
                    r##"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96"><path fill="#{:06x}" fill-opacity="{}" d="{path}"/></svg>"##,
                    key >> 8,
                    (key & 0xff) as f32 / 255.
                );
                Arc::new(Image::from_bytes(ImageFormat::Svg, svg.into_bytes()))
            })
            .clone();
        img(image).size(px(size)).flex_shrink_0().into_any_element()
    }

    // ── Rendering ────────────────────────────────────────────────────────

    fn node(&self, id: u32, cx: &mut Context<Self>) -> AnyElement {
        let Some(node) = self.tree.get(id) else { return div().into_any_element() };
        match node.kind {
            Kind::Text => style(div(), &node.style).child(node.text.clone()).into_any_element(),
            Kind::Image => {
                let s = &node.style;
                let mut image = img(self.dir.join(&node.src)).object_fit(ObjectFit::Cover).flex_shrink_0().rounded(px(s.radius));
                image = match s.width {
                    Some(w) => image.w(px(w)),
                    None => image.w_full(),
                };
                if let Some(h) = s.height {
                    image = image.h(px(h));
                }
                image.into_any_element()
            }
            Kind::Input => {
                let field = style(div().flex().min_h(px(20.)), &node.style).when(node.style.background.is_none(), |d| {
                    d.bg(white()).rounded(px(8.)).px(px(10.)).py(px(8.))
                });
                match self.inputs.get(&id) {
                    Some(input) => field.child(input.clone()).into_any_element(),
                    None => field.into_any_element(),
                }
            }
            Kind::Checkbox => self.checkbox(id, node, cx),
            Kind::Button => {
                let accent = self.look.accent();
                let button = style(div().flex().items_center().justify_center().px(px(14.)).py(px(8.)), &node.style)
                    .when(node.style.background.is_none(), |d| d.bg(accent).text_color(white()).rounded(px(8.)))
                    .child(node.text.clone());
                self.clickable(id, button, node, cx)
            }
            Kind::Stack | Kind::Tabs => div().into_any_element(),
            Kind::View | Kind::Screen => {
                let s = &node.style;
                let mut el = style(div().flex(), s);
                el = if s.row { el.flex_row() } else { el.flex_col() };
                el = el.gap(px(s.gap));
                el = match s.align {
                    Some(Align::Start) => el.items_start(),
                    Some(Align::Center) => el.items_center(),
                    Some(Align::End) => el.items_end(),
                    _ => el,
                };
                let el = el.children(node.children.iter().map(|&child| self.node(child, cx)));
                self.clickable(id, el, node, cx)
            }
        }
    }

    /// Any view can be tapped; it dims while pressed.
    fn clickable(&self, id: u32, el: Div, node: &Node, cx: &mut Context<Self>) -> AnyElement {
        if !node.click {
            return el.into_any_element();
        }
        let pressed = node.style.opacity * 0.55;
        el.id(ElementId::Integer(id as u64))
            .cursor_pointer()
            .active(move |s| s.opacity(pressed))
            .on_click(cx.listener(move |this, _, _, cx| this.emit(id, "click", Value::None, cx)))
            .into_any_element()
    }

    fn checkbox(&self, id: u32, node: &Node, cx: &mut Context<Self>) -> AnyElement {
        let on = node.checked;
        let accent = self.look.accent();
        let round = if self.look == Look::Ios { 11. } else { 4. };
        div()
            .id(ElementId::Integer(id as u64))
            .size(px(22.))
            .flex_shrink_0()
            .rounded(px(round))
            .border_2()
            .border_color(if on { accent } else { rgba(0x00000040) })
            .bg(if on { accent } else { white().into() })
            .flex()
            .items_center()
            .justify_center()
            .when(on, |d| d.child(self.icon("check", white().into(), 16.)))
            .cursor_pointer()
            .on_click(cx.listener(move |this, _, _, cx| {
                let on = this.tree.get(id).is_some_and(|n| !n.checked);
                if let Some(node) = this.tree.nodes.get_mut(&id) {
                    node.checked = on;
                }
                this.emit(id, "change", Value::Bool(on), cx);
            }))
            .into_any_element()
    }

    fn page(&self) -> Rgba {
        self.tree.page.unwrap_or(self.look.page())
    }

    /// One screen: its content in a vertical scroller.
    fn screen(&self, id: u32, root: bool, cx: &mut Context<Self>) -> AnyElement {
        let Some(node) = self.tree.get(id) else { return div().into_any_element() };
        let look = self.look;
        let mut column = div().flex().flex_col().w_full();
        // iOS: the root screen's large title scrolls with its content.
        if look == Look::Ios && root {
            column = column.child(
                div().px(px(20.)).pt(px(4.)).pb(px(4.)).text_size(px(34.)).font_weight(FontWeight::BOLD).child(node.title.clone()),
            );
        }
        let bottom = match look {
            Look::Ios => 110.,
            _ => 16.,
        };
        column = column.children(node.children.iter().map(|&child| self.node(child, cx))).child(div().h(px(bottom)));
        div()
            .id(ElementId::NamedInteger("screen".into(), id as u64))
            .size_full()
            .overflow_y_scroll()
            .restrict_scroll_to_axis()
            .bg(self.page())
            .child(column)
            .into_any_element()
    }

    fn stack(&self, stack: u32, width: f32, cx: &mut Context<Self>) -> AnyElement {
        let Some(node) = self.tree.get(stack) else { return div().into_any_element() };
        let look = self.look;
        let depth = node.children.len();
        let root = node.children.first().copied();
        let top = node.children.last().copied();

        // What is on screen: one screen, or two mid-transition / mid-swipe.
        let duration = look.duration().as_secs_f32();
        let pair = match (&self.swipe, self.stacks.get(&stack).and_then(|s| s.transition.as_ref())) {
            (Some(swipe), _) if swipe.stack == stack && depth > 1 => {
                Some((node.children[depth - 1], node.children[depth - 2], swipe.offset / width.max(1.)))
            }
            (_, Some(t)) => {
                let progress = look.ease(t.start.elapsed().as_secs_f32() / duration);
                Some((t.top, t.below, t.from + (t.to - t.from) * progress))
            }
            _ => None,
        };
        let mut area = div().id(ElementId::NamedInteger("stack".into(), stack as u64)).relative().flex_1().w_full().overflow_hidden();
        area = match pair {
            Some((top, below, reveal)) => {
                let (upper, lower) = look.layers(reveal, width);
                area.child(layer(self.screen(below, Some(below) == root, cx), lower, false))
                    .child(layer(self.screen(top, Some(top) == root, cx), upper, look == Look::Ios || look == Look::Linux))
            }
            None => match top {
                Some(top) => area.child(self.screen(top, Some(top) == root, cx)),
                None => area,
            },
        };
        let area = area.on_scroll_wheel(cx.listener(move |this, event: &ScrollWheelEvent, _, cx| this.swipe_event(stack, event, width, cx)));

        // The bar follows the screens: titles cross-fade, the back button fades with the depth.
        // An iOS root screen shows its large title in its content instead.
        let title = |id: u32| {
            let shown = look != Look::Ios || Some(id) != root;
            let text = self.tree.get(id).map(|n| SharedString::from(n.title.clone())).unwrap_or_default();
            (text, if shown { 1. } else { 0. })
        };
        let pushed = |id: u32| node.children.iter().position(|&c| c == id).is_none_or(|i| i > 0);
        let (titles, back) = match (pair, top) {
            (Some((top, below, reveal)), _) => {
                let ((upper, a), (lower, b)) = (title(top), title(below));
                (vec![(upper, a * (1. - reveal)), (lower, b * reveal)], (1. - reveal) + if pushed(below) { reveal } else { 0. })
            }
            (None, Some(top)) => (vec![title(top)], if depth > 1 { 1. } else { 0. }),
            (None, None) => (Vec::new(), 0.),
        };
        div().size_full().flex().flex_col().child(self.bar(stack, titles, back, depth > 1, cx)).child(area).into_any_element()
    }

    /// Titles stacked in one place, each at its own opacity; the first visible one sets the size.
    fn titles(&self, titles: &[(SharedString, f32)], centered: bool) -> Div {
        let mut wrap = div().relative().whitespace_nowrap();
        for (i, (text, opacity)) in titles.iter().filter(|(_, o)| *o > 0.01).enumerate() {
            let label = div().opacity(*opacity).child(text.clone());
            wrap = if i == 0 {
                wrap.child(label)
            } else if centered {
                wrap.child(div().absolute().top_0().left_0().right_0().flex().justify_center().child(label))
            } else {
                wrap.child(label.absolute().top_0().left_0())
            };
        }
        wrap
    }

    fn back_button(&self, stack: u32, enabled: bool, cx: &mut Context<Self>) -> gpui::Stateful<Div> {
        let look = self.look;
        let (icon, size, box_size, round) = match look {
            Look::Ios => ("chevron", 26., 44., 22.),
            Look::Android => ("arrow", 24., 48., 24.),
            Look::Macos => ("chevron", 20., 30., 6.),
            Look::Windows => ("arrow", 18., 36., 4.),
            Look::Linux => ("chevron", 18., 34., 6.),
        };
        let mut button = div()
            .id(ElementId::NamedInteger("back".into(), stack as u64))
            .size(px(box_size))
            .flex()
            .items_center()
            .justify_center()
            .rounded(px(round))
            .child(self.icon(icon, look.text(), size));
        if look == Look::Ios {
            button = button.bg(rgba(0xffffffe6)).shadow_md();
        }
        if !enabled {
            return button;
        }
        button
            .cursor_pointer()
            .hover(|s| s.bg(rgba(0x0000000d)))
            .active(|s| s.bg(rgba(0x0000001f)))
            .on_click(cx.listener(move |this, _, _, cx| {
                this.go_back(stack, 0., cx);
            }))
    }

    /// The navigation bar: back affordance and title, the platform's way.
    /// `back` runs 0 (root) to 1 (pushed) through a transition; `pushed` is where the stack is now.
    fn bar(&self, stack: u32, titles: Vec<(SharedString, f32)>, back: f32, pushed: bool, cx: &mut Context<Self>) -> AnyElement {
        let look = self.look;
        let shows_back = back > 0.01;
        let top = self.insets.0;
        match look {
            Look::Ios => div()
                .relative()
                .flex_shrink_0()
                .pt(px(top))
                .h(px(top + 52.))
                .bg(self.page())
                .when(shows_back, |d| {
                    d.child(div().absolute().left(px(16.)).top(px(top + 4.)).opacity(back).child(self.back_button(stack, true, cx)))
                })
                .child(
                    div()
                        .absolute()
                        .left(px(76.))
                        .right(px(76.))
                        .top(px(top + 14.))
                        .flex()
                        .justify_center()
                        .text_size(px(17.))
                        .font_weight(FontWeight::SEMIBOLD)
                        .child(self.titles(&titles, true)),
                )
                .into_any_element(),
            Look::Android => div()
                .flex_shrink_0()
                .pt(px(top))
                .h(px(top + 64.))
                .flex()
                .items_center()
                .gap(px(4.))
                .px(px(4.))
                .bg(self.page())
                .when(shows_back, |d| d.child(div().opacity(back).child(self.back_button(stack, true, cx))))
                .when(!shows_back, |d| d.pl(px(16.)))
                .child(self.titles(&titles, false).text_size(px(22.)))
                .into_any_element(),
            Look::Macos => div()
                .flex_shrink_0()
                .pt(px(top))
                .h(px(top + 52.))
                .flex()
                .items_center()
                .gap(px(8.))
                .px(px(12.))
                .border_b_1()
                .border_color(rgba(0x0000001a))
                .bg(white())
                .child(div().opacity(0.3 + 0.7 * back).child(self.back_button(stack, pushed, cx)))
                .child(self.titles(&titles, false).text_size(px(15.)).font_weight(FontWeight::BOLD))
                .into_any_element(),
            Look::Windows => div()
                .flex_shrink_0()
                .flex()
                .items_center()
                .gap(px(12.))
                .px(px(24.))
                .pt(px(top + 20.))
                .pb(px(8.))
                .bg(self.page())
                .when(shows_back, |d| d.child(div().opacity(back).child(self.back_button(stack, true, cx))))
                .child(self.titles(&titles, false).text_size(px(28.)).font_weight(FontWeight::SEMIBOLD))
                .into_any_element(),
            Look::Linux => div()
                .relative()
                .flex_shrink_0()
                .h(px(top + 47.))
                .bg(look.chrome())
                .border_b_1()
                .border_color(rgba(0x0000001f))
                .when(shows_back, |d| {
                    d.child(div().absolute().left(px(6.)).top(px(top + 6.5)).opacity(back).child(self.back_button(stack, true, cx)))
                })
                .child(
                    div()
                        .absolute()
                        .left(px(48.))
                        .right(px(48.))
                        .top(px(top + 14.))
                        .flex()
                        .justify_center()
                        .text_size(px(15.))
                        .font_weight(FontWeight::BOLD)
                        .child(self.titles(&titles, true)),
                )
                .into_any_element(),
        }
    }

    fn tabs(&self, tabs: u32, width: f32, cx: &mut Context<Self>) -> AnyElement {
        let Some(node) = self.tree.get(tabs) else { return div().into_any_element() };
        let look = self.look;
        let selected = node.selected.min(node.children.len().saturating_sub(1));
        let Some(&active) = node.children.get(selected) else { return div().into_any_element() };
        let stack_width = if look.sidebar() { width - look.sidebar_width() } else { width };
        let mut content = div().flex_1().size_full().child(self.stack(active, stack_width, cx));
        // Material fade through between tabs.
        if look == Look::Android
            && let Some(start) = self.tab_switch
        {
            content = content.opacity(look.ease(start.elapsed().as_secs_f32() / 0.21));
        }
        let items: Vec<(usize, gpui::SharedString, String)> = node
            .children
            .iter()
            .enumerate()
            .filter_map(|(i, &s)| self.tree.get(s).map(|n| (i, n.title.clone().into(), n.icon.clone())))
            .collect();
        let accent = look.accent();
        let item = |i: usize, cx: &mut Context<Self>| {
            div()
                .id(ElementId::NamedInteger("tab".into(), i as u64))
                .cursor_pointer()
                .on_click(cx.listener(move |this, _, _, cx| this.select_tab(tabs, i, cx)))
        };
        match look {
            Look::Ios => {
                let bar = div()
                    .absolute()
                    .bottom(px(self.insets.1.max(12.)))
                    .left(px(24.))
                    .right(px(24.))
                    .h(px(62.))
                    .p(px(4.))
                    .rounded(px(31.))
                    .bg(look.chrome())
                    .shadow_lg()
                    .flex()
                    .children(items.into_iter().map(|(i, title, icon)| {
                        let on = i == selected;
                        let tint = if on { accent } else { look.text() };
                        item(i, cx)
                            .flex_1()
                            .flex()
                            .flex_col()
                            .items_center()
                            .justify_center()
                            .gap(px(1.))
                            .rounded(px(27.))
                            .when(on, |d| d.bg(look.selection()))
                            .child(self.icon(&icon, tint, 24.))
                            .child(div().text_size(px(10.)).font_weight(FontWeight::SEMIBOLD).text_color(tint).child(title))
                    }));
                div().size_full().relative().child(content).child(bar).into_any_element()
            }
            Look::Android | Look::Linux => {
                let android = look == Look::Android;
                let bar = div()
                    .flex_shrink_0()
                    .h(px(if android { 80. } else { 56. } + self.insets.1))
                    .pb(px(self.insets.1))
                    .bg(look.chrome())
                    .when(!android, |d| d.border_t_1().border_color(rgba(0x0000001f)))
                    .flex()
                    .items_center()
                    .px(px(if android { 0. } else { 6. }))
                    .gap(px(if android { 0. } else { 6. }))
                    .children(items.into_iter().map(|(i, title, icon)| {
                        let on = i == selected;
                        let tint = if on { look.text() } else { look.secondary_text() };
                        let pill = div()
                            .w(px(if android { 64. } else { 40. }))
                            .h(px(32.))
                            .rounded(px(16.))
                            .flex()
                            .items_center()
                            .justify_center()
                            .when(on && android, |d| d.bg(look.selection()))
                            .child(self.icon(&icon, tint, if android { 24. } else { 18. }));
                        item(i, cx)
                            .flex_1()
                            .flex()
                            .flex_col()
                            .items_center()
                            .justify_center()
                            .gap(px(if android { 4. } else { 0. }))
                            .py(px(if android { 0. } else { 4. }))
                            .rounded(px(8.))
                            .when(on && !android, |d| d.bg(look.selection()))
                            .child(pill)
                            .child(
                                div()
                                    .text_size(px(12.))
                                    .font_weight(if on { FontWeight::BOLD } else { FontWeight::MEDIUM })
                                    .text_color(tint)
                                    .child(title),
                            )
                    }));
                div().size_full().flex().flex_col().child(content).child(bar).into_any_element()
            }
            Look::Macos | Look::Windows => {
                let mac = look == Look::Macos;
                let sidebar = div()
                    .flex_shrink_0()
                    .w(px(look.sidebar_width()))
                    .h_full()
                    .bg(look.chrome())
                    .border_r_1()
                    .border_color(rgba(0x00000014))
                    .flex()
                    .flex_col()
                    .gap(px(2.))
                    .px(px(10.))
                    .pt(px(self.insets.0 + if mac { 52. } else { 12. }))
                    .children(items.into_iter().map(|(i, title, icon)| {
                        let on = i == selected;
                        let (fg, icon_tint) = match (mac, on) {
                            (true, true) => (white().into(), white().into()),
                            (true, false) => (look.text(), accent),
                            (false, _) => (look.text(), look.text()),
                        };
                        item(i, cx)
                            .relative()
                            .h(px(if mac { 30. } else { 36. }))
                            .flex()
                            .items_center()
                            .gap(px(10.))
                            .px(px(10.))
                            .rounded(px(if mac { 6. } else { 4. }))
                            .when(on && mac, |d| d.bg(accent))
                            .when(on && !mac, |d| {
                                d.bg(look.selection()).child(
                                    div().absolute().left(px(0.)).top(px(10.)).w(px(3.)).h(px(16.)).rounded(px(2.)).bg(accent),
                                )
                            })
                            .when(!on, |d| d.hover(|s| s.bg(rgba(0x0000000a))))
                            .child(self.icon(&icon, icon_tint, if mac { 18. } else { 16. }))
                            .child(div().text_size(px(if mac { 13. } else { 14. })).text_color(fg).child(title))
                    }));
                div().size_full().flex().flex_row().child(sidebar).child(content).into_any_element()
            }
        }
    }
}

impl Render for Host {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        self.tick(window);
        let width = f32::from(window.viewport_size().width);
        let content = match self.tree.root_nav.and_then(|id| self.tree.get(id).map(|n| (id, n.kind))) {
            Some((id, Kind::Tabs)) => self.tabs(id, width, cx),
            Some((id, _)) => self.stack(id, width, cx),
            None => div()
                .id("body")
                .size_full()
                .overflow_y_scroll()
                .child(self.node(1, cx))
                .into_any_element(),
        };
        div()
            .size_full()
            .bg(self.page())
            .text_color(self.look.text())
            .text_size(px(15.))
            .key_context("NucloHost")
            .track_focus(&self.focus)
            .on_action(cx.listener(|this, _: &Back, _, cx| this.back(cx)))
            .on_mouse_down(MouseButton::Navigate(NavigationDirection::Back), cx.listener(|this, _, _, cx| this.back(cx)))
            .child(content)
    }
}

/// A screen placed for a transition: offset, faded, dimmed.
fn layer(screen: AnyElement, layer: Layer, edge_shadow: bool) -> Div {
    div()
        .absolute()
        .top_0()
        .bottom_0()
        .w_full()
        .left(px(layer.x))
        .opacity(layer.opacity)
        .when(edge_shadow, |d| d.shadow_xl())
        .child(screen)
        .when(layer.dim > 0., |d| d.child(div().absolute().inset_0().bg(gpui::black().opacity(layer.dim))))
}

/// Applies the inline style subset to any element.
fn style<E: Styled + ParentElement>(el: E, s: &Style) -> E {
    let mut el = el.flex_shrink_0().p(px(s.padding)).rounded(px(s.radius)).opacity(s.opacity);
    if s.grow > 0. {
        el = el.flex_grow(s.grow).flex_basis(px(0.));
    }
    if let Some(w) = s.width {
        el = el.w(px(w));
    }
    if let Some(h) = s.height {
        el = el.h(px(h));
    }
    if let Some(bg) = s.background {
        el = el.bg(bg);
    }
    if let Some(color) = s.color {
        el = el.text_color(color);
    }
    if let Some(size) = s.font_size {
        el = el.text_size(px(size));
    }
    if s.bold {
        el = el.font_weight(FontWeight::BOLD);
    }
    if s.center {
        el = el.text_center();
    }
    el
}

/// An Rgba as 0xRRGGBBAA, the icon cache key.
fn color_key(c: Rgba) -> u32 {
    let byte = |v: f32| (v.clamp(0., 1.) * 255.).round() as u32;
    byte(c.r) << 24 | byte(c.g) << 16 | byte(c.b) << 8 | byte(c.a)
}
