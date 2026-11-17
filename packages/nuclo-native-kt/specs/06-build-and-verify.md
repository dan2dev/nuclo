# 06 — Build files, scripts, verification

## What was verified while writing these specs

A throwaway project with exactly the build files below was built and run on this machine (macOS 27, Apple
Silicon, Kotlin 2.4.21, AGP 9.5.1, Gradle 9.9.1, Xcode 27.1):

| Piece | Result |
| --- | --- |
| `:nuclo:macosArm64Test` with a test in `uiTest` | 1 test, passed |
| `:app:linkDebugExecutableMacosArm64` | ran, printed the tree it rendered |
| `:app:linkDebugExecutableIosSimulatorArm64` + `.app` wrapper | launched on the iPhone 17 Pro simulator, output read with `simctl launch --console-pty` |
| `:app:linkDebugExecutableMingwX64` | linked a `.exe` (cross-compiled; not run) |
| `:app:jsBrowserDistribution` | page rendered by nuclo-core in headless Chrome, from a `file://` URL with a query string |
| `:android:assembleDebug` | built an APK (not launched) |
| `:gtk-preview:linkDebugExecutableMacosArm64` | ran an example on GTK sources shared with `linuxMain`, against Homebrew GTK 4.24 / libadwaita 1.10 |
| `expect fun` in an example with `actual`s in `native/<target>/` | resolved on every target above |

Not verified: the `linuxX64` target (needs a Linux x86-64 host), anything launched on Android, anything on Windows.

**Copy the files of this section verbatim.** Do not "improve" them. Each line is there because the
alternative failed.

## Bootstrap

```bash
cd packages/nuclo-native-kt
cp -R ../nuclo-native-ts/hosts/android/gradle ../nuclo-native-ts/hosts/android/gradlew .
test -f ../nuclo-core/dist/nuclo.mjs || (cd ../nuclo-core && bun install && bun run build)
```

### `.gitignore`

```
build/
.gradle/
.kotlin/
local.properties
kotlin-js-store/
/yarn.lock
*.apk
*.hprof
```

### `settings.gradle.kts`

```kotlin
pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }
dependencyResolutionManagement { repositories { google(); mavenCentral() } }
rootProject.name = "nuclo-native-kt"
include(":nuclo", ":app", ":android")
// The GTK backend on macOS, against Homebrew's GTK. On Linux the real linuxX64 target is used instead.
if (System.getProperty("os.name") == "Mac OS X") include(":gtk-preview")
```

### `build.gradle.kts`

```kotlin
plugins {
    kotlin("multiplatform") version "2.4.21" apply false
    id("com.android.kotlin.multiplatform.library") version "9.5.1" apply false
    id("com.android.application") version "9.5.1" apply false
}
```

### `gradle.properties`

```properties
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g -Dfile.encoding=UTF-8
kotlin.code.style=official
# The example :app, :android and :gtk-preview build: a folder of examples/. Override with -Pexample=<name>.
example=counter
```

### `nuclo/build.gradle.kts`

```kotlin
import org.jetbrains.kotlin.gradle.ExperimentalKotlinGradlePluginApi

plugins {
    kotlin("multiplatform")
    id("com.android.kotlin.multiplatform.library")
}

val hostIsLinux = System.getProperty("os.name") == "Linux"

fun pkgConfig(flag: String): List<String> =
    providers.exec { commandLine("pkg-config", flag, "gtk4", "libadwaita-1") }.standardOutput.asText.get().trim().split(Regex("\\s+"))

kotlin {
    js(IR) { browser(); useEsModules() }
    androidLibrary { namespace = "dev.nuclo"; compileSdk = 37; minSdk = 30 }
    macosArm64()
    iosArm64()
    iosSimulatorArm64()
    mingwX64()
    // GTK's headers and libraries only exist on a Linux host. On macOS the same sources are built by :gtk-preview.
    if (hostIsLinux) linuxX64 {
        compilations["main"].cinterops.create("gtk") {
            defFile(file("src/nativeInterop/cinterop/gtk.def"))
            compilerOpts(pkgConfig("--cflags"))
        }
    }

    // uiMain: the core, shared by Android (JVM) and every Kotlin/Native target. withAndroidTarget() does not
    // match the AGP 9 library target, hence the name test.
    @OptIn(ExperimentalKotlinGradlePluginApi::class)
    applyDefaultHierarchyTemplate {
        common {
            group("ui") {
                withCompilations { it.target.name == "android" }
                group("native")
            }
        }
    }
    sourceSets {
        all { languageSettings { optIn("kotlinx.cinterop.ExperimentalForeignApi"); optIn("kotlinx.cinterop.BetaInteropApi") } }
        commonTest.dependencies { implementation(kotlin("test")) }
        jsMain.dependencies { implementation(npm("nuclo", rootProject.file("../nuclo-core"))) }
        if (hostIsLinux) linuxMain { kotlin.srcDir("src/gtk/kotlin") }
    }
}
```

### `nuclo/src/nativeInterop/cinterop/gtk.def`

```
headers = gtk/gtk.h adwaita.h
headerFilter = gtk/* gdk/* gsk/* glib/* glib-object.h glib.h gobject/* gio/* pango/* cairo* gdk-pixbuf/* graphene* adw* adwaita.h
```

The bindings land in the Kotlin package `gtk` (`import gtk.*`).

### `app/build.gradle.kts`

```kotlin
plugins {
    kotlin("multiplatform")
    id("com.android.kotlin.multiplatform.library")
}

val example = providers.gradleProperty("example").get()
val exampleDir = rootProject.file("examples/$example")
val hostIsLinux = System.getProperty("os.name") == "Linux"

fun pkgConfig(flag: String): List<String> =
    providers.exec { commandLine("pkg-config", flag, "gtk4", "libadwaita-1") }.standardOutput.asText.get().trim().split(Regex("\\s+"))

kotlin {
    js(IR) { browser(); useEsModules(); binaries.executable() }
    androidLibrary { namespace = "dev.nuclo.example"; compileSdk = 37; minSdk = 30 }
    listOf(macosArm64(), iosArm64(), iosSimulatorArm64(), mingwX64()).forEach {
        it.binaries.executable { baseName = "nuclo-$example"; entryPoint = "app.main" }
    }
    if (hostIsLinux) linuxX64 {
        binaries.executable { baseName = "nuclo-$example"; entryPoint = "app.main"; linkerOpts(pkgConfig("--libs")) }
    }
    sourceSets {
        all { languageSettings { optIn("kotlinx.cinterop.ExperimentalForeignApi"); optIn("kotlinx.cinterop.BetaInteropApi") } }
        commonMain {
            // The example's own files (not its native/ folder: those belong to one target each).
            kotlin.srcDir(exampleDir)
            kotlin.exclude("native/**")
            dependencies { implementation(project(":nuclo")) }
        }
        jsMain { kotlin.srcDir(exampleDir.resolve("native/web")) }
        androidMain { kotlin.srcDir(exampleDir.resolve("native/android")) }
        iosMain { kotlin.srcDir(exampleDir.resolve("native/ios")) }
        macosMain { kotlin.srcDir(exampleDir.resolve("native/macos")) }
        mingwMain { kotlin.srcDir(exampleDir.resolve("native/windows")) }
        if (hostIsLinux) linuxMain { kotlin.srcDir(exampleDir.resolve("native/linux")) }
    }
}
```

### `app/src/jsMain/resources/index.html`

```html
<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>nuclo-native-kt</title></head><body><script src="app.js"></script></body></html>
```

### `android/build.gradle.kts`

```kotlin
plugins { id("com.android.application") }

android {
    namespace = "dev.nuclo.app"
    compileSdk { version = release(37) { minorApiLevel = 2 } }
    defaultConfig {
        applicationId = "dev.nuclo.nativekt"
        minSdk { version = release(30) }
        targetSdk { version = release(37) }
        versionCode = 1
        versionName = "0.0.0"
    }
    buildTypes { release { isMinifyEnabled = true; signingConfig = signingConfigs.getByName("debug") } }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}

dependencies {
    implementation(project(":nuclo"))
    implementation(project(":app"))
}
```

### `android/src/main/AndroidManifest.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <application android:label="nuclo-native-kt" android:enableOnBackInvokedCallback="true" android:theme="@style/Nuclo">
        <activity android:name=".MainActivity" android:exported="true" android:configChanges="orientation|screenSize|screenLayout|keyboardHidden" android:windowSoftInputMode="adjustResize">
            <intent-filter><action android:name="android.intent.action.MAIN" /><category android:name="android.intent.category.LAUNCHER" /></intent-filter>
        </activity>
    </application>
</manifest>
```

`android/src/main/res/values/themes.xml`: copy `../nuclo-native-ts/hosts/android/app/src/main/res/values/themes.xml`.

### `android/src/main/kotlin/dev/nuclo/app/MainActivity.kt`

```kotlin
package dev.nuclo.app

import nuclo.NucloActivity

/** The example's entry: `fun main()` in package `app`. */
class MainActivity : NucloActivity({ app.main() })
```

### `gtk-preview/build.gradle.kts`

```kotlin
plugins { kotlin("multiplatform") }

val example = providers.gradleProperty("example").get()
val exampleDir = rootProject.file("examples/$example")

fun pkgConfig(flag: String): List<String> =
    providers.exec { commandLine("pkg-config", flag, "gtk4", "libadwaita-1") }.standardOutput.asText.get().trim().split(Regex("\\s+"))

kotlin {
    macosArm64 {
        compilations["main"].cinterops.create("gtk") {
            defFile(rootProject.file("nuclo/src/nativeInterop/cinterop/gtk.def"))
            compilerOpts(pkgConfig("--cflags"))
        }
        binaries.executable { baseName = "nuclo-$example"; linkerOpts(pkgConfig("--libs")) }
    }
    sourceSets {
        all { languageSettings { optIn("kotlinx.cinterop.ExperimentalForeignApi"); optIn("kotlinx.cinterop.BetaInteropApi") } }
        commonMain {
            kotlin.srcDir(exampleDir)
            kotlin.exclude("native/**")
            dependencies { implementation(project(":nuclo")) }
        }
        getByName("macosArm64Main") {
            // The GTK backend's own sources (the same files linuxMain compiles on Linux) and the example's Linux code.
            kotlin.srcDir(rootProject.file("nuclo/src/gtk/kotlin"))
            kotlin.srcDir(exampleDir.resolve("native/linux"))
        }
    }
}
```

### `gtk-preview/src/macosArm64Main/kotlin/Main.kt`

```kotlin
import nuclo.gtk.runGtkApp

/** Runs the example on the GTK backend instead of AppKit. */
fun main() {
    nuclo.runAppOverride = ::runGtkApp
    app.main()
}
```

### On a Linux host (not verified)

- Packages: `libgtk-4-dev libadwaita-1-dev pkg-config curl`, JDK 17. Kotlin/Native runs on Linux x86-64 only.
- Kotlin/Native links against its own old glibc sysroot. If linking the GTK libraries fails with undefined
  versioned symbols (`…@GLIBC_2.3x`), add `linkerOpts("--allow-shlib-undefined")` to the `linuxX64` executable
  in `app/build.gradle.kts`.
- No display: run the app under `xvfb-run -a`.

## Gradle tasks

| Task | Output |
| --- | --- |
| `:nuclo:macosArm64Test` (`:nuclo:linuxX64Test` on Linux) | Core unit tests |
| `:app:jsBrowserDistribution` | `app/build/dist/js/productionExecutable/{index.html,app.js}` |
| `:app:linkDebugExecutableMacosArm64` | `app/build/bin/macosArm64/debugExecutable/nuclo-<example>.kexe` |
| `:app:linkDebugExecutableIosSimulatorArm64` | `app/build/bin/iosSimulatorArm64/debugExecutable/nuclo-<example>.kexe` |
| `:app:linkDebugExecutableMingwX64` | `app/build/bin/mingwX64/debugExecutable/nuclo-<example>.exe` |
| `:app:linkDebugExecutableLinuxX64` (Linux host) | `app/build/bin/linuxX64/debugExecutable/nuclo-<example>.kexe` |
| `:gtk-preview:linkDebugExecutableMacosArm64` (macOS host) | `gtk-preview/build/bin/macosArm64/debugExecutable/nuclo-<example>.kexe` |
| `:android:assembleDebug` | `android/build/outputs/apk/debug/android-debug.apk` |

Always pass `-Pexample=<name>` and `-q`. Switching the example recompiles `:app`; that is expected.

## Scripts (you write these in task T07)

Plain `bash` (`set -euo pipefail`), plus one `bun` script. `scripts/lib.sh` holds what the others share.

### `scripts/test.sh <target> <example|all>`

`all` loops over every folder of `examples/` that has an `App.kt`. For one example:

1. `SCRIPT=$(cat examples/<example>/test.script 2>/dev/null || echo "dump;exit")`.
2. Build the target (table above).
3. Run it with the script and test mode, with a 90-second limit (`timeout 90 …`), capture what it logs into
   `build/test/<target>/<example>.log`:

| Target | How it is run | Where the log comes from |
| --- | --- | --- |
| `headless` | `NUCLO_HEADLESS=1 NUCLO_SCRIPT="$SCRIPT" <host executable>` | stdout |
| `macos` | `NUCLO_TEST=1 NUCLO_SCRIPT="$SCRIPT" app/build/bin/macosArm64/debugExecutable/nuclo-<example>.kexe` | stdout |
| `linux` | macOS host: the `:gtk-preview` executable, same env. Linux host: the `linuxX64` one (under `xvfb-run -a` when `$DISPLAY` and `$WAYLAND_DISPLAY` are empty) | stdout |
| `ios` | Wrap the executable: `build/ios/NucloApp.app/{NucloApp,Info.plist}` (copy the plist from `nuclo-native-ts/scripts/ios-run.sh`, bundle id `dev.nuclo.nativekt`). `xcrun simctl boot "iPhone 17 Pro" \|\| true; xcrun simctl bootstatus "iPhone 17 Pro"; xcrun simctl install …`; then `SIMCTL_CHILD_NUCLO_TEST=1 SIMCTL_CHILD_NUCLO_SCRIPT="$SCRIPT" xcrun simctl launch --console-pty "iPhone 17 Pro" dev.nuclo.nativekt` | that command's stdout |
| `android` | If `adb get-state` fails: `"$ANDROID_HOME/emulator/emulator" -avd Medium_Phone -no-snapshot-save -no-boot-anim >/dev/null 2>&1 &`, `adb wait-for-device`, then poll `adb shell getprop sys.boot_completed` until `1`. `adb install -r <apk>`; `adb logcat -c`; `adb shell "am start -n dev.nuclo.nativekt/dev.nuclo.app.MainActivity --es NUCLO_TEST 1 --es NUCLO_SCRIPT '$SCRIPT'"`; poll `adb logcat -d -v raw -s nuclo:I` once a second until a line is `NUCLO_EXIT` | the last `adb logcat -d -v raw -s nuclo:I` |
| `web` | `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --window-size=420,780 --virtual-time-budget=10000 --dump-dom "file://$PWD/app/build/dist/js/productionExecutable/index.html?script=<url-encoded SCRIPT>"` | the text of `<pre id="nuclo-dump">` in the printed DOM (undo `&amp;` `&lt;` `&gt;`) |
| `windows` | Not run. After the link succeeds print `windows: linked, not run` and exit 0 | — |

4. Fail (`exit 1`, print the last 30 log lines) if the log has `NUCLO_SCRIPT_ERROR`, has no `NUCLO_DUMP_END`,
   or has no `NUCLO_EXIT`.
5. For every target but `headless` and `windows`: read `<w>x<h>` from the first `NUCLO_DUMP_BEGIN` line, run the
   headless executable with `NUCLO_SIZE=<w>x<h>` and the same script into
   `build/test/headless/<example>@<w>x<h>.log`, then
   `bun scripts/compare.ts <headless log> <target log> [--structure]` — `--structure` for `web`, and for any
   target when the example has a `native/` folder (a platform view has its own size).
6. Print one line: `PASS <target> <example> (<n> dumps, <m> views)` or `FAIL <target> <example>` followed by
   the differences. Exit 0 or 1.

The harness prints `NUCLO_EXIT` (through `backend.log`) just before it exits; step 4 relies on it.

### `scripts/compare.ts <expected.log> <actual.log> [--structure] [--tolerance <n>]`

Reads the dump blocks of both files (lines between `NUCLO_DUMP_BEGIN` and `NUCLO_DUMP_END`; ignore everything
else). Both must have the same number of blocks, and each pair the same number of lines. Line by line:

- `kind` and `text` must be equal.
- Without `--structure`: `x`, `y`, `w`, `h` must each differ by at most the tolerance (default **1**).

Print each difference as `dump <n> line <i>: expected <line> | got <line>`, at most 20, and exit 1 if there
was any.

What the comparison proves: with `NUCLO_TEST=1` the core uses the fixed test metrics, so a native target must
place every view **where the headless core computed it**, and the dump reads the frames back from the real
widgets. `--structure` (web) proves the same views with the same texts exist in the same order; the browser's
own fonts decide the web's pixels.

### `scripts/run.sh <target> <example>`

Builds and opens the app for a person to look at (no script, no test mode): `web` opens `index.html` with
`open`; `macos` and `linux` run the executable; `ios` installs and launches on the simulator; `android` installs
and starts the activity; `windows` prints the path of the `.exe`.

### `package.json`

```json
{
	"name": "@nuclo/native-kt",
	"private": true,
	"version": "0.0.0",
	"description": "POC: nuclo apps written in Kotlin Multiplatform: JavaScript on nuclo-core for the web, and native widgets on Android, iOS, macOS, Linux (GTK 4) and Windows (Win32).",
	"license": "MIT",
	"scripts": {
		"test": "./gradlew -q :nuclo:macosArm64Test && scripts/test.sh headless all",
		"web": "scripts/run.sh web",
		"android": "scripts/run.sh android",
		"ios": "scripts/run.sh ios",
		"macos": "scripts/run.sh macos",
		"linux": "scripts/run.sh linux",
		"windows": "scripts/run.sh windows"
	}
}
```

## Examples and their test scripts

Each example is ported from `nuclo-native-ts/examples/<same name>/App.ts` (except `counter` and `todo`, which are
in these specs). Keep the app's structure and texts; translate the syntax with `02-api.md`. Where the original
uses something out of scope (`createCss`, CSS strings, `video`), use the typed equivalent or leave that block out.

| Example | Source | `test.script` |
| --- | --- | --- |
| `counter` | `01-architecture.md` | `dump;tap:Increment;tap:Increment;dump;exit` |
| `todo` | `02-api.md` §12 | `dump;type:What needs doing?=Buy milk;tap:Add;dump;toggle:Buy milk;dump;tap:×;dump;exit` |
| `styles` | `examples/styles` | `dump;exit` |
| `layouts` | `examples/layouts` | `dump;exit` |
| `layout-matrix` | `examples/layout-matrix` | `dump;exit` |
| `navigation` | `examples/navigation` | `dump;go:<a pushed route of the example>;dump;back;dump;exit` |
| `fetch` | `examples/fetch` | `dump;exit` (the request itself is checked by reading the log: see the M5 tasks) |
| `gestures` | `examples/gestures` | `dump;exit` |
| `native-components` | `examples/native-components` | `dump;exit` |
| `gauges`, `select` | `examples/gauges`, `examples/select` | `dump;exit`; `dump;tap:<the chosen option's label>;tap:<another option's label>;dump;exit` |

After a milestone, `scripts/test.sh <target> all` must pass for every example that exists so far: a later
milestone must not break an earlier example.

## Looking at it

The dump proves structure and placement, not looks. After each backend milestone, take one picture and look at
it; if you cannot view images, skip this and write `not looked at` in the README's status table.

| Target | Picture |
| --- | --- |
| web | Chrome with `--screenshot=build/shots/web-<example>.png --window-size=420,780` instead of `--dump-dom` |
| ios | `xcrun simctl io "iPhone 17 Pro" screenshot build/shots/ios-<example>.png` while the app runs |
| android | `adb exec-out screencap -p > build/shots/android-<example>.png` |
| macos, linux | `screencapture -x build/shots/screen.png` while the window is open (needs the Screen Recording permission; if the file is black or missing, skip) |

Compare with the web picture: backgrounds, borders, rounded corners, text colour and size, nothing clipped.
