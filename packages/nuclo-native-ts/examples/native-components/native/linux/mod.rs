// The Linux (GTK 4) side of examples/native-components. The build copies this folder into the
// generated Cargo project as its `native` module, next to the generated `app` module, whose
// SliderProps and GaugeProps are the structs the compiler made from the app's interfaces.
#![allow(non_snake_case)] // The `declare function`s keep the names the app calls them by.

use std::cell::{Cell, RefCell};
use std::rc::Rc;

use gtk::prelude::*;

use crate::app::{GaugeProps, SliderProps};
use crate::gtk_backend::{native, widget};
use crate::nuclo::prelude::*;

/// The platform's slider: a GtkScale from 0 to 1, mapped onto the props' range.
#[derive(Default)]
pub struct Slider {
    props: Rc<RefCell<Option<Rc<SliderProps>>>>,
    /// Set while `update` moves the slider, so only the user's moves reach `onChange`.
    writing: Rc<Cell<bool>>,
}

impl NativeComponent<SliderProps> for Slider {
    fn create(&mut self) -> NativeView {
        let scale = gtk::Scale::with_range(gtk::Orientation::Horizontal, 0.0, 1.0, 0.001);
        let (props, writing) = (self.props.clone(), self.writing.clone());
        scale.connect_value_changed(move |scale| {
            let props = props.borrow().clone();
            if let (Some(p), false) = (props, writing.get()) {
                (p.onChange.get())(p.min.get() + (p.max.get() - p.min.get()) * scale.value());
            }
        });
        native(scale)
    }

    fn update(&mut self, view: &NativeView, props: &Rc<SliderProps>) {
        *self.props.borrow_mut() = Some(props.clone());
        let scale: gtk::Scale = widget(view);
        let fraction = (props.value.get() - props.min.get()) / (props.max.get() - props.min.get());
        if (scale.value() - fraction).abs() > 0.0005 {
            self.writing.set(true);
            scale.set_value(fraction);
            self.writing.set(false);
        }
        if let Some(tint) = props.tint.get().filter(|tint| tint.starts_with('#') && tint[1..].chars().all(|c| c.is_ascii_hexdigit())) {
            // GTK colours a widget through CSS: one class per tint, declared when first used.
            let class = format!("tint-{}", &tint[1..]);
            if !scale.has_css_class(&class) {
                let provider = gtk::CssProvider::new();
                provider.load_from_string(&format!("scale.{class} highlight {{ background-color: {tint}; }}"));
                gtk::style_context_add_provider_for_display(&scale.display(), &provider, gtk::STYLE_PROVIDER_PRIORITY_APPLICATION);
                scale.add_css_class(&class);
            }
        }
    }
}

/// A ring drawn with cairo.
#[derive(Default)]
pub struct Gauge {
    props: Rc<RefCell<Option<Rc<GaugeProps>>>>,
}

impl NativeComponent<GaugeProps> for Gauge {
    fn create(&mut self) -> NativeView {
        let area = gtk::DrawingArea::new();
        let props = self.props.clone();
        area.set_draw_func(move |_, cr, width, height| {
            let Some(p) = props.borrow().clone() else { return };
            let stroke = p.thickness.get();
            let radius = (width.min(height) as f64 - stroke) / 2.0;
            let (cx, cy) = (width as f64 / 2.0, height as f64 / 2.0);
            let ring = |color: &str, sweep: f64| {
                let [r, g, b, a] = css_color(color).unwrap_or(Color::BLACK).rgba().map(f64::from);
                cr.set_source_rgba(r, g, b, a);
                cr.set_line_width(stroke);
                cr.set_line_cap(gtk::cairo::LineCap::Round);
                // From 12 o'clock, clockwise.
                cr.arc(cx, cy, radius, -std::f64::consts::FRAC_PI_2, -std::f64::consts::FRAC_PI_2 + std::f64::consts::TAU * sweep);
                let _ = cr.stroke();
            };
            ring("#e2e8f0", 1.0);
            let progress = p.progress.get().clamp(0.0, 1.0);
            if progress > 0.0 {
                ring(&p.color.get(), progress);
            }
        });
        native(area)
    }

    fn update(&mut self, view: &NativeView, props: &Rc<GaugeProps>) {
        *self.props.borrow_mut() = Some(props.clone());
        widget::<gtk::DrawingArea>(view).queue_draw();
    }
}

pub fn platformName() -> String {
    format!("Linux, GTK {}.{}", gtk::major_version(), gtk::minor_version())
}

/// A desktop has nothing to vibrate.
pub fn vibrate(_milliseconds: i64) {}

/// The first battery the kernel lists, or -1 on a machine without one.
pub async fn batteryLevel() -> f64 {
    let batteries = std::fs::read_dir("/sys/class/power_supply").into_iter().flatten().flatten();
    let level = batteries.filter_map(|entry| std::fs::read_to_string(entry.path().join("capacity")).ok()).find_map(|text| text.trim().parse::<f64>().ok());
    level.map_or(-1.0, |percent| percent / 100.0)
}
