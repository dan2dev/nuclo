// The Linux (GPUI) side of examples/native-components. The build copies this folder into the
// generated Cargo project as its `native` module, next to the generated `app` module, whose
// SliderProps and GaugeProps are the structs the compiler made from the app's interfaces.
//
// GPUI has no widgets, so a native component here is something that draws: a `Draw`, which
// paints itself in the frame the app's layout gives it and is told of presses on it.
#![allow(non_snake_case)] // The `declare function`s keep the names the app calls them by.

use std::cell::RefCell;
use std::f32::consts::{FRAC_PI_2, TAU};
use std::rc::Rc;

use gpui::{fill, point, px, size, App, Bounds, PathBuilder, Pixels, Window};

use crate::app::{GaugeProps, SliderProps};
use crate::gpui_backend::{hsla, native, Draw};
use crate::nuclo::backend::PointerPhase;
use crate::nuclo::prelude::*;

/// What both views are: the props the app last gave, read when the view is drawn or pressed.
struct Drawn<P>(RefCell<Option<Rc<P>>>);

impl<P> Default for Drawn<P> {
    fn default() -> Self {
        Drawn(RefCell::new(None))
    }
}

const THUMB: f32 = 20.0;

/// A slider drawn here — a track, its filled part and a thumb — that follows the pointer.
#[derive(Default)]
pub struct Slider(Rc<Drawn<SliderProps>>);

impl NativeComponent<SliderProps> for Slider {
    fn create(&mut self) -> NativeView {
        native(self.0.clone())
    }

    fn update(&mut self, _: &NativeView, props: &Rc<SliderProps>) {
        *self.0 .0.borrow_mut() = Some(props.clone());
    }
}

impl Draw for Drawn<SliderProps> {
    fn measure(&self, max_width: f32) -> (f32, f32) {
        (max_width.min(200.0), THUMB)
    }

    fn paint(&self, bounds: Bounds<Pixels>, opacity: f32, window: &mut Window, _: &mut App) {
        let Some(p) = self.0.borrow().clone() else { return };
        let fraction = ((p.value.get() - p.min.get()) / (p.max.get() - p.min.get())).clamp(0.0, 1.0) as f32;
        let tint = hsla(p.tint.get().and_then(|tint| css_color(&tint)).unwrap_or(Color(0x4f46_e5ff)), opacity);
        // The thumb's centre runs from half a thumb inside one end to half a thumb inside the other.
        let (left, y) = (bounds.origin.x + px(THUMB / 2.0), bounds.center().y);
        let at = left + (bounds.size.width - px(THUMB)) * fraction;
        let track = |to: Pixels| fill(Bounds::from_corners(point(left, y - px(2.0)), point(to, y + px(2.0))), tint).corner_radii(px(2.0));
        window.paint_quad(track(bounds.origin.x + bounds.size.width - px(THUMB / 2.0)).background(hsla(Color(0xe2e8_f0ff), opacity)));
        window.paint_quad(track(at));
        window.paint_quad(fill(Bounds::centered_at(point(at, y), size(px(THUMB), px(THUMB))), tint).corner_radii(px(THUMB / 2.0)));
    }

    fn pointer(&self, phase: PointerPhase, x: f32, _: f32, (width, _): (f32, f32)) {
        // The props are let go of before `onChange` runs: it comes back into `update`.
        let props = self.0.borrow().clone();
        if let (Some(p), PointerPhase::Down | PointerPhase::Move) = (props, phase) {
            let fraction = ((x - THUMB / 2.0) / (width - THUMB)).clamp(0.0, 1.0) as f64;
            (p.onChange.get())(p.min.get() + (p.max.get() - p.min.get()) * fraction);
        }
    }
}

/// A ring stroked with GPUI's paths.
#[derive(Default)]
pub struct Gauge(Rc<Drawn<GaugeProps>>);

impl NativeComponent<GaugeProps> for Gauge {
    fn create(&mut self) -> NativeView {
        native(self.0.clone())
    }

    fn update(&mut self, _: &NativeView, props: &Rc<GaugeProps>) {
        *self.0 .0.borrow_mut() = Some(props.clone());
    }
}

impl Draw for Drawn<GaugeProps> {
    fn measure(&self, max_width: f32) -> (f32, f32) {
        (max_width.min(96.0), max_width.min(96.0))
    }

    fn paint(&self, bounds: Bounds<Pixels>, opacity: f32, window: &mut Window, _: &mut App) {
        let Some(p) = self.0.borrow().clone() else { return };
        let stroke = p.thickness.get() as f32;
        let radius = (f32::from(bounds.size.width.min(bounds.size.height)) - stroke) / 2.0;
        let centre = bounds.center();
        // From 12 o'clock, clockwise.
        let on_ring = |sweep: f32| point(centre.x + px(radius * (sweep - FRAC_PI_2).cos()), centre.y + px(radius * (sweep - FRAC_PI_2).sin()));
        let mut ring = |color: &str, sweep: f32| {
            let color = hsla(css_color(color).unwrap_or(Color::BLACK), opacity);
            let mut path = PathBuilder::stroke(px(stroke));
            path.move_to(on_ring(0.0));
            // An arc can't close on itself, and half a circle has two centres: quarters at most.
            for quarter in 1..=4 {
                path.arc_to(point(px(radius), px(radius)), px(0.0), false, true, on_ring(sweep * quarter as f32 / 4.0));
            }
            if let Ok(path) = path.build() {
                window.paint_path(path, color);
            }
            // Round ends, which the stroke has not.
            for end in [0.0, sweep] {
                window.paint_quad(fill(Bounds::centered_at(on_ring(end), size(px(stroke), px(stroke))), color).corner_radii(px(stroke / 2.0)));
            }
        };
        ring("#e2e8f0", TAU - 0.001);
        let progress = p.progress.get().clamp(0.0, 1.0) as f32;
        if progress > 0.0 {
            ring(&p.color.get(), (TAU * progress).min(TAU - 0.001));
        }
    }
}

pub fn platformName() -> String {
    format!("Linux, GPUI {}", if std::env::var_os("WAYLAND_DISPLAY").is_some() { "on Wayland" } else { "on X11" })
}

/// A desktop has nothing to vibrate.
pub fn vibrate(_milliseconds: i64) {}

/// The first battery the kernel lists, or -1 on a machine without one.
pub async fn batteryLevel() -> f64 {
    let batteries = std::fs::read_dir("/sys/class/power_supply").into_iter().flatten().flatten();
    let level = batteries.filter_map(|entry| std::fs::read_to_string(entry.path().join("capacity")).ok()).find_map(|text| text.trim().parse::<f64>().ok());
    level.map_or(-1.0, |percent| percent / 100.0)
}
