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
