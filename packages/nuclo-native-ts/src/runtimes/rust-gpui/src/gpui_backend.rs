//! The GPUI backend: everything is drawn by GPUI, at the frames the core's flex layout computes.
//!
//! GPUI has no widgets and keeps no tree: each frame an element paints what is on screen. So
//! this backend keeps the tree the core describes (a `View` per `ViewId`: kind, frame, paint,
//! content, children in drawing order) and one element, the `Stage`, paints it: boxes as
//! quads and shadows, text shaped by GPUI's text system (which also measures it for the core),
//! fields from `gpui_field`, images, and the router's bars and sheets with the sizes and
//! colours of the Android and web runtimes. The pointer is resolved against the same tree, so
//! clicks, pans, hover and scrolling are this file's, not GPUI's.
//!
//! The core calls the backend without a GPUI context, so nothing here needs one outside a
//! frame or an event: timers and frame callbacks go through an `AsyncApp`, and whatever calls
//! into the core (`host::*`) refreshes the window afterwards.

use std::cell::{Cell, RefCell};
use std::collections::{HashMap, HashSet};
use std::future::poll_fn;
use std::rc::Rc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::task::{Poll, Waker};
use std::time::{Duration, Instant};

use gpui::{
    fill, point, prelude::*, px, quad, relative, size, AnyWindowHandle, App, AsyncApp, BorderStyle, Bounds, BoxShadow, ClipboardItem, ContentMask, Context, Corners, CursorStyle,
    DispatchPhase, FocusHandle, Font, FontStyle, FontWeight, GlobalElementId, Hitbox, HitboxBehavior, Hsla, Image, ImageFormat, InputHandler, InspectorElementId, KeyDownEvent, Keystroke,
    LayoutId, MouseButton, MouseDownEvent, MouseExitEvent, MouseMoveEvent, MouseUpEvent, NavigationDirection, PathBuilder, Pixels, Point, RenderImage, Rgba, ScrollWheelEvent, SharedString,
    Size, StrikethroughStyle, Style, SvgRenderer, Task, TextRun, TextSystem, TitlebarOptions, TouchPhase, TruncateFrom, UTF16Selection, UnderlineStyle, Window, WindowBounds, WindowOptions, WindowTextSystem,
    WrappedLine,
};

use crate::gpui_field::Field;
use crate::nuclo::backend::{host, Backend, Event, Input, Kind, NativeView, Paint, PanEvent, PinchEvent, PointerEvent, PointerPhase, Rect, Screen, ScrollEvent, TabInfo, TextPaint, ViewId};
use crate::nuclo::prelude::{Color, FontFamily, TextAlign, TextDecoration};

/// The drag threshold: a pointer that moved less is still a press. As in the other runtimes.
const SLOP: f32 = 8.0;
const LONG_PRESS_MS: u64 = 500;
/// The router's chrome, as `src/runtimes/web` and the Android runtime draw it.
const BAR: f32 = 56.0;
const TABS: f32 = 64.0;
/// How long a screen slides in or out, in seconds.
const SLIDE: f32 = 0.24;
const ACCENT: Color = Color(0x4f46_e5ff);
const MUTED: Color = Color(0x6474_8bff);
const CHECKBOX: f32 = 20.0;

/// A view the app's platform code draws (`native<P>()`), for its `native/linux-gpui/`. Every
/// method takes `&self`: a callback the view makes (an `onChange`) comes back into the
/// component's `update` while the view is still in `pointer`, so it keeps its props in cells.
/// None of them may call the app's functions other than from `pointer`.
pub trait Draw {
    /// The size the view wants when it is given at most `max_width`.
    fn measure(&self, max_width: f32) -> (f32, f32);
    /// Paints the view into `bounds` (window px) with GPUI's paint calls, its colours multiplied by `opacity`.
    fn paint(&self, bounds: Bounds<Pixels>, opacity: f32, window: &mut Window, cx: &mut App);
    /// A press on the view, its moves while it is held and its release, in px from the top-left corner of a view of `size`.
    fn pointer(&self, _phase: PointerPhase, _x: f32, _y: f32, _size: (f32, f32)) {}
}

/// For the app's `native/linux-gpui/`: what a `NativeComponent` returns from `create`.
#[allow(dead_code)]
pub fn native(draw: Rc<dyn Draw>) -> NativeView {
    Rc::new(draw)
}

pub fn hsla(color: Color, opacity: f32) -> Hsla {
    let [r, g, b, a] = color.rgba();
    Rgba { r, g, b, a: a * opacity }.into()
}

/// A box that scrolls its children along one axis.
struct Scroll {
    horizontal: bool,
    /// A screen's own scrolling, which the backend gives a root that is taller than the window.
    page: bool,
    content: (f32, f32),
    offset: Cell<f32>,
}

struct View {
    kind: Kind,
    parent: Option<ViewId>,
    /// In drawing order, lowest first.
    children: Vec<ViewId>,
    frame: Rect,
    paint: Option<Paint>,
    /// A text's or a button's.
    text: String,
    field: Option<Field>,
    checked: bool,
    enabled: bool,
    image: Option<Arc<RenderImage>>,
    native: Option<Rc<dyn Draw>>,
    scroll: Option<Scroll>,
    /// A bit per `Input` the core asked for.
    listens: u16,
}

impl View {
    fn new(kind: Kind) -> View {
        let field = matches!(kind, Kind::Input | Kind::Textarea).then(|| Field { multiline: kind == Kind::Textarea, ..Field::default() });
        View {
            kind,
            parent: None,
            children: Vec::new(),
            frame: Rect::default(),
            paint: None,
            text: String::new(),
            field,
            checked: false,
            enabled: true,
            image: None,
            native: None,
            scroll: None,
            listens: 0,
        }
    }

    fn listens(&self, input: Input) -> bool {
        self.listens & (1 << input as u16) != 0
    }

    /// The pointer hits this view itself: a box, a text or an image that reports no input lets
    /// it through to what is under it.
    fn takes_pointer(&self, paint: &Paint) -> bool {
        self.listens != 0 || paint.blocks_pointer || !matches!(self.kind, Kind::Box | Kind::Text | Kind::Image)
    }

    /// Where the view is drawn: its frame in its parent (whose content starts at `origin` and is
    /// drawn at `scale`), then its style's translation and scale about its centre. GPUI cannot
    /// rotate a quad or text, so `rotate` is not drawn.
    fn geometry(&self, paint: &Paint, origin: Point<Pixels>, scale: f32) -> (Bounds<Pixels>, f32) {
        let (w, h) = (self.frame.w as f32, self.frame.h as f32);
        let s = scale * paint.scale;
        let centre_x = origin.x + px((self.frame.x as f32 + w / 2.0 + paint.translate.0) * scale);
        let centre_y = origin.y + px((self.frame.y as f32 + h / 2.0 + paint.translate.1) * scale);
        (Bounds::new(point(centre_x - px(w * s / 2.0), centre_y - px(h * s / 2.0)), size(px(w * s), px(h * s))), s)
    }

    /// Where the children's frames count from: the box's corner, less what it has scrolled.
    fn content_origin(&self, bounds: Bounds<Pixels>, s: f32) -> Point<Pixels> {
        match &self.scroll {
            Some(scroll) if scroll.horizontal => point(bounds.origin.x - px(scroll.offset.get() * s), bounds.origin.y),
            Some(scroll) => point(bounds.origin.x, bounds.origin.y - px(scroll.offset.get() * s)),
            None => bounds.origin,
        }
    }
}

struct Page {
    root: ViewId,
    title: String,
    modal: bool,
    header: bool,
}

impl Page {
    fn of(screen: &Screen) -> Page {
        Page { root: screen.root, title: screen.title.to_string(), modal: screen.modal, header: screen.header }
    }
}

struct Navigation {
    /// Each tab's glyph and title; empty for a single stack.
    tabs: Vec<(String, String)>,
    stacks: Vec<Vec<Page>>,
    active: usize,
    /// The screen sliding in, and since when.
    entering: Option<(ViewId, Instant)>,
    /// Screens that left their stack and are sliding out: the core destroys them later.
    leaving: Vec<(usize, Page, Instant)>,
}

/// What a frame shows, bottom to top. The pointer is resolved against the same list.
enum Layer {
    /// A root view in `area`, moved by `offset` while it slides. An `opaque` one is a screen:
    /// white, and it stops the pointer; an overlay lets it through where it has no view.
    Root { root: ViewId, area: Bounds<Pixels>, offset: Point<Pixels>, opaque: bool },
    Bar { title: String, back: bool },
    Tabs,
}

#[derive(Clone, Copy, PartialEq, Debug)]
enum Target {
    View(ViewId),
    Back,
    Tab(usize),
    /// Chrome or an empty part of a screen: nothing under it gets the pointer.
    Block,
}

/// The mouse button held down, and what it was pressed on.
struct Press {
    target: Target,
    /// The view that was hit and its ancestors, innermost first.
    chain: Vec<ViewId>,
    start: Point<Pixels>,
    /// It left the slop: no long press any more.
    moved: bool,
    /// The view whose pan this drag is, and where it was recognized: the translation counts from there.
    panning: Option<ViewId>,
    origin: Point<Pixels>,
    last: Option<(Point<Pixels>, Instant)>,
    velocity: (f64, f64),
    /// The drag selects text in the field it started in.
    selecting: Option<ViewId>,
    long_press: Option<u64>,
}

struct Fonts {
    sans: SharedString,
    /// The family bold sans-serif text is set in: `sans`, unless that has no bold face.
    sans_bold: SharedString,
    serif: SharedString,
    mono: SharedString,
}

fn output(command: &str, args: &[&str]) -> Option<String> {
    let output = std::process::Command::new(command).args(args).output().ok().filter(|output| output.status.success())?;
    Some(String::from_utf8(output.stdout).ok()?.trim().to_string())
}

impl Fonts {
    /// The fonts GTK would use on this desktop, so both Linux targets measure text alike: the
    /// interface font of the desktop's settings, and fontconfig's serif and monospace.
    fn detect(text: &TextSystem) -> Fonts {
        let names = text.all_font_names();
        let known = |name: Option<String>| name.filter(|name| names.contains(name)).map(SharedString::from);
        let generic = |family: &str| known(output("fc-match", &["-f", "%{family[0]}", family])).unwrap_or_else(|| ".SystemUIFont".into());
        // The setting reads 'Ubuntu 12': the family, then the size.
        let size = |c: char| c.is_ascii_digit() || c == '.' || c == ' ';
        let interface = output("gsettings", &["get", "org.gnome.desktop.interface", "font-name"]).map(|name| name.trim_matches('\'').trim_end_matches(size).to_string());
        let fallback = generic("sans-serif");
        let sans = known(interface).unwrap_or_else(|| fallback.clone());
        // GPUI's text system does not instantiate variable fonts: a family that is one variable
        // file (Ubuntu) draws its bold as regular. Bold is then set in fontconfig's sans-serif.
        let face = |weight: FontWeight| text.resolve_font(&Font { weight, ..gpui::font(sans.clone()) });
        let sans_bold = if face(FontWeight::BOLD) != face(FontWeight::NORMAL) { sans.clone() } else { fallback };
        Fonts { sans, sans_bold, serif: generic("serif"), mono: generic("monospace") }
    }

    fn font(&self, text: &TextPaint) -> Font {
        let family = match text.font_family {
            FontFamily::SansSerif if text.bold => &self.sans_bold,
            FontFamily::SansSerif => &self.sans,
            FontFamily::Serif => &self.serif,
            FontFamily::Monospace => &self.mono,
        };
        Font { weight: if text.bold { FontWeight::BOLD } else { FontWeight::NORMAL }, style: if text.italic { FontStyle::Italic } else { FontStyle::Normal }, ..gpui::font(family.clone()) }
    }
}

/// Shaped text: its hard lines, each wrapped into rows.
struct Shaped {
    lines: Vec<WrappedLine>,
    line_height: Pixels,
    /// Rows after this many are not drawn (`numberOfLines`).
    clamp: Option<usize>,
}

impl Shaped {
    fn rows(&self) -> usize {
        let rows = self.lines.iter().map(|line| line.wrap_boundaries().len() + 1).sum::<usize>().max(1);
        self.clamp.map_or(rows, |clamp| rows.min(clamp))
    }

    fn width(&self) -> f32 {
        self.lines.iter().map(|line| f32::from(line.width())).fold(0.0, f32::max)
    }

    fn height(&self) -> f32 {
        f32::from(self.line_height) * self.rows() as f32
    }
}

/// A field's text as drawn: where it starts, and where each hard line starts in what is drawn.
struct FieldLayout {
    shaped: Shaped,
    origin: Point<Pixels>,
    starts: Vec<usize>,
    /// The placeholder is what is drawn: every index is 0.
    empty: bool,
}

impl FieldLayout {
    /// Where a character of the drawn text is, from `origin`.
    fn position(&self, index: usize) -> Point<Pixels> {
        let height = self.shaped.line_height;
        let mut y = px(0.0);
        for (at, line) in self.shaped.lines.iter().enumerate() {
            let start = self.starts[at];
            if self.empty || index <= start + line.len() || at + 1 == self.shaped.lines.len() {
                let local = if self.empty { 0 } else { index.saturating_sub(start).min(line.len()) };
                let position = line.position_for_index(local, height).unwrap_or_default();
                return point(position.x, y + position.y);
            }
            y += line.size(height).height;
        }
        point(px(0.0), px(0.0))
    }

    /// The character of the drawn text nearest to `at` (from `origin`).
    fn index(&self, at: Point<Pixels>) -> usize {
        if self.empty {
            return 0;
        }
        let height = self.shaped.line_height;
        let mut y = px(0.0);
        for (line_at, line) in self.shaped.lines.iter().enumerate() {
            let tall = line.size(height).height;
            if at.y < y + tall || line_at + 1 == self.shaped.lines.len() {
                let inside = point(at.x.max(px(0.0)), (at.y - y).max(px(0.0)).min(tall - px(1.0)));
                let (Ok(index) | Err(index)) = line.closest_index_for_position(inside, height);
                return self.starts[line_at] + index;
            }
            y += tall;
        }
        0
    }
}

/// Lets any thread ask the UI thread for `host::wake()`: a flag, and the waker of the task that waits on it.
#[derive(Default)]
struct Signal {
    set: AtomicBool,
    waker: Mutex<Option<Waker>>,
}

pub(crate) struct Gpui {
    cx: AsyncApp,
    window: AnyWindowHandle,
    /// The window's own text system: what measures a text is what draws it.
    text: Arc<WindowTextSystem>,
    fonts: Fonts,
    /// Decodes images (GPUI's decoder wants it for the SVG ones).
    svg: SvgRenderer,
    /// The window's one focus: which view has the keys is `focused`.
    focus: FocusHandle,
    views: RefCell<HashMap<ViewId, View>>,
    next_view: Cell<ViewId>,
    screen: Cell<Option<ViewId>>,
    overlays: RefCell<Vec<ViewId>>,
    navigation: RefCell<Option<Navigation>>,
    size: Cell<Size<Pixels>>,
    layers: RefCell<Vec<Layer>>,
    /// Each root's last layout: the request it answered and the size it was given.
    laid: RefCell<HashMap<ViewId, (u64, f32, f32)>>,
    layout_request: Cell<u64>,
    title: RefCell<String>,
    timers: RefCell<HashMap<u64, Task<()>>>,
    next_timer: Cell<u64>,
    /// requestAnimationFrame callbacks, and whether the window was asked to run them.
    frames: RefCell<Vec<(u64, Box<dyn FnOnce()>)>>,
    ticking: Cell<bool>,
    /// A layout was requested and its frame is not drawn yet: due timers wait for it.
    frame_pending: Cell<bool>,
    after_frame: RefCell<Vec<Box<dyn FnOnce()>>>,
    signal: Arc<Signal>,
    press: RefCell<Option<Press>>,
    hovered: RefCell<Vec<ViewId>>,
    /// The button under the pointer: it is shaded, as a platform button is.
    hot: Cell<Option<ViewId>>,
    cursor: Cell<CursorStyle>,
    /// The field that takes text, or the box that takes keys.
    focused: Cell<Option<ViewId>>,
    /// Where the focused field's cursor was drawn, for the input method's window.
    caret: Cell<Option<Bounds<Pixels>>>,
    /// The pinch under way: its view, its scale, and for ctrl + wheel the timer that ends it.
    pinch: RefCell<Option<(ViewId, f64, Option<u64>)>>,
}

thread_local!(static GPUI: RefCell<Option<Rc<Gpui>>> = const { RefCell::new(None) });

fn gpui_backend() -> Option<Rc<Gpui>> {
    GPUI.with(|gpui| gpui.borrow().clone())
}

// ---------------------------------------------------------------------------
// The tree
// ---------------------------------------------------------------------------

impl Gpui {
    fn view<T>(&self, id: ViewId, f: impl FnOnce(&View) -> T) -> Option<T> {
        self.views.borrow().get(&id).map(f)
    }

    fn view_mut<T>(&self, id: ViewId, f: impl FnOnce(&mut View) -> T) -> Option<T> {
        self.views.borrow_mut().get_mut(&id).map(f)
    }

    fn add(&self, view: View) -> ViewId {
        let id = self.next_view.replace(self.next_view.get() + 1);
        self.views.borrow_mut().insert(id, view);
        id
    }

    /// A view and its ancestors, innermost first.
    fn chain(&self, view: ViewId) -> Vec<ViewId> {
        let views = self.views.borrow();
        let mut chain = Vec::new();
        let mut next = Some(view);
        while let Some(view) = next.and_then(|id| views.get(&id).map(|view| (id, view))) {
            chain.push(view.0);
            next = view.1.parent;
        }
        chain
    }

    /// Those of `chain` that report one of `inputs`.
    fn listening(&self, chain: &[ViewId], inputs: &[Input]) -> Vec<ViewId> {
        let views = self.views.borrow();
        chain.iter().copied().filter(|id| views.get(id).is_some_and(|view| inputs.iter().any(|input| view.listens(*input)))).collect()
    }

    /// Where a view was drawn in the window, and at what scale: its ancestors' frames, scroll
    /// offsets and transforms, from the layer its root is in.
    fn placed(&self, views: &HashMap<ViewId, View>, id: ViewId) -> Option<(Bounds<Pixels>, f32)> {
        let view = views.get(&id)?;
        let (origin, scale) = match view.parent {
            Some(parent) => {
                let (bounds, scale) = self.placed(views, parent)?;
                (views.get(&parent)?.content_origin(bounds, scale), scale)
            }
            None => {
                let layers = self.layers.borrow();
                let origin = layers.iter().rev().find_map(|layer| match layer {
                    Layer::Root { root, area, offset, .. } if *root == id => Some(area.origin + *offset),
                    _ => None,
                })?;
                (origin, 1.0)
            }
        };
        Some(view.geometry(view.paint.as_ref()?, origin, scale))
    }

    /// The pointer at `at` (in the window), as `view` sees it.
    fn pointer_at(&self, view: ViewId, at: Point<Pixels>) -> Option<PointerEvent> {
        let (bounds, scale) = self.placed(&self.views.borrow(), view)?;
        Some(PointerEvent {
            x: (f32::from(at.x - bounds.origin.x) / scale) as f64,
            y: (f32::from(at.y - bounds.origin.y) / scale) as f64,
            page_x: f32::from(at.x) as f64,
            page_y: f32::from(at.y) as f64,
            pointer_id: 0,
        })
    }

    /// The topmost view under `at` in the subtree of `id`, children before their parent. `any`:
    /// whatever is drawn there; otherwise only a view that takes the pointer.
    fn pick(&self, views: &HashMap<ViewId, View>, id: ViewId, origin: Point<Pixels>, scale: f32, at: Point<Pixels>, any: bool) -> Option<ViewId> {
        let view = views.get(&id)?;
        let paint = view.paint.as_ref().filter(|paint| paint.visible)?;
        let (bounds, s) = view.geometry(paint, origin, scale);
        let inside = bounds.contains(&at);
        if (paint.clip || view.scroll.is_some()) && !inside {
            return None;
        }
        let content = view.content_origin(bounds, s);
        view.children.iter().rev().find_map(|child| self.pick(views, *child, content, s, at, any)).or((inside && (any || view.takes_pointer(paint))).then_some(id))
    }

    /// What the pointer is over, through the frame's layers from the top. `any`: on a screen,
    /// whatever is drawn there (what the wheel scrolls), not only a view that takes the pointer.
    fn target(&self, at: Point<Pixels>, any: bool) -> Target {
        let views = self.views.borrow();
        let window = self.size.get();
        for layer in self.layers.borrow().iter().rev() {
            match layer {
                Layer::Root { root, area, offset, opaque } => {
                    if !area.contains(&at) {
                        continue;
                    }
                    // An overlay is only there where a view of it takes the pointer.
                    if let Some(view) = self.pick(&views, *root, area.origin + *offset, 1.0, at, any && *opaque) {
                        return Target::View(view);
                    }
                    if *opaque {
                        return Target::Block;
                    }
                }
                Layer::Bar { back, .. } if at.y < px(BAR) => return if *back && at.x < px(BAR) { Target::Back } else { Target::Block },
                Layer::Tabs if at.y >= window.height - px(TABS) => {
                    let tabs = self.navigation.borrow().as_ref().map_or(1, |nav| nav.tabs.len().max(1));
                    return Target::Tab((((at.x / window.width) * tabs as f32).max(0.0) as usize).min(tabs - 1));
                }
                _ => {}
            }
        }
        Target::Block
    }
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

impl Gpui {
    /// A line's height when the style sets none: the font's ascent and descent. Bold sans-serif
    /// counts the regular family's, so a line is as tall whichever family draws it.
    fn line_height(&self, text: &TextPaint) -> f32 {
        text.line_height.unwrap_or_else(|| {
            let font = self.text.resolve_font(&self.fonts.font(&TextPaint { bold: false, italic: false, ..*text }));
            let size = px(text.font_size);
            f32::from(self.text.ascent(font, size)) + f32::from(self.text.descent(font, size)).abs()
        })
    }

    /// Shapes `text` drawn at `scale`, wrapped at `wrap` px.
    fn shape(&self, text: &str, style: &TextPaint, scale: f32, opacity: f32, wrap: Option<f32>) -> Shaped {
        let font_size = px(style.font_size * scale);
        let color = hsla(style.color, opacity);
        let font = self.fonts.font(style);
        let mut runs = vec![TextRun {
            len: text.len(),
            font: font.clone(),
            color,
            background_color: None,
            underline: (style.decoration == TextDecoration::Underline).then(|| UnderlineStyle { thickness: px(scale), color: Some(color), wavy: false }),
            strikethrough: (style.decoration == TextDecoration::LineThrough).then(|| StrikethroughStyle { thickness: px(scale), color: Some(color) }),
        }];
        let mut shown = SharedString::from(text.to_string());
        let clamp = style.lines.map(|lines| lines as usize);
        let mut wrap = wrap.map(px);
        // GPUI cuts one line with an ellipsis; more lines are cut where they end.
        if let (Some(1), Some(width)) = (clamp, wrap) {
            let (cut, cut_runs) = self.text.line_wrapper(font, font_size).truncate_line(shown, width, "…", &runs, TruncateFrom::End);
            let cut_runs = cut_runs.into_owned();
            (shown, runs, wrap) = (cut, cut_runs, None);
        }
        let lines = self.text.shape_text(shown, font_size, &runs, wrap, clamp).map(|lines| lines.into_iter().collect()).unwrap_or_default();
        Shaped { lines, line_height: px(self.line_height(style) * scale), clamp }
    }

    /// The size of `text` given at most `max_width`: its own width when it fits, and whole
    /// pixels, rounded up. Both as Pango measures for the GTK backend, so the two lay out alike.
    fn text_size(&self, text: &str, style: &TextPaint, max_width: f32) -> (f32, f32) {
        let natural = self.shape(text, style, 1.0, 1.0, None);
        let width = natural.width().ceil();
        if width <= max_width {
            return (width, natural.height().ceil());
        }
        (max_width, self.shape(text, style, 1.0, 1.0, Some(max_width.floor())).height().ceil())
    }

    fn paint_shaped(&self, shaped: &Shaped, origin: Point<Pixels>, width: Pixels, align: TextAlign, window: &mut Window, cx: &mut App) {
        let align = match align {
            TextAlign::Left => gpui::TextAlign::Left,
            TextAlign::Center => gpui::TextAlign::Center,
            TextAlign::Right => gpui::TextAlign::Right,
        };
        let bounds = Bounds::new(origin, size(width, px(0.0)));
        let (mut y, mut rows) = (origin.y, 0);
        for line in &shaped.lines {
            if shaped.clamp.is_some_and(|clamp| rows >= clamp) {
                break;
            }
            let _ = line.paint(point(origin.x, y), shaped.line_height, align, Some(bounds), window, cx);
            let wrapped = line.wrap_boundaries().len() + 1;
            rows += wrapped;
            y += shaped.line_height * wrapped as f32;
        }
    }

    /// Text in `inner`, wrapped as it was measured (a frame's rounded edges may leave it a
    /// pixel less than its width, which must not break the line). `centred`: also vertically.
    fn paint_text(&self, text: &str, style: &TextPaint, inner: Bounds<Pixels>, scale: f32, opacity: f32, centred: bool, window: &mut Window, cx: &mut App) {
        let shaped = self.shape(text, style, scale, opacity, Some(f32::from(inner.size.width) + scale));
        let down = if centred { (inner.size.height - px(shaped.height())) / 2.0 } else { px(0.0) };
        self.paint_shaped(&shaped, point(inner.origin.x, inner.origin.y + down), inner.size.width, style.align, window, cx);
    }

    fn field_layout(&self, field: &Field, style: &TextPaint, inner: Bounds<Pixels>, scale: f32, opacity: f32) -> FieldLayout {
        let empty = field.text.is_empty();
        let text = if empty { field.placeholder.clone() } else { field.shown() };
        let style = TextPaint { lines: None, ..*style };
        let wrap = field.multiline.then(|| f32::from(inner.size.width));
        let shaped = self.shape(&text, &style, scale, if empty { opacity * 0.4 } else { opacity }, wrap);
        let mut starts = Vec::with_capacity(shaped.lines.len());
        let mut start = 0;
        for line in &shaped.lines {
            starts.push(start);
            start += line.len() + 1;
        }
        let mut layout = FieldLayout { shaped, origin: inner.origin, starts, empty };
        if !field.multiline {
            // One line, centred, and moved left as far as the cursor needs to stay in the field.
            let cursor = layout.position(field.shown_offset(field.cursor())).x;
            layout.origin.x -= (cursor - inner.size.width + px(2.0)).max(px(0.0));
            layout.origin.y += (inner.size.height - layout.shaped.line_height) / 2.0;
        }
        layout
    }

    /// The field's layout where it was last drawn, for the pointer.
    fn field_at(&self, id: ViewId) -> Option<FieldLayout> {
        let views = self.views.borrow();
        let (bounds, scale) = self.placed(&views, id)?;
        let view = views.get(&id)?;
        let paint = view.paint.as_ref()?;
        Some(self.field_layout(view.field.as_ref()?, &paint.text, inset(bounds, paint, scale), scale, 1.0))
    }

    /// The character of a field's text under the pointer.
    fn field_index(&self, id: ViewId, at: Point<Pixels>) -> Option<usize> {
        let layout = self.field_at(id)?;
        let shown = layout.index(point(at.x - layout.origin.x, at.y - layout.origin.y));
        self.view(id, |view| view.field.as_ref().map(|field| field.text_offset(shown))).flatten()
    }
}

/// A view's box less its padding and border.
fn inset(bounds: Bounds<Pixels>, paint: &Paint, scale: f32) -> Bounds<Pixels> {
    let [top, right, bottom, left] = paint.insets.map(|side| px(side * scale));
    Bounds::new(point(bounds.origin.x + left, bounds.origin.y + top), size((bounds.size.width - left - right).max(px(0.0)), (bounds.size.height - top - bottom).max(px(0.0))))
}

fn label(font_size: f32, bold: bool, color: Color, align: TextAlign) -> TextPaint {
    TextPaint { font_size, bold, italic: false, font_family: FontFamily::SansSerif, line_height: None, letter_spacing: 0.0, decoration: TextDecoration::None, color, align, lines: Some(1) }
}

// ---------------------------------------------------------------------------
// A frame: what is shown, its layout, its painting
// ---------------------------------------------------------------------------

impl Gpui {
    /// Decides what this frame shows, and lays out the roots whose size or content changed.
    fn plan(&self, window_size: Size<Pixels>, window: &mut Window) {
        self.size.set(window_size);
        let (w, h) = (f32::from(window_size.width), f32::from(window_size.height));
        let full = Bounds::new(point(px(0.0), px(0.0)), window_size);
        let still = point(px(0.0), px(0.0));
        let mut layers = Vec::new();
        let mut title = None;
        if let Some(nav) = self.navigation.borrow_mut().as_mut() {
            // How far a screen that started sliding at `start` still has to go: 1 → 0, easing out.
            let left = |start: Instant| (1.0 - (start.elapsed().as_secs_f32() / SLIDE).min(1.0)).powi(3);
            nav.entering = nav.entering.filter(|(_, start)| left(*start) > 0.0);
            nav.leaving.retain(|(_, _, start)| left(*start) > 0.0);
            let entering = |page: &Page| nav.entering.filter(|(root, _)| *root == page.root).map_or(0.0, |(_, start)| left(start));
            let stack = &nav.stacks[nav.active];
            // The screen under any sheets: what the content area shows.
            let under_at = stack.iter().rposition(|page| !page.modal).unwrap_or(0);
            if let Some(under) = stack.get(under_at) {
                let bar = if under.header { BAR } else { 0.0 };
                let tabs = if nav.tabs.is_empty() { 0.0 } else { TABS };
                let area = Bounds::new(point(px(0.0), px(bar)), size(px(w), px((h - bar - tabs).max(0.0))));
                let slide = entering(under);
                if let (true, Some(below)) = (slide > 0.0, under_at.checked_sub(1).map(|at| &stack[at])) {
                    layers.push(Layer::Root { root: below.root, area, offset: still, opaque: true });
                }
                layers.push(Layer::Root { root: under.root, area, offset: point(px(slide * w), px(0.0)), opaque: true });
                let gone = nav.leaving.iter().filter(|(tab, _, _)| *tab == nav.active);
                for (_, page, start) in gone.clone().filter(|(_, page, _)| !page.modal) {
                    layers.push(Layer::Root { root: page.root, area, offset: point(px((1.0 - left(*start)) * w), px(0.0)), opaque: true });
                }
                if under.header {
                    layers.push(Layer::Bar { title: under.title.clone(), back: under_at > 0 });
                }
                if !nav.tabs.is_empty() {
                    layers.push(Layer::Tabs);
                }
                // A modal screen is a sheet over all of it, sliding from the bottom.
                for page in stack.iter().filter(|page| page.modal) {
                    layers.push(Layer::Root { root: page.root, area: full, offset: point(px(0.0), px(entering(page) * h)), opaque: true });
                }
                for (_, page, start) in gone.filter(|(_, page, _)| page.modal) {
                    layers.push(Layer::Root { root: page.root, area: full, offset: point(px(0.0), px((1.0 - left(*start)) * h)), opaque: true });
                }
                title = Some(under.title.clone());
            }
            if nav.entering.is_some() || !nav.leaving.is_empty() {
                window.request_animation_frame();
            }
        } else if let Some(root) = self.screen.get() {
            layers.push(Layer::Root { root, area: full, offset: still, opaque: true });
        }
        layers.extend(self.overlays.borrow().iter().map(|root| Layer::Root { root: *root, area: full, offset: still, opaque: false }));
        for layer in &layers {
            if let Layer::Root { root, area, opaque, .. } = layer {
                self.lay_out(*root, f32::from(area.size.width), f32::from(area.size.height), !*opaque);
            }
        }
        *self.layers.borrow_mut() = layers;
        if let Some(title) = title.filter(|title| *title != *self.title.borrow()) {
            window.set_window_title(&title);
            *self.title.borrow_mut() = title;
        }
    }

    /// Has the core lay a root out in `width` × `height`, unless nothing changed since it last did.
    fn lay_out(&self, root: ViewId, width: f32, height: f32, overlay: bool) {
        let now = (self.layout_request.get(), width, height);
        if self.laid.borrow().get(&root) == Some(&now) {
            return;
        }
        let Some(scrolls) = self.view_mut(root, |view| {
            view.frame = Rect { x: 0, y: 0, w: width.round() as i32, h: height.round() as i32 };
            view.scroll.as_ref().is_some_and(|scroll| !scroll.page)
        }) else {
            return;
        };
        if overlay || scrolls {
            // An overlay is the size of the window; a root that scrolls fills it.
            host::layout_root(root, width, height);
        } else {
            // A screen is as tall as its content, or the window when that is taller, and scrolls.
            let content = host::measure_root(root, width).ceil().max(height);
            self.view_mut(root, |view| {
                let offset = view.scroll.as_ref().map_or(0.0, |scroll| scroll.offset.get()).min(content - height);
                view.scroll = Some(Scroll { horizontal: false, page: true, content: (width, content), offset: Cell::new(offset) });
            });
            host::layout_root(root, width, content);
        }
        self.laid.borrow_mut().insert(root, now);
    }

    fn draw(&self, window: &mut Window, cx: &mut App) {
        let views = self.views.borrow();
        let size = self.size.get();
        for layer in self.layers.borrow().iter() {
            match layer {
                Layer::Root { root, area, offset, opaque } => window.with_content_mask(Some(ContentMask { bounds: *area }), |window| {
                    let origin = area.origin + *offset;
                    if *opaque {
                        window.paint_quad(fill(Bounds::new(origin, area.size), gpui::white()));
                    }
                    self.paint_view(&views, *root, origin, 1.0, 1.0, window, cx);
                }),
                Layer::Bar { title, back } => {
                    let bar = Bounds::new(point(px(0.0), px(0.0)), gpui::size(size.width, px(BAR)));
                    window.paint_drop_shadows(bar, Corners::default(), &[shadow(hsla(Color(0x0000_0033), 1.0), 0.0, 1.0, 3.0)]);
                    window.paint_quad(fill(bar, gpui::white()));
                    let row = |x: f32, width: Pixels| Bounds::new(point(px(x), px(0.0)), gpui::size(width, px(BAR)));
                    if *back {
                        self.paint_text("←", &label(24.0, false, Color::BLACK, TextAlign::Center), row(0.0, px(BAR)), 1.0, 1.0, true, window, cx);
                    }
                    let x = if *back { BAR } else { 20.0 };
                    self.paint_text(title, &label(20.0, true, Color::BLACK, TextAlign::Left), row(x, size.width - px(x + 8.0)), 1.0, 1.0, true, window, cx);
                }
                Layer::Tabs => {
                    let bar = Bounds::new(point(px(0.0), size.height - px(TABS)), gpui::size(size.width, px(TABS)));
                    window.paint_drop_shadows(bar, Corners::default(), &[shadow(hsla(Color(0x0000_0022), 1.0), 0.0, -1.0, 4.0)]);
                    window.paint_quad(fill(bar, hsla(Color(0xf8fa_fcff), 1.0)));
                    let navigation = self.navigation.borrow();
                    let Some(nav) = navigation.as_ref() else { continue };
                    let width = size.width / nav.tabs.len().max(1) as f32;
                    for (at, (glyph, title)) in nav.tabs.iter().enumerate() {
                        let style = TextPaint { lines: None, ..label(12.0, false, if at == nav.active { ACCENT } else { MUTED }, TextAlign::Center) };
                        let item = Bounds::new(point(width * at as f32, bar.origin.y), gpui::size(width, px(TABS)));
                        self.paint_text(&format!("{glyph}\n{title}"), &style, item, 1.0, 1.0, true, window, cx);
                    }
                }
            }
        }
    }

    fn paint_view(&self, views: &HashMap<ViewId, View>, id: ViewId, origin: Point<Pixels>, scale: f32, opacity: f32, window: &mut Window, cx: &mut App) {
        let Some(view) = views.get(&id) else { return };
        let Some(paint) = view.paint.as_ref().filter(|paint| paint.visible) else { return };
        let (bounds, s) = view.geometry(paint, origin, scale);
        let clips = paint.clip || view.scroll.is_some();
        let shown = bounds.intersects(&window.content_mask().bounds);
        if clips && !shown {
            return;
        }
        // GPUI has no group opacity: each thing drawn is that much more transparent.
        let o = opacity * paint.opacity;
        let radius = px((paint.radius * s).min(f32::from(bounds.size.width.min(bounds.size.height)) / 2.0));
        if shown {
            if let Some(cast) = paint.shadow {
                window.paint_drop_shadows(bounds, Corners::all(radius), &[shadow(hsla(cast.color, o), cast.dx * s, cast.dy * s, cast.blur * s)]);
            }
            if let Some(background) = paint.background {
                window.paint_quad(fill(bounds, hsla(background, o)).corner_radii(radius));
            }
        }
        // GPUI clips to rectangles: a clipping box's rounded corners do not cut its children.
        window.with_content_mask(clips.then_some(ContentMask { bounds }), |window| {
            let inner = inset(bounds, paint, s);
            match view.kind {
                Kind::Box => {
                    let content = view.content_origin(bounds, s);
                    for child in &view.children {
                        self.paint_view(views, *child, content, s, o, window, cx);
                    }
                }
                _ if !shown => {}
                Kind::Text => self.paint_text(&view.text, &paint.text, inner, s, o, false, window, cx),
                Kind::Button => self.paint_text(&view.text, &TextPaint { align: TextAlign::Center, ..paint.text }, inner, s, o, true, window, cx),
                Kind::Input | Kind::Textarea => self.paint_field(id, view, paint, inner, s, o, window, cx),
                Kind::Checkbox => paint_checkbox(view.checked, bounds, s, o, window),
                Kind::Image => {
                    if let Some(image) = &view.image {
                        // Covers the box: scaled until both sides reach, and cut to the box.
                        let pixels = image.size(0);
                        let (iw, ih) = (pixels.width.0 as f32, pixels.height.0 as f32);
                        let fit = (f32::from(bounds.size.width) / iw).max(f32::from(bounds.size.height) / ih);
                        let covered = Bounds::centered_at(bounds.center(), size(px(iw * fit), px(ih * fit)));
                        let _ = window.paint_image(bounds, covered, Corners::all(radius), image.clone(), 0, false);
                    }
                }
                Kind::Native => {
                    if let Some(native) = &view.native {
                        native.paint(bounds, o, window, cx);
                    }
                }
            }
        });
        if !shown {
            return;
        }
        if view.kind == Kind::Button && view.enabled && self.hot.get() == Some(id) {
            // The press feedback a platform button gives, over whatever the app painted.
            let pressed = self.press.borrow().as_ref().is_some_and(|press| press.target == Target::View(id));
            window.paint_quad(fill(bounds, gpui::black().opacity(if pressed { 0.16 } else { 0.06 })).corner_radii(radius));
        }
        if paint.border_width > 0.0 {
            window.paint_quad(quad(bounds, radius, gpui::transparent_black(), px(paint.border_width * s), hsla(paint.border_color, o), BorderStyle::default()));
        }
    }

    fn paint_field(&self, id: ViewId, view: &View, paint: &Paint, inner: Bounds<Pixels>, scale: f32, opacity: f32, window: &mut Window, cx: &mut App) {
        let Some(field) = &view.field else { return };
        let layout = self.field_layout(field, &paint.text, inner, scale, opacity);
        let focused = self.focused.get() == Some(id);
        let height = layout.shaped.line_height;
        let at = |offset: usize| layout.origin + layout.position(field.shown_offset(offset));
        window.with_content_mask(Some(ContentMask { bounds: inner }), |window| {
            if focused && !field.selection.is_empty() {
                let (from, to) = (at(field.selection.start), at(field.selection.end));
                let color = hsla(ACCENT, 0.25 * opacity);
                let row = |left: Pixels, right: Pixels, y: Pixels| fill(Bounds::from_corners(point(left, y), point(right, y + height)), color);
                let (left, right) = (inner.origin.x, inner.origin.x + inner.size.width);
                if from.y == to.y {
                    window.paint_quad(row(from.x, to.x, from.y));
                } else {
                    // Over several rows: the first from the start, the last up to the end, whole rows between.
                    window.paint_quad(row(from.x, right, from.y));
                    window.paint_quad(fill(Bounds::from_corners(point(left, from.y + height), point(right, to.y)), color));
                    window.paint_quad(row(left, to.x, to.y));
                }
            }
            self.paint_shaped(&layout.shaped, layout.origin, inner.size.width, if field.multiline { paint.text.align } else { TextAlign::Left }, window, cx);
            if focused {
                let cursor = at(field.cursor());
                let caret = Bounds::new(cursor, size(px(scale.max(1.0)), height));
                if field.selection.is_empty() {
                    window.paint_quad(fill(caret, hsla(paint.text.color, opacity)));
                }
                self.caret.set(Some(caret));
            }
        });
        if let (true, Some(gpui)) = (focused, gpui_backend()) {
            window.handle_input(&self.focus, FieldInput { gpui, view: id }, cx);
        }
    }
}

fn shadow(color: Hsla, dx: f32, dy: f32, blur: f32) -> BoxShadow {
    BoxShadow { color, offset: point(px(dx), px(dy)), blur_radius: px(blur), spread_radius: px(0.0), inset: false }
}

/// The web runtime's checkbox: 20 px, the accent colour when it is checked.
fn paint_checkbox(checked: bool, bounds: Bounds<Pixels>, scale: f32, opacity: f32, window: &mut Window) {
    let side = px(CHECKBOX * scale);
    let square = Bounds::centered_at(bounds.center(), size(side, side));
    let radius = px(3.0 * scale);
    if !checked {
        return window.paint_quad(quad(square, radius, hsla(Color::WHITE, opacity), px(1.5 * scale), hsla(MUTED, opacity), BorderStyle::default()));
    }
    window.paint_quad(fill(square, hsla(ACCENT, opacity)).corner_radii(radius));
    let at = |x: f32, y: f32| point(square.origin.x + side * x, square.origin.y + side * y);
    let mut tick = PathBuilder::stroke(px(2.0 * scale));
    tick.move_to(at(0.22, 0.52));
    tick.line_to(at(0.42, 0.72));
    tick.line_to(at(0.78, 0.3));
    if let Ok(tick) = tick.build() {
        window.paint_path(tick, hsla(Color::WHITE, opacity));
    }
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

/// DOM `key` names for the keys an app is likely to handle.
fn key_name(key: &Keystroke) -> String {
    let named = match key.key.as_str() {
        "enter" => "Enter",
        "escape" => "Escape",
        "backspace" => "Backspace",
        "delete" => "Delete",
        "tab" => "Tab",
        "left" => "ArrowLeft",
        "right" => "ArrowRight",
        "up" => "ArrowUp",
        "down" => "ArrowDown",
        "home" => "Home",
        "end" => "End",
        "pageup" => "PageUp",
        "pagedown" => "PageDown",
        "space" => " ",
        other => return key.key_char.clone().unwrap_or_else(|| other.to_string()),
    };
    named.to_string()
}

impl Gpui {
    fn pointer(&self, view: ViewId, phase: PointerPhase, at: Point<Pixels>) {
        if let Some(pointer) = self.pointer_at(view, at) {
            host::pointer(view, phase, pointer);
        }
    }

    /// A native view's own press handling.
    fn native_pointer(&self, view: ViewId, phase: PointerPhase, at: Point<Pixels>) {
        let found = {
            let views = self.views.borrow();
            views.get(&view).and_then(|v| v.native.clone()).zip(self.placed(&views, view))
        };
        if let Some((native, (bounds, scale))) = found {
            let local = |length: Pixels| f32::from(length) / scale;
            native.pointer(phase, local(at.x - bounds.origin.x), local(at.y - bounds.origin.y), (local(bounds.size.width), local(bounds.size.height)));
        }
    }

    /// Gives the keys to a field or a box that listens for them (or to nothing), and tells the fields.
    fn focus(&self, view: Option<ViewId>) {
        let before = self.focused.replace(view);
        if before == view {
            return;
        }
        self.caret.set(None);
        let field = |id: ViewId| self.view(id, |view| view.field.is_some()).unwrap_or(false);
        if let Some(before) = before.filter(|id| field(*id)) {
            host::event(before, Event::Blur);
        }
        if let Some(view) = view.filter(|id| field(*id)) {
            host::event(view, Event::Focus);
        }
    }

    fn mouse_down(&self, event: &MouseDownEvent, window: &mut Window) {
        if event.button == MouseButton::Navigate(NavigationDirection::Back) {
            self.back();
            return window.refresh();
        }
        if event.button != MouseButton::Left {
            return;
        }
        let at = event.position;
        // A press whose release never arrived (it happened outside the window) ends here.
        self.release(at, true);
        let target = self.target(at, false);
        let mut press = Press { target, chain: Vec::new(), start: at, moved: false, panning: None, origin: at, last: None, velocity: (0.0, 0.0), selecting: None, long_press: None };
        let Target::View(hit) = target else {
            self.focus(None);
            *self.press.borrow_mut() = Some(press);
            return window.refresh();
        };
        // A disabled view takes the press and does nothing with it.
        if self.view(hit, |view| view.enabled) != Some(true) {
            return;
        }
        let chain = self.chain(hit);
        self.focus(chain.iter().copied().find(|id| self.view(*id, |view| view.field.is_some() || view.listens(Input::Keys)).unwrap_or(false)));
        if let Some(index) = self.field_index(hit, at) {
            self.view_mut(hit, |view| {
                if let Some(field) = &mut view.field {
                    if event.modifiers.shift {
                        field.select_to(index);
                    } else {
                        field.move_to(index);
                    }
                }
            });
            press.selecting = Some(hit);
        }
        if !self.listening(&chain, &[Input::LongPress]).is_empty() {
            press.long_press = Some(self.set_timer(LONG_PRESS_MS, Box::new(move || {
                if let Some(gpui) = gpui_backend() {
                    gpui.long_press(at);
                }
            })));
        }
        press.chain = chain.clone();
        *self.press.borrow_mut() = Some(press);
        // The press state (and pointerDown) come from here even when only a pan was asked for.
        for view in self.listening(&chain, &[Input::Pointer, Input::Pan]) {
            self.pointer(view, PointerPhase::Down, at);
        }
        if event.click_count == 2 {
            for view in self.listening(&chain, &[Input::DoubleClick]) {
                self.pointer(view, PointerPhase::DoubleClick, at);
            }
        }
        self.native_pointer(hit, PointerPhase::Down, at);
        window.refresh();
    }

    /// The press that started at `start` was held without leaving the slop.
    fn long_press(&self, start: Point<Pixels>) {
        let chain = match self.press.borrow_mut().as_mut() {
            Some(press) if press.start == start && !press.moved => {
                press.long_press = None;
                press.chain.clone()
            }
            _ => return,
        };
        for view in self.listening(&chain, &[Input::LongPress]) {
            self.pointer(view, PointerPhase::LongPress, start);
        }
    }

    fn mouse_move(&self, event: &MouseMoveEvent, window: &mut Window) {
        let at = event.position;
        let held = self.press.borrow().as_ref().map(|press| (press.target, press.chain.clone(), press.start, press.moved, press.panning, press.selecting));
        let Some((target, chain, start, moved, panning, selecting)) = held else {
            if self.hover(Some(at)) {
                window.refresh();
            }
            return;
        };
        let Target::View(hit) = target else { return };
        for view in self.listening(&chain, &[Input::Pointer]) {
            self.pointer(view, PointerPhase::Move, at);
        }
        self.native_pointer(hit, PointerPhase::Move, at);
        if let Some((field, index)) = selecting.and_then(|field| Some((field, self.field_index(field, at)?))) {
            self.view_mut(field, |view| view.field.as_mut().map(|field| field.select_to(index)));
        }
        if let Some(view) = panning {
            self.pan(view, "move", at);
        } else if !moved && f32::from(at.x - start.x).hypot(f32::from(at.y - start.y)) >= SLOP {
            // The drag is recognized: it is the innermost view's that asked for pans, and no
            // longer a long press. Its translation counts from here, so the view does not jump.
            let view = self.listening(&chain, &[Input::Pan]).first().copied();
            let timer = self.press.borrow_mut().as_mut().and_then(|press| {
                press.moved = true;
                press.panning = view;
                press.origin = at;
                press.long_press.take()
            });
            if let Some(timer) = timer {
                self.clear_timer(timer);
            }
            if let Some(view) = view {
                self.pan(view, "start", at);
            }
        }
        window.refresh();
    }

    /// Reports the drag to the view that owns it. Translation and velocity are counted in the
    /// window: the view may be following the pointer.
    fn pan(&self, view: ViewId, state: &str, at: Point<Pixels>) {
        let Some((origin, velocity)) = self.press.borrow_mut().as_mut().map(|press| {
            let now = Instant::now();
            if let Some((last, then)) = press.last {
                let seconds = now.duration_since(then).as_secs_f64();
                if seconds > 0.001 {
                    press.velocity = (f32::from(at.x - last.x) as f64 / seconds, f32::from(at.y - last.y) as f64 / seconds);
                }
            }
            press.last = Some((at, now));
            (press.origin, press.velocity)
        }) else {
            return;
        };
        let Some(pointer) = self.pointer_at(view, at) else { return };
        host::pan(view, PanEvent {
            state: state.into(),
            translation_x: f32::from(at.x - origin.x) as f64,
            translation_y: f32::from(at.y - origin.y) as f64,
            velocity_x: velocity.0,
            velocity_y: velocity.1,
            x: pointer.x,
            y: pointer.y,
        });
    }

    fn mouse_up(&self, event: &MouseUpEvent, window: &mut Window) {
        if event.button == MouseButton::Left {
            self.release(event.position, false);
            self.hover(Some(event.position));
            window.refresh();
        }
    }

    /// Ends the press: the button was released, or (`cancelled`) its release never came.
    fn release(&self, at: Point<Pixels>, cancelled: bool) {
        let held = self.press.borrow_mut().as_mut().map(|press| (press.target, press.chain.clone(), press.panning, press.long_press.take()));
        let Some((target, chain, panning, long_press)) = held else { return };
        if let Some(timer) = long_press {
            self.clear_timer(timer);
        }
        let phase = if cancelled { PointerPhase::Cancel } else { PointerPhase::Up };
        if let Target::View(hit) = target {
            for view in self.listening(&chain, &[Input::Pointer, Input::Pan]) {
                self.pointer(view, phase, at);
            }
            self.native_pointer(hit, phase, at);
        }
        if let Some(view) = panning {
            self.pan(view, if cancelled { "cancel" } else { "end" }, at);
        }
        self.press.take();
        if cancelled {
            return;
        }
        let over = self.target(at, false);
        match target {
            // A drag that became a pan is not a click. Otherwise the click is the innermost
            // view's that takes one, if the button is released over it.
            Target::View(_) if panning.is_none() => {
                let click = chain.iter().copied().find(|id| self.view(*id, |view| matches!(view.kind, Kind::Button | Kind::Checkbox) || view.listens(Input::Click)).unwrap_or(false));
                let released = if let Target::View(over) = over { self.chain(over) } else { Vec::new() };
                if let Some(view) = click.filter(|view| released.contains(view)) {
                    match self.view_mut(view, |view| view.kind == Kind::Checkbox && { view.checked = !view.checked; true }) {
                        Some(true) => host::event(view, Event::Change),
                        Some(false) => host::event(view, Event::Click),
                        None => {}
                    }
                }
            }
            Target::Back if over == Target::Back => {
                self.back();
            }
            Target::Tab(tab) if over == target => {
                if let Some(nav) = self.navigation.borrow_mut().as_mut() {
                    nav.active = tab;
                }
                host::nav_tab_selected(tab);
            }
            _ => {}
        }
    }

    /// What the pointer is over now (nothing, once it left the window): hover states, the
    /// button to shade and the cursor. True when something changed.
    fn hover(&self, at: Option<Point<Pixels>>) -> bool {
        let target = at.map_or(Target::Block, |at| self.target(at, false));
        let chain = if let Target::View(view) = target { self.chain(view) } else { Vec::new() };
        let over = self.listening(&chain, &[Input::Hover]);
        let (hot, cursor) = {
            let views = self.views.borrow();
            let view = chain.first().and_then(|id| views.get(id));
            let clickable = chain.iter().filter_map(|id| views.get(id)).any(|view| view.enabled && (matches!(view.kind, Kind::Button | Kind::Checkbox) || view.listens(Input::Click)));
            let cursor = match target {
                Target::Back | Target::Tab(_) => CursorStyle::PointingHand,
                Target::View(_) if view.is_some_and(|view| view.field.is_some()) => CursorStyle::IBeam,
                Target::View(_) if clickable => CursorStyle::PointingHand,
                _ => CursorStyle::Arrow,
            };
            (chain.first().copied().filter(|_| view.is_some_and(|view| view.kind == Kind::Button)), cursor)
        };
        let before = self.hovered.replace(over.clone());
        for view in before.iter().filter(|view| !over.contains(view)) {
            host::hover(*view, false);
        }
        for view in over.iter().filter(|view| !before.contains(view)) {
            host::hover(*view, true);
        }
        let shaded = self.hot.replace(hot) != hot;
        let pointed = self.cursor.replace(cursor) != cursor;
        before != over || shaded || pointed
    }

    fn wheel(&self, event: &ScrollWheelEvent, window: &mut Window) {
        let Target::View(deepest) = self.target(event.position, true) else { return };
        let chain = self.chain(deepest);
        let delta = event.delta.pixel_delta(px(40.0));
        let (dx, dy) = (f32::from(delta.x), f32::from(delta.y));
        if event.modifiers.control {
            // Ctrl + wheel as a pinch, for a desktop without a touchpad: each notch scales by a
            // tenth, and the gesture ends when the wheel rests.
            let Some(view) = self.listening(&chain, &[Input::Pinch]).first().copied() else { return };
            let at = event.position;
            let scale = match self.pinch.take() {
                Some((pinched, scale, rest)) if pinched == view => {
                    if let Some(rest) = rest {
                        self.clear_timer(rest);
                    }
                    scale
                }
                _ => {
                    self.pinched(view, "start", 1.0, at);
                    1.0
                }
            };
            let scale = scale * (1.0 + dy as f64 / 40.0 * 0.1).max(0.1);
            let rest = self.set_timer(250, Box::new(move || {
                if let Some(gpui) = gpui_backend() {
                    if let Some((view, scale, _)) = gpui.pinch.take() {
                        gpui.pinched(view, "end", scale, at);
                    }
                }
            }));
            *self.pinch.borrow_mut() = Some((view, scale, Some(rest)));
            self.pinched(view, "move", scale, at);
            return window.refresh();
        }
        // The innermost scroller under the pointer that can still move that way takes the wheel.
        let scrolled = {
            let views = self.views.borrow();
            chain.iter().find_map(|id| {
                let view = views.get(id)?;
                let scroll = view.scroll.as_ref()?;
                let (along, viewport, by) = if scroll.horizontal {
                    (scroll.content.0, view.frame.w as f32, if dx != 0.0 || !event.modifiers.shift { dx } else { dy })
                } else {
                    (scroll.content.1, view.frame.h as f32, dy)
                };
                let to = (scroll.offset.get() - by).clamp(0.0, (along - viewport).max(0.0));
                (to != scroll.offset.replace(to)).then(|| {
                    let (left, top) = if scroll.horizontal { (to, 0.0) } else { (0.0, to) };
                    let event = ScrollEvent {
                        scroll_top: top as f64,
                        scroll_left: left as f64,
                        scroll_height: scroll.content.1 as f64,
                        scroll_width: scroll.content.0 as f64,
                        client_height: view.frame.h as f64,
                        client_width: view.frame.w as f64,
                    };
                    (*id, view.listens(Input::Scroll).then_some(event))
                })
            })
        };
        if let Some((view, event)) = scrolled {
            if let Some(event) = event {
                host::scrolled(view, event);
            }
            window.refresh();
        }
    }

    fn pinched(&self, view: ViewId, state: &str, scale: f64, at: Point<Pixels>) {
        let (focal_x, focal_y) = self.pointer_at(view, at).map_or((0.0, 0.0), |pointer| (pointer.x, pointer.y));
        host::pinch(view, PinchEvent { state: state.into(), scale, focal_x, focal_y });
    }

    /// Two fingers on a touchpad, as the platform reports them.
    fn touch_pinch(&self, event: &gpui::PinchEvent, window: &mut Window) {
        match event.phase {
            TouchPhase::Started => {
                let Target::View(deepest) = self.target(event.position, true) else { return };
                let Some(view) = self.listening(&self.chain(deepest), &[Input::Pinch]).first().copied() else { return };
                *self.pinch.borrow_mut() = Some((view, 1.0, None));
                self.pinched(view, "start", 1.0, event.position);
            }
            phase => {
                let Some((view, scale, _)) = self.pinch.take() else { return };
                let scale = scale + event.delta as f64;
                if phase == TouchPhase::Moved {
                    *self.pinch.borrow_mut() = Some((view, scale, None));
                }
                self.pinched(view, if phase == TouchPhase::Moved { "move" } else { "end" }, scale, event.position);
            }
        }
        window.refresh();
    }

    /// A key, to the view that has the keys; true when it was used.
    fn key_down(&self, key: &Keystroke, window: &mut Window, cx: &mut App) -> bool {
        let focused = self.focused.get().filter(|id| self.view(*id, |view| view.enabled) == Some(true));
        let mut used = false;
        if let Some(view) = focused {
            // Before the field handles the key itself (Enter, the arrows).
            if self.view(view, |view| view.listens(Input::Keys)) == Some(true) {
                host::key(view, &key_name(key));
            }
            used = self.field_key(view, key, cx);
            if !used && key.key == "escape" {
                self.focus(None);
                used = true;
            }
        }
        // Back, as the platform's back button or key goes back on the other targets.
        if !used && (key.key == "escape" || (key.modifiers.alt && key.key == "left")) {
            used = self.back();
        }
        window.refresh();
        used
    }

    /// The keys a field handles itself; text arrives through the platform's text input (`FieldInput`).
    fn field_key(&self, id: ViewId, key: &Keystroke, cx: &mut App) -> bool {
        let command = key.modifiers.control || key.modifiers.platform;
        let shift = key.modifiers.shift;
        let mut event = None;
        let used = self.view_mut(id, |view| {
            let Some(field) = &mut view.field else { return false };
            let (cursor, selection) = (field.cursor(), field.selection.clone());
            let go = |field: &mut Field, to: usize| if shift { field.select_to(to) } else { field.move_to(to) };
            let mut cut = |field: &mut Field, range: std::ops::Range<usize>| {
                if !range.is_empty() {
                    field.replace(Some(range), "");
                    event = Some(Event::Input);
                }
            };
            match key.key.as_str() {
                "left" if !shift && !selection.is_empty() => field.move_to(selection.start),
                "right" if !shift && !selection.is_empty() => field.move_to(selection.end),
                "left" => go(field, field.previous(cursor)),
                "right" => go(field, field.next(cursor)),
                "home" => go(field, 0),
                "end" => go(field, field.text.len()),
                "backspace" => cut(field, if selection.is_empty() { field.previous(cursor)..cursor } else { selection }),
                "delete" => cut(field, if selection.is_empty() { cursor..field.next(cursor) } else { selection }),
                "enter" if field.multiline => {
                    field.replace(None, "\n");
                    event = Some(Event::Input);
                }
                // A field is committed with Enter.
                "enter" => event = Some(Event::Change),
                "a" if command => {
                    field.move_to(0);
                    field.select_to(field.text.len());
                }
                "c" | "x" if command => {
                    if !selection.is_empty() && !field.password {
                        cx.write_to_clipboard(ClipboardItem::new_string(field.text[selection.clone()].to_string()));
                        if key.key == "x" {
                            cut(field, selection);
                        }
                    }
                }
                "v" if command => {
                    if let Some(text) = cx.read_from_clipboard().and_then(|item| item.text()) {
                        field.replace(None, &text);
                        event = Some(Event::Input);
                    }
                }
                _ => return false,
            }
            true
        });
        if let Some(event) = event {
            host::event(id, event);
        }
        used == Some(true)
    }

    /// The user goes back: the top screen leaves its stack, and the router follows.
    fn back(&self) -> bool {
        let popped = self.navigation.borrow_mut().as_mut().and_then(|nav| {
            let tab = nav.active;
            let page = (nav.stacks[tab].len() > 1).then(|| nav.stacks[tab].pop())??;
            let root = page.root;
            nav.leaving.push((tab, page, Instant::now()));
            Some((tab, root))
        });
        if let Some((tab, root)) = popped {
            host::nav_popped(tab, root);
        }
        popped.is_some()
    }
}

/// The platform's text input (typed characters, an input method's composition) for the focused field.
struct FieldInput {
    gpui: Rc<Gpui>,
    view: ViewId,
}

impl FieldInput {
    fn read<T>(&self, f: impl FnOnce(&Field) -> T) -> Option<T> {
        self.gpui.view(self.view, |view| view.field.as_ref().map(f)).flatten()
    }

    /// Changes the field as the user does: the app hears of it, and the window shows it.
    fn edit(&self, window: &mut Window, f: impl FnOnce(&mut Field)) {
        let edited = self.gpui.view_mut(self.view, |view| match &mut view.field {
            Some(field) if view.enabled => {
                f(field);
                true
            }
            _ => false,
        });
        if edited == Some(true) {
            host::event(self.view, Event::Input);
            window.refresh();
        }
    }
}

impl InputHandler for FieldInput {
    fn selected_text_range(&mut self, _: bool, _: &mut Window, _: &mut App) -> Option<UTF16Selection> {
        self.read(|field| UTF16Selection { range: field.range_to_utf16(&field.selection), reversed: field.reversed })
    }

    fn marked_text_range(&mut self, _: &mut Window, _: &mut App) -> Option<std::ops::Range<usize>> {
        self.read(|field| field.marked.as_ref().map(|range| field.range_to_utf16(range))).flatten()
    }

    fn text_for_range(&mut self, range: std::ops::Range<usize>, adjusted: &mut Option<std::ops::Range<usize>>, _: &mut Window, _: &mut App) -> Option<String> {
        self.read(|field| {
            let range = field.range_from_utf16(&range);
            adjusted.replace(field.range_to_utf16(&range));
            field.text[range].to_string()
        })
    }

    fn replace_text_in_range(&mut self, range: Option<std::ops::Range<usize>>, text: &str, window: &mut Window, _: &mut App) {
        self.edit(window, |field| {
            let range = range.map(|range| field.range_from_utf16(&range));
            field.replace(range, text);
        });
    }

    fn replace_and_mark_text_in_range(&mut self, range: Option<std::ops::Range<usize>>, text: &str, selected: Option<std::ops::Range<usize>>, window: &mut Window, _: &mut App) {
        self.edit(window, |field| {
            let range = range.map(|range| field.range_from_utf16(&range));
            let written = field.replace(range, text);
            field.marked = (!written.is_empty()).then(|| written.clone());
            // The selection the input method wants, counted in UTF-16 inside what it is composing.
            if let Some(selected) = selected {
                let before = field.range_to_utf16(&(0..written.start)).end;
                field.selection = field.range_from_utf16(&(before + selected.start..before + selected.end));
            }
        });
    }

    fn unmark_text(&mut self, _: &mut Window, _: &mut App) {
        self.gpui.view_mut(self.view, |view| view.field.as_mut().map(|field| field.marked = None));
    }

    fn bounds_for_range(&mut self, _: std::ops::Range<usize>, _: &mut Window, _: &mut App) -> Option<Bounds<Pixels>> {
        self.gpui.caret.get()
    }

    fn character_index_for_point(&mut self, at: Point<Pixels>, _: &mut Window, _: &mut App) -> Option<usize> {
        let index = self.gpui.field_index(self.view, at)?;
        self.read(|field| field.range_to_utf16(&(0..index)).end)
    }
}

// ---------------------------------------------------------------------------
// The backend
// ---------------------------------------------------------------------------

/// The semantic icon names of a tab, as the glyphs the Android and web runtimes show.
fn glyph(icon: &str) -> &'static str {
    match icon {
        "home" => "⌂",
        "list" => "☰",
        "cloud" => "☁",
        "star" => "★",
        "person" => "◉",
        "settings" => "⚙",
        "search" => "⌕",
        _ => "●",
    }
}

fn image_format(bytes: &[u8]) -> ImageFormat {
    match bytes {
        [0x89, b'P', b'N', b'G', ..] => ImageFormat::Png,
        [0xff, 0xd8, ..] => ImageFormat::Jpeg,
        [b'G', b'I', b'F', ..] => ImageFormat::Gif,
        [b'R', b'I', b'F', b'F', _, _, _, _, b'W', b'E', b'B', b'P', ..] => ImageFormat::Webp,
        [b'B', b'M', ..] => ImageFormat::Bmp,
        _ => ImageFormat::Svg,
    }
}

impl Backend for Gpui {
    fn create(&self, kind: Kind) -> ViewId {
        self.add(View::new(kind))
    }

    fn adopt(&self, native: NativeView) -> ViewId {
        let draw = native.downcast_ref::<Rc<dyn Draw>>().cloned().expect("a native component of the GPUI backend creates a gpui_backend::Draw (gpui_backend::native)");
        self.add(View { native: Some(draw), ..View::new(Kind::Native) })
    }

    fn destroy(&self, view: ViewId) {
        self.views.borrow_mut().remove(&view);
        self.laid.borrow_mut().remove(&view);
        self.overlays.borrow_mut().retain(|root| *root != view);
        if let Some(nav) = self.navigation.borrow_mut().as_mut() {
            nav.leaving.retain(|(_, page, _)| page.root != view);
        }
    }

    fn set_children(&self, parent: ViewId, children: &[ViewId]) {
        let mut views = self.views.borrow_mut();
        let Some(before) = views.get_mut(&parent).map(|view| std::mem::replace(&mut view.children, children.to_vec())) else { return };
        let kept: HashSet<ViewId> = children.iter().copied().collect();
        for child in before.iter().filter(|child| !kept.contains(child)) {
            if let Some(child) = views.get_mut(child).filter(|child| child.parent == Some(parent)) {
                child.parent = None;
            }
        }
        for child in children {
            if let Some(child) = views.get_mut(child) {
                child.parent = Some(parent);
            }
        }
    }

    fn reorder(&self, parent: ViewId, children: &[ViewId]) {
        self.view_mut(parent, |view| view.children = children.to_vec());
    }

    fn set_frame(&self, view: ViewId, frame: Rect) {
        self.view_mut(view, |view| view.frame = frame);
    }

    fn paint(&self, view: ViewId, _kind: Kind, paint: &Paint) {
        self.view_mut(view, |view| view.paint = Some(*paint));
    }

    fn measure(&self, view: ViewId, max_width: f32) -> (f32, f32) {
        let views = self.views.borrow();
        let Some((view, paint)) = views.get(&view).and_then(|view| Some((view, view.paint.as_ref()?))) else { return (0.0, 0.0) };
        match (view.kind, &view.field, &view.native) {
            (Kind::Text | Kind::Button, _, _) => self.text_size(&view.text, &paint.text, max_width),
            (Kind::Input, _, _) => (max_width, self.line_height(&paint.text).ceil()),
            (Kind::Textarea, Some(field), _) => self.text_size(if field.text.is_empty() { "Ag" } else { &field.text }, &paint.text, max_width),
            (Kind::Checkbox, _, _) => (CHECKBOX, CHECKBOX),
            (Kind::Native, _, Some(native)) => native.measure(max_width),
            _ => (0.0, 0.0),
        }
    }

    fn make_scrollable(&self, view: ViewId, horizontal: bool) {
        self.view_mut(view, |view| view.scroll = Some(Scroll { horizontal, page: false, content: (0.0, 0.0), offset: Cell::new(0.0) }));
    }

    fn set_content_size(&self, view: ViewId, width: i32, height: i32) {
        self.view_mut(view, |view| {
            if let Some(scroll) = &mut view.scroll {
                scroll.content = (width as f32, height as f32);
                // The content may have shrunk under where it was scrolled to.
                let (along, viewport) = if scroll.horizontal { (width, view.frame.w) } else { (height, view.frame.h) };
                scroll.offset.set(scroll.offset.get().min((along - viewport).max(0) as f32));
            }
        });
    }

    fn set_text(&self, view: ViewId, text: &str) {
        self.view_mut(view, |view| view.text = text.to_string());
    }

    fn set_value(&self, view: ViewId, text: &str) {
        self.view_mut(view, |view| view.field.as_mut().map(|field| field.set_text(text)));
    }

    fn set_placeholder(&self, view: ViewId, text: &str) {
        self.view_mut(view, |view| view.field.as_mut().map(|field| field.placeholder = text.to_string()));
    }

    fn set_checked(&self, view: ViewId, checked: bool) {
        self.view_mut(view, |view| view.checked = checked);
    }

    fn set_enabled(&self, view: ViewId, enabled: bool) {
        self.view_mut(view, |view| view.enabled = enabled);
    }

    fn set_input_type(&self, view: ViewId, input_type: &str) {
        // "email" and "number" are hints for an on-screen keyboard, which a desktop has not.
        self.view_mut(view, |view| view.field.as_mut().map(|field| field.password = input_type == "password"));
    }

    fn set_image(&self, view: ViewId, bytes: &[u8]) {
        let image = Image::from_bytes(image_format(bytes), bytes.to_vec()).to_image_data(self.svg.clone()).ok();
        self.view_mut(view, |view| view.image = image);
    }

    fn set_label(&self, _view: ViewId, _label: &str) {
        // Nothing reads it: this backend publishes no accessibility tree.
    }

    fn control_state(&self, view: ViewId) -> (String, bool) {
        self.view(view, |view| match &view.field {
            Some(field) => (field.text.clone(), false),
            None => (if view.checked { "on" } else { "" }.into(), view.checked),
        })
        .unwrap_or_default()
    }

    fn listen(&self, view: ViewId, input: Input) {
        self.view_mut(view, |view| view.listens |= 1 << input as u16);
    }

    fn open_url(&self, url: &str) {
        // Not now: the app is in use, by whatever event led here.
        let url = url.to_string();
        self.cx.spawn(async move |cx| cx.update(|cx| cx.open_url(&url))).detach();
    }

    fn show_screen(&self, root: ViewId) {
        self.screen.set(Some(root));
    }

    fn show_overlay(&self, root: ViewId) {
        self.overlays.borrow_mut().push(root);
    }

    fn request_layout(&self) {
        self.layout_request.set(self.layout_request.get() + 1);
        self.frame_pending.set(true);
    }

    fn nav_create(&self, tabs: &[TabInfo], active: usize) {
        let stacks = (0..tabs.len().max(1)).map(|_| Vec::new()).collect();
        let tabs = tabs.iter().map(|tab| (glyph(&tab.icon).to_string(), tab.title.clone())).collect();
        *self.navigation.borrow_mut() = Some(Navigation { tabs, stacks, active, entering: None, leaving: Vec::new() });
    }

    fn nav_push(&self, tab: usize, screen: &Screen, animated: bool) {
        if let Some(nav) = self.navigation.borrow_mut().as_mut() {
            nav.stacks[tab].push(Page::of(screen));
            if animated && tab == nav.active {
                nav.entering = Some((screen.root, Instant::now()));
            }
        }
    }

    fn nav_pop(&self, tab: usize, animated: bool) {
        if let Some(nav) = self.navigation.borrow_mut().as_mut() {
            if let Some(page) = nav.stacks[tab].pop().filter(|_| animated) {
                nav.leaving.push((tab, page, Instant::now()));
            }
        }
    }

    fn nav_replace(&self, tab: usize, screen: &Screen) {
        if let Some(nav) = self.navigation.borrow_mut().as_mut() {
            nav.stacks[tab] = vec![Page::of(screen)];
        }
    }

    fn nav_select_tab(&self, tab: usize) {
        if let Some(nav) = self.navigation.borrow_mut().as_mut() {
            nav.active = tab;
        }
    }

    fn set_timer(&self, ms: u64, callback: Box<dyn FnOnce()>) -> u64 {
        let id = self.next_timer.replace(self.next_timer.get() + 1);
        let window = self.window;
        let task = self.cx.spawn(async move |cx| {
            cx.background_executor().timer(Duration::from_millis(ms)).await;
            let _ = window.update(cx, |_, window, _| {
                let Some(gpui) = gpui_backend() else { return };
                // This task is done: let go of it without cancelling what is running.
                if let Some(task) = gpui.timers.borrow_mut().remove(&id) {
                    task.detach();
                }
                if gpui.frame_pending.get() {
                    // What the app changed before this timer was due is not on screen yet. Run
                    // after that frame, as the other platforms do (or shortly, if no frame
                    // comes: the window may be hidden).
                    gpui.after_frame.borrow_mut().push(callback);
                    let late = window.window_handle();
                    gpui.cx.spawn(async move |cx| {
                        cx.background_executor().timer(Duration::from_millis(100)).await;
                        let _ = late.update(cx, |_, window, _| frame_done(window));
                    })
                    .detach();
                } else {
                    callback();
                    window.refresh();
                }
            });
        });
        self.timers.borrow_mut().insert(id, task);
        id
    }

    fn clear_timer(&self, timer: u64) {
        self.timers.borrow_mut().remove(&timer);
    }

    fn request_frame(&self, callback: Box<dyn FnOnce()>) -> u64 {
        let id = self.next_timer.replace(self.next_timer.get() + 1);
        self.frames.borrow_mut().push((id, callback));
        if !self.ticking.replace(true) {
            let window = self.window;
            self.cx.spawn(async move |cx| window.update(cx, |_, window, _| window.on_next_frame(tick))).detach();
        }
        id
    }

    fn cancel_frame(&self, frame: u64) {
        self.frames.borrow_mut().retain(|(id, _)| *id != frame);
    }

    fn waker(&self) -> Arc<dyn Fn() + Send + Sync> {
        // Always through the main loop, never inline: a task may wake itself while it runs.
        let signal = self.signal.clone();
        Arc::new(move || {
            signal.set.store(true, Ordering::SeqCst);
            if let Some(waker) = signal.waker.lock().unwrap().take() {
                waker.wake();
            }
        })
    }
}

/// Runs the requestAnimationFrame callbacks, before the frame is drawn. Callbacks asked for
/// during this frame run in the next one.
fn tick(window: &mut Window, _: &mut App) {
    let Some(gpui) = gpui_backend() else { return };
    for (_, callback) in gpui.frames.take() {
        callback();
    }
    if gpui.frames.borrow().is_empty() {
        gpui.ticking.set(false);
    } else {
        window.on_next_frame(tick);
    }
    window.refresh();
}

/// Runs what waited for the frame.
fn frame_done(window: &mut Window) {
    let Some(gpui) = gpui_backend() else { return };
    gpui.frame_pending.set(false);
    let waiting = gpui.after_frame.take();
    if !waiting.is_empty() {
        for callback in waiting {
            callback();
        }
        window.refresh();
    }
}

// ---------------------------------------------------------------------------
// The window
// ---------------------------------------------------------------------------

/// The one element of the window: it lays out, paints and takes the input of everything.
struct Stage(Rc<Gpui>);

impl IntoElement for Stage {
    type Element = Self;

    fn into_element(self) -> Self {
        self
    }
}

impl Element for Stage {
    type RequestLayoutState = ();
    type PrepaintState = Hitbox;

    fn id(&self) -> Option<gpui::ElementId> {
        None
    }

    fn source_location(&self) -> Option<&'static std::panic::Location<'static>> {
        None
    }

    fn request_layout(&mut self, _: Option<&GlobalElementId>, _: Option<&InspectorElementId>, window: &mut Window, cx: &mut App) -> (LayoutId, ()) {
        let mut style = Style::default();
        style.size.width = relative(1.0).into();
        style.size.height = relative(1.0).into();
        (window.request_layout(style, [], cx), ())
    }

    fn prepaint(&mut self, _: Option<&GlobalElementId>, _: Option<&InspectorElementId>, bounds: Bounds<Pixels>, _: &mut (), window: &mut Window, cx: &mut App) -> Hitbox {
        // Keys go to the element that has the focus: this one, which registers the key listener.
        window.set_focus_handle(&self.0.focus, cx);
        self.0.plan(bounds.size, window);
        window.insert_hitbox(bounds, HitboxBehavior::Normal)
    }

    fn paint(&mut self, _: Option<&GlobalElementId>, _: Option<&InspectorElementId>, _: Bounds<Pixels>, _: &mut (), hitbox: &mut Hitbox, window: &mut Window, cx: &mut App) {
        let gpui = &self.0;
        gpui.draw(window, cx);
        window.set_cursor_style(gpui.cursor.get(), hitbox);
        // Timers that were due wait for this frame; they run once it is on screen.
        if gpui.frame_pending.get() {
            window.defer(cx, |window, _| frame_done(window));
        }

        fn bubbling<E: 'static>(gpui: &Rc<Gpui>, handle: impl Fn(&Gpui, &E, &mut Window) + 'static) -> impl FnMut(&E, DispatchPhase, &mut Window, &mut App) + 'static {
            let gpui = gpui.clone();
            move |event, phase, window, _| {
                if phase == DispatchPhase::Bubble {
                    handle(&gpui, event, window);
                }
            }
        }
        window.on_mouse_event(bubbling(gpui, Gpui::mouse_down));
        window.on_mouse_event(bubbling(gpui, Gpui::mouse_move));
        window.on_mouse_event(bubbling(gpui, Gpui::mouse_up));
        window.on_mouse_event(bubbling(gpui, Gpui::wheel));
        window.on_mouse_event(bubbling(gpui, Gpui::touch_pinch));
        window.on_mouse_event(bubbling(gpui, |gpui: &Gpui, _: &MouseExitEvent, window: &mut Window| {
            if gpui.hover(None) {
                window.refresh();
            }
        }));
        let keys = gpui.clone();
        window.on_key_event(move |event: &KeyDownEvent, phase, window, cx| {
            // A key the app or a field used goes no further; any other reaches the platform's
            // text input, which types it into the focused field.
            if phase == DispatchPhase::Bubble && keys.key_down(&event.keystroke, window, cx) {
                cx.stop_propagation();
            }
        });
    }
}

struct Host {
    gpui: Rc<Gpui>,
}

impl Render for Host {
    fn render(&mut self, _: &mut Window, _: &mut Context<Self>) -> impl IntoElement {
        Stage(self.gpui.clone())
    }
}

/// Opens the window and runs `entry` (the app's top-level code) in it.
pub fn run(entry: fn()) {
    gpui_platform::application().run(move |cx: &mut App| {
        // Grayscale glyph anti-aliasing, as GTK draws text; GPUI's Linux default fringes glyphs with colour.
        cx.set_text_rendering_mode(gpui::TextRenderingMode::Grayscale);
        let name = std::env::current_exe().ok().and_then(|path| Some(path.file_name()?.to_string_lossy().into_owned())).unwrap_or_default();
        let options = WindowOptions {
            window_bounds: Some(WindowBounds::Windowed(Bounds::centered(None, size(px(420.0), px(780.0)), cx))),
            titlebar: Some(TitlebarOptions { title: Some(name.into()), ..TitlebarOptions::default() }),
            app_id: Some("dev.nuclo.app".into()),
            ..WindowOptions::default()
        };
        cx.open_window(options, move |window, cx| {
            let gpui = Rc::new(Gpui {
                cx: cx.to_async(),
                window: window.window_handle(),
                text: window.text_system().clone(),
                fonts: Fonts::detect(cx.text_system()),
                svg: cx.svg_renderer(),
                focus: cx.focus_handle(),
                views: RefCell::default(),
                next_view: Cell::new(1),
                screen: Cell::new(None),
                overlays: RefCell::default(),
                navigation: RefCell::new(None),
                size: Cell::new(window.viewport_size()),
                layers: RefCell::default(),
                laid: RefCell::default(),
                layout_request: Cell::new(0),
                title: RefCell::default(),
                timers: RefCell::default(),
                next_timer: Cell::new(1),
                frames: RefCell::default(),
                ticking: Cell::new(false),
                frame_pending: Cell::new(false),
                after_frame: RefCell::default(),
                signal: Arc::default(),
                press: RefCell::new(None),
                hovered: RefCell::default(),
                hot: Cell::new(None),
                cursor: Cell::new(CursorStyle::Arrow),
                focused: Cell::new(None),
                caret: Cell::new(None),
                pinch: RefCell::new(None),
            });
            GPUI.with(|slot| *slot.borrow_mut() = Some(gpui.clone()));
            // `waker()` from another thread (a fetch that finished) ends up here, on the UI thread.
            let (signal, handle) = (gpui.signal.clone(), gpui.window);
            cx.spawn(async move |cx| loop {
                poll_fn(|context| {
                    *signal.waker.lock().unwrap() = Some(context.waker().clone());
                    if signal.set.swap(false, Ordering::SeqCst) { Poll::Ready(()) } else { Poll::Pending }
                })
                .await;
                let woken = handle.update(cx, |_, window, _| {
                    host::wake();
                    window.refresh();
                });
                if woken.is_err() {
                    break;
                }
            })
            .detach();
            window.focus(&gpui.focus, cx);
            crate::nuclo::start(gpui.clone());
            entry();
            cx.new(|_| Host { gpui })
        })
        .expect("the window did not open");
        cx.on_window_closed(|cx, _| cx.quit()).detach();
        cx.activate(true);
    });
}
