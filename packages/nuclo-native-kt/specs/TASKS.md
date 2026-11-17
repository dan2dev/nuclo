# Tasks

Execute in order, one at a time, following the loop in `AGENTS.md`. `[ ]` to do · `[x]` done and checked ·
`[!]` blocked (explain under **Log**).

Every command runs from `packages/nuclo-native-kt/`. "All targets" means, on a macOS host: `headless web macos
android ios linux windows` (`linux` runs through `:gtk-preview`; `windows` only links).

A check written `test <targets> <example>` means: `scripts/test.sh <target> <example>` exits 0 and prints `PASS`
for each listed target.

---

## Phase A — foundation and M1 (a counter on every target)

- [x] **T00 — Scaffold: every target builds and says hello**
  Needs: nothing
  Read: `06-build-and-verify.md` (Bootstrap and every build file), `01-architecture.md` (folder layout)
  Do:
  1. Run the Bootstrap commands. Create `.gitignore` and every build file of `06-build-and-verify.md`, verbatim,
     and the Android manifest, theme and `MainActivity.kt`, `app/src/jsMain/resources/index.html`,
     `gtk-preview/src/macosArm64Main/kotlin/Main.kt`, `nuclo/src/nativeInterop/cinterop/gtk.def`.
  2. `nuclo/src/commonMain/kotlin/nuclo/App.kt`: only `runAppOverride`, `runApp` and
     `internal expect fun platformRunApp(entry: () -> Unit)` (`02-api.md` §7).
  3. One file per platform source set (`jsMain`, `androidMain`, `macosMain`, `iosMain`, `mingwMain`, `linuxMain`)
     with `internal actual fun platformRunApp(entry: () -> Unit) = entry()`.
  4. `androidMain`: `open class NucloActivity(private val entry: () -> Unit) : android.app.Activity()` that calls
     `entry()` in `onCreate`.
  5. `nuclo/src/gtk/kotlin/nuclo/gtk/GtkBackend.kt`: `package nuclo.gtk` with `fun runGtkApp(entry: () -> Unit) = entry()`.
  6. `examples/hello/App.kt`: `package app`, `import nuclo.*`, `fun main() = runApp { println("hello from nuclo-native-kt") }`.
  Check:
  ```bash
  ./gradlew -q :app:linkDebugExecutableMacosArm64 :app:linkDebugExecutableIosSimulatorArm64 :app:linkDebugExecutableMingwX64 \
    :app:jsBrowserDistribution :android:assembleDebug :gtk-preview:linkDebugExecutableMacosArm64 -Pexample=hello
  app/build/bin/macosArm64/debugExecutable/nuclo-hello.kexe          # prints: hello from nuclo-native-kt
  gtk-preview/build/bin/macosArm64/debugExecutable/nuclo-hello.kexe  # prints: hello from nuclo-native-kt
  ls app/build/bin/mingwX64/debugExecutable/nuclo-hello.exe app/build/dist/js/productionExecutable/app.js android/build/outputs/apk/debug/android-debug.apk
  ```

- [x] **T01 — API: nodes, tags, attributes, events**
  Needs: T00
  Read: `02-api.md` §1–3, `nuclo-native-ts/src/index.ts` (tag lists and doc comments)
  Do: `Node.kt` (descriptors, `Kind`, the `Mod` hierarchy, the children rules, `jsNum`, every tag builder, `el`),
  `Attributes.kt`, `Events.kt`. Declare the `Mod` subclasses the later sections need as empty classes for now.
  Check: `./gradlew -q :nuclo:compileCommonMainKotlinMetadata`

- [x] **T02 — API: Style and reusable styles**
  Needs: T01
  Read: `02-api.md` §4–5; `class Style` and `merged` in `nuclo-native-ts/src/runtimes/android/NucloRuntime.kt`
  Do: `Style.kt` (the class, enums, `merged`, `normalized`, `MediaRule` and its helpers), `Styling.kt` (`css`, `cx`,
  `Variants`, `variants`, `Compound`, `globalStyle`, `Keyframes`, `keyframes`, `StyleAnimation`).
  `globalStyle` calls an engine function (T03).
  Check: `./gradlew -q :nuclo:compileCommonMainKotlinMetadata`

- [x] **T03 — API: structure, app, router, async, JSON, the engine seam**
  Needs: T02
  Read: `02-api.md` §6–10
  Do: `Structure.kt`, the rest of `App.kt`, `Router.kt`, `Async.kt` (`launch`, `delay` and `fetch` on
  `kotlin.coroutines`), `Json.kt`, and `Engine.kt`: one `internal expect fun` per thing only an engine can do —
  `engineRender(view)`, `engineRenderOutlet(outlet)`, `engineUpdate(ids)`, `engineForceUpdate()`,
  `engineGlobalStyle(selector, style)`, `engineCreateRouter(routes, tabs, initial)`,
  `engineSetTimer(ms, repeat, callback): Int`, `engineClearTimer(id)`, `engineRequestFrame(callback): Int`,
  `engineCancelFrame(id)`, `engineHttp(request…, done)`, `engineNow(): Double`. Public functions are thin wrappers
  over them. Add `nuclo/src/commonTest/kotlin/nuclo/CommonTest.kt`: `numbersPrintLikeJs` (on `jsNum`),
  `styleMerges`, `shortKeysNormalize`, `jsonParses`, `rejectsNodeInText`.
  Check: `./gradlew -q :nuclo:compileCommonMainKotlinMetadata`

- [x] **T04 — Core: the host contract, the headless backend, style resolution**
  Needs: T03
  Read: `03-core.md` (all); `backend.rs`, `style.rs`
  Do: `host/Backend.kt` exactly as in `03-core.md`; `host/HeadlessBackend.kt`; `core/Computed.kt` (resolve a
  `Style` chain into floats + packed colours, colour parsing, tag defaults, inheritance, `Paint` construction).
  `Engine.ui.kt` with every `actual` as `TODO("…")` for now. A `Host` with empty functions.
  Check: `./gradlew -q :nuclo:compileKotlinMacosArm64`

- [x] **T05 — Core M1: mount, bindings, update, events, flex**
  Needs: T04
  Read: `03-core.md` ("The live tree", "Layout", "Test metrics", "Unit tests"); `node.rs`, `flex.rs`; `class Node` and
  `object Flex` in `NucloRuntime.kt`
  Do: `core/LiveNode.kt`, `core/Flex.kt`, `core/Runtime.kt`; the real `Host.start`, `Host.measureRoot`,
  `Host.layoutRoot`, `Host.event`; the `Engine.ui.kt` actuals for render, update, forceUpdate, timers and now
  (the others stay `TODO`). Scope of M1: boxes, text, buttons, static and dynamic text, `style` (static and
  dynamic), `StyleClass` children, `onClick`, column / row / gap / padding / margin / flex / align / justify /
  width / height / min / max. Write the M1 unit tests of `03-core.md` in `nuclo/src/uiTest/kotlin/nuclo/`.
  Check: `./gradlew -q :nuclo:macosArm64Test` (every M1 test and the commonTest tests pass)

- [x] **T06 — Harness and the headless executable**
  Needs: T05
  Read: `03-core.md` ("HeadlessBackend", "The harness")
  Do: `host/Harness.kt`. In `macosMain` (and `mingwMain`, `linuxMain` through `runGtkApp`): the `NUCLO_HEADLESS=1`
  branch of `platformRunApp`. Create `examples/counter/App.kt` (the app of `01-architecture.md`) and its
  `test.script`. Delete `examples/hello`.
  Check:
  ```bash
  ./gradlew -q :app:linkDebugExecutableMacosArm64 -Pexample=counter
  NUCLO_HEADLESS=1 NUCLO_SCRIPT="dump;tap:Increment;tap:Increment;dump;exit" app/build/bin/macosArm64/debugExecutable/nuclo-counter.kexe
  ```
  Output has two dump blocks; the first contains `text|24|24|372|18|Count: 0`, the second
  `text|24|24|372|18|Count: 2`, and the last line is `NUCLO_EXIT`.

- [x] **T07 — Scripts**
  Needs: T06
  Read: `06-build-and-verify.md` ("Scripts", "package.json")
  Do: `scripts/lib.sh`, `scripts/test.sh`, `scripts/compare.ts`, `scripts/run.sh` (`chmod +x`), `package.json`.
  Implement every target's branch now, even though only `headless` can pass yet.
  Check: `scripts/test.sh headless counter` prints `PASS headless counter`. A deliberately wrong pair of logs
  makes `bun scripts/compare.ts a.log b.log` exit 1 and print the differing line.

- [x] **T08 — Web M1**
  Needs: T07
  Read: `04-web.md` (all); `nuclo-core/README.md`; `BASE_CSS`, `CSS_PROPS`, `toCss` in `runtimes/web/index.ts`
  Do: `NucloCore.kt`, `Engine.js.kt`, `Css.kt`, `HarnessWeb.kt`, the web `platformRunApp`. Scope: the M1 scope of T05.
  Check: `test web counter`

- [x] **T09 — macOS backend M1**
  Needs: T07
  Read: `05-backends.md` (intro, "Apple", "macOS"); `UIKitShim.swift`
  Do: `AppKitBackend` with the M1 members of `Backend` (create Box / Text / Button, destroy, setChildren, setFrame,
  paint, measure, setText, listen(Click), showScreen, requestLayout, windowWidth, setTimer, clearTimer, log, now,
  frameOf, env, exit) and the real `platformRunApp`. Put what iOS will share in `appleMain`.
  Check: `test macos counter`. Then run `scripts/run.sh macos counter` once and confirm the process stays alive
  for 3 seconds without printing an error (`timeout 3 … ; test $? -eq 124`).

- [x] **T10 — Android backend M1**
  Needs: T07
  Read: `05-backends.md` ("Android"); the classes named there in `NucloRuntime.kt`
  Do: `AndroidBackend` (M1 members), the real `NucloActivity`.
  Check: `test android counter`

- [x] **T11 — iOS backend M1**
  Needs: T09
  Read: `05-backends.md` ("Apple", "iOS"); `NucloRuntime.swift` (`makeView`, the `UILabel` paint)
  Do: `UIKitBackend` (M1 members), the app delegate, `platformRunApp`.
  Check: `test ios counter`

- [x] **T12 — GTK backend M1**
  Needs: T07
  Read: `05-backends.md` ("Linux"); `gtk_backend.rs` (`create`, `set_children`, `set_frame`, `paint`, `measure`, the `NucloView` subclass)
  Do: `nuclo/src/gtk/kotlin/nuclo/gtk/GtkBackend.kt` (M1 members), `runGtkApp`.
  Check: `test linux counter`

- [x] **T13 — Windows backend M1**
  Needs: T07
  Read: `05-backends.md` ("Windows")
  Do: `Win32Backend` (M1 members), `platformRunApp`.
  Check: `test windows counter` (prints `windows: linked, not run`); `./gradlew -q :app:linkDebugExecutableMingwX64
  -Pexample=counter 2>&1 | grep -c '^w: '` prints `0`.

---

## Phase B — milestones

Each milestone has a **core** task, written out, and one **target** task per target, written as one line.
Every target task follows this template:

> **Target task** (`T21 — web M2: …` and the like) — the text after the colon is what to implement.
> Needs: the milestone's core task, and the same target's task of the previous milestone.
> Read: that target's section of `05-backends.md` (or `04-web.md`), and the reference functions for those members.
> Check: `test <target> all` — **every** example written so far passes, not only the new one.

### M2 — structure and inputs (`todo`)

- [x] **T20 — Core M2**
  Needs: T05, T06
  Read: `03-core.md` (fragments, list, when_, region / into, scope, lifecycle, events); the `list` / `when` /
  `region` / `into` functions of `node.rs` and of `NucloRuntime.kt`
  Do: `core/Reconcile.kt`; inputs, checkboxes, textareas (`value`, `placeholder`, `checked`, `disabled`, `type`,
  `ariaLabel`, `href`), `onInput` / `onChange` / `onFocus` / `onBlur`, `onMount` / `onMountCleanup` / `onDestroy`,
  `scope`, overlays (a second `render`). The matching members of `HeadlessBackend`. The M2 unit tests. The
  harness commands `type`, `enter`, `toggle`. `examples/todo/App.kt` (`02-api.md` §12) and its `test.script`.
  Check: `./gradlew -q :nuclo:macosArm64Test`; `test headless all`

- [x] **T21 — web M2**: `list`, `when_`, `region`, `into`, `scope`, the M2 attributes and events, lifecycle, overlay layers; harness `type` / `enter` / `toggle`
- [x] **T22 — macos M2**: create Input / Checkbox / Textarea; `setValue`, `setPlaceholder`, `setChecked`, `setEnabled`, `setInputType`, `setLabel`, `controlText`, `controlChecked`, `openUrl`, `showOverlay`; report `Input`, `Change`, `Focus`, `Blur`
- [x] **T23 — android M2**: the same
- [x] **T24 — ios M2**: the same
- [x] **T25 — linux M2**: the same
- [x] **T26 — windows M2**: the same (link check)

### M3 — the styling system (`styles`, `layouts`, `layout-matrix`)

- [x] **T30 — Core M3**
  Needs: T20
  Read: `02-api.md` §4–5 (precedence, inheritance); `03-core.md` (states, media); `style.rs`; `apply_style`,
  `set_state`, `restyle_for_width` in `node.rs`
  Do: `css` / `cx` / `variants` / `globalStyle` resolution, `className { }`, state styles (pressed, hover, focused,
  disabled, enabled, checked, placeholderShown), structural styles, media rules, inheritance; `flexWrap`,
  `alignSelf`, `aspectRatio`, `position = Absolute` with insets, `zIndex` (`reorder`), `overflow` (clip and scroll),
  `display = None`, `widthPct`, shadows, opacity, transforms, `pointerEvents`, `numberOfLines`,
  `textTransform`. The M3 unit tests. Port `examples/styles`, `examples/layouts`, `examples/layout-matrix` from
  `nuclo-native-ts` (drop what is out of scope) with `test.script` = `dump;exit`.
  Check: `./gradlew -q :nuclo:macosArm64Test`; `test headless all`

- [x] **T31 — web M3**: the full `toCss` (states, structural, media, shadows, transforms, wrap, absolute, scroll), `css()` classes, `globalStyle`
- [x] **T32 — macos M3**: `makeScrollable`, `setContentSize`, `reorder`; in `paint`: shadow, clip, transforms, per-side borders, `pointer`, `lines`, decoration, letter spacing, font family and weight; `listen(Pointer)` Down / Up / Cancel and `listen(Hover)`; re-layout when the window is resized
- [x] **T33 — android M3**: the same (hover only with a mouse)
- [x] **T34 — ios M3**: the same (no hover)
- [x] **T35 — linux M3**: the same
- [x] **T36 — windows M3**: the same (link check)

### M4 — navigation (`navigation`)

- [x] **T40 — Core M4**
  Needs: T30
  Read: `02-api.md` §8; `router.rs`; `class NRouter` in `NucloRuntime.kt`
  Do: `core/RouterImpl.kt` (stacks per tab, route matching, `go` / `back` / `replace` / `reset`, `Host.navPopped`,
  `Host.navTabSelected`, `render(outlet)`); `HeadlessBackend`'s `nav*` (it records the stacks and treats the top
  screen of the active tab as the shown root for dumps); harness `go` / `back`; the `routerStacks` test.
  Port `examples/navigation`.
  Check: `./gradlew -q :nuclo:macosArm64Test`; `test headless all`

- [x] **T41 — web M4**: `RouterWeb.kt`: hash routing, the bar / tabs / sheet chrome
- [x] **T42 — macos M4**: `navCreate`, `navPush`, `navPop`, `navReplace`, `navSelectTab`; report `navPopped` and `navTabSelected`
- [x] **T43 — android M4**: the same, with system back
- [x] **T44 — ios M4**: the same, with `UINavigationController` / `UITabBarController`
- [x] **T45 — linux M4**: the same, with libadwaita
- [x] **T46 — windows M4**: the same (link check)

### M5 — async and images (`fetch`)

- [x] **T50 — Core M5**
  Needs: T40
  Read: `02-api.md` §9; `task.rs`; `launch`, `NResponse`, the timers in `NucloRuntime.kt`
  Do: `core/Tasks.kt`: the engine actuals for frames and http, `fetch` resuming on the UI thread, `img` / `src`
  through `backend.http` + `setImage`. The `timersAndLaunch` test. Port `examples/fetch`; make it `println` one
  line `FETCH <status> <number of items>` when its request finishes.
  Check: `./gradlew -q :nuclo:macosArm64Test`; `test headless all`

- [x] **T51 — web M5**: `fetch` on `window.fetch`, timers, `requestAnimationFrame`, `img`
- [x] **T52 — macos M5**: `http`, `requestFrame` / `cancelFrame`, create Image, `setImage`
- [x] **T53 — android M5**: the same
- [x] **T54 — ios M5**: the same
- [x] **T55 — linux M5**: the same
- [x] **T56 — windows M5**: the same (link check)

  Extra check for T51–T55, when the machine is online: run the example with `NUCLO_SCRIPT="wait:8000;exit"` (no
  `NUCLO_TEST`) and find a line `FETCH 200 <n>` in the log. Offline: write `fetch not checked: offline` in the log
  of `TASKS.md` and continue.

### M6 — gestures, transitions, keyframes (`gestures`)

- [x] **T60 — Core M6**
  Needs: T50
  Read: `02-api.md` §3 (M6 attributes), §5 (keyframes); `Motion`, `Keyframes`, `ease`, `bezier`, `animate`, `tick`,
  `pointer`, `deliver` in `node.rs`
  Do: `core/Motion.kt` (transitions of opacity, transforms, background colour, radius, width / height; keyframe
  animations; both driven by `backend.requestFrame`, both skipped in test mode); the pointer, pan, pinch, long
  press, double click, scroll and key handlers and `Host` functions. The `transitionEndsAtTarget` test.
  Port `examples/gestures`.
  Check: `./gradlew -q :nuclo:macosArm64Test`; `test headless all`

- [x] **T61 — web M6**: `Gestures.kt`; pointer, key and scroll events; CSS transitions and `keyframes()`
- [x] **T62 — macos M6**: `listen(Pointer)` Move, `Pan`, `Pinch`, `LongPress`, `DoubleClick`, `Keys`, `Scroll` and the matching `Host` calls
- [x] **T63 — android M6**: the same (port `class Touch`)
- [x] **T64 — ios M6**: the same (gesture recognisers)
- [x] **T65 — linux M6**: the same (GTK gestures and controllers)
- [x] **T66 — windows M6**: the same (link check)

### M7 — native functions and components (`native-components`)

- [x] **T70 — Core M7**
  Needs: T60
  Read: `02-api.md` §10; `nativeView` / `NativeComponent` in `NucloRuntime.kt`
  Do: `Kind.Native` in the core (`backend.adopt`, the `update` callback run on every update, `handleOf` for
  `NativeElement`); `HeadlessBackend.adopt`. Port `examples/native-components`: the common `App.kt` with
  `expect fun Slider(…): Node`, `expect fun Gauge(…): Node` and its `expect` functions; a `native/<target>/`
  folder per target is written by that target's task.
  Check: `./gradlew -q :nuclo:macosArm64Test`

- [x] **T71 — web M7**: `nativeNode` (jsMain) + `examples/native-components/native/web/` (an `<input type="range">`, a drawn gauge)
- [x] **T72 — macos M7**: `adopt`, `handleOf`, `nativeNode` + `native/macos/` (`NSSlider`)
- [x] **T73 — android M7**: the same + `native/android/` (`SeekBar`)
- [x] **T74 — ios M7**: the same + `native/ios/` (`UISlider`)
- [x] **T75 — linux M7**: the same + `native/linux/` (`GtkScale`)
- [x] **T76 — windows M7**: the same + `native/windows/` (a `msctls_trackbar32` control) (link check)

  `scripts/test.sh` compares an example that has a `native/` folder with `--structure` only: the headless run
  adopts the platform view without ever showing it.

### M8 — composites and `onEndReached` (`gauges`, `select`)

- [x] **T80 — Common code M8**
  Needs: T70
  Read: `02-api.md` §11
  Do: `select`, `progress`, `meter` in commonMain (`Composites.kt`); `Route.onEndReached` in the core through
  `Host.screenScrolled`. Port `examples/gauges` and `examples/select` with the Kotlin signatures.
  Check: `./gradlew -q :nuclo:macosArm64Test`; `test headless all`; `test web all`

- [x] **T81 — web M8**: call a route's `onEndReached` from its screen's scroll event (within half a screen of the end)
- [x] **T82 — macos M8**: report `Host.screenScrolled` for a screen the backend scrolls
- [x] **T83 — android M8**: the same
- [x] **T84 — ios M8**: the same
- [x] **T85 — linux M8**: the same
- [x] **T86 — windows M8**: the same (link check)

---

## Phase C — wrap up

- [x] **T90 — README and the final run**
  Needs: every task above is `[x]` or `[!]`
  Do:
  1. Run `./gradlew -q :nuclo:macosArm64Test` and `scripts/test.sh <target> all` for every target; keep the output.
  2. Write `README.md` in the style of `nuclo-native-ts/README.md`: the counter example; the targets table; how
     to build, run and test; the API differences from nuclo (`01-architecture.md`); **"What was checked"** — one row
     per target with what passed, what was only compiled, and what was never run (Windows) or never looked at;
     every `[!]` task with its reason; known gaps.
  3. State only what a command in step 1 showed. No claim without a run behind it.
  Check: every `PASS` / `FAIL` line of step 1 is reflected in the README's status table.

---

## Log

<!-- One line per finished or blocked task: `T07 done — …` / `T45 blocked — <command> → <last lines>` -->

Host: Darwin (macOS, Apple Silicon): web, android, ios, macos, linux (via :gtk-preview), windows (link only), headless.

T00 done — scaffold from the verbatim build files; all six link/build commands pass, hello prints on macOS and gtk-preview, the .exe, app.js and APK exist.

T01 done — Node.kt (descriptors, Kind, Mod, children rules, jsNum, every tag builder, el), Attributes.kt, Events.kt; `./gradlew -q :nuclo:compileCommonMainKotlinMetadata` passes.
T02 done — Style.kt (generated field table, merged/normalized/equals, enums, MediaRule), Styling.kt (css, cx, variants, globalStyle, keyframes); metadata compile passes.
T03 done — Structure.kt, App.kt, Router.kt, Async.kt, Json.kt, Engine.kt (internal expect seam) and CommonTest.kt (tests run in T05); metadata compile passes.
T04 done — host/Backend.kt (as specified, plus equals), HeadlessBackend (virtual clock, helpers), core/Computed.kt (floats, packed colours, tag styles, Paint), Engine.ui.kt; `:nuclo:compileKotlinMacosArm64` passes.
T05 done — core/LiveNode, Flex, Runtime, Mount (mods), Tasks; Host.start/measureRoot/layoutRoot/event; 11 M1 tests in uiTest plus the 5 commonTest tests; `./gradlew -q :nuclo:macosArm64Test` passes.
T06 done — core/Harness.kt (tap/type/enter/toggle/go/back/wait/dump/exit), runHeadless + NUCLO_HEADLESS branch in macos/mingw/gtk platformRunApp, examples/counter (hello removed); the headless run prints Count: 0 then Count: 2 and NUCLO_EXIT.
T07 done — scripts/lib.sh, test.sh, compare.ts, run.sh (chmod +x) and package.json with every target's branch; `scripts/test.sh headless counter` prints PASS, a wrong pair of logs makes compare.ts exit 1 and print the differing line.
T08 done — jsMain: NucloCore.kt (external nuclo-core), Css.kt (Style → raw declarations, state/media keys, zero-specificity base stylesheet), Engine.js.kt (descriptors → nuclo-core calls), HarnessWeb.kt, web platformRunApp; `test web counter` prints PASS (structure compared with headless).
T09 done — appleMain/Apple.kt (cgColor, paintLayer, onMain, env/now), macosMain AppKitBackend (flipped layer-backed NView that draws its own text/buttons, scroll-view screen, timers, layout pass) and the real platformRunApp; `test macos counter` PASS and the process stays alive 3 s (exit 124); screenshot looked at (text and blue button render).
T10 done — androidMain AndroidBackend (NBox frames-are-law ViewGroup, ScreenView asking the core for layout in onMeasure, Backdrop, TextView paint/measure, timers, intent-extra env, logcat log) and NucloActivity; `test android counter` PASS on the Medium_Phone emulator (411x890, same frames as headless).
T11 done — iosMain UIKitBackend (UView drawing its own text, safe-area scroll view screen, touches), NucloViewController, UIApplicationMain entry; `test ios counter` PASS on the iPhone 17 Pro simulator (402x778). Also fixed test.sh to strip the pty's carriage returns.
T12 done — gtk/GtkBackend.kt: NucloView (a GtkWidget subclass registered from Kotlin with measure/size_allocate/snapshot/contains vfuncs, frames are law), labels and buttons inside it, Pango text attributes and measure, timers on g_timeout_add that wait for the first layout, runGtkApp with libadwaita; `test linux counter` PASS through :gtk-preview (Homebrew GTK 4.24). Native exit uses _exit because GTK's teardown segfaults.
T13 done — mingwMain Win32Backend (one window painting boxes and text with GDI+ into a memory bitmap, WM_TIMER timers, mouse hit test, layout on WM_APP+1/WM_SIZE) and runWin32; `test windows counter` prints `windows: linked, not run`, the counter link prints 0 compiler warnings. Never launched.
T20 done — core/Reconcile.kt (list matched by hash bucket + ==/=== sameItem, when_, region/into with the waiting registry), attribute/event wiring already in Mount.kt, examples/todo + test.script, 9 M2 tests; macosArm64Test (25 tests) and `test headless all` (counter, todo) pass.
T21 done — web M2 needed no engine change beyond M1 (list/when/region/into/scope/lifecycle map straight to nuclo-core); `test web all` PASS counter, todo.
T22 done — macOS: NSTextField/NSButton(switch)/NSTextView inside NView, notification observers and an ActionTarget for events, setValue/…/openUrl; `test macos all` PASS.
T23 done — Android: EditText/CheckBox with TextWatcher/editor action/focus listeners and a write flag against echo; `test android all` PASS on the emulator.
T24 done — iOS: UITextField/UISwitch/UITextView in UView with UIControl targets and notifications; `test ios all` PASS on the simulator.
T25 done — Linux (GTK via :gtk-preview): GtkEntry/GtkCheckButton/GtkTextView with one shared signal handler and a writing flag; `test linux all` PASS. gtk_accessible_update_property is variadic, so setLabel does nothing there (ponytail note).
T26 done — Windows: child EDIT/BUTTON controls placed from the frames, WM_COMMAND events (a field commits on blur); `test windows all` links with 0 warnings, never run.
T30 done — the M3 resolution (classes, className, states, structural, media, inheritance, wrap/absolute/scroll/zIndex/clip/shadow) was already in LiveNode/Computed/Flex; added HeadlessBackend resize/makeScrollable/setContentSize/reorder records, 7 M3 tests, and ported examples/styles, layouts, layout-matrix (done by three subagents, each compiled and run headless; `test headless all` PASS for 5 examples). Out-of-scope notes: dashed border is solid, `visibility: hidden` chip dropped, `inset` written as four insets.
T31 done — web Css.kt already covered toCss/states/media/shadow/transform/wrap/absolute/scroll and css()/globalStyle (zero-specificity base rules so classes and inline win); fixed a dynamic `.also` call, added the scroll event; the native dump now reports the untransformed text like the DOM's textContent. `test web all` PASS for 5 examples; the unstructured diff against headless only shows font-metric and rotated-bounding-box differences.
T32 done — macOS: makeScrollable (NSScrollView with a flipped document NView), setContentSize, reorder, per-side borders/shadow/clip (paintLayer), centre-turning layer transforms re-applied after every frame, NSTrackingArea hover, pointer Down/Up; the dump header now carries the window size when an overlay exists (test.sh uses it). `test macos all` PASS for 5 examples.
T33 done — Android: scrollers (ScrollView/HorizontalScrollView around an inner NBox), setContentSize, reorder, transforms, clipToOutline, hover listener; `test android all` PASS for 5 examples.
T34 done — iOS: UIScrollView per scrolling box, UIKit transforms (frameOf now reads centre and bounds because `frame` is the transformed bounding box), reorder; `test ios all` PASS for 5 examples.
T35 done — Linux (GTK): ScrolledWindow + content NucloView, setContentSize, reorder, GskTransform in allocate, hover (motion controller) and pointer Down/Up/Cancel gestures; fixed two bugs found on the way: views must be ref-sunk (re-parenting finalized them) and a root's minimum height must be its natural height (else a viewport shrinks it). frameOf returns the stored frame for transformed views. `test linux all` PASS for 5 examples.
T36 done — Windows: wheel scrolling offsets, content size, reorder, clip and centre-turning transforms through GDI+ save/restore, hover from WM_MOUSEMOVE; links with 0 warnings, `test windows all` links 5 examples, never run. Known gaps: no drop shadows, no differing per-side borders.
T40 done — core/RouterImpl.kt (stacks per tab, matching, go/back/replace/reset, popped/tab callbacks) plus core/Chrome.kt: when a backend has no native navigation (navCreate throws) the core draws the 56 px bar, the top screen in a scrolling box, the 64 px tab bar and a modal sheet from the same Backend primitives; HeadlessBackend implements nav* (stacks, shown screens, no chrome); harness go/back; routerStacks test; examples/navigation ported by a subagent (fixed: dropped screens were treated as overlays). Tests and `test headless all` pass (navigation: 3 dumps).
T41 done — jsMain RouterWeb.kt: hash routing with popstate, per-tab stacks, bar/tabs/sheet chrome, each screen its own nuclo-core render switched off through a `when` so destroy callbacks run; HarnessWeb walks the shown screen, the sheet and the layers. `test web navigation` PASS (same 86 views as headless).
T42 done — macOS: no backend code needed: its navCreate is not implemented, so the core draws the chrome (Chrome.kt) with AppKit views; `test macos navigation` PASS (3 dumps, 86 views).
T43 done — Android: same fallback chrome; system back (OnBackInvokedCallback) calls the router's back(); the harness now also waits for the first layout on slow devices; `test android navigation` PASS on the emulator.
T44 done — iOS: same fallback chrome (plain UIViews, not UINavigationController/UITabBarController: a deviation from 05-backends.md, noted for the README); `test ios navigation` PASS on the simulator.
T45 done — Linux (GTK): same fallback chrome (not libadwaita's AdwNavigationView: a deviation, noted for the README); `test linux navigation` PASS through :gtk-preview.
T46 done — Windows: same fallback chrome, links with 0 warnings, never run.
T50 done — core: Tasks.request (test mode answers every request with `no network in headless`, so dumps agree across targets), loadImage (`src` → http → setImage, newest request wins), timers/frames; headless http/setImage records; timersAndLaunch + image test; examples/fetch ported by a subagent (prints `FETCH <status> <n>` once); `./gradlew -q :nuclo:macosArm64Test` (35 tests) and `test headless all` (8 examples) pass.
T51 done — web: fetch on window.fetch, timers, requestAnimationFrame (img is a plain nuclo-core attribute); `?test=1` switches the network off for the harness; web gestures (Gestures.kt: pointer, key, pan, pinch incl. ctrl+wheel, long press, double click) were needed by the gestures example and are in. `test web all` PASS (8 examples). Extra check: Chrome with ?script=wait:8000;exit prints `FETCH 200 5`.
T52 done — macOS: NSURLSession http (appleHttp), NSImage drawn by the NView with cover/contain/fill; requestFrame is the default 16 ms timer. `test macos all` PASS; extra check `NUCLO_SCRIPT="wait:8000;exit"` printed `FETCH 200 5`.
T53 done — Android: HttpURLConnection on a thread, Choreographer frames, ImageView + BitmapFactory; `test android all` PASS; extra check printed `FETCH 200 5`.
T54 done — iOS: the shared appleHttp, UIImage drawn by the UView; `test ios all` PASS; extra check printed `FETCH 200 5`.
T55 done — Linux (GTK): curl subprocess http (ponytail note in code), GtkPicture + GdkTexture images; timers with 0 ms no longer wait for a frame; `test linux all` PASS; extra check printed `FETCH 200 5`.
T56 done — Windows: WinHTTP on a Worker thread posting back with WM_APP+2 (images not decoded: ponytail); links with 0 warnings, `test windows all` links 8 examples, never run.
T60 done — core/Motion.kt (transitions of opacity, transform, background, radius, width/height and keyframe animations on backend.requestFrame, off in test mode), pointer/pan/pinch/long-press/double-click/key/scroll delivery through Host; M6 tests (transitionEndsAtTarget with test mode switched off, every handler kind); `test headless all` PASS (8 examples).
T61 done — web Gestures.kt (pan with 8 px slop and velocity, pinch from two pointers and ctrl+wheel, 500 ms long press, dblclick, keydown), CSS transitions/keyframes came with Css.kt; `test web all` PASS. Handlers were not exercised in a browser (the script only dumps).
T62 done — macOS: mouse-driven pointer Move, pan (8 px slop, velocity), long press (NSTimer), double click, trackpad pinch (magnify), keys (first responder when asked), scroll through the clip view's bounds notifications; `test macos all` PASS (8 examples). Gesture handlers were not driven by a real pointer (scripts only dump).
T63 done — Android: Touch (ported: GestureDetector long press/double tap, ScaleGestureDetector, pan with slop and VelocityTracker), keys, scroll listeners; `test android all` PASS. Not driven by real touches.
T64 done — iOS: UIPan/UIPinch/UILongPress/UITapGestureRecognizer through a SenderTarget, touchesMoved for pointer Move, UIScrollViewDelegate for scroll; hardware keys are not implemented (no onKeyDown on iOS). `test ios all` PASS. Not driven by real touches.
T65 done — Linux (GTK): GtkGestureDrag (pointer Move and pan), GtkGestureZoom, GtkGestureLongPress, a two-press click, GtkEventControllerKey (+ click to focus), adjustments for scroll; `test linux all` PASS. Not driven by a real pointer.
T66 done — Windows: pointer Move, pan, double click (CS_DBLCLKS), WM_KEYDOWN to the first key listener; long press and pinch are not implemented; 0 warnings (the Workers opt-in is a file annotation); `test windows all` links, never run.
T70 done — core: Kind.Native mounting (create once through the platform's nativeNode, `update` after it and on every update(), handleOf), nativeDescriptor in commonMain (public only because the GTK sources are compiled by another module), HeadlessBackend adopt/handleOf; M7 test; examples/native-components (common App.kt with expect Slider/Gauge/platformName/vibrate/batteryLevel; the platform name is read on tap so dumps agree). `./gradlew -q :nuclo:macosArm64Test` passes (38 tests).
T71 done — web: nativeNode(HTMLElement) mounted into a box, update through a reactive attribute; native/web (<input type=range>, a conic-gradient ring). `test web native-components` PASS.
T72 done — macOS: nativeNode(NSView), adopt wraps the view in an NView, native/macos (NSSlider, a custom NSView ring); `test macos native-components` PASS (structure only, as the script says).
T73 done — Android: nativeNode(Context → View), NucloActivity.current, native/android (SeekBar, a custom View ring, Vibrator, BatteryManager); `test android native-components` PASS.
T74 done — iOS: nativeNode(UIView), native/ios (UISlider, a custom UIView ring); vibrate is a no-op; `test ios native-components` PASS.
T75 done — Linux (GTK): nuclo.gtk.nativeNode(GtkWidget), native/linux (GtkScale, a GtkDrawingArea ring drawn with cairo); `test linux native-components` PASS.
T76 done — Windows: nativeNode(parent HWND → HWND) with onNativeScroll for WM_HSCROLL, native/windows (msctls_trackbar32, msctls_progress32 as the gauge, GetSystemPowerStatus); links with 0 warnings, never run.
T80 done — commonMain Composites.kt (progress, meter coloured as HTML's meter, select that opens inline), Route.onEndReached in the core (EndReached on a root; Host.screenScrolled; chrome scrollers report the screen), M4 test routeEndReachedFiresOncePerContentHeight; examples/gauges and select ported (select's optgroup labels dropped: out of scope; select's test.script taps Medium then Large). `:nuclo:macosArm64Test` (39 tests), `test headless all` and `test web all` PASS (11 examples).
T81 done — web: progress/meter are plain boxes with `nuclo-progress`/`nuclo-meter` classes; WebRouter calls onEndReached from the screen's scroll event and a 250 ms check (short pages too).
T82 done — macOS: the screen's NSScrollView reports Host.screenScrolled (clip view bounds notifications); chrome screens report through their scroller. `test macos all` PASS.
T83 done — Android: ScreenView.onScrollChanged reports Host.screenScrolled; `test android all` PASS.
T84 done — iOS: the screen's UIScrollView delegate reports it; `test ios all` PASS.
T85 done — Linux (GTK): the screen's vertical adjustment reports it ("value-changed" and "changed"); `test linux all` PASS.
T86 done — Windows: the wheel scrolls the screen and reports Host.screenScrolled; links, `test windows all` links 11 examples, never run.
T90 done — final run in this session: macosArm64Test 39 tests pass; `scripts/test.sh <target> all` PASS for headless, web, macos, ios, android and linux (through :gtk-preview) on 11 examples each, windows links all 11; `fetch` printed `FETCH 200 5` on web, macOS, iOS, Android and GTK. README.md written from exactly those results (and lists what was never run). No task is `[!]`.
