// NucloRuntime.kt — the Android runtime for apps compiled by nuclo-native-ts. Android Views and the
// Kotlin standard library only: no AndroidX, no kotlinx (async runs on stdlib coroutines).
//
// The model is nuclo's: builders create native views once; `update()` re-runs the dynamic values
// (each dirty-checked against its last value before a view is touched) and reconciles list(),
// when() and region() in place. There is no virtual DOM and no JavaScript.
//
//   Node        one view (or a fragment: list/when/region/into, which owns no view)
//   FlexLayout  the container view: a flex column or row laid out by `Flex` (same algorithm as iOS)
//   Runtime     roots, update(), regions, the activity's window
//   NRouter     tabs and navigation stacks: a bottom bar, an app bar and a view stack with system back

@file:Suppress("unused", "FunctionName", "MemberVisibilityCanBePrivate")

package dev.nuclo.runtime

import android.app.Activity
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.Editable
import android.text.InputType
import android.text.TextWatcher
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.ViewOutlineProvider
import android.view.WindowInsets
import android.view.inputmethod.EditorInfo
import android.widget.CheckBox
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.window.OnBackInvokedDispatcher
import org.json.JSONArray
import org.json.JSONObject
import org.json.JSONTokener
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

// ---------------------------------------------------------------------------
// Style
// ---------------------------------------------------------------------------

enum class FlexDirection { Row, Column }
enum class Align { FlexStart, Center, FlexEnd, Stretch }
enum class Justify { FlexStart, Center, FlexEnd, SpaceBetween }
enum class Position { Relative, Absolute }
enum class Display { Flex, None }
enum class FontWeight { Normal, Bold }
enum class TextAlign { Left, Center, Right }

/** The style subset every runtime lays out the same way, in dp. */
data class Style(
    val flexDirection: FlexDirection? = null,
    val alignItems: Align? = null,
    val justifyContent: Justify? = null,
    val flex: Double? = null,
    val gap: Double? = null,
    val padding: Double? = null,
    val paddingTop: Double? = null,
    val paddingRight: Double? = null,
    val paddingBottom: Double? = null,
    val paddingLeft: Double? = null,
    val width: Double? = null,
    val height: Double? = null,
    val minHeight: Double? = null,
    val position: Position? = null,
    val top: Double? = null,
    val right: Double? = null,
    val bottom: Double? = null,
    val left: Double? = null,
    val display: Display? = null,
    val backgroundColor: String? = null,
    val color: String? = null,
    val opacity: Double? = null,
    val borderRadius: Double? = null,
    val borderWidth: Double? = null,
    val borderColor: String? = null,
    val fontSize: Double? = null,
    val fontWeight: FontWeight? = null,
    val textAlign: TextAlign? = null,
) {
    /** `o`'s set values win, as later declarations do in CSS; a `padding` shorthand resets the sides before it. */
    fun merged(o: Style): Style {
        val resetSides = o.padding != null
        return Style(
            flexDirection = o.flexDirection ?: flexDirection,
            alignItems = o.alignItems ?: alignItems,
            justifyContent = o.justifyContent ?: justifyContent,
            flex = o.flex ?: flex,
            gap = o.gap ?: gap,
            padding = o.padding ?: padding,
            paddingTop = o.paddingTop ?: if (resetSides) null else paddingTop,
            paddingRight = o.paddingRight ?: if (resetSides) null else paddingRight,
            paddingBottom = o.paddingBottom ?: if (resetSides) null else paddingBottom,
            paddingLeft = o.paddingLeft ?: if (resetSides) null else paddingLeft,
            width = o.width ?: width,
            height = o.height ?: height,
            minHeight = o.minHeight ?: minHeight,
            position = o.position ?: position,
            top = o.top ?: top,
            right = o.right ?: right,
            bottom = o.bottom ?: bottom,
            left = o.left ?: left,
            display = o.display ?: display,
            backgroundColor = o.backgroundColor ?: backgroundColor,
            color = o.color ?: color,
            opacity = o.opacity ?: opacity,
            borderRadius = o.borderRadius ?: borderRadius,
            borderWidth = o.borderWidth ?: borderWidth,
            borderColor = o.borderColor ?: borderColor,
            fontSize = o.fontSize ?: fontSize,
            fontWeight = o.fontWeight ?: fontWeight,
            textAlign = o.textAlign ?: textAlign,
        )
    }

    /** The properties a child takes from its parent unless it sets them. */
    internal val inherited get() = Style(color = color, fontSize = fontSize, fontWeight = fontWeight, textAlign = textAlign)

    /** Padding plus border, in px: top, right, bottom, left. */
    internal val insets: FloatArray
        get() {
            val b = (borderWidth ?: 0.0)
            return floatArrayOf(
                px((paddingTop ?: padding ?: 0.0) + b),
                px((paddingRight ?: padding ?: 0.0) + b),
                px((paddingBottom ?: padding ?: 0.0) + b),
                px((paddingLeft ?: padding ?: 0.0) + b),
            )
        }
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

internal fun parseColor(value: String?): Int? {
    val v = value?.trim()?.lowercase() ?: return null
    when (v) {
        "transparent" -> return Color.TRANSPARENT
        "white" -> return Color.WHITE
        "black" -> return Color.BLACK
        "red" -> return Color.RED
    }
    if (!v.startsWith("#")) return null
    var hex = v.substring(1)
    if (hex.length == 3 || hex.length == 4) hex = hex.map { "$it$it" }.joinToString("")
    if (hex.length != 6 && hex.length != 8) return null
    val n = hex.toLongOrNull(16) ?: return null
    val rgba = if (hex.length == 6) (n shl 8) or 0xff else n
    return Color.argb((rgba and 0xff).toInt(), ((rgba shr 24) and 0xff).toInt(), ((rgba shr 16) and 0xff).toInt(), ((rgba shr 8) and 0xff).toInt())
}

/** What the browser (and nuclo-native) give each tag before any style. */
private fun tagStyle(tag: String) = when (tag) {
    "h1" -> Style(fontSize = 32.0, fontWeight = FontWeight.Bold)
    "h2" -> Style(fontSize = 22.0, fontWeight = FontWeight.Bold)
    "h3" -> Style(fontSize = 19.0, fontWeight = FontWeight.Bold)
    "h4" -> Style(fontSize = 17.0, fontWeight = FontWeight.Bold)
    "strong" -> Style(fontWeight = FontWeight.Bold)
    "small" -> Style(fontSize = 12.0)
    "button" -> Style(paddingTop = 8.0, paddingRight = 14.0, paddingBottom = 8.0, paddingLeft = 14.0, color = "#2563eb")
    "input", "textarea" -> Style(padding = 8.0)
    else -> Style()
}

internal fun px(dp: Double): Float = (dp * Runtime.density).toFloat()

// ---------------------------------------------------------------------------
// Node
// ---------------------------------------------------------------------------

class Node internal constructor(internal val kind: Kind, internal val tag: String) : NodeMod {
    internal enum class Kind { Box, Text, Button, Input, Checkbox, Textarea, Image, Fragment }

    internal val view: View? = Runtime.activity.let { ctx ->
        when (kind) {
            Kind.Box -> FlexLayout(ctx, this)
            Kind.Text -> TextView(ctx)
            Kind.Button -> TextView(ctx).apply {
                gravity = Gravity.CENTER
                isClickable = true
                val ripple = TypedValue()
                ctx.theme.resolveAttribute(android.R.attr.selectableItemBackground, ripple, true)
                foreground = ctx.getDrawable(ripple.resourceId)
            }
            Kind.Input -> EditText(ctx).apply {
                isSingleLine = true
                imeOptions = EditorInfo.IME_ACTION_DONE
            }
            Kind.Checkbox -> CheckBox(ctx)
            Kind.Textarea -> EditText(ctx).apply { inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_MULTI_LINE }
            Kind.Image -> ImageView(ctx).apply { scaleType = ImageView.ScaleType.CENTER_CROP }
            Kind.Fragment -> null
        }
    }

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

    private val listeners = HashMap<String, (NativeEvent) -> Unit>()
    /** Set while the runtime writes a control, so it reports no event (as in the browser). */
    private var writing = false

    init {
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
        val flex = view as? FlexLayout
        if (flex != null) flex.setItems(children.flatMap { it.flatViews }) else host?.syncViews()
    }

    // Bindings ---------------------------------------------------------------

    /** Runs `get` now and on each update; `set` only sees values that changed. */
    internal fun <T> bind(get: () -> T, set: (T) -> Unit) {
        var first = true
        var last: T? = null
        val run = {
            val value = get()
            if (first || value != last) {
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
            else -> append(Node(Kind.Text, "span").also { it.addText(part) })
        }
    }

    private fun renderText() {
        val text = textParts.joinToString("") { it() }
        if (text == lastText) return
        lastText = text
        (view as? TextView)?.text = text
    }

    // Refresh ----------------------------------------------------------------

    internal fun refresh() {
        if (destroyed) return
        reconcile?.invoke()
        for (binding in bindings.toList()) binding()
        applyStyle()
        for (child in children.toList()) child.refresh()
    }

    internal fun applyStylesDeep() {
        applyStyle()
        for (child in children) child.applyStylesDeep()
    }

    internal fun applyStyle() {
        val v = view
        if (v == null) {
            computed = parent?.computed ?: Style()
            return
        }
        var s = (parent?.computed?.inherited ?: Style()).merged(tagStyle(tag))
        for (c in classes) s = s.merged(c)
        dynamicClass?.let { s = s.merged(it().style) }
        s = s.merged(inline)
        dynamicInline?.let { s = s.merged(it()) }
        computed = s
        if (s == painted) return
        painted = s
        paint(v, s)
        v.requestLayout()
    }

    private fun paint(v: View, s: Style) {
        val bg = parseColor(s.backgroundColor)
        val border = (s.borderWidth ?: 0.0) > 0
        if (bg != null || border || (s.borderRadius ?: 0.0) > 0 || kind == Kind.Box || kind == Kind.Button) {
            v.background = GradientDrawable().apply {
                setColor(bg ?: Color.TRANSPARENT)
                cornerRadius = px(s.borderRadius ?: 0.0)
                if (border) setStroke(px(s.borderWidth!!).roundToInt(), parseColor(s.borderColor) ?: Color.BLACK)
            }
        }
        val radius = s.borderRadius ?: 0.0
        v.clipToOutline = radius > 0 && (kind == Kind.Box || kind == Kind.Image || kind == Kind.Button)
        if (v.clipToOutline) v.outlineProvider = ViewOutlineProvider.BACKGROUND
        v.alpha = (s.opacity ?: 1.0).toFloat() * (if (v.isEnabled) 1f else 0.4f)
        v.visibility = if (s.display == Display.None) View.GONE else View.VISIBLE
        // An overlay box (absolute) takes the touches over what is under it.
        if (kind == Kind.Box && s.position == Position.Absolute) v.isClickable = true
        if (v is TextView) {
            v.setTextSize(TypedValue.COMPLEX_UNIT_DIP, (s.fontSize ?: 15.0).toFloat())
            v.typeface = if (s.fontWeight == FontWeight.Bold) Typeface.DEFAULT_BOLD else Typeface.DEFAULT
            v.setTextColor(parseColor(s.color) ?: Color.BLACK)
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
        bindings.clear()
        reconcile = null
    }

    // Events -----------------------------------------------------------------

    private fun fire(type: String) {
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
            }
            else -> {}
        }
    }

    internal fun listen(type: String, handler: (NativeEvent) -> Unit) {
        listeners[type] = handler
        if (type == "click" && (kind == Kind.Box || kind == Kind.Button)) view?.setOnClickListener { fire("click") }
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

    /** The size this node takes when given at most `maxWidth` px: [width, height]. */
    internal fun measure(maxWidth: Float): FloatArray {
        val s = computed
        val width = s.width?.let { px(it) }
        val height = s.height?.let { px(it) }
        val available = width ?: maxWidth
        val v = view ?: return floatArrayOf(0f, 0f)
        val size = when (v) {
            is FlexLayout -> v.measureFlex(available, height)
            is CheckBox -> {
                v.measure(View.MeasureSpec.UNSPECIFIED, View.MeasureSpec.UNSPECIFIED)
                floatArrayOf(v.measuredWidth.toFloat(), v.measuredHeight.toFloat())
            }
            is ImageView -> floatArrayOf(min(available, px(120.0)), height ?: width ?: px(120.0))
            else -> {
                v.measure(View.MeasureSpec.makeMeasureSpec(available.toInt().coerceAtLeast(0), View.MeasureSpec.AT_MOST), View.MeasureSpec.UNSPECIFIED)
                val w = if (v is EditText && kind == Kind.Input) min(available, px(180.0)) else v.measuredWidth.toFloat()
                floatArrayOf(w, v.measuredHeight.toFloat())
            }
        }
        if (width != null) size[0] = width
        if (height != null) size[1] = height
        s.minHeight?.let { size[1] = max(size[1], px(it)) }
        return size
    }
}

// ---------------------------------------------------------------------------
// Views and layout
// ---------------------------------------------------------------------------

/** A container: a flex column (or row) of its node's child views. */
class FlexLayout internal constructor(context: Context, internal val node: Node) : ViewGroup(context) {
    internal var items: List<Node> = emptyList()
        private set
    private val frames = HashMap<Node, FloatArray>()

    internal fun setItems(next: List<Node>) {
        val keep = next.toHashSet()
        for (old in items) if (old !in keep && old.view?.parent === this) removeView(old.view)
        next.forEachIndexed { i, item ->
            val v = item.view ?: return@forEachIndexed
            if (v.parent !== this) {
                (v.parent as? ViewGroup)?.removeView(v)
                addView(v, min(i, childCount))
            } else if (indexOfChild(v) != i) {
                removeViewInLayout(v)
                addView(v, min(i, childCount))
            }
        }
        items = next
        requestLayout()
    }

    internal fun measureFlex(width: Float, height: Float?): FloatArray = Flex.layout(this, width, height, null)

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val wMode = MeasureSpec.getMode(widthMeasureSpec)
        val width = if (wMode == MeasureSpec.UNSPECIFIED) Float.MAX_VALUE / 4 else MeasureSpec.getSize(widthMeasureSpec).toFloat()
        val height = if (MeasureSpec.getMode(heightMeasureSpec) == MeasureSpec.EXACTLY) MeasureSpec.getSize(heightMeasureSpec).toFloat() else null
        frames.clear()
        val size = Flex.layout(this, width, height, frames)
        // Children are measured at exactly their frames, so each lays out its own children.
        for ((child, f) in frames) {
            child.view?.measure(MeasureSpec.makeMeasureSpec(f[2].roundToInt(), MeasureSpec.EXACTLY), MeasureSpec.makeMeasureSpec(f[3].roundToInt(), MeasureSpec.EXACTLY))
        }
        val w = if (wMode == MeasureSpec.EXACTLY) width else size[0]
        setMeasuredDimension(w.roundToInt(), (height ?: size[1]).roundToInt())
    }

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        for ((child, f) in frames) {
            val x = f[0].roundToInt()
            val y = f[1].roundToInt()
            child.view?.layout(x, y, x + f[2].roundToInt(), y + f[3].roundToInt())
        }
    }
}

/** The flex layout both runtimes implement the same way (see NucloRuntime.swift `Flex`). */
internal object Flex {
    /** Lays out `view`'s items in a box `width` wide (and `height` tall when definite); fills `frames` when given. */
    fun layout(view: FlexLayout, width: Float, height: Float?, frames: MutableMap<Node, FloatArray>?): FloatArray {
        val s = view.node.computed
        val (pt, pr, pb, pl) = s.insets.toList()
        val innerW = max(0f, width - pl - pr)
        val innerH = height?.let { max(0f, it - pt - pb) }
        val gap = px(s.gap ?: 0.0)
        val flow = view.items.filter { it.inFlow }
        val gaps = gap * max(0, flow.size - 1)
        val align = s.alignItems ?: Align.Stretch
        val justify = s.justifyContent ?: Justify.FlexStart
        val flexes = flow.map { (it.computed.flex ?: 0.0).toFloat() }
        val totalFlex = flexes.sum()
        val out = ArrayList<FloatArray>(flow.size)
        val natural: FloatArray

        if (s.flexDirection == FlexDirection.Row) {
            val sizes = flow.mapIndexed { i, child -> if (flexes[i] > 0) floatArrayOf(0f, 0f) else child.measure(innerW) }
            val fixed = sizes.sumOf { it[0].toDouble() }.toFloat() + gaps
            val space = max(0f, innerW - fixed)
            flow.forEachIndexed { i, child ->
                if (flexes[i] > 0) {
                    val w = space * flexes[i] / totalFlex
                    sizes[i][0] = w
                    sizes[i][1] = child.measure(w)[1]
                }
            }
            val rowH = innerH ?: (sizes.maxOfOrNull { it[1] } ?: 0f)
            var x = pl
            var spacing = gap
            val free = if (totalFlex > 0) 0f else space
            when (justify) {
                Justify.Center -> x += free / 2
                Justify.FlexEnd -> x += free
                Justify.SpaceBetween -> if (flow.size > 1) spacing += free / (flow.size - 1)
                Justify.FlexStart -> {}
            }
            flow.forEachIndexed { i, child ->
                val w = sizes[i][0]
                var h = sizes[i][1]
                var y = pt
                when (align) {
                    Align.Stretch -> if (child.computed.height == null) h = rowH
                    Align.Center -> y += (rowH - h) / 2
                    Align.FlexEnd -> y += rowH - h
                    Align.FlexStart -> {}
                }
                out.add(floatArrayOf(x, y, w, h))
                x += w + spacing
            }
            natural = floatArrayOf((if (totalFlex > 0) innerW else fixed) + pl + pr, rowH + pt + pb)
        } else {
            val sizes = flow.map { child ->
                val size = child.measure(innerW)
                if (align == Align.Stretch && child.computed.width == null) size[0] = innerW
                size
            }
            val content = sizes.sumOf { it[1].toDouble() }.toFloat() + gaps
            var free = 0f
            if (innerH != null) {
                if (totalFlex > 0) {
                    val basis = sizes.indices.sumOf { if (flexes[it] > 0) 0.0 else sizes[it][1].toDouble() }.toFloat() + gaps
                    val space = max(0f, innerH - basis)
                    flow.indices.forEach { if (flexes[it] > 0) sizes[it][1] = space * flexes[it] / totalFlex }
                } else {
                    free = max(0f, innerH - content)
                }
            }
            var y = pt
            var spacing = gap
            when (justify) {
                Justify.Center -> y += free / 2
                Justify.FlexEnd -> y += free
                Justify.SpaceBetween -> if (flow.size > 1) spacing += free / (flow.size - 1)
                Justify.FlexStart -> {}
            }
            flow.indices.forEach { i ->
                val (w, h) = sizes[i].toList()
                var x = pl
                when (align) {
                    Align.Center -> x += (innerW - w) / 2
                    Align.FlexEnd -> x += innerW - w
                    else -> {}
                }
                out.add(floatArrayOf(x, y, w, h))
                y += h + spacing
            }
            natural = floatArrayOf((sizes.maxOfOrNull { it[0] } ?: 0f) + pl + pr, (innerH ?: content) + pt + pb)
        }

        if (frames != null) {
            flow.forEachIndexed { i, child -> frames[child] = out[i] }
            val bw = width
            val bh = height ?: natural[1]
            for (child in view.items) {
                if (child.computed.position == Position.Absolute && child.computed.display != Display.None) frames[child] = absoluteFrame(child, bw, bh)
            }
        }
        val w = if (width < Float.MAX_VALUE / 8) min(width, natural[0]) else natural[0]
        return floatArrayOf(w, height ?: natural[1])
    }

    private fun absoluteFrame(child: Node, bw: Float, bh: Float): FloatArray {
        val s = child.computed
        val l = s.left?.let { px(it) }
        val r = s.right?.let { px(it) }
        val t = s.top?.let { px(it) }
        val b = s.bottom?.let { px(it) }
        val w = s.width?.let { px(it) } ?: if (l != null && r != null) bw - l - r else child.measure(bw)[0]
        val h = s.height?.let { px(it) } ?: if (t != null && b != null) bh - t - b else child.measure(w)[1]
        val x = l ?: if (r != null) bw - r - w else 0f
        val y = t ?: if (b != null) bh - b - h else 0f
        return floatArrayOf(x, y, w, h)
    }
}

/** A scrolling screen whose content is a node, as tall as its content or the screen. */
internal class ScreenView(context: Context, val root: Node) : ScrollView(context) {
    init {
        isFillViewport = true
        setBackgroundColor(Color.WHITE)
        addView(root.view, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))
    }
}

// ---------------------------------------------------------------------------
// Runtime
// ---------------------------------------------------------------------------

object Runtime {
    lateinit var activity: Activity
        internal set
    internal var density = 1f
    internal val main = Handler(Looper.getMainLooper())

    private lateinit var rootLayout: FrameLayout
    private val roots = mutableListOf<Node>()
    private var hasMain = false
    private var updating = false
    private var queuedAll = false
    private val queuedIds = HashSet<String>()
    internal var backHandler: (() -> Boolean)? = null

    internal val regions = HashMap<String, RegionState>()
    internal val waiting = HashMap<String, MutableList<IntoEntry>>()

    internal fun start(activity: Activity) {
        this.activity = activity
        density = activity.resources.displayMetrics.density
        roots.clear()
        regions.clear()
        waiting.clear()
        hasMain = false
        rootLayout = FrameLayout(activity).apply { setBackgroundColor(Color.WHITE) }
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
        addRoot(node)
        if (hasMain) {
            rootLayout.addView(node.view, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
        } else {
            hasMain = true
            rootLayout.addView(ScreenView(activity, node), 0)
        }
    }

    internal fun render(router: NRouter) {
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
        it.syncViews()
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

    fun checked(value: Boolean) = checked { value }
    fun checked(value: () -> Boolean) = NodeMod { node ->
        node.bind(value) { on -> (node.view as? CheckBox)?.let { box -> if (box.isChecked != on) node.write { box.isChecked = on } } }
    }

    fun disabled(value: Boolean) = disabled { value }
    fun disabled(value: () -> Boolean) = NodeMod { node ->
        node.bind(value) { off ->
            node.view?.isEnabled = !off
            node.view?.alpha = (node.computed.opacity ?: 1.0).toFloat() * (if (off) 0.4f else 1f)
        }
    }

    fun inputType(type: String) = NodeMod { node ->
        (node.view as? EditText)?.inputType = when (type) {
            "password" -> InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            "email" -> InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
            "number" -> InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_DECIMAL
            else -> InputType.TYPE_CLASS_TEXT
        }
    }

    fun onClick(handler: (NativeEvent) -> Unit) = NodeMod { it.listen("click", handler) }
    fun onInput(handler: (NativeEvent) -> Unit) = NodeMod { it.listen("input", handler) }
    fun onChange(handler: (NativeEvent) -> Unit) = NodeMod { it.listen("change", handler) }

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
        val old = rows.toMutableList()
        val built = ArrayList<Pair<T, Node?>>(next.size)
        var changed = next.size != rows.size
        next.forEachIndexed { index, item ->
            val i = old.indexOfFirst { it.first == item }
            if (i >= 0) {
                if (i != 0) changed = true
                built.add(old.removeAt(i))
            } else {
                val node = render(item, index)
                node?.parent = fragment
                built.add(item to node)
                changed = true
            }
        }
        for ((_, node) in old) node?.destroy()
        rows = built
        if (changed) {
            fragment.children = built.mapNotNull { it.second }.toMutableList()
            for ((_, node) in built) node?.applyStylesDeep()
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

class NRoute(pattern: String, internal val view: (Params) -> Node, internal val title: ((Params) -> String)? = null) {
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
 * The router owns the stacks; system back pops (or leaves the app at a tab's root).
 */
class NRouter(private val routes: List<NRoute>, private val tabs: List<NTab> = emptyList(), private val initial: String = "/") {
    private class Entry(val path: String, val node: Node, val view: View, val title: String)

    private val stacks = mutableListOf<MutableList<Entry>>()
    private var active = 0
    private lateinit var content: FrameLayout
    private lateinit var titleView: TextView
    private lateinit var backView: TextView
    private val tabViews = mutableListOf<TextView>()

    val outlet: NRouter get() = this
    val path: String get() = stacks.getOrNull(active)?.lastOrNull()?.path ?: initial
    val canGoBack: Boolean get() = (stacks.getOrNull(active)?.size ?: 0) > 1

    internal fun makeView(context: Context): View {
        val roots = if (tabs.isEmpty()) listOf(initial) else tabs.map { it.path }
        active = max(0, tabOf(initial))
        roots.forEachIndexed { i, root ->
            val stack = mutableListOf(entry(root))
            if (i == active && root != initial) stack.add(entry(initial))
            stacks.add(stack)
        }
        val column = LinearLayout(context).apply { orientation = LinearLayout.VERTICAL }
        val bar = FrameLayout(context).apply {
            setBackgroundColor(Color.WHITE)
            elevation = px(2.0)
        }
        backView = TextView(context).apply {
            text = "←"
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
        Runtime.backHandler = { if (canGoBack) back().let { true } else false }
        show(null)
        return column
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

    /** Shows the active stack's top screen: slid in on a push (+1), out on a pop (-1). */
    private fun show(direction: Int?, popped: Entry? = null) {
        val top = stacks[active].last()
        val width = content.width.toFloat().takeIf { it > 0 } ?: Runtime.activity.resources.displayMetrics.widthPixels.toFloat()
        (top.view.parent as? ViewGroup)?.removeView(top.view)
        when (direction) {
            +1 -> {
                content.addView(top.view)
                top.view.translationX = width
                top.view.animate().translationX(0f).setDuration(220).withEndAction { keepOnly(top.view) }.start()
            }
            -1 -> {
                content.addView(top.view, 0)
                top.view.translationX = 0f
                popped?.view?.animate()?.translationX(width)?.setDuration(200)?.withEndAction {
                    content.removeView(popped.view)
                    Runtime.removeRoot(popped.node)
                }?.start()
            }
            else -> {
                content.removeAllViews()
                top.view.translationX = 0f
                content.addView(top.view)
            }
        }
        titleView.text = top.title
        backView.visibility = if (canGoBack) View.VISIBLE else View.GONE
        titleView.setPaddingRelative(px(if (canGoBack) 60.0 else 20.0).roundToInt(), 0, 0, 0)
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
            return Entry(path, node, ScreenView(Runtime.activity, node), route.title?.invoke(params) ?: "")
        }
        val node = p(A.text("No route matches $path"))
        Runtime.addRoot(node)
        return Entry(path, node, ScreenView(Runtime.activity, node), "Not found")
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
        result.exceptionOrNull()?.let { Log.e("nuclo", "Uncaught error in an async function", it) }
    })
}

suspend fun delay(ms: Double) = suspendCoroutine { cont -> Runtime.main.postDelayed({ cont.resume(Unit) }, ms.toLong()) }

class NResponse internal constructor(val status: Int, private val body: String) {
    val ok get() = status in 200..299

    suspend fun text(): String = body

    suspend fun <T> json(decode: (Any?) -> T): T = decode(JSONTokener(body).nextValue())
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

class NTimer internal constructor() {
    internal var runnable: Runnable? = null
    internal var cancelled = false

    internal fun cancel() {
        cancelled = true
        runnable?.let { Runtime.main.removeCallbacks(it) }
    }
}

fun setTimeout(callback: () -> Unit, ms: Double): NTimer {
    val timer = NTimer()
    timer.runnable = Runnable { if (!timer.cancelled) callback() }.also { Runtime.main.postDelayed(it, ms.toLong()) }
    return timer
}

fun setInterval(callback: () -> Unit, ms: Double): NTimer {
    val timer = NTimer()
    val tick = object : Runnable {
        override fun run() {
            if (timer.cancelled) return
            callback()
            if (!timer.cancelled) Runtime.main.postDelayed(this, max(1L, ms.toLong()))
        }
    }
    timer.runnable = tick
    Runtime.main.postDelayed(tick, max(1L, ms.toLong()))
    return timer
}

fun clearTimeout(timer: NTimer) = timer.cancel()
fun clearInterval(timer: NTimer) = timer.cancel()

fun consoleLog(vararg values: String) {
    Log.i("nuclo", values.joinToString(" "))
}

// ---------------------------------------------------------------------------
// JSON
// ---------------------------------------------------------------------------

/** Decoders the compiler generates per interface call into these (org.json, part of Android). */
object NJSON {
    class Obj internal constructor(private val o: JSONObject) {
        operator fun get(key: String): Any? = if (o.isNull(key)) null else o.get(key)
    }

    fun obj(v: Any?) = Obj(v as? JSONObject ?: throw Exception("Expected a JSON object"))
    fun string(v: Any?) = v as? String ?: throw Exception("Expected a JSON string")
    fun double(v: Any?) = (v as? Number)?.toDouble() ?: throw Exception("Expected a JSON number")
    fun int(v: Any?) = double(v).toInt()
    fun bool(v: Any?) = v as? Boolean ?: throw Exception("Expected a JSON boolean")

    fun <T> array(v: Any?, element: (Any?) -> T): MutableList<T> {
        val a = v as? JSONArray ?: throw Exception("Expected a JSON array")
        return MutableList(a.length()) { element(if (a.isNull(it)) null else a.get(it)) }
    }

    fun <T> map(v: Any?, value: (Any?) -> T): MutableMap<String, T> {
        val o = v as? JSONObject ?: throw Exception("Expected a JSON object")
        return o.keys().asSequence().associateWith { value(if (o.isNull(it)) null else o.get(it)) }.toMutableMap()
    }

    fun <T> optional(v: Any?, value: (Any?) -> T): T? = if (v == null || v == JSONObject.NULL) null else value(v)
}

// ---------------------------------------------------------------------------
// JavaScript semantics
// ---------------------------------------------------------------------------

/** Numbers the way JavaScript prints them: 3, not 3.0. */
fun jsNum(d: Double): String = when {
    d.isNaN() -> "NaN"
    d.isInfinite() -> if (d > 0) "Infinity" else "-Infinity"
    d == Math.rint(d) && kotlin.math.abs(d) < 1e15 -> d.toLong().toString()
    else -> d.toString()
}

fun jsFixed(d: Double, digits: Int) = String.format(java.util.Locale.ROOT, "%.${digits}f", d)
fun jsRound(d: Double) = kotlin.math.floor(d + 0.5).toInt()
fun jsNow() = System.currentTimeMillis().toDouble()
fun jsNumber(s: String) = s.trim().toDoubleOrNull() ?: Double.NaN
fun jsParseInt(s: String) = s.trim().takeWhile { it.isDigit() || it == '-' }.toIntOrNull() ?: 0
fun jsErrorMessage(e: Exception) = "Error: ${e.message ?: e.javaClass.simpleName}"

fun <T> MutableList<T>.jsSplice(start: Int, count: Int): MutableList<T> {
    val from = if (start < 0) max(0, size + start) else min(start, size)
    val to = min(size, from + max(0, count))
    val range = subList(from, to)
    val removed = range.toMutableList()
    range.clear()
    return removed
}

fun <T> List<T>.jsSlice(start: Int, end: Int?): MutableList<T> {
    val from = if (start < 0) max(0, size + start) else min(start, size)
    val to = end?.let { if (it < 0) max(0, size + it) else min(it, size) } ?: size
    return if (from < to) subList(from, to).toMutableList() else mutableListOf()
}

fun String.jsSlice(start: Int, end: Int?): String {
    val from = if (start < 0) max(0, length + start) else min(start, length)
    val to = end?.let { if (it < 0) max(0, length + it) else min(it, length) } ?: length
    return if (from < to) substring(from, to) else ""
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

    @Deprecated("Android 12 and older")
    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (Runtime.backHandler?.invoke() != true) super.onBackPressed()
    }
}
