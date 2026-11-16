// The GPUI side of examples/camera, copied into the generated Cargo project as its `native` module.
//
// GPUI draws and embeds nothing, so this is the test card the iOS simulator shows: the facing camera's colour, what
// it is and a clock. A photo is a BMP (which GPUI's images read) of the card's colour with the time in seven
// segments: GPUI renders no text into a buffer.
#![allow(non_snake_case)] // The `declare function`s keep the names the app calls them by.

use std::cell::{Cell, RefCell};
use std::rc::{Rc, Weak};
use std::time::{SystemTime, UNIX_EPOCH};

use gpui::{fill, App, Bounds, Pixels, Window};

use crate::app::CameraProps;
use crate::gpui_backend::{hsla, native, paint_label, repaint, Draw};
use crate::nuclo::prelude::*;

struct Card {
    facing: RefCell<String>,
    /// Where it was last drawn, in px: the photo's size.
    size: Cell<(f32, f32)>,
}

thread_local! {
    /// The camera on screen, which takePhoto() asks. The last one created wins.
    static LIVE: RefCell<Weak<Card>> = const { RefCell::new(Weak::new()) };
}

pub struct Camera {
    card: Rc<Card>,
    clock: Option<Timer>,
}

impl Default for Camera {
    fn default() -> Self {
        Camera { card: Rc::new(Card { facing: RefCell::new(String::new()), size: Cell::new((0.0, 0.0)) }), clock: None }
    }
}

impl NativeComponent<CameraProps> for Camera {
    fn create(&mut self) -> NativeView {
        LIVE.with(|live| *live.borrow_mut() = Rc::downgrade(&self.card));
        // The clock ticks while the card is shown.
        self.clock = Some(set_interval(Rc::new(repaint), 1000.0));
        native(self.card.clone())
    }

    fn update(&mut self, _: &NativeView, props: &Rc<CameraProps>) {
        *self.card.facing.borrow_mut() = props.facing.get();
    }

    fn destroy(&mut self, _: &NativeView) {
        if let Some(clock) = self.clock.take() {
            clear_interval(clock);
        }
    }
}

impl Card {
    fn color(&self) -> Color {
        if *self.facing.borrow() == "front" { Color(0x7c3a_edff) } else { Color(0x0ea5_e9ff) }
    }
}

impl Draw for Card {
    fn measure(&self, max_width: f32) -> (f32, f32) {
        (max_width, max_width * 4.0 / 3.0)
    }

    fn paint(&self, bounds: Bounds<Pixels>, opacity: f32, window: &mut Window, cx: &mut App) {
        self.size.set((f32::from(bounds.size.width), f32::from(bounds.size.height)));
        window.paint_quad(fill(bounds, hsla(self.color(), opacity)));
        let text = format!("No camera here\n{} camera\n{}", self.facing.borrow(), clock_text());
        paint_label(&text, 20.0, true, Color::WHITE, true, bounds, opacity, window, cx);
    }
}

/// The local time as HH:MM:SS.
fn clock_text() -> String {
    let seconds = local_seconds().rem_euclid(86_400);
    format!("{:02}:{:02}:{:02}", seconds / 3600, seconds / 60 % 60, seconds % 60)
}

/// Seconds since 1970 in the local time zone. ponytail: the offset is asked of `date` once, so a change of time
/// zone (or of daylight saving time) while the app runs is not seen.
fn local_seconds() -> i64 {
    thread_local!(static OFFSET: i64 = {
        let out = std::process::Command::new("date").arg("+%z").output().ok();
        let text = out.map(|out| String::from_utf8_lossy(&out.stdout).trim().to_string()).unwrap_or_default();
        let sign = if text.starts_with('-') { -1 } else { 1 };
        let digits: i64 = text.trim_start_matches(['+', '-']).parse().unwrap_or(0);
        sign * (digits / 100 * 3600 + digits % 100 * 60)
    });
    let now = SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs() as i64).unwrap_or(0);
    now + OFFSET.with(|offset| *offset)
}

/// The rectangles of a seven-segment HH:MM:SS, in units of the digits' height, and its width.
fn segments(text: &str) -> (Vec<[f32; 4]>, f32) {
    const W: f32 = 0.55;
    const T: f32 = 0.11;
    // Which segments each digit lights, a to g: top, top right, bottom right, bottom, bottom left, top left, middle.
    const DIGITS: [&str; 10] = ["abcdef", "bc", "abged", "abgcd", "fgbc", "afgcd", "afgedc", "abc", "abcdefg", "abcdfg"];
    let mut rects = Vec::new();
    let mut x = 0.0;
    for c in text.chars() {
        if let Some(d) = c.to_digit(10) {
            for s in DIGITS[d as usize].chars() {
                rects.push(match s {
                    'a' => [x, 0.0, W, T],
                    'b' => [x + W - T, 0.0, T, 0.5],
                    'c' => [x + W - T, 0.5, T, 0.5],
                    'd' => [x, 1.0 - T, W, T],
                    'e' => [x, 0.5, T, 0.5],
                    'f' => [x, 0.0, T, 0.5],
                    _ => [x, 0.5 - T / 2.0, W, T],
                });
            }
            x += W + 0.18;
        } else {
            rects.push([x, 0.28, T, T]);
            rects.push([x, 0.72 - T, T, T]);
            x += T + 0.18;
        }
    }
    (rects, x - 0.18)
}

/// A 24-bit BMP of the card's colour with the time in white.
fn photo(width: usize, height: usize, color: Color, time: &str) -> Vec<u8> {
    let [r, g, b, _] = color.rgba().map(|c| (c * 255.0).round() as u8);
    let mut pixels = vec![[r, g, b]; width * height];
    let digit = height as f32 / 8.0;
    let (rects, w) = segments(time);
    let (left, top) = ((width as f32 - w * digit) / 2.0, (height as f32 - digit) / 2.0);
    for [x, y, rw, rh] in rects {
        let (x0, y0) = ((left + x * digit) as usize, (top + y * digit) as usize);
        let (x1, y1) = (((left + (x + rw) * digit) as usize).min(width), ((top + (y + rh) * digit) as usize).min(height));
        for row in y0..y1 {
            pixels[row * width + x0..row * width + x1].fill([255, 255, 255]);
        }
    }
    let row = (width * 3).div_ceil(4) * 4;
    let size = 54 + row * height;
    let mut bmp = Vec::with_capacity(size);
    bmp.extend_from_slice(b"BM");
    for value in [size as u32, 0, 54, 40, width as u32, height as u32] {
        bmp.extend_from_slice(&value.to_le_bytes());
    }
    bmp.extend_from_slice(&1u16.to_le_bytes());
    bmp.extend_from_slice(&24u16.to_le_bytes());
    for value in [0u32, (row * height) as u32, 2835, 2835, 0, 0] {
        bmp.extend_from_slice(&value.to_le_bytes());
    }
    // Rows bottom up, each pixel blue, green, red, each row padded to four bytes.
    for y in (0..height).rev() {
        for [r, g, b] in &pixels[y * width..(y + 1) * width] {
            bmp.extend_from_slice(&[*b, *g, *r]);
        }
        bmp.resize(bmp.len() + row - width * 3, 0);
    }
    bmp
}

/// Always: there is no camera to ask for.
pub async fn requestCamera() -> bool {
    true
}

/// A BMP of the card, in the temporary folder, as a file:// URL; "" when no camera is shown.
pub async fn takePhoto() -> String {
    let Some(card) = LIVE.with(|live| live.borrow().upgrade()) else { return String::new() };
    let (width, height) = card.size.get();
    if width < 1.0 || height < 1.0 {
        return String::new();
    }
    let bmp = photo(width as usize, height as usize, card.color(), &clock_text());
    let nanos = SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_nanos()).unwrap_or(0);
    let path = std::env::temp_dir().join(format!("photo-{nanos}.bmp"));
    match std::fs::write(&path, bmp) {
        Ok(()) => format!("file://{}", path.display()),
        Err(_) => String::new(),
    }
}
