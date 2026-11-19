//! The node tree: one node per view (or a fragment: list/when/region/into, which owns no view),
//! its bindings, styles, lifecycle and events, and the runtime that updates the roots.
//! A port of `Node` and `Runtime` in the Android runtime (NucloRuntime.kt), minus the views.

use std::cell::{Cell, RefCell};
use std::collections::{HashMap, HashSet, VecDeque};
use std::ops::Deref;
use std::rc::{Rc, Weak};

use std::any::Any;

use super::backend::{backend, Event, Input, Kind as ViewKind, NativeView, Paint, PointerPhase, Rect, Shadow, TextPaint, ViewId};
pub use super::backend::{KeyboardEvent, PanEvent, PinchEvent, PointerEvent, ScrollEvent};
use super::flex;
use super::js::{js_now, Arr, Map};
use super::style::{
    global, global_stamp, px, tag_style, Animation, Color, Display, Easing, FontFamily, FontStyle, FontWeight, ObjectFit, Overflow, PointerEvents, Position, Style, StyleClass, TextAlign, TextDecoration, TextTransform,
};
use super::task;

// ---------------------------------------------------------------------------
// Types the generated code uses
// ---------------------------------------------------------------------------

pub type Content = Rc<dyn Fn() -> Vec<Mod>>;
pub type Cleanup = Rc<dyn Fn()>;
pub type Handler = Rc<dyn Fn(NativeEvent)>;

/// The native view behind a node, as `onMount` / `onDestroy` receive it.
#[derive(Clone, Copy)]
pub struct NativeElement(pub ViewId);

#[derive(Clone)]
pub struct InputTarget {
    pub value: String,
    pub checked: bool,
}

#[derive(Clone)]
pub struct NativeEvent {
    pub target: InputTarget,
}

/// What a select reports when an option is picked: the event's target holds the option's value.
pub fn select_event(value: impl AsRef<str>) -> NativeEvent {
    NativeEvent { target: InputTarget { value: value.as_ref().to_string(), checked: false } }
}

/// Anything a builder accepts: a child node, text, an attribute, a style class, a fragment.
#[derive(Clone)]
pub enum Mod {
    None,
    Node(Node),
    Class(StyleClass),
    Apply(Rc<dyn Fn(&Node)>),
}

impl Mod {
    pub(crate) fn apply(f: impl Fn(&Node) + 'static) -> Mod {
        Mod::Apply(Rc::new(f))
    }
}

impl From<Node> for Mod {
    fn from(node: Node) -> Mod {
        Mod::Node(node)
    }
}

impl From<StyleClass> for Mod {
    fn from(class: StyleClass) -> Mod {
        Mod::Class(class)
    }
}

impl<T: Into<Mod>> From<Option<T>> for Mod {
    fn from(value: Option<T>) -> Mod {
        value.map_or(Mod::None, Into::into)
    }
}

// ---------------------------------------------------------------------------
// Node
// ---------------------------------------------------------------------------

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub(crate) enum Kind {
    View(ViewKind),
    Fragment,
}

pub struct NodeData {
    pub(crate) kind: Kind,
    tag: &'static str,
    pub(crate) view: Option<ViewId>,
    parent: RefCell<Weak<NodeData>>,
    pub(crate) children: RefCell<Vec<Node>>,
    scopes: RefCell<Vec<String>>,

    /// Dynamic values, re-run by update().
    bindings: RefCell<Vec<Rc<dyn Fn()>>>,
    /// list/when/region: reconciles `children` before they refresh.
    reconcile: RefCell<Option<Rc<dyn Fn()>>>,
    teardown: RefCell<Vec<Box<dyn FnOnce()>>>,

    mount_callbacks: RefCell<Vec<Rc<dyn Fn(NativeElement) -> Option<Cleanup>>>>,
    destroy_callbacks: RefCell<Vec<Rc<dyn Fn(NativeElement)>>>,
    cleanups: RefCell<Vec<Cleanup>>,
    mounted: Cell<bool>,
    destroyed: Cell<bool>,

    text_parts: RefCell<Vec<Rc<dyn Fn() -> String>>>,
    last_text: RefCell<Option<String>>,

    pub(crate) classes: RefCell<Vec<Style>>,
    dynamic_class: RefCell<Option<Rc<dyn Fn() -> StyleClass>>>,
    inline: Cell<Style>,
    dynamic_inline: RefCell<Option<Rc<dyn Fn() -> Style>>>,
    pub(crate) computed: Cell<Style>,
    /// Changes whenever `computed` does (from RT.style_stamp).
    stamp: Cell<u64>,
    /// The last apply_style read only the static style (tag, classes, inline, inherited): refresh()
    /// skips it while the parent's stamp and the global styles are the ones it was computed against.
    static_from: Cell<Option<(u64, u64)>>,
    painted: Cell<Option<Style>>,
    disabled: Cell<bool>,

    /// The update pass this node was built in: its bindings already ran then.
    born: u64,

    listeners: RefCell<HashMap<Event, Handler>>,
    pointers: RefCell<HashMap<PointerPhase, Rc<dyn Fn(PointerEvent)>>>,
    pub(crate) on_pan: RefCell<Option<Rc<dyn Fn(PanEvent)>>>,
    /// nuclo-native-ns: "x", "y" or "both"; and this drag's phase: 0 none, 1 waiting for a direction, 2 the view's, 3 not.
    pub(crate) pan_axis: RefCell<String>,
    pub(crate) pan_phase: Cell<u8>,
    pub(crate) on_pinch: RefCell<Option<Rc<dyn Fn(PinchEvent)>>>,
    pub(crate) on_key: RefCell<Option<Rc<dyn Fn(KeyboardEvent)>>>,
    pub(crate) on_scroll: RefCell<Option<Rc<dyn Fn(ScrollEvent)>>>,
    /// The inputs the backend was already asked to report, as bits of `Input`.
    listening: Cell<u16>,
    href: RefCell<Option<String>>,
    pressed: Cell<bool>,
    hovered: Cell<bool>,
    focused: Cell<bool>,
    /// Set while the runtime writes a control, so it reports no event (as in the browser).
    writing: Cell<bool>,

    /// A box that scrolls its children (`overflow: "scroll"`), and whether along a row.
    scrolls: Cell<Option<bool>>,
    /// A native component's props, and whether one changed since its last `update`.
    native_props: RefCell<Option<Rc<dyn Any>>>,
    props_dirty: Cell<bool>,

    /// What the view was last painted with, and the transition towards it while one runs.
    look: Cell<Option<Paint>>,
    motion: RefCell<Option<Motion>>,
    /// The style's keyframes animation, from when it was given.
    keyframes: Cell<Option<Keyframes>>,
    /// A transition of `width` / `height`: the size layout uses while it runs, in px.
    shown_width: Cell<Option<f32>>,
    shown_height: Cell<Option<f32>>,

    /// A box's child views in order: its children's own, or their fragments' children's.
    pub(crate) items: RefCell<Vec<Node>>,
    /// The last measures, by `exact`: (layout epoch, max width, size). A leaf's stay good until
    /// its own text or style changes (they are cleared then); a box's for one epoch.
    memo: Cell<[Option<(u64, f32, [f32; 2])>; 2]>,
}

/// A built view: what a tag builder returns.
#[derive(Clone)]
pub struct Node(Rc<NodeData>);

impl Deref for Node {
    type Target = NodeData;
    fn deref(&self) -> &NodeData {
        &self.0
    }
}

impl PartialEq for Node {
    fn eq(&self, other: &Node) -> bool {
        Rc::ptr_eq(&self.0, &other.0)
    }
}

impl Node {
    fn new(kind: Kind, tag: &'static str) -> Node {
        let view = match kind {
            Kind::View(kind) => Some(backend().create(kind)),
            Kind::Fragment => None,
        };
        Node::with_view(kind, tag, view)
    }

    fn with_view(kind: Kind, tag: &'static str, view: Option<ViewId>) -> Node {
        let node = Node(Rc::new(NodeData {
            kind,
            tag,
            view,
            parent: RefCell::new(Weak::new()),
            children: RefCell::default(),
            scopes: RefCell::default(),
            bindings: RefCell::default(),
            reconcile: RefCell::default(),
            teardown: RefCell::default(),
            mount_callbacks: RefCell::default(),
            destroy_callbacks: RefCell::default(),
            cleanups: RefCell::default(),
            mounted: Cell::new(false),
            destroyed: Cell::new(false),
            text_parts: RefCell::default(),
            last_text: RefCell::default(),
            classes: RefCell::default(),
            dynamic_class: RefCell::default(),
            inline: Cell::default(),
            dynamic_inline: RefCell::default(),
            computed: Cell::default(),
            stamp: Cell::new(0),
            static_from: Cell::new(None),
            painted: Cell::new(None),
            disabled: Cell::new(false),
            born: RT.with(|rt| rt.generation.get()),
            listeners: RefCell::default(),
            pointers: RefCell::default(),
            on_pan: RefCell::default(),
            pan_axis: RefCell::new("both".into()),
            pan_phase: Cell::new(0),
            on_pinch: RefCell::default(),
            on_key: RefCell::default(),
            on_scroll: RefCell::default(),
            listening: Cell::new(0),
            href: RefCell::default(),
            pressed: Cell::new(false),
            hovered: Cell::new(false),
            focused: Cell::new(false),
            writing: Cell::new(false),
            scrolls: Cell::new(None),
            native_props: RefCell::default(),
            props_dirty: Cell::new(true),
            look: Cell::new(None),
            motion: RefCell::default(),
            keyframes: Cell::new(None),
            shown_width: Cell::new(None),
            shown_height: Cell::new(None),
            items: RefCell::default(),
            memo: Cell::new([None; 2]),
        }));
        if let Some(view) = view {
            RT.with(|rt| rt.views.borrow_mut().insert(view, Rc::downgrade(&node.0)));
        }
        node
    }

    fn fragment(tag: &'static str) -> Node {
        Node::new(Kind::Fragment, tag)
    }

    pub(crate) fn is(&self, kind: ViewKind) -> bool {
        self.kind == Kind::View(kind)
    }

    fn parent(&self) -> Option<Node> {
        self.parent.borrow().upgrade().map(Node)
    }

    fn set_parent(&self, parent: &Node) {
        *self.parent.borrow_mut() = Rc::downgrade(&parent.0);
    }

    fn append(&self, child: Node) {
        child.set_parent(self);
        self.children.borrow_mut().push(child);
    }

    fn add(&self, mods: Vec<Mod>) {
        for m in mods {
            match m {
                Mod::None => {}
                Mod::Node(child) => self.append(child),
                Mod::Class(class) => {
                    self.classes.borrow_mut().push(*class.0);
                    self.static_from.set(None);
                }
                Mod::Apply(apply) => apply(self),
            }
        }
    }

    /// This node's views in order: its own, or a fragment's children's.
    fn flat_views(&self, out: &mut Vec<Node>) {
        if self.view.is_some() {
            out.push(self.clone());
        } else {
            for child in self.children.borrow().iter() {
                child.flat_views(out);
            }
        }
    }

    /// Makes the nearest box's views match the tree.
    fn sync_views(&self) {
        if self.is(ViewKind::Box) {
            let mut items = Vec::new();
            for child in self.children.borrow().iter() {
                child.flat_views(&mut items);
            }
            let ids: Vec<ViewId> = items.iter().filter_map(|item| item.view).collect();
            backend().set_children(self.view.unwrap(), &ids);
            *self.items.borrow_mut() = items.clone();
            self.restack();
            invalidate_layout();
            // `first`, `last`, `odd`… follow the views' places, and `empty` whether there are any.
            for item in items.iter().filter(|item| item.computed.get().structural()) {
                item.apply_styles_deep();
            }
            if self.computed.get().empty.is_some() {
                self.apply_style();
            }
        } else if let Some(parent) = self.parent() {
            // A fragment (or a leaf): the views live in the nearest box above.
            parent.sync_views();
        }
    }

    /// zIndex: children are drawn (and hit) lowest first, in tree order among equals. Layout
    /// keeps the tree's order.
    fn restack(&self) {
        let items = self.items.borrow();
        if items.iter().all(|item| item.computed.get().z_index.is_none()) {
            return;
        }
        let mut order: Vec<&Node> = items.iter().collect();
        order.sort_by(|a, b| a.computed.get().z_index.unwrap_or(0.0).total_cmp(&b.computed.get().z_index.unwrap_or(0.0)));
        let ids: Vec<ViewId> = order.iter().filter_map(|item| item.view).collect();
        backend().reorder(self.view.unwrap(), &ids);
    }

    /// Called once the builder applied its arguments: a box that scrolls becomes a scroller, then gets its views.
    fn finish(&self) {
        if self.is(ViewKind::Box) {
            // `overflow: scroll` is read from the static styles: the scroller has to exist before the children arrive.
            let mut s = tag_style(self.tag);
            for class in self.classes.borrow().iter() {
                s = s.merged(class);
            }
            s = s.merged(&self.inline.get());
            if s.overflow == Some(Overflow::Scroll) {
                let horizontal = s.flex_direction == Some(super::style::FlexDirection::Row);
                backend().make_scrollable(self.view.unwrap(), horizontal);
                self.scrolls.set(Some(horizontal));
            }
        }
        self.sync_views();
    }

    // Bindings ---------------------------------------------------------------

    /// Runs `get` now and on each update; `set` only sees values that changed.
    pub(crate) fn bind<T: PartialEq + Clone + 'static>(&self, get: Rc<dyn Fn() -> T>, set: impl Fn(&T) + 'static) {
        let last: RefCell<Option<T>> = RefCell::new(None);
        let run = Rc::new(move || {
            let value = get();
            if forced() || last.borrow().as_ref() != Some(&value) {
                *last.borrow_mut() = Some(value.clone());
                set(&value);
            }
        });
        run();
        self.bindings.borrow_mut().push(run);
    }

    fn add_text(&self, part: Rc<dyn Fn() -> String>) {
        if self.is(ViewKind::Text) || self.is(ViewKind::Button) {
            if self.text_parts.borrow().is_empty() {
                let node = Rc::downgrade(&self.0);
                self.bindings.borrow_mut().push(Rc::new(move || {
                    if let Some(node) = node.upgrade() {
                        Node(node).render_text();
                    }
                }));
            }
            self.text_parts.borrow_mut().push(part);
            self.render_text();
        } else if self.is(ViewKind::Box) {
            let span = Node::new(Kind::View(ViewKind::Text), "span");
            span.add_text(part);
            self.append(span);
        }
    }

    fn render_text(&self) {
        let parts = self.text_parts.borrow().clone();
        let text: String = parts.iter().map(|part| part()).collect();
        if !forced() && self.last_text.borrow().as_deref() == Some(text.as_str()) {
            return;
        }
        let was_empty = self.last_text.borrow().as_deref().is_none_or(str::is_empty);
        *self.last_text.borrow_mut() = Some(text);
        self.show_text();
        if was_empty != self.is_empty() && self.computed.get().empty.is_some() {
            self.apply_style();
        }
    }

    /// Writes the text into the view, as `textTransform` shows it.
    fn show_text(&self) {
        let Some(text) = self.last_text.borrow().clone() else { return };
        let shown = match self.computed.get().text_transform.unwrap_or(TextTransform::None) {
            TextTransform::None => text,
            TextTransform::Uppercase => text.to_uppercase(),
            TextTransform::Lowercase => text.to_lowercase(),
            TextTransform::Capitalize => {
                let mut start = true;
                text.chars()
                    .flat_map(|c| {
                        let first = std::mem::replace(&mut start, c.is_whitespace());
                        if first { c.to_uppercase().collect::<Vec<_>>() } else { vec![c] }
                    })
                    .collect()
            }
        };
        backend().set_text(self.view.unwrap(), &shown);
        self.memo.set([None; 2]);
        invalidate_layout();
    }

    /// `:empty`: a box with no views, a text with no text.
    fn is_empty(&self) -> bool {
        if self.is(ViewKind::Box) { self.items.borrow().is_empty() } else { self.last_text.borrow().as_deref().is_none_or(str::is_empty) }
    }

    /// This view's index among the views of its container, and how many there are.
    fn sibling_place(&self) -> Option<(usize, usize)> {
        let host = self.host()?;
        let items = host.items.borrow();
        Some((items.iter().position(|item| item == self)?, items.len()))
    }

    // Refresh ----------------------------------------------------------------

    fn refresh(&self) {
        if self.destroyed.get() || self.born == RT.with(|rt| rt.generation.get()) {
            return;
        }
        let reconcile = self.reconcile.borrow().clone();
        if let Some(reconcile) = reconcile {
            reconcile();
        }
        let bindings = self.bindings.borrow().clone();
        for binding in bindings {
            binding();
        }
        let from = (self.parent().map_or(0, |p| p.stamp.get()), global_stamp());
        if forced() || self.static_from.get() != Some(from) {
            self.apply_style();
        }
        let children = self.children.borrow().clone();
        for child in children {
            child.refresh();
        }
    }

    fn apply_styles_deep(&self) {
        self.apply_style();
        let children = self.children.borrow().clone();
        for child in children {
            child.apply_styles_deep();
        }
    }

    fn apply_style(&self) {
        let parent_node = self.parent();
        let parent = parent_node.as_ref().map(|p| p.computed.get());
        let Some(view) = self.view else {
            self.computed.set(parent.unwrap_or_default());
            self.stamp.set(parent_node.map_or(0, |p| p.stamp.get()));
            return;
        };
        let from = (parent_node.map_or(0, |p| p.stamp.get()), global_stamp());
        // A root inherits the body's text style (globalStyle("body", …)).
        let base = parent.map_or_else(|| global("body").unwrap_or_default().inherited(), |p| p.inherited());
        let mut s = base.merged(&tag_style(self.tag));
        for class in self.classes.borrow().iter() {
            s = s.merged(class);
        }
        let dynamic_class = self.dynamic_class.borrow().clone();
        let dynamic = dynamic_class.is_some();
        if let Some(class) = dynamic_class {
            s = s.merged(&class().0);
        }
        s = s.merged(&self.inline.get());
        let dynamic_inline = self.dynamic_inline.borrow().clone();
        let dynamic = dynamic || dynamic_inline.is_some();
        if let Some(inline) = dynamic_inline {
            s = s.merged(&inline());
        }
        let only_static = !dynamic
            && s.media.is_none()
            && !s.structural()
            && s.empty.is_none()
            && s.checked.is_none()
            && s.placeholder_shown.is_none()
            && s.disabled.is_none()
            && s.enabled.is_none()
            && s.hover.is_none()
            && s.focused.is_none()
            && s.pressed.is_none();
        self.static_from.set(only_static.then_some(from));
        // `@media` and screens, against the window's width.
        if let Some(media) = s.media {
            let width = viewport_width();
            for rule in media.rules().iter().filter(|rule| rule.matches(width)) {
                s = s.merged(&rule.style);
            }
        }
        // The box's place among its siblings, and what it holds.
        if s.structural() {
            if let Some((index, count)) = self.sibling_place() {
                let place = [(s.first, index == 0), (s.last, index + 1 == count), (s.only, count == 1), (s.odd, index % 2 == 0), (s.even, index % 2 == 1)];
                for (state, holds) in place {
                    if let (Some(state), true) = (state, holds) {
                        s = s.merged(&state.get());
                    }
                }
            }
        }
        if let (Some(empty), true) = (s.empty, self.is_empty()) {
            s = s.merged(&empty.get());
        }
        if let (Some(checked), true) = (s.checked, self.is(ViewKind::Checkbox)) {
            if backend().control_state(view).1 {
                s = s.merged(&checked.get());
            }
        }
        if let (Some(shown), true) = (s.placeholder_shown, self.is(ViewKind::Input) || self.is(ViewKind::Textarea)) {
            if backend().control_state(view).0.is_empty() {
                s = s.merged(&shown.get());
            }
        }
        if let Some(state) = if self.disabled.get() { s.disabled } else { s.enabled } {
            s = s.merged(&state.get());
        }
        // The state styles, over everything else while the state holds.
        if let Some(hover) = s.hover {
            self.want(Input::Hover);
            if self.hovered.get() {
                s = s.merged(&hover.get());
            }
        }
        if let (Some(focused), true) = (s.focused, self.focused.get()) {
            s = s.merged(&focused.get());
        }
        if let Some(pressed) = s.pressed {
            self.want(Input::Pointer);
            if self.pressed.get() {
                s = s.merged(&pressed.get());
            }
        }
        // A screen without a background of its own shows the body's.
        if parent.is_none() && s.background_color.is_none() && !self.is_overlay() {
            s.background_color = global("body").and_then(|body| body.background_color);
        }
        if self.computed.get() != s {
            self.stamp.set(RT.with(|rt| {
                rt.style_stamp.set(rt.style_stamp.get() + 1);
                rt.style_stamp.get()
            }));
        }
        self.computed.set(s);
        let before = self.painted.get();
        if !forced() && before == Some(s) {
            return;
        }
        self.painted.set(Some(s));
        self.memo.set([None; 2]);
        if before.map_or(s.text_transform.is_some(), |before| before.text_transform != s.text_transform) {
            self.show_text();
        }
        self.paint(view, &s, before.as_ref());
        if before.and_then(|b| b.z_index) != s.z_index {
            if let Some(parent) = self.host() {
                parent.restack();
            }
        }
        invalidate_layout();
    }

    /// The nearest node with a view: where this node's views are.
    fn host(&self) -> Option<Node> {
        let mut node = self.parent();
        while let Some(n) = &node {
            if n.view.is_some() {
                break;
            }
            node = n.parent();
        }
        node
    }

    fn is_overlay(&self) -> bool {
        RT.with(|rt| rt.roots.borrow().iter().any(|root| root.overlay && root.node == *self))
    }

    /// Whether the pointer reaches this view: not under a box with `pointerEvents: "none"`.
    fn takes_pointer(&self, s: &Style) -> bool {
        s.pointer_events != Some(PointerEvents::None) && self.host().is_none_or(|host| host.look.get().is_none_or(|look| look.pointer))
    }

    /// Asks the backend, once, to report a kind of input for this view.
    fn want(&self, input: Input) {
        let bit = 1 << input as u16;
        if self.listening.get() & bit == 0 {
            self.listening.set(self.listening.get() | bit);
            if let Some(view) = self.view {
                backend().listen(view, input);
            }
        }
    }

    /// What a style looks like, resolved for the backend.
    fn look_of(&self, kind: ViewKind, s: &Style) -> Paint {
        let radius = px(s.border_radius.unwrap_or(0.0));
        let clips = matches!(s.overflow, Some(Overflow::Hidden | Overflow::Scroll));
        let shadow = (s.shadow_radius.is_some() || s.shadow_color.is_some()).then(|| Shadow {
            color: s.shadow_color.unwrap_or(Color(0x0000_0040)),
            blur: px(s.shadow_radius.unwrap_or(0.0)),
            dx: px(s.shadow_offset_x.unwrap_or(0.0)),
            dy: px(s.shadow_offset_y.unwrap_or(0.0)),
        });
        Paint {
            background: s.background_color,
            borders: s.borders(),
            border_colors: s.border_colors(),
            radius,
            clip: clips || (radius > 0.0 && kind == ViewKind::Image),
            shadow,
            opacity: s.opacity.unwrap_or(1.0) as f32 * if self.disabled.get() { 0.4 } else { 1.0 },
            visible: s.display != Some(Display::None),
            // An overlay box (absolute) takes the pointer over what is under it.
            blocks_pointer: kind == ViewKind::Box && s.position == Some(Position::Absolute),
            pointer: self.takes_pointer(s),
            fit: s.object_fit.unwrap_or(ObjectFit::Cover),
            translate: (px(s.translate_x.unwrap_or(0.0)), px(s.translate_y.unwrap_or(0.0))),
            rotate: s.rotate.unwrap_or(0.0) as f32,
            scale: s.scale.unwrap_or(1.0) as f32,
            text: TextPaint {
                font_size: px(s.font_size.unwrap_or(15.0)),
                weight: s.font_weight.unwrap_or(FontWeight::Normal),
                italic: s.font_style == Some(FontStyle::Italic),
                font_family: s.font_family.unwrap_or(FontFamily::SansSerif),
                line_height: Some(s.line_height_px()),
                letter_spacing: px(s.letter_spacing.unwrap_or(0.0)),
                decoration: s.text_decoration.unwrap_or(TextDecoration::None),
                color: s.color.unwrap_or(Color::BLACK),
                align: s.text_align.unwrap_or(TextAlign::Left),
                lines: s.number_of_lines.map(|lines| lines.max(1.0) as u32),
                placeholder: s.placeholder_color,
            },
            insets: s.insets(),
        }
    }

    /// Paints the style. Under a transition, what can move (opacity, transform, background,
    /// corners, and the node's own width and height) goes there over time; the first paint is at once.
    fn paint(&self, view: ViewId, s: &Style, before: Option<&Style>) {
        let Kind::View(kind) = self.kind else { return };
        let target = self.look_of(kind, s);
        let duration = if before.is_some() { s.transition_duration.unwrap_or(0.0) } else { 0.0 };
        let from = self.look.get();
        match (from, before) {
            (Some(from), Some(before)) if duration > 0.0 => {
                let (bw, bh) = (before.width.map(px), before.height.map(px));
                let (tw, th) = (s.width.map(px), s.height.map(px));
                let size = |from: Option<f32>, to: Option<f32>, shown: Option<f32>| match (from, to) {
                    (Some(from), Some(to)) if from != to => Some((shown.unwrap_or(from), to)),
                    _ => None,
                };
                let motion = Motion {
                    from,
                    to: target,
                    width: size(bw, tw, self.shown_width.get()),
                    height: size(bh, th, self.shown_height.get()),
                    start: js_now() + s.transition_delay.unwrap_or(0.0),
                    duration,
                    easing: s.transition_easing.unwrap_or(Easing::Ease),
                };
                if let Some((from, _)) = motion.width {
                    self.shown_width.set(Some(from));
                }
                if let Some((from, _)) = motion.height {
                    self.shown_height.set(Some(from));
                }
                // What does not animate (text, border, clipping) changes now.
                let now = motion.at(0.0);
                *self.motion.borrow_mut() = Some(motion);
                self.look.set(Some(now));
                backend().paint(view, kind, &now);
                animate(self);
            }
            _ => {
                self.motion.take();
                self.shown_width.set(None);
                self.shown_height.set(None);
                self.look.set(Some(target));
                backend().paint(view, kind, &target);
            }
        }
        // A keyframes animation starts when the style gets it (or another one), and paints over the style at once.
        if s.animation != self.keyframes.get().map(|k| k.animation) {
            self.keyframes.set(s.animation.map(|animation| Keyframes { animation, start: js_now() + animation.get().delay, done: false }));
        }
        if self.keyframe_step(kind, view, js_now()) {
            animate(self);
        }
    }

    /// Paints the keyframes animation as it is at `now`, over the style's look; false once it is over.
    fn keyframe_step(&self, kind: ViewKind, view: ViewId, now: f64) -> bool {
        let (Some(k), Some(s)) = (self.keyframes.get(), self.painted.get()) else { return false };
        if k.done {
            return false;
        }
        let anim = k.animation.get();
        let elapsed = now - k.start;
        if elapsed < 0.0 {
            return true;
        }
        let cycle = elapsed / anim.duration;
        if anim.duration <= 0.0 || anim.frames.is_empty() || (anim.iterations >= 0 && cycle >= anim.iterations as f64) {
            // Over: back to what the style shows, as CSS without a fill mode.
            self.keyframes.set(Some(Keyframes { done: true, ..k }));
            if let Some(look) = self.look.get() {
                backend().paint(view, kind, &look);
            }
            return false;
        }
        let mut t = cycle.fract();
        if anim.alternate && cycle as i64 % 2 == 1 {
            t = 1.0 - t;
        }
        // One timing function over the whole cycle, as the iOS runtime runs it.
        let t = ease(anim.easing, t as f32) as f64;
        let next = anim.frames.iter().position(|stop| stop.at >= t).unwrap_or(anim.frames.len() - 1).max(1);
        let (a, b) = (anim.frames[next - 1], anim.frames[next.min(anim.frames.len() - 1)]);
        let span = b.at - a.at;
        let local = if span > 0.0 { ((t - a.at) / span).clamp(0.0, 1.0) as f32 } else { 1.0 };
        let (from, to) = (self.look_of(kind, &s.merged(&a.style)), self.look_of(kind, &s.merged(&b.style)));
        let mut look = Motion { from, to, width: None, height: None, start: 0.0, duration: 0.0, easing: Easing::Linear }.at(local);
        look.text.color = mix_color(from.text.color, to.text.color, local);
        backend().paint(view, kind, &look);
        true
    }

    /// One frame of this node's transition; false once it is over.
    fn step(&self, now: f64) -> bool {
        let (Kind::View(kind), Some(view)) = (self.kind, self.view) else { return false };
        if self.destroyed.get() {
            return false;
        }
        let moving = self.step_motion(kind, view, now);
        // Keyframes paint over the transition.
        self.keyframe_step(kind, view, now) || moving
    }

    fn step_motion(&self, kind: ViewKind, view: ViewId, now: f64) -> bool {
        let Some(motion) = self.motion.borrow().clone() else { return false };
        let t = ((now - motion.start) / motion.duration).clamp(0.0, 1.0) as f32;
        let done = t >= 1.0;
        let eased = if done { 1.0 } else { ease(motion.easing, t) };
        let look = motion.at(eased);
        self.look.set(Some(look));
        backend().paint(view, kind, &look);
        if motion.width.is_some() || motion.height.is_some() {
            // Layout runs each frame with the size in between, so the boxes around follow.
            let between = |(from, to): (f32, f32)| (!done).then_some(from + (to - from) * eased);
            self.shown_width.set(motion.width.and_then(between));
            self.shown_height.set(motion.height.and_then(between));
            self.memo.set([None; 2]);
            invalidate_layout();
        }
        if done {
            self.motion.take();
        }
        !done
    }

    // Lifecycle --------------------------------------------------------------

    /// Runs onMount once the node is under a root that is on screen.
    fn mount_deep(&self) {
        if self.destroyed.get() {
            return;
        }
        if let (Some(view), false) = (self.view, self.mounted.get()) {
            self.mounted.set(true);
            let callbacks = self.mount_callbacks.borrow().clone();
            for callback in callbacks {
                if let Some(cleanup) = callback(NativeElement(view)) {
                    self.cleanups.borrow_mut().push(cleanup);
                }
            }
        }
        let children = self.children.borrow().clone();
        for child in children {
            child.mount_deep();
        }
    }

    /// Runs onDestroy and cleanups, children first, and releases the view.
    fn destroy(&self) {
        if self.destroyed.get() {
            return;
        }
        let children = self.children.borrow().clone();
        for child in children {
            child.destroy();
        }
        self.destroyed.set(true);
        for teardown in self.teardown.take() {
            teardown();
        }
        for cleanup in self.cleanups.take() {
            cleanup();
        }
        if let Some(view) = self.view {
            for callback in self.destroy_callbacks.take() {
                callback(NativeElement(view));
            }
            RT.with(|rt| rt.views.borrow_mut().remove(&view));
            backend().destroy(view);
        }
        // The closures may hold this node (or the app's state): drop them, so nothing keeps the tree alive.
        self.bindings.take();
        self.reconcile.take();
        self.mount_callbacks.take();
        self.text_parts.take();
        self.dynamic_class.take();
        self.dynamic_inline.take();
        self.listeners.take();
        self.pointers.take();
        self.on_pan.take();
        self.on_pinch.take();
        self.on_key.take();
        self.on_scroll.take();
        self.motion.take();
        self.keyframes.take();
        self.native_props.take();
        self.items.take();
    }

    // Events -----------------------------------------------------------------

    fn fire(&self, event: Event) {
        if self.writing.get() {
            return;
        }
        let handler = self.listeners.borrow().get(&event).cloned();
        if let (Some(handler), Some(view)) = (handler, self.view) {
            let (value, checked) = backend().control_state(view);
            handler(NativeEvent { target: InputTarget { value, checked } });
        }
    }

    fn listen(&self, event: Event, handler: Handler) {
        self.listeners.borrow_mut().insert(event, handler);
        if event == Event::Click {
            self.clickable();
        }
    }

    /// A click reaches every view but the controls that take it themselves.
    fn clickable(&self) {
        if !(self.is(ViewKind::Input) || self.is(ViewKind::Textarea) || self.is(ViewKind::Checkbox)) {
            self.want(Input::Click);
        }
    }

    /// A click: the app's handler, then a link's URL.
    fn click(&self) {
        self.fire(Event::Click);
        let href = self.href.borrow().clone();
        if let Some(url) = href {
            backend().open_url(&url);
        }
    }

    fn set_state(&self, state: &Cell<bool>, on: bool, style: impl Fn(&Style) -> bool) {
        if state.replace(on) != on && (style(&self.computed.get()) || self.painted.get().is_some_and(|s| style(&s))) {
            self.apply_style();
        }
    }

    /// Styles the view again if it was styled and `uses` says its style depends on what changed.
    fn restyle_if(&self, uses: impl Fn(&Style) -> bool) {
        if self.painted.get().is_some() && uses(&self.computed.get()) {
            self.apply_style();
        }
    }

    /// Writes a control without reporting it as user input.
    fn write(&self, block: impl FnOnce()) {
        self.writing.set(true);
        block();
        self.writing.set(false);
    }

    // Measuring --------------------------------------------------------------

    pub(crate) fn in_flow(&self) -> bool {
        let s = self.computed.get();
        s.position != Some(Position::Absolute) && s.display != Some(Display::None)
    }

    /// The border-box size this node takes when given at most `max_width` px: [width, height].
    /// `exact`: the width is decided (a flex share, a stretch), and only the height is asked.
    pub(crate) fn measure(&self, max_width: f32, exact: bool) -> [f32; 2] {
        let epoch = RT.with(|rt| rt.epoch.get());
        let mut memo = self.memo.get();
        if let Some((at, width, size)) = memo[exact as usize] {
            // Measuring text is the expensive part of a layout pass: only what changed is measured again.
            if width == max_width && (at == epoch || !self.is(ViewKind::Box)) {
                return size;
            }
        }
        let size = self.measure_now(max_width, exact);
        memo[exact as usize] = Some((epoch, max_width, size));
        self.memo.set(memo);
        size
    }

    fn measure_now(&self, max_width: f32, exact: bool) -> [f32; 2] {
        let s = self.computed.get();
        let mut width = self.shown_width.get().or(s.width.map(px)).or_else(|| s.width_pct.filter(|_| max_width < flex::UNBOUNDED).map(|pct| max_width * pct as f32 / 100.0));
        let mut height = self.shown_height.get().or(s.height.map(px));
        if exact && width.is_none() {
            width = Some(max_width);
        }
        if let Some(ratio) = s.aspect_ratio.map(|ratio| ratio as f32).filter(|ratio| *ratio > 0.0) {
            match (width, height) {
                (Some(w), None) => height = Some(w / ratio),
                (None, Some(h)) => width = Some(h * ratio),
                _ => {}
            }
        }
        let (min_w, max_w) = (s.min_width.map(px), s.max_width.map(px));
        width = width.map(|w| clamp(w, min_w, max_w));
        let available = width.or(max_w.map(|max| max.min(max_width))).unwrap_or(max_width);
        let (Kind::View(kind), Some(view)) = (self.kind, self.view) else { return [0.0, 0.0] };
        let [top, right, bottom, left] = s.insets();
        let content = |max: f32| backend().measure(view, (max - left - right).max(0.0));
        let mut size = match kind {
            ViewKind::Box => flex::layout(self, available, height, None, width.is_none()),
            ViewKind::Checkbox => {
                let (w, h) = backend().measure(view, flex::UNBOUNDED);
                [w, h]
            }
            ViewKind::Image => [available.min(px(120.0)), height.or(width).unwrap_or(px(120.0))],
            ViewKind::Input => [available.min(px(180.0)), content(available).1 + top + bottom],
            ViewKind::Text | ViewKind::Button | ViewKind::Textarea => {
                let (w, h) = content(available);
                [(w + left + right).min(available), h + top + bottom]
            }
            ViewKind::Native => {
                let (w, h) = backend().measure(view, available);
                [w.min(available), h]
            }
        };
        size[0] = width.unwrap_or_else(|| clamp(size[0], min_w, max_w));
        if let Some(height) = height {
            size[1] = height;
        }
        size[1] = clamp(size[1], s.min_height.map(px), s.max_height.map(px));
        size
    }

    /// Lays this box out in `width` × `height` and gives every view under it its frame.
    fn place(&self, width: f32, height: Option<f32>) {
        let mut frames = Vec::new();
        flex::layout(self, width, height, Some(&mut frames), false);
        let backend = backend();
        for (child, frame) in frames {
            // Rounded edges, not sizes, so neighbours meet exactly; a box lays its own children
            // out in its rounded size. Both as the Android runtime does.
            let (x, y) = (round(frame[0]), round(frame[1]));
            backend.set_frame(child.view.unwrap(), Rect { x, y, w: round(frame[0] + frame[2]) - x, h: round(frame[1] + frame[3]) - y });
            if child.scrolls.get().is_some() {
                child.place_scrolled(round(frame[2]) as f32, round(frame[3]) as f32);
            } else if child.is(ViewKind::Box) {
                child.place(round(frame[2]) as f32, Some(round(frame[3]) as f32));
            }
        }
    }

    /// Lays out a scrolling box's content in its `width` × `height` viewport: as long as it
    /// needs along its direction, and at least the viewport (as a screen is).
    fn place_scrolled(&self, width: f32, height: f32) {
        let view = self.view.unwrap();
        if self.scrolls.get() == Some(true) {
            let natural = flex::layout(self, flex::UNBOUNDED * 2.0, Some(height), None, false)[0];
            let fits = natural <= width;
            self.place(if fits { width } else { flex::UNBOUNDED * 2.0 }, Some(height));
            backend().set_content_size(view, round(natural.max(width)), round(height));
        } else {
            let natural = flex::layout(self, width, None, None, false)[1];
            self.place(width, (height > natural).then_some(height));
            backend().set_content_size(view, round(width), round(natural.max(height)));
        }
    }
}

fn round(value: f32) -> i32 {
    (value + 0.5).floor() as i32
}

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

/// A transition under way: from what the view showed when it started to its style's look.
#[derive(Clone)]
struct Motion {
    from: Paint,
    to: Paint,
    width: Option<(f32, f32)>,
    height: Option<(f32, f32)>,
    /// When it starts (after the delay), as `Date.now()` counts.
    start: f64,
    duration: f64,
    easing: Easing,
}

impl Motion {
    /// The look at eased progress `t`: what can move is in between, the rest is the target's.
    fn at(&self, t: f32) -> Paint {
        let mix = |a: f32, b: f32| a + (b - a) * t;
        let color = |a: Color, b: Color| mix_color(a, b, t);
        let (from, to) = (&self.from, &self.to);
        let clear = |paint: &Paint, other: &Paint| paint.background.unwrap_or(Color(other.background.map_or(0, |c| c.0 & !0xff)));
        Paint {
            background: (from.background.is_some() || to.background.is_some()).then(|| color(clear(from, to), clear(to, from))),
            radius: mix(from.radius, to.radius),
            opacity: mix(from.opacity, to.opacity),
            translate: (mix(from.translate.0, to.translate.0), mix(from.translate.1, to.translate.1)),
            rotate: mix(from.rotate, to.rotate),
            scale: mix(from.scale, to.scale),
            ..*to
        }
    }
}

fn mix_color(a: Color, b: Color, t: f32) -> Color {
    let (a, b) = (a.rgba(), b.rgba());
    let channel = |i: usize| (((a[i] + (b[i] - a[i]) * t).clamp(0.0, 1.0) * 255.0).round() as u32) << (24 - 8 * i as u32);
    Color(channel(0) | channel(1) | channel(2) | channel(3))
}

/// A keyframes animation on a view: `start` is when its first cycle begins (after the delay).
#[derive(Clone, Copy)]
struct Keyframes {
    animation: Animation,
    start: f64,
    done: bool,
}

/// A cubic Bézier timing function through (0,0), (x1,y1), (x2,y2), (1,1), as CSS defines them.
fn bezier(x1: f32, y1: f32, x2: f32, y2: f32, x: f32) -> f32 {
    let curve = |a: f32, b: f32, t: f32| 3.0 * a * t * (1.0 - t) * (1.0 - t) + 3.0 * b * t * t * (1.0 - t) + t * t * t;
    let (mut low, mut high) = (0.0f32, 1.0f32);
    for _ in 0..20 {
        let mid = (low + high) / 2.0;
        if curve(x1, x2, mid) < x {
            low = mid;
        } else {
            high = mid;
        }
    }
    curve(y1, y2, (low + high) / 2.0)
}

fn ease(easing: Easing, t: f32) -> f32 {
    match easing {
        Easing::Linear => t,
        Easing::Ease => bezier(0.25, 0.1, 0.25, 1.0, t),
        Easing::EaseIn => bezier(0.42, 0.0, 1.0, 1.0, t),
        Easing::EaseOut => bezier(0.0, 0.0, 0.58, 1.0, t),
        Easing::EaseInOut => bezier(0.42, 0.0, 0.58, 1.0, t),
        // Overshoots and settles, as the Android runtime's spring does (tension 1.6).
        Easing::Spring => {
            let t = t - 1.0;
            t * t * (2.6 * t + 1.6) + 1.0
        }
    }
}

/// Adds a node to the ones a frame callback moves, starting the callback if none is pending.
fn animate(node: &Node) {
    let start = RT.with(|rt| {
        let mut moving = rt.moving.borrow_mut();
        if !moving.iter().any(|other| other == node) {
            moving.push(node.clone());
        }
        !rt.ticking.replace(true)
    });
    if start {
        backend().request_frame(Box::new(tick));
    }
}

fn tick() {
    let now = js_now();
    let moving = RT.with(|rt| rt.moving.take());
    let still: Vec<Node> = moving.into_iter().filter(|node| node.step(now)).collect();
    let more = RT.with(|rt| {
        let mut moving = rt.moving.borrow_mut();
        // A step may have started other transitions.
        for node in still {
            if !moving.contains(&node) {
                moving.push(node);
            }
        }
        rt.ticking.set(!moving.is_empty());
        !moving.is_empty()
    });
    if more {
        backend().request_frame(Box::new(tick));
    }
    settle();
}

fn clamp(value: f32, low: Option<f32>, high: Option<f32>) -> f32 {
    let mut v = value;
    if let Some(high) = high {
        v = v.min(high);
    }
    if let Some(low) = low {
        v = v.max(low);
    }
    v
}

// ---------------------------------------------------------------------------
// Runtime
// ---------------------------------------------------------------------------

struct Root {
    node: Node,
    /// A layer over the app: laid out at exactly the window's size.
    overlay: bool,
    /// On screen (a router's hidden screens are not): onMount runs only then.
    attached: bool,
    /// A route's onEndReached, and what the screen's scrolling looks like.
    end: Option<Rc<EndReached>>,
}

struct EndReached {
    run: Rc<dyn Fn()>,
    /// How far the screen is scrolled, how much of it shows, and how tall its content is, in px.
    top: Cell<f32>,
    visible: Cell<f32>,
    content: Cell<f32>,
    /// The content's height when it last ran: once per height, and a new page makes it taller.
    fired: Cell<f32>,
}

impl EndReached {
    /// Runs it when the content's end is within half a screen of the visible bottom.
    fn check(self: &Rc<Self>) {
        let (top, visible, content) = (self.top.get(), self.visible.get(), self.content.get());
        if visible <= 0.0 || content <= 0.0 || content == self.fired.get() || content - (top + visible) > visible / 2.0 {
            return;
        }
        self.fired.set(content);
        // Not from inside the backend's layout pass or scroll handler: the app will change the tree.
        let run = self.run.clone();
        backend().set_timer(0, Box::new(move || {
            run();
            settle();
        }));
    }
}

#[derive(Default)]
struct Runtime {
    /// Counts update passes: a node built during one has already run its bindings.
    generation: Cell<u64>,
    /// Counts changes of some node's computed style (NodeData::stamp).
    style_stamp: Cell<u64>,
    /// Counts changes that can move a frame: measures are reused within one epoch.
    epoch: Cell<u64>,
    laid_out: Cell<u64>,
    roots: RefCell<Vec<Root>>,
    views: RefCell<HashMap<ViewId, Weak<NodeData>>>,
    has_main: Cell<bool>,
    updating: Cell<bool>,
    queued_all: Cell<bool>,
    queued_ids: RefCell<Vec<String>>,
    mount_pending: Cell<bool>,
    /// The nodes with a transition under way, and whether a frame callback is pending for them.
    moving: RefCell<Vec<Node>>,
    ticking: Cell<bool>,
    /// forceUpdate() is running: every binding applies its value, changed or not.
    forced: Cell<bool>,
    regions: RefCell<HashMap<String, Rc<RegionState>>>,
    waiting: RefCell<HashMap<String, Vec<Rc<IntoEntry>>>>,
    /// The window's width the styles were last matched against, once a style has `@media`.
    media_width: Cell<Option<f32>>,
    restyle_pending: Cell<bool>,
}

thread_local!(static RT: Runtime = Runtime::default());

fn forced() -> bool {
    RT.with(|rt| rt.forced.get())
}

/// The window's width, for `@media`. Styling with it means a resize styles again.
fn viewport_width() -> f64 {
    let width = backend().window_width();
    RT.with(|rt| rt.media_width.set(Some(width)));
    width as f64
}

/// The window's width changed under styles with `@media`: style every root again, soon (not
/// inside the backend's layout pass, which is where it is noticed).
fn restyle_for_width() {
    let stale = RT.with(|rt| rt.media_width.get().is_some_and(|width| width != backend().window_width()) && !rt.restyle_pending.replace(true));
    if !stale {
        return;
    }
    backend().set_timer(0, Box::new(|| {
        RT.with(|rt| rt.restyle_pending.set(false));
        let roots: Vec<Node> = RT.with(|rt| rt.roots.borrow().iter().map(|root| root.node.clone()).collect());
        for root in roots {
            root.apply_styles_deep();
        }
        settle();
    }));
}

fn invalidate_layout() {
    RT.with(|rt| rt.epoch.set(rt.epoch.get() + 1));
}

/// After anything that may have changed the tree: runs pending onMounts and asks for a layout.
pub(crate) fn settle() {
    if RT.with(|rt| rt.mount_pending.replace(false)) {
        let attached: Vec<Node> = RT.with(|rt| rt.roots.borrow().iter().filter(|r| r.attached).map(|r| r.node.clone()).collect());
        for node in attached {
            node.mount_deep();
        }
    }
    if RT.with(|rt| rt.laid_out.replace(rt.epoch.get()) != rt.epoch.get()) {
        backend().request_layout();
    }
}

pub(crate) fn add_root(node: &Node, overlay: bool, attached: bool) {
    RT.with(|rt| rt.roots.borrow_mut().push(Root { node: node.clone(), overlay, attached, end: None }));
    node.apply_styles_deep();
}

/// nuclo-native-ns: shows `node` in the platform's sheet; false where the backend has none.
pub fn native_sheet(node: Node, title: &str, detent: &str) -> bool {
    add_root(&node, false, true);
    let Some(view) = node.view else { return false };
    let gone = node.clone();
    if backend().native_sheet(view, title, detent, Box::new(move || remove_root(&gone))) {
        backend().request_layout();
        true
    } else {
        remove_root(&node);
        false
    }
}

pub(crate) fn remove_root(node: &Node) {
    RT.with(|rt| rt.roots.borrow_mut().retain(|root| root.node != *node));
    node.destroy();
}

/// A router screen came on screen or left it.
pub(crate) fn set_attached(node: &Node, attached: bool) {
    let end = RT.with(|rt| {
        rt.mount_pending.set(true);
        let mut roots = rt.roots.borrow_mut();
        let root = roots.iter_mut().find(|root| root.node == *node)?;
        root.attached = attached;
        root.end.clone().filter(|_| attached)
    });
    if let Some(end) = end {
        end.check();
    }
}

/// A route's onEndReached, for the screen `node` is the root of.
pub(crate) fn on_end_reached(node: &Node, run: Rc<dyn Fn()>) {
    let end = Rc::new(EndReached { run, top: Cell::new(0.0), visible: Cell::new(0.0), content: Cell::new(0.0), fired: Cell::new(-1.0) });
    RT.with(|rt| {
        if let Some(root) = rt.roots.borrow_mut().iter_mut().find(|root| root.node == *node) {
            root.end = Some(end);
        }
    });
}

/// The attached screen's onEndReached whose root is `view`.
fn end_of(view: ViewId) -> Option<Rc<EndReached>> {
    RT.with(|rt| rt.roots.borrow().iter().find(|root| root.attached && root.node.view == Some(view)).and_then(|root| root.end.clone()))
}

pub(crate) fn screen_scrolled(view: ViewId, top: f32, visible: f32) {
    if let Some(end) = end_of(view) {
        end.top.set(top);
        end.visible.set(visible);
        end.check();
    }
}

/// Re-runs every dynamic value, or only those inside `scope(id)` nodes for the given ids.
pub fn update(ids: &[&str]) {
    let done = RT.with(|rt| {
        if rt.updating.get() {
            if ids.is_empty() {
                rt.queued_all.set(true);
            } else {
                rt.queued_ids.borrow_mut().extend(ids.iter().map(|id| id.to_string()));
            }
            return true;
        }
        rt.updating.set(true);
        false
    });
    if done {
        return;
    }
    run(ids);
    loop {
        let all = RT.with(|rt| rt.queued_all.replace(false));
        let queued = RT.with(|rt| rt.queued_ids.take());
        if !all && queued.is_empty() {
            break;
        }
        let next: Vec<&str> = if all { Vec::new() } else { queued.iter().map(String::as_str).collect() };
        run(&next);
    }
    RT.with(|rt| rt.updating.set(false));
    settle();
}

/// Re-runs every dynamic value and applies each one, whether or not it changed.
pub fn force_update() {
    RT.with(|rt| rt.forced.set(true));
    update(&[]);
    RT.with(|rt| rt.forced.set(false));
}

fn run(ids: &[&str]) {
    RT.with(|rt| rt.generation.set(rt.generation.get() + 1));
    let roots: Vec<Node> = RT.with(|rt| rt.roots.borrow().iter().map(|root| root.node.clone()).collect());
    if ids.is_empty() {
        for node in roots {
            node.refresh();
        }
        return;
    }
    fn visit(node: &Node, wanted: &HashSet<&str>, found: &mut Vec<Node>) {
        if node.scopes.borrow().iter().any(|scope| wanted.contains(scope.as_str())) {
            found.push(node.clone());
        } else {
            for child in node.children.borrow().iter() {
                visit(child, wanted, found);
            }
        }
    }
    let wanted: HashSet<&str> = ids.iter().copied().collect();
    let mut found = Vec::new();
    for node in &roots {
        visit(node, &wanted, &mut found);
    }
    for node in found {
        node.refresh();
    }
}

fn node_of(view: ViewId) -> Option<Node> {
    RT.with(|rt| rt.views.borrow().get(&view).and_then(Weak::upgrade)).map(Node)
}

pub(crate) fn measure_root(view: ViewId, width: f32) -> f32 {
    node_of(view).map_or(0.0, |node| flex::layout(&node, width, None, None, false)[1])
}

/// Whether the screen of `view` scrolls itself: its root is a scroller, or has a vertical one as a child (a
/// chat's thread over a fixed composer). The page around it does not scroll then.
pub(crate) fn scrolls_itself(view: ViewId) -> bool {
    node_of(view).is_some_and(|node| {
        let mut children = Vec::new();
        for child in node.children.borrow().iter() {
            child.flat_views(&mut children);
        }
        node.scrolls.get().is_some() || children.iter().any(|c| c.scrolls.get() == Some(false))
    })
}

pub(crate) fn layout_root(view: ViewId, width: f32, height: f32) {
    let Some(node) = node_of(view) else { return };
    if node.scrolls.get().is_some() {
        node.place_scrolled(width, height);
    } else if scrolls_itself(view) {
        // Exactly the window: its scroller takes what the fixed parts leave.
        node.place(width, Some(height));
    } else {
        let overlay = node.is_overlay();
        // A screen is as tall as its content, or the window when that is taller (then a column's
        // free space is shared out). An overlay is exactly the window.
        let content = flex::layout(&node, width, None, None, false)[1];
        node.place(width, (overlay || height > content).then_some(height));
        // A short page asks for more without being scrolled.
        if let Some(end) = end_of(view) {
            end.content.set(content);
            end.check();
        }
    }
    RT.with(|rt| rt.laid_out.set(rt.epoch.get()));
    restyle_for_width();
}

pub(crate) fn dispatch(view: ViewId, event: Event) {
    let Some(node) = node_of(view) else { return };
    match event {
        Event::Input if node.is(ViewKind::Textarea) => {
            // What the user typed may have changed the field's height.
            node.memo.set([None; 2]);
            invalidate_layout();
        }
        Event::Focus | Event::Blur => node.set_state(&node.focused, event == Event::Focus, |s| s.focused.is_some()),
        _ => {}
    }
    // States that follow what the user did to the control.
    let s = node.computed.get();
    if (event == Event::Input && s.placeholder_shown.is_some()) || (event == Event::Change && s.checked.is_some()) {
        node.apply_style();
    }
    if event == Event::Click {
        node.click();
    } else {
        node.fire(event);
    }
    settle();
}

pub(crate) fn pointer(view: ViewId, phase: PointerPhase, pointer: PointerEvent) {
    let Some(node) = node_of(view) else { return };
    match phase {
        PointerPhase::Down => node.set_state(&node.pressed, true, |s| s.pressed.is_some()),
        PointerPhase::Up | PointerPhase::Cancel => node.set_state(&node.pressed, false, |s| s.pressed.is_some()),
        _ => {}
    }
    let handler = node.pointers.borrow().get(&phase).cloned();
    if let Some(handler) = handler {
        handler(pointer);
    }
    settle();
}

/// Runs the handler a node has for a kind of input.
/// A pan, through the view's axis: a one-axis view takes the drag once it moves along its axis, or never.
pub(crate) fn pan(view: ViewId, event: PanEvent) {
    let Some(node) = node_of(view) else { return };
    let axis = node.pan_axis.borrow().clone();
    let phase = node.pan_phase.get();
    let done = event.state == "end" || event.state == "cancel";
    let deliver_now = match (axis.as_str(), phase, event.state.as_str()) {
        ("both", _, _) => true,
        (_, _, "start") => { node.pan_phase.set(1); false }
        (_, 1, _) if !done => {
            let (ax, ay) = (event.translation_x.abs(), event.translation_y.abs());
            if ax.max(ay) < 4.0 {
                false
            } else if (axis == "x") == (ax > ay) {
                node.pan_phase.set(2);
                let mut start = event.clone();
                start.state = "start".into();
                deliver(view, |n| n.on_pan.borrow().clone(), start);
                true
            } else {
                node.pan_phase.set(3);
                false
            }
        }
        (_, 2, _) => true,
        _ => false,
    };
    if done {
        node.pan_phase.set(0);
    }
    if deliver_now {
        if done && axis != "both" && phase != 2 { return }
        deliver(view, |n| n.on_pan.borrow().clone(), event);
    }
}

pub(crate) fn deliver<E>(view: ViewId, handler: impl Fn(&Node) -> Option<Rc<dyn Fn(E)>>, event: E) {
    let Some(node) = node_of(view) else { return };
    if let Some(handler) = handler(&node) {
        handler(event);
    }
    settle();
}

pub(crate) fn hover(view: ViewId, over: bool) {
    if let Some(node) = node_of(view) {
        node.set_state(&node.hovered, over, |s| s.hover.is_some());
        settle();
    }
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

fn build(kind: ViewKind, tag: &'static str, mods: Vec<Mod>) -> Node {
    let node = Node::new(Kind::View(kind), tag);
    node.add(mods);
    node.finish();
    node
}

macro_rules! builders {
    ($kind:ident: $($name:ident)*) => {
        $(pub fn $name(mods: Vec<Mod>) -> Node {
            build(ViewKind::$kind, stringify!($name), mods)
        })*
    };
}

builders!(Box: div section header footer main nav article aside form ul li);
builders!(Text: span p h1 h2 h3 h4 label strong small em);
builders!(Button: button);
builders!(Textarea: textarea);
builders!(Image: img);

/// Any other tag, by name: a text or a box, with the tag's default style.
pub fn el(tag: &str, mods: Vec<Mod>) -> Node {
    const TEXT: &[&str] = &[
        "h5", "h6", "b", "i", "u", "s", "del", "ins", "mark", "code", "pre", "kbd", "samp", "var", "abbr", "cite", "q", "dfn", "sub", "sup", "time", "legend", "caption",
        "figcaption", "summary", "dt", "dd", "a", "bdi", "bdo", "data", "output", "rt", "rp", "ruby",
    ];
    const BOXES: &[&str] = &["th", "td", "tr", "hr", "head", "base", "link", "meta", "script", "style", "title", "template", "noscript", "datalist", "area", "source", "track", "wbr", "br", "progress", "meter", "select"];
    match (TEXT.iter().find(|name| **name == tag), BOXES.iter().find(|name| **name == tag)) {
        (Some(name), _) => build(ViewKind::Text, name, mods),
        // The tag only matters for its default style: the boxes that have one keep their name.
        (_, name) => build(ViewKind::Box, name.copied().unwrap_or("div"), mods),
    }
}

/// A view written for the platform, used from the app as `native<P>("Name")`: a type `Name` in
/// the app's `native/linux/` implements this for the props struct the compiler generated from `P`.
pub trait NativeComponent<P> {
    /// The platform's view: for the GTK backend, a `gtk::Widget` (`gtk_backend::native`).
    fn create(&mut self) -> NativeView;
    /// Runs after `create`, and whenever a dynamic prop changed.
    fn update(&mut self, view: &NativeView, props: &Rc<P>);
    fn destroy(&mut self, _view: &NativeView) {}
}

/// A platform view as a node: `component` makes it, and gets `props` again whenever a dynamic prop changed.
pub fn native_view<P: 'static>(component: impl NativeComponent<P> + 'static, props: Rc<P>, mods: Vec<Mod>) -> Node {
    let component = Rc::new(RefCell::new(component));
    let native = component.borrow_mut().create();
    let node = Node::with_view(Kind::View(ViewKind::Native), "native", Some(backend().adopt(native.clone())));
    *node.native_props.borrow_mut() = Some(props.clone());
    node.add(mods);
    let target = Rc::downgrade(&node.0);
    let flush = {
        let (component, native) = (component.clone(), native.clone());
        Rc::new(move || {
            if target.upgrade().is_some_and(|node| node.props_dirty.replace(false)) {
                component.borrow_mut().update(&native, &props);
            }
        })
    };
    flush();
    node.bindings.borrow_mut().push(flush);
    node.destroy_callbacks.borrow_mut().push(Rc::new(move |_| component.borrow_mut().destroy(&native)));
    node
}

pub fn input(mods: Vec<Mod>) -> Node {
    build(ViewKind::Input, "input", mods)
}

pub fn checkbox(mods: Vec<Mod>) -> Node {
    build(ViewKind::Checkbox, "input", mods)
}

/// Attributes, the `{ … }` object of a nuclo builder call. A `_fn` variant takes the
/// `() => value` form, which update() runs again.
pub struct A;

fn constant<T: Clone + 'static>(value: T) -> Rc<dyn Fn() -> T> {
    Rc::new(move || value.clone())
}

impl A {
    pub fn text(value: &str) -> Mod {
        A::text_fn(constant(value.to_string()))
    }
    pub fn text_fn(value: Rc<dyn Fn() -> String>) -> Mod {
        Mod::apply(move |node| node.add_text(value.clone()))
    }

    pub fn style(value: Style) -> Mod {
        Mod::apply(move |node| {
            node.inline.set(node.inline.get().merged(&value));
            node.static_from.set(None);
        })
    }
    pub fn style_fn(value: Rc<dyn Fn() -> Style>) -> Mod {
        Mod::apply(move |node| *node.dynamic_inline.borrow_mut() = Some(value.clone()))
    }
    pub fn class_name(value: StyleClass) -> Mod {
        Mod::Class(value)
    }
    pub fn class_name_fn(value: Rc<dyn Fn() -> StyleClass>) -> Mod {
        Mod::apply(move |node| *node.dynamic_class.borrow_mut() = Some(value.clone()))
    }

    pub fn value(text: &str) -> Mod {
        A::value_fn(constant(text.to_string()))
    }
    pub fn value_fn(value: Rc<dyn Fn() -> String>) -> Mod {
        Mod::apply(move |node| {
            let view = node.view.unwrap();
            let target = Rc::downgrade(&node.0);
            node.bind(value.clone(), move |text: &String| {
                // Never reset what the user is typing to the same text (the caret would jump).
                if let Some(node) = target.upgrade().map(Node) {
                    if backend().control_state(view).0 != *text {
                        node.write(|| backend().set_value(view, text));
                        node.restyle_if(|s| s.placeholder_shown.is_some());
                    }
                }
            });
        })
    }

    pub fn placeholder(value: &str) -> Mod {
        A::placeholder_fn(constant(value.to_string()))
    }
    pub fn placeholder_fn(value: Rc<dyn Fn() -> String>) -> Mod {
        Mod::apply(move |node| {
            let view = node.view.unwrap();
            node.bind(value.clone(), move |text: &String| backend().set_placeholder(view, text));
        })
    }

    pub fn src(value: &str) -> Mod {
        A::src_fn(constant(value.to_string()))
    }
    pub fn src_fn(value: Rc<dyn Fn() -> String>) -> Mod {
        Mod::apply(move |node| {
            let target = Rc::downgrade(&node.0);
            let view = node.view.unwrap();
            let shown = Rc::new(RefCell::new(String::new()));
            node.bind(value.clone(), move |url: &String| {
                *shown.borrow_mut() = url.clone();
                if backend().set_image_url(view, url) {
                    return;
                }
                let target = target.clone();
                let shown = shown.clone();
                let wanted = url.clone();
                task::download_cached(url.clone(), move |bytes| {
                    if let (Some(node), Some(bytes)) = (target.upgrade(), bytes) {
                        if !node.destroyed.get() && *shown.borrow() == wanted {
                            backend().set_image(node.view.unwrap(), &bytes);
                        }
                    }
                });
            });
        })
    }

    pub fn checked(value: bool) -> Mod {
        A::checked_fn(constant(value))
    }
    pub fn checked_fn(value: Rc<dyn Fn() -> bool>) -> Mod {
        Mod::apply(move |node| {
            let view = node.view.unwrap();
            let target = Rc::downgrade(&node.0);
            node.bind(value.clone(), move |on: &bool| {
                if let Some(node) = target.upgrade().map(Node) {
                    if backend().control_state(view).1 != *on {
                        node.write(|| backend().set_checked(view, *on));
                        node.restyle_if(|s| s.checked.is_some());
                    }
                }
            });
        })
    }

    pub fn disabled(value: bool) -> Mod {
        A::disabled_fn(constant(value))
    }
    pub fn disabled_fn(value: Rc<dyn Fn() -> bool>) -> Mod {
        Mod::apply(move |node| {
            let view = node.view.unwrap();
            let target = Rc::downgrade(&node.0);
            node.bind(value.clone(), move |off: &bool| {
                let Some(node) = target.upgrade().map(Node) else { return };
                backend().set_enabled(view, !off);
                node.disabled.set(*off);
                node.restyle_if(|s| s.disabled.is_some() || s.enabled.is_some());
                // A disabled view is dimmed: paint again with the style it has.
                if let Some(style) = node.painted.get() {
                    node.paint(view, &style, None);
                }
            });
        })
    }

    pub fn input_type(input_type: &str) -> Mod {
        let input_type = input_type.to_string();
        Mod::apply(move |node| backend().set_input_type(node.view.unwrap(), &input_type))
    }

    pub fn href(value: &str) -> Mod {
        A::href_fn(constant(value.to_string()))
    }
    /// The URL the platform opens when the view is clicked.
    pub fn href_fn(value: Rc<dyn Fn() -> String>) -> Mod {
        Mod::apply(move |node| {
            let target = Rc::downgrade(&node.0);
            node.bind(value.clone(), move |url: &String| {
                if let Some(node) = target.upgrade() {
                    *node.href.borrow_mut() = Some(url.clone());
                }
            });
            node.clickable();
        })
    }

    pub fn aria_label(value: &str) -> Mod {
        A::aria_label_fn(constant(value.to_string()))
    }
    pub fn aria_label_fn(value: Rc<dyn Fn() -> String>) -> Mod {
        Mod::apply(move |node| {
            let view = node.view.unwrap();
            node.bind(value.clone(), move |label: &String| backend().set_label(view, label));
        })
    }

    /// A dynamic prop of a native component: `set` writes it into the node's props when it changed.
    pub fn prop<P: 'static, T: PartialEq + Clone + 'static>(get: Rc<dyn Fn() -> T>, set: Rc<dyn Fn(Rc<P>, T)>) -> Mod {
        Mod::apply(move |node| {
            let target = Rc::downgrade(&node.0);
            let set = set.clone();
            node.bind(get.clone(), move |value: &T| {
                let Some(node) = target.upgrade() else { return };
                let props = node.native_props.borrow().clone().and_then(|props| props.downcast::<P>().ok());
                if let Some(props) = props {
                    set(props, value.clone());
                    node.props_dirty.set(true);
                }
            });
        })
    }

    pub fn on_focus(handler: Handler) -> Mod {
        Mod::apply(move |node| node.listen(Event::Focus, handler.clone()))
    }
    pub fn on_blur(handler: Handler) -> Mod {
        Mod::apply(move |node| node.listen(Event::Blur, handler.clone()))
    }
    pub fn on_key_down(handler: Rc<dyn Fn(KeyboardEvent)>) -> Mod {
        Mod::apply(move |node| {
            *node.on_key.borrow_mut() = Some(handler.clone());
            node.want(Input::Keys);
        })
    }
    fn on_pointer(phase: PointerPhase, input: Input, handler: Rc<dyn Fn(PointerEvent)>) -> Mod {
        Mod::apply(move |node| {
            node.pointers.borrow_mut().insert(phase, handler.clone());
            node.want(input);
        })
    }
    pub fn on_pointer_down(handler: Rc<dyn Fn(PointerEvent)>) -> Mod {
        A::on_pointer(PointerPhase::Down, Input::Pointer, handler)
    }
    pub fn on_pointer_move(handler: Rc<dyn Fn(PointerEvent)>) -> Mod {
        A::on_pointer(PointerPhase::Move, Input::Pointer, handler)
    }
    pub fn on_pointer_up(handler: Rc<dyn Fn(PointerEvent)>) -> Mod {
        A::on_pointer(PointerPhase::Up, Input::Pointer, handler)
    }
    pub fn on_pointer_cancel(handler: Rc<dyn Fn(PointerEvent)>) -> Mod {
        A::on_pointer(PointerPhase::Cancel, Input::Pointer, handler)
    }
    pub fn on_long_press(handler: Rc<dyn Fn(PointerEvent)>) -> Mod {
        A::on_pointer(PointerPhase::LongPress, Input::LongPress, handler)
    }
    pub fn on_double_click(handler: Rc<dyn Fn(PointerEvent)>) -> Mod {
        A::on_pointer(PointerPhase::DoubleClick, Input::DoubleClick, handler)
    }
    pub fn on_pan(handler: Rc<dyn Fn(PanEvent)>) -> Mod {
        Mod::apply(move |node| {
            *node.on_pan.borrow_mut() = Some(handler.clone());
            node.want(Input::Pan);
        })
    }
    /// "x" or "y": the pan starts only along that axis (a drag along the other is not the view's).
    pub fn pan_axis(axis: &str) -> Mod {
        let axis = axis.to_string();
        Mod::apply(move |node| *node.pan_axis.borrow_mut() = axis.clone())
    }
    pub fn on_pinch(handler: Rc<dyn Fn(PinchEvent)>) -> Mod {
        Mod::apply(move |node| {
            *node.on_pinch.borrow_mut() = Some(handler.clone());
            node.want(Input::Pinch);
        })
    }
    pub fn on_scroll(handler: Rc<dyn Fn(ScrollEvent)>) -> Mod {
        Mod::apply(move |node| {
            *node.on_scroll.borrow_mut() = Some(handler.clone());
            node.want(Input::Scroll);
        })
    }

    pub fn on_click(handler: Handler) -> Mod {
        Mod::apply(move |node| node.listen(Event::Click, handler.clone()))
    }
    pub fn on_input(handler: Handler) -> Mod {
        Mod::apply(move |node| node.listen(Event::Input, handler.clone()))
    }
    pub fn on_change(handler: Handler) -> Mod {
        Mod::apply(move |node| node.listen(Event::Change, handler.clone()))
    }

    pub fn on_mount(handler: Rc<dyn Fn(NativeElement) -> Option<Cleanup>>) -> Mod {
        Mod::apply(move |node| {
            node.mount_callbacks.borrow_mut().push(handler.clone());
            RT.with(|rt| rt.mount_pending.set(true));
        })
    }

    pub fn on_destroy(handler: Rc<dyn Fn(NativeElement)>) -> Mod {
        Mod::apply(move |node| node.destroy_callbacks.borrow_mut().push(handler.clone()))
    }
}

// ---------------------------------------------------------------------------
// update(), scope(), render()
// ---------------------------------------------------------------------------

pub fn scope(ids: &[&str]) -> Mod {
    let ids: Vec<String> = ids.iter().map(|id| id.to_string()).collect();
    Mod::apply(move |node| node.scopes.borrow_mut().extend(ids.iter().cloned()))
}

/// Shows a view. The first call is the app; each later call is a layer over it.
pub fn render(view: Rc<dyn Fn() -> Node>) {
    let node = view();
    let overlay = RT.with(|rt| rt.has_main.replace(true));
    add_root(&node, overlay, true);
    RT.with(|rt| rt.mount_pending.set(true));
    if overlay {
        backend().show_overlay(node.view.unwrap());
    } else {
        backend().show_screen(node.view.unwrap());
    }
    settle();
}

pub(crate) fn claim_main() {
    RT.with(|rt| rt.has_main.set(true));
}

// ---------------------------------------------------------------------------
// list()
// ---------------------------------------------------------------------------

/// What list() matches rows by: identity for interfaces and arrays, value for strings and numbers.
#[derive(PartialEq, Eq, Hash, Clone)]
pub enum Key {
    Identity(usize),
    Int(i64),
    Bits(u64),
    Text(String),
    Flag(bool),
    Nothing,
}

pub trait ListKey {
    fn list_key(&self) -> Key;
}

impl<T> ListKey for Rc<T> {
    fn list_key(&self) -> Key {
        Key::Identity(Rc::as_ptr(self) as *const () as usize)
    }
}
impl<T: Clone> ListKey for Arr<T> {
    fn list_key(&self) -> Key {
        Key::Identity(self.addr())
    }
}
impl ListKey for i64 {
    fn list_key(&self) -> Key {
        Key::Int(*self)
    }
}
impl ListKey for f64 {
    fn list_key(&self) -> Key {
        Key::Bits(self.to_bits())
    }
}
impl ListKey for String {
    fn list_key(&self) -> Key {
        Key::Text(self.clone())
    }
}
impl ListKey for bool {
    fn list_key(&self) -> Key {
        Key::Flag(*self)
    }
}
impl<T: ListKey> ListKey for Option<T> {
    fn list_key(&self) -> Key {
        self.as_ref().map_or(Key::Nothing, ListKey::list_key)
    }
}

/// Rows keyed by identity: a row is rebuilt only when its item is new.
pub fn list<T: ListKey + Clone + 'static>(items: Rc<dyn Fn() -> Arr<T>>, render: Rc<dyn Fn(T, i64) -> Option<Node>>) -> Mod {
    Mod::apply(move |parent| {
        let fragment = Node::fragment("list");
        parent.append(fragment.clone());
        let (items, render) = (items.clone(), render.clone());
        let target = Rc::downgrade(&fragment.0);
        // Each row keeps its item: an identity key stays unique for as long as the row lives.
        let rows: RefCell<Vec<(T, Key, Option<Node>)>> = RefCell::default();
        let reconcile: Rc<dyn Fn()> = Rc::new(move || {
            let Some(fragment) = target.upgrade().map(Node) else { return };
            let next = items().to_vec();
            let old = rows.take();
            let mut by_key: HashMap<Key, VecDeque<usize>> = HashMap::with_capacity(old.len());
            for (i, row) in old.iter().enumerate() {
                by_key.entry(row.1.clone()).or_default().push_back(i);
            }
            let mut old: Vec<Option<(T, Key, Option<Node>)>> = old.into_iter().map(Some).collect();
            let mut fresh = Vec::new();
            let mut built = Vec::with_capacity(next.len());
            let mut changed = next.len() != old.len();
            for (index, item) in next.into_iter().enumerate() {
                let key = item.list_key();
                match by_key.get_mut(&key).and_then(VecDeque::pop_front) {
                    Some(i) => {
                        changed |= i != index;
                        built.push(old[i].take().unwrap());
                    }
                    None => {
                        let node = render(item.clone(), index as i64);
                        if let Some(node) = &node {
                            node.set_parent(&fragment);
                            fresh.push(node.clone());
                        }
                        built.push((item, key, node));
                        changed = true;
                    }
                }
            }
            for row in old.into_iter().flatten() {
                if let Some(node) = row.2 {
                    node.destroy();
                }
            }
            if changed {
                *fragment.children.borrow_mut() = built.iter().filter_map(|row| row.2.clone()).collect();
                for node in fresh {
                    node.apply_styles_deep();
                }
                fragment.sync_views();
            }
            *rows.borrow_mut() = built;
        });
        *fragment.reconcile.borrow_mut() = Some(reconcile.clone());
        reconcile();
    })
}

// ---------------------------------------------------------------------------
// when()
// ---------------------------------------------------------------------------

#[derive(Clone)]
pub struct WhenBuilder {
    branches: Vec<(Rc<dyn Fn() -> bool>, Content)>,
    otherwise: Option<Content>,
}

/// Shows the content of the first branch whose condition holds; a branch is built when it opens.
pub fn when(condition: Rc<dyn Fn() -> bool>, content: Content) -> WhenBuilder {
    WhenBuilder { branches: vec![(condition, content)], otherwise: None }
}

impl WhenBuilder {
    pub fn when(mut self, condition: Rc<dyn Fn() -> bool>, content: Content) -> WhenBuilder {
        self.branches.push((condition, content));
        self
    }

    pub fn otherwise(mut self, content: Content) -> WhenBuilder {
        self.otherwise = Some(content);
        self
    }
}

impl From<WhenBuilder> for Mod {
    fn from(builder: WhenBuilder) -> Mod {
        Mod::apply(move |parent| {
            let fragment = Node::fragment("when");
            parent.append(fragment.clone());
            let builder = builder.clone();
            let target = Rc::downgrade(&fragment.0);
            let active = Cell::new(-2i64);
            let reconcile: Rc<dyn Fn()> = Rc::new(move || {
                let Some(fragment) = target.upgrade().map(Node) else { return };
                let next = builder.branches.iter().position(|(condition, _)| condition()).map_or(-1, |i| i as i64);
                if next == active.get() {
                    return;
                }
                active.set(next);
                for child in fragment.children.take() {
                    child.destroy();
                }
                let content = if next >= 0 { Some(&builder.branches[next as usize].1) } else { builder.otherwise.as_ref() };
                if let Some(content) = content {
                    fragment.add(content());
                }
                let children = fragment.children.borrow().clone();
                for child in children {
                    child.apply_styles_deep();
                }
                fragment.sync_views();
            });
            *fragment.reconcile.borrow_mut() = Some(reconcile.clone());
            reconcile();
        })
    }
}

// ---------------------------------------------------------------------------
// region() / into()
// ---------------------------------------------------------------------------

struct IntoEntry {
    content: Content,
    holder: RefCell<Option<Node>>,
}

impl IntoEntry {
    fn close(&self) {
        if let Some(holder) = self.holder.take() {
            holder.destroy();
        }
    }
}

struct RegionState {
    fragment: Node,
    stack: bool,
    empty: Option<Content>,
    entries: RefCell<Vec<Rc<IntoEntry>>>,
    empty_holder: RefCell<Option<Node>>,
}

impl RegionState {
    fn hold(&self, tag: &'static str, content: &Content) -> Node {
        let holder = Node::fragment(tag);
        holder.set_parent(&self.fragment);
        holder.add(content());
        holder.apply_styles_deep();
        holder
    }

    /// Shows the newest entry (or all of them, stacked), building only those not shown yet.
    fn render(&self) {
        let entries = self.entries.borrow().clone();
        let hidden = if self.stack { 0 } else { entries.len().saturating_sub(1) };
        for entry in &entries[..hidden] {
            entry.close();
        }
        let mut children: Vec<Node> = Vec::new();
        for entry in &entries[hidden..] {
            let holder = entry.holder.borrow().clone();
            let holder = holder.unwrap_or_else(|| self.hold("into", &entry.content));
            *entry.holder.borrow_mut() = Some(holder.clone());
            children.push(holder);
        }
        match (&self.empty, children.is_empty()) {
            (Some(empty), true) => {
                let holder = self.empty_holder.borrow().clone();
                let holder = holder.unwrap_or_else(|| self.hold("empty", empty));
                *self.empty_holder.borrow_mut() = Some(holder.clone());
                children.push(holder);
            }
            _ => {
                if let Some(holder) = self.empty_holder.take() {
                    holder.destroy();
                }
            }
        }
        *self.fragment.children.borrow_mut() = children;
        self.fragment.sync_views();
        RT.with(|rt| rt.mount_pending.set(true));
    }
}

/// A named place in the tree that into() fills from anywhere. `kind` is "latest" or "stack".
pub fn region(id: &str, kind: &str, empty: Option<Content>) -> Mod {
    let (id, stack) = (id.to_string(), kind == "stack");
    Mod::apply(move |parent| {
        let fragment = Node::fragment("region");
        parent.append(fragment.clone());
        let state = Rc::new(RegionState { fragment: fragment.clone(), stack, empty: empty.clone(), entries: RefCell::default(), empty_holder: RefCell::default() });
        RT.with(|rt| {
            rt.regions.borrow_mut().insert(id.clone(), state.clone());
            if let Some(waiting) = rt.waiting.borrow_mut().remove(&id) {
                state.entries.borrow_mut().extend(waiting);
            }
        });
        state.render();
        let id = id.clone();
        fragment.teardown.borrow_mut().push(Box::new(move || {
            // The region goes: its views wait for the next region with this id.
            let entries = state.entries.take();
            for entry in &entries {
                entry.close();
            }
            RT.with(|rt| {
                let mut regions = rt.regions.borrow_mut();
                if regions.get(&id).is_some_and(|current| Rc::ptr_eq(current, &state)) {
                    regions.remove(&id);
                }
                rt.waiting.borrow_mut().entry(id).or_default().extend(entries);
            });
        }));
    })
}

/// Puts content into the region `id` for as long as this into() is in the tree.
pub fn into(id: &str, content: Content) -> Mod {
    let id = id.to_string();
    Mod::apply(move |parent| {
        let anchor = Node::fragment("into-anchor");
        parent.append(anchor.clone());
        let entry = Rc::new(IntoEntry { content: content.clone(), holder: RefCell::default() });
        let region = RT.with(|rt| rt.regions.borrow().get(&id).cloned());
        match region {
            Some(region) => {
                region.entries.borrow_mut().push(entry.clone());
                region.render();
            }
            None => RT.with(|rt| rt.waiting.borrow_mut().entry(id.clone()).or_default().push(entry.clone())),
        }
        let id = id.clone();
        anchor.teardown.borrow_mut().push(Box::new(move || {
            entry.close();
            let region = RT.with(|rt| rt.regions.borrow().get(&id).cloned());
            if let Some(region) = region {
                let before = region.entries.borrow().len();
                region.entries.borrow_mut().retain(|other| !Rc::ptr_eq(other, &entry));
                if region.entries.borrow().len() != before {
                    region.render();
                }
            }
            RT.with(|rt| {
                if let Some(waiting) = rt.waiting.borrow_mut().get_mut(&id) {
                    waiting.retain(|other| !Rc::ptr_eq(other, &entry));
                }
            });
        }));
    })
}

/// Route parameters, as a view receives them.
pub type Params = Map<String>;
