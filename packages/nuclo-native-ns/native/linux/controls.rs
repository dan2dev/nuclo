// nuclo-native-ns: GTK's own controls as nodes (libadwaita's toggle group, a toggle button for a chip, a scale).
use crate::gtk_backend::native;
use crate::nuclo::prelude::NativeComponent;
use crate::nuclo::prelude as nu;
use adw::prelude::*;
use std::cell::Cell;
use std::rc::Rc;

/// Gives the node its widget; the bindings below keep it in step with the app.
struct Widget(gtk::Widget);
impl NativeComponent<()> for Widget {
  fn create(&mut self) -> nu::NativeView {
    native(self.0.clone())
  }
  fn update(&mut self, _view: &nu::NativeView, _props: &Rc<()>) {}
}

fn node(widget: impl IsA<gtk::Widget>) -> nu::Node {
  nu::native_view(Widget(widget.upcast()), Rc::new(()), vec![])
}

pub const HAS: bool = true;

pub fn segmented(options: Vec<String>, at: Rc<dyn Fn() -> i32>, pick: Rc<dyn Fn(i32)>) -> nu::Node {
  let group = adw::ToggleGroup::new();
  for label in &options {
    group.add(adw::Toggle::builder().label(label).build());
  }
  let syncing = Rc::new(Cell::new(false));
  let (s, a) = (syncing.clone(), at.clone());
  group.connect_active_notify(move |g| {
    let i = g.active() as i32;
    if !s.get() && i != a() {
      pick(i);
    }
  });
  let n = node(group.clone());
  n.bind(at, move |i| {
    syncing.set(true);
    group.set_active(*i as u32);
    syncing.set(false);
  });
  n
}

pub fn chip(label: String, on: Rc<dyn Fn() -> bool>, pick: Rc<dyn Fn()>) -> nu::Node {
  let button = gtk::ToggleButton::with_label(&label);
  button.add_css_class("chip");
  let syncing = Rc::new(Cell::new(false));
  let s = syncing.clone();
  button.connect_toggled(move |_| {
    if !s.get() {
      pick();
    }
  });
  let n = node(button.clone());
  n.bind(on, move |v| {
    syncing.set(true);
    button.set_active(*v);
    syncing.set(false);
  });
  n
}

pub fn slider(value: Rc<dyn Fn() -> f64>, change: Rc<dyn Fn(f64)>) -> nu::Node {
  let scale = gtk::Scale::with_range(gtk::Orientation::Horizontal, 0.0, 1.0, 0.01);
  scale.set_draw_value(false);
  scale.set_hexpand(true);
  let syncing = Rc::new(Cell::new(false));
  let s = syncing.clone();
  scale.connect_value_changed(move |sc| {
    if !s.get() {
      change(sc.value());
    }
  });
  let n = node(scale.clone());
  n.bind(value, move |v| {
    syncing.set(true);
    scale.set_value(*v);
    syncing.set(false);
  });
  n
}

thread_local!(static ACCENT: gtk::CssProvider = gtk::CssProvider::new());

/// The app's accent as libadwaita's (its CSS variables), so switches, toggles, and scales take it.
pub fn set_accent(accent: &str) {
  ACCENT.with(|provider| {
    provider.load_from_string(&format!(":root {{ --accent-bg-color: {accent}; --accent-color: {accent}; }} @define-color accent_bg_color {accent}; @define-color accent_color {accent};"));
    if let Some(display) = gtk::gdk::Display::default() {
      gtk::style_context_add_provider_for_display(&display, provider, gtk::STYLE_PROVIDER_PRIORITY_USER + 2);
    }
  });
}

/// A button in libadwaita's styles: "filled" (suggested, a pill), "tonal" (a pill), "danger" (destructive),
/// "small" (suggested), "smallTonal" (plain).
pub fn button(label: Rc<dyn Fn() -> String>, kind: Rc<dyn Fn() -> String>, run: Rc<dyn Fn()>) -> nu::Node {
  let button = gtk::Button::new();
  button.connect_clicked(move |_| run());
  let n = node(button.clone());
  n.bind(label, {
    let button = button.clone();
    move |l: &String| button.set_label(l)
  });
  n.bind(kind, move |k: &String| {
    for class in ["suggested-action", "destructive-action", "pill"] {
      button.remove_css_class(class);
    }
    match k.as_str() {
      "filled" => { button.add_css_class("suggested-action"); button.add_css_class("pill"); }
      "tonal" => button.add_css_class("pill"),
      "danger" => { button.add_css_class("destructive-action"); button.add_css_class("pill"); }
      "small" => button.add_css_class("suggested-action"),
      _ => {}
    }
  });
  n
}

pub fn spinner() -> nu::Node {
  let spinner = adw::Spinner::new();
  spinner.set_size_request(32, 32);
  node(spinner)
}

pub fn search(placeholder: String, value: Rc<dyn Fn() -> String>, input: Rc<dyn Fn(String)>, submit: Rc<dyn Fn(String)>) -> nu::Node {
  let entry = gtk::SearchEntry::new();
  entry.set_placeholder_text(Some(&placeholder));
  entry.set_hexpand(true);
  let syncing = Rc::new(Cell::new(false));
  let s = syncing.clone();
  entry.connect_search_changed(move |e| {
    if !s.get() {
      input(e.text().to_string());
    }
  });
  entry.connect_activate(move |e| submit(e.text().to_string()));
  let n = node(entry.clone());
  n.bind(value, move |v: &String| {
    if entry.text().as_str() != v {
      syncing.set(true);
      entry.set_text(v);
      syncing.set(false);
    }
  });
  n
}

pub fn stepper(value: Rc<dyn Fn() -> i32>, min: i32, max: i32, change: Rc<dyn Fn(i32)>) -> nu::Node {
  let spin = gtk::SpinButton::with_range(min as f64, max as f64, 1.0);
  let syncing = Rc::new(Cell::new(false));
  let s = syncing.clone();
  spin.connect_value_changed(move |sp| {
    if !s.get() {
      change(sp.value_as_int());
    }
  });
  let n = node(spin.clone());
  n.bind(value, move |v: &i32| {
    syncing.set(true);
    spin.set_value(*v as f64);
    syncing.set(false);
  });
  n
}

/// A drawing surface: a DrawingArea that keeps the strokes and draws them with cairo, round and smooth.
pub fn paint(ink: Rc<dyn Fn() -> String>, width: f64, clears: Rc<dyn Fn() -> i32>) -> nu::Node {
  type Stroke = (gtk::gdk::RGBA, Vec<(f64, f64)>);
  let strokes: Rc<std::cell::RefCell<Vec<Stroke>>> = Rc::default();
  let area = gtk::DrawingArea::new();
  area.set_hexpand(true);
  area.set_vexpand(true);
  {
    let strokes = strokes.clone();
    area.set_draw_func(move |_, cr, _, _| {
      cr.set_line_width(width);
      cr.set_line_cap(gtk::cairo::LineCap::Round);
      cr.set_line_join(gtk::cairo::LineJoin::Round);
      for (color, points) in strokes.borrow().iter() {
        let Some(&(x0, y0)) = points.first() else { continue };
        cr.set_source_rgba(color.red() as f64, color.green() as f64, color.blue() as f64, color.alpha() as f64);
        cr.move_to(x0, y0);
        cr.line_to(x0 + 0.1, y0);
        // Through the midpoints: each point is a control point (a quadratic curve as a cubic).
        let mut last = (x0, y0);
        for &(x, y) in points.iter().skip(1) {
          let mid = ((last.0 + x) / 2.0, (last.1 + y) / 2.0);
          cr.curve_to(last.0, last.1, last.0, last.1, mid.0, mid.1);
          last = (x, y);
        }
        cr.line_to(last.0, last.1);
        let _ = cr.stroke();
      }
    });
  }
  let drag = gtk::GestureDrag::new();
  let origin = Rc::new(Cell::new((0.0, 0.0)));
  {
    let (strokes, origin, area2, ink) = (strokes.clone(), origin.clone(), area.clone(), ink.clone());
    drag.connect_drag_begin(move |_, x, y| {
      origin.set((x, y));
      let color = gtk::gdk::RGBA::parse(ink().as_str()).unwrap_or(gtk::gdk::RGBA::BLACK);
      strokes.borrow_mut().push((color, vec![(x, y)]));
      area2.queue_draw();
    });
  }
  {
    let (strokes, origin, area2) = (strokes.clone(), origin.clone(), area.clone());
    drag.connect_drag_update(move |_, dx, dy| {
      let (x, y) = origin.get();
      if let Some(stroke) = strokes.borrow_mut().last_mut() {
        stroke.1.push((x + dx, y + dy));
      }
      area2.queue_draw();
    });
  }
  area.add_controller(drag);
  let n = node(area.clone());
  n.bind(clears, move |_: &i32| {
    strokes.borrow_mut().clear();
    area.queue_draw();
  });
  let _ = ink;
  n
}
