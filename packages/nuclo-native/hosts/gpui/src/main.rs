//! Desktop entry point: `nuclo-gpui dist/app.js` (macOS, Linux, Windows).
//! iOS starts from ios/main.m and Android from `android_main` (lib.rs).

#[cfg(not(any(target_os = "ios", target_os = "android")))]
fn main() {
    let bundle = std::env::args().nth(1).unwrap_or_else(|| "dist/app.js".into());
    nuclo_gpui::init_logging();
    gpui_platform::application().run(move |cx: &mut gpui::App| nuclo_gpui::open(bundle.into(), cx));
}

#[cfg(any(target_os = "ios", target_os = "android"))]
fn main() {}
