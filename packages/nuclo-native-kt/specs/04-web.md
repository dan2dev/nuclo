# 04 — The web target

`nuclo/src/jsMain/kotlin/nuclo/` is compiled by Kotlin/JS (IR, ES modules, bundled by webpack into one `app.js`).
It does **not** contain the core. It translates the descriptors of `02-api.md` into calls to **nuclo-core**, so
the JavaScript that ships is an ordinary nuclo-core app: nuclo-core creates the DOM, keeps it updated and
generates the CSS; the browser lays it out.

Before writing it, read `packages/nuclo-core/README.md` (sections *Core Concepts*, *API Reference*, *Attributes*,
*Styling*) and `packages/nuclo-core/types/features/*.d.ts`.

The npm dependency is the local package (`npm("nuclo", rootProject.file("../nuclo-core"))`). It needs
`packages/nuclo-core/dist/nuclo.mjs`; if that file is missing run `cd ../nuclo-core && bun install && bun run build`.

## Files

| File | Holds |
| --- | --- |
| `NucloCore.kt` | `external` declarations |
| `Engine.js.kt` | The `actual` functions of `Engine.kt`: mount → nuclo-core |
| `Css.kt` | `Style` → nuclo-core style object; the base stylesheet |
| `RouterWeb.kt` | The router on the URL fragment (M4) |
| `Gestures.kt` | pan, pinch, long press, double click on pointer events (M6) |
| `HarnessWeb.kt` | `?script=` and the dump |

## Calling nuclo-core

```kotlin
package nuclo

@JsModule("nuclo")
internal external object NucloCore {
    fun render(view: dynamic, parent: dynamic = definedExternally): dynamic
    fun update(vararg scopeIds: String)
    fun forceUpdate()
    fun list(items: () -> Array<dynamic>, render: (item: dynamic, index: Int) -> dynamic): dynamic
    fun `when`(condition: dynamic, vararg content: dynamic): dynamic      // returns a builder with .when() and .else()
    fun region(options: dynamic): dynamic
    fun into(id: String, vararg content: dynamic): dynamic
    fun scope(vararg ids: String): dynamic
    fun on(type: String, listener: (dynamic) -> Unit): dynamic
    fun css(style: dynamic): dynamic
    fun cx(vararg classes: dynamic): dynamic
    fun globalStyle(selector: String, style: dynamic)
    fun keyframes(frames: dynamic): String
}
```

Importing the module registers nuclo-core's tag builders as globals. Reach them by name:
`js("globalThis")[tag]` and call with `fn.apply(null, argsArray)`.

The `external object` form with `render` and `update` was verified end to end: a Kotlin
`div(p({ "Count: $count" }), p("static", 3, null))` rendered `<div><p>Count: 0</p><p>static3</p></div>` in Chrome.
Check each further member's real signature in `nuclo-core/types/` when you first use it.

Rules that come from how nuclo-core and Kotlin/JS work:

- nuclo-core treats **a function with zero declared parameters as dynamic text**, and a function with
  parameters as a node modifier. A Kotlin `() -> Any?` lambda is a zero-parameter JS function: pass it through
  unchanged (wrapped only to turn a `Number` into its text and to reject `Unit`). Never hand nuclo-core a Kotlin
  function with parameters as a child; event handlers go through `on(type, listener)`.
- A plain JS object is built with `val o: dynamic = js("({})")` and `o[key] = value`. A Kotlin class instance or
  `Map` is not one.
- nuclo-core wants JS arrays: `list.toTypedArray()`.
- `js("…")` takes a string literal only.

## Mapping

`toNuclo(child: Any?): dynamic` converts one child. `Node` → the tag builder's result; `Mod` → below; `String` /
`Number` → the text; a `Function0` → a dynamic text function; `null` / `Boolean` → `null`.

| Descriptor | nuclo-core call |
| --- | --- |
| `Node(tag, children)` | `globalThis[htmlTag](…children.map(toNuclo), baseClass)` — see "Tags" |
| static text / `{ text }` | the string / a zero-arg function |
| `style(Style)` (static) | the class from `css(toCss(style))`, cached per `Style` instance |
| `style { Style }` | `{ style: () => inlineCss(style()) }`; plus, if the result has states or media, `{ className: () => … }` with a class made from **only** the states/media part (cached by its JSON text) |
| `StyleClass` | its nuclo-core class (made once with `css(toCss(style))`; `css(name, style)` passes the name) |
| `className { }` | `{ className: () => classNameOf(value()) }` |
| `cx(a, b)` | Merge the Kotlin `Style`s (as natively), then one `css()` |
| `variants(...)(...)` | Resolve to a `Style` in common code, then one `css()`, cached per selection |
| `value`, `placeholder`, `checked`, `disabled`, `src`, `href` | `{ value: v }` / `{ value: () => v() }` … |
| `ariaLabel` | `{ "aria-label": … }` (check the attribute name nuclo-core expects in `types/`) |
| `type("checkbox")` etc. | `{ type: … }` |
| `onClick`, `onInput`, `onChange`, `onFocus`, `onBlur` | `on("click" | "input" | "change" | "focus" | "blur", e => handler(NativeEvent(InputTarget(e.target.value ?: "", e.target.checked ?: false))))` |
| `onMount` / `onMountCleanup` / `onDestroy` | `on("mount", …)` / `on("destroy", …)` with `NativeElement(element)` — read `types/core/lifecycle.d.ts` for the exact shape |
| `list(items, render)` | `list({ items().toTypedArray() }, { item, i -> toNuclo(render(item, i)) })` |
| `when_(c, …).when_(…).else_(…)` | `when(c, …content).when(…).else(…)`; a static `Boolean` condition is passed as is |
| `region(id, stack, empty)` | `region({ id, type: "stack" | "latest", empty })` |
| `into(id, …)` | `into(id, …content)` |
| `scope(ids)` | `scope(…ids)` |
| `render(view)` first call | `render({ toNuclo(view()) }, appRoot)` |
| `render(view)` later calls | the same into a new `.nuclo-layer` element over the app |
| `update(ids)` / `forceUpdate()` | `update(…ids)` / `forceUpdate()` |
| `globalStyle(sel, style)` | `globalStyle(sel === "body" ? ".nuclo-screen" …, toCss(style))` — keep `body` working for the page background |

`list` keys: nuclo-core matches rows with `===`. A Kotlin object is a JS object and a Kotlin `String` / `Int` /
`Double` / `Boolean` is a JS primitive, so the rule of `02-api.md` §6 holds without extra code.

### Tags

Most Kotlin tags map to the HTML tag of the same name. Exceptions, to keep the native box model: `form`,
`details`, `dialog`, `table`, `thead`, `tbody`, `tfoot` are created as `div` (their browser behaviour and layout
would differ); `var_` is `var`. Every element gets the class `n` and its kind class (`text`, `button`, `input`,
`textarea`, `checkbox`, `image`), which the base stylesheet targets. A `Kind.Input` with `type("checkbox")` is
`<input type="checkbox">`.

### Style → CSS (`Css.kt`)

Port `CSS_PROPS`, `toCss`, `merge` and `BASE_CSS` from `nuclo-native-ts/src/runtimes/web/index.ts` (lines
40–240). The essentials:

- Run `style.normalized()` first (short keys folded into long ones).
- Numbers become `"<n>px"`, except `opacity`, `flex`, `zIndex`, `aspectRatio`, `scale`.
- `flex = n` → `flex: "n 1 0%"`; `widthPct = n` → `width: "n%"`.
- Enums → their CSS keyword (`FlexStart` → `flex-start`, `SpaceBetween` → `space-between`, `LineThrough` →
  `line-through`, `Nowrap` → `nowrap`).
- `fontSize` without `lineHeight` also sets `lineHeight: round(fontSize × 1.2) px`; a `lineHeight` below 4 is
  multiplied by the font size. This is what makes the browser's lines as tall as the native ones.
- `borderWidth` → `border-width` with `border-style: solid`; the per-side keys likewise.
- `shadowColor / Radius / OffsetX / OffsetY` → one `box-shadow`.
- `translateX / translateY / rotate / scale` → one `transform` (translate, then rotate, then scale).
- `numberOfLines = 1` → `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`; above 1 →
  `-webkit-line-clamp`.
- `overflow = Scroll` → `overflow-y: auto` in a column, `overflow-x: auto` in a row.
- `transitionDuration` → `transition: <the animatable properties> <ms>ms <easing> <delay>ms`.
- States: `pressed` → `active`, `focused` → `focus`, `hover`, `disabled`, `enabled`, `checked`,
  `placeholderShown`, `first` / `last` / `only` / `odd` / `even` / `empty` → nuclo-core's pseudo-class keys or
  `"&:first-child"`-style selector keys. Take the exact key names from `nuclo-core/types/features/style.d.ts`.
- `media` → `"@media (min-width: Npx)"` / `(max-width: Npx)` / both joined with `and`.
- nuclo-core's `css()` mints a permanent class per distinct block. Use it for static styles only; a dynamic
  `style { }` goes inline, as the table above says.

The base stylesheet (one `<style>` element, added once in `platformRunApp`) is `BASE_CSS` from the web runtime:
every `.n` is `box-sizing: border-box; display: flex; flex-direction: column; flex: 0 0 auto; position: relative;
min-width: 0; min-height: 0; margin: 0; padding: 0; border: 0 solid #000`, text is `display: block;
white-space: pre-wrap`, the page is `15px/18px system-ui`, plus the heading sizes, control defaults and the
router chrome (`.nuclo-bar`, `.nuclo-tabs`, `.nuclo-screen`, `.nuclo-sheet`, `.nuclo-layer`). Copy it and remove
the rules for tags this package does not have.

### Page structure

`platformRunApp(entry)` on the web: add the base stylesheet; create `<div id="nuclo">` in `document.body` with a
`.nuclo-main` holding a `.nuclo-screen` (the app's scrolling root); run `entry()`; start the harness if
`?script=` is present. The first `render` mounts into `.nuclo-screen`; each later `render` adds a `.nuclo-layer`.

## Router (M4)

Port `RouterImpl` from the web runtime (search `class RouterImpl` in `runtimes/web/index.ts`): the address is the
URL fragment (`#/todos/3`), so a screen can be reloaded and linked to. Stacks per tab are kept in memory; the
chrome is plain elements: a 56 px `.nuclo-bar` (← and the title) unless the route has `header = false`, the top
screen of the active stack in `.nuclo-stack`, 64 px `.nuclo-tabs` when there are tabs, a modal route in a
`.nuclo-sheet` over everything. Each screen is its own `render(…)` of nuclo-core into its element; a popped
screen's element is removed (nuclo-core runs its destroy callbacks). The browser's back button calls `back()`.

## Async (M5)

- `fetch`: the browser's `window.fetch(url, init).then { it.text() }` resumed into the coroutine; a rejected
  promise becomes `Exception("fetch failed: …")`.
- Timers and frames: `window.setTimeout`, `setInterval`, `requestAnimationFrame`. `now()` is `Date.now()`.
- `launch` is the common implementation.

## Gestures (M6)

nuclo-core gives `click`, `pointerdown/move/up/cancel`, `keydown`, `scroll`, `dblclick` through `on(…)`. Pan,
pinch and long press have no DOM event: port `pan`, `pinch`, `longPress` and `pointerOf` from the web runtime
(8 px slop, 500 ms long press, pinch from two pointers or ctrl + wheel).

## The harness on the web (`HarnessWeb.kt`)

The same script language as `03-core.md`, read from the page's query: `index.html?script=<urlencoded>`.

| Command | On the web |
| --- | --- |
| `tap:<text>` | The first element whose own text (`textContent`, for text and button kinds) or `aria-label` equals it → `.click()` |
| `type:<placeholder>=<text>` | Set `.value`, dispatch a bubbling `input` event |
| `enter:<placeholder>` | Dispatch a bubbling `change` event |
| `toggle:<label>` | `.click()` on the checkbox |
| `go` / `back` / `wait` | As natively |
| `dump` | Append a block to `<pre id="nuclo-dump">` (created on first use, `display: none`) |
| `exit` | Append the line `NUCLO_EXIT` to the same `<pre>` |

The dump block has the format of `03-core.md`. Walk the app root's descendants that have the class `n` (with a
router: only the shown screen of the active tab, then the modal sheet; then each layer), skipping anything with
`display: none`; `kind` from the kind class (`box` when there is none); frames from
`getBoundingClientRect()` relative to the root's, rounded; `text` as natively (`value` for fields, `checked` for
checkboxes). Because a box's text is already an explicit `span` (the common builder does that), the web tree and
the native tree have the same views in the same order — that is what `scripts/test.sh web` compares.

## Checks

```bash
./gradlew -q :app:jsBrowserDistribution -Pexample=counter
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --window-size=420,780 \
  --virtual-time-budget=5000 --dump-dom "file://$PWD/app/build/dist/js/productionExecutable/index.html?script=dump%3Bexit"
```

The printed DOM must contain the app's elements and a `<pre id="nuclo-dump">` ending in `NUCLO_EXIT`. No line
of the page's console may be an error: add `--enable-logging=stderr --v=0` and grep stderr for `Uncaught` when a
page comes out empty.
