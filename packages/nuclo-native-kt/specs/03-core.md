# 03 — The core, the backend contract, the test harness

The core is `nuclo/src/uiMain/kotlin/nuclo/`. It is compiled for Android and every Kotlin/Native target, so it
may use **only the Kotlin standard library**: no `java.*`, no `platform.*`, no `android.*`.

It is a port. The structure comes from the Rust core (`nuclo-native-ts/src/runtimes/rust/src/nuclo/`), which is
already split from its toolkit; the Kotlin wording of most functions exists in
`nuclo-native-ts/src/runtimes/android/NucloRuntime.kt`, where the same logic is tied to Android Views. Port
function by function; do not redesign.

## Files

| Kotlin file (uiMain) | Port of | Holds |
| --- | --- | --- |
| `host/Backend.kt` | `backend.rs` | `Backend`, `Host`, `Paint`, `TextPaint`, `Rect`, enums (below, verbatim) |
| `host/HeadlessBackend.kt` | — | The recording backend used by tests and by `NUCLO_HEADLESS=1` |
| `host/Harness.kt` | — | `NUCLO_SCRIPT`, the dump (below) |
| `core/Computed.kt` | `style.rs` | A `Style` resolved to floats and packed colours; colour parsing; tag default styles; inheritance |
| `core/LiveNode.kt` | `node.rs` | The live tree: mounting descriptors, bindings, text, states, paint, destroy |
| `core/Reconcile.kt` | `node.rs` (list / when / region / into parts) | Fragments that own no view |
| `core/Flex.kt` | `flex.rs` (and `object Flex` in `NucloRuntime.kt`) | The layout |
| `core/Runtime.kt` | `node.rs` (`Runtime`, `tick`, roots) | Roots, `update()`, scopes, the layout pass, media restyle |
| `core/Motion.kt` | `node.rs` (`Motion`, `Keyframes`, `ease`, `bezier`) | Transitions and keyframes (M6) |
| `core/RouterImpl.kt` | `router.rs` | The router's stacks (M4) |
| `core/Tasks.kt` | `task.rs` | Timers, frames, fetch (M5) |
| `Engine.ui.kt` | — | The `actual` functions of `commonMain`'s `Engine.kt` |

## The live tree

Mounting a descriptor produces a `LiveNode`:

```kotlin
internal class LiveNode(val kind: Kind?, val tag: String) {   // kind == null: a fragment (list / when / region / into): no view
    var view: ViewId = 0                  // 0 for fragments
    var parent: LiveNode? = null
    val children = ArrayList<LiveNode>()
    val bindings = ArrayList<Binding<*>>()
    // style sources, computed style, last Paint, last frame, scopes, handlers, mount/destroy callbacks, state flags…
}
internal class Binding<T>(val get: () -> T, val apply: (T) -> Unit) { var last: Any? = UNSET }
```

- **Mount** (`mount(desc: Node): LiveNode`): `backend.create(kind)` (an `input` whose `type` is `"checkbox"` is
  created as `ViewKind.Checkbox`), then apply the descriptor's children in
  order: a `Node` child is mounted and appended; a `Mod` is applied with an exhaustive `when (mod)`; text
  functions are joined into one binding that calls `backend.setText`. After the children: resolve the style,
  `backend.paint`, `backend.setChildren`.
- **Bindings**: every dynamic value is a `Binding`. `update()` runs `get()`, compares with `last` using `==`
  and calls `apply` only on a change (`forceUpdate()` always applies). A dynamic `style { }` binding compares the
  resolved `Computed`, not the `Style` object.
- **Fragments**: `list`, `when_`, `region`, `into` mount a fragment node. A fragment has no view; its children's
  views belong to the nearest ancestor with a view (`flat_views` in `node.rs`). After a fragment changes, that
  ancestor calls `backend.setChildren(view, flattenedChildViews)`.
- **`list`**: keep `(item, LiveNode)` rows. On update compute the new item list; reuse the row of an item that
  is still there (matched by `sameItem`: `==` for `String`, `Number`, `Boolean`, `Char`, otherwise `===`); mount
  rows for new items; destroy rows whose item is gone; reorder. Rows mounted during an update do not run their
  bindings again in that update.
- **`when_`**: evaluate conditions in order; if the open branch index changed, destroy the old branch's nodes
  and mount the new branch's content.
- **`region` / `into`**: a registry `id → RegionState` in `Runtime`. `into` registers its content while mounted;
  the region shows the newest (or all, when `stack`), or its `empty` content.
- **`scope`**: the node records its ids. `update("a")` runs bindings and fragments only in subtrees of nodes
  whose scopes contain `"a"`.
- **Destroy**: run cleanups and `onDestroy`, destroy children, `backend.destroy(view)`.
- **Lifecycle**: `onMount` runs once the node is under a root that is shown (`mount_deep` in `node.rs`).
- **Events**: `Host.event(view, …)` looks the node up in `Runtime.byView: HashMap<ViewId, LiveNode>` and calls
  its handlers. For `Input` / `Change`, the event's `InputTarget` is read from `backend.controlText(view)` /
  `backend.controlChecked(view)`. Core asks `backend.listen(view, InputKind.X)` the first time a handler of that
  kind is added to a node. A node whose `disabled` attribute holds ignores `Click`.
- **Images** (M5): a `src` binding downloads the URL with `backend.http` (GET) and hands the bytes to
  `backend.setImage`; a failed download clears the image.
- **States** (M3): `pressed` comes from `Host.pointer` Down/Up/Cancel, `hover` from `Host.hover`, `focused` from
  `ViewEvent.Focus` / `Blur`, `disabled` / `checked` from the node's own attributes, the structural ones (`first`,
  `last`, `only`, `odd`, `even`, `empty`) from the node's place among its parent's children. A state change
  re-resolves and repaints only that node (and re-lays-out if a layout key changed).
- **Media** (M3): `Runtime` remembers the last `backend.windowWidth()`. When `Host.layoutRoot` is called with a
  different width, every node whose style has media rules is re-resolved before the layout.

## Layout

`Flex.layout(root, width, height)` computes a frame for every view, relative to its parent **view**'s content
origin. Port `flex.rs` (274 lines) together with `measure` / `place` in `node.rs`; `object Flex` in
`NucloRuntime.kt` is the same algorithm in Kotlin with Android measuring mixed in.

- Units are logical pixels as `Float` inside the algorithm. A frame handed to the backend is **rounded to whole
  logical pixels** (`Rect` of `Int`): round the edges (`x`, `x + w`), not the sizes, so neighbours never gap.
- A leaf (text, button, input, image…) is measured with `backend.measure(view, maxWidth)`, which returns the
  content size **without** padding and border; the core adds `Paint.insets`.
- `backend.requestLayout()` is called after any change that can move a box. The backend answers, on its next
  layout pass, with `Host.layoutRoot(root, width, height)` for each root it shows. Layout is never run
  synchronously inside `update()`.
- A scrollable box (`overflow = Scroll`): `backend.makeScrollable(view, horizontal)` right after `create`, before
  it gets children; after layout `backend.setContentSize(view, w, h)`.
- A root passed to `showScreen` that is not itself scrollable is scrolled by the backend: the backend asks
  `Host.measureRoot(root, width)` for its natural height and lays it out at `max(natural, viewportHeight)`.

### Test metrics

When `Runtime.testMode` is on (`NUCLO_TEST=1`, and always in `HeadlessBackend`), the core does **not** call
`backend.measure`. It uses these sizes, so every target computes identical frames:

| Kind | Content size |
| --- | --- |
| Text, Button | `cw = fontSize × 0.5`; `perLine = max(1, floor(maxWidth / cw))`; split the text on `\n`, each part takes `max(1, ceil(length / perLine))` lines; width `= ceil(min(longestPart, perLine) × cw)`; height `= lines × lineHeight`, limited by `numberOfLines` |
| Input | 144 × lineHeight |
| Textarea | 144 × 3 × lineHeight |
| Checkbox (an `input` with `type("checkbox")`) | 20 × 20 |
| Image | 120 × 120 |
| Native | 100 × 40 |

In test mode transitions and keyframe animations are applied at their end value immediately.

## The backend contract (`host/Backend.kt`)

Write this file as given. Members marked with a milestone have a default body so that a backend compiles before
it implements them; a backend overrides them when its milestone task says so. `Host`'s functions are listed
without bodies: they are the core's entry points, and you implement them (empty at first, then milestone by
milestone).

```kotlin
package nuclo.host

typealias ViewId = Int      // > 0; the backend's handle for a view. The core never sees a widget.

enum class ViewKind { Box, Text, Button, Input, Checkbox, Textarea, Image, Native }

/** A frame in whole logical pixels, relative to the parent view's content. */
class Rect(val x: Int, val y: Int, val w: Int, val h: Int)
class Size(val w: Float, val h: Float)

/** Colours are packed 0xRRGGBBAA. */
class Shadow(val color: UInt, val blur: Float, val dx: Float, val dy: Float)

class TextPaint(
    val fontSize: Float, val weight: Int /* 100…900 */, val italic: Boolean,
    val family: String /* "sans-serif" | "serif" | "monospace" | a font name */,
    val lineHeight: Float, val letterSpacing: Float,
    val underline: Boolean, val strike: Boolean,
    val color: UInt, val align: Int /* 0 left, 1 center, 2 right */,
    val lines: Int /* 0 = unlimited; else cut with an ellipsis */,
    val placeholderColor: UInt? /* null = the platform's */,
)

/** How a view looks: its computed style, resolved to what a toolkit draws. Compare with equals() to skip work. */
class Paint(
    val background: UInt?,
    val borders: FloatArray /* top, right, bottom, left widths; drawn inside the box */,
    val borderColors: IntArray /* 4 × 0xRRGGBBAA as Int bits */,
    val radius: Float /* clamp to half the smaller side when drawing */,
    val clip: Boolean /* children are clipped to the rounded box */,
    val shadow: Shadow?,
    val opacity: Float,
    val visible: Boolean /* false = display none: hide the view */,
    val pointer: Boolean /* false = neither the view nor anything in it takes the pointer */,
    val fit: Int /* images: 0 cover, 1 contain, 2 fill */,
    val translateX: Float, val translateY: Float, val rotate: Float /* degrees, clockwise */, val scale: Float,
    val text: TextPaint,
    val insets: FloatArray /* padding + border: top, right, bottom, left. Text and field content is drawn inside */,
)   // implement equals() / hashCode() by content

enum class ViewEvent { Click, Input, Change, Focus, Blur }
enum class InputKind { Click, Pointer, Pan, Pinch, LongPress, DoubleClick, Hover, Keys, Scroll }
enum class PointerPhase { Down, Move, Up, Cancel, LongPress, DoubleClick }

class TabInfo(val title: String, val icon: String)
class Screen(val root: ViewId, val title: String, val modal: Boolean, val header: Boolean)
class HttpRequest(val method: String, val url: String, val headers: Map<String, String>, val body: String?)
/** status 0 and error != null when there was no HTTP answer. */
class HttpResult(val status: Int, val body: ByteArray, val error: String?)

interface Backend {
    // ---- views (M1)
    fun create(kind: ViewKind): ViewId
    fun destroy(view: ViewId)
    /** `children` in order. Only views that arrive or leave need touching: frames place them. */
    fun setChildren(parent: ViewId, children: IntArray)
    fun setFrame(view: ViewId, frame: Rect)
    fun paint(view: ViewId, kind: ViewKind, paint: Paint)
    /** Content size of a non-box view without Paint.insets: text wrapped at maxWidth, a control's natural size.
     *  Uses the TextPaint last given to paint(). */
    fun measure(view: ViewId, maxWidth: Float): Size
    fun setText(view: ViewId, text: String)
    /** The view reports this kind of input from now on, through Host. */
    fun listen(view: ViewId, input: InputKind)

    // ---- windows (M1)
    /** Shows `root` as the app's main view: as wide as the window, as tall as its content or the window,
     *  scrolling vertically (unless `root` was made scrollable itself: then it fills the window). */
    fun showScreen(root: ViewId)
    /** The roots' frames are stale: run a layout pass soon, calling Host.layoutRoot for each root. */
    fun requestLayout()
    /** The window's content width in logical pixels, now. */
    fun windowWidth(): Float

    // ---- the main loop (M1)
    /** Runs `callback` once on the UI thread after `ms` milliseconds. Returns an id > 0. */
    fun setTimer(ms: Int, callback: () -> Unit): Int
    fun clearTimer(timer: Int)
    fun log(line: String)
    /** Milliseconds since the epoch. */
    fun now(): Double

    // ---- the harness (M1)
    /** The frame the real view has now, relative to its parent view, in logical pixels: read it back from the
     *  toolkit, do not return the stored Rect. */
    fun frameOf(view: ViewId): Rect
    /** A configuration value: an environment variable on the desktop and iOS, an intent extra on Android. */
    fun env(name: String): String?
    /** Ends the app. */
    fun exit(code: Int)

    // ---- controls (M2)
    fun setValue(view: ViewId, text: String) {}
    fun setPlaceholder(view: ViewId, text: String) {}
    fun setChecked(view: ViewId, checked: Boolean) {}
    fun setEnabled(view: ViewId, enabled: Boolean) {}
    /** "text", "password", "email" or "number". */
    fun setInputType(view: ViewId, inputType: String) {}
    /** What assistive technology reads for the view. */
    fun setLabel(view: ViewId, label: String) {}
    fun controlText(view: ViewId): String = ""
    fun controlChecked(view: ViewId): Boolean = false
    /** Opens a link with the platform. */
    fun openUrl(url: String) {}
    /** Shows `root` over everything, the size of the window; the pointer passes where it has no view. */
    fun showOverlay(root: ViewId) {}

    // ---- layout extras (M3)
    /** Makes a box scroll its children along one axis with the platform's scrolling. Called before it has children. */
    fun makeScrollable(view: ViewId, horizontal: Boolean) {}
    fun setContentSize(view: ViewId, width: Int, height: Int) {}
    /** The drawing (and hit) order of `parent`'s children, lowest first, when zIndex changes it. */
    fun reorder(parent: ViewId, children: IntArray) {}

    // ---- navigation (M4)
    /** One stack per tab (a single stack and no tab bar when `tabs` is empty); `active` is selected. */
    fun navCreate(tabs: List<TabInfo>, active: Int) { error("navigation is not implemented by this backend") }
    fun navPush(tab: Int, screen: Screen, animated: Boolean) {}
    fun navPop(tab: Int, animated: Boolean) {}
    /** Makes `screen` the only screen of `tab`'s stack. */
    fun navReplace(tab: Int, screen: Screen) {}
    fun navSelectTab(tab: Int) {}

    // ---- async (M5)
    /** Runs `callback` once before the next frame is drawn; `timeMs` is now(). Returns an id > 0. */
    fun requestFrame(callback: (timeMs: Double) -> Unit): Int = setTimer(16) { callback(now()) }
    fun cancelFrame(frame: Int) = clearTimer(frame)
    /** An HTTP exchange off the UI thread; `done` is called on the UI thread. */
    fun http(request: HttpRequest, done: (HttpResult) -> Unit) { done(HttpResult(0, ByteArray(0), "no network on this backend")) }
    /** An encoded image (PNG, JPEG…) the core downloaded through http(); an empty array clears it. */
    fun setImage(view: ViewId, bytes: ByteArray) {}

    // ---- native components (M7)
    /** Takes a view the app's platform code made as a ViewKind.Native view. */
    fun adopt(native: Any): ViewId = error("native components are not implemented by this backend")
    /** The platform object behind a view, for NativeElement.handle. */
    fun handleOf(view: ViewId): Any = view
}

/** What a backend calls. Always on the UI thread. */
object Host {
    /** Installs the backend and runs the app's entry. A backend's platformRunApp calls it once its window exists. */
    fun start(backend: Backend, entry: () -> Unit)
    /** The natural height of a root laid out `width` wide. */
    fun measureRoot(root: ViewId, width: Float): Float
    /** Lays a root out in width × height: every view under it gets setFrame. */
    fun layoutRoot(root: ViewId, width: Float, height: Float)

    fun event(view: ViewId, event: ViewEvent)
    // M3 (Down, Up and Cancel, for the `pressed` state; Move, LongPress and DoubleClick arrive in M6)
    fun pointer(view: ViewId, phase: PointerPhase, event: nuclo.PointerEvent)
    fun hover(view: ViewId, over: Boolean)
    // M4
    /** The screen `root` left `tab`'s stack: report every pop, the user's and the ones navPop asked for. */
    fun navPopped(tab: Int, root: ViewId)
    fun navTabSelected(tab: Int)
    // M6
    fun pan(view: ViewId, event: nuclo.PanEvent)
    fun pinch(view: ViewId, event: nuclo.PinchEvent)
    fun key(view: ViewId, key: String)
    fun scrolled(view: ViewId, event: nuclo.ScrollEvent)
    // M8
    /** The screen whose root is `root` is scrolled `top` px down and shows `visible` px. */
    fun screenScrolled(root: ViewId, top: Float, visible: Float)
}
```

`Backend`, `Host` and every type above are **public**: the GTK backend is also compiled by another module.

### What every backend must get right

1. **Frames are law.** A view sits exactly at the `Rect` it was given, relative to its parent view. The toolkit's
   own layout (auto-layout, layout managers, `LinearLayout`…) must not move or resize it.
2. **A box draws only its `Paint`**: background inside the rounded rectangle, borders inside the box, the shadow
   outside. Text is drawn inside `insets`.
3. **`measure` answers for the current text and the last `TextPaint`.** Width is the widest line, rounded **up**;
   height is `lines × lineHeight`.
4. **Events report, the core decides.** A backend never changes app state. It calls `Host.event(view, Click)` and
   so on, only for the kinds `listen` asked for.
5. **`setValue` / `setChecked` from the core must not echo** an `Input` / `Change` event back.
6. **`setValue` with the text the field already shows does nothing** (the caret would jump).
7. Logical pixels in, logical pixels out. On Android multiply by the display density when talking to Views and
   divide when reporting.

## `HeadlessBackend` (`host/HeadlessBackend.kt`)

A complete `Backend` with no toolkit. It is both the test double and the reference the real backends are
compared against.

- Keeps, per view: kind, children, frame, last `Paint`, text, value, checked, enabled, listened inputs.
- `measure` is never called (test mode is always on); return `Size(0f, 0f)`.
- The window is `NUCLO_SIZE` (`"420x780"` by default; settable through its constructor in tests).
- `showScreen(root)`: remembers the root. A layout pass calls `Host.measureRoot` then
  `Host.layoutRoot(root, width, max(natural, height))`.
- A virtual clock: `setTimer` queues `(dueTime, callback)`; `requestLayout` and `requestFrame` queue for
  `now + 16`. `fun run()` pops the earliest entry, advances the clock to its due time and runs it, until the queue
  is empty or `exit` was called. No real sleeping: a 5-second script runs in milliseconds.
- `http` answers with the error `"no network in headless"`.
- `frameOf` returns the stored frame. `env` reads the constructor's map. `log` appends to a list and prints.
- Test helpers: `fun click(view)`, `fun input(view, text)`, `fun find(text: String): ViewId`,
  `fun texts(): List<String>`, `fun frame(view): Rect`, `fun paintOf(view): Paint`.

On the desktop targets `platformRunApp` starts with:

```kotlin
if (getenv("NUCLO_HEADLESS") == "1") { val b = HeadlessBackend(env = ::getenv); Host.start(b, entry); b.run(); exit(0) }
```

## The harness (`host/Harness.kt`)

`Host.start` reads `backend.env("NUCLO_SCRIPT")`. When it is set, the harness runs it after the first layout
pass. This is how every target is driven and checked without a human.

A script is commands separated by `;`. Each runs 100 ms after the previous one finished (through
`backend.setTimer`), so a layout pass happens in between.

| Command | Does |
| --- | --- |
| `tap:<text>` | Finds the first view, in tree order over all roots, whose text or accessibility label equals `<text>`; walks up to the nearest node with a click handler; fires it as `Host.event(view, Click)` |
| `type:<placeholder>=<text>` | Finds the first Input / Textarea with that placeholder; `backend.setValue`, then fires `Input` with that text |
| `enter:<placeholder>` | Fires `Change` on that field |
| `toggle:<label>` | Finds the checkbox with that accessibility label; `backend.setChecked(!current)`, then fires `Change` |
| `go:<path>` / `back` | Calls the shown router |
| `wait:<ms>` | Waits |
| `dump` | Prints a dump block (below) |
| `exit` | Logs the line `NUCLO_EXIT`, then `backend.exit(0)` |

An unknown command or a target that is not found prints `NUCLO_SCRIPT_ERROR <command>: <reason>` and exits with
code 1. `NUCLO_TEST=1` turns test mode on (test metrics, no animations).

### The dump

Printed through `backend.log`, one block per `dump` command:

```
NUCLO_DUMP_BEGIN <n> <rootWidth>x<rootHeight>
<kind>|<x>|<y>|<w>|<h>|<text>
…
NUCLO_DUMP_END
```

- One line per **visible** view (not `display: none`, and not inside one), depth-first in child order, the screen
  root first, then each overlay root. With a router, the shown screen of the active tab (and the modal over it).
- `kind`: `box text button input checkbox textarea image native`.
- `x`, `y`: the view's top-left relative to its root, obtained by **adding up `backend.frameOf` of the view and
  its ancestors** — so the line proves where the toolkit really put it. `w`, `h` from `frameOf`.
- `text`: a text's or button's text; a field's value; `true` / `false` for a checkbox; empty otherwise. Newlines
  are written as `\n`.
- `<n>` counts dumps from 1. `<rootWidth>x<rootHeight>` is the size the screen root was last laid out with.

`scripts/test.sh` (see `06-build-and-verify.md`) runs a target with the example's `test.script`, then runs the
headless executable at the same root size, and compares the two dumps.

## Unit tests (`nuclo/src/uiTest/kotlin/nuclo/`)

Run with `./gradlew -q :nuclo:macosArm64Test` (`:nuclo:linuxX64Test` on Linux). Every test builds a tree with the
public API on a fresh `HeadlessBackend` and asserts on its helpers. Reset all runtime state between tests
(`Runtime.reset()`).

The minimum set — a milestone is not done until its tests exist and pass:

| Milestone | Test | Asserts |
| --- | --- | --- |
| M1 | `rendersText` | `render { div(p("a"), p({ "b" })) }` → `texts() == ["a", "b"]` |
| M1 | `boxTextBecomesSpan` | `div("a", p("b"))` → two text views in that order |
| M1 | `rejectsNodeInText` | `p(div())` throws `IllegalArgumentException` |
| M1 | `updateTouchesOnlyChanges` | Two dynamic texts, one changes: exactly one `setText` after `update()` |
| M1 | `clickRunsHandler` | `click(find("Increment"))` then the text shows the new count |
| M1 | `columnLayout` | `div(style(Style(padding = 24, gap = 16)), p("ab"), p("cd"))` at 420 wide: first text at (24, 24) 372 × 18, second at (24, 58) |
| M1 | `rowLayout` | `row = true`, `gap`, `flex = 1` on the middle child: widths add up to the inner width |
| M1 | `alignAndJustify` | `center = true` in a fixed-size box centres a child on both axes |
| M1 | `paintResolves` | `bg`, `borderWidth`, `rounded`, `color`, `fontSize` reach `paintOf(view)` |
| M1 | `numbersPrintLikeJs` | `p(3)`, `p(1.5)`, `p(2.0)` → `"3"`, `"1.5"`, `"2"` |
| M2 | `listReusesRows` | After appending an item, the first row's `ViewId` is unchanged and one view was created |
| M2 | `listReorders` | Swapping two items keeps both `ViewId`s and swaps their frames |
| M2 | `listKeysStringsByValue` | A list of equal strings rebuilt as new `String` objects creates no view |
| M2 | `whenSwitchesBranch` | The open branch's text is shown; after the condition flips, the other; the old view was destroyed |
| M2 | `whenBranchIsLazy` | A closed branch's `onMount` never ran |
| M2 | `regionShowsInto` | `into("r", p("x"))` mounted anywhere appears where `region("r")` is; removed with its owner |
| M2 | `scopedUpdate` | `update("a")` re-runs bindings inside `scope("a")` only |
| M2 | `inputValueAndEvents` | `input(value { draft }, onInput { draft = it.target.value })`: `input(view, "hi")` sets `draft`; `update()` does not call `setValue` again with the same text |
| M2 | `lifecycle` | `onMount` once after render; `onMountCleanup`'s function and `onDestroy` when the branch closes |
| M3 | `classPrecedence` | tag default < `globalStyle` < class < inline, on one key |
| M3 | `variantsSelect` | defaults, an explicit selection and a compound all resolve; an unknown value throws |
| M3 | `stateStyles` | `pressed` after a pointer down, gone after up; `disabled` while the attribute holds |
| M3 | `structuralStyles` | `first` / `last` / `odd` on list rows, updated when a row is removed |
| M3 | `mediaRules` | A layout at 420 then at 800 switches a `minWidth(768, …)` rule |
| M3 | `inheritance` | `color` and `fontSize` set on a box reach its texts |
| M3 | `wrapAbsoluteScroll` | `flexWrap`, an absolute child with insets, a scroll box's content size |
| M4 | `routerStacks` | `go`, `back`, `replace`, `reset`, params, `canGoBack`, the `nav*` calls in order |
| M5 | `timersAndLaunch` | `setTimeout`, `setInterval` + `clearInterval`, `launch { delay(50); … }` on the virtual clock |
| M5 | `jsonParses` (commonTest) | Objects, arrays, strings with escapes, numbers, booleans, null; malformed input throws |
| M6 | `transitionEndsAtTarget` | With test mode off and the clock advanced past the duration, the paint is the target |
