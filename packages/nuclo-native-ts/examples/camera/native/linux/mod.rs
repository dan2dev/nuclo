// The Linux (GTK 4) side of examples/camera, copied into the generated Cargo project as its `native` module.
//
// GTK 4 shows no camera by itself (that takes GStreamer), so this is the test card the iOS simulator shows: the
// facing camera's colour and a clock, drawn with cairo. A photo is a PNG of the card.
#![allow(non_snake_case)] // The `declare function`s keep the names the app calls them by.

use std::cell::RefCell;
use std::rc::{Rc, Weak};

use gtk::prelude::*;
use gtk::{cairo, gdk, glib};

use crate::app::CameraProps;
use crate::gtk_backend::{native, widget};
use crate::nuclo::prelude::*;

struct Card {
    area: gtk::DrawingArea,
    facing: RefCell<String>,
}

thread_local! {
    /// The camera on screen, which takePhoto() asks. The last one created wins.
    static LIVE: RefCell<Weak<Card>> = const { RefCell::new(Weak::new()) };
}

#[derive(Default)]
pub struct Camera {
    card: Option<Rc<Card>>,
}

impl NativeComponent<CameraProps> for Camera {
    fn create(&mut self) -> NativeView {
        let area = gtk::DrawingArea::new();
        let card = Rc::new(Card { area: area.clone(), facing: RefCell::new(String::new()) });
        let drawn = Rc::downgrade(&card);
        area.set_draw_func(move |_, cr, width, height| {
            if let Some(card) = drawn.upgrade() {
                draw(cr, width as f64, height as f64, &card.facing.borrow());
            }
        });
        // The clock ticks while the card is shown.
        let ticking = area.downgrade();
        glib::timeout_add_local(std::time::Duration::from_secs(1), move || match ticking.upgrade() {
            Some(area) => {
                area.queue_draw();
                glib::ControlFlow::Continue
            }
            None => glib::ControlFlow::Break,
        });
        LIVE.with(|live| *live.borrow_mut() = Rc::downgrade(&card));
        self.card = Some(card);
        native(area)
    }

    fn update(&mut self, view: &NativeView, props: &Rc<CameraProps>) {
        if let Some(card) = &self.card {
            *card.facing.borrow_mut() = props.facing.get();
        }
        widget::<gtk::DrawingArea>(view).queue_draw();
    }
}

/// The card: the colour of the facing camera, and what it is, with the time.
fn draw(cr: &cairo::Context, width: f64, height: f64, facing: &str) {
    let (r, g, b) = if facing == "front" { (0.49, 0.23, 0.93) } else { (0.05, 0.65, 0.91) };
    cr.set_source_rgb(r, g, b);
    cr.rectangle(0.0, 0.0, width, height);
    let _ = cr.fill();
    let time = glib::DateTime::now_local().ok().and_then(|now| now.format("%H:%M:%S").ok()).map(|t| t.to_string()).unwrap_or_default();
    cr.set_source_rgb(1.0, 1.0, 1.0);
    cr.select_font_face("Sans", cairo::FontSlant::Normal, cairo::FontWeight::Bold);
    cr.set_font_size(20.0);
    for (i, line) in ["No camera here", &format!("{facing} camera"), &time].iter().enumerate() {
        let Ok(extents) = cr.text_extents(line) else { continue };
        cr.move_to((width - extents.width()) / 2.0 - extents.x_bearing(), height / 2.0 + (i as f64 - 1.0) * 28.0);
        let _ = cr.show_text(line);
    }
}

/// Always: there is no camera to ask for.
pub async fn requestCamera() -> bool {
    true
}

/// A PNG of the card as shown, in the temporary folder, as a file:// URL; "" when no camera is shown.
pub async fn takePhoto() -> String {
    let Some(card) = LIVE.with(|live| live.borrow().upgrade()).filter(|card| card.area.is_mapped()) else { return String::new() };
    let (width, height) = (card.area.width().max(1), card.area.height().max(1));
    let Ok(surface) = cairo::ImageSurface::create(cairo::Format::ARgb32, width, height) else { return String::new() };
    if let Ok(cr) = cairo::Context::new(&surface) {
        draw(&cr, width as f64, height as f64, &card.facing.borrow());
    }
    surface.flush();
    let stride = surface.stride() as usize;
    let Ok(data) = surface.take_data() else { return String::new() };
    let texture = gdk::MemoryTexture::new(width, height, gdk::MemoryFormat::B8g8r8a8Premultiplied, &glib::Bytes::from(&data[..]), stride);
    let path = std::env::temp_dir().join(format!("photo-{}.png", glib::monotonic_time()));
    match texture.save_to_png(&path) {
        Ok(()) => format!("file://{}", path.display()),
        Err(_) => String::new(),
    }
}
