//! The interface between the core and a UI toolkit. A backend (GTK 4 in `gtk_backend.rs`; GPUI
//! in `../rust-gpui`) implements `Backend` and installs it with `nuclo::start(backend)` before
//! the app's entry point runs. Everything else — the node tree, bindings, reconciliation, styles and
//! their transitions, the flex layout, the router's stacks, async — is the core's and knows no
//! toolkit.
//!
//! The core drives the backend:
//!   * views: `create` one per node (`Kind` says which control; `adopt` for a view the app's
//!     own platform code made), `set_children` when a box's views change, `paint` when its look
//!     changes, `set_text` / `set_value` / … for content, `destroy` when the node goes. A view
//!     is addressed by the `ViewId` the backend returned; the core never sees a widget.
//!   * layout: the core computes every rectangle (`flex.rs`) and hands each view its frame,
//!     relative to its parent view's content, with `set_frame`. For that it asks the backend
//!     for the one thing it cannot know: the size of text and native controls (`measure`).
//!   * animation: a transition is the core painting the values in between, once per frame
//!     (`request_frame`). The backend only ever applies a `Paint`.
//!   * input: `listen` asks a view to report a kind of input from then on.
//!   * windows: `show_screen` (the app's main view), `show_overlay` (a layer over everything
//!     that lets the pointer through where it has no view) and the `nav_*` calls, which mirror
//!     the router's stacks into the platform's own navigation.
//!   * the main loop: `set_timer` / `clear_timer`, `request_frame` / `cancel_frame`, and
//!     `waker`, a function any thread may call to have the UI thread run `host::wake()`.
//!
//! The backend calls back into `host` (below), always on the UI thread:
//!   * `host::measure_root` / `host::layout_root` from its layout pass, for each root view it
//!     was given (`show_screen`, `show_overlay`, `nav_push`…), after `request_layout` or a resize;
//!   * `host::event`, `host::pointer`, `host::pan`, `host::pinch`, `host::key`, `host::hover`
//!     and `host::scrolled` for the input a view was asked to report;
//!   * `host::nav_popped` / `host::nav_tab_selected` when a screen leaves a stack or the user
//!     picks a tab, so the router's stacks follow;
//!   * `host::wake` after `waker` was called.

use std::any::Any;
use std::rc::Rc;
use std::sync::Arc;

use super::style::{Color, FontFamily, TextAlign, TextDecoration};

pub type ViewId = u32;

/// A view made by the app's platform code (`native<P>()`): for the GTK backend, a `gtk::Widget`;
/// for the GPUI backend, a `gpui_backend::Draw`.
pub type NativeView = Rc<dyn Any>;

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Kind {
    /// A container of other views. Draws only its `Paint`.
    Box,
    /// Wrapping text.
    Text,
    /// Text that is pressed: centred, with the platform's press and focus behaviour.
    Button,
    /// A single-line text field.
    Input,
    Checkbox,
    /// A multi-line text field.
    Textarea,
    Image,
    /// A view the app's platform code made (`adopt`).
    Native,
}

/// A frame in whole pixels, relative to the parent view's content.
#[derive(Clone, Copy, PartialEq, Default, Debug)]
pub struct Rect {
    pub x: i32,
    pub y: i32,
    pub w: i32,
    pub h: i32,
}

#[derive(Clone, Copy, PartialEq, Debug)]
pub struct Shadow {
    pub color: Color,
    /// The blur radius, as CSS counts it.
    pub blur: f32,
    pub dx: f32,
    pub dy: f32,
}

/// How a view's text is drawn. `measure` uses the one last painted.
#[derive(Clone, Copy, PartialEq, Debug)]
pub struct TextPaint {
    pub font_size: f32,
    pub bold: bool,
    pub italic: bool,
    pub font_family: FontFamily,
    /// The height of a line in px, when the style sets one.
    pub line_height: Option<f32>,
    pub letter_spacing: f32,
    pub decoration: TextDecoration,
    pub color: Color,
    pub align: TextAlign,
    /// Text is cut with an ellipsis after this many lines.
    pub lines: Option<u32>,
}

/// How a view looks: its computed style, resolved to what a toolkit draws.
#[derive(Clone, Copy, PartialEq, Debug)]
pub struct Paint {
    pub background: Option<Color>,
    pub border_width: f32,
    pub border_color: Color,
    pub radius: f32,
    /// Children are clipped to the rounded box.
    pub clip: bool,
    /// Drawn outside the box, under it.
    pub shadow: Option<Shadow>,
    pub opacity: f32,
    /// `display: none` hides the view; it also has no frame.
    pub visible: bool,
    /// The view takes the pointer over what is under it even without a listener (a modal's scrim).
    pub blocks_pointer: bool,
    /// Applied after layout, around the box's centre: translate, then rotate (degrees, clockwise), then scale.
    pub translate: (f32, f32),
    pub rotate: f32,
    pub scale: f32,
    pub text: TextPaint,
    /// Padding plus border: top, right, bottom, left. The content (text, field) is drawn inside.
    pub insets: [f32; 4],
}

#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug)]
pub enum Event {
    Click,
    /// The text of a field changed.
    Input,
    /// A field was committed (Enter) or a checkbox toggled.
    Change,
    Focus,
    Blur,
}

/// The input a view can be asked to report (`Backend::listen`).
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Input {
    /// `host::event(view, Event::Click)`.
    Click,
    /// `host::pointer` with Down, Move (while down), Up and Cancel.
    Pointer,
    /// `host::pan`: a drag, once it leaves the platform's drag threshold. The view keeps it: a
    /// scrolling parent does not scroll meanwhile.
    Pan,
    /// `host::pinch`: two fingers, or ctrl + wheel.
    Pinch,
    /// `host::pointer` with LongPress.
    LongPress,
    /// `host::pointer` with DoubleClick.
    DoubleClick,
    /// `host::hover`.
    Hover,
    /// `host::key`; a box becomes focusable for it.
    Keys,
    /// `host::scrolled`, for a view made scrollable.
    Scroll,
}

#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug)]
pub enum PointerPhase {
    Down,
    Move,
    Up,
    Cancel,
    LongPress,
    DoubleClick,
}

/// A pointer on a view, in px: `x`/`y` from the view's top-left corner, `page_x`/`page_y` from the window's.
#[derive(Clone, Copy, Debug)]
pub struct PointerEvent {
    pub x: f64,
    pub y: f64,
    pub page_x: f64,
    pub page_y: f64,
    pub pointer_id: i64,
}

/// `state` is "start", "move", "end" or "cancel" (as the app compares it).
#[derive(Clone, Debug)]
pub struct PanEvent {
    pub state: String,
    /// From where the drag was recognized.
    pub translation_x: f64,
    pub translation_y: f64,
    /// Px per second.
    pub velocity_x: f64,
    pub velocity_y: f64,
    pub x: f64,
    pub y: f64,
}

#[derive(Clone, Debug)]
pub struct PinchEvent {
    pub state: String,
    /// 1 when the gesture starts.
    pub scale: f64,
    pub focal_x: f64,
    pub focal_y: f64,
}

#[derive(Clone, Copy, Debug)]
pub struct ScrollEvent {
    pub scroll_top: f64,
    pub scroll_left: f64,
    pub scroll_height: f64,
    pub scroll_width: f64,
    pub client_height: f64,
    pub client_width: f64,
}

#[derive(Clone, Debug)]
pub struct KeyboardEvent {
    /// As in the DOM: "Enter", "Escape", "ArrowLeft", "a"…
    pub key: String,
}

pub struct TabInfo {
    pub title: String,
    /// A semantic name: home, list, cloud, star, person, settings, search.
    pub icon: String,
}

/// A screen of the navigation.
pub struct Screen<'a> {
    pub root: ViewId,
    pub title: &'a str,
    /// Presented over the stack with the platform's sheet or dialog.
    pub modal: bool,
    /// `false` hides the navigation bar on this screen.
    pub header: bool,
}

pub trait Backend {
    fn create(&self, kind: Kind) -> ViewId;
    /// Takes a view the app's platform code made as a `Kind::Native` view.
    fn adopt(&self, native: NativeView) -> ViewId;
    fn destroy(&self, view: ViewId);
    /// `children` in order. Only views that arrive or leave need touching: frames place them.
    fn set_children(&self, parent: ViewId, children: &[ViewId]);
    /// The drawing (and hit) order of `parent`'s children, lowest first, when `zIndex` changes it.
    fn reorder(&self, parent: ViewId, children: &[ViewId]);
    fn set_frame(&self, view: ViewId, frame: Rect);
    fn paint(&self, view: ViewId, kind: Kind, paint: &Paint);

    /// The content size of a view that is not a box, without `Paint::insets`: text wrapped at
    /// `max_width` (its unwrapped width when that is smaller), a control's natural size.
    fn measure(&self, view: ViewId, max_width: f32) -> (f32, f32);

    /// Makes a box scroll its children, along one axis, with the platform's own scrolling.
    /// Called before the box gets children; its children's frames are then relative to the
    /// scrolled content, whose size `set_content_size` gives.
    fn make_scrollable(&self, view: ViewId, horizontal: bool);
    fn set_content_size(&self, view: ViewId, width: i32, height: i32);

    fn set_text(&self, view: ViewId, text: &str);
    fn set_value(&self, view: ViewId, text: &str);
    fn set_placeholder(&self, view: ViewId, text: &str);
    fn set_checked(&self, view: ViewId, checked: bool);
    fn set_enabled(&self, view: ViewId, enabled: bool);
    /// "text", "password", "email" or "number".
    fn set_input_type(&self, view: ViewId, input_type: &str);
    /// An encoded image (PNG, JPEG…), already downloaded by the core.
    fn set_image(&self, view: ViewId, bytes: &[u8]);
    /// What assistive technology reads for the view.
    fn set_label(&self, view: ViewId, label: &str);
    /// A control's state: its text and whether it is checked.
    fn control_state(&self, view: ViewId) -> (String, bool);
    /// The view reports this kind of input from now on.
    fn listen(&self, view: ViewId, input: Input);
    /// Opens a link with the platform (the browser, or the app that owns the URL).
    fn open_url(&self, url: &str);

    /// Shows `root` as the app's main view: as wide as the window, as tall as its content or the
    /// window, scrolling vertically (unless `root` was made scrollable itself: then it fills the window).
    fn show_screen(&self, root: ViewId);
    /// Shows `root` over everything, the size of the window.
    fn show_overlay(&self, root: ViewId);
    /// The roots' frames are stale: run a layout pass soon (the backend calls `host::layout_root`).
    fn request_layout(&self);

    /// Builds the navigation: one stack per tab (a single stack without a tab bar when `tabs` is
    /// empty), `active` selected.
    fn nav_create(&self, tabs: &[TabInfo], active: usize);
    /// Puts a screen on top of `tab`'s stack, sliding in when `animated`.
    fn nav_push(&self, tab: usize, screen: &Screen, animated: bool);
    /// Removes the top screen of `tab`'s stack.
    fn nav_pop(&self, tab: usize, animated: bool);
    /// Makes `screen` the only screen of `tab`'s stack.
    fn nav_replace(&self, tab: usize, screen: &Screen);
    fn nav_select_tab(&self, tab: usize);

    /// Runs `callback` once on the UI thread after `ms` milliseconds, and after the frame that
    /// shows what changed before it was due (apps time a frame with `setTimeout(…, 0)`).
    fn set_timer(&self, ms: u64, callback: Box<dyn FnOnce()>) -> u64;
    fn clear_timer(&self, timer: u64);
    /// Runs `callback` once, before the next frame is drawn.
    fn request_frame(&self, callback: Box<dyn FnOnce()>) -> u64;
    fn cancel_frame(&self, frame: u64);
    /// Callable from any thread: makes the UI thread call `host::wake()`.
    fn waker(&self) -> Arc<dyn Fn() + Send + Sync>;

    // Services of the platform. A native backend leaves them: the core uses the operating
    // system's clock, console and sockets itself. The web host has none of those in its sandbox.

    /// The time in milliseconds since the epoch, as `Date.now()` counts it.
    fn now(&self) -> f64 {
        std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_or(0.0, |t| t.as_millis() as f64)
    }
    /// A line of the app's log: `console.log`, or an error nobody caught.
    fn log(&self, line: &str, error: bool) {
        if error {
            eprintln!("{line}");
        } else {
            println!("{line}");
        }
    }
    /// An HTTP exchange the platform makes (only asked on the web host): `done` gets the status and body.
    fn http(&self, _request: HttpRequest, done: Box<dyn FnOnce(Result<(i64, Vec<u8>), String>)>) {
        done(Err("This platform has no network access.".into()));
    }
    /// Shows the image at `url` in an image view, if the platform fetches images itself (a browser does,
    /// without the cross-origin rules of `http`). `false`: the core downloads the bytes, for `set_image`.
    fn set_image_url(&self, _view: ViewId, _url: &str) -> bool {
        false
    }
    /// Calls the platform's own function `name` (the app's `declare function`, where it is not written in
    /// Rust: the web host's) with `args`, a JSON array, and returns what it returned as JSON.
    fn call_sync(&self, name: &str, _args: &str) -> Result<String, String> {
        Err(format!("{name}: this platform has no function of that name"))
    }
    /// The same for a function that returns a promise: `done` gets the result once it settles.
    fn call(&self, name: &str, _args: &str, done: Box<dyn FnOnce(Result<String, String>)>) {
        done(Err(format!("{name}: this platform has no function of that name")));
    }
}

/// What `fetch()` sends.
pub struct HttpRequest {
    pub method: String,
    pub url: String,
    pub headers: Vec<(String, String)>,
    pub body: Option<String>,
}

thread_local!(static BACKEND: std::cell::RefCell<Option<Rc<dyn Backend>>> = const { std::cell::RefCell::new(None) });

pub(crate) fn install(backend: Rc<dyn Backend>) {
    BACKEND.with(|b| *b.borrow_mut() = Some(backend));
}

/// `Date.now()`, through the backend once there is one.
pub(crate) fn now() -> f64 {
    match BACKEND.with(|b| b.borrow().clone()) {
        Some(backend) => backend.now(),
        None => std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_or(0.0, |t| t.as_millis() as f64),
    }
}

pub(crate) fn backend() -> Rc<dyn Backend> {
    BACKEND.with(|b| b.borrow().clone()).expect("nuclo::start(backend) was not called")
}

/// What a backend calls.
pub mod host {
    use super::{Event, KeyboardEvent, PanEvent, PinchEvent, PointerEvent, PointerPhase, ScrollEvent, ViewId};
    use crate::nuclo::{node, router, task};

    /// The natural height of a root view laid out `width` wide.
    pub fn measure_root(root: ViewId, width: f32) -> f32 {
        node::measure_root(root, width)
    }

    /// Lays out a root view in `width` × `height`: every view under it gets its frame.
    pub fn layout_root(root: ViewId, width: f32, height: f32) {
        node::layout_root(root, width, height)
    }

    pub fn event(view: ViewId, event: Event) {
        node::dispatch(view, event)
    }

    pub fn pointer(view: ViewId, phase: PointerPhase, pointer: PointerEvent) {
        node::pointer(view, phase, pointer)
    }

    pub fn pan(view: ViewId, pan: PanEvent) {
        node::deliver(view, |node| node.on_pan.borrow().clone(), pan)
    }

    pub fn pinch(view: ViewId, pinch: PinchEvent) {
        node::deliver(view, |node| node.on_pinch.borrow().clone(), pinch)
    }

    pub fn key(view: ViewId, key: &str) {
        node::deliver(view, |node| node.on_key.borrow().clone(), KeyboardEvent { key: key.to_string() })
    }

    pub fn scrolled(view: ViewId, scroll: ScrollEvent) {
        node::deliver(view, |node| node.on_scroll.borrow().clone(), scroll)
    }

    /// The pointer came over the view, or left it.
    pub fn hover(view: ViewId, over: bool) {
        node::hover(view, over)
    }

    /// The screen `root` left `tab`'s stack. Report every pop, the user's (back button, swipe,
    /// a dismissed sheet) and the ones `nav_pop` asked for: the router ignores those it knows.
    pub fn nav_popped(tab: usize, root: ViewId) {
        router::popped(tab, root)
    }

    pub fn nav_tab_selected(tab: usize) {
        router::tab_selected(tab)
    }

    pub fn wake() {
        task::run_ready()
    }
}
