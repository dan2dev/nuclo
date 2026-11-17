package nuclo


/** A name and a value (or a function of one): value, placeholder, checked, disabled, src, href, ariaLabel, type. */
class AttrMod internal constructor(internal val name: String, internal val value: Any?, internal val fn: (() -> Any?)?) : Mod()

class EventMod internal constructor(internal val kind: EventKind, internal val handler: Any) : Mod()
internal enum class EventKind { Click, Input, Change, Focus, Blur, KeyDown, PointerDown, PointerMove, PointerUp, PointerCancel, LongPress, DoubleClick, Pan, Pinch, Scroll }

class LifecycleMod internal constructor(internal val kind: LifecycleKind, internal val handler: Any) : Mod()
internal enum class LifecycleKind { Mount, MountCleanup, Destroy }

/** `style(...)`: a static or dynamic style, or (`classFn`) a dynamic class. */
class StyleMod internal constructor(internal val style: Style?, internal val styleFn: (() -> Style)?, internal val classFn: (() -> StyleClass)?) : Mod()

fun style(value: Style): Mod = StyleMod(value, null, null)
fun style(value: () -> Style): Mod = StyleMod(null, value, null)
fun className(value: () -> StyleClass): Mod = StyleMod(null, null, value)

fun value(text: String): Mod = AttrMod("value", text, null)
fun value(text: () -> String): Mod = AttrMod("value", null, text)
fun placeholder(text: String): Mod = AttrMod("placeholder", text, null)
fun placeholder(text: () -> String): Mod = AttrMod("placeholder", null, text)
fun checked(on: Boolean): Mod = AttrMod("checked", on, null)
fun checked(on: () -> Boolean): Mod = AttrMod("checked", null, on)
fun disabled(off: Boolean): Mod = AttrMod("disabled", off, null)
fun disabled(off: () -> Boolean): Mod = AttrMod("disabled", null, off)
fun src(url: String): Mod = AttrMod("src", url, null)
fun src(url: () -> String): Mod = AttrMod("src", null, url)
fun href(url: String): Mod = AttrMod("href", url, null)
fun href(url: () -> String): Mod = AttrMod("href", null, url)
fun ariaLabel(text: String): Mod = AttrMod("ariaLabel", text, null)
fun ariaLabel(text: () -> String): Mod = AttrMod("ariaLabel", null, text)
/** Static. "text" | "password" | "email" | "number" | "checkbox". `checkbox` makes the input a checkbox. */
fun type(inputType: String): Mod = AttrMod("type", inputType, null)

fun onClick(handler: (NativeEvent) -> Unit): Mod = EventMod(EventKind.Click, handler)
fun onInput(handler: (NativeEvent) -> Unit): Mod = EventMod(EventKind.Input, handler)
fun onChange(handler: (NativeEvent) -> Unit): Mod = EventMod(EventKind.Change, handler)
fun onFocus(handler: (NativeEvent) -> Unit): Mod = EventMod(EventKind.Focus, handler)
fun onBlur(handler: (NativeEvent) -> Unit): Mod = EventMod(EventKind.Blur, handler)
fun onMount(handler: (NativeElement) -> Unit): Mod = LifecycleMod(LifecycleKind.Mount, handler)
/** Like onMount; the returned function runs when the node is destroyed. */
fun onMountCleanup(handler: (NativeElement) -> (() -> Unit)): Mod = LifecycleMod(LifecycleKind.MountCleanup, handler)
fun onDestroy(handler: (NativeElement) -> Unit): Mod = LifecycleMod(LifecycleKind.Destroy, handler)

// M6
fun onKeyDown(handler: (KeyboardEvent) -> Unit): Mod = EventMod(EventKind.KeyDown, handler)
fun onPointerDown(handler: (PointerEvent) -> Unit): Mod = EventMod(EventKind.PointerDown, handler)
fun onPointerMove(handler: (PointerEvent) -> Unit): Mod = EventMod(EventKind.PointerMove, handler)
fun onPointerUp(handler: (PointerEvent) -> Unit): Mod = EventMod(EventKind.PointerUp, handler)
fun onPointerCancel(handler: (PointerEvent) -> Unit): Mod = EventMod(EventKind.PointerCancel, handler)
fun onLongPress(handler: (PointerEvent) -> Unit): Mod = EventMod(EventKind.LongPress, handler)
fun onDoubleClick(handler: (PointerEvent) -> Unit): Mod = EventMod(EventKind.DoubleClick, handler)
fun onPan(handler: (PanEvent) -> Unit): Mod = EventMod(EventKind.Pan, handler)
fun onPinch(handler: (PinchEvent) -> Unit): Mod = EventMod(EventKind.Pinch, handler)
fun onScroll(handler: (ScrollEvent) -> Unit): Mod = EventMod(EventKind.Scroll, handler)
