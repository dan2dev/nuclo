# nuclo-native-kt — instructions for the implementing agent

You are building `nuclo-native-kt`: the nuclo UI model (plain mutable state, builders, an explicit `update()`)
written in **Kotlin Multiplatform**. One Kotlin app runs on the web (compiled to JavaScript that drives
`nuclo-core`), and on Android, iOS, macOS, Linux and Windows with each platform's own widgets.

Everything you need is in `specs/`. Read the files in this order, once, before writing code:

| File | What it is |
| --- | --- |
| `specs/01-architecture.md` | What is being built, the module layout, the decisions already taken |
| `specs/02-api.md` | The public Kotlin API. **It is the contract: implement it as written** |
| `specs/03-core.md` | The shared core, the `Backend` interface, the test harness |
| `specs/04-web.md` | The web target: Kotlin/JS on top of `nuclo-core` |
| `specs/05-backends.md` | One section per native platform, with verified code recipes |
| `specs/06-build-and-verify.md` | The Gradle files (copy them verbatim), scripts, how every target is checked |
| `specs/TASKS.md` | **The ordered task list. This is what you execute** |

## The loop

Repeat until `specs/TASKS.md` has no unchecked task:

1. Open `specs/TASKS.md`. Take the **first** task marked `[ ]` whose `Needs:` tasks are all `[x]`.
2. Read the spec sections and the reference files the task lists. Read before you write.
3. Do only that task. Do not start the next one early.
4. Run the task's `Check:` commands. Read their output.
5. If every check passes: change the task's `[ ]` to `[x]` and add one line under `## Log` at the bottom of
   `specs/TASKS.md` (`T12 done — <one sentence>`). Go to 1.
6. If a check fails: fix and re-run. After **three different** failed attempts on the same check, stop trying:
   mark the task `[!]`, write the failing command and the last 30 lines of its output under `## Log`, and go to 1
   (tasks that need it stay blocked; take the next one that does not).

Never mark a task `[x]` without having run its checks in this session and seen them pass.

## Hard rules

- **Work only inside `packages/nuclo-native-kt/`.** Every other folder is read-only reference material.
- **Never run `git commit`, `git push`, `git reset`, `git checkout --` or `git clean`.** Leave all changes in the
  working tree. The user commits.
- **No new dependencies.** The only libraries are the Kotlin standard library, `kotlin("test")`, the platform
  libraries Kotlin/Native ships (`platform.*`), the Android SDK, GTK 4 / libadwaita through cinterop, and the npm
  package `nuclo` (this repo's `packages/nuclo-core`). No kotlinx.coroutines, no kotlinx.serialization, no Compose,
  no Ktor, no gtk-kn.
- **Do not change versions**: Kotlin 2.4.21, Android Gradle Plugin 9.5.1, Gradle 9.9.1 (wrapper), JDK 17,
  compileSdk 37, minSdk 30. They are what this machine has cached and what was verified.
- **Do not change the public API** of `specs/02-api.md`. If something in it cannot be implemented, mark the task
  `[!]` and explain in the log; do not invent a different API.
- **Do not skip a platform silently.** If a platform's toolchain is missing on this machine (see "Hosts" below),
  the task says what to do. Record it in the log.
- Do not write planning documents, summaries or changelogs. The only docs you write are `README.md` (task T90)
  and the log lines in `specs/TASKS.md`.
- Keep the code small. No abstraction with one implementation other than `Backend`. No configuration for values
  that never change. When a simplification has a known ceiling, mark it with a `// ponytail:` comment that names
  the ceiling.

## Reference material (read-only)

All paths are relative to `packages/`.

| What | Where | Use it for |
| --- | --- | --- |
| The API this package mirrors | `nuclo-native-ts/src/index.ts` | Semantics of every builder, attribute and style key |
| The core, toolkit-free (Rust) | `nuclo-native-ts/src/runtimes/rust/src/nuclo/*.rs` | **The structure to port**: `node.rs`, `flex.rs`, `style.rs`, `router.rs`, `task.rs`, `backend.rs` |
| The same logic, already in Kotlin | `nuclo-native-ts/src/runtimes/android/NucloRuntime.kt` | Kotlin wording of Flex, styles, colours, router, and the whole Android backend |
| iOS runtime (Swift, UIKit) | `nuclo-native-ts/src/runtimes/ios/NucloRuntime.swift` | Which UIKit calls to make |
| UIKit-on-AppKit shim (Swift) | `nuclo-native-ts/src/runtimes/macos/UIKitShim.swift` | Which AppKit calls replace the UIKit ones |
| GTK 4 backend (Rust) | `nuclo-native-ts/src/runtimes/rust/src/gtk_backend.rs` | Which GTK calls to make, function by function |
| Web runtime (TypeScript, DOM) | `nuclo-native-ts/src/runtimes/web/index.ts` | Style → CSS (`CSS_PROPS`, `toCss`, `BASE_CSS`), gestures, the web router |
| WPF host (C#) | `nuclo-native/hosts/windows/Program.cs` | How the Windows controls behave (not the API: you use Win32) |
| nuclo-core | `nuclo-core/README.md`, `nuclo-core/types/` | What the web target calls |
| Example apps (TypeScript) | `nuclo-native-ts/examples/*/App.ts` | The apps you port to Kotlin |

`nuclo-native-ts/build/android/<example>/App.kt` (when it exists; regenerate with
`cd nuclo-native-ts && bun scripts/examples.ts android`) is each example already translated to Kotlin by a
compiler. It targets a different API, but it shows the Kotlin types of every piece of app state.

When a spec and a reference disagree, the spec wins. When the spec is silent, do what
`NucloRuntime.kt` does.

## Hosts: what this machine can build and run

Detect once with `uname -s` and record the answer in the log.

| Target | macOS host (the default) | Linux x86-64 host |
| --- | --- | --- |
| web | build, run in headless Chrome | build, run in headless Chrome/Chromium |
| android | build; run on the emulator `Medium_Phone` (start it if `adb get-state` fails) | build; run if an emulator or device exists |
| ios | build; run on the simulator `iPhone 17 Pro` | cannot: mark iOS tasks `[!] no macOS` |
| macos | build and run | cannot: mark macOS tasks `[!] no macOS` |
| linux (GTK) | build and run **through the `:gtk-preview` module** (Homebrew GTK 4); the real `linuxX64` binary cannot be built here | build and run natively (under `xvfb-run` if there is no display) |
| windows | cross-compile and link only; **never launched** | cross-compile and link only |
| headless | build and run (it is the macOS executable with `NUCLO_HEADLESS=1`) | the Linux executable with `NUCLO_HEADLESS=1` |

Environment already set in the shell: `JAVA_HOME` (JDK 17), `ANDROID_HOME`. Xcode 27, `bun`, `pkg-config`,
Homebrew `gtk4` 4.24 and `libadwaita` 1.10 are installed. Chrome is at
`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.

## Commands you will use

```bash
./gradlew -q :nuclo:macosArm64Test                       # core unit tests (seconds once warm)
./gradlew -q :app:linkDebugExecutableMacosArm64 -Pexample=counter
scripts/test.sh <web|android|ios|macos|linux|windows|headless> <example|all>
scripts/run.sh  <target> <example>                        # build and open it, for a human to look at
```

- The first Gradle run downloads Kotlin/Native and npm dependencies; allow 10 minutes. Later runs take 5–60 s.
  If Gradle prints `No cached version … available for offline mode`, you passed `--offline`: remove it.
- Give long commands a timeout of 10 minutes. Never start a dev server in the foreground.
- A Gradle error list is long: read the lines starting with `e: ` first. They are the compiler errors.

## Kotlin facts that will save you hours

These were all hit while preparing the specs.

1. Every example file starts with `package app`. The entry point is `app.main`. A `main` in the root package
   cannot be referenced from the Android host.
2. The intermediate source set `uiMain` (core, shared by Android and every Kotlin/Native target) only exists
   because of the `applyDefaultHierarchyTemplate { … }` block in `nuclo/build.gradle.kts`. `withAndroidTarget()`
   does **not** match the AGP 9 Android library target: keep `withCompilations { it.target.name == "android" }`.
3. `child is Function0<*>` works in common code on every target (JVM, Native, JS): it is how a dynamic-text
   lambda is recognised among `vararg children: Any?`.
4. Kotlin/JS: a Kotlin lambda is a JavaScript function, and a zero-argument one has `length == 0`, which is what
   nuclo-core treats as dynamic text. But a Kotlin `List` is not a JS array (`.toTypedArray()`), a Kotlin `Map` or
   class instance is not a plain JS object (build one with `js("({})")` and `obj[key] = value`), and a Kotlin
   `Long` is not a JS number (do not use `Long` anywhere in the API).
5. Kotlin/Native C interop: C enums are Kotlin enum classes (`GtkOrientation.GTK_ORIENTATION_VERTICAL`). A C
   callback is `staticCFunction(::topLevelFunction)`; it cannot capture, so pass state as
   `StableRef.create(obj).asCPointer()` and read it back with `data!!.asStableRef<T>().get()`. Dispose the
   `StableRef` when the view is destroyed.
6. Kotlin/Native Objective-C interop: a Kotlin class that UIKit/AppKit calls back must extend an Objective-C
   class (`NSObject`, `UIView`, `NSView`…); initialisers are `@OverrideInit constructor(frame: CValue<CGRect>) :
   super(frame)`; target/action methods need `@ObjCAction` and are named by `NSSelectorFromString("tapped:")`.
   Structs are values: `CGRectMake(…)`, and `rect.useContents { size.width }` to read one.
7. The opt-ins `kotlinx.cinterop.ExperimentalForeignApi` and `BetaInteropApi` are enabled for every source set
   in the build files. Do not add `@OptIn` annotations for them.
8. All UI work happens on the platform's main thread. Network callbacks arrive on another thread: hop back
   (`Handler(Looper.getMainLooper()).post`, `dispatch_async(dispatch_get_main_queue())`, `g_idle_add`,
   `PostMessageW`) before touching the core.
9. `kotlin.srcDir(dir)` + `kotlin.exclude("native/**")` — exclusion patterns are relative to the source dir. A
   predicate on absolute files does not work.
10. `jsBrowserProductionWebpack` wipes its output folder. The page comes from `app/src/jsMain/resources/index.html`
    and the finished site is `app/build/dist/js/productionExecutable/` (task `:app:jsBrowserDistribution`).
