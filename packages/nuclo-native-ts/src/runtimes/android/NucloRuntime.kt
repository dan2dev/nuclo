// NucloRuntime.kt — the Android runtime for apps compiled by nuclo-native-ts. Android Views and the
// Kotlin standard library only: no AndroidX, no kotlinx (async runs on stdlib coroutines).
//
// The model is nuclo's: builders create native views once; `update()` re-runs the dynamic values
// (each dirty-checked against its last value before a view is touched) and reconciles list(),
// when() and region() in place. There is no virtual DOM and no JavaScript.
//
//   Node        one view (or a fragment: list/when/region/into, which owns no view)
//   FlexLayout  the container view: a flex column or row laid out by `Flex` (same algorithm on every target)
//   Touch       pointers and gestures of a view: pan, pinch, long press, double tap
//   Runtime     roots, update(), regions, the activity's window
//   NRouter     tabs and navigation stacks: a bottom bar, an app bar and a view stack with system back

@file:Suppress("unused", "FunctionName", "MemberVisibilityCanBePrivate")

package dev.nuclo.runtime

import android.animation.TimeInterpolator
import android.animation.ValueAnimator
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.Editable
import android.text.InputType
import android.text.TextUtils
import android.text.TextWatcher
import android.util.Log
import android.util.TypedValue
import android.view.Choreographer
import android.view.GestureDetector
import android.view.Gravity
import android.view.MotionEvent
import android.view.ScaleGestureDetector
import android.view.VelocityTracker
import android.view.View
import android.view.ViewConfiguration
import android.view.ViewGroup
import android.view.ViewOutlineProvider
import android.view.WindowInsets
import android.view.animation.LinearInterpolator
import android.view.animation.OvershootInterpolator
import android.view.animation.PathInterpolator
import android.view.inputmethod.EditorInfo
import android.widget.CheckBox
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.HorizontalScrollView
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.window.OnBackInvokedDispatcher
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread
import kotlin.coroutines.Continuation
import kotlin.coroutines.EmptyCoroutineContext
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.startCoroutine
import kotlin.coroutines.suspendCoroutine
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

// ---------------------------------------------------------------------------
// Types the generated code uses
// ---------------------------------------------------------------------------

typealias Params = MutableMap<String, String>
typealias NativeElement = View
typealias Content = () -> List<NodeMod?>
typealias Cleanup = () -> Unit

/** Anything a builder accepts: a child node, text, an attribute, a style class, a fragment. */
fun interface NodeMod {
    fun apply(node: Node)
}

class InputTarget(val value: String, val checked: Boolean)

class NativeEvent(val target: InputTarget)

/** What a select reports when an option is picked: the event's target holds the option's value. */
fun selectEvent(value: String) = NativeEvent(InputTarget(value, false))

/** Coordinates in dp: `x`/`y` from the view's top-left corner, `pageX`/`pageY` from the screen's. */
class PointerEvent(val x: Double, val y: Double, val pageX: Double, val pageY: Double, val pointerId: Int)

class PanEvent(
    val state: String,
    val translationX: Double,
    val translationY: Double,
    val velocityX: Double,
    val velocityY: Double,
    val x: Double,
    val y: Double,
)

class PinchEvent(val state: String, val scale: Double, val focalX: Double, val focalY: Double)

class ScrollEvent(
    val scrollTop: Double,
    val scrollLeft: Double,
    val scrollHeight: Double,
    val scrollWidth: Double,
    val clientHeight: Double,
    val clientWidth: Double,
)

class KeyboardEvent(val key: String)

/**
 * A view written for Android, used from the app as `native<P>("Name")`: a class `Name` in
 * native/android/ implements this for the props class the compiler generated from `P`.
 */
interface NativeComponent<P> {
    fun create(context: Context): View

    /** Runs after `create`, and whenever a dynamic prop changed. */
    fun update(view: View, props: P)

    fun destroy(view: View) {}
}

// ---------------------------------------------------------------------------
// Style
// ---------------------------------------------------------------------------

enum class FlexDirection { Row, Column }
enum class Align { FlexStart, Center, FlexEnd, Stretch }
enum class Justify { FlexStart, Center, FlexEnd, SpaceBetween, SpaceAround, SpaceEvenly }
enum class FlexWrap { Nowrap, Wrap }
enum class Overflow { Visible, Hidden, Scroll }
enum class Position { Relative, Absolute }
enum class Display { Flex, None }
enum class FontWeight(internal val weight: Int) { Light(300), Normal(400), Medium(500), Semibold(600), Bold(700) }
enum class FontStyle { Normal, Italic }
enum class TextAlign { Left, Center, Right }
enum class TextDecoration { None, Underline, LineThrough }
enum class Easing { Linear, Ease, EaseIn, EaseOut, EaseInOut, Spring }
enum class TextTransform { None, Uppercase, Lowercase, Capitalize }
enum class ObjectFit { Cover, Contain, Fill }
enum class PointerEvents { Auto, None }

/** A style merged while the window's width (dp) is within `min`…`max` (`@media`, a theme's screens). */
data class MediaRule(val min: Double?, val max: Double?, val style: Style) {
    internal fun matches(width: Double) = (min == null || width >= min) && (max == null || width <= max)
}

/** A keyframes() stop: `at` in 0…1. */
data class KeyframeStop(val at: Double, val style: Style)

/** A style's `animation`: keyframes, in milliseconds; `iterations` -1 runs forever. */
data class StyleAnimation(
    val frames: List<KeyframeStop>,
    val duration: Double,
    val delay: Double,
    val easing: Easing,
    val iterations: Int,
    val alternate: Boolean,
)

/** The style subset every runtime lays out the same way, in dp. Parameters follow NATIVE_STYLE_KEYS (src/styleAliases.ts). */
data class Style(
    val flexDirection: FlexDirection? = null,
    val alignItems: Align? = null,
    val alignSelf: Align? = null,
    val justifyContent: Justify? = null,
    val flexWrap: FlexWrap? = null,
    val flex: Double? = null,
    val gap: Double? = null,
    val margin: Double? = null,
    val marginTop: Double? = null,
    val marginRight: Double? = null,
    val marginBottom: Double? = null,
    val marginLeft: Double? = null,
    val padding: Double? = null,
    val paddingTop: Double? = null,
    val paddingRight: Double? = null,
    val paddingBottom: Double? = null,
    val paddingLeft: Double? = null,
    val width: Double? = null,
    val widthPct: Double? = null,
    val height: Double? = null,
    val minWidth: Double? = null,
    val maxWidth: Double? = null,
    val minHeight: Double? = null,
    val maxHeight: Double? = null,
    val aspectRatio: Double? = null,
    val overflow: Overflow? = null,
    val position: Position? = null,
    val top: Double? = null,
    val right: Double? = null,
    val bottom: Double? = null,
    val left: Double? = null,
    val zIndex: Double? = null,
    val display: Display? = null,
    val backgroundColor: String? = null,
    val color: String? = null,
    val opacity: Double? = null,
    val borderRadius: Double? = null,
    val borderWidth: Double? = null,
    val borderColor: String? = null,
    val borderTopWidth: Double? = null,
    val borderRightWidth: Double? = null,
    val borderBottomWidth: Double? = null,
    val borderLeftWidth: Double? = null,
    val borderTopColor: String? = null,
    val borderRightColor: String? = null,
    val borderBottomColor: String? = null,
    val borderLeftColor: String? = null,
    val shadowColor: String? = null,
    val shadowRadius: Double? = null,
    val shadowOffsetX: Double? = null,
    val shadowOffsetY: Double? = null,
    val fontSize: Double? = null,
    val fontWeight: FontWeight? = null,
    val fontStyle: FontStyle? = null,
    val fontFamily: String? = null,
    val lineHeight: Double? = null,
    val letterSpacing: Double? = null,
    val textAlign: TextAlign? = null,
    val textDecoration: TextDecoration? = null,
    val textTransform: TextTransform? = null,
    val numberOfLines: Double? = null,
    val placeholderColor: String? = null,
    val objectFit: ObjectFit? = null,
    val pointerEvents: PointerEvents? = null,
    val translateX: Double? = null,
    val translateY: Double? = null,
    val scale: Double? = null,
    val rotate: Double? = null,
    val transitionDuration: Double? = null,
    val transitionDelay: Double? = null,
    val transitionEasing: Easing? = null,
    val animation: StyleAnimation? = null,
    val media: List<MediaRule>? = null,
    val pressed: Style? = null,
    val hover: Style? = null,
    val focused: Style? = null,
    val disabled: Style? = null,
    val enabled: Style? = null,
    val checked: Style? = null,
    val placeholderShown: Style? = null,
    val first: Style? = null,
    val last: Style? = null,
    val only: Style? = null,
    val odd: Style? = null,
    val even: Style? = null,
    val empty: Style? = null,
) {
    /** `o`'s set values win, as later declarations do in CSS; a shorthand (`padding`, `margin`, `borderWidth`, `borderColor`) resets the sides before it. */
    fun merged(o: Style): Style {
        val resetPadding = o.padding != null
        val resetMargin = o.margin != null
        val resetWidths = o.borderWidth != null
        val resetColors = o.borderColor != null
        return Style(
            flexDirection = o.flexDirection ?: flexDirection,
            alignItems = o.alignItems ?: alignItems,
            alignSelf = o.alignSelf ?: alignSelf,
            justifyContent = o.justifyContent ?: justifyContent,
            flexWrap = o.flexWrap ?: flexWrap,
            flex = o.flex ?: flex,
            gap = o.gap ?: gap,
            margin = o.margin ?: margin,
            marginTop = o.marginTop ?: if (resetMargin) null else marginTop,
            marginRight = o.marginRight ?: if (resetMargin) null else marginRight,
            marginBottom = o.marginBottom ?: if (resetMargin) null else marginBottom,
            marginLeft = o.marginLeft ?: if (resetMargin) null else marginLeft,
            padding = o.padding ?: padding,
            paddingTop = o.paddingTop ?: if (resetPadding) null else paddingTop,
            paddingRight = o.paddingRight ?: if (resetPadding) null else paddingRight,
            paddingBottom = o.paddingBottom ?: if (resetPadding) null else paddingBottom,
            paddingLeft = o.paddingLeft ?: if (resetPadding) null else paddingLeft,
            width = if (o.widthPct != null) null else o.width ?: width,
            widthPct = if (o.width != null) null else o.widthPct ?: widthPct,
            height = o.height ?: height,
            minWidth = o.minWidth ?: minWidth,
            maxWidth = o.maxWidth ?: maxWidth,
            minHeight = o.minHeight ?: minHeight,
            maxHeight = o.maxHeight ?: maxHeight,
            aspectRatio = o.aspectRatio ?: aspectRatio,
            overflow = o.overflow ?: overflow,
            position = o.position ?: position,
            top = o.top ?: top,
            right = o.right ?: right,
            bottom = o.bottom ?: bottom,
            left = o.left ?: left,
            zIndex = o.zIndex ?: zIndex,
            display = o.display ?: display,
            backgroundColor = o.backgroundColor ?: backgroundColor,
            color = o.color ?: color,
            opacity = o.opacity ?: opacity,
            borderRadius = o.borderRadius ?: borderRadius,
            borderWidth = o.borderWidth ?: borderWidth,
            borderColor = o.borderColor ?: borderColor,
            borderTopWidth = o.borderTopWidth ?: if (resetWidths) null else borderTopWidth,
            borderRightWidth = o.borderRightWidth ?: if (resetWidths) null else borderRightWidth,
            borderBottomWidth = o.borderBottomWidth ?: if (resetWidths) null else borderBottomWidth,
            borderLeftWidth = o.borderLeftWidth ?: if (resetWidths) null else borderLeftWidth,
            borderTopColor = o.borderTopColor ?: if (resetColors) null else borderTopColor,
            borderRightColor = o.borderRightColor ?: if (resetColors) null else borderRightColor,
            borderBottomColor = o.borderBottomColor ?: if (resetColors) null else borderBottomColor,
            borderLeftColor = o.borderLeftColor ?: if (resetColors) null else borderLeftColor,
            shadowColor = o.shadowColor ?: shadowColor,
            shadowRadius = o.shadowRadius ?: shadowRadius,
            shadowOffsetX = o.shadowOffsetX ?: shadowOffsetX,
            shadowOffsetY = o.shadowOffsetY ?: shadowOffsetY,
            fontSize = o.fontSize ?: fontSize,
            fontWeight = o.fontWeight ?: fontWeight,
            fontStyle = o.fontStyle ?: fontStyle,
            fontFamily = o.fontFamily ?: fontFamily,
            lineHeight = o.lineHeight ?: lineHeight,
            letterSpacing = o.letterSpacing ?: letterSpacing,
            textAlign = o.textAlign ?: textAlign,
            textDecoration = o.textDecoration ?: textDecoration,
            textTransform = o.textTransform ?: textTransform,
            numberOfLines = o.numberOfLines ?: numberOfLines,
            placeholderColor = o.placeholderColor ?: placeholderColor,
            objectFit = o.objectFit ?: objectFit,
            pointerEvents = o.pointerEvents ?: pointerEvents,
            translateX = o.translateX ?: translateX,
            translateY = o.translateY ?: translateY,
            scale = o.scale ?: scale,
            rotate = o.rotate ?: rotate,
            transitionDuration = o.transitionDuration ?: transitionDuration,
            transitionDelay = o.transitionDelay ?: transitionDelay,
            transitionEasing = o.transitionEasing ?: transitionEasing,
            animation = o.animation ?: animation,
            media = if (o.media == null) media else if (media == null) o.media else media + o.media,
            pressed = state(pressed, o.pressed),
            hover = state(hover, o.hover),
            focused = state(focused, o.focused),
            disabled = state(disabled, o.disabled),
            enabled = state(enabled, o.enabled),
            checked = state(checked, o.checked),
            placeholderShown = state(placeholderShown, o.placeholderShown),
            first = state(first, o.first),
            last = state(last, o.last),
            only = state(only, o.only),
            odd = state(odd, o.odd),
            even = state(even, o.even),
            empty = state(empty, o.empty),
        )
    }

    private fun state(mine: Style?, theirs: Style?) = if (theirs == null) mine else mine?.merged(theirs) ?: theirs

    /** The properties a child takes from its parent unless it sets them. */
    internal val inherited
        get() = Style(
            color = color, fontSize = fontSize, fontWeight = fontWeight, fontStyle = fontStyle, fontFamily = fontFamily,
            lineHeight = lineHeight, letterSpacing = letterSpacing, textAlign = textAlign, textTransform = textTransform,
        )

    /** The border's width on each side in dp, a side's own or `borderWidth`: top, right, bottom, left. */
    internal val borders: DoubleArray
        get() {
            val b = borderWidth ?: 0.0
            return doubleArrayOf(borderTopWidth ?: b, borderRightWidth ?: b, borderBottomWidth ?: b, borderLeftWidth ?: b)
        }

    /** Whether every side has the same border: the drawable's own stroke draws it, with the corners rounded. */
    internal val uniformBorder: Boolean
        get() {
            val b = borders
            val c = borderColor
            return b[0] == b[1] && b[0] == b[2] && b[0] == b[3] &&
                (borderTopColor ?: c) == c && (borderRightColor ?: c) == c && (borderBottomColor ?: c) == c && (borderLeftColor ?: c) == c
        }

    /** Padding plus border, in px: top, right, bottom, left. */
    internal val insets: FloatArray
        get() {
            val b = borders
            return floatArrayOf(
                px((paddingTop ?: padding ?: 0.0) + b[0]),
                px((paddingRight ?: padding ?: 0.0) + b[1]),
                px((paddingBottom ?: padding ?: 0.0) + b[2]),
                px((paddingLeft ?: padding ?: 0.0) + b[3]),
            )
        }

    /** `lineHeight` in dp: a bare number under 4 is a multiple of the font size, as in CSS; 1.2 of it when unset. */
    internal val lineHeightDp: Double
        get() {
            val size = fontSize ?: 15.0
            val lh = lineHeight ?: return kotlin.math.round(size * 1.2)
            return if (lh < 4) kotlin.math.round(size * lh) else lh
        }

    /** Whether the style changes with the box's place among its siblings. */
    internal val structural get() = first != null || last != null || only != null || odd != null || even != null

    /** Margins in px: top, right, bottom, left. */
    internal val margins: FloatArray
        get() = floatArrayOf(px(marginTop ?: margin ?: 0.0), px(marginRight ?: margin ?: 0.0), px(marginBottom ?: margin ?: 0.0), px(marginLeft ?: margin ?: 0.0))

    internal val hasShadow get() = shadowRadius != null || shadowColor != null

    /** Whether `o` gives the same boxes: a change of paint or transform alone needs no layout pass. */
    internal fun sameLayout(o: Style) =
        flexDirection == o.flexDirection && alignItems == o.alignItems && alignSelf == o.alignSelf && justifyContent == o.justifyContent &&
            flexWrap == o.flexWrap && flex == o.flex && gap == o.gap && margin == o.margin && marginTop == o.marginTop &&
            marginRight == o.marginRight && marginBottom == o.marginBottom && marginLeft == o.marginLeft && padding == o.padding &&
            paddingTop == o.paddingTop && paddingRight == o.paddingRight && paddingBottom == o.paddingBottom && paddingLeft == o.paddingLeft &&
            width == o.width && widthPct == o.widthPct && height == o.height && minWidth == o.minWidth && maxWidth == o.maxWidth && minHeight == o.minHeight &&
            maxHeight == o.maxHeight && aspectRatio == o.aspectRatio && position == o.position && top == o.top && right == o.right &&
            bottom == o.bottom && left == o.left && zIndex == o.zIndex && display == o.display && borderWidth == o.borderWidth &&
            borderTopWidth == o.borderTopWidth && borderRightWidth == o.borderRightWidth && borderBottomWidth == o.borderBottomWidth &&
            borderLeftWidth == o.borderLeftWidth && textTransform == o.textTransform &&
            fontSize == o.fontSize && fontWeight == o.fontWeight && fontStyle == o.fontStyle && fontFamily == o.fontFamily &&
            lineHeight == o.lineHeight && letterSpacing == o.letterSpacing && numberOfLines == o.numberOfLines
}

class StyleClass internal constructor(internal val style: Style) : NodeMod {
    override fun apply(node: Node) {
        node.classes.add(style)
    }
}

fun css(style: Style): StyleClass = StyleClass(style)

fun cx(vararg classes: StyleClass?): StyleClass = StyleClass(classes.filterNotNull().fold(Style()) { acc, c -> acc.merged(c.style) })

class Compound(internal val match: Map<String, String>, internal val style: Style)

/** A variants() recipe: base, then each selected value in declaration order, then the matching compounds. */
class Variants(
    private val base: Style,
    private val variants: Map<String, Map<String, Style>>,
    private val defaults: Map<String, String>,
    private val compounds: List<Compound>,
) {
    private val cache = HashMap<String, StyleClass>()

    operator fun invoke(selection: Map<String, String> = emptyMap()): StyleClass {
        val chosen = LinkedHashMap(defaults).apply { putAll(selection) }
        for ((group, values) in variants) if (chosen[group] == null && values.containsKey("false")) chosen[group] = "false"
        val key = chosen.entries.sortedBy { it.key }.joinToString(";") { "${it.key}=${it.value}" }
        return cache.getOrPut(key) {
            var style = base
            for ((group, values) in variants) chosen[group]?.let { values[it] }?.let { style = style.merged(it) }
            for (c in compounds) if (c.match.all { chosen[it.key] == it.value }) style = style.merged(c.style)
            StyleClass(style)
        }
    }
}

private val colorCache = HashMap<String, Int?>()

internal fun parseColor(value: String?): Int? {
    value ?: return null
    return colorCache.getOrPut(value) { parseColorText(value) }
}

private val NAMED_COLORS = hashMapOf(
    "white" to "#ffffff", "black" to "#000000", "red" to "#ff0000", "green" to "#008000", "blue" to "#0000ff", "yellow" to "#ffff00",
    "orange" to "#ffa500", "purple" to "#800080", "pink" to "#ffc0cb", "gray" to "#808080", "grey" to "#808080", "silver" to "#c0c0c0",
    "navy" to "#000080", "teal" to "#008080", "maroon" to "#800000", "olive" to "#808000", "lime" to "#00ff00", "aqua" to "#00ffff",
    "cyan" to "#00ffff", "fuchsia" to "#ff00ff", "magenta" to "#ff00ff", "indigo" to "#4b0082", "violet" to "#ee82ee", "brown" to "#a52a2a",
    "gold" to "#ffd700", "coral" to "#ff7f50", "salmon" to "#fa8072", "tomato" to "#ff6347", "crimson" to "#dc143c", "skyblue" to "#87ceeb",
    "lightgray" to "#d3d3d3", "lightgrey" to "#d3d3d3", "darkgray" to "#a9a9a9", "darkgrey" to "#a9a9a9", "whitesmoke" to "#f5f5f5",
)

/** CSS colours: `#rgb(a)`, `#rrggbb(aa)`, `rgb()` / `rgba()`, `hsl()` / `hsla()`, `transparent` and the common names. */
internal fun parseColorText(value: String): Int? {
    val v = value.trim().lowercase()
    if (v == "transparent") return Color.TRANSPARENT
    NAMED_COLORS[v]?.let { return parseColorText(it) }
    if (v.startsWith("rgb") || v.startsWith("hsl")) {
        val open = v.indexOf('(')
        val close = v.lastIndexOf(')')
        if (open < 0 || close < open) return null
        val parts = v.substring(open + 1, close).split(',', ' ', '/').filter { it.isNotEmpty() }
        if (parts.size < 3) return null
        fun number(part: String, full: Double) =
            if (part.endsWith("%")) (part.dropLast(1).toDoubleOrNull() ?: 0.0) / 100 * full else part.removeSuffix("deg").toDoubleOrNull() ?: 0.0
        fun channel(x: Double) = (x.coerceIn(0.0, 1.0) * 255).roundToInt()
        val alpha = channel(if (parts.size > 3) number(parts[3], 1.0) else 1.0)
        if (v.startsWith("rgb")) return Color.argb(alpha, channel(number(parts[0], 255.0) / 255), channel(number(parts[1], 255.0) / 255), channel(number(parts[2], 255.0) / 255))
        // HSL → RGB, as CSS defines it.
        val h = number(parts[0], 360.0)
        val sat = number(parts[1], 1.0)
        val l = number(parts[2], 1.0)
        fun f(n: Double): Int {
            val k = (n + h / 30) % 12
            return channel(l - sat * min(l, 1 - l) * max(-1.0, minOf(k - 3, 9 - k, 1.0)))
        }
        return Color.argb(alpha, f(0.0), f(8.0), f(4.0))
    }
    if (!v.startsWith("#")) return null
    var hex = v.substring(1)
    if (hex.length == 3 || hex.length == 4) hex = hex.map { "$it$it" }.joinToString("")
    if (hex.length != 6 && hex.length != 8) return null
    val n = hex.toLongOrNull(16) ?: return null
    val rgba = if (hex.length == 6) (n shl 8) or 0xff else n
    return Color.argb((rgba and 0xff).toInt(), ((rgba shr 24) and 0xff).toInt(), ((rgba shr 16) and 0xff).toInt(), ((rgba shr 8) and 0xff).toInt())
}

private val TEXT_TAGS = hashSetOf(
    "span", "p", "h1", "h2", "h3", "h4", "h5", "h6", "label", "strong", "b", "small", "em", "i", "u", "s", "del", "ins", "mark", "code",
    "pre", "kbd", "samp", "var", "abbr", "cite", "q", "dfn", "sub", "sup", "time", "legend", "caption", "figcaption", "summary", "dt", "dd", "a",
    "bdi", "bdo", "data", "output", "rt", "rp", "ruby",
)

private val TAG_STYLES = hashMapOf(
    "h1" to Style(fontSize = 32.0, fontWeight = FontWeight.Bold),
    "h2" to Style(fontSize = 22.0, fontWeight = FontWeight.Bold),
    "h3" to Style(fontSize = 19.0, fontWeight = FontWeight.Bold),
    "h4" to Style(fontSize = 17.0, fontWeight = FontWeight.Bold),
    "h5" to Style(fontSize = 15.0, fontWeight = FontWeight.Bold),
    "h6" to Style(fontSize = 13.0, fontWeight = FontWeight.Bold),
    "strong" to Style(fontWeight = FontWeight.Bold),
    "b" to Style(fontWeight = FontWeight.Bold),
    "th" to Style(flex = 1.0, fontWeight = FontWeight.Bold),
    "dt" to Style(fontWeight = FontWeight.Bold),
    "td" to Style(flex = 1.0),
    "tr" to Style(flexDirection = FlexDirection.Row),
    "small" to Style(fontSize = 12.0),
    "sub" to Style(fontSize = 12.0),
    "sup" to Style(fontSize = 12.0),
    "em" to Style(fontStyle = FontStyle.Italic),
    "i" to Style(fontStyle = FontStyle.Italic),
    "cite" to Style(fontStyle = FontStyle.Italic),
    "dfn" to Style(fontStyle = FontStyle.Italic),
    "var" to Style(fontStyle = FontStyle.Italic),
    "u" to Style(textDecoration = TextDecoration.Underline),
    "ins" to Style(textDecoration = TextDecoration.Underline),
    "s" to Style(textDecoration = TextDecoration.LineThrough),
    "del" to Style(textDecoration = TextDecoration.LineThrough),
    "mark" to Style(backgroundColor = "#fef08a"),
    "code" to Style(fontFamily = "monospace"),
    "pre" to Style(fontFamily = "monospace"),
    "kbd" to Style(fontFamily = "monospace"),
    "samp" to Style(fontFamily = "monospace"),
    "a" to Style(color = "#2563eb"),
    "hr" to Style(height = 1.0, backgroundColor = "#cbd5e1"),
    "head" to Style(display = Display.None),
    "base" to Style(display = Display.None),
    "link" to Style(display = Display.None),
    "meta" to Style(display = Display.None),
    "script" to Style(display = Display.None),
    "style" to Style(display = Display.None),
    "title" to Style(display = Display.None),
    "template" to Style(display = Display.None),
    "noscript" to Style(display = Display.None),
    "datalist" to Style(display = Display.None),
    "area" to Style(display = Display.None),
    "source" to Style(display = Display.None),
    "track" to Style(display = Display.None),
    "wbr" to Style(display = Display.None),
    "br" to Style(height = 16.0),
    "select" to Style(overflow = Overflow.Hidden, backgroundColor = "#ffffff", borderRadius = 8.0, borderWidth = 1.0, borderColor = "#cbd5e1"),
    "progress" to Style(flexDirection = FlexDirection.Row, width = 160.0, height = 16.0, overflow = Overflow.Hidden, backgroundColor = "#e5e7eb", borderRadius = 8.0),
    "meter" to Style(flexDirection = FlexDirection.Row, width = 80.0, height = 16.0, overflow = Overflow.Hidden, backgroundColor = "#e5e7eb", borderRadius = 8.0),
    "button" to Style(paddingTop = 8.0, paddingRight = 14.0, paddingBottom = 8.0, paddingLeft = 14.0, color = "#2563eb"),
    "input" to Style(padding = 8.0),
    "textarea" to Style(padding = 8.0),
)

internal val NO_STYLE = Style()

/** globalStyle(): "body" for the screens and what every root inherits; a tag's merged over its default style. */
private val globalStyles = HashMap<String, Style>()

fun globalStyle(selectors: String, style: Style) {
    for (part in selectors.split(",")) {
        var tag = part.trim()
        if (tag == "html" || tag == ":root" || tag == "*") tag = "body"
        globalStyles[tag] = (globalStyles[tag] ?: TAG_STYLES[tag] ?: NO_STYLE).merged(style)
    }
}

/** The screens' background: the body's, or white. */
internal val screenBackground get() = parseColor(globalStyles["body"]?.backgroundColor) ?: Color.WHITE

/** What the browser (and nuclo-native) give each tag before any style, and what globalStyle() adds. */
private fun tagStyle(tag: String) = globalStyles[tag] ?: TAG_STYLES[tag] ?: NO_STYLE

internal fun px(dp: Double): Float = (dp * Runtime.density).toFloat()
internal fun dp(px: Float): Double = (px / Runtime.density).toDouble()

/**
 * A view's background: the fill, border and corners, and a CSS-like drop shadow drawn outside the
 * bounds. Being the view's own drawing, the shadow follows its transforms and opacity, and needs no
 * elevation (which would reorder siblings).
 */
internal class Backdrop : GradientDrawable() {
    var shadow = false
    var shadowColor = 0
    var shadowBlur = 0f
    var shadowX = 0f
    var shadowY = 0f
    var radius = 0f
    /** Borders that differ per side, in px (top, right, bottom, left) and their colours; drawn over the fill. */
    var sides: FloatArray? = null
    val sideColors = IntArray(4)
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val path = Path()

    override fun draw(canvas: Canvas) {
        val b = bounds
        // A radius past half the box is a pill, as in CSS (GradientDrawable clamps its fill, stroke and outline the same way).
        val r = min(radius, min(b.width(), b.height()) / 2f)
        if (shadow) {
            path.rewind()
            path.addRoundRect(b.left.toFloat(), b.top.toFloat(), b.right.toFloat(), b.bottom.toFloat(), r, r, Path.Direction.CW)
            paint.color = shadowColor or 0xFF000000.toInt()
            // CSS blur is twice the standard deviation; Android's radius is about 1.73 of them.
            paint.setShadowLayer(max(shadowBlur * 0.87f, 0.01f), shadowX, shadowY, shadowColor)
            val save = canvas.save()
            canvas.clipOutPath(path)
            canvas.drawPath(path, paint)
            canvas.restoreToCount(save)
        }
        super.draw(canvas)
        val w = sides ?: return
        val l = b.left.toFloat()
        val t = b.top.toFloat()
        val rt = b.right.toFloat()
        val bt = b.bottom.toFloat()
        paint.clearShadowLayer()
        paint.style = Paint.Style.FILL
        if (w[0] > 0) canvas.drawRect(l, t, rt, t + w[0], paint.apply { color = sideColors[0] })
        if (w[1] > 0) canvas.drawRect(rt - w[1], t, rt, bt, paint.apply { color = sideColors[1] })
        if (w[2] > 0) canvas.drawRect(l, bt - w[2], rt, bt, paint.apply { color = sideColors[2] })
        if (w[3] > 0) canvas.drawRect(l, t, l + w[3], bt, paint.apply { color = sideColors[3] })
    }
}

private val EASE = PathInterpolator(0.25f, 0.1f, 0.25f, 1f)
private val EASE_IN = PathInterpolator(0.42f, 0f, 1f, 1f)
private val EASE_OUT = PathInterpolator(0f, 0f, 0.58f, 1f)
private val EASE_IN_OUT = PathInterpolator(0.42f, 0f, 0.58f, 1f)
private val LINEAR = LinearInterpolator()
private val SPRING = OvershootInterpolator(1.6f)

private fun interpolator(easing: Easing?): TimeInterpolator = when (easing) {
    Easing.Linear -> LINEAR
    Easing.EaseIn -> EASE_IN
    Easing.EaseOut -> EASE_OUT
    Easing.EaseInOut -> EASE_IN_OUT
    Easing.Spring -> SPRING
    else -> EASE
}

// ---------------------------------------------------------------------------
// Node
// ---------------------------------------------------------------------------

class Node internal constructor(internal val kind: Kind, internal val tag: String, native: View? = null) : NodeMod {
    internal enum class Kind { Box, Text, Button, Input, Checkbox, Textarea, Image, Native, Fragment }

    /** A box's container. It is the box's `view`, unless the box scrolls: then the scroller around it is. */
    internal val flex: FlexLayout? = if (kind == Kind.Box) FlexLayout(Runtime.activity, this) else null

    /** What the parent places. */
    internal var view: View? = Runtime.activity.let { ctx ->
        when (kind) {
            Kind.Box -> flex
            // No default style (defStyleAttr 0): the runtime sets every text property itself, and
            // resolving the theme's textViewStyle was the largest cost of building a row.
            Kind.Text -> NText(ctx)
            Kind.Button -> NText(ctx).apply {
                gravity = Gravity.CENTER
                isClickable = true
                foreground = ctx.getDrawable(Runtime.rippleId)
            }
            Kind.Input -> EditText(ctx).apply {
                isSingleLine = true
                imeOptions = EditorInfo.IME_ACTION_DONE
            }
            Kind.Checkbox -> CheckBox(ctx)
            Kind.Textarea -> EditText(ctx).apply { inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_MULTI_LINE }
            Kind.Image -> ImageView(ctx).apply { scaleType = ImageView.ScaleType.CENTER_CROP }
            Kind.Native -> native
            Kind.Fragment -> null
        }
    }
        private set

    internal var parent: Node? = null
    internal var children = mutableListOf<Node>()
    internal val scopes = HashSet<String>()

    /** Dynamic values, re-run by update(). */
    internal val bindings = mutableListOf<() -> Unit>()
    /** list/when/region: reconciles `children` before they refresh. */
    internal var reconcile: (() -> Unit)? = null
    internal val teardown = mutableListOf<() -> Unit>()

    internal val mountCallbacks = mutableListOf<(View) -> Cleanup?>()
    internal val destroyCallbacks = mutableListOf<(View) -> Unit>()
    private val cleanups = mutableListOf<Cleanup>()
    private var mounted = false
    private var watching = false
    internal var destroyed = false
        private set

    private val textParts = mutableListOf<() -> String>()
    private var lastText: String? = null

    internal val classes = mutableListOf<Style>()
    internal var dynamicClass: (() -> StyleClass)? = null
    internal var inline = Style()
    internal var dynamicInline: (() -> Style)? = null
    internal var computed = Style()
        private set
    private var painted: Style? = null
    private var base: Style? = null
    private var baseParent: Style? = null
    private var shape: Backdrop? = null
    private var shapeColor = Color.TRANSPARENT
    private var colorAnimator: ValueAnimator? = null
    private var keyframes: ValueAnimator? = null

    // A transition of `width` / `height`: the size layout uses while it runs, in px.
    private var shownWidth: Float? = null
    private var shownHeight: Float? = null
    private var sizeAnimator: ValueAnimator? = null

    /** The update pass this node was built in: its bindings already ran then. */
    private val born = Runtime.generation

    private val listeners = HashMap<String, (NativeEvent) -> Unit>()
    internal var touch: Touch? = null
        private set
    internal var onScroll: ((ScrollEvent) -> Unit)? = null
    internal var href: String? = null
    private var pressedNow = false
    private var hoveredNow = false
    private var focusedNow = false
    private var disabledNow = false
    /** Set while the runtime writes a control, so it reports no event (as in the browser). */
    private var writing = false

    /** A native component's props, and whether one changed since its last `update`. */
    internal var nativeProps: Any? = null
    internal var propsDirty = true

    init {
        view?.tag = this
        wireEvents()
    }

    override fun apply(node: Node) = node.append(this)

    internal fun append(child: Node) {
        child.parent = this
        children.add(child)
    }

    internal fun add(mods: List<NodeMod?>) {
        for (mod in mods) mod?.apply(this)
    }

    /** Called once the builder applied its arguments: a box that scrolls gets its scroller, then its views. */
    internal fun finish() {
        if (kind == Kind.Box) {
            var s = tagStyle(tag)
            for (c in classes) s = s.merged(c)
            s = s.merged(inline)
            if (s.overflow == Overflow.Scroll) wrapInScroller(s.flexDirection == FlexDirection.Row)
        }
        syncViews()
    }

    /** `overflow: scroll` is read from the static styles: the scroller has to exist before the children arrive. */
    private fun wrapInScroller(horizontal: Boolean) {
        val ctx = Runtime.activity
        val content = flex ?: return
        val scroller: FrameLayout = if (horizontal) {
            HorizontalScrollView(ctx).apply {
                isFillViewport = true
                isHorizontalScrollBarEnabled = false
                addView(content, FrameLayout.LayoutParams(FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.MATCH_PARENT))
            }
        } else {
            ScrollView(ctx).apply {
                isFillViewport = true
                addView(content, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT))
            }
        }
        scroller.setOnScrollChangeListener { _, x, y, _, _ ->
            onScroll?.invoke(
                ScrollEvent(dp(y.toFloat()), dp(x.toFloat()), dp(content.height.toFloat()), dp(content.width.toFloat()), dp(scroller.height.toFloat()), dp(scroller.width.toFloat())),
            )
        }
        scroller.tag = this
        view = scroller
    }

    internal val scrolls get() = view !== flex && flex != null

    /** The nearest node with a view: where this node's views are inserted. */
    private val host: Node?
        get() {
            var n = parent
            while (n != null && n.view == null) n = n.parent
            return n
        }

    /** This node's views in order: its own, or a fragment's children's. */
    internal val flatViews: List<Node> get() = if (view != null) listOf(this) else children.flatMap { it.flatViews }

    internal fun syncViews() {
        val container = flex
        if (container != null) container.setItems(children.flatMap { it.flatViews }) else host?.syncViews()
    }

    // Bindings ---------------------------------------------------------------

    /** Runs `get` now and on each update; `set` only sees values that changed (or every value, in forceUpdate()). */
    internal fun <T> bind(get: () -> T, set: (T) -> Unit) {
        var first = true
        var last: T? = null
        val run = {
            val value = get()
            if (first || Runtime.forcing || value != last) {
                first = false
                last = value
                set(value)
            }
        }
        run()
        bindings.add(run)
    }

    internal fun addText(part: () -> String) {
        when (kind) {
            Kind.Text, Kind.Button -> {
                if (textParts.isEmpty()) bindings.add { renderText() }
                textParts.add(part)
                renderText()
            }
            Kind.Box -> append(Node(Kind.Text, "span").also { it.addText(part) })
            else -> {}
        }
    }

    private fun renderText() {
        val text = if (textParts.size == 1) textParts[0]() else textParts.joinToString("") { it() }
        if (text == lastText) return
        lastText = text
        (view as? TextView)?.text = transformed(text)
    }

    /** `textTransform`, as CSS applies it. */
    private fun transformed(text: String) = when (computed.textTransform) {
        TextTransform.Uppercase -> text.uppercase()
        TextTransform.Lowercase -> text.lowercase()
        TextTransform.Capitalize -> text.split(" ").joinToString(" ") { w -> w.replaceFirstChar { it.uppercase() } }
        else -> text
    }

    // Refresh ----------------------------------------------------------------

    internal fun refresh() {
        if (destroyed || born == Runtime.generation) return
        reconcile?.invoke()
        if (bindings.size == 1) bindings[0]() else if (bindings.isNotEmpty()) for (binding in bindings.toList()) binding()
        applyStyle()
        if (children.isNotEmpty()) for (child in children.toList()) child.refresh()
    }

    internal fun applyStylesDeep() {
        applyStyle()
        for (child in children) child.applyStylesDeep()
    }

    internal fun applyStyle() {
        val v = view
        if (v == null) {
            computed = parent?.computed ?: NO_STYLE
            return
        }
        // The static part (inherited, tag, classes, inline) is merged once per parent style: an
        // update then costs one merge for the dynamic style, and nothing when there is none.
        val from = parent?.computed
        var s = base ?: NO_STYLE
        if (base == null || from !== baseParent) {
            s = (from?.inherited ?: globalStyles["body"]?.inherited ?: NO_STYLE).merged(tagStyle(tag))
            for (c in classes) s = s.merged(c)
            if (dynamicClass == null) s = s.merged(inline)
            base = s
            baseParent = from
        }
        dynamicClass?.let { s = s.merged(it().style).merged(inline) }
        dynamicInline?.let { s = s.merged(it()) }
        // `@media` and screens, against the window's width.
        s.media?.let { media ->
            Runtime.usesMedia = true
            for (rule in media) if (rule.matches(Runtime.viewportWidth)) s = s.merged(rule.style)
        }
        // The box's place among its siblings, and what it holds.
        if (s.structural) siblingPlace()?.let { (index, count) ->
            if (index == 0) s.first?.let { s = s.merged(it) }
            if (index == count - 1) s.last?.let { s = s.merged(it) }
            if (count == 1) s.only?.let { s = s.merged(it) }
            if (index % 2 == 0) s.odd?.let { s = s.merged(it) }
            if (index % 2 == 1) s.even?.let { s = s.merged(it) }
        }
        if (s.empty != null && isEmpty) s = s.merged(s.empty)
        if (s.checked != null && (v as? CheckBox)?.isChecked == true) s = s.merged(s.checked)
        if (s.placeholderShown != null && (v as? EditText)?.text?.isEmpty() == true) s = s.merged(s.placeholderShown)
        if (disabledNow) s.disabled?.let { s = s.merged(it) } else s.enabled?.let { s = s.merged(it) }
        if (s.hover != null && !watchingHover) watchHover(v)
        if (hoveredNow) s.hover?.let { s = s.merged(it) }
        if (focusedNow) s.focused?.let { s = s.merged(it) }
        if (s.pressed != null && touch == null) touch()
        if (pressedNow) s.pressed?.let { s = s.merged(it) }
        val before = painted
        // An unchanged style keeps its identity: the children's cached static styles stay valid.
        if (s == before && !Runtime.forcing) return
        computed = s
        painted = s
        paint(v, s, before)
        if (before == null || !s.sameLayout(before)) {
            v.requestLayout()
            if (before?.zIndex != s.zIndex) (v.parent as? FlexLayout)?.reorder()
        }
    }

    /** This view's index among the views of its container, and how many there are. */
    private fun siblingPlace(): Pair<Int, Int>? {
        val items = (view?.parent as? FlexLayout)?.items ?: return null
        val index = items.indexOf(this)
        return if (index < 0) null else index to items.size
    }

    /** `:empty`: a box with no views, a text with no text. */
    private val isEmpty get() = if (flex != null) flex.items.isEmpty() else lastText.isNullOrEmpty()

    internal fun setDisabled(off: Boolean) {
        disabledNow = off
        view?.isEnabled = !off
        if (computed.disabled != null || computed.enabled != null) applyStyle()
        view?.alpha = (computed.opacity ?: 1.0).toFloat() * (if (off) 0.4f else 1f)
    }

    private var watchingHover = false

    private fun watchHover(v: View) {
        watchingHover = true
        v.setOnHoverListener { _, e ->
            val over = e.action != MotionEvent.ACTION_HOVER_EXIT
            if (over != hoveredNow) {
                hoveredNow = over
                applyStyle()
            }
            false
        }
    }

    private fun paint(v: View, s: Style, before: Style?) {
        // A transition animates what changed since the last paint; the first paint is applied at once.
        val duration = if (before != null) (s.transitionDuration ?: 0.0).toLong() else 0L
        val delay = (s.transitionDelay ?: 0.0).toLong()
        val curve = if (duration > 0) interpolator(s.transitionEasing) else null

        val bg = parseColor(s.backgroundColor) ?: Color.TRANSPARENT
        val widths = s.borders
        val border = widths.any { it > 0 }
        val radius = px(s.borderRadius ?: 0.0)
        val animatesBackground = s.animation?.frames?.any { it.style.backgroundColor != null } == true
        if (bg != Color.TRANSPARENT || border || radius > 0 || s.hasShadow || animatesBackground) {
            val d = shape ?: Backdrop().also {
                shape = it
                shapeColor = Color.TRANSPARENT
                it.setColor(Color.TRANSPARENT)
                v.background = it
            }
            d.cornerRadius = radius
            d.radius = radius
            d.shadow = s.hasShadow
            if (s.hasShadow) {
                d.shadowColor = parseColor(s.shadowColor) ?: 0x40000000
                d.shadowBlur = px(s.shadowRadius ?: 0.0)
                d.shadowX = px(s.shadowOffsetX ?: 0.0)
                d.shadowY = px(s.shadowOffsetY ?: 0.0)
            }
            d.invalidateSelf()
            if (border && s.uniformBorder) {
                d.sides = null
                d.setStroke(px(widths[0]).roundToInt(), parseColor(s.borderColor) ?: Color.BLACK)
            } else {
                d.setStroke(0, Color.TRANSPARENT)
                d.sides = if (border) FloatArray(4) { px(widths[it]) } else null
                val colors = arrayOf(s.borderTopColor, s.borderRightColor, s.borderBottomColor, s.borderLeftColor)
                for (i in 0..3) d.sideColors[i] = parseColor(colors[i] ?: s.borderColor) ?: Color.BLACK
            }
            colorAnimator?.cancel()
            if (curve != null && bg != shapeColor) {
                colorAnimator = ValueAnimator.ofArgb(shapeColor, bg).apply {
                    this.duration = duration
                    startDelay = delay
                    interpolator = curve
                    addUpdateListener {
                        shapeColor = it.animatedValue as Int
                        d.setColor(shapeColor)
                    }
                    start()
                }
            } else {
                shapeColor = bg
                d.setColor(bg)
            }
        } else if (shape != null) {
            colorAnimator?.cancel()
            shape = null
            v.background = null
        } else if (v.background != null && kind == Kind.Box) {
            v.background = null
        }
        val clips = s.overflow == Overflow.Hidden || s.overflow == Overflow.Scroll
        v.clipToOutline = radius > 0 && (clips || kind == Kind.Image)
        if (v.clipToOutline) v.outlineProvider = ViewOutlineProvider.BACKGROUND
        flex?.clipChildren = clips
        v.visibility = if (s.display == Display.None) View.GONE else View.VISIBLE
        // An overlay box (absolute) takes the touches over what is under it.
        if (kind == Kind.Box && s.position == Position.Absolute) v.isClickable = true
        if (v is ImageView && kind == Kind.Image) {
            v.scaleType = when (s.objectFit) {
                ObjectFit.Contain -> ImageView.ScaleType.FIT_CENTER
                ObjectFit.Fill -> ImageView.ScaleType.FIT_XY
                else -> ImageView.ScaleType.CENTER_CROP
            }
        }

        val alpha = (s.opacity ?: 1.0).toFloat() * (if (v.isEnabled) 1f else 0.4f)
        val tx = px(s.translateX ?: 0.0)
        val ty = px(s.translateY ?: 0.0)
        val scale = (s.scale ?: 1.0).toFloat()
        val rotation = (s.rotate ?: 0.0).toFloat()
        if (curve != null) {
            v.animate().alpha(alpha).translationX(tx).translationY(ty).scaleX(scale).scaleY(scale).rotation(rotation)
                .setDuration(duration).setStartDelay(delay).setInterpolator(curve).start()
        } else {
            if (before != null && (before.transitionDuration ?: 0.0) > 0) v.animate().cancel()
            v.alpha = alpha
            v.translationX = tx
            v.translationY = ty
            v.scaleX = scale
            v.scaleY = scale
            v.rotation = rotation
        }

        if (curve != null && before != null) resize(v, before, s, duration, delay, curve)
        if (s.animation != before?.animation) runAnimation(v, s)

        if (v is TextView && kind != Kind.Native) paintText(v, s, before)
    }

    /**
     * A style's keyframes animation: opacity, translate / scale / rotate and the background colour,
     * interpolated between the stops on each frame. The easing applies to the whole run, as on iOS.
     */
    private fun runAnimation(v: View, s: Style) {
        keyframes?.cancel()
        keyframes = null
        val anim = s.animation ?: return
        if (anim.frames.isEmpty() || anim.duration <= 0) return
        val stops = anim.frames.sortedBy { it.at }
        val at = stops.map { s.merged(it.style) }
        val opacity = stops.any { it.style.opacity != null }
        val moves = stops.any { it.style.translateX != null || it.style.translateY != null || it.style.scale != null || it.style.rotate != null }
        val colors = if (stops.any { it.style.backgroundColor != null }) at.map { parseColor(it.backgroundColor) ?: Color.TRANSPARENT } else null
        val evaluator = android.animation.ArgbEvaluator()
        val curve = interpolator(anim.easing)
        keyframes = ValueAnimator.ofFloat(0f, 1f).apply {
            duration = anim.duration.toLong()
            startDelay = anim.delay.toLong()
            interpolator = curve
            repeatCount = if (anim.iterations < 0) ValueAnimator.INFINITE else max(0, anim.iterations - 1)
            repeatMode = if (anim.alternate) ValueAnimator.REVERSE else ValueAnimator.RESTART
            addUpdateListener {
                val t = (it.animatedValue as Float).toDouble()
                var j = stops.indexOfFirst { stop -> stop.at >= t }
                if (j < 0) j = stops.size - 1
                val i = if (j > 0 && stops[j].at > t) j - 1 else j
                val span = stops[j].at - stops[i].at
                val f = if (span > 0) ((t - stops[i].at) / span).coerceIn(0.0, 1.0) else 0.0
                fun mix(a: Double?, b: Double?, unset: Double) = ((a ?: unset) + ((b ?: unset) - (a ?: unset)) * f)
                val a = at[i]
                val b = at[j]
                if (opacity) v.alpha = mix(a.opacity, b.opacity, 1.0).toFloat()
                if (moves) {
                    v.translationX = px(mix(a.translateX, b.translateX, 0.0))
                    v.translationY = px(mix(a.translateY, b.translateY, 0.0))
                    v.scaleX = mix(a.scale, b.scale, 1.0).toFloat()
                    v.scaleY = v.scaleX
                    v.rotation = mix(a.rotate, b.rotate, 0.0).toFloat()
                }
                if (colors != null) shape?.setColor(evaluator.evaluate(f.toFloat(), colors[i], colors[j]) as Int)
            }
            start()
        }
    }

    /**
     * A change of `width` or `height` under a transition: layout runs each frame with the size in
     * between, so the boxes around this one follow it, as they do in a browser.
     */
    private fun resize(v: View, before: Style, s: Style, duration: Long, delay: Long, curve: TimeInterpolator) {
        val widthMoves = before.width != null && s.width != null && before.width != s.width
        val heightMoves = before.height != null && s.height != null && before.height != s.height
        if (!widthMoves && !heightMoves) return
        val fromW = shownWidth ?: px(before.width ?: 0.0)
        val fromH = shownHeight ?: px(before.height ?: 0.0)
        val toW = px(s.width ?: 0.0)
        val toH = px(s.height ?: 0.0)
        sizeAnimator?.cancel()
        if (widthMoves) shownWidth = fromW
        if (heightMoves) shownHeight = fromH
        sizeAnimator = ValueAnimator.ofFloat(0f, 1f).apply {
            this.duration = duration
            startDelay = delay
            interpolator = curve
            addUpdateListener {
                val t = it.animatedValue as Float
                if (widthMoves) shownWidth = if (t >= 1f) null else fromW + (toW - fromW) * t
                if (heightMoves) shownHeight = if (t >= 1f) null else fromH + (toH - fromH) * t
                v.requestLayout()
            }
            start()
        }
    }

    /** Places the view at the frame its parent's layout computed. */
    internal fun place(x: Int, y: Int, w: Int, h: Int) {
        view?.layout(x, y, x + w, y + h)
    }



    private fun paintText(v: TextView, s: Style, before: Style?) {
        val size = (s.fontSize ?: 15.0).toFloat()
        v.setTextSize(TypedValue.COMPLEX_UNIT_DIP, size)
        val family = when (s.fontFamily) {
            null, "sans-serif" -> Typeface.DEFAULT
            "monospace" -> Typeface.MONOSPACE
            "serif" -> Typeface.SERIF
            else -> Typeface.create(s.fontFamily, Typeface.NORMAL)
        }
        val weight = s.fontWeight ?: FontWeight.Normal
        val bold = weight == FontWeight.Bold
        val italic = s.fontStyle == FontStyle.Italic
        v.typeface = when {
            weight != FontWeight.Normal && !bold -> Typeface.create(family, weight.weight, italic)
            family === Typeface.DEFAULT && !italic -> if (bold) Typeface.DEFAULT_BOLD else Typeface.DEFAULT
            else -> Typeface.create(family, (if (bold) Typeface.BOLD else 0) or (if (italic) Typeface.ITALIC else 0))
        }
        v.setTextColor(parseColor(s.color) ?: Color.BLACK)
        if (v is EditText) parseColor(s.placeholderColor)?.let { v.setHintTextColor(it) }
        if (s.textTransform != before?.textTransform) lastText?.let { v.text = transformed(it) }
        v.letterSpacing = if (s.letterSpacing != null) (s.letterSpacing / size).toFloat() else 0f
        // every runtime sets a line 1.2 times its font size unless the style says otherwise
        v.lineHeight = px(s.lineHeightDp).roundToInt()
        v.includeFontPadding = false
        val decoration = when (s.textDecoration) {
            TextDecoration.Underline -> Paint.UNDERLINE_TEXT_FLAG
            TextDecoration.LineThrough -> Paint.STRIKE_THRU_TEXT_FLAG
            else -> 0
        }
        v.paintFlags = (v.paintFlags and (Paint.UNDERLINE_TEXT_FLAG or Paint.STRIKE_THRU_TEXT_FLAG).inv()) or decoration
        if (kind == Kind.Text || kind == Kind.Button) {
            val lines = s.numberOfLines?.toInt()
            v.maxLines = lines ?: Int.MAX_VALUE
            v.ellipsize = if (lines != null) TextUtils.TruncateAt.END else null
        }
        if (kind != Kind.Button) {
            v.gravity = when (s.textAlign) {
                TextAlign.Center -> Gravity.CENTER_HORIZONTAL
                TextAlign.Right -> Gravity.END
                else -> Gravity.START
            } or (if (kind == Kind.Input) Gravity.CENTER_VERTICAL else Gravity.TOP)
        }
        val i = s.insets
        v.setPadding(i[3].roundToInt(), i[0].roundToInt(), i[1].roundToInt(), i[2].roundToInt())
    }

    // Lifecycle --------------------------------------------------------------

    internal fun watchMount() {
        val v = view ?: return
        if (watching) return
        watching = true
        v.addOnAttachStateChangeListener(object : View.OnAttachStateChangeListener {
            override fun onViewAttachedToWindow(view: View) = mount()
            override fun onViewDetachedFromWindow(view: View) {}
        })
        if (v.isAttachedToWindow) mount()
    }

    private fun mount() {
        val v = view ?: return
        if (mounted || destroyed) return
        mounted = true
        for (callback in mountCallbacks) callback(v)?.let { cleanups.add(it) }
    }

    /** Runs onDestroy and cleanups, children first; the views are removed by whoever removed the node. */
    internal fun destroy() {
        if (destroyed) return
        for (child in children) child.destroy()
        destroyed = true
        for (t in teardown) t()
        for (cleanup in cleanups) cleanup()
        view?.let { v -> for (callback in destroyCallbacks) callback(v) }
        colorAnimator?.cancel()
        sizeAnimator?.cancel()
        keyframes?.cancel()
        bindings.clear()
        reconcile = null
    }

    // Events -----------------------------------------------------------------

    private fun fire(type: String) {
        // States that follow what the user (or the runtime) did to the control.
        if ((type == "input" && computed.placeholderShown != null) || (type == "change" && computed.checked != null)) applyStyle()
        if (!writing) listeners[type]?.invoke(NativeEvent(target))
    }

    private fun wireEvents() {
        when (val v = view) {
            is CheckBox -> v.setOnCheckedChangeListener { _, _ -> fire("change") }
            is EditText -> {
                v.addTextChangedListener(object : TextWatcher {
                    override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                    override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
                    override fun afterTextChanged(s: Editable?) = fire("input")
                })
                v.setOnEditorActionListener { _, action, _ ->
                    if (action == EditorInfo.IME_ACTION_DONE) fire("change")
                    false
                }
                v.setOnFocusChangeListener { _, has ->
                    focusedNow = has
                    if (computed.focused != null) applyStyle()
                    fire(if (has) "focus" else "blur")
                }
            }
            else -> {}
        }
    }

    internal fun listen(type: String, handler: (NativeEvent) -> Unit) {
        listeners[type] = handler
        if (type == "click" && kind != Kind.Input && kind != Kind.Textarea && kind != Kind.Checkbox) view?.setOnClickListener { click() }
    }

    /** A click: the app's handler, then a link's URL. */
    internal fun click() {
        fire("click")
        open()
    }

    /** The view's pointers and gestures, made on first use. */
    internal fun touch(): Touch = touch ?: Touch(this, (flex ?: view)!!).also { touch = it }

    internal fun setPressed(down: Boolean) {
        if (pressedNow == down) return
        pressedNow = down
        if (computed.pressed != null || painted?.pressed != null) applyStyle()
    }

    internal fun listenKeys(handler: (KeyboardEvent) -> Unit) {
        val v = view ?: return
        if (kind == Kind.Box) v.isFocusable = true
        v.setOnKeyListener { _, code, event ->
            if (event.action == android.view.KeyEvent.ACTION_DOWN) handler(KeyboardEvent(keyName(code, event)))
            false
        }
    }

    private fun open() {
        val url = href ?: return
        runCatching { Runtime.activity.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) }
    }

    /** Writes a control without reporting it as user input. */
    internal fun write(block: () -> Unit) {
        writing = true
        try {
            block()
        } finally {
            writing = false
        }
    }

    private val target: InputTarget
        get() = when (val v = view) {
            is CheckBox -> InputTarget(if (v.isChecked) "on" else "", v.isChecked)
            is EditText -> InputTarget(v.text.toString(), false)
            else -> InputTarget("", false)
        }

    // Measuring --------------------------------------------------------------

    internal val inFlow get() = computed.position != Position.Absolute && computed.display != Display.None

    /**
     * The border-box size this node takes when given at most `maxWidth` px: [width, height].
     * `exact`: the width is decided (a flex share, a stretch), and only the height is asked.
     */
    internal fun measure(maxWidth: Float, exact: Boolean = false): FloatArray {
        val s = computed
        var width = shownWidth ?: s.width?.let { px(it) } ?: s.widthPct?.let { if (maxWidth < Flex.UNBOUNDED) maxWidth * it.toFloat() / 100f else null }
        var height = shownHeight ?: s.height?.let { px(it) }
        val ratio = s.aspectRatio?.toFloat()
        if (exact && width == null) width = maxWidth
        if (ratio != null && ratio > 0) {
            if (width != null && height == null) height = width / ratio
            else if (height != null && width == null) width = height * ratio
        }
        val minW = s.minWidth?.let { px(it) }
        val maxW = s.maxWidth?.let { px(it) }
        if (width != null) width = clamp(width, minW, maxW)
        val available = width ?: maxW?.let { min(it, maxWidth) } ?: maxWidth
        val v = view ?: return floatArrayOf(0f, 0f)
        val size = when {
            flex != null -> flex.measureFlex(available, height, fit = width == null)
            v is CheckBox -> {
                v.measure(View.MeasureSpec.UNSPECIFIED, View.MeasureSpec.UNSPECIFIED)
                floatArrayOf(v.measuredWidth.toFloat(), v.measuredHeight.toFloat())
            }
            v is ImageView -> floatArrayOf(min(available, px(120.0)), height ?: width ?: px(120.0))
            else -> {
                // Rounded up: a box's fractional insets (a 1 dp border) must not take the last pixel its text was measured with.
                v.measure(View.MeasureSpec.makeMeasureSpec(kotlin.math.ceil(available).toInt().coerceAtLeast(0), View.MeasureSpec.AT_MOST), View.MeasureSpec.UNSPECIFIED)
                val w = if (v is EditText && kind == Kind.Input) min(available, px(180.0)) else v.measuredWidth.toFloat()
                // A line is exactly lineHeight tall on every platform; TextView's own spacing adds only between lines.
                val h = if (v is TextView && v !is EditText) (v.lineCount * v.lineHeight + v.paddingTop + v.paddingBottom).toFloat() else v.measuredHeight.toFloat()
                floatArrayOf(w, h)
            }
        }
        if (width != null) size[0] = width else size[0] = clamp(size[0], minW, maxW)
        if (height != null) size[1] = height
        size[1] = clamp(size[1], s.minHeight?.let { px(it) }, s.maxHeight?.let { px(it) })
        return size
    }
}

private fun clamp(value: Float, low: Float?, high: Float?): Float {
    var v = value
    if (high != null) v = min(v, high)
    if (low != null) v = max(v, low)
    return v
}

/** DOM `key` names for the keys an app is likely to handle. */
private fun keyName(code: Int, event: android.view.KeyEvent): String = when (code) {
    android.view.KeyEvent.KEYCODE_ENTER, android.view.KeyEvent.KEYCODE_NUMPAD_ENTER -> "Enter"
    android.view.KeyEvent.KEYCODE_ESCAPE -> "Escape"
    android.view.KeyEvent.KEYCODE_DEL -> "Backspace"
    android.view.KeyEvent.KEYCODE_FORWARD_DEL -> "Delete"
    android.view.KeyEvent.KEYCODE_TAB -> "Tab"
    android.view.KeyEvent.KEYCODE_SPACE -> " "
    android.view.KeyEvent.KEYCODE_DPAD_LEFT -> "ArrowLeft"
    android.view.KeyEvent.KEYCODE_DPAD_RIGHT -> "ArrowRight"
    android.view.KeyEvent.KEYCODE_DPAD_UP -> "ArrowUp"
    android.view.KeyEvent.KEYCODE_DPAD_DOWN -> "ArrowDown"
    else -> event.unicodeChar.takeIf { it != 0 }?.toChar()?.toString() ?: android.view.KeyEvent.keyCodeToString(code).removePrefix("KEYCODE_")
}

// ---------------------------------------------------------------------------
// Pointers and gestures
// ---------------------------------------------------------------------------

/**
 * Observes a view's touches. The view stays an ordinary clickable view (press state, ripple, click);
 * this reports pointers, and recognizes a pan (past the touch slop), a pinch, a long press and a
 * double tap with the platform's detectors. A view with a pan or a pinch keeps the gesture from the
 * first touch: a scrolling parent does not take it.
 */
internal class Touch(private val node: Node, private val view: View) : View.OnTouchListener {
    val pointers = HashMap<String, (PointerEvent) -> Unit>()
    var onPan: ((PanEvent) -> Unit)? = null
    var onPinch: ((PinchEvent) -> Unit)? = null

    private val slop = ViewConfiguration.get(view.context).scaledTouchSlop
    private var tracker: VelocityTracker? = null
    private var startX = 0f
    private var startY = 0f
    private var panning = false
    private var pinching = false
    private var pinchScale = 1f

    private val taps = GestureDetector(view.context, object : GestureDetector.SimpleOnGestureListener() {
        override fun onLongPress(e: MotionEvent) {
            pointers["longPress"]?.invoke(pointer(e))
        }

        override fun onDoubleTap(e: MotionEvent): Boolean {
            pointers["doubleClick"]?.invoke(pointer(e))
            return false
        }
    })

    private val scales = ScaleGestureDetector(view.context, object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
        override fun onScaleBegin(d: ScaleGestureDetector): Boolean {
            pinching = true
            pinchScale = 1f
            onPinch?.invoke(PinchEvent("start", 1.0, dp(d.focusX), dp(d.focusY)))
            return true
        }

        override fun onScale(d: ScaleGestureDetector): Boolean {
            pinchScale *= d.scaleFactor
            onPinch?.invoke(PinchEvent("move", pinchScale.toDouble(), dp(d.focusX), dp(d.focusY)))
            return true
        }

        override fun onScaleEnd(d: ScaleGestureDetector) {
            pinching = false
            onPinch?.invoke(PinchEvent("end", pinchScale.toDouble(), dp(d.focusX), dp(d.focusY)))
        }
    })

    init {
        view.isClickable = true
        view.setOnTouchListener(this)
    }

    private fun pointer(e: MotionEvent) = PointerEvent(dp(e.x), dp(e.y), dp(e.rawX), dp(e.rawY), e.getPointerId(e.actionIndex))

    private fun pan(state: String, e: MotionEvent) {
        val t = tracker
        t?.computeCurrentVelocity(1000)
        onPan?.invoke(
            PanEvent(state, dp(e.rawX - startX), dp(e.rawY - startY), dp(t?.xVelocity ?: 0f), dp(t?.yVelocity ?: 0f), dp(e.x), dp(e.y)),
        )
    }

    override fun onTouch(v: View, e: MotionEvent): Boolean {
        if (pointers.containsKey("longPress") || pointers.containsKey("doubleClick")) taps.onTouchEvent(e)
        if (onPinch != null) scales.onTouchEvent(e)
        if (onPan != null) {
            // Velocity in screen coordinates: the view may be following the finger.
            val screen = MotionEvent.obtain(e)
            screen.setLocation(e.rawX, e.rawY)
            (tracker ?: VelocityTracker.obtain().also { tracker = it }).addMovement(screen)
            screen.recycle()
        }
        when (e.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                node.setPressed(true)
                startX = e.rawX
                startY = e.rawY
                panning = false
                if (onPan != null || onPinch != null) v.parent?.requestDisallowInterceptTouchEvent(true)
                pointers["pointerDown"]?.invoke(pointer(e))
            }
            MotionEvent.ACTION_MOVE -> {
                pointers["pointerMove"]?.invoke(pointer(e))
                if (onPan != null && !pinching) {
                    if (panning) {
                        pan("move", e)
                    } else if (max(kotlin.math.abs(e.rawX - startX), kotlin.math.abs(e.rawY - startY)) > slop) {
                        panning = true
                        // The translation counts from where the drag was recognized, so the view does not jump.
                        startX = e.rawX
                        startY = e.rawY
                        // The drag is not a click: the view's own press ends here.
                        val cancel = MotionEvent.obtain(e)
                        cancel.action = MotionEvent.ACTION_CANCEL
                        v.onTouchEvent(cancel)
                        cancel.recycle()
                        pan("start", e)
                    }
                }
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                val cancelled = e.actionMasked == MotionEvent.ACTION_CANCEL
                node.setPressed(false)
                pointers[if (cancelled) "pointerCancel" else "pointerUp"]?.invoke(pointer(e))
                val wasPanning = panning
                if (wasPanning) pan(if (cancelled) "cancel" else "end", e)
                panning = false
                tracker?.recycle()
                tracker = null
                if (wasPanning) return true
            }
        }
        // While it drags, the view's own touch handling (press, click) stays out.
        return panning
    }
}

// ---------------------------------------------------------------------------
// Views and layout
// ---------------------------------------------------------------------------

/** A text or a button's view: a TextView that lets touches through under `pointerEvents: none`. */
internal class NText(context: Context) : TextView(context, null, 0, 0) {
    override fun dispatchTouchEvent(event: MotionEvent): Boolean =
        if ((tag as? Node)?.computed?.pointerEvents == PointerEvents.None) false else super.dispatchTouchEvent(event)
}

/** A container: a flex column (or row) of its node's child views. */
class FlexLayout internal constructor(context: Context, internal val node: Node) : ViewGroup(context) {
    internal var items: List<Node> = emptyList()
        private set
    private val frames = HashMap<Node, FloatArray>()

    init {
        // As in CSS, a child may draw outside its parent (a shadow, a transform) unless `overflow` clips.
        clipChildren = false
        clipToPadding = false
    }

    /**
     * Makes `next`'s views the children. Only views that arrive or leave are touched: a move (a
     * swap, a sort) changes nothing here, because layout places children in `items` order. The
     * child order is only the drawing order, so overlays drawn later stay on top.
     */
    internal fun setItems(next: List<Node>) {
        val wanted = HashSet<View>(next.size)
        for (item in next) item.view?.let(wanted::add)
        if (wanted.isEmpty()) {
            removeAllViewsInLayout()
        } else {
            for (old in items) {
                val v = old.view
                if (v != null && v.parent === this && v !in wanted) removeViewInLayout(v)
            }
        }
        for (item in next) {
            val v = item.view ?: continue
            if (v.parent !== this) {
                (v.parent as? ViewGroup)?.removeView(v)
                addViewInLayout(v, -1, v.layoutParams ?: generateDefaultLayoutParams(), true)
            }
        }
        val moved = items != next
        items = next
        order = null
        requestLayout()
        invalidate()
        // `:first-child`, `:odd`, `:empty`…: the places changed.
        if (moved) {
            for (item in next) if (item.computed.structural) item.applyStylesDeep()
            if (node.computed.empty != null) node.applyStyle()
        }
    }

    // `pointerEvents: none`: the box and what it holds take no touches; they go to what is under it.
    override fun dispatchTouchEvent(ev: MotionEvent): Boolean =
        if (node.computed.pointerEvents == PointerEvents.None) false else super.dispatchTouchEvent(ev)

    // zIndex: children are drawn (and touched) in `items` order, lowest zIndex first.
    private var order: IntArray? = null

    internal fun reorder() {
        order = null
        isChildrenDrawingOrderEnabled = items.any { it.computed.zIndex != null }
        invalidate()
    }

    override fun getChildDrawingOrder(childCount: Int, drawingPosition: Int): Int {
        var o = order
        if (o == null || o.size != childCount) {
            val index = HashMap<View, Int>(childCount * 2)
            for (i in 0 until childCount) index[getChildAt(i)] = i
            val sorted = items.filter { it.view?.parent === this }.withIndex()
                .sortedWith(compareBy({ it.value.computed.zIndex ?: 0.0 }, { it.index }))
                .map { index[it.value.view]!! }
            o = if (sorted.size == childCount) sorted.toIntArray() else IntArray(childCount) { it }
            order = o
        }
        return o[drawingPosition]
    }

    // The last natural-height pass (width → size, frames): a parent measures a child, then gives it that size.
    private var memoWidth = -1f
    private var memoFit = false
    private var memoSize: FloatArray? = null
    private var memoFrames: HashMap<Node, FloatArray>? = null

    override fun requestLayout() {
        memoSize = null
        super.requestLayout()
    }

    /** `fit`: the caller wants the width the content needs, not the width it offers. */
    internal fun measureFlex(width: Float, height: Float?, fit: Boolean): FloatArray {
        val memo = memoSize
        if (height == null && memo != null && memoWidth == width && (memoFit || !fit)) return memo.copyOf()
        val f = HashMap<Node, FloatArray>()
        val size = Flex.layout(this, width, height, f, fit)
        if (height == null) {
            memoWidth = width
            memoFit = fit
            memoSize = size.copyOf()
            memoFrames = f
        }
        return size
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val wMode = MeasureSpec.getMode(widthMeasureSpec)
        val width = if (wMode == MeasureSpec.UNSPECIFIED) Flex.UNBOUNDED * 2 else MeasureSpec.getSize(widthMeasureSpec).toFloat()
        val height = if (MeasureSpec.getMode(heightMeasureSpec) == MeasureSpec.EXACTLY) MeasureSpec.getSize(heightMeasureSpec).toFloat() else null
        frames.clear()
        val memo = memoSize
        // A definite height equal to the natural one lays out the same, unless a column shares free space (flex).
        val sameHeight = height == null || (memo != null && height == memo[1] && !growsInColumn())
        val size = if (memo != null && memoWidth == width && sameHeight) {
            frames.putAll(memoFrames!!)
            memo
        } else {
            Flex.layout(this, width, height, frames, false)
        }
        // Children are measured at exactly their frames, so each lays out its own children.
        for ((child, f) in frames) {
            child.view?.measure(MeasureSpec.makeMeasureSpec(f[2].roundToInt(), MeasureSpec.EXACTLY), MeasureSpec.makeMeasureSpec(f[3].roundToInt(), MeasureSpec.EXACTLY))
        }
        val w = if (wMode == MeasureSpec.EXACTLY) width else size[0]
        setMeasuredDimension(w.roundToInt(), (height ?: size[1]).roundToInt())
    }

    private fun growsInColumn() =
        node.computed.flexDirection != FlexDirection.Row && items.any { (it.computed.flex ?: 0.0) > 0 }

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        for ((child, f) in frames) {
            val x = f[0].roundToInt()
            val y = f[1].roundToInt()
            // Rounded edges, not sizes: neighbours meet exactly.
            child.place(x, y, (f[0] + f[2]).roundToInt() - x, (f[1] + f[3]).roundToInt() - y)
        }
    }
}

/**
 * The flex layout every runtime implements the same way. Sizes are border boxes in px; a child's
 * margins are added around its box. `flex` shares a line's free space by weight (a column shares only
 * a definite height); `flexWrap` breaks a row into lines; nothing shrinks below its measured size.
 */
internal object Flex {
    const val UNBOUNDED = Float.MAX_VALUE / 8

    /**
     * Lays out `view`'s items in a box `width` wide (and `height` tall when definite); fills `frames` when given.
     * The size returned is the box's; with `fit`, its width is what the content needs (a box in a row, an
     * absolute box), which for a column is its widest child before stretching.
     */
    fun layout(view: FlexLayout, width: Float, height: Float?, frames: MutableMap<Node, FloatArray>?, fit: Boolean): FloatArray {
        val s = view.node.computed
        val (pt, pr, pb, pl) = s.insets.toList()
        val innerW = if (width >= UNBOUNDED) width else max(0f, width - pl - pr)
        val innerH = height?.let { max(0f, it - pt - pb) }
        val flow = view.items.filter { it.inFlow }
        val out = arrayOfNulls<FloatArray>(flow.size)
        val content = if (s.flexDirection == FlexDirection.Row) row(s, flow, innerW, innerH, pt, pl, out) else column(s, flow, innerW, innerH, pt, pl, out, fit)
        val natural = floatArrayOf(content[0] + pl + pr, content[1] + pt + pb)
        val w = if (width < UNBOUNDED) min(width, natural[0]) else natural[0]
        val h = height ?: natural[1]

        if (frames != null) {
            flow.forEachIndexed { i, child -> frames[child] = out[i]!! }
            // An absolute child is placed in the padding box, as in CSS.
            val b = px(s.borderWidth ?: 0.0)
            val boxW = (if (width < UNBOUNDED) width else natural[0]) - 2 * b
            for (child in view.items) {
                if (child.computed.position == Position.Absolute && child.computed.display != Display.None) {
                    frames[child] = absoluteFrame(child, boxW, h - 2 * b).also {
                        it[0] += b
                        it[1] += b
                    }
                }
            }
        }
        return floatArrayOf(w, h)
    }

    private fun crossAlign(s: Style, child: Style) = child.alignSelf ?: s.alignItems ?: Align.Stretch

    private fun clampHeight(h: Float, s: Style): Float {
        var v = h
        s.maxHeight?.let { v = min(v, px(it)) }
        s.minHeight?.let { v = max(v, px(it)) }
        return v
    }

    /** A row: one line, or several when it wraps. Returns the content size. */
    private fun row(s: Style, flow: List<Node>, innerW: Float, innerH: Float?, pt: Float, pl: Float, out: Array<FloatArray?>): FloatArray {
        val n = flow.size
        val bounded = innerW < UNBOUNDED
        val gap = px(s.gap ?: 0.0)
        val margins = Array(n) { flow[it].computed.margins }
        val flexes = FloatArray(n) { if (bounded) (flow[it].computed.flex ?: 0.0).toFloat() else 0f }
        val sizes = Array(n) { i ->
            if (flexes[i] > 0) floatArrayOf(0f, 0f) else flow[i].measure(if (bounded) max(0f, innerW - margins[i][1] - margins[i][3]) else innerW)
        }
        // Lines: an item that does not fit after the ones before it starts the next line.
        val wrap = s.flexWrap == FlexWrap.Wrap && bounded
        val starts = ArrayList<Int>()
        if (n > 0) starts.add(0)
        if (wrap) {
            var used = 0f
            for (i in 0 until n) {
                val w = sizes[i][0] + margins[i][1] + margins[i][3]
                if (i > starts.last() && used + gap + w > innerW + 0.5f) {
                    starts.add(i)
                    used = w
                } else {
                    used += (if (i > starts.last()) gap else 0f) + w
                }
            }
        }
        val justify = s.justifyContent ?: Justify.FlexStart
        var y = pt
        var contentW = 0f
        for (li in starts.indices) {
            val from = starts[li]
            val to = if (li + 1 < starts.size) starts[li + 1] else n
            val count = to - from
            var fixed = gap * (count - 1)
            var totalFlex = 0f
            for (i in from until to) {
                fixed += sizes[i][0] + margins[i][1] + margins[i][3]
                totalFlex += flexes[i]
            }
            val space = if (bounded) max(0f, innerW - fixed) else 0f
            if (totalFlex > 0) {
                for (i in from until to) if (flexes[i] > 0) sizes[i] = flow[i].measure(space * flexes[i] / totalFlex, exact = true)
            }
            var lineH = 0f
            for (i in from until to) lineH = max(lineH, sizes[i][1] + margins[i][0] + margins[i][2])
            if (!wrap && innerH != null) lineH = innerH
            val free = if (totalFlex > 0) 0f else space
            var x = pl
            var spacing = gap
            when (justify) {
                Justify.Center -> x += free / 2
                Justify.FlexEnd -> x += free
                Justify.SpaceBetween -> if (count > 1) spacing += free / (count - 1)
                Justify.SpaceAround -> {
                    spacing += free / count
                    x += free / count / 2
                }
                Justify.SpaceEvenly -> {
                    spacing += free / (count + 1)
                    x += free / (count + 1)
                }
                Justify.FlexStart -> {}
            }
            for (i in from until to) {
                val m = margins[i]
                val cs = flow[i].computed
                val w = sizes[i][0]
                var h = sizes[i][1]
                var cy = y + m[0]
                when (crossAlign(s, cs)) {
                    Align.Stretch -> if (cs.height == null && cs.aspectRatio == null) h = clampHeight(lineH - m[0] - m[2], cs)
                    Align.Center -> cy += (lineH - h - m[0] - m[2]) / 2
                    Align.FlexEnd -> cy += lineH - h - m[0] - m[2]
                    Align.FlexStart -> {}
                }
                out[i] = floatArrayOf(x + m[3], cy, w, h)
                x += w + m[1] + m[3] + spacing
            }
            var lineW = gap * (count - 1)
            for (i in from until to) lineW += sizes[i][0] + margins[i][1] + margins[i][3]
            contentW = max(contentW, if (totalFlex > 0) innerW else lineW)
            y += lineH + (if (li + 1 < starts.size) gap else 0f)
        }
        return floatArrayOf(contentW, y - pt)
    }

    /** A column. Returns the content size. */
    private fun column(s: Style, flow: List<Node>, innerW: Float, innerH: Float?, pt: Float, pl: Float, out: Array<FloatArray?>, fit: Boolean): FloatArray {
        val n = flow.size
        val bounded = innerW < UNBOUNDED
        val gap = px(s.gap ?: 0.0)
        val gaps = gap * max(0, n - 1)
        val margins = Array(n) { flow[it].computed.margins }
        val flexes = FloatArray(n) { (flow[it].computed.flex ?: 0.0).toFloat() }
        // What each child needs before stretching: the column's own width when it is asked to fit.
        val needs = FloatArray(n)
        val sizes = Array(n) { i ->
            val cs = flow[i].computed
            val available = if (bounded) max(0f, innerW - margins[i][1] - margins[i][3]) else innerW
            // A stretched child is as wide as the column; one with its own width or alignment keeps its measure.
            val stretched = bounded && crossAlign(s, cs) == Align.Stretch && cs.width == null && cs.widthPct == null && !(cs.aspectRatio != null && cs.height != null)
            val size = flow[i].measure(available, exact = stretched)
            needs[i] = if (stretched && fit) flow[i].measure(available)[0] else size[0]
            size
        }
        var totalFlex = 0f
        var content = gaps
        for (i in 0 until n) {
            totalFlex += flexes[i]
            content += sizes[i][1] + margins[i][0] + margins[i][2]
        }
        var free = 0f
        if (innerH != null) {
            if (totalFlex > 0) {
                var basis = gaps
                for (i in 0 until n) basis += margins[i][0] + margins[i][2] + (if (flexes[i] > 0) 0f else sizes[i][1])
                val space = max(0f, innerH - basis)
                for (i in 0 until n) if (flexes[i] > 0) sizes[i][1] = clampHeight(space * flexes[i] / totalFlex, flow[i].computed)
            } else {
                free = max(0f, innerH - content)
            }
        }
        var y = pt
        var spacing = gap
        when (s.justifyContent ?: Justify.FlexStart) {
            Justify.Center -> y += free / 2
            Justify.FlexEnd -> y += free
            Justify.SpaceBetween -> if (n > 1) spacing += free / (n - 1)
            Justify.SpaceAround -> if (n > 0) {
                spacing += free / n
                y += free / n / 2
            }
            Justify.SpaceEvenly -> {
                spacing += free / (n + 1)
                y += free / (n + 1)
            }
            Justify.FlexStart -> {}
        }
        var contentW = 0f
        for (i in 0 until n) {
            val m = margins[i]
            val w = sizes[i][0]
            val h = sizes[i][1]
            var x = pl + m[3]
            if (bounded) {
                when (crossAlign(s, flow[i].computed)) {
                    Align.Center -> x += (innerW - w - m[1] - m[3]) / 2
                    Align.FlexEnd -> x += innerW - w - m[1] - m[3]
                    else -> {}
                }
            }
            y += m[0]
            out[i] = floatArrayOf(x, y, w, h)
            y += h + m[2] + spacing
            contentW = max(contentW, (if (fit) needs[i] else w) + m[1] + m[3])
        }
        return floatArrayOf(contentW, innerH ?: content)
    }

    private fun absoluteFrame(child: Node, bw: Float, bh: Float): FloatArray {
        val s = child.computed
        val l = s.left?.let { px(it) }
        val r = s.right?.let { px(it) }
        val t = s.top?.let { px(it) }
        val b = s.bottom?.let { px(it) }
        val w = s.width?.let { px(it) } ?: s.widthPct?.let { bw * it.toFloat() / 100f } ?: if (l != null && r != null) bw - l - r else child.measure(bw)[0]
        val h = s.height?.let { px(it) } ?: if (t != null && b != null) bh - t - b else child.measure(w, exact = true)[1]
        val x = l ?: if (r != null) bw - r - w else 0f
        val y = t ?: if (b != null) bh - b - h else 0f
        return floatArrayOf(x, y, w, h)
    }
}

/** A scrolling screen whose content is a node, as tall as its content or the screen. */
internal class ScreenView(context: Context, val root: Node, private val onEndReached: (() -> Unit)? = null) : ScrollView(context) {
    private var endAt = -1

    init {
        isFillViewport = true
        setBackgroundColor(screenBackground)
        addView(root.view, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))
    }

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        super.onLayout(changed, l, t, r, b)
        checkEnd()
    }

    override fun onScrollChanged(l: Int, t: Int, oldl: Int, oldt: Int) {
        super.onScrollChanged(l, t, oldl, oldt)
        checkEnd()
    }

    /** The route's onEndReached, once per content height: a page that arrives makes the content taller, and the next end counts again. */
    private fun checkEnd() {
        val end = onEndReached ?: return
        val content = getChildAt(0)?.height ?: return
        if (height <= 0 || content == endAt || scrollY + height < content - height / 2) return
        endAt = content
        Runtime.main.post(end)
    }
}

/** A screen around a root node: it scrolls, unless the root is itself a scrolling box. */
internal fun screenView(context: Context, root: Node, onEndReached: (() -> Unit)? = null): View =
    if (!root.scrolls) ScreenView(context, root, onEndReached)
    else FrameLayout(context).apply {
        setBackgroundColor(screenBackground)
        addView(root.view, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
    }

// ---------------------------------------------------------------------------
// Runtime
// ---------------------------------------------------------------------------

object Runtime {
    lateinit var activity: Activity
        internal set
    internal var density = 1f
    internal val main = Handler(Looper.getMainLooper())
    /** Counts update passes: a node built during one has already run its bindings. */
    internal var generation = 0
    /** forceUpdate(): every dynamic value is applied, changed or not. */
    internal var forcing = false
    internal val rippleId by lazy {
        TypedValue().also { activity.theme.resolveAttribute(android.R.attr.selectableItemBackground, it, true) }.resourceId
    }

    private lateinit var rootLayout: FrameLayout
    private val roots = mutableListOf<Node>()
    private var hasMain = false
    private var updating = false
    private var queuedAll = false
    private val queuedIds = HashSet<String>()
    internal var backHandler: (() -> Boolean)? = null

    /** The window's width in dp, which `@media` rules are matched against. */
    internal var viewportWidth = 0.0
    /** Whether some style has a media rule: only then does a new width restyle the app. */
    internal var usesMedia = false

    internal val regions = HashMap<String, RegionState>()
    internal val waiting = HashMap<String, MutableList<IntoEntry>>()

    internal fun start(activity: Activity) {
        this.activity = activity
        density = activity.resources.displayMetrics.density
        roots.clear()
        regions.clear()
        waiting.clear()
        hasMain = false
        viewportWidth = dp(activity.resources.displayMetrics.widthPixels.toFloat())
        rootLayout = FrameLayout(activity).apply { setBackgroundColor(screenBackground) }
        rootLayout.addOnLayoutChangeListener { v, _, _, _, _, _, _, _, _ ->
            val width = dp(v.width.toFloat())
            if (width > 0 && width != viewportWidth) {
                viewportWidth = width
                if (usesMedia) main.post { for (root in roots.toList()) root.applyStylesDeep() }
            }
        }
        // Edge to edge: keep content clear of the status and navigation bars and the keyboard.
        rootLayout.setOnApplyWindowInsetsListener { v, insets ->
            val bars = insets.getInsets(WindowInsets.Type.systemBars() or WindowInsets.Type.ime())
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            WindowInsets.CONSUMED
        }
        activity.setContentView(rootLayout)
    }

    internal fun addRoot(node: Node) {
        roots.add(node)
        node.applyStylesDeep()
    }

    internal fun removeRoot(node: Node) {
        roots.remove(node)
        node.destroy()
    }

    internal fun render(node: Node) {
        rootLayout.setBackgroundColor(screenBackground)
        addRoot(node)
        if (hasMain) {
            rootLayout.addView(node.view, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
        } else {
            hasMain = true
            rootLayout.addView(screenView(activity, node), 0)
        }
    }

    internal fun render(router: NRouter) {
        rootLayout.setBackgroundColor(screenBackground)
        hasMain = true
        rootLayout.addView(router.makeView(activity), 0)
    }

    internal fun update(ids: List<String>) {
        if (updating) {
            if (ids.isEmpty()) queuedAll = true else queuedIds.addAll(ids)
            return
        }
        updating = true
        try {
            run(ids)
            while (queuedAll || queuedIds.isNotEmpty()) {
                val next = if (queuedAll) emptyList() else queuedIds.toList()
                queuedAll = false
                queuedIds.clear()
                run(next)
            }
        } finally {
            updating = false
        }
    }

    private fun run(ids: List<String>) {
        generation++
        if (ids.isEmpty()) {
            for (node in roots.toList()) node.refresh()
            return
        }
        val wanted = ids.toSet()
        val found = mutableListOf<Node>()
        fun visit(node: Node) {
            if (node.scopes.any { it in wanted }) found.add(node) else node.children.forEach(::visit)
        }
        roots.forEach(::visit)
        for (node in found) node.refresh()
    }
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

private fun build(kind: Node.Kind, tag: String, mods: Array<out NodeMod?>): Node =
    Node(kind, tag).also {
        it.add(mods.asList())
        it.finish()
    }

fun div(vararg mods: NodeMod?) = build(Node.Kind.Box, "div", mods)
fun section(vararg mods: NodeMod?) = build(Node.Kind.Box, "section", mods)
fun header(vararg mods: NodeMod?) = build(Node.Kind.Box, "header", mods)
fun footer(vararg mods: NodeMod?) = build(Node.Kind.Box, "footer", mods)
fun main(vararg mods: NodeMod?) = build(Node.Kind.Box, "main", mods)
fun nav(vararg mods: NodeMod?) = build(Node.Kind.Box, "nav", mods)
fun article(vararg mods: NodeMod?) = build(Node.Kind.Box, "article", mods)
fun aside(vararg mods: NodeMod?) = build(Node.Kind.Box, "aside", mods)
fun form(vararg mods: NodeMod?) = build(Node.Kind.Box, "form", mods)
fun ul(vararg mods: NodeMod?) = build(Node.Kind.Box, "ul", mods)
fun li(vararg mods: NodeMod?) = build(Node.Kind.Box, "li", mods)
fun span(vararg mods: NodeMod?) = build(Node.Kind.Text, "span", mods)
fun p(vararg mods: NodeMod?) = build(Node.Kind.Text, "p", mods)
fun h1(vararg mods: NodeMod?) = build(Node.Kind.Text, "h1", mods)
fun h2(vararg mods: NodeMod?) = build(Node.Kind.Text, "h2", mods)
fun h3(vararg mods: NodeMod?) = build(Node.Kind.Text, "h3", mods)
fun h4(vararg mods: NodeMod?) = build(Node.Kind.Text, "h4", mods)
fun label(vararg mods: NodeMod?) = build(Node.Kind.Text, "label", mods)
fun strong(vararg mods: NodeMod?) = build(Node.Kind.Text, "strong", mods)
fun small(vararg mods: NodeMod?) = build(Node.Kind.Text, "small", mods)
fun em(vararg mods: NodeMod?) = build(Node.Kind.Text, "em", mods)
fun button(vararg mods: NodeMod?) = build(Node.Kind.Button, "button", mods)
fun input(vararg mods: NodeMod?) = build(Node.Kind.Input, "input", mods)
fun checkbox(vararg mods: NodeMod?) = build(Node.Kind.Checkbox, "input", mods)
fun textarea(vararg mods: NodeMod?) = build(Node.Kind.Textarea, "textarea", mods)
fun img(vararg mods: NodeMod?) = build(Node.Kind.Image, "img", mods)

/** Any other tag, by name: a text or a box, with the tag's default style. */
fun el(tag: String, vararg mods: NodeMod?) = build(if (tag in TEXT_TAGS) Node.Kind.Text else Node.Kind.Box, tag, mods)

/** A platform view as a node: `component` makes it, and gets `props` again whenever a dynamic prop changed. */
fun <P> nativeView(component: NativeComponent<P>, props: P, vararg mods: NodeMod?): Node {
    val view = component.create(Runtime.activity)
    val node = Node(Node.Kind.Native, "native", view)
    node.nativeProps = props
    node.add(mods.asList())
    val flush = {
        if (node.propsDirty) {
            node.propsDirty = false
            component.update(view, props)
        }
    }
    flush()
    node.bindings.add(flush)
    node.destroyCallbacks.add { component.destroy(it) }
    return node
}

/** Attributes, the `{ … }` object of a nuclo builder call. */
object A {
    fun text(value: String) = NodeMod { it.addText { value } }
    fun text(value: () -> String) = NodeMod { it.addText(value) }

    fun style(value: Style) = NodeMod { it.inline = it.inline.merged(value) }
    fun style(value: () -> Style) = NodeMod { it.dynamicInline = value }
    fun className(value: StyleClass): NodeMod = value
    fun className(value: () -> StyleClass) = NodeMod { it.dynamicClass = value }

    fun value(text: String) = value { text }
    fun value(value: () -> String) = NodeMod { node ->
        node.bind(value) { text ->
            // Never reset what the user is typing to the same text (the caret would jump).
            val field = node.view as? EditText
            if (field != null && field.text.toString() != text) node.write { field.setText(text) }
        }
    }

    fun placeholder(value: String) = placeholder { value }
    fun placeholder(value: () -> String) = NodeMod { node -> node.bind(value) { (node.view as? EditText)?.hint = it } }

    fun src(value: String) = src { value }
    fun src(value: () -> String) = NodeMod { node ->
        node.bind(value) { url ->
            val image = node.view as? ImageView ?: return@bind
            thread {
                val bitmap = runCatching { URL(url).openStream().use { android.graphics.BitmapFactory.decodeStream(it) } }.getOrNull()
                Runtime.main.post { image.setImageBitmap(bitmap) }
            }
        }
    }

    fun href(value: String) = href { value }
    fun href(value: () -> String) = NodeMod { node ->
        node.bind(value) { node.href = it }
        node.view?.setOnClickListener { node.click() }
    }

    fun ariaLabel(value: String) = ariaLabel { value }
    fun ariaLabel(value: () -> String) = NodeMod { node -> node.bind(value) { node.view?.contentDescription = it } }

    fun checked(value: Boolean) = checked { value }
    fun checked(value: () -> Boolean) = NodeMod { node ->
        node.bind(value) { on -> (node.view as? CheckBox)?.let { box -> if (box.isChecked != on) node.write { box.isChecked = on } } }
    }

    fun disabled(value: Boolean) = disabled { value }
    fun disabled(value: () -> Boolean) = NodeMod { node ->
        node.bind(value) { off -> node.setDisabled(off) }
    }

    fun inputType(type: String) = NodeMod { node ->
        (node.view as? EditText)?.inputType = when (type) {
            "password" -> InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            "email" -> InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
            "number" -> InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_DECIMAL
            else -> InputType.TYPE_CLASS_TEXT
        }
    }

    /** A dynamic prop of a native component: `set` writes it into the node's props when it changed. */
    fun <P, T> prop(get: () -> T, set: (P, T) -> Unit) = NodeMod { node ->
        node.bind(get) {
            @Suppress("UNCHECKED_CAST")
            set(node.nativeProps as P, it)
            node.propsDirty = true
        }
    }

    fun onClick(handler: (NativeEvent) -> Unit) = NodeMod { it.listen("click", handler) }
    fun onInput(handler: (NativeEvent) -> Unit) = NodeMod { it.listen("input", handler) }
    fun onChange(handler: (NativeEvent) -> Unit) = NodeMod { it.listen("change", handler) }
    fun onFocus(handler: (NativeEvent) -> Unit) = NodeMod { it.listen("focus", handler) }
    fun onBlur(handler: (NativeEvent) -> Unit) = NodeMod { it.listen("blur", handler) }
    fun onKeyDown(handler: (KeyboardEvent) -> Unit) = NodeMod { it.listenKeys(handler) }

    fun onPointerDown(handler: (PointerEvent) -> Unit) = NodeMod { it.touch().pointers["pointerDown"] = handler }
    fun onPointerMove(handler: (PointerEvent) -> Unit) = NodeMod { it.touch().pointers["pointerMove"] = handler }
    fun onPointerUp(handler: (PointerEvent) -> Unit) = NodeMod { it.touch().pointers["pointerUp"] = handler }
    fun onPointerCancel(handler: (PointerEvent) -> Unit) = NodeMod { it.touch().pointers["pointerCancel"] = handler }
    fun onLongPress(handler: (PointerEvent) -> Unit) = NodeMod { it.touch().pointers["longPress"] = handler }
    fun onDoubleClick(handler: (PointerEvent) -> Unit) = NodeMod { it.touch().pointers["doubleClick"] = handler }
    fun onPan(handler: (PanEvent) -> Unit) = NodeMod { it.touch().onPan = handler }
    fun onPinch(handler: (PinchEvent) -> Unit) = NodeMod { it.touch().onPinch = handler }
    fun onScroll(handler: (ScrollEvent) -> Unit) = NodeMod { it.onScroll = handler }

    fun onMount(handler: (NativeElement) -> Cleanup?) = NodeMod { node ->
        node.mountCallbacks.add(handler)
        node.watchMount()
    }

    fun onDestroy(handler: (NativeElement) -> Unit) = NodeMod { it.destroyCallbacks.add(handler) }
}

// ---------------------------------------------------------------------------
// update(), scope(), render()
// ---------------------------------------------------------------------------

fun update(vararg scopeIds: String) = Runtime.update(scopeIds.asList())

fun forceUpdate() {
    Runtime.forcing = true
    try {
        Runtime.update(emptyList())
    } finally {
        Runtime.forcing = false
    }
}

fun scope(vararg ids: String) = NodeMod { it.scopes.addAll(ids) }

fun render(view: () -> Node) = Runtime.render(view())

fun render(router: NRouter) = Runtime.render(router)

// ---------------------------------------------------------------------------
// list()
// ---------------------------------------------------------------------------

/** Rows keyed by identity (Kotlin `==` is identity for the generated classes): a row is rebuilt only when its item is new. */
fun <T> list(items: () -> List<T>, render: (T, Int) -> Node?) = NodeMod { parent ->
    val fragment = Node(Node.Kind.Fragment, "list")
    parent.append(fragment)
    var rows = listOf<Pair<T, Node?>>()
    fragment.reconcile = {
        val next = items()
        // Old rows by item (identity for the generated classes, value for strings and numbers).
        val byItem = HashMap<Any?, ArrayDeque<Int>>(rows.size * 2)
        rows.forEachIndexed { i, row -> byItem.getOrPut(row.first) { ArrayDeque() }.addLast(i) }
        val used = BooleanArray(rows.size)
        val fresh = ArrayList<Node>()
        val built = ArrayList<Pair<T, Node?>>(next.size)
        var changed = next.size != rows.size
        next.forEachIndexed { index, item ->
            val i = byItem[item]?.removeFirstOrNull()
            if (i != null) {
                used[i] = true
                if (i != index) changed = true
                built.add(rows[i])
            } else {
                val node = render(item, index)
                node?.parent = fragment
                node?.let(fresh::add)
                built.add(item to node)
                changed = true
            }
        }
        rows.forEachIndexed { i, row -> if (!used[i]) row.second?.destroy() }
        rows = built
        if (changed) {
            fragment.children = built.mapNotNull { it.second }.toMutableList()
            for (node in fresh) node.applyStylesDeep()
            fragment.syncViews()
        }
    }
    fragment.reconcile?.invoke()
}

// ---------------------------------------------------------------------------
// when()
// ---------------------------------------------------------------------------

class WhenBuilder internal constructor(condition: () -> Boolean, content: Content) : NodeMod {
    private val branches = mutableListOf(condition to content)
    private var otherwise: Content? = null

    fun `when`(condition: () -> Boolean, content: Content): WhenBuilder = apply { branches.add(condition to content) }

    fun `when`(condition: Boolean, content: Content): WhenBuilder = `when`({ condition }, content)

    fun `else`(content: Content): WhenBuilder = apply { otherwise = content }

    override fun apply(node: Node) {
        val fragment = Node(Node.Kind.Fragment, "when")
        node.append(fragment)
        var active = -2
        val branches = branches.toList()
        val otherwise = otherwise
        fragment.reconcile = {
            val next = branches.indexOfFirst { it.first() }
            if (next != active) {
                active = next
                for (child in fragment.children) child.destroy()
                fragment.children = mutableListOf()
                val content = if (next >= 0) branches[next].second else otherwise
                content?.let { fragment.add(it()) }
                for (child in fragment.children) child.applyStylesDeep()
                fragment.syncViews()
            }
        }
        fragment.reconcile?.invoke()
    }
}

fun `when`(condition: () -> Boolean, content: Content) = WhenBuilder(condition, content)

fun `when`(condition: Boolean, content: Content) = WhenBuilder({ condition }, content)

// ---------------------------------------------------------------------------
// region() / into()
// ---------------------------------------------------------------------------

internal class IntoEntry(val content: Content) {
    var holder: Node? = null
}

internal class RegionState(val fragment: Node, val stack: Boolean, val empty: Content?) {
    val entries = mutableListOf<IntoEntry>()
    private var emptyHolder: Node? = null

    /** Shows the newest entry (or all of them, stacked), building only those not shown yet. */
    fun render() {
        val shown = if (stack) entries.toList() else entries.takeLast(1)
        for (entry in entries) if (entry !in shown) {
            entry.holder?.destroy()
            entry.holder = null
        }
        var children = shown.map { entry ->
            entry.holder ?: Node(Node.Kind.Fragment, "into").also { holder ->
                holder.parent = fragment
                holder.add(entry.content())
                holder.applyStylesDeep()
                entry.holder = holder
            }
        }
        if (children.isEmpty() && empty != null) {
            val holder = emptyHolder ?: Node(Node.Kind.Fragment, "empty").also {
                it.parent = fragment
                it.add(empty())
                it.applyStylesDeep()
                emptyHolder = it
            }
            children = listOf(holder)
        } else {
            emptyHolder?.destroy()
            emptyHolder = null
        }
        fragment.children = children.toMutableList()
        fragment.syncViews()
    }
}

fun region(id: String, type: String = "latest", empty: Content? = null) = NodeMod { parent ->
    val fragment = Node(Node.Kind.Fragment, "region")
    parent.append(fragment)
    val state = RegionState(fragment, type == "stack", empty)
    Runtime.regions[id] = state
    Runtime.waiting.remove(id)?.let { state.entries.addAll(it) }
    state.render()
    fragment.teardown.add {
        // The region goes: its views wait for the next region with this id.
        for (entry in state.entries) {
            entry.holder?.destroy()
            entry.holder = null
        }
        if (Runtime.regions[id] === state) Runtime.regions.remove(id)
        Runtime.waiting.getOrPut(id) { mutableListOf() }.addAll(state.entries)
    }
}

fun into(id: String, content: Content) = NodeMod { parent ->
    val anchor = Node(Node.Kind.Fragment, "into-anchor")
    parent.append(anchor)
    val entry = IntoEntry(content)
    val region = Runtime.regions[id]
    if (region != null) {
        region.entries.add(entry)
        region.render()
    } else {
        Runtime.waiting.getOrPut(id) { mutableListOf() }.add(entry)
    }
    anchor.teardown.add {
        entry.holder?.destroy()
        entry.holder = null
        Runtime.regions[id]?.let { r -> if (r.entries.remove(entry)) r.render() }
        Runtime.waiting[id]?.remove(entry)
    }
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

class NRoute(
    pattern: String,
    internal val view: (Params) -> Node,
    internal val title: ((Params) -> String)? = null,
    internal val presentation: String = "push",
    internal val header: Boolean = true,
    /** Run when the screen's scroller comes within half a screen of its content's end. */
    internal val onEndReached: ((Params) -> Unit)? = null,
) {
    private val parts = pattern.split("/")

    internal fun match(path: String): Params? {
        val segments = path.split("/")
        if (segments.size != parts.size) return null
        val params = mutableMapOf<String, String>()
        for ((pattern, segment) in parts.zip(segments)) {
            if (pattern.startsWith(":")) params[pattern.substring(1)] = segment else if (pattern != segment) return null
        }
        return params
    }
}

class NTab(internal val path: String, internal val title: String, internal val icon: String)

/**
 * Navigation stacks per tab: an app bar (title, back), the top screen of the active stack, and a bottom bar.
 * A modal screen is a sheet over all of it. The router owns the stacks; system back pops (or leaves the
 * app at a tab's root).
 */
class NRouter(private val routes: List<NRoute>, private val tabs: List<NTab> = emptyList(), private val initial: String = "/") {
    private class Entry(val path: String, val node: Node, val view: View, val title: String, val modal: Boolean, val header: Boolean)

    private val stacks = mutableListOf<MutableList<Entry>>()
    private var active = 0
    private lateinit var root: FrameLayout
    private lateinit var content: FrameLayout
    private lateinit var bar: FrameLayout
    private lateinit var titleView: TextView
    private lateinit var backView: TextView
    private val tabViews = mutableListOf<TextView>()

    val outlet: NRouter get() = this
    val path: String get() = stacks.getOrNull(active)?.lastOrNull()?.path ?: initial
    val canGoBack: Boolean get() = (stacks.getOrNull(active)?.size ?: 0) > 1

    internal fun makeView(context: Context): View {
        // `adb shell am start … --es NUCLO_PATH /a/b`: start there, as a web deep link does (for checks against the web build).
        val initial = Runtime.activity.intent?.getStringExtra("NUCLO_PATH") ?: this.initial
        val roots = if (tabs.isEmpty()) listOf(initial) else tabs.map { it.path }
        active = max(0, tabOf(initial))
        roots.forEachIndexed { i, root ->
            val stack = mutableListOf(entry(root))
            if (i == active && root != initial) stack.add(entry(initial))
            stacks.add(stack)
        }
        val column = LinearLayout(context).apply { orientation = LinearLayout.VERTICAL }
        bar = FrameLayout(context).apply {
            setBackgroundColor(Color.WHITE)
            elevation = px(2.0)
        }
        backView = TextView(context).apply {
            text = "←"
            contentDescription = "Back"
            setTextSize(TypedValue.COMPLEX_UNIT_DIP, 24f)
            setTextColor(Color.BLACK)
            gravity = Gravity.CENTER
            setOnClickListener { back() }
        }
        titleView = TextView(context).apply {
            setTextSize(TypedValue.COMPLEX_UNIT_DIP, 20f)
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.BLACK)
            gravity = Gravity.CENTER_VERTICAL
        }
        bar.addView(backView, FrameLayout.LayoutParams(px(56.0).roundToInt(), FrameLayout.LayoutParams.MATCH_PARENT))
        bar.addView(titleView, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
        bar.bringChildToFront(backView)
        column.addView(bar, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, px(56.0).roundToInt()))
        content = FrameLayout(context)
        column.addView(content, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f))
        if (tabs.isNotEmpty()) {
            val bottom = LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                setBackgroundColor(Color.parseColor("#f8fafc"))
                elevation = px(8.0)
            }
            tabs.forEachIndexed { i, tab ->
                val item = TextView(context).apply {
                    text = "${glyph(tab.icon)}\n${tab.title}"
                    gravity = Gravity.CENTER
                    setTextSize(TypedValue.COMPLEX_UNIT_DIP, 12f)
                    setOnClickListener { select(i) }
                }
                tabViews.add(item)
                bottom.addView(item, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 1f))
            }
            column.addView(bottom, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, px(64.0).roundToInt()))
        }
        root = FrameLayout(context)
        root.addView(column, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
        Runtime.backHandler = { if (canGoBack) back().let { true } else false }
        show(null)
        // The screens were built before the stacks existed: what they read from the router is refreshed.
        Runtime.update(emptyList())
        return root
    }

    fun go(path: String) {
        stacks[active].add(entry(path))
        show(+1)
        Runtime.update(emptyList())
    }

    fun back() {
        val stack = stacks[active]
        if (stack.size < 2) return
        val gone = stack.removeAt(stack.size - 1)
        show(-1, gone)
        Runtime.update(emptyList())
    }

    fun replace(path: String) {
        val stack = stacks[active]
        val gone = stack.removeAt(stack.size - 1)
        stack.add(entry(path))
        Runtime.removeRoot(gone.node)
        show(null)
        Runtime.update(emptyList())
    }

    fun reset(path: String) {
        val tab = tabOf(path)
        if (tab >= 0) active = tab
        val stack = stacks[active]
        val root = stack[0]
        val keep = if (root.path == path) root else entry(path)
        for (e in stack) if (e !== keep) Runtime.removeRoot(e.node)
        stacks[active] = mutableListOf(keep)
        show(null)
        Runtime.update(emptyList())
    }

    private fun select(i: Int) {
        if (i == active) {
            reset(stacks[i][0].path)
            return
        }
        active = i
        show(null)
        Runtime.update(emptyList())
    }

    /** The screen under any sheets: what the content area shows. */
    private fun screenOf(stack: List<Entry>) = stack.lastOrNull { !it.modal } ?: stack[0]

    /** Shows the active stack's top screen: slid in on a push (+1), out on a pop (-1); a sheet slides from the bottom. */
    private fun show(direction: Int?, popped: Entry? = null) {
        val stack = stacks[active]
        val top = stack.last()
        val under = screenOf(stack)
        val width = root.width.toFloat().takeIf { it > 0 } ?: Runtime.activity.resources.displayMetrics.widthPixels.toFloat()
        val height = root.height.toFloat().takeIf { it > 0 } ?: Runtime.activity.resources.displayMetrics.heightPixels.toFloat()
        fun detach(v: View) = (v.parent as? ViewGroup)?.removeView(v)
        when {
            direction == +1 && top.modal -> {
                detach(top.view)
                root.addView(top.view)
                top.view.translationY = height
                top.view.animate().translationY(0f).setDuration(280).setInterpolator(EASE_OUT).start()
            }
            direction == +1 -> {
                detach(top.view)
                content.addView(top.view)
                top.view.translationX = width
                top.view.animate().translationX(0f).setDuration(220).withEndAction { keepOnly(top.view) }.start()
            }
            direction == -1 && popped != null -> {
                if (under.view.parent !== content) {
                    detach(under.view)
                    content.addView(under.view, 0)
                }
                under.view.translationX = 0f
                val out = popped.view.animate().setDuration(200).withEndAction {
                    detach(popped.view)
                    Runtime.removeRoot(popped.node)
                }
                if (popped.modal) out.translationY(height) else out.translationX(width)
                out.start()
            }
            else -> {
                // Another tab, a reset: no transition, and no sheet survives it.
                for (i in root.childCount - 1 downTo 1) root.removeViewAt(i)
                content.removeAllViews()
                under.view.translationX = 0f
                detach(under.view)
                content.addView(under.view)
                for (e in stack) if (e.modal) {
                    detach(e.view)
                    e.view.translationY = 0f
                    root.addView(e.view)
                }
            }
        }
        titleView.text = under.title
        bar.visibility = if (under.header) View.VISIBLE else View.GONE
        val backable = stack.indexOf(under) > 0
        backView.visibility = if (backable) View.VISIBLE else View.GONE
        titleView.setPaddingRelative(px(if (backable) 60.0 else 20.0).roundToInt(), 0, 0, 0)
        tabViews.forEachIndexed { i, v -> v.setTextColor(if (i == active) Color.parseColor("#4f46e5") else Color.parseColor("#64748b")) }
    }

    private fun keepOnly(view: View) {
        for (i in content.childCount - 1 downTo 0) if (content.getChildAt(i) !== view) content.removeViewAt(i)
    }

    private fun entry(path: String): Entry {
        for (route in routes) {
            val params = route.match(path) ?: continue
            val node = route.view(params)
            Runtime.addRoot(node)
            val end = route.onEndReached?.let { { it(params) } }
            return Entry(path, node, screenView(Runtime.activity, node, end), route.title?.invoke(params) ?: "", route.presentation == "modal", route.header)
        }
        val node = p(A.text("No route matches $path"))
        Runtime.addRoot(node)
        return Entry(path, node, screenView(Runtime.activity, node), "Not found", false, true)
    }

    private fun tabOf(path: String): Int {
        var best = -1
        tabs.forEachIndexed { i, tab ->
            val owns = tab.path == "/" || path == tab.path || path.startsWith(tab.path + "/")
            if (owns && (best < 0 || tab.path.length > tabs[best].path.length)) best = i
        }
        return best
    }

    private fun glyph(icon: String) = when (icon) {
        "home" -> "⌂"
        "list" -> "☰"
        "cloud" -> "☁"
        "star" -> "★"
        "person" -> "◉"
        "settings" -> "⚙"
        "search" -> "⌕"
        else -> "●"
    }
}

// ---------------------------------------------------------------------------
// Async (stdlib coroutines resumed on the main thread), timers, console
// ---------------------------------------------------------------------------

/** Starts an async call from synchronous code; an uncaught error is logged. */
fun launch(block: suspend () -> Unit) {
    block.startCoroutine(Continuation(EmptyCoroutineContext) { result ->
        // As the browser's console says it of an async call nobody awaits.
        result.exceptionOrNull()?.let { consoleLog("Uncaught (in promise) ${(it as? Exception)?.let(::jsErrorMessage) ?: it.toString()}") }
    })
}

suspend fun delay(ms: Double) = suspendCoroutine { cont -> Runtime.main.postDelayed({ cont.resume(Unit) }, ms.toLong()) }

private val permissionWaits = HashMap<Int, (Boolean) -> Unit>()
private var permissionCode = 0

/** Asks for a runtime permission (`android.Manifest.permission.CAMERA`, …) when it isn't granted; true when it is. For an app's native code. */
suspend fun requestPermission(permission: String): Boolean = suspendCoroutine { cont ->
    val activity = Runtime.activity
    if (activity.checkSelfPermission(permission) == android.content.pm.PackageManager.PERMISSION_GRANTED) return@suspendCoroutine cont.resume(true)
    val code = 0x6e00 + (permissionCode++ and 0xff)
    permissionWaits[code] = { cont.resume(it) }
    activity.requestPermissions(arrayOf(permission), code)
}

internal fun permissionResult(code: Int, grants: IntArray) {
    permissionWaits.remove(code)?.invoke(grants.isNotEmpty() && grants.all { it == android.content.pm.PackageManager.PERMISSION_GRANTED })
}

class NResponse internal constructor(val status: Int, private val body: String) {
    val ok get() = status in 200..299

    suspend fun text(): String = body

    suspend fun <T> json(decode: (Any?) -> T): T = decode(jsJsonParse(body))
}

/** HttpURLConnection on a background thread; resumes on the main thread. Add the INTERNET permission. */
suspend fun fetch(url: String, method: String = "GET", body: String? = null, headers: Map<String, String> = emptyMap()): NResponse =
    suspendCoroutine { cont ->
        thread(name = "nuclo-fetch") {
            try {
                val connection = URL(url).openConnection() as HttpURLConnection
                connection.requestMethod = method
                headers.forEach { (k, v) -> connection.setRequestProperty(k, v) }
                if (body != null) {
                    connection.doOutput = true
                    connection.outputStream.use { it.write(body.toByteArray()) }
                }
                val status = connection.responseCode
                val stream = if (status >= 400) connection.errorStream else connection.inputStream
                val text = stream?.bufferedReader()?.use { it.readText() } ?: ""
                connection.disconnect()
                Runtime.main.post { cont.resume(NResponse(status, text)) }
            } catch (e: Exception) {
                Runtime.main.post { cont.resumeWithException(e) }
            }
        }
    }

// Timers, microtasks, promises and JavaScript's semantics are in NucloJs.kt (also built for the plain JVM). Its event
// loop here is the main thread's Handler.
internal fun jsPost(ms: Long, job: Runnable) {
    Runtime.main.postDelayed(job, ms)
}

internal fun jsCancelPost(job: Runnable) = Runtime.main.removeCallbacks(job)

/** Runs `job` next, before anything already due (the microtasks an event handler queued run right after it). */
internal fun jsPostFirst(job: Runnable) {
    Runtime.main.postAtFrontOfQueue(job)
}

class NFrame internal constructor() {
    internal var cancelled = false
}

/** Runs `callback` with the frame's time (as `Date.now()` counts it) before the next frame is drawn. */
fun requestAnimationFrame(callback: (Double) -> Unit): NFrame {
    val frame = NFrame()
    Choreographer.getInstance().postFrameCallback { if (!frame.cancelled) callback(jsNow()) }
    return frame
}

fun cancelAnimationFrame(frame: NFrame) {
    frame.cancelled = true
}

fun consoleLog(vararg values: String) {
    Log.i("nuclo", values.joinToString(" "))
}

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

/** The generated `MainActivity` passes the app's entry point. */
open class NucloActivity(private val entry: () -> Unit) : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Runtime.start(this)
        entry()
        if (Build.VERSION.SDK_INT >= 33) {
            onBackInvokedDispatcher.registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT) {
                if (Runtime.backHandler?.invoke() != true) finish()
            }
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        permissionResult(requestCode, grantResults)
    }

    @Deprecated("Android 12 and older")
    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (Runtime.backHandler?.invoke() != true) super.onBackPressed()
    }
}
