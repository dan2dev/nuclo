package nuclo.core

import nuclo.*
import nuclo.host.Paint
import nuclo.host.Shadow
import nuclo.host.TextPaint
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min

internal val NO_STYLE = Style()

internal fun roundHalfUp(x: Float): Int = floor(x + 0.5f).toInt()

private fun Number?.px(): Float? = this?.toFloat()

/** A Style chain resolved to floats and packed colours: what layout and paint read. `s` is the merged, normalized style. */
internal class Computed(style: Style) {
    val s: Style = style.normalized()

    val column: Boolean get() = s.flexDirection != FlexDirection.Row
    val gap: Float = s.gap.px() ?: 0f
    val flex: Float = s.flex.px() ?: 0f
    val width: Float? = s.width.px()
    val widthPct: Float? = s.widthPct.px()
    val height: Float? = s.height.px()
    val minWidth: Float? = s.minWidth.px()
    val maxWidth: Float? = s.maxWidth.px()
    val minHeight: Float? = s.minHeight.px()
    val maxHeight: Float? = s.maxHeight.px()
    val aspectRatio: Float? = s.aspectRatio.px()
    val fontSize: Float = s.fontSize.px() ?: 15f

    /** top, right, bottom, left */
    val margins: FloatArray = run {
        val m = s.margin.px() ?: 0f
        floatArrayOf(s.marginTop.px() ?: m, s.marginRight.px() ?: m, s.marginBottom.px() ?: m, s.marginLeft.px() ?: m)
    }
    val borders: FloatArray = run {
        val b = s.borderWidth.px() ?: 0f
        floatArrayOf(s.borderTopWidth.px() ?: b, s.borderRightWidth.px() ?: b, s.borderBottomWidth.px() ?: b, s.borderLeftWidth.px() ?: b)
    }
    /** padding + border */
    val insets: FloatArray = run {
        val p = s.padding.px() ?: 0f
        floatArrayOf((s.paddingTop.px() ?: p) + borders[0], (s.paddingRight.px() ?: p) + borders[1],
            (s.paddingBottom.px() ?: p) + borders[2], (s.paddingLeft.px() ?: p) + borders[3])
    }
    /** `lineHeight` in px: a bare number under 4 is a multiple of the font size, as in CSS. */
    val lineHeight: Float = run {
        val lh = s.lineHeight.px()
        when {
            lh == null -> roundHalfUp(fontSize * 1.2f).toFloat()
            lh < 4f -> roundHalfUp(fontSize * lh).toFloat()
            else -> lh
        }
    }

    val inFlow: Boolean get() = s.position != Position.Absolute && s.display != Display.None
    val absolute: Boolean get() = s.position == Position.Absolute
    val hidden: Boolean get() = s.display == Display.None
    val structural: Boolean get() = s.first != null || s.last != null || s.only != null || s.odd != null || s.even != null

    override fun equals(other: Any?) = other is Computed && s == other.s
    override fun hashCode() = s.hashCode()

    /** The properties a child takes from its parent unless it sets them. */
    fun inherited(): Style = Style(
        color = s.color, fontSize = s.fontSize, fontWeight = s.fontWeight, fontStyle = s.fontStyle, fontFamily = s.fontFamily,
        lineHeight = s.lineHeight, letterSpacing = s.letterSpacing, textAlign = s.textAlign, textTransform = s.textTransform,
    )

    fun textPaint(): TextPaint = TextPaint(
        fontSize = fontSize,
        weight = (s.fontWeight ?: FontWeight.Normal).css,
        italic = s.fontStyle == FontStyle.Italic,
        family = family(s.fontFamily),
        lineHeight = lineHeight,
        letterSpacing = s.letterSpacing.px() ?: 0f,
        underline = s.textDecoration == TextDecoration.Underline,
        strike = s.textDecoration == TextDecoration.LineThrough,
        color = parseColor(s.color) ?: BLACK,
        align = when (s.textAlign) { TextAlign.Center -> 1; TextAlign.Right -> 2; else -> 0 },
        lines = max(0, s.numberOfLines ?: 0),
        placeholderColor = parseColor(s.placeholderColor),
    )

    /** What a style looks like, resolved for the backend. `disabled` dims the view; `pointer`: the pointer reaches it. */
    fun paint(kind: Kind?, disabled: Boolean, pointer: Boolean): Paint {
        val radius = s.borderRadius.px() ?: 0f
        val clips = s.overflow == Overflow.Hidden || s.overflow == Overflow.Scroll
        val shadow = if (s.shadowRadius != null || s.shadowColor != null) Shadow(
            parseColor(s.shadowColor) ?: 0x00000040u, s.shadowRadius.px() ?: 0f, s.shadowOffsetX.px() ?: 0f, s.shadowOffsetY.px() ?: 0f,
        ) else null
        val c = parseColor(s.borderColor) ?: BLACK
        val sides = arrayOf(s.borderTopColor, s.borderRightColor, s.borderBottomColor, s.borderLeftColor)
        return Paint(
            background = parseColor(s.backgroundColor),
            borders = borders,
            borderColors = IntArray(4) { (parseColor(sides[it]) ?: c).toInt() },
            radius = radius,
            clip = clips || (radius > 0f && kind == Kind.Image),
            shadow = shadow,
            opacity = (s.opacity.px() ?: 1f) * (if (disabled) 0.4f else 1f),
            visible = s.display != Display.None,
            pointer = pointer,
            fit = when (s.objectFit) { ObjectFit.Contain -> 1; ObjectFit.Fill -> 2; else -> 0 },
            translateX = s.translateX.px() ?: 0f, translateY = s.translateY.px() ?: 0f,
            rotate = s.rotate.px() ?: 0f, scale = s.scale.px() ?: 1f,
            text = textPaint(),
            insets = insets,
        )
    }
}

internal const val BLACK = 0x000000FFu

/** "Inter, sans-serif" → the first name; the CSS generic names stay as they are. */
private fun family(css: String?): String {
    val first = css?.substringBefore(',')?.trim()?.trim('"', '\'') ?: return "sans-serif"
    return when (first.lowercase()) {
        "", "system-ui", "sans-serif", "ui-sans-serif" -> "sans-serif"
        "ui-monospace" -> "monospace"
        else -> first
    }
}

// ---- tag default styles and globalStyle()

private val builtins = HashMap<String, Style>().also { m ->
    val bold = FontWeight.Bold
    fun put(tags: String, style: Style) { for (t in tags.split(' ')) m[t] = style }
    put("h1", Style(fontSize = 32, fontWeight = bold)); put("h2", Style(fontSize = 22, fontWeight = bold))
    put("h3", Style(fontSize = 19, fontWeight = bold)); put("h4", Style(fontSize = 17, fontWeight = bold))
    put("h5", Style(fontSize = 15, fontWeight = bold)); put("h6", Style(fontSize = 13, fontWeight = bold))
    put("strong b dt", Style(fontWeight = bold))
    put("th", Style(flex = 1, fontWeight = bold)); put("td", Style(flex = 1))
    put("tr", Style(flexDirection = FlexDirection.Row))
    put("small sub sup", Style(fontSize = 12))
    put("em i cite dfn var", Style(fontStyle = FontStyle.Italic))
    put("u ins", Style(textDecoration = TextDecoration.Underline))
    put("s del", Style(textDecoration = TextDecoration.LineThrough))
    put("mark", Style(backgroundColor = "#fef08a"))
    put("code pre kbd samp", Style(fontFamily = "monospace"))
    put("a", Style(color = "#2563eb"))
    put("head base link meta script style title template noscript datalist area source track wbr", Style(display = Display.None))
    put("br", Style(height = 16))
    put("select", Style(overflow = Overflow.Hidden, backgroundColor = "#ffffff", borderRadius = 8, borderWidth = 1, borderColor = "#cbd5e1"))
    put("progress", Style(flexDirection = FlexDirection.Row, width = 160, height = 16, overflow = Overflow.Hidden, backgroundColor = "#e5e7eb", borderRadius = 8))
    put("meter", Style(flexDirection = FlexDirection.Row, width = 80, height = 16, overflow = Overflow.Hidden, backgroundColor = "#e5e7eb", borderRadius = 8))
    put("hr", Style(height = 1, backgroundColor = "#cbd5e1"))
    put("button", Style(paddingTop = 8, paddingRight = 14, paddingBottom = 8, paddingLeft = 14, color = "#2563eb"))
    put("input textarea", Style(padding = 8))
}

internal object Globals {
    val styles = HashMap<String, Style>()
    /** Bumped by every globalStyle() call: cached tag styles are rebuilt. */
    var version = 0
    private val cache = HashMap<String, Style>()
    private var cacheVersion = 0

    fun set(selector: String, style: Style) {
        for (part in selector.split(',')) {
            var tag = part.trim()
            if (tag == "html" || tag == ":root" || tag == "*") tag = "body"
            styles[tag] = (styles[tag] ?: NO_STYLE).merged(style)
        }
        version++
    }

    fun body(): Style? = styles["body"]

    fun tag(tag: String): Style {
        if (cacheVersion != version) { cache.clear(); cacheVersion = version }
        return cache.getOrPut(tag) {
            val own = builtins[tag] ?: NO_STYLE
            styles[tag]?.let { own.merged(it) } ?: own
        }
    }
}

// ---- colours

private val colorCache = HashMap<String, UInt?>()

internal fun parseColor(value: String?): UInt? {
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

private fun pack(r: Int, g: Int, b: Int, a: Int): UInt = (r.toUInt() shl 24) or (g.toUInt() shl 16) or (b.toUInt() shl 8) or a.toUInt()

/** CSS colours: `#rgb(a)`, `#rrggbb(aa)`, `rgb()` / `rgba()`, `hsl()` / `hsla()`, `transparent` and the common names. */
internal fun parseColorText(value: String): UInt? {
    val v = value.trim().lowercase()
    if (v == "transparent") return 0u
    NAMED_COLORS[v]?.let { return parseColorText(it) }
    if (v.startsWith("rgb") || v.startsWith("hsl")) {
        val open = v.indexOf('(')
        val close = v.lastIndexOf(')')
        if (open < 0 || close < open) return null
        val parts = v.substring(open + 1, close).split(',', ' ', '/').filter { it.isNotEmpty() }
        if (parts.size < 3) return null
        fun number(part: String, full: Double) =
            if (part.endsWith("%")) (part.dropLast(1).toDoubleOrNull() ?: 0.0) / 100 * full else part.removeSuffix("deg").toDoubleOrNull() ?: 0.0
        fun channel(x: Double) = (x.coerceIn(0.0, 1.0) * 255 + 0.5).toInt()
        val alpha = channel(if (parts.size > 3) number(parts[3], 1.0) else 1.0)
        if (v.startsWith("rgb")) return pack(channel(number(parts[0], 255.0) / 255), channel(number(parts[1], 255.0) / 255), channel(number(parts[2], 255.0) / 255), alpha)
        val h = number(parts[0], 360.0)
        val sat = number(parts[1], 1.0)
        val l = number(parts[2], 1.0)
        fun f(n: Double): Int {
            val k = (n + h / 30) % 12
            return channel(l - sat * min(l, 1 - l) * max(-1.0, minOf(k - 3, 9 - k, 1.0)))
        }
        return pack(f(0.0), f(8.0), f(4.0), alpha)
    }
    if (!v.startsWith("#")) return null
    var hex = v.substring(1)
    if (hex.length == 3 || hex.length == 4) hex = hex.map { "$it$it" }.joinToString("")
    if (hex.length != 6 && hex.length != 8) return null
    val n = hex.toLongOrNull(16) ?: return null
    val rgba = if (hex.length == 6) (n shl 8) or 0xff else n
    return rgba.toUInt()
}
