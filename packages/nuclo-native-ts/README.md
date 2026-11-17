# @nuclo/native-ts (POC)

Write a nuclo app in TypeScript. `nuclo-native-ts build` compiles it ahead of time to **Swift (UIKit)**, **Kotlin (Android Views)** and **Rust (GTK 4 or GPUI)**, and bundles it for the **web**, or runs the same Rust core in the browser as **WebAssembly**. A native app ships no JavaScript engine and no JS bundle.

| Target | Output | State |
| --- | --- | --- |
| `android` | Kotlin + `NucloRuntime.kt`, built by `hosts/android` | compiled and run on an emulator |
| `web` | `index.html` + `app.js` (the app bundled with `src/runtimes/web`) | run in a browser |
| `wasm` | the Linux Rust core compiled to WebAssembly (`app.wasm`) and `host.js`, the DOM half of its backend: a finished web page | built and run in a browser; see [Web (wasm)](#web-wasm) |
| `ios` | Swift + `NucloRuntime.swift` | compiled with Xcode 27 and run on the iOS Simulator (`scripts/ios-run.sh`) |
| `macos` | the iOS Swift sources on AppKit, through `runtimes/macos/UIKitShim.swift` (the UIKit names the runtime uses, written on AppKit): `scripts/macos-run.sh` | compiled and run on macOS 27 |
| `macos-gpui` | the `linux-gpui` Cargo project with GPUI's Metal / Core Text platform | compiled and run on macOS 27 (`cargo build --release`) |
| `linux` | a Cargo project: `src/app.rs` + the Rust runtime (a core and a GTK 4 / libadwaita backend) | compiled and run on a GNOME Wayland session; see [Linux](#linux) |
| `linux-gpui` | the same Cargo project with a GPUI backend in place of the GTK one: every view is drawn by GPUI | compiled and run under XWayland on a locked screen (about one frame a second); see [Linux (GPUI)](#linux-gpui) |

It is the counterpart of `nuclo-native`. That package runs your bundle in a JS engine and drives native widgets from it; this one translates the bundle away. The syntax is nuclo's and the model is nuclo's: plain mutable state, builders that take a value or a `() => value`, and an explicit `update()`.

```ts
import { button, div, p, render, update } from "@nuclo/native-ts";

let count = 0;

const App = () =>
  div(
    { style: { padding: 24, gap: 16 } },
    p(() => `Count: ${count}`),
    button("Increment", { onClick: () => { count++; update(); } }),
  );

render(App);
```

compiles to

```swift
@MainActor var count: Int = 0

@MainActor @discardableResult func App() -> Node {
    return div(
        A.style(Style(gap: 16.0, padding: 24.0)),
        p(A.text { "Count: \(count)" }),
        button(
            A.text("Increment"),
            A.onClick { _ in
                count += 1
                update()
            }
        )
    )
}
```

```kotlin
var count: Int = 0

fun App(): Node {
    return div(
        A.style(Style(gap = 16.0, padding = 24.0)),
        p(A.text { "Count: ${count}" }),
        button(
            A.text("Increment"),
            A.onClick { _ ->
                count += 1
                update()
            },
        ),
    )
}
```

`count` became `Int` because every write to it is a whole number.

## Build

```bash
bun src/compiler/cli.ts build examples/full-showcase/App.ts --out build/out            # every target
bun src/compiler/cli.ts build examples/full-showcase/App.ts --out build/out --target web,android
bun scripts/examples.ts web,android   # every example, into build/<target>/<example>/
```

Each `<out>/<target>/` folder holds the complete sources of that platform's app, including the app's own `native/<target>/` code. Every target is checked by the same front-end, so an app that builds for one builds for all. Type errors and unsupported constructs stop the build with `file:line:column`, and nothing is written:

```
Bad.ts:3:11 - error: `any` cannot be compiled to a native type; give the value a real type.
Bad.ts:5:1 - error: `eval` cannot be compiled ahead of time.
Bad.ts:6:3 - error: A setter needs its getter in the same class natively (they are one property).
Bad.ts:7:7 - error: The type { a: number; } has no native equivalent; declare it as an interface.
```

### Android

`hosts/android` is a Gradle project (AGP 9, no NDK, no dependencies) that compiles the generated folder:

```bash
cd hosts/android && JAVA_HOME=~/.jdks/jdk-17.0.20+8 ANDROID_HOME=~/Android/Sdk ./gradlew assembleDebug --offline
```

Point `nucloSources` in `gradle.properties` (or `-PnucloSources=…`) at another build folder to build another app. When switching apps, delete `app/build/kotlin` first: Kotlin's incremental cache otherwise reports every runtime function as declared twice.

### Web

```bash
bun run web   # builds every example and serves build/web on http://localhost:4173
```

The web needs no translation: the app is bundled with `src/runtimes/web/index.ts` in place of the API module. Layout is the browser's flexbox, set up to give the boxes the native `Flex` gives. The router's address is the URL fragment, so a screen can be reloaded and linked to.

### Web (wasm)

```bash
bun run wasm   # builds every example (cargo, with the wasm32-unknown-unknown target) and serves build/wasm on http://localhost:4173
```

The `web` target runs the app as JavaScript on a DOM runtime. This one is a host like the others: the app is compiled to Rust, the Rust core (the same `src/runtimes/rust/src/nuclo/` as both Linux targets) is compiled to WebAssembly, and the page only shows what the core describes. `<out>/wasm` is a Cargo project (`src/runtimes/rust-wasm`: `web_backend.rs`, the `Backend` implementation, with the core and the generated `src/app.rs`) that the target also builds, so the folder serves as it is: `index.html`, `host.js`, `app.wasm`. It needs `rustup target add wasm32-unknown-unknown` and the crate `serde_json` (`--offline`, as the Linux builds); there is no `wasm-bindgen` or `wasm-pack`.

- **The core decides everything**: the views, their frames (the same `Flex` as Android, iOS and Linux, in whole pixels), their look and the transitions between looks. `web_backend.rs` turns a `Paint` into CSS and forwards the rest as calls to the page, plain numbers and (pointer, length) strings, no glue code generated.
- **`host.ts`** (bundled to `host.js`) is the DOM half: one absolutely positioned element per view, the browser's own events for the core (clicks, a drag after the 8 px slop, long press, double click, pinch from two fingers or ctrl + wheel, keys, scroll, hover), `fetch`, timers and frames, and the router's chrome (app bar, bottom tabs, sheets) written as the web runtime has it. Text is measured for `Backend::measure`: one line of plain text by the canvas (a lookup), anything wrapped or in another script by the browser's layout, in an iframe of its own so that reading it does not lay out the app.
- **Differences from the `web` target**: text is measured in whole pixels, as on the native targets, so a row of shrink-to-fit boxes can be a few pixels off the CSS layout's fractional widths; scrollbars are hidden, as on a phone; `fetch` is the browser's, so it follows the same cross-origin rules as the `web` target.
- **Native components and functions**: the app's platform code for this target is TypeScript for the DOM, and it is the web target's: `native/wasm/index.ts`, or `native/web/index.ts` when there is none, with `registerNative` and the exported `declare function`s written as for `web` (the build bundles it with the host, and what it imports from the web runtime is the host's own). Only the Rust glue is new, and it is generated from the app's types (`wasmNative.ts`): a `native<P>("Name")` becomes a Rust `Name` that makes the page's component and sends it `P` as JSON on every update, a function prop (`onChange`) as a number the page turns into a function that calls back into the app with its arguments as JSON, and a `declare function` becomes a Rust function that calls the page's, with JSON arguments, and decodes what it returns (a promise, for an `async` declaration). Props and arguments are numbers, strings, booleans, optionals and arrays; results may also be the app's interfaces; anything else is a build error that says so. The component's element sits in a box the host places, so what the component sets on its element is its own.
- `scripts/compare.html` loads one example built for `web` and for `wasm` at the same size and lists every text and painted box that is not in the same place (`bun scripts/serve.ts build`, copy the file to `build/compare.html`, open `?ex=layouts`). Every example matches within a pixel apart from the rounding above and, in `performance` and `full-showcase`, content that is random or a clock.
- `?profile` on the page adds `nucloProfile()` to the console: the time spent in each call into the page.

### Linux

```bash
bun src/compiler/cli.ts build examples/full-showcase/App.ts --out build/out --target linux
cd build/out/linux && cargo build --offline --release && ./target/release/nuclo-full-showcase
```

`<out>/linux` is a complete Cargo project: the generated `src/app.rs`, the runtime (`src/nuclo/`, `src/gtk_backend.rs`) and the app's `native/linux/` as `src/native/`. It needs the GTK 4 (≥ 4.12) and libadwaita (≥ 1.5) development packages, and the crates `gtk4` 0.11, `libadwaita` 0.9, `ureq` 3.5 and `serde_json`; `--offline` builds from the local registry. The package and its binary are named after the app's folder (`nuclo-<folder>`), so several apps can share one `CARGO_TARGET_DIR` and compile the dependencies once.

The runtime is in two parts, so that another toolkit can show the same apps:

- **`src/runtimes/rust/src/nuclo/`**, the core, knows no toolkit: the node tree and its bindings, `list` / `when` / `region` / `into` / `scope`, styles and variants, transitions (it paints the values in between, frame by frame), the `Flex` layout ported from `NucloRuntime.kt` statement by statement, the router's stacks, async functions on a small single-threaded executor, timers, `fetch` (ureq on a thread) and JSON decoding.
- **`src/runtimes/rust/src/gtk_backend.rs`** implements the `Backend` trait of `nuclo/backend.rs` (its header comment is the contract): GTK widgets (label, button, entry, check button, text view, picture, scrolled window) placed at the frames the core computes and measured with Pango, libadwaita's navigation view, header bar, view switcher bar and dialog for the router, GTK gestures for the pointer.

What the Rust printer (`emitRust.ts`) adds to the IR, because Rust infers and shares less than Swift and Kotlin: it types every expression to wrap optionals and pick `A::text` or `A::text_fn`; interfaces are `Rc` structs with `Var` fields and identity equality; classes are flattened (a struct holds its bases' fields too, methods and constructors are free functions of `this`), and a class with subclasses or an interface a class implements is a trait whose methods take `self: Rc<Self>`, its values `Rc<dyn Trait>`; arrays and maps are shared handles (a global array is read without copying it), globals are thread-local `Var`s initialized in order by `nuclo_main`, a local that a closure captures and something reassigns is an `Rc<Var>`, closures are `move` closures over clones, a local function takes the locals it reads as extra parameters, every `async fn` returns a `Result`, and `try` is a labelled block. The generated code has no `unsafe`.

`NUCLO_SCREENSHOT=file.png` makes the app keep `file.png` a picture of its window (it is written again whenever it is deleted): a Wayland window can't be captured from outside.

### Linux (GPUI)

```bash
bun src/compiler/cli.ts build examples/full-showcase/App.ts --out build/out --target linux-gpui
cd build/out/linux-gpui && cargo build --offline --release && ./target/release/nuclo-full-showcase
```

The same generated `src/app.rs` and the same core (`src/nuclo/`, copied from `src/runtimes/rust`), with `src/runtimes/rust-gpui` in place of the GTK backend: its own `Cargo.toml` (the crates `gpui-pre` and `gpui-pre-platform` =0.3.6 with their `wayland` and `x11` features, `ureq`, `serde_json`; no GTK), `main.rs`, `gpui_backend.rs` and `gpui_field.rs`, and the app's `native/linux-gpui/` as `src/native/`. Neither Linux target compiles the other's toolkit. It runs on Wayland, or on X11 when `WAYLAND_DISPLAY` is unset.

GPUI has no widgets and keeps no tree: an element paints what is on screen, every frame. So the backend keeps the tree the core describes (kind, frame, paint and content per view) and one element paints it, at the frames the core's `Flex` computes:

- boxes as quads and shadows, text shaped and measured by GPUI's text system (so the core lays out with the sizes that are drawn), images cut to cover their box, a checkbox, and a text field and textarea of its own (`gpui_field.rs`: selection, clipboard, the platform's text input);
- the router's chrome with the sizes and colours of the Android and web runtimes: a 56 px app bar (← and the title), 64 px bottom tabs, a modal screen as a sheet over all of it, screens sliding in and out;
- the pointer resolved against the same tree: click, pointer down / move / up / cancel, pan after an 8 px slop (then it owns the drag), double click, long press (500 ms), hover and pressed states, the wheel on the innermost scroller, pinch from a touchpad or ctrl + wheel, keys to the focused field or box. Escape, alt + ← and the mouse's back button go back.

Text is set in the desktop's interface font (`gsettings`, as GTK) and fontconfig's serif and monospace, and measured as Pango measures it, so both Linux targets give a text the same box. GPUI 0.3.6 does not instantiate variable fonts: when the interface font is one variable file (Ubuntu), bold text is set in fontconfig's sans-serif instead, at the regular font's line height.

A native component for this target is something that draws (`gpui_backend::Draw`: `measure`, `paint` with GPUI's paint calls, `pointer`), since there is no widget to hand over; `examples/native-components/native/linux-gpui/mod.rs` has a slider and a gauge written that way.

There is no `NUCLO_SCREENSHOT` here: GPUI only reads a frame back under its test support, which its Linux windows do not implement. On X11 (XWayland) the window can be captured from outside: `ffmpeg -f x11grab -window_id <id> -i :0 -frames:v 1 shot.png`.

### iOS

Quick run on a simulator, no Xcode project: `scripts/ios-run.sh [example] [simulator]` builds `build/ios/<example>` with `swiftc` into an `.app` and launches it. For a real app:

1. Create an iOS App project in Xcode (UIKit, iOS 15+).
2. Delete its `AppDelegate`, `SceneDelegate` and storyboard. Remove `UIApplicationSceneManifest` and `UIMainStoryboardFile` from `Info.plist`.
3. Add every file from `build/ios` (the app, the runtime, and the app's own `native/ios/*.swift` when it has any).

`App.swift` declares the `@main` app delegate.

## macOS (AppKit)

`bun start` lists the targets this machine runs (iOS, Android, macOS, GPUI, Linux, web, wasm) and asks which, then which example. `bun run ios`, `bun run android`, `bun run macos` (and the other native targets) with no example list the examples that build for that target and ask which to run. `bun run macos <example>` (`bun run macos chirp`) compiles the example for macOS, builds it with `swiftc` into `build/macos-app/<example>/NucloApp.app` (with the example's `assets/` in its resources) and opens it; `scripts/macos-run.sh <example>` is the same step. There is one Swift runtime: `NucloRuntime.swift` is compiled against UIKit on iOS and against `UIKitShim.swift` on macOS, where a `UIView` is a flipped, layer-backed `NSView`. The mouse stands in for touches (tap, double click, long press, pan after 10 pt, hover), the trackpad pinches, the wheel scrolls; navigation and tabs are plain views (a 56 pt bar and a 64 pt tab bar, as on Android and the web). A checkbox is the Mac's own (20 × 20, as a browser draws it), not a switch, and the app keeps the light appearance it paints in Dark Mode too. An app's own macOS code lives in `native/macos/` (see `examples/native-components`). For checks against the web build, the app reads its environment: `NUCLO_DUMP=file` writes label frames and `NUCLO_SHOT=file.png` a picture of the window, two seconds after launch; `NUCLO_PATH=/post/1` starts at a route (the web's `#/post/1`), `NUCLO_SIZE=700x900` sets the window's content size, `NUCLO_SCROLL=points` scrolls the shown screen a second after launch. `scripts/macos-run.sh` passes them on and quits the app after `NUCLO_WAIT` seconds (4) when a dump or a picture is asked for. Gaps against iOS: no scroll indicators or drag-to-scroll, a modal sheet is dismissed by clicking its backdrop (no swipe), `inputType("password")` does not hide the text, transitions use `NSAnimationContext`.

## Layout parity

The content area of every target lays out the same as the web build, to the pixel (to the device pixel on Android): a text's line is `round(fontSize × 1.2)` tall unless the style sets `lineHeight`. `NUCLO_DUMP=file` (iOS, macOS, GPUI) writes `text|x|y|w|h` of every label two seconds after launch; on the web, `?dump` before the `#path` writes the same lines into a `<pre id="nuclo-dump">` (`chrome-headless-shell --window-size=420,780 --dump-dom 'http://localhost:4173/chirp/?dump#/explore'`); on Android, `uiautomator dump` gives the same. Text is measured up to the device pixel, as a browser lays it out: on macOS every screen of `chirp` and `styles` is within a point of the web build (most within half a point), at 420 and at 700 points wide. What differs on purpose: the system chrome (status bar, safe areas, native navigation and tab bars) and the font's own widths (Roboto on Android is not SF).

## Examples

Each folder in `examples/` is an app; all of them build for every target.

- **`full-showcase`**: update(), scopes, variants, lifecycle, lists, a modal through `into()`, toasts, async fetch.
- **`gestures`**: a card dragged with `onPan` that springs back, swipe-to-archive rows, pinch / double tap / long press, pointer tracking.
- **`navigation`**: three tab stacks, pushed screens with path params, a modal sheet, `replace` and `reset`.
- **`layouts`**: one dashboard — overlapping avatars, a sliding segmented control, a 2 × 2 grid, an animated bar chart, a horizontal carousel, wrapping chips, an accordion, a floating button on its own layer.
- **`performance`**: `requestAnimationFrame` moving up to 1,000 platform views per frame through `update()`, with its own fps and update-time readout.
- **`native-components`**: a platform slider and a platform-drawn gauge as typed components, and three native functions.
- **`camera`**: the live camera as a typed component, `Camera({ facing })`, with nuclo's shutter, flip button, flash and gallery drawn over and under it. `requestCamera()` asks for access; `takePhoto()` returns a photo of what the shown camera sees as a URL `img()` shows (`file://` natively, a blob URL on the web and wasm; `""` on Linux when no camera is shown, since a Rust native function cannot throw). AVFoundation on iOS and macOS (a Mac's own camera faces you; another camera, an external one or an iPhone, stands in for the back one), Camera2 on a `TextureView` on Android (no library; the photo is turned upright in code), `getUserMedia` on the web and wasm. Where there is no camera to show — the iOS simulator, GTK (which needs GStreamer for one) and GPUI (which embeds nothing) — the view is a test card in the facing camera's colour with a ticking clock, and a photo is a picture of it (a PNG drawn with cairo on GTK; on GPUI a BMP of the colour with the time in seven segments). The Android runtime's `requestPermission(name)` asks for any runtime permission; the host's manifest declares `CAMERA` (not required to install), and `scripts/ios-run.sh` and `scripts/macos-run.sh` write `NSCameraUsageDescription`.
- **`platform-views`**: `WebView({ url, onLoad })` (WKWebView on iOS and macOS, `android.webkit.WebView`, an iframe on the web and wasm; GTK and GPUI embed no browser, so there the page is fetched and its title and text are shown), `DatePicker({ value, onChange })` (a compact `UIDatePicker`, an `NSDatePicker` with its calendar, a field opening Android's `DatePickerDialog`, a `GtkCalendar` in a popover, `<input type="date">`; on GPUI a drawn ‹ day › stepper), `share(text)`, which shares the platform's way (its share sheet, or the clipboard on GTK, GPUI and a browser without `navigator.share`) and says what happened, and `daysUntil(date)` on the platform's calendar. GPUI's native code draws its text with `gpui_backend::paint_label` and reaches the clipboard with `copy_text`.
- **`design-patterns`**: the 23 GoF patterns plus Module, Null Object, Dependency Injection, Publish / Subscribe and Specification, written without classes, `this` or generics: interfaces with function fields, private state in closures. Strategy, Observer, State, Visitor and Template Method again with classes (`implements`, `abstract`, `override`, `super`, getters, statics). Each card prints what its demo returned, and every target prints the same 89 lines as the TypeScript run under Bun.
- **`language`**: one card per language feature the compiler translates (enums, destructuring, spread and rest, operators, optional calls, loops, `finally`, array, string, map and number methods, classes, generics), each printing lines that every target must print exactly as TypeScript does.
- **`bench`**: list operations timed as js-framework-benchmark does.
- **`chirp`**: nuclo-native's social app, ported: a faked server with 100,000 people and a million posts loaded a page at a time (`onEndReached`), threads, replies, profiles, friends, search and three forms, styled with a `createCss` theme. A video shows its poster (no player natively) and every loaded row exists (no `windowed()`).
- **`responsive`**: one shop screen restructured at 480 / 768 / 1024 / 1280 px: a breakpoint badge, inline nav or a menu button, sidebar + content + aside, a 1–6 column grid by percent widths, stacked or side-by-side media, form and pricing, a table that is cards on a phone, a wrapping footer.
- **`responsive-styles`**: every kind of style property changed by the window's width: colours, box, text, line clamp, transforms with a transition, sizes, `variants()` with `@media`, states per screen, a style function with `@media`, `max-width` and closed ranges.
- **`layout-matrix`**: every flex layout in one labelled box each (justify and align in rows and columns, `alignSelf`, weights, min / max, wrap, percents, margins, absolute, `zIndex`, overflow, `aspectRatio`, display / visibility, nesting), a playground cycling direction × justify × align × wrap × gap, in a grid of 1 to 6 columns by width.
- **`styles`**: nuclo-core's styling system on one screen: tokens, shorthands, states, structural pseudo-classes, `@media` and screens, keyframes, variants on a theme, `globalStyle`.

## Beyond nuclo's DOM API

Natively there is no DOM, so what an app would reach for through it is part of the API (`src/index.ts` is the whole contract):

- **Style keys**: nuclo-core's short keys work as well as the long ones (`p`, `px`, `py`, `m…`, `w`, `h`, `size`, `bg`, `rounded`, `text`, `font`, `weight`, `leading`, `tracking`, `items`, `justify`, `z`, `shadow`, and the flags `row`, `col`, `center`, `truncate`). `width` also takes a share of the parent's width, `"50%"` or `` `${value}%` `` (a fixed or dynamic value; not `height`, not min/max). With a margin, the share is taken of the width the margin leaves.
- **nuclo-core's styling system**: a style object is nuclo-core's, read by the compiler (`src/styleAliases.ts`, which the web runtime runs as the app runs) into the native keys:
  - **values as CSS writes them**: lengths `"12px"`, `"1.5rem"`, `"auto"`; `border` / `borderTop…` `"1px solid #e5e7eb"` (a side's own width and colour); `boxShadow` `"0 4px 12px rgba(0,0,0,.12)"`; `transform` `"translate(4px, 0) rotate(45deg) scale(1.1)"`; `transition` `"opacity 200ms ease-out"`; `flex: "1 1 0%"`; `aspectRatio: "16 / 9"`; `opacity: "70%"`; `fontWeight` 100–900 (light, normal, medium, semibold, bold); `lineHeight` under 4 as a multiple of the font size; `textTransform`; `inset`; `overflow: "auto"`; `visibility`; `whiteSpace: "nowrap"`; `objectFit`; `pointerEvents`; colours `#rgb(a)`, `#rrggbb(aa)`, `rgb()`, `rgba()`, `hsl()`, `hsla()` and the common names; `raw` declarations by their CSS names. A value must be a literal, a ternary of literals or a `const` of one (the compiler reads it), except numbers, colours, fonts, `` `${n}px` `` and `` `1px solid ${color}` ``, which may be computed. Keys the platform decides (`cursor`, `userSelect`, `boxSizing`, `outline`, `flexShrink`, `flexBasis`…) are accepted and change nothing, on the web too.
  - **states**: `hover`, `active` (= `pressed`), `focus` / `focusVisible` / `focusWithin` (= `focused`), `disabled`, `enabled`, `checked`, `placeholderShown`, `placeholder` (its colour), and by place among siblings `first`, `last`, `only`, `odd`, `even`, plus `empty`; the same as `"&:hover"`, `"&:nth-child(odd)"`…. Structural states merge in that order (not in the order written).
  - **`@media (min-width: …)` / `(max-width: …)`** blocks and a theme's **screens** (`md: { p: 24 }`), against the window's width, restyled when it changes.
  - **`createCss({ colors, fonts, shadows, radii, screens })`**, destructured where it is called: tokens are resolved where a style names one with a literal, and `theme.colors.x` reads a value. One theme per app.
  - **`keyframes({ from, "50%", to })`** as a top-level const, named in `animation: `${pulse} 1.2s ease-in-out infinite alternate``: opacity, transforms and background colour, run by the platform (Core Animation, Android animators, the core's frame loop on Linux, CSS on the web).
  - **`globalStyle("body", …)`** (the screens' background and the text everything inherits) and `globalStyle("h2", …)` for a tag.
  - Rejected with a message: pseudo-elements and states with no native counterpart (`before`, `after`, `selection`, `marker`, `firstLine`, `firstLetter`, `visited`, `required`, `valid`, `invalid`, `readOnly`), other selectors, `@media` on anything but the width, grid, `filter`, `backgroundImage`, `position: "fixed"`.
- **`progress` and `meter`**: bars drawn the same on every platform, a track with a fill (the compiler lowers them, so no runtime has a platform bar to differ from). `value` is a number or `() => number`; `min`, `max`, `low`, `high` and `optimum` are number literals. `meter` colors its fill as HTML does (green near `optimum`, yellow a range away, red two away). `style` is the track's (160×16, or 80×16 for `meter`); the fill's colors are fixed. A `progress` without a value is an empty track, not an animation.
- **`select`, `option` and `optgroup`**: a box with a row (the chosen option's text and a chevron) that opens the options below it when pressed; an option sets what is chosen, closes the select and calls `onChange` with `event.target.value`; `value` (a string, or `() => string`) makes it controlled, and without one the select keeps its own choice, the first option at first. The options are written directly in the `select`, in an `optgroup`, or in the render function of a `list()` there; an `option` in a helper function is a build error, because the compiler builds the control around the options where they are written. The control is the same boxes and text on every compiled target (the platforms' own choosers have no common look), and the `web` target uses the browser's own `<select>`. `style` is the box around the control and its options (white, 1px border, rounded, and a `padding` of its own would pad the row and the options together), `disabled` stops it opening, a disabled option cannot be picked. The options open inline, pushing what is below them down; pressing outside does not close it.
- **Layout**: flex with `margin`, min/max sizes, `alignSelf`, `flexWrap`, `aspectRatio`, `position: "absolute"`, `zIndex`, and `overflow: "scroll"` for the platform's own scrolling (it must be in a static style or class: the scroller exists before the children arrive).
- **Paint**: shadows, fonts, `lineHeight`, `letterSpacing`, `textDecoration`, `numberOfLines`, and transforms as numbers (`translateX`, `translateY`, `scale`, `rotate`), so a gesture can drive them.
- **Transitions**: `transitionDuration` / `Delay` / `Easing` animate a change of opacity, transform, background colour, corner radius and of the box's own `width` / `height`.
- **State styles**: `pressed`, `hover`, `focused`, merged over the style while the state holds.
- **Events**: `onPan`, `onPinch`, `onLongPress`, `onDoubleClick`, pointer down / move / up / cancel, `onScroll`, `onFocus`, `onBlur`, `onKeyDown`, each with a typed event.
- **Frames**: `requestAnimationFrame`; the nuclo way to animate by hand is to change numbers and call `update()`.
- **Navigation**: `go`, `back`, `replace`, `reset`, tabs, `presentation: "modal"`, `header: false`, and a route's `onEndReached(params)`, run when its screen is scrolled to within half a screen of the end (once per content height, and after layout: a short page asks for more).

## Native components and functions

Anything the platform can do, an app can use, typed on both sides:

```ts
interface SliderProps { value: Double; min: Double; max: Double; onChange: (value: Double) => void }
const Slider = native<SliderProps>("Slider");

declare function vibrate(milliseconds: Int): void;

Slider({ value: () => volume, min: 0, max: 100, onChange: (v) => { volume = v; update(); }, style: { height: 40 } })
```

The implementations live beside the app's entry file and are compiled with the generated code:

```
native/android/*.kt    class Slider : NativeComponent<SliderProps>   fun vibrate(milliseconds: Int)
native/ios/*.swift     final class Slider: NativeComponent           func vibrate(_ milliseconds: Int)
native/web/index.ts    registerNative<SliderProps>("Slider", …)      export function vibrate(…)
native/linux/mod.rs    #[derive(Default)] struct Slider; impl NativeComponent<SliderProps> for Slider   pub fn vibrate(milliseconds: i64)
native/linux-gpui/mod.rs    the same, its view a `gpui_backend::Draw` instead of a GTK widget
```

`SliderProps` is the class the compiler generated from the app's interface, so platform code that misreads a prop does not build, and an app that passes a wrong prop does not type-check. A value given as a function is a binding: it is dirty-checked on `update()`, and the component's `update` runs only when one changed. Numbers of a `declare function` must be `Int` or `Double`; one returning a `Promise` is awaited (`suspend` / `async`).

## How it works

```
App.ts ──ts.createProgram + TypeChecker──▶ transpile.ts ──typed IR (ir.ts)──┬─▶ emitSwift.ts  ─▶ App.swift + NucloRuntime.swift
                                                                            ├─▶ emitKotlin.ts ─▶ App.kt    + NucloRuntime.kt
                                                                            └─▶ emitRust.ts   ─▶ src/app.rs + the Rust runtime (see Linux)
```

- **`transpile.ts`** settles every TypeScript question, so the printers only choose syntax:
  - Types: `string`, `boolean`, `T | null` → optional, `T[]` → `[T]` / `MutableList<T>`, `Record<string, T>` → a map, interfaces → classes, classes → classes, an interface a class implements → a protocol / interface / trait.
  - Numbers: each variable, property, parameter and return value holding a `number` starts as `Int`. A fixpoint over every write turns it into `Double` once something non-whole can reach it (`/`, a decimal literal, a `Double` slot). `Int` / `Double` annotations from the API force the choice.
  - Narrowing: a nullable value that TypeScript has narrowed is force-unwrapped where it is read (`todo!.title` / `todo!!.title`).
  - Async: `async` functions become `async throws` / `suspend`. An un-awaited call is launched (`Task {}` / `launch {}`).
  - Builders: attribute objects expand into modifiers. `when()` / `into()` content becomes closures, so a branch is built when it opens. Style literals become typed `Style` values with enums. `variants()` becomes a recipe. `createRouter()` becomes the native router. `res.json<T>()` gets a generated decoder, with no reflection.
- **The runtimes** (`src/runtimes/*`) implement the API on one model:
  - A `Node` tree whose dynamic values are bindings, each dirty-checked against its last value before a view is touched.
  - Fragment nodes for `list` / `when` / `region` / `into`, which own no view and reconcile in place.
  - One flex layout algorithm (`Flex`), written once per platform, so both lay out the same boxes.

| nuclo | iOS | Android | Linux (GTK 4) |
| --- | --- | --- | --- |
| `update()` / `update("id")` + `scope("id")` | re-runs bindings of all roots / of the scope's subtrees | same | same |
| `p(() => …)`, `{ style: () => … }`, `value`, `checked`, `disabled` | binding + `Equatable` dirty check → `UILabel.text`, layer paint… | binding + `==` → `TextView.text`, drawable… | binding + `==` → `GtkLabel` text, a `Paint` the view draws |
| `list(items, render)` | rows keyed by identity (`===`), views inserted/moved/removed in their `FlexView` | same, in `FlexLayout` | same, in the box's `NucloView` |
| `when().when().else()` | branch built on open, destroyed on close | same | same |
| `region()` / `into()` (`latest`, `stack`, `empty`) | content lives as long as the `into()` | same | same |
| `onMount` / `onDestroy` (+ returned cleanup) | `didMoveToWindow` of a probe subview / node destroy | `OnAttachStateChangeListener` / node destroy | when the node is under a root that is on screen / node destroy |
| `async` + `fetch` + `when()` branches | `URLSession`, resumes on the main actor | `HttpURLConnection` on a thread, stdlib coroutine resumed on the main looper | `async fn` on the core's executor, ureq on a thread, resumed from the GLib main loop |
| `css()`, `cx()`, `variants()` | `Style` merges, cached per selection | same | same |
| `createRouter(routes, { tabs })`, `go` / `back` / `reset` | `UITabBarController` + `UINavigationController`, edge swipe syncs the router | bottom bar, app bar, view stack, system back (predictive-back dispatcher on API 33+) | `AdwNavigationView` per tab under an `AdwHeaderBar`, `AdwViewSwitcherBar`, `AdwDialog` for a modal; the header's back button and swipe sync the router |
| `render(App)`, then `render(Overlay)` | main view, then a pass-through layer over it | same | a scrolling page, then `GtkOverlay` layers that are not hit where they have no view |

## What was checked

On this machine (Linux):

- **Kotlin**: `App.kt` and `NucloRuntime.kt` compile against Android SDK 37 with AGP 9.5 and Kotlin 2.4, with 0 errors and 0 warnings. The showcase was driven on the Android emulator (API 37):
  - counter, `disabled`, and an `Even` / `Odd` `when()`;
  - `update('cart')` refreshing only its scope (4 inside it, 2 outside, until a global update);
  - the clock's interval starting in `onMount` and its cleanup and `onDestroy` running when its branch closes;
  - adding a todo with Enter, toggling, filtering, the `into('modal')` dialog over the navigation, deleting, toasts;
  - pushing `/todos/:id` and `/feed/:id` (title from params), back by key and by arrow;
  - the feed's loading branch (progress on a scoped update), the decoded posts, and the HTTP 404 error branch.
- **Kotlin, the new API**: all seven examples and `test/fixtures/accept.ts` compile with 0 errors and 0 warnings (`bun run check:android`). Run on the emulator: the pan drag and its spring back, swipe-to-archive, long press, double tap, the navigation example's pushes, modal sheet, system back, `replace` and `reset`, the focused style of a field, the layouts example (wrapping, shrink-to-fit pills, the segmented control, scrolling carousel), the native slider, gauge and functions. Not exercised: pinch (no two-finger input on the emulator), key events, `href`, the text tags added by name.
- **Web**: the showcase, gestures, layouts, navigation (including a deep link) and native-components examples were driven in a browser with no console errors. The layouts example gives the same boxes as on Android, down to where the chip row wraps; fonts differ per platform.
- **Rust (Linux, GTK 4.24, libadwaita 1.10, rustc 1.100)**: all seven examples and `test/fixtures/accept.ts` compile to Rust and build with `cargo build --offline --release`, with 0 errors and 0 warnings; the printer reports nothing unimplemented for any of them (`bun test` checks that). The apps were run on a GNOME Wayland session. There is no tool here that injects pointer or key events into a Wayland window, so they were driven in three ways, and what each proves differs:
  - *Through the accessibility interface (AT-SPI)*, which activates real GTK buttons, tabs and fields: in the showcase, the counter, `disabled`, Even/Odd, `update('cart')` (1 inside the scope, 0 outside until a global update), the clock's `onMount` interval, its `onDestroy` log and its restart; adding a todo from the field and the Add button, the toast, the filters, the `into('modal')` dialog over the navigation and its Delete, pushing `/todos/:id` (title from the param), editing the title there, back by the header bar's button and by `router.back()`; the feed mounting when its tab is first shown, the progress bar on a scoped update, the posts fetched over HTTPS and decoded, the HTTP 404 error branch and Retry. In native-components, the GtkScale moved through AT-SPI changed the volume, the text and the gauge.
  - *Through GTK's own hit test* (`gtk_widget_pick` at a point, from a hook patched into a scratch copy of the backend, then the input reported to the core as the backend reports it): a click on a box, on text and on a check button; the pointer passing through the overlay layer to the app and being stopped by the modal's scrim; in navigation, push, `replace`, the modal route as a libadwaita bottom sheet with `header: false`, and `back()` closing it; in gestures, the card following a pan with its rotation, scale and shadow, springing back on release, a row archived by a swipe, pinch, double click and long press handlers; in layouts, the segmented control's indicator and the chart's bars at their new places after a transition, and the theme change; the native functions. A transition's frames in between were seen once, as a view's position changing over about 250 ms after a release. **This does not exercise the GTK gesture recognizers themselves** (`GestureDrag`, `GestureZoom`, `GestureLongPress`, `GestureClick`), the hover controller or key events: that code compiles and has not been seen working.
  - *By running*: the performance example (200 views moved by `requestAnimationFrame` at 60 frames/s) and the bench, which completes all nine operations.

  Screenshots (the window's own rendering) were looked at for each example. Not seen at all: Enter in a field (`onChange`), `onKeyDown`, `onFocus` / `onBlur` and the `focused` style, `hover`, `href`, `img` loading, `textarea`, `forceUpdate()`, scrolling a scroll box by hand and `onScroll`, a transition of `width`, `zIndex` changing at run time, a row in a horizontal scroller wider than its viewport being dragged, and the frames against the Android runtime's numbers (the layout code is a port; text sizes come from Pango and differ from Android's).

  The bench on this desktop (release build, 5 runs each, to the end of the frame): create 1,000 rows 392 ms, replace 480 ms, partial update 30 ms, select 10 ms, swap 11 ms, remove 19 ms, create 10,000 rows 4.2 s, append 1,000 420 ms, clear 65 ms. GTK widgets are the cost: about 850 MB resident with 10,000 rows (40,000 views), which the allocator keeps after the rows go; a second run in the same process peaked about 10% higher (it was started through AT-SPI, which adds its own objects), not twice as high.

  Gaps on Linux: `fontFamily` knows `serif`, `sans-serif` and `monospace` only; a `textarea` keeps the theme's font; pinch has no focal point from ctrl + wheel; a pointer has no `pointerId`; selecting the active tab again does not reset its stack; the title bar of an app without a router shows the binary's name.
- **Rust (Linux, GPUI 0.3.6)**: all seven examples compile to the `linux-gpui` project and build with `cargo build --offline --release`, with 0 errors and 0 warnings. The GTK target was rebuilt next to it: its project has no GPUI file in it, and its screenshot of the layouts example is the same picture, pixel for pixel, as before the GPUI backend existed (the core was not changed for it). What was seen is narrower than for GTK, and for two reasons that are this machine's:
  - *The screen was locked the whole time.* On Wayland a locked session is given no frames, so there the apps were only run, not looked at. They were looked at under XWayland (`WAYLAND_DISPLAY` unset), where a hidden window still gets about one frame a second and can be captured from outside (`ffmpeg -f x11grab -window_id …`). **No frame rate above 1/s, no frame in between of a transition or of a sliding screen, and no timing to a presented frame was seen.**
  - *Nothing here can inject input into another app's window* (XTEST goes through a consent prompt). Input was sent through GPUI's own dispatch (`Window::dispatch_event` and `dispatch_keystroke`, the entry the platform's events take) by a driver patched into a scratch copy of the backend. So everything below ran through the backend's real listeners, hit testing and gesture code, **but no real pointer, keyboard or touchpad event was involved**.

  Seen that way, on the XWayland screenshots or (for what is a text, a frame or a colour) read from a dump of the backend's view tree while the app ran:
  - *showcase*: the counter with the pressed and hovered shade of a button, a disabled button dimmed, Even/Odd, `update('cart')`, the clock; typing into the todo field through the platform's text input path, shift + arrows selecting, Backspace, Enter adding the todo, the checkbox, the `into('modal')` dialog with its scrim over the app bar and the tabs, Delete, the toast's text on its layer, pushing `/todos/:id` and the bar's ←, Escape and alt + ← going back; the feed mounting when its tab is first shown, fetched over HTTPS and decoded, and the page scrolled by the wheel;
  - *gestures*: the card following a pan from where the 8 px slop was left, larger and with its deeper shadow while it is dragged (not rotated: see the gaps), back at its place after the release; a row swiped under the threshold coming back and over it archived; ctrl + wheel pinching to 1.21×; double click toggling 2×; a long press after 500 ms, and none after a short press or a drag; pointer down / move / up with the view's own coordinates;
  - *navigation*: push with the ← and the title in the bar, `replace`, the modal route as a sheet over the whole window with `header: false`, `back()` closing it, the tabs;
  - *layouts*: the segmented control's indicator, the chart's bars and the accordion's height at their new places after their transitions, the carousel scrolled by a horizontal wheel and by shift + wheel with its dots following `onScroll`, the chips wrapping, the floating button on its layer;
  - *native-components*: the drawn slider dragged to 87, the gauge following and turning red, and the three functions;
  - *performance* and *bench*: the `requestAnimationFrame` loop moving 200 views (at the 1 frame/s the locked screen gave), and the nine operations completing;
  - *a scratch app*: wrapped, clamped (one line, with its ellipsis), serif, monospace, italic, underlined, struck and centred text, a password field, the `focused` style, a textarea growing on Enter, a selection dragged with the pointer, `onFocus` / `onBlur`, `onKeyDown` on a box, the `hover` style, and an `img` (a PNG over HTTPS, covering its rounded box).

  **The boxes are the GTK backend's.** On the first screen of layouts and of the showcase, the edges of the cards, the buttons, the segmented control and the chart's bars are on the same pixel rows in both targets' pictures, and in the scratch app every text has the same frame in both (wrapped text included). What differs: bold text is wider (another font, see [Linux (GPUI)](#linux-gpui)), a checkbox is 20 px (GTK's is 26) and a field with no style of its own has no chrome (GTK's keeps the theme's, 1 px taller).

  Only compiled, never seen working: a touchpad pinch, the mouse's back button, an input method composing text, the clipboard (copy and paste did nothing with the screen locked), `href`, JPEG / SVG / WebP images, resizing the window, a display scale other than 1, a selection drawn across wrapped rows.

  The bench, with the driver drawing a frame every 30 ms because the compositor asked for none (the scene is built, not presented, and that 30 ms is most of the small numbers): create 1,000 rows 35 ms, replace 41 ms, create 10,000 rows 211 ms, append 1,000 48 ms, the others 26–32 ms. 396 MB resident at the peak with 10,000 rows, against 196 MB for an idle app (GPUI, its renderer and every system font's metadata).

  Gaps against the GTK backend: `rotate` is not drawn (GPUI cannot transform a quad or text; `translate` and `scale` are); opacity is applied to each thing drawn, not to the group (what overlaps inside a faded box shows through), and not at all to an image or a native view that ignores it; `overflow: "hidden"` clips to the rectangle, not the rounded corners; `letterSpacing` and `ariaLabel` do nothing (no accessibility tree is published); `numberOfLines` above 1 cuts without an ellipsis; scrolling is the wheel only, with no scroll bar; Tab does not move the focus and a textarea has no ↑ / ↓; `type: "email" | "number"` change nothing; no `NUCLO_SCREENSHOT`; on GNOME Wayland the window has no title bar (GPUI asks the compositor for one, GNOME draws none). As on GTK: a pointer has no `pointerId`, and selecting the active tab again does not reset its stack.
- **Swift**: **not compiled**. There is no Swift toolchain here, and UIKit only builds on macOS. The iOS runtime implements the same API as the Android one, written for Swift 5.9+ / iOS 15 with `@MainActor` throughout, and nothing of it has run:
  - the `Flex` layout ported from Kotlin (wrapping rows, margins, `alignSelf`, min/max sizes, `aspectRatio`, shrink-to-fit widths, absolute children in the padding box), `overflow: "scroll"` boxes as `UIScrollView`, `zIndex`;
  - paint and text styles on the layer and `UILabel` (shadows, fonts, line height, letter spacing, decoration, `numberOfLines`), transforms as `CGAffineTransform`, transitions with `UIView.animate`, the `pressed` / `hover` / `focused` state styles;
  - pointers, pan, pinch, long press and double tap on the platform's gesture recognizers, `onScroll`, focus and key events of fields;
  - the router's `replace()`, modal routes as sheets, `header: false`; `native<P>()` components and functions, `forceUpdate()`, `requestAnimationFrame()`, `href`, `ariaLabel`.

  The generated Swift of every example and of `test/fixtures/accept.ts` was read against the runtime's signatures (names, argument labels and their order, enum cases, types), by hand. Expect a first build in Xcode to surface fixes, and behaviour to need a pass on a device. Known gaps: `onKeyDown` on a box does nothing (fields report Enter, Backspace and hardware keys), and a box that clips (`overflow: "hidden"`) shows no shadow of its own.
- **macOS (a Mac, Xcode 27, macOS 27)**, checked later than the above: every example builds with `swiftc` and launches (`bun run macos <example>`). `chirp` and `styles` were compared with the web build through `NUCLO_DUMP` and the web's `?dump`, screen by screen (`chirp`: home, explore, alerts, profile, a thread, a topic, a user, friends, likes, the three forms, the media viewer); every text is within a point of the web's. `layouts`, `gauges`, `percent`, `shorthand` and `navigation` match the same way; `select` differs by its web `<select>`, by design. Seen working: theme tokens, side borders, pills, `rgba` / `hsl`, weights, `textTransform`, `raw`, the rotate/scale `transform`, the checkbox, `placeholder` / `placeholderShown`, `disabled`, `first` / `last` / `odd` / `empty`, `@media` and a screen at 420 and 700 points, a keyframes animation running, variants on a theme, `globalStyle`, and `onEndReached` loading the next page when the feed is scrolled near its end (`NUCLO_SCROLL`). Taps were checked in the web build (a like inside a tappable row stays on the feed, a thread opens, a reply is sent); on macOS no input was injected. The one gap measured: `ui-monospace` text is about 0.3 pt a character wider in AppKit than in Chrome.
- **TypeScript**: `bun run typecheck` checks the compiler and the examples, and `bun test` checks the strictness rules (below).

## Performance (Android)

Measured on a Galaxy S23 Ultra (SM-S918B, Android 17) with release builds (R8, not debuggable).

**Size and start.** The showcase APK is 120 KB and the benchmark's 70 KB, runtime included, with no JS engine or bundle. A cold start of the showcase (three tabs built, `am start -W`, 5 launches) takes 276 ms on average (216–330 ms). Once settled it uses 111 MB PSS, of which 2.3 MB is Java heap.

**Operations.** `examples/bench/App.ts` is modelled on js-framework-benchmark: a row is a box, two texts and a button, so four native views. Each operation is timed from just before it runs until after the frame that shows it (the operation, `update()`, measure, layout, draw). Results are the mean of 5 runs; the run starts by itself and logs `BENCH …` lines.

On a Samsung SM-S918B (release build with R8, 5 runs each, to the end of the frame): create 1,000 rows 250 ms, replace 293 ms, partial update 20 ms, select 13 ms, swap 16 ms, remove 17 ms, create 10,000 rows 3.6 s, append 1,000 403 ms, clear 35 ms. 259 MB PSS after the run; the release APK is 98 KB.

```bash
bun x tsx src/compiler/cli.ts build examples/bench/App.ts --out examples/bench/build
cd hosts/android && ./gradlew assembleRelease -PnucloSources=../../../examples/bench/build/android
```

| Operation | First version | Now |
| --- | --- | --- |
| create 1,000 rows | 424 ms | 255 ms |
| replace all 1,000 rows | 360 ms | 297 ms |
| partial update (every 10th of 1,000) | 25 ms | 30 ms |
| select row | 20 ms | 19 ms |
| swap rows | 107 ms | 18 ms |
| remove row | 38 ms | 24 ms |
| create 10,000 rows | 4,057 ms | 3,460 ms |
| append 1,000 to 1,000 rows | 456 ms | 362 ms |
| clear 1,000 rows | 20 ms | 40 ms |

Runs differ by 10–20% as the phone heats up, so the small changes (partial update, clear) are within noise.

Profiling with simpleperf, then fixing the runtime, produced the "Now" column:
- `list()` matches rows through a map instead of a linear search.
- A move no longer re-attaches the views after it: layout follows the node order, and the view order is only the drawing order.
- A container measured by its parent reuses that pass when it then gets the same size.
- Rows built during an update don't re-run their bindings.
- Texts skip the theme's default text style. Resolving it was 24% of the main thread when building rows.

Building views remains the cost: about 40% of the main thread goes to constructing `View`s, 20% to drawing and 16% to measuring. That is the platform's own work, but this runtime does it for every row, as nuclo's `list()` does.

**Scrolling** 1,000 rows (10 flings): 1,307 frames, 1 janky (0.08%), no missed vsync.

**Memory.** With 10,000 rows (40,000 views) on screen the app uses 542 MB PSS: 213 MB Java, 242 MB native, 78 MB graphics. Every row view is released when the rows go (`Views: 22` after a run). Three runs in one process leave native heap at 112–117 MB, so it does not grow; that is the allocator keeping freed pages, not a leak.

**What this means.** Updates are cheap: a binding that didn't change touches no view, and selecting, updating or swapping among 1,000 rows takes 18–30 ms including the frame. Creating thousands of rows at once is bounded by Android's view construction. A long list wants windowing (nuclo-native's `windowed()`), which this POC doesn't have.

## Differences from nuclo, on purpose

- **Imports, not globals.** Apps import from `@nuclo/native-ts`. The lib is ES2022 only, with no DOM and no Node, so anything the compiler can't translate fails to type-check or is reported.
- **Interfaces become `final class` (Swift) and `class` (Kotlin), not `struct` or `data class`** (an interface a class implements becomes a protocol instead). JavaScript objects are references: `todo.done = …` in a list row has to change the todo the list holds. A Swift struct would copy it, and a data class's structural `equals` would break `list()`'s identity keys and `indexOf`.
- **Arrays are Swift `[T]`, which is a value type.** Mutating an array through a second variable that aliases it won't reach the original as it does in JavaScript. Globals and properties, which is how nuclo state is written, behave the same.
- **Styles** are CSS laid out as flexbox (column by default), in pt / dp: the `Style` interface in `src/index.ts`, which is nuclo-core's style object as far as the platforms can follow it (see above). There are no arbitrary selectors, and `@media` knows the window's width only.
- **Swift dictionaries are unordered**, so on iOS `variants()` applies groups in name order (Kotlin keeps declaration order). It only matters when two groups set the same property.
- **`when(cond, …)` with a non-function condition** is fixed when built, as in nuclo.

## Strict TypeScript

If an app type-checks and compiles, it builds on both targets and behaves the same on each. Two layers enforce that, and `bun test` covers both (`test/strict.test.ts`, one fixture per rule).

**TypeScript options** (`tsconfig.app.json`, used by both the editor and the compiler):

| Option | Why it is needed natively |
| --- | --- |
| `lib: ["ES2022"]`, `types: []` | No DOM, no Node: only what `@nuclo/native-ts` declares exists |
| `strict` | No implicit `any`; `null` and `undefined` are tracked, and become optionals |
| `noUncheckedIndexedAccess` | `xs[i]` and `map[key]` are `T \| undefined`, compiled to `jsAt(i)` / `getOrNull(i)` and optional map reads. A narrowed or `!`-asserted read is a plain subscript |
| `noImplicitReturns` | Swift and Kotlin require a value on every path |
| `noFallthroughCasesInSwitch` | Native `switch` / `when` don't fall through |
| `allowUnreachableCode: false`, `allowUnusedLabels: false` | No dead code to translate |

**Compiler rules**, for valid TypeScript that would build differently or not at all:

| Rejected | Why |
| --- | --- |
| `any`, `eval`, `namespace` blocks, `delete` of a property, generators | No ahead-of-time equivalent |
| A class declared or written inside a function that has static members, or uses a local the function reassigns, or an array or map that anything mutates; a generic one; `++` / `--` on a static getter / setter inside an expression, a setter without its getter, overriding one half of a getter/setter pair, `#x in obj`, decorators, async methods, a method read without a call, `instanceof` of anything but the app's (non-generic) classes; spread or `this` in an object literal of an interface a class implements | Not translated yet |
| A class passed as an interface it doesn't declare (`implements`); an array of a class used as an array of its base or interface; `super(…)` anywhere but first in the constructor | Native classes conform nominally, and arrays are not covariant in Kotlin and Rust; Kotlin and Swift run the base's constructor first |
| Unions other than `T \| null` / `undefined` or string literals; tuples mixing types; overloads | A native value has one type |
| Generic functions anywhere but the top level of a module, generic methods, static members of a generic class, a generic function passed as a value (wrap it: `x => f(x)`) | Generics are compiled per instantiation: a nested one would capture, a method's would need dispatch per type, a static would be one per instantiation |
| A value of one interface used as another, same-shaped one | TypeScript is structural; native classes are nominal |
| Mutating an array parameter or a temporary, or sharing one array between two bindings (destructuring included) when either is mutated | Swift arrays are values: the change would not reach the other side. Copy with `.slice()` |
| Names the generated code uses (`A`, `Style`, `jsNum`, the runtimes' types…) | They would shadow it. Math (`min`, `floor`…) is printed fully qualified, so those names stay free |
| Text from `T \| undefined` without `??`; indexing or iterating strings | No `"undefined"` text, and characters differ between platforms |
| An enum mixing strings and numbers; a rest element in object destructuring; a destructuring default for a property that can be `null` | The rest has no class; JavaScript keeps the `null`, a native default would replace it |
| A closure capturing the variable of a `for` loop that isn't a range (`i += 2`, a bound the body changes) | JavaScript gives each turn its own `let`; the `while` it becomes has one. Copy it to a `const` |
| `finally` without `catch`, or with a `return` / `break` / `continue` out of the blocks, or a `throw` / `await` in the catch block | The finally block would be skipped natively |
| `reduce` without an initial value, `localeCompare`, regular expressions, `?.()` / `++` on a computed target, spreading into a non-rest parameter | It would crash, differ per platform's locale data, or evaluate the target twice |
| `async` callbacks, labelled `break` / `continue`, assignments inside expressions, `Object.keys` (Swift and Rust maps are unordered) | Not translated yet |

Translated by lowering them to what the printers already handle, so every target runs the same code (`examples/language` prints one line per feature; every target prints exactly what TypeScript prints):
- Enums (string or number): members are inlined as literals, the type is `string` / `number`.
- `import * as ns`: `ns.name` is `name` (modules share one native namespace).
- Destructuring in declarations, parameters and `for-of`, with defaults, nesting, holes and array rests (`const [a, , ...rest] = xs`).
- `{ ...base, x: 1 }` into an interface (later members win), `[...a, x, ...b]`, `a.concat(b)`, rest parameters and spread arguments.
- `f?.(x)` and `o?.f(x)`; `x++` / `--o.n` / `xs[i++]` as values; `??=`, `||=`, `&&=`; `**`, `**=`; the bitwise operators on ToInt32 (`>>>` is unsigned).
- Every `for` form and `do … while` (a `while` whose `continue` runs the step first). A `for (let i = a; i < b; i++)` whose body can't change `i` or `b` stays a native range.
- `finally` (see above), `key in map`, `delete map[key]`, `<` / `>` on strings (UTF-16 order).
- Arrays: `sort` (stable, one merge sort on every target; without a comparator it compares text, as JavaScript does), `reverse`, `shift`, `at`, `lastIndexOf`, `reduce`, `concat`, `join` of numbers and booleans, and callbacks that take the index.
- Strings, by UTF-16 units as in JavaScript: `length`, `split`, `replace` / `replaceAll` (with `$&` `$$` `` $` `` `$'`), `indexOf`, `lastIndexOf`, `padStart`, `padEnd`, `repeat`, `trimStart`, `trimEnd`; `toString()`.
- Math: `sign`, `log`, `log2`, `log10`, `log1p`, `exp`, `expm1`, the trigonometric and hyperbolic functions, `atan2`, `hypot`, `cbrt`, the constants; `Number.isInteger` / `isNaN` / `isFinite`, `Infinity`, `NaN`, `Number.MAX_SAFE_INTEGER`…
- Numbers print as JavaScript prints them on every target (`1e+21`, `1e-7`, `9007199254740992`). A whole literal beyond 32 bits is a Double (Kotlin's `Int` is 32 bits).
- Generics: top-level generic functions (declared or `const` arrows), generic interfaces and type aliases (recursive ones too), generic classes, and generic interfaces a class implements. Each is compiled once per instantiation the program uses (`Box<number>` is the class `Box__Double`, `first<string>` the function `first__String`), so every native value keeps one concrete type and behaves as the TypeScript does; a class extending `Base<number>` extends `Base__Double`. A `T` that is a number is a Double, as array elements are.
- Classes, declared or as class expressions (`const X = class …` is the class `X`). A class declared inside a function, or written in a function or an expression (`new (class implements Shape {…})()`), is one class declared at the top level: it keeps its name (`Row__2` when another class has it; `Class` for an anonymous one), and the function's locals it uses (variables, parameters, local functions) are hidden first constructor parameters kept in `cap__x` fields, which every `new` passes (a class that makes or extends another nested class passes that one's on). The value is copied when the object is made, so such a local must not be reassigned; objects stay shared. fields (with initializers, `readonly`, parameter properties, `#private` ones — `#x` of class `C` is `x__C`, so a subclass's own `#x` is another field), a constructor, methods, `this` (captured by arrow functions too), getters and setters (one Swift / Kotlin property with `get` and `set`; Rust functions `m__C__x` and `m__C__set_x`, and `get_x` / `set_x` on a trait), `static` fields, methods, getters and setters (globals and functions named `Class__member`; a static setter is `Class__set_member`, and `C.x += 1` calls it with the getter's value plus one), `abstract`, `override`, `super(…)`, `super.m()` and `super.x` (a base getter, or its setter with `super.x = …` / `+=`; a field can't be reached through `super`, as in JavaScript), `x instanceof C` (Swift `is`, Kotlin `is`, Rust a `cast__C` that tries each struct of `C` and its subclasses through `Rc<dyn Any>`; `null` is no instance) with the narrowing it gives (`s.radius` after `s instanceof Circle` is a checked downcast), and `e instanceof Error` in a `catch` (always true natively). An interface a class `implements` becomes a Swift protocol, a Kotlin interface and a Rust trait, and a class with subclasses a Swift / Kotlin open class and a Rust trait, so a value goes where its base or an interface it implements is expected and calls dispatch as in JavaScript. A field starts at a zero value and the constructor sets it in JavaScript's order (base constructor, field initializers, parameter properties, body). A method's optional and default parameters are applied by the method itself (callers pass nil), so an override or an implementation keeps its own defaults; they must be optional everywhere the method is declared. A member, what it overrides and what it implements share one number kind.
- Object literals of an interface a class implements: each protocol gets a generated class (`Shape__Literal`) holding its fields and, for each method, the function the literal gives (an arrow function or a method without `this`), which the method calls. Such a function applies its own optional and default parameters, as a method does.

Supported because they could otherwise break the build:
- `interface B extends A`: inherited fields are part of the class.
- A `switch` covering every member of a literal union, with no `default`.
- Optional chains: `a?.b.c` becomes `a?.b?.c` in Kotlin.
- Default and optional parameters.
- Local functions: hoisted, and able to call themselves.
- Function references whose numbers differ in kind from the callback they're passed as (an `Int`/`Double` adapter is generated).
- Callbacks narrowed from `null`.

`bun run check:android` compiles `test/fixtures/accept.ts` and every example to Kotlin with Gradle.

## Checking without building

`nuclo-native-ts check <entry.ts>… [--json]` runs the front-end alone: it prints what would stop a build, writes nothing, and exits 1 on an error (for CI and pre-commit).

The editor shows the same errors through a TypeScript language service plugin (`plugin/`, enabled by `plugins` in `tsconfig.app.json`). It runs `check` in the background on each entry (a file no other file imports) and underlines what it reports, so the errors refresh when a file is saved. tsserver loads plugins from the `node_modules` of the TypeScript it runs, so the editor must use the workspace's TypeScript (VS Code: "TypeScript: Select TypeScript Version" → "Use Workspace Version"), and the workspace root links the plugin (`@nuclo/native-ts-plugin` in its `devDependencies`). If bun is not on the editor's `PATH`: `"plugins": [{ "name": "@nuclo/native-ts-plugin", "bun": "/path/to/bun" }]`.

## Not supported (reported by the compiler)

Everything in the table above. Also unsupported: DOM/Node APIs, SVG, SSR (`hydrate()` renders), `windowed()`, video, tags with no view behind them (`canvas`, `video`, `iframe`, `embed`, `object`, document tags), arbitrary DOM attributes and events, and `nuclo-router`'s URL, loader and layer features (the router here is nuclo-native's stack router).
