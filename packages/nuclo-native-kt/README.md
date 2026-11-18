# @nuclo/native-kt (POC)

Write a nuclo app in **Kotlin**. Kotlin Multiplatform compiles the same code for the web (JavaScript driving `nuclo-core`) and for Android, iOS, macOS, Linux (GTK 4) and Windows (Win32). The model is nuclo's: plain mutable state, builders, an explicit `update()`.

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

| Target | Kotlin compiler | UI | State |
| --- | --- | --- | --- |
| `web` | Kotlin/JS | `nuclo-core` on the DOM | built, run in headless Chrome |
| `android` | Kotlin/JVM | Android Views | built, run on the `Medium_Phone` emulator |
| `ios` | Kotlin/Native `iosSimulatorArm64` (`iosArm64` compiles) | UIKit | built, run on the iPhone 18 Pro Max simulator |
| `macos` | Kotlin/Native `macosArm64` | AppKit | built and run |
| `linux` | Kotlin/Native `linuxX64` (GTK 4 + libadwaita through cinterop) | GTK 4 | **run only through `:gtk-preview`** (the same sources on macOS against Homebrew GTK 4.24); the real `linuxX64` target was never built (it needs a Linux x86-64 host) |
| `windows` | Kotlin/Native `mingwX64` | Win32 + GDI+ | **cross-compiled and linked, never launched** |
| `headless` | the host's native executable with `NUCLO_HEADLESS=1` | none (a recording backend) | built and run |

All of it is in `nuclo/` (the library: `commonMain` API, `uiMain` core, one backend per target), `app/` (compiles one example for every target), `android/`, `gtk-preview/`, `examples/` (11 apps), `scripts/` and `specs/` (the specs this was built from, with the task log).

## Build, run, test

```bash
./gradlew -q :nuclo:macosArm64Test                 # unit tests of the core, on a recording backend
scripts/test.sh <web|android|ios|macos|linux|windows|headless> <example|all>
scripts/run.sh  <target> <example>                  # builds and opens it, for a person to look at
```

`scripts/test.sh` builds the target, runs the example with its `test.script` in **test mode** (fixed text metrics, no animations, no network), prints a dump of every view's frame and text, runs the headless executable at the same window size and compares the two dumps (`scripts/compare.ts`; frames within 1 px, or `--structure` for the web and for examples with native components). Windows is only linked (`windows: linked, not run`).

## What differs from nuclo (on purpose)

| nuclo (TypeScript) | nuclo-native-kt (Kotlin) |
| --- | --- |
| Global builders | `import nuclo.*` |
| `{ style: {...}, onClick: fn }` | `style(Style(...))`, `onClick { }` |
| `() => text` | `{ text }` in parentheses: `p({ "Count: $count" })` |
| `when(c, …).else(…)` | `when_(c, …).else_(…)` |
| `render(App, document.body)` | `runApp { render(::App) }` |
| `flexDirection: "row"` | `flexDirection = FlexDirection.Row` (or `row = true`) |
| A text tag may contain elements | `p`, `span`, `h1`… take text only |
| `createCss` themes, CSS strings | a token is a `const val`; `Style` has typed keys |

## What was checked

Everything below was run in the session that wrote this file; nothing here is from memory of an earlier run.

| Check | Result |
| --- | --- |
| `./gradlew -q :nuclo:macosArm64Test` | passed: 39 tests (common 5, M1 11, M2 9, M3 7, M4 2, M5 2, M6 2, M7 1) |
| `scripts/test.sh headless all` | PASS: counter, todo, styles, layouts, layout-matrix, navigation, fetch, gestures, native-components, gauges, select |
| `scripts/test.sh web all` | PASS, same 11 examples (structure and texts compared with headless; the browser's own fonts decide the pixels) |
| `scripts/test.sh macos all` | PASS, 11 examples, frames within 1 px of headless |
| `scripts/test.sh ios all` | PASS on the iPhone 18 Pro Max simulator, 11 examples |
| `scripts/test.sh android all` | PASS on the `Medium_Phone` emulator, 11 examples |
| `scripts/test.sh linux all` | PASS through `:gtk-preview` (macOS host, Homebrew GTK 4.24), 11 examples. **Not** the `linuxX64` target |
| `scripts/test.sh windows all` | the 11 examples **link** (0 compiler warnings in the link of each tried). **Never launched** |
| `fetch` against the network (`NUCLO_SCRIPT="wait:8000;exit"`, no test mode) | `FETCH 200 5` on web (Chrome), macOS, iOS simulator, Android emulator, GTK (preview). Not on Windows |

What a PASS proves: the same views, texts and **frames** as the headless core computed with the fixed test metrics. It does not prove looks, real text metrics, or input.

| Target | Passed | Only compiled | Never run / never looked at |
| --- | --- | --- | --- |
| web | dumps of all examples; fetch; screenshot of `styles` looked at | — | gestures, scroll and key handlers with a real pointer |
| android | dumps of all examples; fetch; screenshot of `styles` looked at (cards, shadows, rotated square, states render) | — | gestures with real touches; system back; release build |
| ios | dumps of all examples; fetch | `iosArm64` (device) | **not looked at** (no screenshot taken); gestures with real touches; hardware keys (not implemented) |
| macos | dumps of all examples; fetch; screenshots of `counter` and `styles` looked at | — | gestures with a real mouse. Seen defects: the rotated square of `styles` is drawn unrotated, and the checkbox is not visible |
| linux | dumps of all examples through `:gtk-preview`; fetch | — | `linuxX64` (needs Linux); **not looked at**; gestures with a real pointer; `setLabel` is a no-op (the call is variadic) |
| windows | — | all 11 examples link | **everything at run time**: painting, input, WinHTTP, native controls, scrolling |

## Known gaps and deviations

- **Navigation chrome is drawn by the core** (`core/Chrome.kt`: a 56 px bar, the screen in a scrolling box, a 64 px tab bar, a modal sheet) on every backend whose `navCreate` is not implemented, which is all native ones. `05-backends.md` asked for `UINavigationController` on iOS and libadwaita's `AdwNavigationView` on Linux; those are **not** used. The `Backend.nav*` calls exist and are implemented by the headless backend (it shows a screen without chrome, so dumps agree).
- Test mode has no network on any target: every request is answered with `no network in headless`. The real network path was checked separately (table above).
- `requestFrame` is the default 16 ms timer on macOS, iOS, GTK and Windows (Android uses Choreographer). Transitions and keyframes ran in the headless unit test and are applied by every backend's `paint`, but were not watched.
- iOS: no hardware keys. Windows: no long press, no pinch, no drop shadows, no differing per-side borders, images are not decoded, a field commits on blur rather than on Enter. GTK: `setLabel` does nothing. macOS: see the defects above.
- Out of scope, as specified: code generation, SSR, SVG, `canvas`, `video`, CSS strings, `createCss` themes, long-list windowing, a GPUI or wasm target, publishing. Examples drop what needed them (`visibility: hidden`, dashed borders, `optgroup` labels).
- Public API beyond `specs/02-api.md`: `runHeadless` and `HeadlessBackend` (test and `NUCLO_HEADLESS=1`), `nativeDescriptor` (public only because the GTK sources are also compiled by `:gtk-preview`), `nuclo.gtk.nativeNode`, `NucloActivity.current`, `onNativeScroll` (Windows), and `Style` has `equals`/`hashCode`.
- GTK: the process leaves with `_exit` because GTK's teardown crashes when it is run from inside the main loop.
- The GTK, Win32 and Android code is a port of reference behaviour written without being able to try every call on a device; treat the paths listed as "never run" as unverified.

## Tasks that did not finish

None are marked `[!]` in `specs/TASKS.md`; every task is `[x]`. A task being `[x]` means its `Check:` commands passed, which for the Windows tasks means "links".
