# 05 — The native backends

A backend implements `nuclo.host.Backend` (`03-core.md`) for one toolkit and provides
`internal actual fun platformRunApp(entry: () -> Unit)`. It is the only code that touches the toolkit.

The same shape works for all five:

```kotlin
internal class XBackend : Backend {
    private val views = HashMap<ViewId, XView>()     // XView: the widget + what the backend remembers about it
    private var nextId = 1
    override fun create(kind: ViewKind): ViewId { val id = nextId++; views[id] = make(kind, id); return id }
    …
}
```

Rules for every backend:

- One `ViewId` ↔ one platform view. Keep `kind`, the last `Rect`, the last `Paint` and the listened inputs beside it.
- **Do not port the layout or the style code** of a reference runtime: the core already did both. From the
  references take only the toolkit calls: how a widget is made, painted, measured, how input is read.
- Implement the members of the milestone you are on; later members keep their default bodies.
- A layout pass is: for each shown root, `Host.measureRoot(root, width)` if the backend scrolls it, then
  `Host.layoutRoot(root, width, height)`. Run it when `requestLayout()` was called (coalesce to one pass per
  frame) and when the window's size changes.
- Paint only when asked (`paint`), and only what changed if the toolkit makes that cheap.
- The window is 420 × 780 logical pixels on the desktop unless `NUCLO_SIZE=<w>x<h>` says otherwise.
- `env(name)` must return `NUCLO_SCRIPT`, `NUCLO_TEST`, `NUCLO_SIZE` when given (see each platform).
- `log(line)` must reach where `scripts/test.sh` reads (see each platform).

Each section ends with the checks that prove the backend. `scripts/test.sh <target> <example>` is described in
`06-build-and-verify.md`.

---

## Android (`androidMain`)

**Reference:** `nuclo-native-ts/src/runtimes/android/NucloRuntime.kt`. It is Kotlin on Android Views already; the
backend is that file with the node tree, styles and `Flex` removed. Reuse, nearly verbatim: `Backdrop` (the
drawable that paints background, per-side borders, radius), `NText`, `Touch` (pointer, pan, pinch, long press,
double tap), `ScreenView`, the router's chrome inside `NRouter` (app bar, bottom bar, sheet), `NucloActivity`,
the `thread { HttpURLConnection }` fetch, image decoding in `A.src`.

| ViewKind | View |
| --- | --- |
| Box | A `ViewGroup` subclass whose `onLayout` places each child at its stored `Rect × density` and whose `onMeasure` reports its own stored size. A scrollable box is a `ScrollView` / `HorizontalScrollView` holding that group |
| Text | `TextView` (`NText`) |
| Button | `TextView`, centred, clickable |
| Input / Textarea | `EditText` (single line / `TYPE_TEXT_FLAG_MULTI_LINE`), background removed |
| Checkbox | `CheckBox` |
| Image | `ImageView` (`CENTER_CROP` / `FIT_CENTER` / `FIT_XY` for cover / contain / fill) |

- **Density**: `px = round(logical × density)`. Frames in, frames out (`frameOf`) and `measure` are logical.
- **measure**: `view.measure(makeMeasureSpec(maxWidthPx, AT_MOST), UNSPECIFIED)`, then `measuredWidth/Height ÷
  density`, minus the padding you set from `Paint.insets`. Text's height is `lineCount × lineHeight`.
- **paint**: `Backdrop` as the view's background; `elevation` or a shadow layer for `shadow`; `alpha`,
  `translationX/Y`, `rotation`, `scaleX/Y`; `clipToOutline` for `clip`; text paint on the `TextView` (size in dp
  via `setTextSize(COMPLEX_UNIT_DIP, …)`, `Typeface` for weight / italic / family, `setLineHeight`, colour, gravity,
  `maxLines` + `ellipsize`); `setPadding` from `insets`.
- **Timers / frames**: `Handler(Looper.getMainLooper()).postDelayed`; `Choreographer.getInstance().postFrameCallback`.
- **Layout pass**: `requestLayout()` posts one runnable; the screen's container calls `Host.layoutRoot` from its
  `onLayout` with its own size.
- **http**: `kotlin.concurrent.thread { HttpURLConnection … }`, result posted to the main handler.
- **env**: intent extras of the activity: `NUCLO_SCRIPT` → `intent.getStringExtra("NUCLO_SCRIPT")`, etc.
- **log**: `android.util.Log.i("nuclo", line)`. **exit**: `activity.finishAndRemoveTask()`.
- **Entry**: `open class NucloActivity(private val entry: () -> Unit) : Activity()`: in `onCreate`, create the
  backend with the activity, `setContentView(root container)`, `Host.start(backend, entry)`; register the
  back callback as the reference does. `platformRunApp(entry)` on Android just runs `entry()` (the activity
  already started the host). `:android`'s `MainActivity` is `class MainActivity : NucloActivity({ app.main() })`.
- **Navigation** (M4): a container with an app bar (56 dp: back arrow + title), the top screen's view, a bottom
  bar (64 dp) when there are tabs, a modal screen as a full-size sheet over all of it; system back →
  `navPop` + `Host.navPopped`. Port the look from `NRouter`.

Checks: `scripts/test.sh android counter` (and every later example).

---

## Apple: iOS (`iosMain`), macOS (`macosMain`), shared (`appleMain`)

**References:** `nuclo-native-ts/src/runtimes/ios/NucloRuntime.swift` for the UIKit calls;
`runtimes/macos/UIKitShim.swift` shows, name by name, which AppKit call stands in for each UIKit one.

`appleMain` may import only frameworks both platforms have (`platform.Foundation`, `platform.CoreGraphics`,
`platform.QuartzCore`, `platform.CoreText`, `platform.darwin`). Put there:

- `fun paintLayer(layer: CALayer, paint: Paint)`: `backgroundColor`, `cornerRadius`, `masksToBounds` for `clip`,
  `shadowColor / Radius / Offset / Opacity`, `opacity`, `setAffineTransform` (translate, rotate, scale), and
  per-side borders as four sublayers when the sides differ (one `borderWidth` / `borderColor` when they agree).
  Both `UIView.layer` and a layer-backed `NSView.layer` are `CALayer`s.
- `fun cgColor(rgba: UInt): CGColorRef`.
- `fun appleHttp(request, done)`: `NSURLSession.sharedSession.dataTaskWithRequest(…) { data, response, error -> }`,
  then `dispatch_async(dispatch_get_main_queue()) { done(…) }`.
- Timers: `NSTimer.scheduledTimerWithTimeInterval(seconds, repeats = false) { … }`, kept in a map by id.
- `env`: `NSProcessInfo.processInfo.environment[name] as? String`. `log`: `println`. `exit`: `platform.posix.exit`.
- `now()`: `NSDate().timeIntervalSince1970 * 1000`.

### iOS

| ViewKind | View |
| --- | --- |
| Box | `UIView` (a `UIScrollView` when made scrollable) |
| Text | `UILabel`, `numberOfLines = 0` |
| Button | `UILabel` in a `UIView` with a tap recogniser (the reference's `NButton`) |
| Input | `UITextField` · Textarea: `UITextView` |
| Checkbox | `UISwitch` |
| Image | `UIImageView` (`contentMode` for the fit) |

- **Frames**: `view.setFrame(CGRectMake(x, y, w, h))`; `translatesAutoresizingMaskIntoConstraints` stays true; no
  auto layout anywhere.
- **measure**: `label.sizeThatFits(CGSizeMake(maxWidth, CGFLOAT_MAX))`; height from the line count × line height.
- **Text paint**: an `NSAttributedString` with font, colour, paragraph style (min/max line height, alignment),
  kern, underline / strikethrough.
- **Input**: `UITapGestureRecognizer` etc. with a Kotlin `NSObject` target holding the `ViewId`:
  `@ObjCAction fun tapped(sender: UIGestureRecognizer)` and `NSSelectorFromString("tapped:")`. Field text:
  `addTarget(target, action, UIControlEventEditingChanged)`.
- **Frames per second**: `CADisplayLink.displayLinkWithTarget(target, NSSelectorFromString("tick:"))`.
- **Layout pass**: the root view controller's view is a `UIView` subclass overriding `layoutSubviews`; it calls
  `Host.layoutRoot` with its bounds inside the safe area. `requestLayout()` → `setNeedsLayout()`.
- **Navigation** (M4): `UINavigationController` per tab inside a `UITabBarController` (no tab bar controller
  when there are no tabs); a modal route with `presentViewController`; the back button and edge swipe report
  `Host.navPopped` (a `UINavigationControllerDelegate`).

**Entry — verified on the iOS 26 simulator with Kotlin 2.4.21:**

```kotlin
package nuclo

import kotlinx.cinterop.*
import platform.Foundation.NSStringFromClass
import platform.UIKit.*

private var pendingEntry: (() -> Unit)? = null

class NucloAppDelegate : UIResponder, UIApplicationDelegateProtocol {
    @OverrideInit constructor() : super()
    companion object : UIResponderMeta(), UIApplicationDelegateProtocolMeta
    private var _window: UIWindow? = null
    override fun window() = _window
    override fun setWindow(window: UIWindow?) { _window = window }
    override fun application(application: UIApplication, didFinishLaunchingWithOptions: Map<Any?, *>?): Boolean {
        val w = UIWindow(frame = UIScreen.mainScreen.bounds)
        w.rootViewController = UIViewController()      // replace with the backend's root controller
        w.makeKeyAndVisible()
        _window = w
        pendingEntry?.invoke()                         // Host.start(UIKitBackend(w), entry)
        return true
    }
}

internal actual fun platformRunApp(entry: () -> Unit) {
    pendingEntry = entry
    memScoped { autoreleasepool { UIApplicationMain(0, null, null, NSStringFromClass(NucloAppDelegate)) } }
}
```

The executable is wrapped into an `.app` by `scripts/run.sh` (an `Info.plist` and the binary; no Xcode project).
`println` output is read with `xcrun simctl launch --console-pty`; environment variables reach the app when
prefixed with `SIMCTL_CHILD_`.

### macOS

| ViewKind | View |
| --- | --- |
| Box | A flipped, layer-backed `NSView` subclass (`override fun isFlipped() = true`, `wantsLayer = true`); `NSScrollView` when scrollable |
| Text | `NSTextField` label (not editable, not bezeled, no background), wrapping |
| Button | The same label in a box with a click recogniser |
| Input | `NSTextField` (bezel off) · Textarea: `NSTextView` in an `NSScrollView` |
| Checkbox | `NSButton` with `setButtonType(NSButtonTypeSwitch)`, 20 × 20 |
| Image | `NSImageView` |

- The mouse stands in for touches: `NSClickGestureRecognizer`, `NSPanGestureRecognizer`,
  `NSMagnificationGestureRecognizer`; hover with an `NSTrackingArea`.
- **measure**: `cell.cellSizeForBounds(NSMakeRect(0, 0, maxWidth, 10000))`.
- Frames per second: an `NSTimer` every 1/60 s while a frame is requested.
- **Layout pass**: the window's content view overrides `layout()` (or observes
  `NSViewFrameDidChangeNotification`); `requestLayout()` → `setNeedsLayout(true)`.
- **Navigation** (M4): plain views, as on Android: a 56 pt bar, the top screen, a 64 pt tab bar, a sheet.
- A window size: `NUCLO_SIZE`, default 420 × 780 content.

**Entry — verified:**

```kotlin
internal actual fun platformRunApp(entry: () -> Unit) {
    if (getenv("NUCLO_HEADLESS")?.toKString() == "1") { /* HeadlessBackend, see 03-core.md */ }
    val app = NSApplication.sharedApplication
    app.setActivationPolicy(NSApplicationActivationPolicy.NSApplicationActivationPolicyRegular)
    val window = NSWindow(NSMakeRect(0.0, 0.0, 420.0, 780.0),
        NSWindowStyleMaskTitled or NSWindowStyleMaskClosable or NSWindowStyleMaskResizable, NSBackingStoreBuffered, false)
    window.title = "nuclo"
    // Host.start(AppKitBackend(window), entry)
    window.makeKeyAndOrderFront(null)
    app.run()
}
```

Run the plain executable (`app/build/bin/macosArm64/debugExecutable/nuclo-<example>.kexe`): it opens its window
without an `.app` bundle, and its `println` goes to the terminal.

Checks: `scripts/test.sh macos <example>`, `scripts/test.sh ios <example>`.

---

## Linux: GTK 4 + libadwaita (`nuclo/src/gtk/kotlin/nuclo/gtk/`)

**Reference:** `nuclo-native-ts/src/runtimes/rust/src/gtk_backend.rs` (1,269 lines). Port it function by
function: it implements the same contract with the same widgets. It is written with gtk-rs; you call the C API
through cinterop, so `gtk::Label::new()` becomes `gtk_label_new(null)` and a closure becomes a
`staticCFunction` plus a `StableRef`.

These sources are compiled twice: into `linuxMain` on a Linux host, and by `:gtk-preview` on macOS against
Homebrew's GTK, which is how you develop and check the backend on this machine. Therefore they may use only the
**public** API of `:nuclo` and the cinterop package `gtk`.

| ViewKind | Widget |
| --- | --- |
| Box / Native | `NucloBox`: a `GtkBox` subclass registered from Kotlin, with the `NucloLayout` manager below |
| Text | `GtkLabel`, wrap on (`PANGO_WRAP_WORD_CHAR`), `xalign` 0, `can_target` false |
| Button | `GtkButton` holding a `GtkLabel`, chrome removed with a CSS class |
| Input | `GtkEntry` · Textarea: `GtkTextView` |
| Checkbox | `GtkCheckButton` |
| Image | `GtkPicture` |
| scrollable Box | `GtkScrolledWindow` holding a `NucloBox` |

**Placing children at exact frames — verified from Kotlin/Native (label at 24,24 200×18, button at 24,58
372×40, a click reaching Kotlin):**

```kotlin
import gtk.*
import kotlinx.cinterop.*

/** Frames by widget address: what the layout manager allocates. */
val frames = HashMap<Long, IntArray>()                      // x, y, w, h
fun key(w: CPointer<GtkWidget>?) = w.rawValue.toLong()

private fun layoutMeasure(manager: CPointer<GtkLayoutManager>?, widget: CPointer<GtkWidget>?, orientation: GtkOrientation, forSize: Int,
                          minimum: CPointer<IntVar>?, natural: CPointer<IntVar>?, minBaseline: CPointer<IntVar>?, natBaseline: CPointer<IntVar>?) {
    val f = frames[key(widget)]
    val size = if (f == null) 0 else if (orientation == GtkOrientation.GTK_ORIENTATION_HORIZONTAL) f[2] else f[3]
    minimum?.pointed?.value = size
    natural?.pointed?.value = size
}

private fun layoutAllocate(manager: CPointer<GtkLayoutManager>?, widget: CPointer<GtkWidget>?, width: Int, height: Int, baseline: Int) {
    var child = gtk_widget_get_first_child(widget)
    while (child != null) {
        val f = frames[key(child)]
        if (f != null) memScoped {
            val a = alloc<GtkAllocation>()
            a.x = f[0]; a.y = f[1]; a.width = f[2]; a.height = f[3]
            gtk_widget_size_allocate(child, a.ptr, -1)
        }
        child = gtk_widget_get_next_sibling(child)
    }
}

private fun layoutClassInit(klass: gpointer?, data: gpointer?) {
    val c = klass!!.reinterpret<GtkLayoutManagerClass>().pointed
    c.measure = staticCFunction(::layoutMeasure)
    c.allocate = staticCFunction(::layoutAllocate)
}

val nucloLayoutType: GType by lazy {
    g_type_register_static_simple(gtk_layout_manager_get_type(), "NucloLayout", sizeOf<GtkLayoutManagerClass>().toUInt(),
        staticCFunction(::layoutClassInit), sizeOf<GtkLayoutManager>().toUInt(), null, 0u)
}

fun box(): CPointer<GtkWidget> {
    val w = gtk_box_new(GtkOrientation.GTK_ORIENTATION_VERTICAL, 0)!!
    gtk_widget_set_layout_manager(w, g_object_new(nucloLayoutType, null)!!.reinterpret())
    return w
}

// A signal reaching Kotlin state:
private fun clicked(button: CPointer<GtkButton>?, data: gpointer?) { val id = data!!.asStableRef<ViewRef>().get().id /* Host.event(id, Click) */ }
// g_signal_connect_data(button, "clicked", staticCFunction(::clicked).reinterpret(), StableRef.create(ref).asCPointer(), null, 0u)

// Reading a frame back for frameOf():
// memScoped { val r = alloc<graphene_rect_t>(); gtk_widget_compute_bounds(child, parent, r.ptr); r.origin.x … r.size.width … }
```

Children are added with `gtk_box_append` and removed with `gtk_box_remove`; `setFrame` stores into `frames` and
calls `gtk_widget_queue_allocate(parent)`.

**Painting a box.** The Rust backend overrides the widget's `snapshot`. Do the same with the technique above:
register `NucloBox` with `g_type_register_static_simple(gtk_box_get_type(), "NucloBox", sizeOf<GtkBoxClass>() …)`
and in its class-init set `klass.reinterpret<GtkWidgetClass>().pointed.snapshot = staticCFunction(::boxSnapshot)`.
In `boxSnapshot`: look the `Paint` up by widget address; `gtk_snapshot_append_outset_shadow`,
`gtk_snapshot_push_rounded_clip` + `gtk_snapshot_append_color` for the background, `gtk_snapshot_append_border`;
then draw each child with `gtk_widget_snapshot_child`; pop the clip. Opacity is `gtk_widget_set_opacity`;
transforms are a `gtk_snapshot_transform` around the children, as the reference does. (The class-init override is
the same mechanism as the verified layout manager; the snapshot body itself has not been run from Kotlin.)

- **Text paint**: a `PangoAttrList` on the label (size, weight, style, family, colour, letter spacing,
  underline, strikethrough) plus `gtk_label_set_lines` / ellipsize; line height with
  `pango_attr_line_height_new_absolute`.
- **measure**: `gtk_widget_measure(widget, GTK_ORIENTATION_HORIZONTAL, -1, …)` for the natural width, then
  `gtk_widget_measure(widget, GTK_ORIENTATION_VERTICAL, min(natural, maxWidth), …)` for the height.
- **Input**: `GtkGestureClick`, `GtkGestureDrag`, `GtkGestureZoom`, `GtkGestureLongPress`,
  `GtkEventControllerMotion`, `GtkEventControllerKey`, `GtkEventControllerFocus`, added with
  `gtk_widget_add_controller`; `"changed"` / `"activate"` on the entry, `"toggled"` on the check button.
- **Timers**: `g_timeout_add(ms, staticCFunction, stableRef)` returning 0 to run once. Frames:
  `gtk_widget_add_tick_callback`. Hopping to the UI thread: `g_idle_add`.
- **Layout pass**: `requestLayout()` → `g_idle_add` once; the pass reads the window's content size.
- **http** (M5): `GSubprocess` running `curl -s -i -X <method> …` and `g_subprocess_communicate_async`. Mark it
  `// ponytail: curl subprocess; libsoup when the POC needs streaming or cookies`. GTK has no HTTP client of its
  own, and libsoup would be a new dependency.
- **Navigation** (M4): `AdwNavigationView` per tab under an `AdwHeaderBar`, `AdwViewSwitcherBar`-style bottom
  bar, `AdwDialog` for a modal — as the reference. Its `"popped"` signal reports `Host.navPopped`.
- **Entry**: `fun runGtkApp(entry: () -> Unit)`: `adw_application_new("dev.nuclo.app", G_APPLICATION_DEFAULT_FLAGS)`,
  connect `"activate"`, in it create the `GtkApplicationWindow` (default size from `NUCLO_SIZE`), set its child,
  `Host.start(GtkBackend(window), entry)`, `gtk_window_present`; then `g_application_run`. The headless check
  comes first, as on macOS. `linuxMain`'s `platformRunApp(entry)` is `runGtkApp(entry)`.
- **env**: `getenv`. **log**: `println`. **exit**: `g_application_quit(g_application_get_default())` then `exit`.

Checks on macOS: `scripts/test.sh linux <example>` (it runs `:gtk-preview`). On a Linux host the same command
runs the real `linuxX64` executable.

---

## Windows: Win32 (`mingwMain`)

There is no Kotlin reference for Windows. `nuclo-native/hosts/windows/Program.cs` (WPF) shows the expected
behaviour of each control; the API you call is Win32, from `platform.windows`, `platform.gdiplus` and
`platform.winhttp`, which ship with Kotlin/Native.

The executable is **cross-compiled and linked on this machine and never launched**. Write it carefully, keep
it simple, and do not claim it works: its checks are that it compiles and links with zero warnings about
unresolved symbols.

Design: **one top-level window that paints every box, text and image itself** (as WPF and WinUI do: their
elements are windowless too), plus a real child control for each field.

| ViewKind | Implementation |
| --- | --- |
| Box, Text, Button, Image, Native-less content | A record in the backend's tree, painted in `WM_PAINT` with GDI+ (`GdipFillPath` on a rounded-rectangle path, `GdipDrawString` with a `GdipCreateFont…`, `GdipDrawImageRectI`), into a memory bitmap that is blitted (no flicker) |
| Input | A child `EDIT` control (`CreateWindowExW(0, "EDIT", …, WS_CHILD or WS_VISIBLE or ES_AUTOHSCROLL, …)`) |
| Textarea | `EDIT` with `ES_MULTILINE or ES_AUTOVSCROLL or ES_WANTRETURN` |
| Checkbox | A child `BUTTON` with `BS_AUTOCHECKBOX` |

- **Frames**: stored per record; child controls are moved with `SetWindowPos` to their frame in window
  coordinates (add up the ancestors, subtract scroll offsets). `frameOf` returns the stored frame for painted
  views and `GetWindowRect` → `ScreenToClient` (converted to parent-relative) for controls.
- **DPI**: `SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2)`; scale =
  `GetDpiForWindow(hwnd) / 96f`; logical × scale when drawing and positioning.
- **measure**: `GdipMeasureString` with the layout width.
- **Hit testing**: on `WM_LBUTTONDOWN / UP`, `WM_MOUSEMOVE`, walk the tree from the top-most child backwards
  (respecting `Paint.pointer` and clip) to the deepest view that listens; report `Click` on up over the same view.
  `EN_CHANGE` / `BN_CLICKED` arrive as `WM_COMMAND` for the child controls.
- **Scrolling**: an offset per scrollable box, changed by `WM_MOUSEWHEEL`, applied while painting and positioning.
- **Timers**: `SetTimer(hwnd, id, ms, null)` → `WM_TIMER` → `KillTimer` and run. Frames: a 16 ms timer.
  Layout pass: `PostMessageW(hwnd, WM_APP + 1, …)` once per request, and on `WM_SIZE`.
- **http** (M5): WinHTTP on a thread created with `CreateThread`; the result is posted with `PostMessageW` and
  picked up in the window procedure.
- **Navigation** (M4): painted, as on macOS and Android: a 56 px bar, the top screen, a 64 px tab bar, a sheet.
- **Strings**: `memScoped { "text".wcstr.ptr }`. The window procedure is
  `staticCFunction(::wndProc)`; the backend is a top-level `var` it reads.
- **env**: `getenv`. **log**: `println`. **exit**: `PostQuitMessage(0)`.

**Entry — the message loop compiles and links for `mingwX64` from macOS (verified):**

```kotlin
internal actual fun platformRunApp(entry: () -> Unit) {
    if (getenv("NUCLO_HEADLESS")?.toKString() == "1") { /* HeadlessBackend */ }
    // RegisterClassExW + CreateWindowExW, GdiplusStartup, Host.start(Win32Backend(hwnd), entry), ShowWindow
    memScoped {
        val msg = alloc<MSG>()
        while (GetMessageW(msg.ptr, null, 0u, 0u) != 0) { TranslateMessage(msg.ptr); DispatchMessageW(msg.ptr) }
    }
}
```

Checks: `scripts/test.sh windows <example>` (link only; it prints `windows: linked, not run`).
