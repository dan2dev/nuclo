# nuclo-native-ns

A native social app written only in **Nuclo Script**: 50 screens in five tabs (a photo feed with stories,
comments, likes, profiles, explore and search, activity, messages, notes, settings, and a Lab of gestures,
menus, and sheets), built from one source for six platforms. Each platform runs **its own nuclo runtime**
(`runtime/<platform>`), with the platform's own navigation, sheets, gestures, switches, and storage.

| Target | Compiler | Runtime (vendored in `runtime/`) | Navigation | Storage |
| --- | --- | --- | --- | --- |
| **web** | `nns --target ts` → bun | **nuclo-core** itself (the DOM) | History API, a stack per tab, app bar, tab bar (a side rail from 720 px), sheets that follow the finger | localStorage |
| **android** | `nns --target kt` → Gradle (`hosts/android`) | `runtime/android` (Android Views) | app bar, bottom tabs, system back, predictive back callback | SQLite (`android.database.sqlite`) |
| **ios** | `nns --target swift` → swiftc | `runtime/ios` (UIKit) | UINavigationController + UITabBarController, page sheets | SQLite (`libsqlite3`) |
| **macos** | `nns --target swift` → swiftc | `runtime/ios` on AppKit through `runtime/macos/UIKitShim.swift` | the same, on AppKit | SQLite (`libsqlite3`) |
| **linux** | `nns --target rs` → cargo | `runtime/rust` core + `runtime/rust-gtk` (GTK 4 / libadwaita) | AdwNavigationView, header bar, view switcher bar, bottom-sheet dialogs | SQLite (rusqlite, bundled) |
| **linux-gpui** | `nns --target rs` → cargo | `runtime/rust` core + `runtime/rust-gpui` (GPUI draws every view) | app bar, tabs, sheets drawn by the backend | SQLite (rusqlite, bundled) |

```
src/*.ns ──nns --target ts────▶ build/web ──bun───────────▶ page (nuclo-core)
         ├─nns --target kt────▶ build/android ──Gradle────▶ APK
         ├─nns --target swift─▶ build/ios, build/macos ──swiftc (on a Mac)──▶ .app
         └─nns --target rs────▶ build/linux, build/linux-gpui ──cargo──▶ binaries
```

## Layout

| Path | Content |
| --- | --- |
| `src/ui.ns` | The UI API: builders, the style object (`Style`, with `pressed`, `hover`, `md`, `lg`), attributes and gesture events (pan, pinch, long press, double tap, pointer, scroll), `list`, `when`, `update`, the router (`route`, `navigate`, `go`, `back`, `reset`), `overlay`, `later`, `haptic`, `viewport`, `theme`, `platform`. The `extern` parts are each platform's renderer. |
| `src/store.ns` | Storage on the device: `dbPut`, `dbAll`, `dbDelete`, `dbClear`, `dbInfo` (one SQLite table of rows; JSON fields). |
| `src/theme.ns` | Design tokens: light and dark palettes, five accents, spacing, radii, type. `themed(...)` caches a style per theme version, so a dynamic class costs one comparison per update. |
| `src/data.ns` | The network: people, posts, stories, chats, notifications, tags. Photos from Lorem Picsum and pravatar, at the size shown (2x). |
| `src/state.ns` | Everything the user does, written through at once: likes, saves, follows, comments, posts, notes (CRUD), messages, settings, profile. |
| `src/kit.ns` | The component kit and the overlay layer: toasts, action sheets, popover menus with submenus and check marks, bottom sheets with detents (drag the grabber), alerts. |
| `src/feed.ns`, `people.ns`, `explore.ns`, `inbox.ns`, `settings.ns`, `notes.ns`, `lab.ns` | The screens. |
| `src/app.ns` | The 50 routes, the five tabs, and `main`. |
| `native/web/extern.ts` | The renderer over nuclo-core: styles to atomic CSS (memoized), Pointer Events gesture recognizers (slop, velocity, long press, double tap, pinch, ctrl+wheel), the router over the History API, localStorage. |
| `native/android/native.kt` | The renderer over the Kotlin runtime, SQLite, haptics, the system bars' colours. |
| `native/ios/native.swift` | The renderer over the Swift runtime (iOS and macOS), SQLite3, UIKit/AppKit haptics and appearance. |
| `native/rust/native.rs` | The renderer over the Rust core: one file for GTK and GPUI. rusqlite. |
| `runtime/` | Each platform's nuclo runtime, vendored from `nuclo-native-ts` (nuclo 42c6343a) and changed for this app; the Nuclo Script runtimes (`nns_rt.rs`, `NnsRuntime.kt`, `NNSRuntime.swift`, `nns_runtime.ts`). |
| `hosts/android` | The Gradle project of the APK (AGP 9, no dependencies). |
| `scripts/build.ts` | `bun scripts/build.ts <web|android|linux|linux-gpui|ios|macos>` |
| `scripts/ios.sh`, `scripts/macos.sh` | Build and run on a Mac (the runtime as the module `Nuclo`, the app as `NucloApp`). |

## Run

```sh
bun install                 # links nuclo-core
bun run check               # type check the .ns files
bun run web                 # http://localhost:4340
bun run linux               # GTK 4 / libadwaita (cargo --offline)
bun run linux-gpui          # GPUI
bun run android             # APK in hosts/android/app/build/outputs/apk/debug (JAVA_HOME: a JDK 25 with javac)
scripts/ios.sh              # on a Mac with Xcode: the iOS Simulator
scripts/macos.sh            # on a Mac
```

`NUCLO_PATH=/lab/cards` opens the Linux, iOS, and macOS builds at a screen (Android: `adb shell am start … --es NUCLO_PATH /lab/cards`;
the web: `#/lab/cards`). `NUCLO_SCREENSHOT=file.png` keeps a picture of the GTK window, written again when deleted.

## Changes to the runtimes (each platform's own)

- **Rust core**: images are cached in memory (48 MB, oldest out) and a view that asks for an image already on its way waits for that
  download; downloads run on a pool of six threads, first come first served (a hundred at once made the visible photos wait);
  one HTTP agent for the app (connections and TLS sessions reused); `window_height` in the backend; `backend()` public.
- **GTK**: the app's CSS above the user's theme (`~/.config/gtk-4.0/gtk.css`), a `gtk::Switch` for a checkbox, tab icons; the mode
  follows the app (libadwaita's colour scheme).
- **Android**: a `Switch` for a checkbox; the app bar, tab bar, status and navigation bars follow the app's mode and accent
  (`chromeTheme`); larger tab icons.
- **iOS**: SF Symbols for the tabs (house, magnifyingglass, square.grid.2x2, heart, person.crop.circle).
- **GPUI**: tab glyphs.

## Changes to the compiler (nns-poc/vscode-extension, with tests)

- TypeScript: a top-level binding whose value needs a call, imported by another module, is read with a call there too (`markLazy`).
- Rust: an imported but unused top-level binding is named as its static; a negative literal where a `float` is expected is a float;
  the closure of a top-level static no longer takes the name `v` from the program.
- Swift: a range loop's binding is `Int32` even with literal bounds; a record field of a function type is `@escaping` in the init.

## Results on 2026-11-19

| Target | Result |
| --- | --- |
| web | 47 routes opened with no console error; `tsc --strict` passes on the generated code. Menus, sheets (drag between detents and down to close), toasts checked in Chromium. |
| linux (GTK 4.24, libadwaita) | Built and run on Wayland; screenshots of the feed, Explore, Lab, Appearance in dark mode with the violet accent. SQLite file in `~/.local/share/nuclo-native-ns/app.db`. |
| linux-gpui (gpui-pre 0.3.6) | Built and run under Xvfb (lavapipe); the feed renders with the same frames as GTK. |
| android (emulator, API 37) | APK built with Gradle; feed, Lab, Menus, Settings, Explore, Notes, Swipe cards checked; three swipes on the cards counted (native pan); likes and saves survive a restart (SQLite 3.50.6). |
| ios, macos | Swift generated and **type checked** (Swift 6.4 on Linux) against a stub of the `Nuclo` module with the runtime's signatures: no error. **Not compiled with UIKit/AppKit nor run**: this machine has no Xcode. |
