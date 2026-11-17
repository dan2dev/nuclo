// The parity test's Rust program (src/main.rs): the runtime's core with a backend that has no views, only a timer
// queue on this thread (due time, then posting order), so the checks run natively without a UI toolkit.
// app.rs gets `parity_checks()` appended by test/parity.test.ts.
#![allow(warnings)]
mod app;
mod native;
mod nuclo;

use nuclo::backend::*;
use std::cell::RefCell;
use std::rc::Rc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};

static WOKEN: AtomicBool = AtomicBool::new(false);

#[derive(Default)]
struct Headless {
    timers: RefCell<Vec<(Instant, u64, Option<Box<dyn FnOnce()>>)>>,
    next: std::cell::Cell<u64>,
}

impl Headless {
    fn post(&self, ms: u64, callback: Box<dyn FnOnce()>) -> u64 {
        let id = self.next.get() + 1;
        self.next.set(id);
        self.timers.borrow_mut().push((Instant::now() + Duration::from_millis(ms), id, Some(callback)));
        id
    }
    /// The next due job, by due time then id; `None` when nothing is queued.
    fn take_next(&self) -> Option<(Instant, Option<Box<dyn FnOnce()>>)> {
        let mut timers = self.timers.borrow_mut();
        let i = (0..timers.len()).min_by_key(|&i| (timers[i].0, timers[i].1))?;
        if timers[i].0 > Instant::now() {
            return Some((timers[i].0, None));
        }
        let (due, _, job) = timers.remove(i);
        Some((due, job))
    }
}

macro_rules! no_views {
    ($($sig:tt)*) => { $($sig)* { unreachable!("the parity corpus has no UI") } };
}

impl Backend for Headless {
    no_views!(fn create(&self, kind: Kind) -> ViewId);
    no_views!(fn adopt(&self, native: NativeView) -> ViewId);
    no_views!(fn destroy(&self, view: ViewId));
    no_views!(fn set_children(&self, parent: ViewId, children: &[ViewId]));
    no_views!(fn reorder(&self, parent: ViewId, children: &[ViewId]));
    no_views!(fn set_frame(&self, view: ViewId, frame: Rect));
    no_views!(fn paint(&self, view: ViewId, kind: Kind, paint: &Paint));
    no_views!(fn measure(&self, view: ViewId, max_width: f32) -> (f32, f32));
    no_views!(fn make_scrollable(&self, view: ViewId, horizontal: bool));
    no_views!(fn set_content_size(&self, view: ViewId, width: i32, height: i32));
    no_views!(fn set_text(&self, view: ViewId, text: &str));
    no_views!(fn set_value(&self, view: ViewId, text: &str));
    no_views!(fn set_placeholder(&self, view: ViewId, text: &str));
    no_views!(fn set_checked(&self, view: ViewId, checked: bool));
    no_views!(fn set_enabled(&self, view: ViewId, enabled: bool));
    no_views!(fn set_input_type(&self, view: ViewId, input_type: &str));
    no_views!(fn set_image(&self, view: ViewId, bytes: &[u8]));
    no_views!(fn set_label(&self, view: ViewId, label: &str));
    no_views!(fn control_state(&self, view: ViewId) -> (String, bool));
    no_views!(fn listen(&self, view: ViewId, input: Input));
    no_views!(fn open_url(&self, url: &str));
    no_views!(fn show_screen(&self, root: ViewId));
    no_views!(fn show_overlay(&self, root: ViewId));
    no_views!(fn request_layout(&self));
    no_views!(fn window_width(&self) -> f32);
    no_views!(fn nav_create(&self, tabs: &[TabInfo], active: usize));
    no_views!(fn nav_push(&self, tab: usize, screen: &Screen, animated: bool));
    no_views!(fn nav_pop(&self, tab: usize, animated: bool));
    no_views!(fn nav_replace(&self, tab: usize, screen: &Screen));
    no_views!(fn nav_select_tab(&self, tab: usize));

    fn set_timer(&self, ms: u64, callback: Box<dyn FnOnce()>) -> u64 {
        self.post(ms, callback)
    }
    fn clear_timer(&self, timer: u64) {
        self.timers.borrow_mut().retain(|t| t.1 != timer);
    }
    fn request_frame(&self, callback: Box<dyn FnOnce()>) -> u64 {
        self.post(16, callback)
    }
    fn cancel_frame(&self, frame: u64) {
        self.clear_timer(frame)
    }
    fn waker(&self) -> Arc<dyn Fn() + Send + Sync> {
        Arc::new(|| WOKEN.store(true, Ordering::SeqCst))
    }
}

fn main() {
    let backend = Rc::new(Headless::default());
    nuclo::start(backend.clone());
    app::nuclo_main();
    let end = Instant::now() + Duration::from_secs(3);
    while !app::parity_done() && Instant::now() < end {
        if WOKEN.swap(false, Ordering::SeqCst) {
            host::wake();
            continue;
        }
        match backend.take_next() {
            None => break,
            Some((_, Some(job))) => job(),
            Some((due, None)) => std::thread::sleep(due.saturating_duration_since(Instant::now()).min(end.saturating_duration_since(Instant::now()))),
        }
    }
    for (name, lines) in app::parity_checks() {
        println!("## {name}");
        for line in lines {
            println!("{line}");
        }
    }
}
