// The renderer of ui.ns and store.ns for Linux: the bodies of their `extern` declarations, over the Rust
// core of nuclo (runtime/rust/nuclo). The same file builds with the GTK 4 / libadwaita backend
// (native/linux) and the GPUI backend (native/linux-gpui): only the shell, main.rs, picks the backend.
// Types and names as nns writes them: a lambda is an `Rc<dyn Fn>`, a string a `Str`, a list a `List`.

use crate::nns_rt::{List, Str};
use crate::nuclo::prelude as nu;
use crate::store::Row;
use crate::ui::{Action, Attributes, Look, Mod, Pan, Pinch, Point, Scroll, Style as StyleObject, Tab, Viewport};
use std::cell::RefCell;
use std::rc::Rc;

pub type View = nu::Mod;
pub type StyleResult = nu::StyleClass;

// ---- styles ------------------------------------------------------------------------

fn color(c: &Option<Str>) -> Option<nu::Color> {
  c.as_deref().and_then(nu::css_color)
}

fn direction(v: &Option<Str>) -> Option<nu::FlexDirection> {
  match v.as_deref() {
    Some("row") => Some(nu::FlexDirection::Row),
    Some("column") => Some(nu::FlexDirection::Column),
    _ => None,
  }
}

fn align(v: &Option<Str>) -> Option<nu::Align> {
  match v.as_deref() {
    Some("flex-start" | "start") => Some(nu::Align::FlexStart),
    Some("center") => Some(nu::Align::Center),
    Some("flex-end" | "end") => Some(nu::Align::FlexEnd),
    Some("stretch") => Some(nu::Align::Stretch),
    _ => None,
  }
}

fn display(v: &Option<Str>) -> Option<nu::Display> {
  match v.as_deref() {
    Some("none") => Some(nu::Display::None),
    Some(_) => Some(nu::Display::Flex),
    None => None,
  }
}

/// A state or a breakpoint: the keys of `Look`.
fn look(l: &Look) -> nu::Style {
  nu::Style {
    background_color: color(&l.background_color),
    color: color(&l.color),
    border_color: color(&l.border_color),
    opacity: l.opacity,
    scale: l.scale,
    flex_direction: direction(&l.flex_direction),
    flex: l.flex,
    gap: l.gap,
    padding: l.padding,
    padding_left: l.px,
    padding_right: l.px,
    padding_top: l.py,
    padding_bottom: l.py,
    width: l.width,
    max_width: l.max_width,
    height: l.height,
    font_size: l.font_size,
    display: display(&l.display),
    ..Default::default()
  }
}

/// nuclo-core's style object as the core's style. A string the core has no value for is left unset.
pub fn css(s: StyleObject) -> StyleResult {
  let mut media = vec![];
  if let Some(m) = &s.md {
    media.push(nu::MediaRule::new(Some(720.0), None, look(m)));
  }
  if let Some(l) = &s.lg {
    media.push(nu::MediaRule::new(Some(1080.0), None, look(l)));
  }
  nu::css(nu::Style {
    flex_direction: direction(&s.flex_direction),
    align_items: align(&s.align_items),
    align_self: align(&s.align_self),
    justify_content: match s.justify_content.as_deref() {
      Some("flex-start" | "start") => Some(nu::Justify::FlexStart),
      Some("center") => Some(nu::Justify::Center),
      Some("flex-end" | "end") => Some(nu::Justify::FlexEnd),
      Some("space-between") => Some(nu::Justify::SpaceBetween),
      Some("space-around") => Some(nu::Justify::SpaceAround),
      Some("space-evenly") => Some(nu::Justify::SpaceEvenly),
      _ => None,
    },
    flex_wrap: match s.flex_wrap.as_deref() {
      Some("wrap") => Some(nu::FlexWrap::Wrap),
      Some("nowrap") => Some(nu::FlexWrap::Nowrap),
      _ => None,
    },
    flex: s.flex,
    gap: s.gap,
    padding: s.padding,
    padding_left: s.pl.or(s.px),
    padding_right: s.pr.or(s.px),
    padding_top: s.pt.or(s.py),
    padding_bottom: s.pb.or(s.py),
    margin: s.margin,
    margin_top: s.mt.or(s.my),
    margin_bottom: s.mb.or(s.my),
    margin_left: s.ml.or(s.mx),
    margin_right: s.mr.or(s.mx),
    width: s.width,
    width_pct: s.width_pct,
    height: s.height,
    min_width: s.min_width,
    max_width: s.max_width,
    min_height: s.min_height,
    max_height: s.max_height,
    aspect_ratio: s.aspect_ratio,
    overflow: match s.overflow.as_deref() {
      Some("visible") => Some(nu::Overflow::Visible),
      Some("hidden") => Some(nu::Overflow::Hidden),
      Some("scroll") => Some(nu::Overflow::Scroll),
      _ => None,
    },
    position: match s.position.as_deref() {
      Some("absolute") => Some(nu::Position::Absolute),
      Some("relative") => Some(nu::Position::Relative),
      _ => None,
    },
    top: s.top,
    right: s.right,
    bottom: s.bottom,
    left: s.left,
    z_index: s.z_index,
    display: display(&s.display),
    background_color: color(&s.background_color),
    color: color(&s.color),
    opacity: s.opacity,
    border_radius: s.border_radius,
    border_width: s.border_width,
    border_color: color(&s.border_color),
    border_top_width: s.border_top_width,
    border_bottom_width: s.border_bottom_width,
    shadow_color: color(&s.shadow_color),
    shadow_radius: s.shadow_radius,
    shadow_offset_y: s.shadow_offset_y,
    shadow_offset_x: s.shadow_radius.map(|_| 0.0),
    font_size: s.font_size,
    font_weight: match s.font_weight.as_deref() {
      Some("light" | "300") => Some(nu::FontWeight::Light),
      Some("normal" | "400") => Some(nu::FontWeight::Normal),
      Some("medium" | "500") => Some(nu::FontWeight::Medium),
      Some("semibold" | "600") => Some(nu::FontWeight::Semibold),
      Some("bold" | "700") => Some(nu::FontWeight::Bold),
      _ => None,
    },
    font_style: match s.font_style.as_deref() {
      Some("italic") => Some(nu::FontStyle::Italic),
      Some("normal") => Some(nu::FontStyle::Normal),
      _ => None,
    },
    font_family: s.font_family.as_deref().and_then(nu::css_font),
    line_height: s.line_height,
    letter_spacing: s.letter_spacing,
    text_align: match s.text_align.as_deref() {
      Some("left") => Some(nu::TextAlign::Left),
      Some("center") => Some(nu::TextAlign::Center),
      Some("right") => Some(nu::TextAlign::Right),
      _ => None,
    },
    text_decoration: match s.text_decoration.as_deref() {
      Some("none") => Some(nu::TextDecoration::None),
      Some("underline") => Some(nu::TextDecoration::Underline),
      Some("line-through") => Some(nu::TextDecoration::LineThrough),
      _ => None,
    },
    text_transform: match s.text_transform.as_deref() {
      Some("none") => Some(nu::TextTransform::None),
      Some("uppercase") => Some(nu::TextTransform::Uppercase),
      Some("lowercase") => Some(nu::TextTransform::Lowercase),
      Some("capitalize") => Some(nu::TextTransform::Capitalize),
      _ => None,
    },
    number_of_lines: s.number_of_lines,
    object_fit: match s.object_fit.as_deref() {
      Some("contain") => Some(nu::ObjectFit::Contain),
      Some("fill") => Some(nu::ObjectFit::Fill),
      Some("cover") => Some(nu::ObjectFit::Cover),
      _ => None,
    },
    pointer_events: match s.pointer_events.as_deref() {
      Some("none") => Some(nu::PointerEvents::None),
      Some("auto") => Some(nu::PointerEvents::Auto),
      _ => None,
    },
    translate_x: s.translate_x,
    translate_y: s.translate_y,
    scale: s.scale,
    rotate: s.rotate,
    transition_duration: s.transition,
    transition_easing: match s.easing.as_deref() {
      Some("linear") => Some(nu::Easing::Linear),
      Some("ease") => Some(nu::Easing::Ease),
      Some("ease-in") => Some(nu::Easing::EaseIn),
      Some("ease-out") => Some(nu::Easing::EaseOut),
      Some("ease-in-out") => Some(nu::Easing::EaseInOut),
      Some("spring") => Some(nu::Easing::Spring),
      _ => None,
    },
    pressed: s.pressed.as_ref().and_then(|l| nu::css_state(look(l))),
    hover: s.hover.as_ref().and_then(|l| nu::css_state(look(l))),
    media: if media.is_empty() { None } else { nu::css_media(media) },
    ..Default::default()
  })
}

// ---- builders ----------------------------------------------------------------------

pub fn el(tag: Str, mods: List<Mod>) -> View {
  let m: Vec<nu::Mod> = mods
    .iter()
    .flat_map(|m| match m {
      Mod::Part(v) => vec![v.clone()],
      Mod::Text(s) => vec![nu::A::text(s)],
      Mod::TextOf(f) => {
        let f = f.clone();
        vec![nu::A::text_fn(Rc::new(move || f().to_string()))]
      }
      Mod::Class(c) => vec![c.clone().into()],
      Mod::ClassOf(f) => vec![nu::A::class_name_fn(f.clone())],
      Mod::Attrs(a) => attributes(a),
    })
    .collect();
  let node = match &*tag {
    "div" => nu::div(m),
    "h1" => nu::h1(m),
    "h2" => nu::h2(m),
    "h3" => nu::h3(m),
    "p" => nu::p(m),
    "span" => nu::span(m),
    "small" => nu::small(m),
    "strong" => nu::strong(m),
    "button" => nu::button(m),
    "input" => nu::input(m),
    "textarea" => nu::textarea(m),
    "img" => nu::img(m),
    "checkbox" => nu::checkbox(m),
    _ => nu::el(&tag, m),
  };
  node.into()
}

fn point(e: nu::PointerEvent) -> Point {
  Point { x: e.x, y: e.y, page_x: e.page_x, page_y: e.page_y }
}

/// One attribute of the core for each key that is set.
fn attributes(a: &Attributes) -> Vec<nu::Mod> {
  let mut m = vec![];
  if let Some(f) = &a.class_name {
    m.push(nu::A::class_name_fn(f.clone()));
  }
  if let Some(f) = a.value.clone() {
    m.push(nu::A::value_fn(Rc::new(move || f().to_string())));
  }
  if let Some(f) = a.checked.clone() {
    m.push(nu::A::checked_fn(f));
  }
  if let Some(url) = &a.src {
    m.push(nu::A::src(url));
  }
  if let Some(text) = &a.placeholder {
    m.push(nu::A::placeholder(text));
  }
  if let Some(text) = &a.label {
    m.push(nu::A::aria_label(text));
  }
  if let Some(t) = &a.input_type {
    m.push(nu::A::input_type(t));
  }
  if let Some(f) = a.on_click.clone() {
    m.push(nu::A::on_click(Rc::new(move |_| f())));
  }
  if let Some(f) = a.on_input.clone() {
    m.push(nu::A::on_input(Rc::new(move |e| f(Str::from(e.target.value)))));
  }
  if let Some(f) = a.on_change.clone() {
    m.push(nu::A::on_change(Rc::new(move |e| f(e.target.checked))));
  }
  if let Some(f) = a.on_key_down.clone() {
    m.push(nu::A::on_key_down(Rc::new(move |e: nu::KeyboardEvent| f(Str::from(e.key)))));
  }
  if let Some(axis) = a.pan_axis.clone() {
    m.push(nu::A::pan_axis(&axis));
  }
  if let Some(f) = a.on_pan.clone() {
    m.push(nu::A::on_pan(Rc::new(move |e: nu::PanEvent| {
      f(Pan {
        state: Str::from(e.state),
        dx: e.translation_x,
        dy: e.translation_y,
        vx: e.velocity_x,
        vy: e.velocity_y,
        x: e.x,
        y: e.y,
      })
    })));
  }
  if let Some(f) = a.on_pinch.clone() {
    m.push(nu::A::on_pinch(Rc::new(move |e: nu::PinchEvent| f(Pinch { state: Str::from(e.state), scale: e.scale }))));
  }
  if let Some(f) = a.on_long_press.clone() {
    m.push(nu::A::on_long_press(Rc::new(move |e| f(point(e)))));
  }
  if let Some(f) = a.on_double_click.clone() {
    m.push(nu::A::on_double_click(Rc::new(move |e| f(point(e)))));
  }
  if let Some(f) = a.on_pointer_down.clone() {
    m.push(nu::A::on_pointer_down(Rc::new(move |e| f(point(e)))));
  }
  if let Some(f) = a.on_pointer_up.clone() {
    m.push(nu::A::on_pointer_up(Rc::new(move |e| f(point(e)))));
  }
  if let Some(f) = a.on_scroll.clone() {
    m.push(nu::A::on_scroll(Rc::new(move |e: nu::ScrollEvent| {
      f(Scroll { top: e.scroll_top, height: e.scroll_height, viewport: e.client_height })
    })));
  }
  if let Some(f) = a.on_destroy.clone() {
    m.push(nu::A::on_destroy(Rc::new(move |_| f())));
  }
  m
}

/// A row is a builder's node; a view that is not one (an attribute) gives no row.
fn node(v: View) -> Option<nu::Node> {
  match v {
    nu::Mod::Node(n) => Some(n),
    _ => None,
  }
}

/// The runtime matches rows by identity (an `Rc`). An item equal to an item of the last call keeps
/// that `Rc`, so its row stays; a changed item gets a new `Rc`, so its row is made again. The item at
/// the same index is tried first: an unchanged list costs one comparison per row.
pub fn list<T: Clone + PartialEq + 'static>(items: Rc<dyn Fn() -> List<T>>, render: Rc<dyn Fn(T, i32) -> View>) -> View {
  let last: RefCell<Vec<Option<Rc<T>>>> = RefCell::default();
  let items = Rc::new(move || {
    let mut old = last.take();
    let next: Vec<Rc<T>> = items()
      .iter()
      .enumerate()
      .map(|(i, x)| {
        if let Some(Some(o)) = old.get(i) {
          if **o == *x {
            return old[i].take().unwrap();
          }
        }
        match old.iter().position(|o| o.as_ref().is_some_and(|o| **o == *x)) {
          Some(j) => old[j].take().unwrap(),
          None => Rc::new(x.clone()),
        }
      })
      .collect();
    *last.borrow_mut() = next.iter().cloned().map(Some).collect();
    nu::Arr::from(next)
  });
  nu::list(items, Rc::new(move |x: Rc<T>, i| node(render((*x).clone(), i as i32)))).into()
}

pub fn when(cond: Rc<dyn Fn() -> bool>, show: Rc<dyn Fn() -> View>) -> View {
  nu::when(cond, Rc::new(move || vec![show()])).into()
}

pub fn update() {
  nu::update(&[]);
}

// ---- navigation ----------------------------------------------------------------------

/// A screen, kept until `navigate` makes the router of nuclo from it.
#[derive(Clone)]
pub struct Route {
  pattern: Str,
  title: Rc<dyn Fn(Str) -> Str>,
  view: Rc<dyn Fn(Str) -> View>,
  kind: Str,
}

pub fn route(pattern: Str, title: Rc<dyn Fn(Str) -> Str>, view: Rc<dyn Fn(Str) -> View>, kind: Str) -> Route {
  Route { pattern, title, view, kind }
}

thread_local!(static ROUTER: RefCell<Option<nu::Router>> = const { RefCell::new(None) });

fn router() -> nu::Router {
  ROUTER.with(|r| r.borrow().clone()).expect("navigate must run before go, back, or reset")
}

/// The value of `:id`, or "".
fn id(params: &nu::Params) -> Str {
  Str::from(params.get("id").unwrap_or_default())
}

pub fn navigate(routes: List<Route>, tabs: List<Tab>) {
  let routes = routes
    .iter()
    .map(|r| {
      let (view, title) = (r.view.clone(), r.title.clone());
      let modal = &*r.kind == "modal";
      nu::Route::new(
        &r.pattern,
        Rc::new(move |params: nu::Params| node(view(id(&params))).expect("a route's view must be a builder's node")),
        Some(Rc::new(move |params: nu::Params| title(id(&params)).to_string())),
        if modal { "modal" } else { "push" },
        &*r.kind == "push",
        None,
      )
    })
    .collect();
  let tabs = tabs.iter().map(|t| nu::Tab::new(&t.path, &t.title, &t.icon)).collect();
  // NUCLO_PATH opens the app at a screen, as a deep link does (for checks against the web build).
  let start = std::env::var("NUCLO_PATH").ok();
  let router = nu::Router::new(routes, tabs, start.as_deref());
  ROUTER.with(|r| *r.borrow_mut() = Some(router.clone()));
  nu::render_outlet(router.outlet());
}

pub fn go(path: Str) {
  router().go(&path);
}

pub fn back() {
  router().back();
}

pub fn reset(path: Str) {
  router().reset(&path);
}

pub fn overlay(view: Rc<dyn Fn() -> View>) {
  nu::render(Rc::new(move || node(view()).expect("an overlay must be a builder's node")));
}

// ---- the platform's own components (libadwaita on GTK; GPUI has none: kit.ns draws them) -----------

fn items(actions: &List<Action>) -> (Vec<(String, String)>, Vec<Rc<dyn Fn()>>) {
  let items = actions.iter().map(|a| (a.label.to_string(), a.kind.to_string())).collect();
  let runs = actions.iter().map(|a| a.run_.clone()).collect();
  (items, runs)
}

fn chosen(runs: Vec<Rc<dyn Fn()>>) -> Box<dyn Fn(usize)> {
  Box::new(move |i| {
    if let Some(run) = runs.get(i).cloned() {
      // After the dialog or menu is gone: a submenu opens the next menu.
      nu::set_timeout(Rc::new(move || { run(); nu::update(&[]); }), 0.0);
    }
  })
}

pub fn native_alert(title: Str, message: Str, actions: List<Action>) -> bool {
  let (items, runs) = items(&actions);
  nu::backend().native_alert(&title, &message, &items, chosen(runs))
}

pub fn native_actions(title: Str, actions: List<Action>) -> bool {
  let (items, runs) = items(&actions);
  nu::backend().native_actions(&title, &items, chosen(runs))
}

pub fn native_menu(x: f64, y: f64, title: Str, actions: List<Action>) -> bool {
  let (items, runs) = items(&actions);
  nu::backend().native_menu(x as f32, y as f32, &title, &items, chosen(runs))
}

pub fn native_sheet(title: Str, detent: Str, content: Rc<dyn Fn() -> View>) -> bool {
  match node(content()) {
    Some(n) => nu::native_sheet(n, &title, &detent),
    None => false,
  }
}

pub fn has_control(kind: Str) -> bool {
  crate::controls::HAS && matches!(&*kind, "segmented" | "chip" | "slider" | "button" | "spinner" | "search" | "stepper")
}

pub fn bar_button(label: Str, run: Rc<dyn Fn()>) -> bool {
  nu::bar_button(&label, run)
}

pub fn share_text(text: Str) -> bool {
  nu::backend().native_share(&text)
}

pub fn copy_text(text: Str) {
  nu::backend().copy_text(&text);
}

pub fn button_control(label: Rc<dyn Fn() -> Str>, kind: Rc<dyn Fn() -> Str>, run: Rc<dyn Fn()>) -> View {
  nu::Mod::from(crate::controls::button(Rc::new(move || label().to_string()), Rc::new(move || kind().to_string()), run))
}

/// No pull to refresh on a desktop: kit.ns draws one.
pub fn refresh_control(content: View, _refreshing: Rc<dyn Fn() -> bool>, _refresh: Rc<dyn Fn()>) -> View {
  content
}

pub fn spinner_control() -> View {
  nu::Mod::from(crate::controls::spinner())
}

pub fn search_control(placeholder: Str, value: Rc<dyn Fn() -> Str>, input: Rc<dyn Fn(Str)>, submit: Rc<dyn Fn(Str)>) -> View {
  nu::Mod::from(crate::controls::search(
    placeholder.to_string(),
    Rc::new(move || value().to_string()),
    Rc::new(move |v: String| input(Str::from(v.as_str()))),
    Rc::new(move |v: String| submit(Str::from(v.as_str()))),
  ))
}

pub fn stepper_control(value: Rc<dyn Fn() -> i32>, min: i32, max: i32, change: Rc<dyn Fn(i32)>) -> View {
  nu::Mod::from(crate::controls::stepper(value, min, max, change))
}

pub fn segmented_control(options: List<Str>, at: Rc<dyn Fn() -> i32>, pick: Rc<dyn Fn(i32)>) -> View {
  nu::Mod::from(crate::controls::segmented(options.iter().map(|o| o.to_string()).collect(), at, pick))
}

pub fn chip_control(label: Str, on: Rc<dyn Fn() -> bool>, pick: Rc<dyn Fn()>) -> View {
  nu::Mod::from(crate::controls::chip(label.to_string(), on, pick))
}

pub fn slider_control(value: Rc<dyn Fn() -> f64>, _color: Str, change: Rc<dyn Fn(f64)>) -> View {
  nu::Mod::from(crate::controls::slider(value, change))
}

pub fn native_close_sheet() -> bool {
  nu::backend().native_close_sheet()
}

pub fn native_toast(text: Str) -> bool {
  nu::backend().native_toast(&text)
}

// ---- platform ------------------------------------------------------------------------

pub fn later_(ms: i32, f: Rc<dyn Fn()>) {
  nu::set_timeout(f, ms as f64);
}

pub fn viewport() -> Viewport {
  let b = nu::backend();
  Viewport { width: b.window_width() as f64, height: b.window_height() as f64 }
}

/// GTK follows the app's mode (libadwaita's colour scheme): the header bar and the tab bar too.
pub fn theme(dark: bool, accent: Str, _background: Str) {
  crate::set_dark(dark, &accent);
}

pub fn prefetch(url: Str) {
    crate::nuclo::task::download_cached(url.to_string(), |_| {});
}

/// Desktops have no haptic motor.
pub fn haptic(_kind: Str) {}

pub fn platform() -> Str {
  Str::from(crate::PLATFORM)
}

// ---- storage: SQLite (rusqlite, the library built in) ---------------------------------

thread_local!(static DB: (rusqlite::Connection, String) = open());

fn open() -> (rusqlite::Connection, String) {
  let dir = std::env::var("XDG_DATA_HOME")
    .map(std::path::PathBuf::from)
    .unwrap_or_else(|_| std::path::PathBuf::from(std::env::var("HOME").unwrap_or_default()).join(".local/share"))
    .join("nuclo-native-ns");
  let _ = std::fs::create_dir_all(&dir);
  let path = dir.join("app.db");
  let db = rusqlite::Connection::open(&path).expect("the app's database opens");
  db.execute_batch(
    "PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;
     CREATE TABLE IF NOT EXISTS rows (tbl TEXT NOT NULL, id TEXT NOT NULL, fields TEXT NOT NULL, PRIMARY KEY (tbl, id));",
  )
  .expect("the rows table is made");
  (db, path.display().to_string())
}

pub fn db_put(table: Str, id: Str, fields: List<Str>) {
  let json = serde_json::to_string(&fields.iter().map(|s| s.to_string()).collect::<Vec<_>>()).unwrap();
  DB.with(|(db, _)| {
    db.prepare_cached("INSERT INTO rows (tbl, id, fields) VALUES (?1, ?2, ?3) ON CONFLICT (tbl, id) DO UPDATE SET fields = excluded.fields")
      .and_then(|mut s| s.execute((&*table, &*id, json)))
      .expect("a row is written");
  });
}

pub fn db_all(table: Str) -> List<Row> {
  DB.with(|(db, _)| {
    let mut s = db.prepare_cached("SELECT id, fields FROM rows WHERE tbl = ?1 ORDER BY rowid DESC").unwrap();
    let rows = s
      .query_map([&*table], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))
      .unwrap()
      .filter_map(Result::ok)
      .map(|(id, fields)| {
        let fields: Vec<String> = serde_json::from_str(&fields).unwrap_or_default();
        Row { id: Str::from(id), fields: List::from(fields.into_iter().map(Str::from).collect::<Vec<_>>()) }
      })
      .collect::<Vec<_>>();
    List::from(rows)
  })
}

pub fn db_delete(table: Str, id: Str) {
  DB.with(|(db, _)| {
    let _ = db.execute("DELETE FROM rows WHERE tbl = ?1 AND id = ?2", (&*table, &*id));
  });
}

pub fn db_clear(table: Str) {
  DB.with(|(db, _)| {
    let _ = db.execute("DELETE FROM rows WHERE tbl = ?1", [&*table]);
  });
}

pub fn db_info() -> Str {
  DB.with(|(_, path)| Str::from(format!("SQLite {} · {}", rusqlite::version(), path)))
}
