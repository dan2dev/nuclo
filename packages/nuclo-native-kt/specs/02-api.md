# 02 — Public API (the contract)

Everything here lives in `nuclo/src/commonMain/kotlin/nuclo/`, package `nuclo`, and compiles for every target.
An app does `import nuclo.*` and uses nothing else. Semantics not spelled out here are those of
`nuclo-native-ts/src/index.ts` (read its doc comments).

Suggested files: `Node.kt` (descriptors, tags), `Attributes.kt`, `Events.kt`, `Style.kt`, `Styling.kt` (css, cx,
variants, keyframes, globalStyle), `Structure.kt` (list, when_, region, into, scope), `Router.kt`, `Async.kt`,
`Json.kt`, `App.kt` (render, update, runApp), `Engine.kt` (the internal `expect` declarations).

## 1. Descriptors

```kotlin
/** What a tag builder returns: a description of a view. Nothing exists until an engine mounts it. */
class Node internal constructor(internal val tag: String, internal val kind: Kind, internal val children: Array<out Any?>)

internal enum class Kind { Box, Text, Button, Input, Textarea, Image, Native }

/** Something a builder applies to its node instead of adding a view. A sealed hierarchy, so both engines
 *  must handle every case in an exhaustive `when`. */
sealed class Mod
```

`Mod` subclasses (all `internal constructor`, all in commonMain): `AttrMod`, `EventMod`, `LifecycleMod`,
`StyleMod`, `StyleClass` (public class), `ScopeMod`, `ListMod<T>`, `WhenBuilder` (public class), `RegionMod`,
`IntoMod`. Their fields are whatever the two engines need; keep them `internal`.

### Children

Every builder is `fun tag(vararg children: Any?): Node`. A child is one of:

| Child | Meaning |
| --- | --- |
| `Node` | A child view. **Only boxes accept nodes** |
| `Mod` (incl. `StyleClass`) | Applied to the node |
| `String`, `Number` | Static text. A number prints as JavaScript prints it: `3`, `1.5`, and `2.0` as `2` |
| `() -> Any?` (a `Function0`) | Dynamic text: re-run by `update()`. Must return `String`, `Number` or `null` (empty) |
| `null`, `Boolean` | Skipped (so `cond && x`-style code and nullable children work) |
| anything else | `IllegalArgumentException("nuclo: <tag> cannot take a child of type <T>")` |

Rules, checked **in commonMain when the node is built** so every target fails the same way:

- A text tag, `button`, `input`, `textarea` or `img` given a `Node` child throws
  `IllegalArgumentException("nuclo: <tag> takes text, not elements")`.
- Text given to a box becomes an implicit `span` child, in order: `div("a", p("b"), { c })` is
  `div(span("a"), p("b"), span({ c }))`. Do this normalisation in the `div` builder (commonMain), so both engines
  see the same tree.
- A dynamic text function that returns `Unit` (a handler passed without `onClick`) throws
  `IllegalArgumentException("nuclo: a function child must return text; wrap handlers in onClick { }")` when first run.
- Several text children of one text tag are joined: `p("Count: ", { count })`.

```kotlin
/** Number → text as JavaScript's String(n). Used by both engines. */
internal fun jsNum(n: Number): String
```

## 2. Tags

One line each: `fun div(vararg children: Any?): Node = node("div", Kind.Box, children)`.

- **Box** (`Kind.Box`, a flex column): `div section header footer main nav article aside form ul ol li figure
  fieldset blockquote address hgroup menu search dl details dialog table thead tbody tfoot tr td th hr body html
  colgroup col map picture slot head base link meta script title template noscript datalist area source track br
  wbr`
- **Text** (`Kind.Text`): `span p h1 h2 h3 h4 h5 h6 label strong b small em i u s del ins mark code pre kbd samp
  var_ abbr cite q dfn sub sup time legend caption figcaption summary dt dd a bdi bdo data output rt rp ruby`
- **Controls**: `button` (`Kind.Button`), `input` (`Kind.Input`), `textarea` (`Kind.Textarea`), `img` (`Kind.Image`)
- **M8**: `select`, `progress`, `meter` are compositions with their own signatures (section 12)
- `fun el(tag: String, vararg children: Any?): Node` — any other tag name; a box unless the name is in the text list.

There is **no `style` tag builder**: `style(...)` is the attribute (section 3). `var_` is the `<var>` tag. `main`
the tag takes children; the app's own `fun main()` takes none, so they do not collide.

Default styles per tag are the table `builtin_tag_style` in `runtimes/rust/src/nuclo/style.rs` (h1 32 bold, h2 22
bold, … `tr` a row, `td`/`th` flex 1, `hr` 1 px high `#cbd5e1`, `button` padding 8 / 14 and colour `#2563eb`,
`input`/`textarea` padding 8, `a` colour `#2563eb`, the document tags `display: none`, `br` 16 high). The base
text is 15 px, line height `round(fontSize × 1.2)`, black on white.

## 3. Attributes

Each attribute is a function returning a `Mod`. Where nuclo takes `value | () => value`, there are two overloads.

```kotlin
fun style(value: Style): Mod
fun style(value: () -> Style): Mod              // re-run by update()
fun className(value: () -> StyleClass): Mod     // a static class is passed directly as a child: div(card, …)

fun value(text: String): Mod;        fun value(text: () -> String): Mod
fun placeholder(text: String): Mod;  fun placeholder(text: () -> String): Mod
fun checked(on: Boolean): Mod;       fun checked(on: () -> Boolean): Mod
fun disabled(off: Boolean): Mod;     fun disabled(off: () -> Boolean): Mod
fun src(url: String): Mod;           fun src(url: () -> String): Mod
fun href(url: String): Mod;          fun href(url: () -> String): Mod
fun ariaLabel(text: String): Mod;    fun ariaLabel(text: () -> String): Mod
/** Static. "text" | "password" | "email" | "number" | "checkbox". `checkbox` makes the input a checkbox. */
fun type(inputType: String): Mod

fun onClick(handler: (NativeEvent) -> Unit): Mod
fun onInput(handler: (NativeEvent) -> Unit): Mod      // every change of a field's text
fun onChange(handler: (NativeEvent) -> Unit): Mod     // a field committed (Enter / blur), a checkbox toggled
fun onFocus(handler: (NativeEvent) -> Unit): Mod
fun onBlur(handler: (NativeEvent) -> Unit): Mod
fun onMount(handler: (NativeElement) -> Unit): Mod
/** Like onMount; the returned function runs when the node is destroyed. */
fun onMountCleanup(handler: (NativeElement) -> (() -> Unit)): Mod
fun onDestroy(handler: (NativeElement) -> Unit): Mod

// M6
fun onKeyDown(handler: (KeyboardEvent) -> Unit): Mod
fun onPointerDown(handler: (PointerEvent) -> Unit): Mod   // also onPointerMove, onPointerUp, onPointerCancel
fun onLongPress(handler: (PointerEvent) -> Unit): Mod
fun onDoubleClick(handler: (PointerEvent) -> Unit): Mod
fun onPan(handler: (PanEvent) -> Unit): Mod
fun onPinch(handler: (PinchEvent) -> Unit): Mod
fun onScroll(handler: (ScrollEvent) -> Unit): Mod
```

`onClick { count++; update() }` works because the handler's parameter is the implicit `it`.

### Events (`Events.kt`)

Plain classes with the fields of the same-named interfaces in `nuclo-native-ts/src/index.ts`:

```kotlin
class InputTarget(val value: String, val checked: Boolean)
class NativeEvent(val target: InputTarget)
class PointerEvent(val x: Double, val y: Double, val pageX: Double, val pageY: Double, val pointerId: Int)
class PanEvent(val state: String, val translationX: Double, val translationY: Double,
               val velocityX: Double, val velocityY: Double, val x: Double, val y: Double)   // state: "start" | "move" | "end" | "cancel"
class PinchEvent(val state: String, val scale: Double, val focalX: Double, val focalY: Double)
class ScrollEvent(val scrollTop: Double, val scrollLeft: Double, val scrollHeight: Double,
                  val scrollWidth: Double, val clientHeight: Double, val clientWidth: Double)
class KeyboardEvent(val key: String)                // DOM names: "Enter", "Escape", "ArrowLeft", "a"
/** The platform view behind a node: android.view.View, UIView, NSView, a GtkWidget pointer, an HWND, or a DOM element. */
class NativeElement(val handle: Any)
```

## 4. Style (`Style.kt`)

A regular class (not a `data class`) with named, optional parameters. Lengths are numbers in logical pixels
(CSS px = pt = dp); colours are CSS colour strings (`#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()`,
`hsla()`, the common names — port `parseColor` / `parseColorText` from `NucloRuntime.kt`).

```kotlin
class Style(
    // layout
    val flexDirection: FlexDirection? = null, val alignItems: Align? = null, val alignSelf: Align? = null,
    val justifyContent: Justify? = null, val flexWrap: FlexWrap? = null, val flex: Number? = null, val gap: Number? = null,
    val margin: Number? = null, val marginTop: Number? = null, val marginRight: Number? = null,
    val marginBottom: Number? = null, val marginLeft: Number? = null,
    val padding: Number? = null, val paddingTop: Number? = null, val paddingRight: Number? = null,
    val paddingBottom: Number? = null, val paddingLeft: Number? = null,
    val width: Number? = null, /** 0…100: a share of the parent's width */ val widthPct: Number? = null,
    val height: Number? = null, val minWidth: Number? = null, val maxWidth: Number? = null,
    val minHeight: Number? = null, val maxHeight: Number? = null, val aspectRatio: Number? = null,
    val overflow: Overflow? = null, val position: Position? = null,
    val top: Number? = null, val right: Number? = null, val bottom: Number? = null, val left: Number? = null,
    val zIndex: Number? = null, val display: Display? = null,
    // paint
    val backgroundColor: String? = null, val color: String? = null, val opacity: Number? = null,
    val borderRadius: Number? = null, val borderWidth: Number? = null, val borderColor: String? = null,
    val borderTopWidth: Number? = null, val borderRightWidth: Number? = null,
    val borderBottomWidth: Number? = null, val borderLeftWidth: Number? = null,
    val borderTopColor: String? = null, val borderRightColor: String? = null,
    val borderBottomColor: String? = null, val borderLeftColor: String? = null,
    val shadowColor: String? = null, val shadowRadius: Number? = null,
    val shadowOffsetX: Number? = null, val shadowOffsetY: Number? = null,
    val objectFit: ObjectFit? = null, val pointerEvents: PointerEvents? = null,
    // text
    val fontSize: Number? = null, val fontWeight: FontWeight? = null, val fontStyle: FontStyle? = null,
    val fontFamily: String? = null, val lineHeight: Number? = null, val letterSpacing: Number? = null,
    val textAlign: TextAlign? = null, val textDecoration: TextDecoration? = null,
    val textTransform: TextTransform? = null, val numberOfLines: Int? = null, val placeholderColor: String? = null,
    // transforms and transitions (M3 / M6)
    val translateX: Number? = null, val translateY: Number? = null, val scale: Number? = null, val rotate: Number? = null,
    val transitionDuration: Number? = null, val transitionDelay: Number? = null, val transitionEasing: Easing? = null,
    val animation: StyleAnimation? = null,
    // states (M3): a style merged over this one while the state holds
    val pressed: Style? = null, val hover: Style? = null, val focused: Style? = null,
    val disabled: Style? = null, val enabled: Style? = null, val checked: Style? = null,
    val placeholderShown: Style? = null,
    val first: Style? = null, val last: Style? = null, val only: Style? = null,
    val odd: Style? = null, val even: Style? = null, val empty: Style? = null,
    val media: List<MediaRule>? = null,
    // nuclo-core's short keys: each is the long key in its comment
    val p: Number? = null, val px: Number? = null, val py: Number? = null,           // padding, left+right, top+bottom
    val pt: Number? = null, val pr: Number? = null, val pb: Number? = null, val pl: Number? = null,
    val m: Number? = null, val mx: Number? = null, val my: Number? = null,
    val mt: Number? = null, val mr: Number? = null, val mb: Number? = null, val ml: Number? = null,
    val w: Number? = null, val h: Number? = null, val size: Number? = null,          // width, height, both
    val minW: Number? = null, val maxW: Number? = null, val minH: Number? = null, val maxH: Number? = null,
    val bg: String? = null, val rounded: Number? = null, val z: Number? = null,
    val text: Number? = null, val font: String? = null, val weight: FontWeight? = null,   // fontSize, fontFamily, fontWeight
    val leading: Number? = null, val tracking: Number? = null,                              // lineHeight, letterSpacing
    val items: Align? = null, val justify: Justify? = null,
    val row: Boolean? = null, val col: Boolean? = null, val center: Boolean? = null, val truncate: Boolean? = null,
) {
    /** `other`'s set fields win; nested state styles and media rules merge too. */
    fun merged(other: Style): Style
    operator fun plus(other: Style): Style = merged(other)
    /** The same style with every short key folded into its long key (the long key wins when both are set). */
    internal fun normalized(): Style
}

enum class FlexDirection { Row, Column }
enum class Align { FlexStart, Center, FlexEnd, Stretch }
enum class Justify { FlexStart, Center, FlexEnd, SpaceBetween, SpaceAround, SpaceEvenly }
enum class FlexWrap { Nowrap, Wrap }
enum class Overflow { Visible, Hidden, Scroll }
enum class Position { Relative, Absolute }
enum class Display { Flex, None }
enum class FontWeight(val css: Int) { Light(300), Normal(400), Medium(500), Semibold(600), Bold(700) }
enum class FontStyle { Normal, Italic }
enum class TextAlign { Left, Center, Right }
enum class TextDecoration { None, Underline, LineThrough }
enum class TextTransform { None, Uppercase, Lowercase, Capitalize }
enum class ObjectFit { Cover, Contain, Fill }
enum class PointerEvents { Auto, None }
enum class Easing { Linear, Ease, EaseIn, EaseOut, EaseInOut, Spring }

/** A style merged while the window's width is within min…max (inclusive); null = unbounded. */
class MediaRule(val min: Number?, val max: Number?, val style: Style)
fun minWidth(px: Number, style: Style) = MediaRule(px, null, style)
fun maxWidth(px: Number, style: Style) = MediaRule(null, px, style)
fun widthBetween(min: Number, max: Number, style: Style) = MediaRule(min, max, style)
```

Layout semantics are `nuclo-native-ts`'s: every box is a flex container, a column unless `flexDirection` is
`Row`; `box-sizing: border-box`; boxes never shrink below their content; `flex = n` grows by weight; `lineHeight`
below 4 is a multiple of the font size; `overflow = Scroll` scrolls along the box's direction.

## 5. Reusable styles (`Styling.kt`)

```kotlin
class StyleClass internal constructor(internal val style: Style) : Mod()

fun css(style: Style): StyleClass
fun css(name: String, style: Style): StyleClass          // the name is a CSS class name on the web, a label natively
fun cx(vararg classes: StyleClass?): StyleClass          // merged left to right, nulls skipped

class Compound(val match: Map<String, String>, val style: Style)
class Variants internal constructor(/* … */) {
    /** btn("tone" to "ghost", "size" to "lg") — unknown group or value: IllegalArgumentException. Results are cached. */
    operator fun invoke(vararg selection: Pair<String, String>): StyleClass
}
fun variants(
    base: Style = Style(),
    variants: Map<String, Map<String, Style>>,
    defaults: Map<String, String> = emptyMap(),
    compounds: List<Compound> = emptyList(),
): Variants

/** Styles for a tag ("h1", "button", several as "h1, h2") or for the screens ("body"): background and inherited text. */
fun globalStyle(selector: String, style: Style)

// M6
class Keyframes internal constructor(internal val stops: List<Pair<Double, Style>>)
/** keyframes(0 to Style(opacity = 1), 50 to Style(opacity = .4), 100 to Style(opacity = 1)) — percentages. */
fun keyframes(vararg stops: Pair<Number, Style>): Keyframes
class StyleAnimation(val keyframes: Keyframes, val duration: Number, val delay: Number = 0,
                     val easing: Easing = Easing.Ease, /** -1 = forever */ val iterations: Int = 1, val alternate: Boolean = false)
```

Precedence on one node, lowest first: the tag's default style → `globalStyle` for the tag → `StyleClass`
children in order → `className { }` → `style(...)` / `style { }` → state styles → matching media rules.
`color`, `fontSize`, `fontWeight`, `fontStyle`, `fontFamily`, `lineHeight`, `letterSpacing`, `textAlign` inherit
from the parent.

## 6. Structure (`Structure.kt`)

```kotlin
/** One node per item. A row is rebuilt only when its item is new: items are matched by identity (`===`),
 *  except String, Number, Boolean and Char items, which are matched by `==`. */
fun <T> list(items: () -> List<T>, render: (item: T, index: Int) -> Node?): Mod

class WhenBuilder : Mod() {
    fun when_(condition: Boolean, vararg content: Any?): WhenBuilder
    fun when_(condition: () -> Boolean, vararg content: Any?): WhenBuilder
    fun else_(vararg content: Any?): WhenBuilder
}
/** Shows the content of the first branch whose condition holds. A branch is mounted when it opens and
 *  destroyed when it closes. */
fun when_(condition: Boolean, vararg content: Any?): WhenBuilder
fun when_(condition: () -> Boolean, vararg content: Any?): WhenBuilder

/** A named place in the tree that into() fills from anywhere. stack = false shows only the newest content. */
fun region(id: String, stack: Boolean = false, vararg empty: Any?): Mod
/** Puts content into region `id` for as long as this into() is mounted. */
fun into(id: String, vararg content: Any?): Mod

/** Makes the node an update root: update("id") refreshes only what is inside it. */
fun scope(vararg ids: String): Mod
```

## 7. The app (`App.kt`)

```kotlin
/** Starts the platform's application and event loop, then runs `entry` on the UI thread. On the desktop and
 *  iOS it does not return. Call it once, from `fun main()`. */
fun runApp(entry: () -> Unit)

/** Shows a view. The first call is the app; each later call is a layer over it, the size of the window,
 *  that lets the pointer through where it has no view (modals, toasts). */
fun render(view: () -> Node)
fun render(outlet: Outlet)

/** Re-runs every dynamic value — or only those inside scope(id) nodes for the given ids — and applies the
 *  ones that changed. */
fun update(vararg scopeIds: String)
/** Re-runs and applies every dynamic value, changed or not. */
fun forceUpdate()
```

`runApp` is a common function: `fun runApp(entry: () -> Unit) = (runAppOverride ?: ::platformRunApp)(entry)`,
with `var runAppOverride: ((() -> Unit) -> Unit)? = null` public (used by `:gtk-preview`) and
`internal expect fun platformRunApp(entry: () -> Unit)`.

## 8. Navigation (`Router.kt`, M4)

```kotlin
typealias Params = Map<String, String>

enum class Presentation { Push, Modal }

class Route(
    val title: String? = null,
    val titleFor: ((Params) -> String)? = null,      // wins over `title`
    val presentation: Presentation = Presentation.Push,
    val header: Boolean = true,                      // false hides the navigation bar on this screen
    val onEndReached: ((Params) -> Unit)? = null,    // M8
    val view: (Params) -> Node,
)

/** icon: a semantic name each platform maps to its icon set: home, list, cloud, star, person, settings, search. */
class Tab(val path: String, val title: String, val icon: String = "")

class Outlet internal constructor(internal val router: Router)

interface Router {
    val path: String
    val canGoBack: Boolean
    fun go(path: String)          // pushes onto the current tab's stack; "/posts/:id" patterns give params
    fun back()
    fun replace(path: String)     // replaces the current screen, no transition
    fun reset(path: String)       // selects the tab that owns `path` and makes it the only screen there
    val outlet: Outlet
}

fun createRouter(routes: Map<String, Route>, tabs: List<Tab> = emptyList(), initial: String = "/"): Router
```

Route matching: split pattern and path on `/`; same number of segments; a `:name` segment captures. Declare
routes in a `linkedMapOf` / `mapOf` (insertion order is the match order).

## 9. Async and timers (`Async.kt`, M5)

Built on the standard library's `kotlin.coroutines` only (`startCoroutine`, `suspendCoroutine`). Everything
resumes on the UI thread.

```kotlin
/** Runs a suspending block on the UI thread. An uncaught exception is logged, not thrown. */
fun launch(block: suspend () -> Unit)

class Response internal constructor(val status: Int, private val body: String) {
    val ok: Boolean get() = status in 200..299
    fun text(): String
    /** The body parsed as JSON: Map<String, Any?>, List<Any?>, String, Double, Boolean or null. */
    fun json(): Any?
}
/** Throws Exception("fetch failed: <reason>") when there was no HTTP answer. */
suspend fun fetch(url: String, method: String = "GET", body: String? = null, headers: Map<String, String> = emptyMap()): Response
suspend fun delay(ms: Number)

class Timer internal constructor(internal val id: Int)
fun setTimeout(ms: Number, callback: () -> Unit): Timer       // callback last, so it can be a trailing lambda
fun setInterval(ms: Number, callback: () -> Unit): Timer
fun clearTimeout(timer: Timer)
fun clearInterval(timer: Timer)

class Frame internal constructor(internal val id: Int)
/** Runs `callback` before the next frame; `time` is milliseconds since the epoch. */
fun requestAnimationFrame(callback: (time: Double) -> Unit): Frame
fun cancelAnimationFrame(frame: Frame)
/** Milliseconds since the epoch, as Date.now(). */
fun now(): Double
```

`Json.kt` holds a small recursive-descent parser, `internal fun parseJson(text: String): Any?` (objects →
`LinkedHashMap`, arrays → `ArrayList`, every number → `Double`), used on every target so results are identical.
Logging is Kotlin's `println`: it reaches the console on the web, stdout on the desktop, and logcat on Android.

## 10. Native functions and components (M7)

**Native functions need no API.** An app declares `expect fun vibrate(ms: Int)` in its common code and writes
`actual fun vibrate(ms: Int)` in `examples/<name>/native/<target>/`. A missing `actual` fails that target's build.

**Native components** wrap a platform view as a `Node`. The function is declared in each platform source set of
`:nuclo` with that platform's view type, so only platform code can call it:

```kotlin
// androidMain
fun nativeNode(create: (android.content.Context) -> android.view.View, update: (android.view.View) -> Unit = {}, vararg mods: Any?): Node
// iosMain
fun nativeNode(create: () -> platform.UIKit.UIView, update: (platform.UIKit.UIView) -> Unit = {}, vararg mods: Any?): Node
// macosMain
fun nativeNode(create: () -> platform.AppKit.NSView, update: (platform.AppKit.NSView) -> Unit = {}, vararg mods: Any?): Node
// src/gtk (linux)
fun nativeNode(create: () -> CPointer<gtk.GtkWidget>, update: (CPointer<gtk.GtkWidget>) -> Unit = {}, vararg mods: Any?): Node
// mingwMain: create receives the parent window
fun nativeNode(create: (parent: platform.windows.HWND) -> platform.windows.HWND, update: (platform.windows.HWND) -> Unit = {}, vararg mods: Any?): Node
// jsMain
fun nativeNode(create: () -> org.w3c.dom.HTMLElement, update: (org.w3c.dom.HTMLElement) -> Unit = {}, vararg mods: Any?): Node
```

`create` runs once when the node is mounted; `update` runs right after, and again on every `update()` (the
component reads its own lambdas and decides what changed); `mods` are the usual children (style, onMount…). An app
uses it through its own `expect fun Slider(value: () -> Double, onChange: (Double) -> Unit, vararg mods: Any?): Node`.

## 11. Composites (M8)

Written once in commonMain **out of the builders above** (boxes, text, `list`, `when_`), so they need no engine
or backend work and look the same on every target, the web included.

```kotlin
class Option(val value: String, val label: String = value, val disabled: Boolean = false)

/** A box showing the chosen option's label and a chevron; pressed, it opens the options below it (inline,
 *  pushing what follows down). Picking one closes it and calls onChange. Look: white, 1 px #cbd5e1 border, radius 8. */
fun select(options: () -> List<Option>, value: () -> String, onChange: (String) -> Unit, vararg mods: Any?): Node

/** A 160 × 16 track (#e5e7eb, radius 8) with a fill to value / max; a null value is an empty track. */
fun progress(value: () -> Number?, max: Number = 1, vararg mods: Any?): Node

/** An 80 × 16 track with a fill between min and max, coloured as HTML's <meter>: green near `optimum`,
 *  yellow one range away, red two away. */
fun meter(value: () -> Number, min: Number = 0, max: Number = 1, low: Number? = null, high: Number? = null,
          optimum: Number? = null, vararg mods: Any?): Node
```

`select` keeps whether it is open in a variable captured by its closures and calls `update()` when it toggles.
The colours and the meter's rule are in `nuclo-native-ts/src/compiler/transpile.ts` (search `meter`) and the web
runtime's `n-meter`.

## 12. A complete example

```kotlin
package app

import nuclo.*

class Todo(var title: String, var done: Boolean = false)

val todos = mutableListOf(Todo("Write the spec", done = true), Todo("Port the core"))
var draft = ""

val card = css(Style(p = 16, gap = 12, bg = "#ffffff", rounded = 12, borderWidth = 1, borderColor = "#e2e8f0"))
val rowStyle = css(Style(row = true, items = Align.Center, gap = 8, pressed = Style(bg = "#eef2ff")))

fun add() {
    if (draft.isBlank()) return
    todos += Todo(draft)
    draft = ""
    update()
}

fun App() = div(
    style(Style(p = 24, gap = 16, bg = "#f8fafc")),
    h1("Todos"),
    div(
        card,
        div(
            style(Style(row = true, gap = 8)),
            input(style(Style(flex = 1)), placeholder("What needs doing?"), value { draft },
                  onInput { draft = it.target.value; update() }, onChange { add() }),
            button("Add", onClick { add() }, disabled { draft.isBlank() }),
        ),
        when_({ todos.isEmpty() }, p("Nothing to do.")).else_(
            ul(
                style(Style(gap = 4)),
                list({ todos }) { todo, _ ->
                    li(
                        rowStyle,
                        input(type("checkbox"), ariaLabel(todo.title), checked { todo.done },
                              onChange { todo.done = it.target.checked; update() }),
                        span(style { Style(flex = 1, textDecoration = if (todo.done) TextDecoration.LineThrough else TextDecoration.None) },
                             { todo.title }),
                        button("×", ariaLabel("Delete ${todo.title}"), onClick { todos.remove(todo); update() }),
                    )
                },
            ),
        ),
        p({ "${todos.count { !it.done }} left" }),
    ),
)

fun main() = runApp { render(::App) }
```
