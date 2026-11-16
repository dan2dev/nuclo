//! The web host: the core's backend for a browser tab, compiled to WebAssembly.
//!
//! Everything that is not the DOM happens here, in Rust: the node tree, the bindings, the
//! reconciliation, the style transitions and the flex layout are the core's, the same code that
//! runs on Linux. What is left for the page is `host.ts`: one DOM element per view, put at the
//! frame the core computed, painted with the CSS this file writes, and measured with the
//! browser's own text layout. The two meet at the `nuclo` imports below and the `nuclo_*`
//! exports at the end; a view is the `ViewId` this side hands out, and the page keeps its element
//! under the same number.
//!
//! There is no `wasm-bindgen`: the interface is plain numbers, and strings as a pointer and a length
//! into the module's memory (`nuclo_alloc` is where the page puts the ones it sends).

#![allow(dead_code)] // An app uses the part of the host it needs: the platform code's calls only if it has any.

use std::cell::{Cell, RefCell};
use std::collections::HashMap;
use std::fmt::Write;
use std::rc::Rc;
use std::sync::Arc;

use serde_json::Value as Json;

use crate::nuclo::backend::{host, Backend, Event, HttpRequest, Input, Kind, NativeView, Paint, PanEvent, PinchEvent, PointerEvent, PointerPhase, Rect, Screen, ScrollEvent, TabInfo, TextPaint, ViewId};
use crate::nuclo::prelude::{Color, FontFamily, ObjectFit, TextAlign, TextDecoration};

#[link(wasm_import_module = "nuclo")]
extern "C" {
    fn view_create(id: u32, kind: u32);
    fn view_destroy(id: u32);
    fn view_children(parent: u32, ids: *const u32, len: usize);
    fn view_reorder(parent: u32, ids: *const u32, len: usize);
    fn view_frame(id: u32, x: i32, y: i32, w: i32, h: i32);
    fn view_style(id: u32, css: *const u8, len: usize);
    fn view_text_style(id: u32, css: *const u8, len: usize);
    fn view_measure(id: u32, max_width: f32, out: *mut f32);
    fn view_scrollable(id: u32, horizontal: u32);
    fn view_content_size(id: u32, w: i32, h: i32);
    fn view_text(id: u32, text: *const u8, len: usize);
    fn view_value(id: u32, text: *const u8, len: usize);
    fn view_placeholder(id: u32, text: *const u8, len: usize);
    fn view_input_type(id: u32, text: *const u8, len: usize);
    fn view_label(id: u32, text: *const u8, len: usize);
    fn view_image_url(id: u32, url: *const u8, len: usize);
    fn view_image(id: u32, bytes: *const u8, len: usize);
    fn view_checked(id: u32, on: u32);
    fn view_enabled(id: u32, on: u32);
    fn view_listen(id: u32, input: u32);
    fn open_url(url: *const u8, len: usize);
    fn screen_show(root: u32);
    fn overlay_show(root: u32);
    fn layout_request();
    fn viewport_width() -> f64;
    fn nav_create(tabs: *const u8, len: usize, active: u32);
    fn nav_push(tab: u32, root: u32, title: *const u8, len: usize, flags: u32);
    fn nav_pop(tab: u32, animated: u32);
    fn nav_replace(tab: u32, root: u32, title: *const u8, len: usize, flags: u32);
    fn nav_select(tab: u32);
    fn timer_set(id: u32, ms: f64);
    fn timer_clear(id: u32);
    fn frame_request(id: u32);
    fn frame_cancel(id: u32);
    fn wake();
    fn now() -> f64;
    fn log(line: *const u8, len: usize, error: u32);
    fn view_adopt(id: u32, handle: u32);
    fn native_create(name: *const u8, len: usize) -> u32;
    fn native_update(handle: u32, json: *const u8, len: usize);
    fn native_destroy(handle: u32);
    fn native_call_sync(name: *const u8, name_len: usize, args: *const u8, args_len: usize, out: *mut u32);
    fn native_call(id: u32, name: *const u8, name_len: usize, args: *const u8, args_len: usize);
    fn http(id: u32, method: *const u8, method_len: usize, url: *const u8, url_len: usize, headers: *const u8, headers_len: usize, body: *const u8, body_len: usize, has_body: u32);
}

type Bytes = (*const u8, usize);

fn bytes(text: &str) -> Bytes {
    (text.as_ptr(), text.len())
}

/// `flags` of `nav_push` and `nav_replace`.
fn screen_flags(screen: &Screen, animated: bool) -> u32 {
    screen.modal as u32 | (screen.header as u32) << 1 | (animated as u32) << 2
}

#[derive(Default)]
struct Web {
    next_view: Cell<ViewId>,
    next_callback: Cell<u32>,
    timers: RefCell<HashMap<u32, Box<dyn FnOnce()>>>,
    frames: RefCell<HashMap<u32, Box<dyn FnOnce()>>>,
    requests: RefCell<HashMap<u32, Box<dyn FnOnce(Result<(i64, Vec<u8>), String>)>>>,
    /// Calls of the page's functions that have not settled.
    calls: RefCell<HashMap<u32, Box<dyn FnOnce(Result<String, String>)>>>,
    /// What a native component's page code calls back (`platform::Props::callback`), by `handle * 64 + index`.
    callbacks: RefCell<HashMap<u32, Rc<dyn Fn(&[Json])>>>,
    /// What the page last reported of each field: its text, and whether a checkbox is on.
    controls: RefCell<HashMap<ViewId, (String, bool)>>,
    /// What each view was last painted with, so a repaint that changes nothing costs nothing.
    painted: RefCell<HashMap<ViewId, (Paint, Kind)>>,
}

thread_local!(static WEB: Rc<Web> = Rc::new(Web::default()));

fn web() -> Rc<Web> {
    WEB.with(Rc::clone)
}

impl Web {
    fn callback_id(&self) -> u32 {
        self.next_callback.replace(self.next_callback.get() + 1)
    }
}

fn rgba(color: Color) -> String {
    let [r, g, b, a] = color.rgba();
    format!("rgba({},{},{},{})", (r * 255.0).round(), (g * 255.0).round(), (b * 255.0).round(), (a * 1000.0).round() / 1000.0)
}

/// The box: its fill, border, clip, shadow, transform, and the padding its content sits inside.
/// A border is inset shadows (one per side), not a CSS border: the core's frames count from the
/// box's outer edge, and a child is positioned from the padding edge.
fn box_css(kind: Kind, paint: &Paint) -> String {
    let mut css = String::new();
    if !paint.visible {
        css.push_str("display:none;");
    }
    if let Some(background) = paint.background {
        let _ = write!(css, "background-color:{};", rgba(background));
    }
    if paint.radius > 0.0 {
        let _ = write!(css, "border-radius:{}px;", paint.radius);
    }
    if paint.clip {
        css.push_str("overflow:hidden;");
    }
    let mut shadows = Vec::new();
    if let Some(shadow) = paint.shadow {
        shadows.push(format!("{}px {}px {}px {}", shadow.dx, shadow.dy, shadow.blur, rgba(shadow.color)));
    }
    let [top, right, bottom, left] = paint.borders;
    let colors = paint.border_colors;
    if paint.borders.iter().all(|width| *width == top) && colors.iter().all(|color| *color == colors[0]) {
        if top > 0.0 {
            shadows.push(format!("inset 0 0 0 {top}px {}", rgba(colors[0])));
        }
    } else {
        // A side is an inset shadow moved in from that edge; the corners are where two overlap.
        let sides = [(0.0, top, colors[0]), (-right, 0.0, colors[1]), (0.0, -bottom, colors[2]), (left, 0.0, colors[3])];
        for (x, y, color) in sides.into_iter().filter(|(x, y, _)| *x != 0.0 || *y != 0.0) {
            shadows.push(format!("inset {x}px {y}px 0 0 {}", rgba(color)));
        }
    }
    if !shadows.is_empty() {
        let _ = write!(css, "box-shadow:{};", shadows.join(","));
    }
    if paint.opacity < 1.0 {
        let _ = write!(css, "opacity:{};", paint.opacity.clamp(0.0, 1.0));
    }
    if paint.translate != (0.0, 0.0) || paint.rotate != 0.0 || paint.scale != 1.0 {
        let _ = write!(css, "transform:translate({}px,{}px) rotate({}deg) scale({});", paint.translate.0, paint.translate.1, paint.rotate, paint.scale);
    }
    if paint.blocks_pointer {
        css.push_str("pointer-events:auto;");
    }
    if !paint.pointer {
        // Over the `pointer-events:auto` a listener adds after this.
        css.push_str("pointer-events:none!important;");
    }
    if kind == Kind::Image {
        css.push_str(match paint.fit {
            ObjectFit::Cover => "",
            ObjectFit::Contain => "object-fit:contain;",
            ObjectFit::Fill => "object-fit:fill;",
        });
    }
    if !matches!(kind, Kind::Box | Kind::Image | Kind::Checkbox | Kind::Native) {
        let [top, right, bottom, left] = paint.insets;
        let _ = write!(css, "padding:{top}px {right}px {bottom}px {left}px;");
    }
    css
}

fn text_css(text: &TextPaint) -> String {
    let family = match text.font_family {
        FontFamily::SansSerif => "system-ui,sans-serif",
        FontFamily::Serif => "serif",
        FontFamily::Monospace => "ui-monospace,monospace",
    };
    let mut css = format!("font:{} {} {}px {};color:{};", if text.italic { "italic" } else { "normal" }, text.weight.css(), text.font_size, family, rgba(text.color));
    // `font` above resets the line height: it comes after.
    match text.line_height {
        Some(height) => {
            let _ = write!(css, "line-height:{height}px;");
        }
        None => css.push_str("line-height:normal;"),
    }
    if text.letter_spacing != 0.0 {
        let _ = write!(css, "letter-spacing:{}px;", text.letter_spacing);
    }
    css.push_str(match text.decoration {
        TextDecoration::None => "",
        TextDecoration::Underline => "text-decoration:underline;",
        TextDecoration::LineThrough => "text-decoration:line-through;",
    });
    css.push_str(match text.align {
        TextAlign::Left => "text-align:left;",
        TextAlign::Center => "text-align:center;",
        TextAlign::Right => "text-align:right;",
    });
    if let Some(color) = text.placeholder {
        let _ = write!(css, "--ph:{};", rgba(color));
    }
    if let Some(lines) = text.lines {
        let _ = write!(css, "display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:{lines};overflow:hidden;");
    }
    css
}

fn kind_code(kind: Kind) -> u32 {
    match kind {
        Kind::Box => 0,
        Kind::Text => 1,
        Kind::Button => 2,
        Kind::Input => 3,
        Kind::Checkbox => 4,
        Kind::Textarea => 5,
        Kind::Image => 6,
        Kind::Native => 7,
    }
}

impl Backend for Web {
    fn create(&self, kind: Kind) -> ViewId {
        let id = self.next_view.replace(self.next_view.get() + 1);
        unsafe { view_create(id, kind_code(kind)) };
        id
    }

    fn adopt(&self, native: NativeView) -> ViewId {
        let handle = native.downcast_ref::<platform::Handle>().expect("a native component of the wasm host is made by platform::create").0;
        let id = self.next_view.replace(self.next_view.get() + 1);
        unsafe { view_adopt(id, handle) };
        id
    }

    fn destroy(&self, view: ViewId) {
        self.controls.borrow_mut().remove(&view);
        self.painted.borrow_mut().remove(&view);
        unsafe { view_destroy(view) };
    }

    fn set_children(&self, parent: ViewId, children: &[ViewId]) {
        unsafe { view_children(parent, children.as_ptr(), children.len()) };
    }

    fn reorder(&self, parent: ViewId, children: &[ViewId]) {
        unsafe { view_reorder(parent, children.as_ptr(), children.len()) };
    }

    fn set_frame(&self, view: ViewId, frame: Rect) {
        unsafe { view_frame(view, frame.x, frame.y, frame.w, frame.h) };
    }

    fn paint(&self, view: ViewId, kind: Kind, paint: &Paint) {
        let before = self.painted.borrow_mut().insert(view, (*paint, kind));
        if before.map(|(before, _)| before) == Some(*paint) {
            return;
        }
        let css = box_css(kind, paint);
        unsafe { view_style(view, css.as_ptr(), css.len()) };
        if before.map(|(before, _)| before.text) != Some(paint.text) {
            let css = text_css(&paint.text);
            unsafe { view_text_style(view, css.as_ptr(), css.len()) };
        }
    }

    fn measure(&self, view: ViewId, max_width: f32) -> (f32, f32) {
        let mut size = [0.0f32; 2];
        unsafe { view_measure(view, max_width, size.as_mut_ptr()) };
        (size[0], size[1])
    }

    fn make_scrollable(&self, view: ViewId, horizontal: bool) {
        unsafe { view_scrollable(view, horizontal as u32) };
    }

    fn set_content_size(&self, view: ViewId, width: i32, height: i32) {
        unsafe { view_content_size(view, width, height) };
    }

    fn set_text(&self, view: ViewId, text: &str) {
        let (ptr, len) = bytes(text);
        unsafe { view_text(view, ptr, len) };
    }

    fn set_value(&self, view: ViewId, text: &str) {
        self.controls.borrow_mut().entry(view).or_default().0 = text.to_string();
        let (ptr, len) = bytes(text);
        unsafe { view_value(view, ptr, len) };
    }

    fn set_placeholder(&self, view: ViewId, text: &str) {
        let (ptr, len) = bytes(text);
        unsafe { view_placeholder(view, ptr, len) };
    }

    fn set_checked(&self, view: ViewId, checked: bool) {
        self.controls.borrow_mut().entry(view).or_default().1 = checked;
        unsafe { view_checked(view, checked as u32) };
    }

    fn set_enabled(&self, view: ViewId, enabled: bool) {
        unsafe { view_enabled(view, enabled as u32) };
    }

    fn set_input_type(&self, view: ViewId, input_type: &str) {
        let (ptr, len) = bytes(input_type);
        unsafe { view_input_type(view, ptr, len) };
    }

    fn set_image(&self, view: ViewId, data: &[u8]) {
        unsafe { view_image(view, data.as_ptr(), data.len()) };
    }

    fn set_label(&self, view: ViewId, label: &str) {
        let (ptr, len) = bytes(label);
        unsafe { view_label(view, ptr, len) };
    }

    fn control_state(&self, view: ViewId) -> (String, bool) {
        let (text, checked) = self.controls.borrow().get(&view).cloned().unwrap_or_default();
        // As on the other backends, a switch's text is "on" when it is on.
        if checked { ("on".into(), true) } else { (text, false) }
    }

    fn listen(&self, view: ViewId, input: Input) {
        let code = match input {
            Input::Click => 0,
            Input::Pointer => 1,
            Input::Pan => 2,
            Input::Pinch => 3,
            Input::LongPress => 4,
            Input::DoubleClick => 5,
            Input::Hover => 6,
            Input::Keys => 7,
            Input::Scroll => 8,
        };
        unsafe { view_listen(view, code) };
    }

    fn open_url(&self, url: &str) {
        let (ptr, len) = bytes(url);
        unsafe { open_url(ptr, len) };
    }

    fn show_screen(&self, root: ViewId) {
        unsafe { screen_show(root) };
    }

    fn show_overlay(&self, root: ViewId) {
        unsafe { overlay_show(root) };
    }

    fn request_layout(&self) {
        unsafe { layout_request() };
    }

    fn window_width(&self) -> f32 {
        unsafe { viewport_width() as f32 }
    }

    fn nav_create(&self, tabs: &[TabInfo], active: usize) {
        let list = tabs.iter().map(|tab| format!("{}\t{}", tab.title, tab.icon)).collect::<Vec<_>>().join("\n");
        let (ptr, len) = bytes(&list);
        unsafe { nav_create(ptr, len, active as u32) };
    }

    fn nav_push(&self, tab: usize, screen: &Screen, animated: bool) {
        let (ptr, len) = bytes(screen.title);
        unsafe { nav_push(tab as u32, screen.root, ptr, len, screen_flags(screen, animated)) };
    }

    fn nav_pop(&self, tab: usize, animated: bool) {
        unsafe { nav_pop(tab as u32, animated as u32) };
    }

    fn nav_replace(&self, tab: usize, screen: &Screen) {
        let (ptr, len) = bytes(screen.title);
        unsafe { nav_replace(tab as u32, screen.root, ptr, len, screen_flags(screen, false)) };
    }

    fn nav_select_tab(&self, tab: usize) {
        unsafe { nav_select(tab as u32) };
    }

    fn set_timer(&self, ms: u64, callback: Box<dyn FnOnce()>) -> u64 {
        let id = self.callback_id();
        self.timers.borrow_mut().insert(id, callback);
        unsafe { timer_set(id, ms as f64) };
        id as u64
    }

    fn clear_timer(&self, timer: u64) {
        if self.timers.borrow_mut().remove(&(timer as u32)).is_some() {
            unsafe { timer_clear(timer as u32) };
        }
    }

    fn request_frame(&self, callback: Box<dyn FnOnce()>) -> u64 {
        let id = self.callback_id();
        self.frames.borrow_mut().insert(id, callback);
        unsafe { frame_request(id) };
        id as u64
    }

    fn cancel_frame(&self, frame: u64) {
        if self.frames.borrow_mut().remove(&(frame as u32)).is_some() {
            unsafe { frame_cancel(frame as u32) };
        }
    }

    fn waker(&self) -> Arc<dyn Fn() + Send + Sync> {
        Arc::new(|| unsafe { wake() })
    }

    fn now(&self) -> f64 {
        unsafe { now() }
    }

    fn log(&self, line: &str, error: bool) {
        let (ptr, len) = bytes(line);
        unsafe { log(ptr, len, error as u32) };
    }

    fn http(&self, request: HttpRequest, done: Box<dyn FnOnce(Result<(i64, Vec<u8>), String>)>) {
        let id = self.callback_id();
        self.requests.borrow_mut().insert(id, done);
        // Header lines "name: value", one per line.
        let headers = request.headers.iter().map(|(name, value)| format!("{name}: {value}")).collect::<Vec<_>>().join("\n");
        let (method, url, headers_bytes) = (bytes(&request.method), bytes(&request.url), bytes(&headers));
        let body = request.body.as_deref().map_or((std::ptr::null(), 0), bytes);
        unsafe { http(id, method.0, method.1, url.0, url.1, headers_bytes.0, headers_bytes.1, body.0, body.1, request.body.is_some() as u32) };
    }

    fn call_sync(&self, name: &str, args: &str) -> Result<String, String> {
        let (name, args) = (bytes(name), bytes(args));
        // The page writes the result into memory it asks for: its address, its length and whether it is a result or a failure.
        let mut out = [0u32; 3];
        unsafe { native_call_sync(name.0, name.1, args.0, args.1, out.as_mut_ptr()) };
        let text = unsafe { String::from_utf8_lossy(&Vec::from_raw_parts(out[0] as *mut u8, out[1] as usize, (out[1] as usize).max(1))).into_owned() };
        if out[2] != 0 { Ok(text) } else { Err(text) }
    }

    fn call(&self, name: &str, args: &str, done: Box<dyn FnOnce(Result<String, String>)>) {
        let id = self.callback_id();
        self.calls.borrow_mut().insert(id, done);
        let (name, args) = (bytes(name), bytes(args));
        unsafe { native_call(id, name.0, name.1, args.0, args.1) };
    }

    fn set_image_url(&self, view: ViewId, url: &str) -> bool {
        // The browser fetches an image itself, without a cross-origin check.
        let (ptr, len) = bytes(url);
        unsafe { view_image_url(view, ptr, len) };
        true
    }
}

/// What the app's `native/` code is: the page's own TypeScript (`native/web` or `native/wasm`, written as
/// for the `web` target). The generated `native` module (src/compiler/wasmNative.ts) calls this, from
/// the components it declares and the functions the app declared with `declare function`.
pub mod platform {
    use super::*;

    /// A component the page made: its number in the page's table.
    pub struct Handle(pub u32);

    pub fn create(name: &str) -> NativeView {
        let (ptr, len) = bytes(name);
        Rc::new(Handle(unsafe { native_create(ptr, len) }))
    }

    fn handle(view: &NativeView) -> u32 {
        view.downcast_ref::<Handle>().map_or(0, |handle| handle.0)
    }

    pub fn destroy(view: &NativeView) {
        let handle = handle(view);
        web().callbacks.borrow_mut().retain(|id, _| id / 64 != handle);
        unsafe { native_destroy(handle) };
    }

    /// The props sent to the component's `update`: values as JSON, functions as numbers the page turns into functions.
    pub struct Props {
        handle: u32,
        map: serde_json::Map<String, Json>,
    }

    impl Props {
        pub fn new(view: &NativeView) -> Props {
            Props { handle: handle(view), map: serde_json::Map::new() }
        }

        pub fn set(&mut self, key: &str, value: Json) {
            self.map.insert(key.to_string(), value);
        }

        /// `index` numbers the component's function props, from 0 to 63.
        pub fn callback(&mut self, index: u32, key: &str, call: Rc<dyn Fn(&[Json])>) {
            let id = self.handle * 64 + index.min(63);
            web().callbacks.borrow_mut().insert(id, call);
            self.map.insert(key.to_string(), serde_json::json!({ "$cb": id }));
        }

        pub fn send(self) {
            let text = Json::Object(self.map).to_string();
            unsafe { native_update(self.handle, text.as_ptr(), text.len()) };
        }
    }
}

// ---------------------------------------------------------------------------
// What the page calls
// ---------------------------------------------------------------------------

/// Memory for a string or bytes the page sends: it writes them here, calls an export that
/// reads them, and gives the memory back with `nuclo_free`.
#[no_mangle]
pub extern "C" fn nuclo_alloc(len: usize) -> *mut u8 {
    let mut memory = Vec::<u8>::with_capacity(len.max(1));
    let ptr = memory.as_mut_ptr();
    std::mem::forget(memory);
    ptr
}

#[no_mangle]
pub extern "C" fn nuclo_free(ptr: *mut u8, len: usize) {
    unsafe { drop(Vec::from_raw_parts(ptr, 0, len.max(1))) };
}

unsafe fn text<'a>(ptr: *const u8, len: usize) -> &'a str {
    std::str::from_utf8(std::slice::from_raw_parts(ptr, len)).unwrap_or_default()
}

/// Installs the backend and runs the app's entry point.
pub fn start(entry: fn()) {
    std::panic::set_hook(Box::new(|info| {
        let line = format!("nuclo: {info}");
        unsafe { log(line.as_ptr(), line.len(), 1) };
    }));
    crate::nuclo::start(web());
    entry();
}

/// The height a root view takes laid out `width` wide.
#[no_mangle]
pub extern "C" fn nuclo_measure_root(root: u32, width: f32) -> f32 {
    host::measure_root(root, width)
}

#[no_mangle]
pub extern "C" fn nuclo_layout_root(root: u32, width: f32, height: f32) {
    host::layout_root(root, width, height)
}

/// A screen the page scrolls: how far, and how much of it shows.
#[no_mangle]
pub extern "C" fn nuclo_screen_scrolled(root: u32, top: f32, visible: f32) {
    host::screen_scrolled(root, top, visible)
}

/// 0 click, 1 input, 2 change, 3 focus, 4 blur.
#[no_mangle]
pub extern "C" fn nuclo_event(view: u32, event: u32) {
    let event = match event {
        0 => Event::Click,
        1 => Event::Input,
        2 => Event::Change,
        3 => Event::Focus,
        _ => Event::Blur,
    };
    host::event(view, event);
}

/// A field's text, or a switch's state, as the page has it: reported before the event it caused.
#[no_mangle]
pub extern "C" fn nuclo_control(view: u32, value: *const u8, len: usize, checked: u32) {
    web().controls.borrow_mut().insert(view, (unsafe { text(value, len) }.to_string(), checked != 0));
}

/// Phases: 0 down, 1 move, 2 up, 3 cancel, 4 long press, 5 double click.
#[no_mangle]
pub extern "C" fn nuclo_pointer(view: u32, phase: u32, x: f64, y: f64, page_x: f64, page_y: f64, pointer_id: i32) {
    let phase = match phase {
        0 => PointerPhase::Down,
        1 => PointerPhase::Move,
        2 => PointerPhase::Up,
        3 => PointerPhase::Cancel,
        4 => PointerPhase::LongPress,
        _ => PointerPhase::DoubleClick,
    };
    host::pointer(view, phase, PointerEvent { x, y, page_x, page_y, pointer_id: pointer_id as i64 });
}

fn gesture_state(state: u32) -> String {
    ["start", "move", "end", "cancel"][state.min(3) as usize].to_string()
}

#[no_mangle]
pub extern "C" fn nuclo_pan(view: u32, state: u32, translation_x: f64, translation_y: f64, velocity_x: f64, velocity_y: f64, x: f64, y: f64) {
    host::pan(view, PanEvent { state: gesture_state(state), translation_x, translation_y, velocity_x, velocity_y, x, y });
}

#[no_mangle]
pub extern "C" fn nuclo_pinch(view: u32, state: u32, scale: f64, focal_x: f64, focal_y: f64) {
    host::pinch(view, PinchEvent { state: gesture_state(state), scale, focal_x, focal_y });
}

#[no_mangle]
pub extern "C" fn nuclo_key(view: u32, key: *const u8, len: usize) {
    host::key(view, unsafe { text(key, len) });
}

#[no_mangle]
pub extern "C" fn nuclo_scroll(view: u32, scroll_top: f64, scroll_left: f64, scroll_height: f64, scroll_width: f64, client_height: f64, client_width: f64) {
    host::scrolled(view, ScrollEvent { scroll_top, scroll_left, scroll_height, scroll_width, client_height, client_width });
}

#[no_mangle]
pub extern "C" fn nuclo_hover(view: u32, over: u32) {
    host::hover(view, over != 0);
}

#[no_mangle]
pub extern "C" fn nuclo_nav_popped(tab: u32, root: u32) {
    host::nav_popped(tab as usize, root);
}

#[no_mangle]
pub extern "C" fn nuclo_nav_tab(tab: u32) {
    host::nav_tab_selected(tab as usize);
}

#[no_mangle]
pub extern "C" fn nuclo_timer(id: u32) {
    let callback = web().timers.borrow_mut().remove(&id);
    if let Some(callback) = callback {
        callback();
    }
}

#[no_mangle]
pub extern "C" fn nuclo_frame(id: u32) {
    let callback = web().frames.borrow_mut().remove(&id);
    if let Some(callback) = callback {
        callback();
    }
}

#[no_mangle]
pub extern "C" fn nuclo_wake() {
    host::wake();
}

/// The answer to `http`: the body, or (`ok` 0) the reason the exchange failed.
#[no_mangle]
pub extern "C" fn nuclo_http_done(id: u32, status: i32, body: *const u8, len: usize, ok: u32) {
    let done = web().requests.borrow_mut().remove(&id);
    let Some(done) = done else { return };
    let body = unsafe { std::slice::from_raw_parts(body, len) }.to_vec();
    done(if ok != 0 { Ok((status as i64, body)) } else { Err(String::from_utf8_lossy(&body).into_owned()) });
}

/// A function prop of a native component was called: `args` is a JSON array.
#[no_mangle]
pub extern "C" fn nuclo_callback(id: u32, args: *const u8, len: usize) {
    let call = web().callbacks.borrow().get(&id).cloned();
    let Some(call) = call else { return };
    if let Ok(Json::Array(args)) = serde_json::from_str(unsafe { text(args, len) }) {
        call(&args);
    }
}

/// The answer to `native_call`: what the function resolved to as JSON, or (`ok` 0) why it failed.
#[no_mangle]
pub extern "C" fn nuclo_native_done(id: u32, ok: u32, result: *const u8, len: usize) {
    let done = web().calls.borrow_mut().remove(&id);
    if let Some(done) = done {
        let result = unsafe { text(result, len) }.to_string();
        done(if ok != 0 { Ok(result) } else { Err(result) });
    }
}
