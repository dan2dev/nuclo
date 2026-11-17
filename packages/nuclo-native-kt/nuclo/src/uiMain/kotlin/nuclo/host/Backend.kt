package nuclo.host

typealias ViewId = Int      // > 0; the backend's handle for a view. The core never sees a widget.

enum class ViewKind { Box, Text, Button, Input, Checkbox, Textarea, Image, Native }

/** A frame in whole logical pixels, relative to the parent view's content. */
class Rect(val x: Int, val y: Int, val w: Int, val h: Int) {
    override fun equals(other: Any?) = other is Rect && x == other.x && y == other.y && w == other.w && h == other.h
    override fun hashCode() = ((x * 31 + y) * 31 + w) * 31 + h
    override fun toString() = "Rect($x, $y, $w, $h)"
}
class Size(val w: Float, val h: Float)

/** Colours are packed 0xRRGGBBAA. */
class Shadow(val color: UInt, val blur: Float, val dx: Float, val dy: Float) {
    override fun equals(other: Any?) = other is Shadow && color == other.color && blur == other.blur && dx == other.dx && dy == other.dy
    override fun hashCode() = ((color.hashCode() * 31 + blur.hashCode()) * 31 + dx.hashCode()) * 31 + dy.hashCode()
}

class TextPaint(
    val fontSize: Float, val weight: Int /* 100…900 */, val italic: Boolean,
    val family: String /* "sans-serif" | "serif" | "monospace" | a font name */,
    val lineHeight: Float, val letterSpacing: Float,
    val underline: Boolean, val strike: Boolean,
    val color: UInt, val align: Int /* 0 left, 1 center, 2 right */,
    val lines: Int /* 0 = unlimited; else cut with an ellipsis */,
    val placeholderColor: UInt? /* null = the platform's */,
) {
    override fun equals(other: Any?) = other is TextPaint && fontSize == other.fontSize && weight == other.weight && italic == other.italic &&
        family == other.family && lineHeight == other.lineHeight && letterSpacing == other.letterSpacing && underline == other.underline &&
        strike == other.strike && color == other.color && align == other.align && lines == other.lines && placeholderColor == other.placeholderColor
    override fun hashCode(): Int {
        var h = fontSize.hashCode()
        h = h * 31 + weight; h = h * 31 + italic.hashCode(); h = h * 31 + family.hashCode(); h = h * 31 + lineHeight.hashCode()
        h = h * 31 + letterSpacing.hashCode(); h = h * 31 + underline.hashCode(); h = h * 31 + strike.hashCode(); h = h * 31 + color.hashCode()
        h = h * 31 + align; h = h * 31 + lines; h = h * 31 + (placeholderColor?.hashCode() ?: 0)
        return h
    }
}

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
) {   // equals() / hashCode() by content
    override fun equals(other: Any?) = other is Paint && background == other.background && borders.contentEquals(other.borders) &&
        borderColors.contentEquals(other.borderColors) && radius == other.radius && clip == other.clip && shadow == other.shadow &&
        opacity == other.opacity && visible == other.visible && pointer == other.pointer && fit == other.fit &&
        translateX == other.translateX && translateY == other.translateY && rotate == other.rotate && scale == other.scale &&
        text == other.text && insets.contentEquals(other.insets)
    override fun hashCode(): Int {
        var h = (background?.hashCode() ?: 0)
        h = h * 31 + borders.contentHashCode(); h = h * 31 + borderColors.contentHashCode(); h = h * 31 + radius.hashCode()
        h = h * 31 + clip.hashCode(); h = h * 31 + (shadow?.hashCode() ?: 0); h = h * 31 + opacity.hashCode()
        h = h * 31 + visible.hashCode(); h = h * 31 + pointer.hashCode(); h = h * 31 + fit
        h = h * 31 + translateX.hashCode(); h = h * 31 + translateY.hashCode(); h = h * 31 + rotate.hashCode(); h = h * 31 + scale.hashCode()
        h = h * 31 + text.hashCode(); h = h * 31 + insets.contentHashCode()
        return h
    }
}

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
