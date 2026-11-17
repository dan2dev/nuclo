# 01 — Architecture

## Goal

`nuclo-native-kt` is the third native POC of nuclo, next to `nuclo-native` (a JS engine driving native widgets)
and `nuclo-native-ts` (TypeScript compiled ahead of time to Swift / Kotlin / Rust). Here the app is **written in
Kotlin**, and Kotlin Multiplatform compiles it for every target. There is no JavaScript engine in a native app and
no code generator: the Kotlin compiler is the compiler.

```kotlin
package app

import nuclo.*

var count = 0

fun App() = div(
    style(Style(padding = 24, gap = 16)),
    p({ "Count: $count" }),
    button("Increment", onClick { count++; update() }),
)

fun main() = runApp { render(::App) }
```

The model is nuclo's, unchanged: plain mutable state, builders that take a value or a `() -> value`, and an
explicit `update()` that re-runs the functions and touches only what changed.

## Targets

| Target | Kotlin compiler | UI | Output |
| --- | --- | --- | --- |
| `web` | Kotlin/JS (IR) | **`nuclo-core`** on the DOM | `app.js` + `index.html` |
| `android` | Kotlin/JVM (ART) | Android Views | APK |
| `ios` | Kotlin/Native (`iosArm64`, `iosSimulatorArm64`) | UIKit | `.app` |
| `macos` | Kotlin/Native (`macosArm64`) | AppKit | `.app` |
| `linux` | Kotlin/Native (`linuxX64`) | GTK 4 + libadwaita (cinterop) | executable |
| `windows` | Kotlin/Native (`mingwX64`) | Win32 (`platform.windows`, GDI+) | `.exe` |
| `headless` | the host's native executable | none: the core with a recording backend | dumps for the tests |

These are the same UI platforms the other two POCs use (UIKit, Android Views, AppKit, GTK 4 / libadwaita). Two
decisions differ, on purpose:

- **Android is Kotlin/JVM, not Kotlin/Native.** Android Views are a JVM API; Kotlin/Native's `androidNative*`
  targets can only reach them through hand-written JNI. Kotlin compiled for ART *is* the platform's native Kotlin.
- **Windows is Win32, not WPF.** `nuclo-native` uses WPF, which is .NET and unreachable from Kotlin/Native. The
  toolkit Kotlin/Native can call directly on Windows is Win32 (`platform.windows`, `platform.gdiplus`,
  `platform.winhttp`, all shipped with the compiler).

## How it fits together

```
                    examples/<name>/App.kt   (package app, common Kotlin)
                                │  calls
                                ▼
        commonMain  ── public API (specs/02-api.md): builders return descriptors (Node, Mod, Style)
                                │  internal expect functions (Engine.kt)
              ┌─────────────────┴─────────────────────┐
              ▼                                       ▼
   jsMain: the web engine                  uiMain: the core (specs/03-core.md)
   descriptors → nuclo-core calls          live tree, bindings, list/when/region, styles,
   Style → CSS, router on the hash         Flex layout, router stacks, transitions, async
              │                                       │  interface Backend / object Host
              ▼                         ┌────────┬────┴────┬─────────┬──────────┬──────────┐
          nuclo-core                 android    ios      macos     gtk       windows    headless
            (DOM)                    Views     UIKit    AppKit   GTK 4      Win32     (records)
```

Three ideas carry the design:

1. **Builders return descriptors, not views.** `div(...)` allocates a small immutable `Node(tag, children)`.
   Nothing is created until an engine *mounts* it. That is what lets the API keep nuclo's eager call syntax
   (`when_(cond, a, b)`) while a closed branch costs nothing, and what lets two very different engines consume the
   same app.
2. **The web engine is a translator.** It turns descriptors into calls to nuclo-core (`div(...)`, `list()`,
   `when()`, `css()`, `update()`), so the generated JavaScript is an ordinary nuclo-core app and the browser lays
   it out with CSS flexbox.
3. **The native engine is one core and a thin backend per toolkit.** The core owns everything that must behave
   the same everywhere — the node tree, dirty checking, reconciliation, style resolution, the flex layout — and
   computes every rectangle. A backend creates widgets, places them at the frames it is given, paints them,
   measures text and reports input. It is the split `nuclo-native-ts` already has between its Rust core and its
   GTK / GPUI / wasm backends (`runtimes/rust/src/nuclo/backend.rs`); here it is in Kotlin and serves five
   toolkits.

## Folder layout

```
packages/nuclo-native-kt/
  AGENTS.md  README.md  package.json  .gitignore
  settings.gradle.kts  build.gradle.kts  gradle.properties  gradlew  gradle/
  specs/
  nuclo/                               the library (Gradle module :nuclo)
    build.gradle.kts
    src/commonMain/kotlin/nuclo/       public API + internal expect declarations
    src/commonTest/kotlin/nuclo/       tests of the common code (style merge, JSON, number text)
    src/uiMain/kotlin/nuclo/           the core; nuclo/host/ holds Backend, Host, HeadlessBackend
    src/uiTest/kotlin/nuclo/           core tests on HeadlessBackend
    src/jsMain/kotlin/nuclo/           the web engine
    src/androidMain/kotlin/nuclo/      AndroidBackend, NucloActivity
    src/appleMain/kotlin/nuclo/        what iOS and macOS share (CALayer paint, NSURLSession, colours)
    src/iosMain/kotlin/nuclo/          UIKitBackend
    src/macosMain/kotlin/nuclo/        AppKitBackend
    src/mingwMain/kotlin/nuclo/        Win32Backend
    src/gtk/kotlin/nuclo/gtk/          GtkBackend — compiled into linuxMain on Linux, and by :gtk-preview on macOS
    src/nativeInterop/cinterop/gtk.def
    src/linuxMain/kotlin/nuclo/        only `actual fun platformRunApp` (calls into nuclo.gtk)
  app/                                 the example runner (Gradle module :app): one example at a time
    build.gradle.kts                   -Pexample=<name> picks examples/<name>/
    src/jsMain/resources/index.html
  android/                             the Android application (Gradle module :android)
    build.gradle.kts
    src/main/AndroidManifest.xml  src/main/res/values/themes.xml
    src/main/kotlin/dev/nuclo/app/MainActivity.kt
  gtk-preview/                         macOS only: runs an example on the GTK backend with Homebrew GTK
    build.gradle.kts  src/macosArm64Main/kotlin/Main.kt
  examples/<name>/
    App.kt (+ other .kt files)         package app
    native/<web|android|ios|macos|linux|windows>/*.kt   `actual` declarations for that target (optional)
    test.script                        one line: what scripts/test.sh drives (specs/03-core.md)
  scripts/
    run.sh  test.sh  compare.ts  lib.sh
```

An example is a folder, as in `nuclo-native-ts`. It has no Gradle file: `:app` compiles
`examples/$example/` as its `commonMain` and each `native/<target>/` folder into that target's source set.

## Source sets of `:nuclo`

| Source set | Compiled for | Holds |
| --- | --- | --- |
| `commonMain` | everything | The public API. Pure Kotlin, no platform call |
| `uiMain` | android + every Kotlin/Native target | The core and the host contract. Pure Kotlin stdlib |
| `jsMain` | web | The web engine, `external` declarations for `nuclo` |
| `androidMain` | android | `AndroidBackend` |
| `appleMain` | ios + macos | Shared Apple code. Only frameworks both have: Foundation, CoreGraphics, QuartzCore, CoreText |
| `iosMain` / `macosMain` | ios / macos | `UIKitBackend` / `AppKitBackend` |
| `mingwMain` | windows | `Win32Backend` |
| `linuxMain` + `src/gtk` | linux | `GtkBackend` |

`uiMain` is not one of Kotlin's default source sets. It is declared by the hierarchy block in
`nuclo/build.gradle.kts` (`specs/06-build-and-verify.md`). `appleMain`, `iosMain`, `nativeMain` come from the
default hierarchy template.

## What is in scope

Implemented in milestones (`specs/TASKS.md`), each one finished on every target before the next starts being
required:

| Milestone | Feature set | Example that proves it |
| --- | --- | --- |
| M0 | The Gradle project builds a hello on every target | `counter` (prints) |
| M1 | Tags, text, `style`, `onClick`, `update()`, `render()`, flex layout, paint | `counter` |
| M2 | `list`, `when_`, `region` / `into`, `scope`, lifecycle, inputs, checkboxes, overlays | `todo` |
| M3 | `css` / `cx` / `variants`, state and structural styles, `@media`, `globalStyle`, scroll, absolute, `zIndex`, shadows, transforms | `styles`, `layouts` |
| M4 | `createRouter`: stacks, tabs, modal, back | `navigation` |
| M5 | `launch`, `fetch`, `delay`, timers, `requestAnimationFrame`, JSON, images (`img`, `src`) | `fetch` |
| M6 | Pointer, pan, pinch, long press, double click, scroll and key events; transitions; keyframes | `gestures` |
| M7 | Native functions (`expect` / `actual`) and native components (`nativeNode`) | `native-components` |
| M8 | `select`, `progress`, `meter` (compositions in common code), `onEndReached` | `gauges`, `select` |

## What is out of scope

Do not build these. If an example needs one, leave that part of the example out and say so in the README.

- A code generator, a compiler plugin, annotation processing.
- SSR and hydration (`hydrate()` renders), SVG, `canvas`, `video`, `iframe`.
- CSS written as strings (`border = "1px solid #e5e7eb"`, `transform = "rotate(45deg)"`): the `Style` class has
  typed keys instead (`borderWidth`, `borderColor`, `rotate`).
- `createCss()` themes: in Kotlin a token is a `const val`.
- `windowed()` / `flatList()` (long-list windowing), `nuclo-router`'s URL / loader features.
- A GPUI or wasm target.
- Publishing: no Maven coordinates, no npm package, no Xcode project, no signing beyond the debug key.
- Running the Windows executable. It is cross-compiled and linked; nobody has a Windows machine here.

## Differences from nuclo, on purpose

| nuclo (TypeScript) | nuclo-native-kt (Kotlin) | Why |
| --- | --- | --- |
| Global builders | `import nuclo.*` | Kotlin has no implicit globals |
| `{ style: {...}, onClick: fn }` | `style(Style(...))`, `onClick { }` | Kotlin has no object literals; one function per attribute keeps every value typed |
| `() => text` | `{ text }` passed in parentheses: `p({ "Count: $count" })` | A Kotlin lambda among `vararg` arguments |
| `when(c, …).else(…)` | `when_(c, …).else_(…)` | `when` and `else` are Kotlin keywords |
| `render(App, document.body)` | `runApp { render(::App) }` | A native app needs its event loop started |
| `flexDirection: "row"` | `flexDirection = FlexDirection.Row` (or `row = true`) | Typed, so a typo is a compile error |
| A text tag may contain elements | `p`, `span`, `h1`… take text only | A native label has no child views |
| `list()` keys by `===` | By identity for objects, by value for `String` / numbers / `Boolean` | Same rule as JavaScript's `===` |
