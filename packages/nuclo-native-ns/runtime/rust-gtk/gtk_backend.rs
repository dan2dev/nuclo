//! The GTK 4 backend: real GTK widgets placed at the frames the core's flex layout computes,
//! inside libadwaita's navigation (a header bar with a back button and the title per screen,
//! a view switcher bar for tabs, a dialog for a modal screen).
//!
//! Every node's view is a `NucloView`, a widget that paints the node's box (shadow, background,
//! border, rounded corners) and allocates its children exactly where the core says, with the
//! node's transform. A box's children are other `NucloView`s; a leaf holds one native widget
//! (label, button, entry, check button, text view, picture, or the app's own) inside its
//! padding; a scrolling box holds a `GtkScrolledWindow` around a second `NucloView` that has
//! the children.

use std::cell::{Cell, RefCell};
use std::collections::HashMap;
use std::rc::Rc;
use std::sync::Arc;
use std::time::{Duration, Instant};

use adw::prelude::*;
use gtk::subclass::prelude::*;
use gtk::{gdk, gio, glib, graphene, gsk, pango};

use crate::nuclo::backend::{host, Backend, Event, Input, Kind, NativeView, Paint, PanEvent, PinchEvent, PointerEvent, PointerPhase, Rect, Screen, ScrollEvent, TabInfo, TextPaint, ViewId};
use crate::nuclo::prelude::{Color, FontFamily, FontWeight, ObjectFit, TextAlign, TextDecoration};

mod imp {
    use super::*;

    #[derive(Default)]
    pub struct NucloView {
        pub id: Cell<ViewId>,
        pub frame: Cell<Rect>,
        pub paint: Cell<Option<Paint>>,
        /// A leaf's widget and whether it fills the frame (a button, a control) or sits inside the padding (text).
        pub native: RefCell<Option<(gtk::Widget, bool)>>,
        /// The core lays this view out from the size GTK gives it.
        pub root: Cell<bool>,
        /// The pointer hits this view itself: it reports some input.
        pub hit: Cell<bool>,
        /// The scrolled content of a scrolling box: as large as its frame says, whatever it is given.
        pub content: Cell<bool>,
    }

    #[glib::object_subclass]
    impl ObjectSubclass for NucloView {
        const NAME: &'static str = "NucloView";
        type Type = super::NucloView;
        type ParentType = gtk::Widget;
    }

    impl ObjectImpl for NucloView {
        fn dispose(&self) {
            while let Some(child) = self.obj().first_child() {
                child.unparent();
            }
        }
    }

    impl WidgetImpl for NucloView {
        fn request_mode(&self) -> gtk::SizeRequestMode {
            gtk::SizeRequestMode::HeightForWidth
        }

        fn measure(&self, orientation: gtk::Orientation, for_size: i32) -> (i32, i32, i32, i32) {
            let frame = self.frame.get();
            let horizontal = orientation == gtk::Orientation::Horizontal;
            if self.content.get() {
                let size = if horizontal { frame.w } else { frame.h }.max(0);
                return (size, size, -1, -1);
            }
            let natural = match (self.root.get(), horizontal) {
                // A root is as wide as it is given; its height is its content's at that width.
                (true, true) => 0,
                (true, false) => host::measure_root(self.id.get(), if for_size < 0 { frame.w.max(1) } else { for_size } as f32).ceil() as i32,
                (false, true) => frame.w,
                (false, false) => frame.h,
            };
            (0, natural.max(0), -1, -1)
        }

        fn size_allocate(&self, width: i32, height: i32, _baseline: i32) {
            if self.root.get() {
                self.frame.set(Rect { x: 0, y: 0, w: width, h: height });
                host::layout_root(self.id.get(), width as f32, height as f32);
            }
            let mut next = self.obj().first_child();
            while let Some(child) = next {
                next = child.next_sibling();
                // GTK wants a widget measured before it is allocated.
                child.measure(gtk::Orientation::Horizontal, -1);
                match child.downcast_ref::<super::NucloView>() {
                    Some(view) => {
                        let rect = view.imp().frame.get();
                        child.allocate(rect.w.max(0), rect.h.max(0), -1, Some(view.imp().transform(rect)));
                    }
                    None => {
                        let rect = self.content_rect(width, height);
                        child.size_allocate(&gtk::Allocation::new(rect.x, rect.y, rect.w.max(0), rect.h.max(0)), -1);
                    }
                }
            }
        }

        fn snapshot(&self, snapshot: &gtk::Snapshot) {
            let obj = self.obj();
            let Some(paint) = self.paint.get() else { return self.parent_snapshot(snapshot) };
            let bounds = graphene::Rect::new(0.0, 0.0, obj.width() as f32, obj.height() as f32);
            let outline = gsk::RoundedRect::from_rect(bounds, paint.radius.min(bounds.width().min(bounds.height()) / 2.0));
            if let Some(shadow) = paint.shadow {
                snapshot.append_outset_shadow(&outline, &rgba(shadow.color), shadow.dx, shadow.dy, 0.0, shadow.blur);
            }
            if let Some(background) = paint.background {
                snapshot.push_rounded_clip(&outline);
                snapshot.append_color(&rgba(background), &bounds);
                snapshot.pop();
            }
            if paint.clip {
                snapshot.push_rounded_clip(&outline);
            }
            self.parent_snapshot(snapshot);
            // The press feedback a platform button gives, over whatever the app painted.
            if let Some((native, true)) = self.native.borrow().as_ref() {
                let state = native.state_flags();
                let shade = if state.contains(gtk::StateFlags::ACTIVE) { 0.16 } else if state.contains(gtk::StateFlags::PRELIGHT) { 0.06 } else { 0.0 };
                if shade > 0.0 && native.is::<gtk::Button>() {
                    snapshot.push_rounded_clip(&outline);
                    snapshot.append_color(&gdk::RGBA::new(0.0, 0.0, 0.0, shade), &bounds);
                    snapshot.pop();
                }
            }
            if paint.clip {
                snapshot.pop();
            }
            if paint.borders.iter().any(|width| *width > 0.0) {
                snapshot.append_border(&outline, &paint.borders, &paint.border_colors.map(rgba));
            }
        }

        /// Whether the pointer hits this view itself (its children are asked first): a box
        /// that reports no input lets it through to what is under it.
        fn contains(&self, x: f64, y: f64) -> bool {
            let hit = self.hit.get() || self.paint.get().is_some_and(|paint| paint.blocks_pointer);
            hit && x >= 0.0 && y >= 0.0 && x < self.obj().width() as f64 && y < self.obj().height() as f64
        }
    }

    impl NucloView {
        /// Where the view goes in its parent: its frame, moved by its style's transform about its centre.
        fn transform(&self, rect: Rect) -> gsk::Transform {
            let at = gsk::Transform::new().translate(&graphene::Point::new(rect.x as f32, rect.y as f32));
            let Some(paint) = self.paint.get() else { return at };
            if paint.translate == (0.0, 0.0) && paint.rotate == 0.0 && paint.scale == 1.0 {
                return at;
            }
            let centre = graphene::Point::new(rect.w as f32 / 2.0, rect.h as f32 / 2.0);
            at.translate(&graphene::Point::new(paint.translate.0 + centre.x(), paint.translate.1 + centre.y()))
                .rotate(paint.rotate)
                .scale(paint.scale, paint.scale)
                .translate(&graphene::Point::new(-centre.x(), -centre.y()))
        }

        /// Where a leaf's native widget goes: the whole frame, or the frame inside padding and border.
        fn content_rect(&self, width: i32, height: i32) -> Rect {
            let fills = self.native.borrow().as_ref().is_none_or(|(_, fills)| *fills);
            let [top, right, bottom, left] = match (fills, self.paint.get()) {
                (false, Some(paint)) => paint.insets,
                _ => [0.0; 4],
            };
            let (x, y) = (left.round() as i32, top.round() as i32);
            Rect { x, y, w: (width as f32 - left - right).round() as i32, h: (height as f32 - top - bottom).round() as i32 }
        }
    }
}

glib::wrapper! {
    pub struct NucloView(ObjectSubclass<imp::NucloView>) @extends gtk::Widget, @implements gtk::Accessible, gtk::Buildable, gtk::ConstraintTarget;
}

/// For the app's `native/linux/`: a GTK widget as the view a `NativeComponent` creates…
#[allow(dead_code)]
pub fn native(widget: impl IsA<gtk::Widget>) -> NativeView {
    Rc::new(widget.upcast::<gtk::Widget>())
}

/// …and that widget back, in `update` and `destroy`.
#[allow(dead_code)]
pub fn widget<T: IsA<gtk::Widget>>(view: &NativeView) -> T {
    view.downcast_ref::<gtk::Widget>().and_then(|widget| widget.clone().downcast().ok()).expect("this native view is another widget")
}

fn rgba(color: Color) -> gdk::RGBA {
    let [r, g, b, a] = color.rgba();
    gdk::RGBA::new(r, g, b, a)
}

/// Controls styled by the app lose the theme's chrome: the `NucloView` paints their box.
const CSS: &str = "
.nuclo-bare, .nuclo-bare:hover, .nuclo-bare:active, .nuclo-bare:focus-within, .nuclo-bare > text {
  background: none; border: none; box-shadow: none; padding: 0; margin: 0; min-height: 0; min-width: 0; border-radius: 0;
}
entry.nuclo-bare, entry.nuclo-bare:focus-within { outline: none; }
.nuclo-screen { background: white; }
scrolledwindow.nuclo-scroll, scrolledwindow.nuclo-scroll > viewport { background: none; }
";

struct View {
    kind: Kind,
    widget: NucloView,
    native: Option<gtk::Widget>,
    /// A scrolling box's content: where its children go.
    content: Option<NucloView>,
    /// The gesture that reports the view's pointers and its pan, once one was asked for.
    drag: Option<Rc<Drag>>,
}

impl View {
    /// The label that shows a Text's or a Button's text.
    fn label(&self) -> Option<gtk::Label> {
        match self.kind {
            Kind::Text => self.native.clone()?.downcast().ok(),
            Kind::Button => self.native.clone()?.downcast::<gtk::Button>().ok()?.child()?.downcast().ok(),
            _ => None,
        }
    }

    /// The widget that holds the children.
    fn container(&self) -> NucloView {
        self.content.clone().unwrap_or_else(|| self.widget.clone())
    }
}

struct Navigation {
    /// One per tab, or a single one.
    stacks: Vec<adw::NavigationView>,
    tabs: Option<adw::ViewStack>,
}

struct Gtk {
    window: adw::ApplicationWindow,
    /// The window's content: the app under the overlay layers.
    layers: gtk::Overlay,
    views: RefCell<HashMap<ViewId, View>>,
    next_view: Cell<ViewId>,
    roots: RefCell<Vec<NucloView>>,
    navigation: RefCell<Option<Navigation>>,
    pages: RefCell<HashMap<ViewId, adw::NavigationPage>>,
    /// Modal screens, each with its tab, in the order they were presented.
    dialogs: RefCell<Vec<(usize, ViewId, adw::Dialog)>>,
    timers: RefCell<HashMap<u64, glib::SourceId>>,
    next_timer: Cell<u64>,
    /// requestAnimationFrame callbacks, and the tick that runs them while there are any.
    frames: RefCell<Vec<(u64, Box<dyn FnOnce()>)>>,
    tick: RefCell<Option<gtk::TickCallbackId>>,
    /// A layout was requested and its frame is not painted yet: due timers wait for it.
    frame_pending: Cell<bool>,
    after_frame: RefCell<Vec<Box<dyn FnOnce()>>>,
    /// The app's stylesheet: `CSS`, then a rule per placeholder colour the app uses.
    css: gtk::CssProvider,
    placeholders: RefCell<Vec<Color>>,
}

thread_local!(static GTK: RefCell<Option<Rc<Gtk>>> = const { RefCell::new(None) });

fn gtk_backend() -> Option<Rc<Gtk>> {
    GTK.with(|gtk| gtk.borrow().clone())
}

impl Gtk {
    fn view<T>(&self, id: ViewId, f: impl FnOnce(&View) -> T) -> Option<T> {
        self.views.borrow().get(&id).map(f)
    }

    fn widget(&self, id: ViewId) -> Option<NucloView> {
        self.view(id, |view| view.widget.clone())
    }

    fn native<T: IsA<gtk::Widget>>(&self, id: ViewId) -> Option<T> {
        self.view(id, |view| view.native.clone())?.and_then(|native| native.downcast().ok())
    }

    fn register(&self, kind: Kind, widget: NucloView, native: Option<gtk::Widget>, fills: bool) -> ViewId {
        let id = self.next_view.replace(self.next_view.get() + 1);
        widget.imp().id.set(id);
        if let Some(native) = &native {
            native.set_parent(&widget);
            *widget.imp().native.borrow_mut() = Some((native.clone(), fills));
        }
        self.views.borrow_mut().insert(id, View { kind, widget, native, content: None, drag: None });
        id
    }

    /// A screen: the root view in a white page that scrolls, unless the root scrolls itself.
    fn screen(&self, root: ViewId) -> gtk::Widget {
        let Some((widget, scrolls)) = self.view(root, |view| (view.widget.clone(), view.content.is_some())) else { return gtk::Box::default().upcast() };
        widget.imp().root.set(true);
        self.roots.borrow_mut().push(widget.clone());
        let page: gtk::Widget = if scrolls {
            let page = adw::Bin::builder().child(&widget).vexpand(true).build();
            page.upcast()
        } else {
            let scroller = gtk::ScrolledWindow::builder().hscrollbar_policy(gtk::PolicyType::Never).vexpand(true).child(&widget).build();
            // Where the screen is scrolled and how much of it shows, for a route's onEndReached.
            let report = move |adjustment: &gtk::Adjustment| host::screen_scrolled(root, adjustment.value() as f32, adjustment.page_size() as f32);
            scroller.vadjustment().connect_value_changed(report);
            scroller.vadjustment().connect_changed(report);
            scroller.upcast()
        };
        page.add_css_class("nuclo-screen");
        page
    }

    /// A screen under its header bar.
    fn framed(&self, screen: &Screen) -> adw::ToolbarView {
        let toolbar = adw::ToolbarView::new();
        if screen.header {
            toolbar.add_top_bar(&adw::HeaderBar::new());
        }
        toolbar.set_content(Some(&self.screen(screen.root)));
        toolbar
    }

    fn page(&self, screen: &Screen) -> adw::NavigationPage {
        if let Some(page) = self.pages.borrow().get(&screen.root) {
            return page.clone();
        }
        // libadwaita insists on a title: a route without one shows an empty header.
        let page = adw::NavigationPage::new(&self.framed(screen), if screen.title.is_empty() { " " } else { screen.title });
        self.pages.borrow_mut().insert(screen.root, page.clone());
        page
    }

    fn stack(&self, tab: usize) -> Option<adw::NavigationView> {
        self.navigation.borrow().as_ref().and_then(|nav| nav.stacks.get(tab).cloned())
    }

    /// Closes `tab`'s topmost modal screen, if its top screen is one.
    fn close_dialog(&self, tab: usize) -> bool {
        let top = self.dialogs.borrow().iter().rposition(|(owner, _, _)| *owner == tab);
        let Some(at) = top else { return false };
        let (_, _, dialog) = self.dialogs.borrow_mut().remove(at);
        dialog.force_close();
        true
    }

    /// The class that colours an entry's placeholder `color`. A placeholder has no property, only CSS.
    fn placeholder_class(&self, color: Color) -> String {
        let mut known = self.placeholders.borrow_mut();
        if !known.contains(&color) {
            known.push(color);
            let rules: String = known.iter().map(|c| format!(".nuclo-ph-{:08x} > text > placeholder {{ color: {}; }}\n", c.0, rgba(*c).to_str())).collect();
            self.css.load_from_string(&format!("{CSS}{rules}"));
        }
        format!("nuclo-ph-{:08x}", color.0)
    }

    /// Runs what waited for the frame.
    fn frame_done(&self) {
        self.frame_pending.set(false);
        for callback in self.after_frame.take() {
            callback();
        }
    }

    /// A pointer at `(x, y)` of `widget`, with its position in the window.
    fn pointer(&self, widget: &NucloView, x: f64, y: f64) -> PointerEvent {
        let page = widget.compute_point(&self.window, &graphene::Point::new(x as f32, y as f32));
        PointerEvent { x, y, page_x: page.map_or(x, |p| p.x() as f64), page_y: page.map_or(y, |p| p.y() as f64), pointer_id: 0 }
    }
}

fn icon_name(icon: &str) -> &'static str {
    match icon {
        "home" => "go-home-symbolic",
        "list" => "view-list-symbolic",
        "cloud" => "weather-overcast-symbolic",
        "star" => "starred-symbolic",
        "person" => "avatar-default-symbolic",
        "grid" => "view-grid-symbolic",
        "heart" => "starred-symbolic",
        "settings" => "emblem-system-symbolic",
        "search" => "system-search-symbolic",
        _ => "view-app-grid-symbolic",
    }
}

fn text_attributes(text: &TextPaint) -> pango::AttrList {
    let scaled = |px: f32| (px * pango::SCALE as f32) as i32;
    let attrs = pango::AttrList::new();
    attrs.insert(pango::AttrSize::new_size_absolute(scaled(text.font_size)));
    attrs.insert(pango::AttrInt::new_weight(match text.weight {
        FontWeight::Light => pango::Weight::Light,
        FontWeight::Normal => pango::Weight::Normal,
        FontWeight::Medium => pango::Weight::Medium,
        FontWeight::Semibold => pango::Weight::Semibold,
        FontWeight::Bold => pango::Weight::Bold,
    }));
    if text.italic {
        attrs.insert(pango::AttrInt::new_style(pango::Style::Italic));
    }
    match text.font_family {
        FontFamily::SansSerif => {}
        FontFamily::Serif => attrs.insert(pango::AttrString::new_family("serif")),
        FontFamily::Monospace => attrs.insert(pango::AttrString::new_family("monospace")),
    }
    if let Some(height) = text.line_height {
        attrs.insert(pango::AttrInt::new_line_height_absolute(scaled(height)));
    }
    if text.letter_spacing != 0.0 {
        attrs.insert(pango::AttrInt::new_letter_spacing(scaled(text.letter_spacing)));
    }
    match text.decoration {
        TextDecoration::None => {}
        TextDecoration::Underline => attrs.insert(pango::AttrInt::new_underline(pango::Underline::Single)),
        TextDecoration::LineThrough => attrs.insert(pango::AttrInt::new_strikethrough(true)),
    }
    let [r, g, b, a] = text.color.rgba().map(|channel| (channel * 65535.0) as u16);
    attrs.insert(pango::AttrColor::new_foreground(r, g, b));
    attrs.insert(pango::AttrInt::new_foreground_alpha(a.max(1)));
    attrs
}

fn xalign(align: TextAlign) -> f32 {
    match align {
        TextAlign::Left => 0.0,
        TextAlign::Center => 0.5,
        TextAlign::Right => 1.0,
    }
}

/// DOM `key` names for the keys an app is likely to handle.
fn key_name(key: gdk::Key) -> String {
    let named = match key {
        gdk::Key::Return | gdk::Key::KP_Enter => "Enter",
        gdk::Key::Escape => "Escape",
        gdk::Key::BackSpace => "Backspace",
        gdk::Key::Delete => "Delete",
        gdk::Key::Tab => "Tab",
        gdk::Key::Left => "ArrowLeft",
        gdk::Key::Right => "ArrowRight",
        gdk::Key::Up => "ArrowUp",
        gdk::Key::Down => "ArrowDown",
        _ => "",
    };
    if !named.is_empty() {
        return named.to_string();
    }
    key.to_unicode().map(String::from).or_else(|| key.name().map(String::from)).unwrap_or_default()
}

/// The drag threshold: a pointer that moved less is still a press.
const SLOP: f64 = 8.0;

/// One drag gesture per view reports its pointers and recognizes its pan.
#[derive(Default)]
struct Drag {
    pointers: Cell<bool>,
    pan: Cell<bool>,
    panning: Cell<bool>,
    /// The pointer in the window where the pan was recognized, and its last position and time there.
    origin: Cell<(f64, f64)>,
    last: Cell<Option<(f64, f64, Instant)>>,
    velocity: Cell<(f64, f64)>,
}

impl Backend for Gtk {
    fn create(&self, kind: Kind) -> ViewId {
        let widget: NucloView = glib::Object::new();
        let id = self.next_view.get();
        let event = move |event: Event| move || host::event(id, event);
        let focus = |native: &gtk::Widget| {
            let controller = gtk::EventControllerFocus::new();
            let (enter, leave) = (event(Event::Focus), event(Event::Blur));
            controller.connect_enter(move |_| enter());
            controller.connect_leave(move |_| leave());
            native.add_controller(controller);
        };
        let (native, fills): (Option<gtk::Widget>, bool) = match kind {
            Kind::Box | Kind::Native => (None, true),
            Kind::Text => {
                let label = gtk::Label::builder().wrap(true).wrap_mode(pango::WrapMode::WordChar).xalign(0.0).yalign(0.0).build();
                // Text never takes the pointer: a click reaches the view (or the box) under it.
                label.set_can_target(false);
                (Some(label.upcast()), false)
            }
            Kind::Button => {
                let label = gtk::Label::builder().wrap(true).wrap_mode(pango::WrapMode::WordChar).justify(gtk::Justification::Center).build();
                let button = gtk::Button::builder().child(&label).build();
                button.add_css_class("nuclo-bare");
                let click = event(Event::Click);
                button.connect_clicked(move |_| click());
                let view = widget.downgrade();
                button.connect_state_flags_changed(move |_, _| {
                    if let Some(view) = view.upgrade() {
                        view.queue_draw();
                    }
                });
                (Some(button.upcast()), true)
            }
            Kind::Input => {
                let entry = gtk::Entry::new();
                let (input, change) = (event(Event::Input), event(Event::Change));
                entry.connect_changed(move |_| input());
                entry.connect_activate(move |_| change());
                focus(entry.upcast_ref());
                (Some(entry.upcast()), false)
            }
            Kind::Checkbox => {
                // nuclo-native-ns: the platform's switch, as UISwitch on iOS (a check box is a list's choice on GNOME).
                let check = gtk::Switch::builder().valign(gtk::Align::Center).build();
                let change = event(Event::Change);
                check.connect_active_notify(move |_| change());
                (Some(check.upcast()), true)
            }
            Kind::Textarea => {
                let text = gtk::TextView::builder().wrap_mode(gtk::WrapMode::WordChar).build();
                let input = event(Event::Input);
                text.buffer().connect_changed(move |_| input());
                focus(text.upcast_ref());
                (Some(text.upcast()), false)
            }
            Kind::Image => {
                let picture = gtk::Picture::builder().content_fit(gtk::ContentFit::Cover).build();
                picture.set_can_target(false);
                (Some(picture.upcast()), true)
            }
        };
        self.register(kind, widget, native, fills)
    }

    fn adopt(&self, native: NativeView) -> ViewId {
        let native = native.downcast_ref::<gtk::Widget>().cloned().expect("a native component of the GTK backend creates a gtk::Widget (gtk_backend::native)");
        self.register(Kind::Native, glib::Object::new(), Some(native), true)
    }

    fn destroy(&self, view: ViewId) {
        let removed = self.views.borrow_mut().remove(&view);
        let Some(View { widget, .. }) = removed else { return };
        // A root sits in a page, which goes with the page: only a box's child is taken out here.
        if widget.parent().is_some_and(|parent| parent.is::<NucloView>()) {
            widget.unparent();
        }
        self.roots.borrow_mut().retain(|root| *root != widget);
        self.pages.borrow_mut().remove(&view);
    }

    fn set_children(&self, parent: ViewId, children: &[ViewId]) {
        let Some(parent) = self.view(parent, View::container) else { return };
        let wanted: Vec<NucloView> = children.iter().filter_map(|id| self.widget(*id)).collect();
        // Only views that arrive or leave are touched: layout places children by frame, and the
        // widget order is only the drawing order (as in the Android runtime).
        let mut next = parent.first_child();
        while let Some(child) = next {
            next = child.next_sibling();
            if child.downcast_ref::<NucloView>().is_some_and(|view| !wanted.contains(view)) {
                child.unparent();
            }
        }
        for child in &wanted {
            if child.parent().as_ref() != Some(parent.upcast_ref()) {
                if child.parent().is_some() {
                    child.unparent();
                }
                child.set_parent(&parent);
            }
        }
        parent.queue_allocate();
    }

    fn reorder(&self, parent: ViewId, children: &[ViewId]) {
        let Some(parent) = self.view(parent, View::container) else { return };
        for child in children.iter().filter_map(|id| self.widget(*id)) {
            if child.parent().as_ref() == Some(parent.upcast_ref()) {
                child.insert_before(&parent, gtk::Widget::NONE);
            }
        }
    }

    fn set_frame(&self, view: ViewId, frame: Rect) {
        let Some(widget) = self.widget(view) else { return };
        if widget.imp().frame.replace(frame) != frame {
            // The parent allocates this view again, and so the view its own children.
            widget.queue_allocate();
            if let Some(parent) = widget.parent() {
                parent.queue_allocate();
            }
        }
    }

    fn paint(&self, view: ViewId, kind: Kind, paint: &Paint) {
        let Some(widget) = self.widget(view) else { return };
        let before = widget.imp().paint.replace(Some(*paint));
        let styled = paint.background.is_some() || paint.borders.iter().any(|width| *width > 0.0);
        if before.map(|before| before.text) != Some(paint.text) {
            let attrs = text_attributes(&paint.text);
            if let Some(label) = self.view(view, View::label).flatten() {
                label.set_attributes(Some(&attrs));
                label.set_ellipsize(if paint.text.lines.is_some() { pango::EllipsizeMode::End } else { pango::EllipsizeMode::None });
                label.set_lines(paint.text.lines.map_or(-1, |lines| lines as i32));
                if kind == Kind::Text {
                    label.set_xalign(xalign(paint.text.align));
                    label.set_justify(match paint.text.align {
                        TextAlign::Left => gtk::Justification::Left,
                        TextAlign::Center => gtk::Justification::Center,
                        TextAlign::Right => gtk::Justification::Right,
                    });
                }
            }
            if let Some(entry) = self.native::<gtk::Entry>(view) {
                entry.set_attributes(&attrs);
                EntryExt::set_alignment(&entry, xalign(paint.text.align));
                if let Some(before) = before.and_then(|before| before.text.placeholder) {
                    entry.remove_css_class(&self.placeholder_class(before));
                }
                if let Some(color) = paint.text.placeholder {
                    entry.add_css_class(&self.placeholder_class(color));
                }
            }
        }
        if let (Kind::Input | Kind::Textarea, Some(native)) = (kind, self.native::<gtk::Widget>(view)) {
            // A field the app gave a box is drawn by that box; a plain one keeps the theme's own.
            if styled {
                native.add_css_class("nuclo-bare");
            } else {
                native.remove_css_class("nuclo-bare");
            }
            if let Some((_, fills)) = widget.imp().native.borrow_mut().as_mut() {
                *fills = !styled;
            }
        }
        if let Some(picture) = self.native::<gtk::Picture>(view) {
            picture.set_content_fit(match paint.fit {
                ObjectFit::Cover => gtk::ContentFit::Cover,
                ObjectFit::Contain => gtk::ContentFit::Contain,
                ObjectFit::Fill => gtk::ContentFit::Fill,
            });
        }
        widget.set_opacity(paint.opacity.clamp(0.0, 1.0) as f64);
        widget.set_visible(paint.visible);
        // GTK does not pick a widget that can't be targeted, nor anything in it.
        widget.set_can_target(paint.pointer);
        let moved = before.is_none_or(|before| (before.translate, before.rotate, before.scale) != (paint.translate, paint.rotate, paint.scale));
        if let (true, Some(parent)) = (moved, widget.parent()) {
            // The transform is part of where the parent puts this view.
            parent.queue_allocate();
        }
        if before.map(|before| before.insets) != Some(paint.insets) {
            widget.queue_allocate();
        }
        widget.queue_draw();
    }

    fn measure(&self, view: ViewId, max_width: f32) -> (f32, f32) {
        let Some((kind, widget, native)) = self.view(view, |v| (v.kind, v.widget.clone(), v.native.clone())) else { return (0.0, 0.0) };
        let paint = widget.imp().paint.get();
        let text_size = |text: &str| {
            let layout = widget.create_pango_layout(Some(text));
            layout.set_attributes(paint.map(|paint| text_attributes(&paint.text)).as_ref());
            let (width, height) = layout.pixel_size();
            if width as f32 <= max_width {
                return (width as f32, height as f32);
            }
            layout.set_wrap(pango::WrapMode::WordChar);
            layout.set_width(max_width.floor() as i32 * pango::SCALE);
            if let Some(lines) = paint.and_then(|paint| paint.text.lines) {
                layout.set_ellipsize(pango::EllipsizeMode::End);
                layout.set_height(-(lines as i32));
            }
            (max_width, layout.pixel_size().1 as f32)
        };
        let natural = |widget: &gtk::Widget| {
            let width = (widget.measure(gtk::Orientation::Horizontal, -1).1 as f32).min(max_width);
            (width, widget.measure(gtk::Orientation::Vertical, width as i32).1 as f32)
        };
        match (kind, native) {
            (Kind::Text | Kind::Button, _) => text_size(self.view(view, View::label).flatten().map(|label| label.text()).unwrap_or_default().as_str()),
            (Kind::Input, Some(entry)) => {
                let line = text_size("Ag").1;
                // With the theme's chrome, the field is as tall as the theme makes it.
                let fills = widget.imp().native.borrow().as_ref().is_some_and(|(_, fills)| *fills);
                let [top, _, bottom, _] = paint.map_or([0.0; 4], |paint| paint.insets);
                (max_width, if fills { line.max(natural(&entry).1 - top - bottom) } else { line })
            }
            (Kind::Textarea, Some(text)) => {
                let buffer = text.downcast::<gtk::TextView>().map(|text| text.buffer());
                let content = buffer.map(|buffer| buffer.text(&buffer.start_iter(), &buffer.end_iter(), false)).unwrap_or_default();
                text_size(if content.is_empty() { "Ag" } else { content.as_str() })
            }
            (Kind::Checkbox | Kind::Native, Some(native)) => natural(&native),
            _ => (0.0, 0.0),
        }
    }

    fn make_scrollable(&self, view: ViewId, horizontal: bool) {
        let Some(widget) = self.widget(view) else { return };
        let content: NucloView = glib::Object::new();
        content.imp().content.set(true);
        let (across, along) = (gtk::PolicyType::Never, gtk::PolicyType::Automatic);
        let scroller = gtk::ScrolledWindow::builder()
            // A row scrolls without a bar, as on the other platforms.
            .hscrollbar_policy(if horizontal { gtk::PolicyType::External } else { across })
            .vscrollbar_policy(if horizontal { across } else { along })
            .child(&content)
            .build();
        scroller.add_css_class("nuclo-scroll");
        scroller.set_parent(&widget);
        *widget.imp().native.borrow_mut() = Some((scroller.clone().upcast(), true));
        if let Some(view) = self.views.borrow_mut().get_mut(&view) {
            view.native = Some(scroller.upcast());
            view.content = Some(content);
        }
    }

    fn set_content_size(&self, view: ViewId, width: i32, height: i32) {
        let Some(content) = self.view(view, |view| view.content.clone()).flatten() else { return };
        let frame = Rect { x: 0, y: 0, w: width, h: height };
        if content.imp().frame.replace(frame) != frame {
            content.queue_resize();
        }
    }

    fn set_text(&self, view: ViewId, text: &str) {
        if let Some(label) = self.view(view, View::label).flatten() {
            label.set_text(text);
        }
    }

    fn set_value(&self, view: ViewId, text: &str) {
        if let Some(entry) = self.native::<gtk::Entry>(view) {
            entry.set_text(text);
        } else if let Some(area) = self.native::<gtk::TextView>(view) {
            area.buffer().set_text(text);
        }
    }

    fn set_placeholder(&self, view: ViewId, text: &str) {
        if let Some(entry) = self.native::<gtk::Entry>(view) {
            entry.set_placeholder_text(Some(text));
        }
    }

    fn set_checked(&self, view: ViewId, checked: bool) {
        if let Some(check) = self.native::<gtk::Switch>(view) {
            if check.is_active() != checked {
                check.set_active(checked);
            }
        }
    }

    fn set_enabled(&self, view: ViewId, enabled: bool) {
        if let Some(widget) = self.widget(view) {
            widget.set_sensitive(enabled);
        }
    }

    fn set_input_type(&self, view: ViewId, input_type: &str) {
        let Some(entry) = self.native::<gtk::Entry>(view) else { return };
        entry.set_visibility(input_type != "password");
        entry.set_input_purpose(match input_type {
            "password" => gtk::InputPurpose::Password,
            "email" => gtk::InputPurpose::Email,
            "number" => gtk::InputPurpose::Number,
            _ => gtk::InputPurpose::FreeForm,
        });
    }

    fn set_image(&self, view: ViewId, bytes: &[u8]) {
        if let Some(picture) = self.native::<gtk::Picture>(view) {
            picture.set_paintable(gdk::Texture::from_bytes(&glib::Bytes::from(bytes)).ok().as_ref());
        }
    }

    fn set_label(&self, view: ViewId, label: &str) {
        if let Some(target) = self.native::<gtk::Widget>(view).or_else(|| self.widget(view).map(|widget| widget.upcast())) {
            target.update_property(&[gtk::accessible::Property::Label(label)]);
        }
    }

    fn control_state(&self, view: ViewId) -> (String, bool) {
        if let Some(entry) = self.native::<gtk::Entry>(view) {
            (entry.text().into(), false)
        } else if let Some(check) = self.native::<gtk::Switch>(view) {
            (if check.is_active() { "on" } else { "" }.into(), check.is_active())
        } else if let Some(area) = self.native::<gtk::TextView>(view) {
            let buffer = area.buffer();
            (buffer.text(&buffer.start_iter(), &buffer.end_iter(), false).into(), false)
        } else {
            (String::new(), false)
        }
    }

    fn listen(&self, view: ViewId, input: Input) {
        let Some((kind, widget, native, scrolls)) = self.view(view, |v| (v.kind, v.widget.clone(), v.native.clone(), v.content.is_some())) else { return };
        widget.imp().hit.set(true);
        match input {
            Input::Click => {
                if kind == Kind::Button {
                    return; // A button reports its own clicks.
                }
                let click = gtk::GestureClick::new();
                click.connect_released(move |gesture, _, _, _| {
                    gesture.set_state(gtk::EventSequenceState::Claimed);
                    host::event(view, Event::Click);
                });
                widget.add_controller(click);
                widget.set_cursor_from_name(Some("pointer"));
            }
            Input::Pointer | Input::Pan => {
                // The first of the two makes the gesture; the second finds it.
                let existing = self.view(view, |v| v.drag.clone()).flatten();
                let drag = existing.unwrap_or_else(|| {
                    let drag = Rc::new(Drag::default());
                    self.drag_gesture(view, &widget, drag.clone());
                    if let Some(v) = self.views.borrow_mut().get_mut(&view) {
                        v.drag = Some(drag.clone());
                    }
                    drag
                });
                if input == Input::Pan {
                    drag.pan.set(true);
                } else {
                    drag.pointers.set(true);
                }
            }
            Input::Pinch => {
                let zoom = gtk::GestureZoom::new();
                let last = Rc::new(Cell::new(1.0));
                let pinch = move |state: &str, gesture: &gtk::GestureZoom, scale: f64| {
                    let (focal_x, focal_y) = gesture.bounding_box_center().unwrap_or_default();
                    host::pinch(view, PinchEvent { state: state.into(), scale, focal_x, focal_y });
                };
                zoom.connect_begin({
                    let last = last.clone();
                    move |gesture, _| {
                        last.set(1.0);
                        pinch("start", gesture, 1.0);
                    }
                });
                zoom.connect_scale_changed({
                    let last = last.clone();
                    move |gesture, scale| {
                        last.set(scale);
                        pinch("move", gesture, scale);
                    }
                });
                zoom.connect_end(move |gesture, _| pinch("end", gesture, last.get()));
                widget.add_controller(zoom);
                self.wheel_pinch(view, &widget);
            }
            Input::LongPress => {
                let press = gtk::GestureLongPress::new();
                let target = widget.clone();
                press.connect_pressed(move |_, x, y| {
                    if let Some(gtk) = gtk_backend() {
                        host::pointer(view, PointerPhase::LongPress, gtk.pointer(&target, x, y));
                    }
                });
                widget.add_controller(press);
            }
            Input::DoubleClick => {
                let click = gtk::GestureClick::new();
                let target = widget.clone();
                click.connect_pressed(move |_, presses, x, y| {
                    if let (2, Some(gtk)) = (presses, gtk_backend()) {
                        host::pointer(view, PointerPhase::DoubleClick, gtk.pointer(&target, x, y));
                    }
                });
                widget.add_controller(click);
            }
            Input::Hover => {
                let motion = gtk::EventControllerMotion::new();
                motion.connect_enter(move |_, _, _| host::hover(view, true));
                motion.connect_leave(move |_| host::hover(view, false));
                widget.add_controller(motion);
            }
            Input::Keys => {
                let keys = gtk::EventControllerKey::new();
                // Before the field handles the key itself (Enter, the arrows).
                keys.set_propagation_phase(gtk::PropagationPhase::Capture);
                keys.connect_key_pressed(move |_, key, _, _| {
                    host::key(view, &key_name(key));
                    glib::Propagation::Proceed
                });
                match native.filter(|_| kind != Kind::Box) {
                    Some(native) => native.add_controller(keys),
                    None => {
                        // A box takes the keys while it has the focus: a click gives it.
                        widget.set_focusable(true);
                        let click = gtk::GestureClick::new();
                        let target = widget.downgrade();
                        click.connect_pressed(move |_, _, _, _| {
                            if let Some(target) = target.upgrade() {
                                target.grab_focus();
                            }
                        });
                        widget.add_controller(click);
                        widget.add_controller(keys);
                    }
                }
            }
            Input::Scroll => {
                let Some(scroller) = native.filter(|_| scrolls).and_then(|native| native.downcast::<gtk::ScrolledWindow>().ok()) else { return };
                let report = {
                    let scroller = scroller.clone();
                    move || {
                        let (v, h) = (scroller.vadjustment(), scroller.hadjustment());
                        host::scrolled(view, ScrollEvent {
                            scroll_top: v.value(),
                            scroll_left: h.value(),
                            scroll_height: v.upper(),
                            scroll_width: h.upper(),
                            client_height: v.page_size(),
                            client_width: h.page_size(),
                        });
                    }
                };
                scroller.vadjustment().connect_value_changed({
                    let report = report.clone();
                    move |_| report()
                });
                scroller.hadjustment().connect_value_changed(move |_| report());
            }
        }
    }

    fn open_url(&self, url: &str) {
        gtk::UriLauncher::new(url).launch(Some(&self.window), gio::Cancellable::NONE, |_| {});
    }

    fn show_screen(&self, root: ViewId) {
        self.layers.set_child(Some(&self.framed(&Screen { root, title: "", modal: false, header: true })));
    }

    fn show_overlay(&self, root: ViewId) {
        let Some(widget) = self.widget(root) else { return };
        widget.imp().root.set(true);
        self.layers.add_overlay(&widget);
        self.roots.borrow_mut().push(widget);
    }

    fn request_layout(&self) {
        for root in self.roots.borrow().iter() {
            root.queue_resize();
        }
        self.frame_pending.set(self.window.is_mapped());
    }

    fn window_width(&self) -> f32 {
        match self.window.width() {
            0 => self.window.default_width() as f32,
            width => width as f32,
        }
    }

    fn window_height(&self) -> f32 {
        match self.window.height() {
            0 => self.window.default_height() as f32,
            height => height as f32,
        }
    }

    fn nav_create(&self, tabs: &[TabInfo], active: usize) {
        let stack = |tab: usize| {
            let stack = adw::NavigationView::new();
            stack.connect_popped(move |_, page| {
                let root = gtk_backend().and_then(|gtk| gtk.pages.borrow().iter().find(|(_, other)| *other == page).map(|(root, _)| *root));
                if let Some(root) = root {
                    host::nav_popped(tab, root);
                }
            });
            stack
        };
        if tabs.is_empty() {
            let stack = stack(0);
            self.layers.set_child(Some(&stack));
            *self.navigation.borrow_mut() = Some(Navigation { stacks: vec![stack], tabs: None });
            return;
        }
        let switcher = adw::ViewStack::new();
        let stacks: Vec<adw::NavigationView> = (0..tabs.len()).map(stack).collect();
        for (tab, stack) in tabs.iter().zip(&stacks) {
            switcher.add_titled_with_icon(stack, None, &tab.title, icon_name(&tab.icon));
        }
        switcher.set_visible_child(&stacks[active]);
        let pages = stacks.clone();
        switcher.connect_visible_child_notify(move |switcher| {
            let tab = switcher.visible_child().and_then(|child| pages.iter().position(|stack| *stack.upcast_ref::<gtk::Widget>() == child));
            if let Some(tab) = tab {
                host::nav_tab_selected(tab);
            }
        });
        let bar = adw::ViewSwitcherBar::builder().stack(&switcher).reveal(true).build();
        let toolbar = adw::ToolbarView::new();
        toolbar.set_content(Some(&switcher));
        toolbar.add_bottom_bar(&bar);
        self.layers.set_child(Some(&toolbar));
        *self.navigation.borrow_mut() = Some(Navigation { stacks, tabs: Some(switcher) });
    }

    fn nav_push(&self, tab: usize, screen: &Screen, animated: bool) {
        if screen.modal {
            // The platform's sheet: a dialog over the window, a bottom sheet when it is narrow.
            let dialog = adw::Dialog::builder().title(screen.title).child(&self.framed(screen)).content_width(420).content_height(560).build();
            let root = screen.root;
            dialog.connect_closed(move |_| {
                if let Some(gtk) = gtk_backend() {
                    gtk.dialogs.borrow_mut().retain(|(_, other, _)| *other != root);
                }
                host::nav_popped(tab, root);
            });
            self.dialogs.borrow_mut().push((tab, root, dialog.clone()));
            dialog.present(Some(&self.window));
            return;
        }
        let Some(stack) = self.stack(tab) else { return };
        stack.set_animate_transitions(animated);
        stack.push(&self.page(screen));
        stack.set_animate_transitions(true);
    }

    fn nav_pop(&self, tab: usize, animated: bool) {
        if self.close_dialog(tab) {
            return;
        }
        let Some(stack) = self.stack(tab) else { return };
        stack.set_animate_transitions(animated);
        stack.pop();
        stack.set_animate_transitions(true);
    }

    fn nav_replace(&self, tab: usize, screen: &Screen) {
        while self.close_dialog(tab) {}
        if let Some(stack) = self.stack(tab) {
            stack.replace(&[self.page(screen)]);
        }
    }

    fn nav_select_tab(&self, tab: usize) {
        let navigation = self.navigation.borrow();
        if let Some((Some(tabs), Some(stack))) = navigation.as_ref().map(|nav| (nav.tabs.as_ref(), nav.stacks.get(tab))) {
            tabs.set_visible_child(stack);
        }
    }

    fn set_timer(&self, ms: u64, callback: Box<dyn FnOnce()>) -> u64 {
        let id = self.next_timer.replace(self.next_timer.get() + 1);
        let source = glib::timeout_add_local_once(Duration::from_millis(ms), move || {
            let Some(gtk) = gtk_backend() else { return };
            gtk.timers.borrow_mut().remove(&id);
            if gtk.frame_pending.get() {
                // What the app changed before this timer was due is not on screen yet: GTK lays
                // out and paints at a lower priority than timers. Run after that frame, as the
                // other platforms do (or shortly, if no frame comes: the window may be hidden).
                gtk.after_frame.borrow_mut().push(callback);
                glib::timeout_add_local_once(Duration::from_millis(100), || {
                    if let Some(gtk) = gtk_backend() {
                        gtk.frame_done();
                    }
                });
            } else {
                callback();
            }
        });
        self.timers.borrow_mut().insert(id, source);
        id
    }

    fn clear_timer(&self, timer: u64) {
        if let Some(source) = self.timers.borrow_mut().remove(&timer) {
            source.remove();
        }
    }

    fn request_frame(&self, callback: Box<dyn FnOnce()>) -> u64 {
        let id = self.next_timer.replace(self.next_timer.get() + 1);
        self.frames.borrow_mut().push((id, callback));
        if self.tick.borrow().is_none() {
            let tick = self.window.add_tick_callback(|_, _| {
                let Some(gtk) = gtk_backend() else { return glib::ControlFlow::Break };
                // Callbacks asked for during this frame run in the next one.
                for (_, callback) in gtk.frames.take() {
                    callback();
                }
                if gtk.frames.borrow().is_empty() {
                    gtk.tick.take();
                    return glib::ControlFlow::Break;
                }
                glib::ControlFlow::Continue
            });
            *self.tick.borrow_mut() = Some(tick);
        }
        id
    }

    fn cancel_frame(&self, frame: u64) {
        self.frames.borrow_mut().retain(|(id, _)| *id != frame);
    }

    fn waker(&self) -> Arc<dyn Fn() + Send + Sync> {
        // Always through the main loop, never inline: a task may wake itself while it runs. At a high priority: the
        // microtasks an event handler queued run right after it, before any timer that is due (as in JavaScript).
        Arc::new(|| {
            glib::idle_add_full(glib::Priority::HIGH, || {
                host::wake();
                glib::ControlFlow::Break
            });
        })
    }
}

impl Gtk {
    /// The gesture behind `Input::Pointer` and `Input::Pan`: a press, its moves, its release.
    fn drag_gesture(&self, view: ViewId, widget: &NucloView, drag: Rc<Drag>) {
        let gesture = gtk::GestureDrag::new();
        let at = {
            let widget = widget.clone();
            move |gesture: &gtk::GestureDrag, dx: f64, dy: f64| {
                let (x, y) = gesture.start_point().unwrap_or_default();
                gtk_backend().map(|gtk| gtk.pointer(&widget, x + dx, y + dy))
            }
        };
        // Translation and velocity are counted in the window: the view may be following the pointer.
        let pan = move |drag: &Drag, state: &str, pointer: &PointerEvent| {
            let (ox, oy) = drag.origin.get();
            let now = Instant::now();
            if let Some((lx, ly, then)) = drag.last.get() {
                let seconds = now.duration_since(then).as_secs_f64();
                if seconds > 0.001 {
                    drag.velocity.set(((pointer.page_x - lx) / seconds, (pointer.page_y - ly) / seconds));
                }
            }
            drag.last.set(Some((pointer.page_x, pointer.page_y, now)));
            let (velocity_x, velocity_y) = drag.velocity.get();
            host::pan(view, PanEvent { state: state.into(), translation_x: pointer.page_x - ox, translation_y: pointer.page_y - oy, velocity_x, velocity_y, x: pointer.x, y: pointer.y });
        };
        gesture.connect_drag_begin({
            let (drag, at) = (drag.clone(), at.clone());
            move |gesture, _, _| {
                let Some(pointer) = at(gesture, 0.0, 0.0) else { return };
                drag.panning.set(false);
                drag.last.set(None);
                drag.velocity.set((0.0, 0.0));
                drag.origin.set((pointer.page_x, pointer.page_y));
                // The press state (and pointerDown) come from here even when only a pan was asked for.
                host::pointer(view, PointerPhase::Down, pointer);
            }
        });
        gesture.connect_drag_update({
            let (drag, at) = (drag.clone(), at.clone());
            move |gesture, dx, dy| {
                let Some(pointer) = at(gesture, dx, dy) else { return };
                if drag.pointers.get() {
                    host::pointer(view, PointerPhase::Move, pointer);
                }
                if !drag.pan.get() {
                    return;
                }
                let (ox, oy) = drag.origin.get();
                if drag.panning.get() {
                    pan(&drag, "move", &pointer);
                } else if (pointer.page_x - ox).abs().max((pointer.page_y - oy).abs()) > SLOP {
                    // The translation counts from where the drag was recognized, so the view does
                    // not jump; and the drag is this view's: no click, no scrolling under it.
                    drag.panning.set(true);
                    drag.origin.set((pointer.page_x, pointer.page_y));
                    gesture.set_state(gtk::EventSequenceState::Claimed);
                    pan(&drag, "start", &pointer);
                }
            }
        });
        let finish = move |gesture: &gtk::GestureDrag, dx: f64, dy: f64, cancelled: bool| {
            let Some(pointer) = at(gesture, dx, dy) else { return };
            host::pointer(view, if cancelled { PointerPhase::Cancel } else { PointerPhase::Up }, pointer);
            if drag.panning.replace(false) {
                pan(&drag, if cancelled { "cancel" } else { "end" }, &pointer);
            }
        };
        gesture.connect_drag_end({
            let finish = finish.clone();
            move |gesture, dx, dy| finish(gesture, dx, dy, false)
        });
        gesture.connect_cancel(move |gesture, _| {
            let (dx, dy) = gesture.offset().unwrap_or_default();
            finish(gesture, dx, dy, true)
        });
        widget.add_controller(gesture);
    }

    /// Ctrl + wheel as a pinch, for a desktop without a touchpad: each notch scales by a tenth,
    /// and the gesture ends when the wheel rests.
    fn wheel_pinch(&self, view: ViewId, widget: &NucloView) {
        let wheel = gtk::EventControllerScroll::new(gtk::EventControllerScrollFlags::VERTICAL);
        let scale = Rc::new(Cell::new(1.0f64));
        let rest: Rc<RefCell<Option<glib::SourceId>>> = Rc::default();
        wheel.connect_scroll(move |controller, _, dy| {
            if !controller.current_event_state().contains(gdk::ModifierType::CONTROL_MASK) {
                return glib::Propagation::Proceed;
            }
            let event = |state: &str, scale: f64| host::pinch(view, PinchEvent { state: state.into(), scale, focal_x: 0.0, focal_y: 0.0 });
            match rest.take() {
                Some(pending) => pending.remove(),
                None => {
                    scale.set(1.0);
                    event("start", 1.0);
                }
            }
            scale.set(scale.get() * (1.0 - dy * 0.1).max(0.1));
            event("move", scale.get());
            let (scale, done) = (scale.clone(), rest.clone());
            *rest.borrow_mut() = Some(glib::timeout_add_local_once(Duration::from_millis(250), move || {
                done.take();
                host::pinch(view, PinchEvent { state: "end".into(), scale: scale.get(), focal_x: 0.0, focal_y: 0.0 });
            }));
            glib::Propagation::Stop
        });
        widget.add_controller(wheel);
    }
}

/// A debugging aid, as a Wayland window can't be captured from outside without the user's
/// consent: with `NUCLO_SCREENSHOT=file.png` set, the file holds what the window shows, and is
/// written again whenever it is deleted.
fn screenshot(window: &adw::ApplicationWindow, path: &str) {
    let snapshot = gtk::Snapshot::new();
    gtk::WidgetPaintable::new(Some(window)).snapshot(&snapshot, window.width() as f64, window.height() as f64);
    if let (Some(node), Some(renderer)) = (snapshot.to_node(), window.renderer()) {
        if let Err(error) = renderer.render_texture(&node, None).save_to_png(path) {
            eprintln!("nuclo: could not save {path}: {error}");
        }
    }
}

/// Opens the window and runs `entry` (the app's top-level code) in it.
pub fn run(entry: fn()) {
    let app = adw::Application::builder().application_id("dev.nuclo.app").flags(gio::ApplicationFlags::NON_UNIQUE).build();
    app.connect_activate(move |app| {
        // Screens are white with black text unless the app says otherwise, as on the other platforms.
        adw::StyleManager::default().set_color_scheme(adw::ColorScheme::ForceLight);
        let provider = gtk::CssProvider::new();
        provider.load_from_string(CSS);
        // nuclo-native-ns: above the user's theme (~/.config/gtk-4.0/gtk.css), so the app looks as designed on every desktop.
        gtk::style_context_add_provider_for_display(&gdk::Display::default().expect("no display"), &provider, gtk::STYLE_PROVIDER_PRIORITY_USER + 1);

        let layers = gtk::Overlay::new();
        let window = adw::ApplicationWindow::builder().application(app).default_width(420).default_height(780).content(&layers).build();
        let gtk = Rc::new(Gtk {
            window: window.clone(),
            layers,
            views: RefCell::default(),
            next_view: Cell::new(1),
            roots: RefCell::default(),
            navigation: RefCell::new(None),
            pages: RefCell::default(),
            dialogs: RefCell::default(),
            timers: RefCell::default(),
            next_timer: Cell::new(1),
            frames: RefCell::default(),
            tick: RefCell::new(None),
            frame_pending: Cell::new(false),
            after_frame: RefCell::default(),
            css: provider,
            placeholders: RefCell::default(),
        });
        GTK.with(|slot| *slot.borrow_mut() = Some(gtk.clone()));
        window.connect_realize(|window| {
            if let Some(clock) = window.frame_clock() {
                clock.connect_after_paint(|_| {
                    if let Some(gtk) = gtk_backend() {
                        gtk.frame_done();
                    }
                });
            }
        });
        if let Ok(path) = std::env::var("NUCLO_SCREENSHOT") {
            let window = window.clone();
            glib::timeout_add_local(Duration::from_millis(200), move || {
                if !std::path::Path::new(&path).exists() {
                    screenshot(&window, &path);
                }
                glib::ControlFlow::Continue
            });
        }
        crate::nuclo::start(gtk);
        entry();
        window.present();
    });
    app.run();
}
