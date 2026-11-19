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
