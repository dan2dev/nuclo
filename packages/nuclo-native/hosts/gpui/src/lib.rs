//! nuclo-native drawn with GPUI: one host for macOS, Linux and Windows
//! (gpui-pre-platform) and iOS and Android (gpui-mobile).
//!
//! The bundle (dist/app.js) runs in QuickJS and drives the same op contract as
//! the native hosts (src/dom.ts). GPUI draws everything, so the router's tabs and
//! stacks are drawn the way each platform does them (see look.rs).
pub mod device;
pub mod engine;
pub mod host;
pub mod input;
pub mod look;
pub mod measure;
pub mod tree;

use std::path::PathBuf;

use gpui::{App, AppContext, WindowOptions};

#[cfg(any(target_os = "ios", target_os = "android"))]
extern crate gpui_mobile;

/// Opens the app's window. `bundle` is app.js; asset paths resolve next to it.
pub fn open(bundle: PathBuf, cx: &mut App) {
    input::bind_keys(cx);
    host::bind_keys(cx);
    // Grayscale glyph anti-aliasing, as the browser (the style contract's reference) draws text
    // everywhere but Windows; GPUI's Linux default is subpixel, which fringes glyphs with colour.
    #[cfg(not(target_os = "windows"))]
    cx.set_text_rendering_mode(gpui::TextRenderingMode::Grayscale);
    let look = look::Look::detect();
    log::info!("nuclo-gpui: {} with the {look:?} look", bundle.display());
    cx.open_window(window_options(look, cx), move |window, cx| {
        let view = cx.new(|cx| host::Host::new(bundle, look, insets(), cx));
        let focus = view.read(cx).focus.clone();
        window.focus(&focus, cx);
        view
    })
    .expect("open window");
    cx.activate(true);
}

#[cfg(any(target_os = "ios", target_os = "android"))]
fn window_options(_: look::Look, _: &App) -> WindowOptions {
    WindowOptions::default()
}

#[cfg(not(any(target_os = "ios", target_os = "android")))]
fn window_options(look: look::Look, cx: &App) -> WindowOptions {
    use gpui::{Bounds, TitlebarOptions, WindowBounds, point, px, size};
    let (width, height) = if look.sidebar() { (900., 640.) } else { (420., 760.) };
    let mac = look == look::Look::Macos;
    WindowOptions {
        window_bounds: Some(WindowBounds::Windowed(Bounds::centered(None, size(px(width), px(height)), cx))),
        titlebar: Some(TitlebarOptions {
            title: Some("nuclo-native".into()),
            // macOS: the sidebar runs under the traffic lights.
            appears_transparent: mac,
            traffic_light_position: mac.then(|| point(px(18.), px(18.))),
        }),
        app_id: Some("dev.nuclo.native".into()),
        ..Default::default()
    }
}

/// Safe-area top and bottom, in points.
fn insets() -> (f32, f32) {
    #[cfg(target_os = "ios")]
    {
        let (top, bottom, _, _) = gpui_mobile::safe_area_insets();
        return (top.max(54.), bottom.max(20.));
    }
    #[allow(unreachable_code)]
    (0., 0.)
}

/// Logs to stderr (the simulator console, a terminal): ours from info up, everyone's
/// warnings and errors. `NUCLO_LOG=debug` shows everything at debug level.
pub fn init_logging() {
    struct Stderr(log::LevelFilter);
    impl log::Log for Stderr {
        fn enabled(&self, metadata: &log::Metadata) -> bool {
            metadata.level() <= self.0
        }
        fn log(&self, record: &log::Record) {
            let ours = record.target().starts_with("nuclo");
            let shown = ours || record.level() <= log::Level::Warn || self.0 >= log::LevelFilter::Debug;
            if self.enabled(record.metadata()) && shown {
                eprintln!("[{} {}] {}", record.level(), record.target(), record.args());
            }
        }
        fn flush(&self) {}
    }
    let level = match std::env::var("NUCLO_LOG").as_deref() {
        Ok("debug") => log::LevelFilter::Debug,
        _ => log::LevelFilter::Info,
    };
    let logger: &'static Stderr = Box::leak(Box::new(Stderr(level)));
    let _ = log::set_logger(logger).map(|()| log::set_max_level(level));
}

/// iOS: called by ios/main.m before `gpui_ios_run_demo()` starts GPUI.
///
/// # Safety
/// `bundle` is a NUL-terminated path to app.js.
#[cfg(target_os = "ios")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn nuclo_ios_register(bundle: *const std::ffi::c_char) {
    init_logging();
    let path = unsafe { std::ffi::CStr::from_ptr(bundle) }.to_string_lossy().into_owned();
    gpui_mobile::ios::ffi::set_app_callback(Box::new(move |cx: &mut App| open(PathBuf::from(path), cx)));
}

/// Android: NativeActivity's entry point (android-activity).
#[cfg(target_os = "android")]
#[unsafe(no_mangle)]
fn android_main(app: android_activity::AndroidApp) {
    android_logger::init_once(android_logger::Config::default().with_max_level(log::LevelFilter::Info).with_tag("nuclo"));
    gpui_mobile::android::jni::install_panic_hook();
    let bundle = unpack(&app);
    let _platform = gpui_mobile::android::jni::init_platform(&app);
    let Some(shared) = gpui_mobile::android::jni::shared_platform() else {
        log::error!("nuclo-gpui: no Android platform");
        return;
    };
    gpui::Application::with_platform(shared.into_rc()).run(move |cx: &mut App| open(bundle, cx));
}

/// APK assets are not files: copy app.js and its images to app storage.
#[cfg(target_os = "android")]
fn unpack(app: &android_activity::AndroidApp) -> PathBuf {
    use std::ffi::{CStr, CString};
    use std::io::Read;
    let dir = app.internal_data_path().expect("internal data path").join("bundle");
    let manager = app.asset_manager();
    let mut copy = |name: &str| {
        let Some(mut asset) = manager.open(&CString::new(name).unwrap()) else { return };
        let mut bytes = Vec::new();
        if asset.read_to_end(&mut bytes).is_ok() {
            let target = dir.join(name);
            let _ = std::fs::create_dir_all(target.parent().unwrap());
            let _ = std::fs::write(target, bytes);
        }
    };
    copy("app.js");
    copy("fonts/Inter-Regular.ttf");
    copy("fonts/Inter-Bold.ttf");
    if let Some(listing) = manager.open_dir(c"assets") {
        let names: Vec<String> = listing.map(|name: CString| name.to_string_lossy().into_owned()).collect();
        for name in names {
            copy(&format!("assets/{name}"));
        }
    }
    let _: &CStr = c"";
    dir.join("app.js")
}
