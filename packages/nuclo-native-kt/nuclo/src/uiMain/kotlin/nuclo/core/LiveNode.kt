package nuclo.core

import nuclo.*
import nuclo.host.*
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min

internal object Unset

internal class Binding<T>(val get: () -> T, val apply: (T) -> Unit) {
    var last: Any? = Unset
    fun run() {
        val value = get()
        if (Runtime.forced || last === Unset || last != value) {
            last = value
            apply(value)
        }
    }
}

private class Memo(val epoch: Int, val width: Float, val w: Float, val h: Float)

/** A mounted descriptor: one view (kind != null) or a fragment (kind == null: list / when / region / into) that owns none. */
internal class LiveNode(val kind: Kind?, val tag: String) {
    var view: ViewId = 0
    /** What the backend was asked to create: an `input` with type("checkbox") is a Checkbox. */
    var vk: ViewKind? = null
    var parent: LiveNode? = null
    var children = ArrayList<LiveNode>()
    val scopes = ArrayList<String>()

    val bindings = ArrayList<Binding<*>>()
    /** list / when / region: reconciles `children` before they refresh. */
    var reconcile: (() -> Unit)? = null
    val teardown = ArrayList<() -> Unit>()

    val mountCallbacks = ArrayList<(NativeElement) -> (() -> Unit)?>()
    val destroyCallbacks = ArrayList<(NativeElement) -> Unit>()
    val cleanups = ArrayList<() -> Unit>()
    var mounted = false
    var destroyed = false

    /** Static strings and dynamic functions of a text / button node. */
    val textParts = ArrayList<Any>()
    var lastText: String? = null
    var shownText = ""

    val classes = ArrayList<Style>()
    var dynamicClass: (() -> StyleClass)? = null
    var inline: Style = NO_STYLE
    var dynamicInline: (() -> Style)? = null
    var computed: Computed = EMPTY
    var painted: Computed? = null
    var disabled = false
    var placeholder = ""
    var label = ""

    /** The update pass this node was built in: its bindings already ran then. */
    val born = Runtime.generation

    val listeners = HashMap<EventKind, Any>()
    var listening = 0
    var href: String? = null
    var pressed = false
    var hovered = false
    var focused = false
    /** Set while the runtime writes a control, so it reports no event (as in the browser). */
    var writing = false

    /** A box that scrolls its children (`overflow = Scroll`): null = no, else whether along a row. */
    var scrolls: Boolean? = null
    /** What the view was last painted with. */
    var look: Paint? = null
    /** A box's child views in order: its children's own, or their fragments' children's. */
    var items: List<LiveNode> = emptyList()
    private val memo = arrayOfNulls<Memo>(2)

    // M5/M6/M7 state lives in extensions (Motion.kt, Tasks.kt, Native.kt) through these slots.
    var imageSeq = 0
    var motion: Any? = null
    var extra: Any? = null

    val backend: Backend get() = Runtime.backend
    fun isKind(k: ViewKind) = vk == k

    fun append(child: LiveNode) {
        child.parent = this
        children.add(child)
    }

    /** This node's views in order: its own, or a fragment's children's. */
    fun flatViews(out: ArrayList<LiveNode>) {
        if (view != 0) out.add(this) else for (c in children) c.flatViews(out)
    }

    /** Makes the nearest box's views match the tree. */
    fun syncViews() {
        if (vk == ViewKind.Box) {
            val list = ArrayList<LiveNode>()
            for (c in children) c.flatViews(list)
            backend.setChildren(view, IntArray(list.size) { list[it].view })
            items = list
            restack()
            Runtime.invalidateLayout()
            // `first`, `last`, `odd`… follow the views' places, and `empty` whether there are any.
            for (item in list) if (item.computed.structural) item.applyStylesDeep()
            if (computed.s.empty != null) applyStyle()
        } else parent?.syncViews()
    }

    /** zIndex: children are drawn (and hit) lowest first, in tree order among equals. */
    fun restack() {
        if (items.all { it.computed.s.zIndex == null }) return
        val order = items.withIndex().sortedWith(compareBy({ it.value.computed.s.zIndex?.toDouble() ?: 0.0 }, { it.index })).map { it.value.view }
        backend.reorder(view, order.toIntArray())
    }

    /** Called once the builder applied its arguments: a box that scrolls becomes a scroller, then gets its views. */
    fun finish() {
        if (vk == ViewKind.Box) {
            // `overflow = Scroll` is read from the static styles: the scroller has to exist before the children arrive.
            var s = Globals.tag(tag)
            for (c in classes) s = s.merged(c)
            s = s.merged(inline)
            if (s.overflow == Overflow.Scroll) {
                val horizontal = s.flexDirection == FlexDirection.Row
                backend.makeScrollable(view, horizontal)
                scrolls = horizontal
            }
        }
        syncViews()
    }

    // Bindings ---------------------------------------------------------------

    fun <T> bind(get: () -> T, apply: (T) -> Unit) {
        val b = Binding(get, apply)
        b.run()
        bindings.add(b)
    }

    private var textBinding: Binding<String>? = null

    fun addText(part: Any) {
        if (vk == ViewKind.Text || vk == ViewKind.Button) {
            textParts.add(part)
            val b = textBinding ?: Binding({ joinedText() }) { text ->
                val wasEmpty = lastText.isNullOrEmpty()
                lastText = text
                showText()
                if (wasEmpty != isEmpty() && computed.s.empty != null) applyStyle()
            }.also { textBinding = it; bindings.add(it) }
            b.run()
        } else if (vk == ViewKind.Box) {
            val span = LiveNode(Kind.Text, "span")
            span.initView(ViewKind.Text)
            span.addText(part)
            span.finish()
            append(span)
        }
    }

    private fun joinedText(): String {
        val sb = StringBuilder()
        for (p in textParts) sb.append(if (p is String) p else textOf((p as Function0<*>)()))
        return sb.toString()
    }

    /** Writes the text into the view, as `textTransform` shows it. */
    fun showText() {
        val text = lastText ?: return
        shownText = when (computed.s.textTransform) {
            TextTransform.Uppercase -> text.uppercase()
            TextTransform.Lowercase -> text.lowercase()
            TextTransform.Capitalize -> {
                var start = true
                buildString { for (ch in text) { append(if (start) ch.uppercaseChar() else ch); start = ch.isWhitespace() } }
            }
            else -> text
        }
        backend.setText(view, shownText)
        clearMemo()
        Runtime.invalidateLayout()
    }

    fun clearMemo() { memo[0] = null; memo[1] = null }

    /** `:empty`: a box with no views, a text with no text. */
    fun isEmpty(): Boolean = if (vk == ViewKind.Box) items.isEmpty() else lastText.isNullOrEmpty()

    /** This view's index among the views of its container, and how many there are. */
    private fun siblingPlace(): Pair<Int, Int>? {
        val host = host() ?: return null
        val i = host.items.indexOf(this)
        return if (i < 0) null else i to host.items.size
    }

    // Refresh ----------------------------------------------------------------

    fun refresh() {
        if (destroyed || born == Runtime.generation) return
        reconcile?.invoke()
        for (b in ArrayList(bindings)) b.run()
        nativeUpdate?.invoke()
        applyStyle()
        for (c in ArrayList(children)) c.refresh()
    }

    fun applyStylesDeep() {
        applyStyle()
        for (c in ArrayList(children)) c.applyStylesDeep()
    }

    fun applyStyle() {
        if (view == 0) { computed = parent?.computed ?: EMPTY; return }
        val p = parent?.computed
        val base = p?.inherited() ?: Globals.body()?.let { Computed(it).inherited() } ?: NO_STYLE
        var s = base.merged(Globals.tag(tag))
        for (c in classes) s = s.merged(c)
        dynamicClass?.let { s = s.merged(it().style) }
        s = s.merged(inline)
        dynamicInline?.let { s = s.merged(it()) }
        // `@media` and screens, against the window's width.
        s.media?.let { rules ->
            val w = Runtime.viewportWidth()
            for (r in rules) if (r.matches(w)) s = s.merged(r.style)
        }
        // The box's place among its siblings, and what it holds.
        val st = s
        if (st.first != null || st.last != null || st.only != null || st.odd != null || st.even != null) {
            siblingPlace()?.let { (index, count) ->
                if (index == 0) st.first?.let { s = s.merged(it) }
                if (index + 1 == count) st.last?.let { s = s.merged(it) }
                if (count == 1) st.only?.let { s = s.merged(it) }
                if (index % 2 == 0) st.odd?.let { s = s.merged(it) }
                if (index % 2 == 1) st.even?.let { s = s.merged(it) }
            }
        }
        val s1 = s
        if (s1.empty != null && isEmpty()) s = s.merged(s1.empty)
        if (s1.checked != null && vk == ViewKind.Checkbox && backend.controlChecked(view)) s = s.merged(s1.checked)
        if (s1.placeholderShown != null && (vk == ViewKind.Input || vk == ViewKind.Textarea) && backend.controlText(view).isEmpty()) s = s.merged(s1.placeholderShown)
        (if (disabled) s1.disabled else s1.enabled)?.let { s = s.merged(it) }
        // The state styles, over everything else while the state holds.
        if (s1.hover != null) { want(InputKind.Hover); if (hovered) s = s.merged(s1.hover) }
        if (s1.focused != null && focused) s = s.merged(s1.focused)
        if (s1.pressed != null) { want(InputKind.Pointer); if (pressed) s = s.merged(s1.pressed) }
        // A screen without a background of its own shows the body's.
        if (parent == null && s.backgroundColor == null && !isOverlay()) Globals.body()?.backgroundColor?.let { s = s.merged(Style(backgroundColor = it)) }
        val c = Computed(s)
        computed = c
        val before = painted
        if (!Runtime.forced && before == c) return
        painted = c
        clearMemo()
        if (before == null) { if (c.s.textTransform != null) showText() } else if (before.s.textTransform != c.s.textTransform) showText()
        paint(c, before)
        if (before?.s?.zIndex?.toDouble() != c.s.zIndex?.toDouble()) host()?.restack()
        Runtime.invalidateLayout()
    }

    /** The nearest node with a view: where this node's views are. */
    fun host(): LiveNode? {
        var n = parent
        while (n != null && n.view == 0) n = n.parent
        return n
    }

    fun isOverlay() = Runtime.roots.any { it.overlay && it.node === this }

    /** Whether the pointer reaches this view: not under a box with `pointerEvents = None`. */
    fun takesPointer(s: Computed): Boolean = s.s.pointerEvents != PointerEvents.None && (host()?.look?.pointer ?: true)

    /** Asks the backend, once, to report a kind of input for this view. */
    fun want(input: InputKind) {
        val bit = 1 shl input.ordinal
        if (listening and bit == 0) {
            listening = listening or bit
            if (view != 0) backend.listen(view, input)
        }
    }

    /** Paints the style. Under a transition, what can move goes there over time; the first paint (and test mode) is at once. */
    fun paint(c: Computed, before: Computed?) {
        val target = c.paint(kind, disabled, takesPointer(c))
        val from = look
        look = target
        val duration = if (before != null && !Runtime.testMode) c.s.transitionDuration?.toDouble() ?: 0.0 else 0.0
        if (from != null && before != null && duration > 0.0 && from != target) {
            Motion.transition(this, from, target, c, before)
        } else {
            Motion.stop(this)
            backend.paint(view, vk!!, target)
        }
        Motion.keyframes(this, c)
    }

    // Lifecycle --------------------------------------------------------------

    /** Runs onMount once the node is under a root that is on screen. */
    fun mountDeep() {
        if (destroyed) return
        if (view != 0 && !mounted) {
            mounted = true
            for (cb in ArrayList(mountCallbacks)) cb(NativeElement(backend.handleOf(view)))?.let { cleanups.add(it) }
        }
        for (c in ArrayList(children)) c.mountDeep()
    }

    /** Runs onDestroy and cleanups, children first, and releases the view. */
    fun destroy() {
        if (destroyed) return
        for (c in ArrayList(children)) c.destroy()
        destroyed = true
        val td = ArrayList(teardown); teardown.clear(); for (t in td) t()
        val cl = ArrayList(cleanups); cleanups.clear(); for (c in cl) c()
        if (view != 0) {
            val cbs = ArrayList(destroyCallbacks); destroyCallbacks.clear()
            for (cb in cbs) cb(NativeElement(backend.handleOf(view)))
            Runtime.views.remove(view)
            backend.destroy(view)
        }
        Motion.stop(this)
        bindings.clear(); reconcile = null; mountCallbacks.clear(); textParts.clear(); dynamicClass = null; dynamicInline = null
        listeners.clear(); items = emptyList()
    }

    // Events -----------------------------------------------------------------

    fun fire(event: EventKind) {
        if (writing) return
        val h = listeners[event] ?: return
        if (view == 0) return
        @Suppress("UNCHECKED_CAST")
        (h as (NativeEvent) -> Unit)(NativeEvent(InputTarget(backend.controlText(view), backend.controlChecked(view))))
    }

    fun listen(event: EventKind, handler: Any) {
        listeners[event] = handler
        if (event == EventKind.Click) clickable()
    }

    /** A click reaches every view but the controls that take it themselves. */
    fun clickable() {
        if (!(vk == ViewKind.Input || vk == ViewKind.Textarea || vk == ViewKind.Checkbox)) want(InputKind.Click)
    }

    /** A click: the app's handler, then a link's URL. */
    fun click() {
        if (disabled) return
        fire(EventKind.Click)
        href?.let { backend.openUrl(it) }
    }

    fun setState(on: Boolean, get: () -> Boolean, set: (Boolean) -> Unit, uses: (Style) -> Boolean) {
        if (get() == on) return
        set(on)
        if (uses(computed.s) || painted?.let { uses(it.s) } == true) applyStyle()
    }

    /** Styles the view again if it was styled and `uses` says its style depends on what changed. */
    fun restyleIf(uses: (Style) -> Boolean) {
        if (painted != null && uses(computed.s)) applyStyle()
    }

    /** Writes a control without reporting it as user input. */
    fun write(block: () -> Unit) {
        writing = true
        try { block() } finally { writing = false }
    }

    // Measuring --------------------------------------------------------------

    val inFlow: Boolean get() = computed.inFlow

    /** The border-box size this node takes when given at most `maxWidth` px. `exact`: the width is decided
     *  (a flex share, a stretch), and only the height is asked. */
    fun measure(maxWidth: Float, exact: Boolean): FloatArray {
        val m = memo[if (exact) 1 else 0]
        if (m != null && m.width == maxWidth && (m.epoch == Runtime.epoch || vk != ViewKind.Box)) return floatArrayOf(m.w, m.h)
        val size = measureNow(maxWidth, exact)
        memo[if (exact) 1 else 0] = Memo(Runtime.epoch, maxWidth, size[0], size[1])
        return size
    }

    private fun contentSize(maxWidth: Float): FloatArray {
        val c = computed
        if (!Runtime.testMode) { val s = backend.measure(view, maxWidth); return floatArrayOf(s.w, s.h) }
        return when (vk) {
            ViewKind.Text, ViewKind.Button -> testText(maxWidth)
            ViewKind.Input -> floatArrayOf(144f, c.lineHeight)
            ViewKind.Textarea -> floatArrayOf(144f, 3 * c.lineHeight)
            ViewKind.Checkbox -> floatArrayOf(20f, 20f)
            ViewKind.Image -> floatArrayOf(120f, 120f)
            else -> floatArrayOf(100f, 40f)
        }
    }

    /** The fixed test metrics (03-core.md): every target computes the same frames. */
    private fun testText(maxWidth: Float): FloatArray {
        val c = computed
        val cw = c.fontSize * 0.5f
        val perLine = max(1, floor(maxWidth / cw).toInt())
        var lines = 0
        var longest = 0
        for (part in shownText.split('\n')) {
            lines += max(1, ceil(part.length.toFloat() / perLine).toInt())
            longest = max(longest, part.length)
        }
        val limit = c.s.numberOfLines
        if (limit != null && limit > 0) lines = min(lines, limit)
        return floatArrayOf(ceil(min(longest, perLine) * cw), lines * c.lineHeight)
    }

    private fun measureNow(maxWidth: Float, exact: Boolean): FloatArray {
        val s = computed
        var width: Float? = shownWidth ?: s.width ?: s.widthPct?.takeIf { maxWidth < Flex.UNBOUNDED }?.let { maxWidth * it / 100f }
        var height: Float? = shownHeight ?: s.height
        if (exact && width == null) width = maxWidth
        val ratio = s.aspectRatio
        if (ratio != null && ratio > 0f) {
            if (width != null && height == null) height = width / ratio
            else if (width == null && height != null) width = height * ratio
        }
        val minW = s.minWidth
        val maxW = s.maxWidth
        if (width != null) width = clamp(width, minW, maxW)
        val available = width ?: maxW?.let { min(it, maxWidth) } ?: maxWidth
        if (view == 0) return floatArrayOf(0f, 0f)
        val (top, right, bottom, left) = s.insets.toList()
        fun content(max: Float) = contentSize(max(0f, max - left - right))
        val size: FloatArray = when (vk) {
            ViewKind.Box -> Flex.layout(this, available, height, null, width == null)
            ViewKind.Checkbox -> contentSize(Flex.UNBOUNDED)
            ViewKind.Image -> floatArrayOf(min(available, 120f), height ?: width ?: 120f)
            ViewKind.Input -> floatArrayOf(if (Runtime.testMode) min(available, 144f + left + right) else min(available, 180f), content(available)[1] + top + bottom)
            ViewKind.Text, ViewKind.Button, ViewKind.Textarea -> { val c = content(available); floatArrayOf(min(c[0] + left + right, available), c[1] + top + bottom) }
            else -> { val c = if (Runtime.testMode) floatArrayOf(100f, 40f) else backend.measure(view, available).let { floatArrayOf(it.w, it.h) }; floatArrayOf(min(c[0], available), c[1]) }
        }
        size[0] = width ?: clamp(size[0], minW, maxW)
        if (height != null) size[1] = height
        size[1] = clamp(size[1], s.minHeight, s.maxHeight)
        return size
    }

    /** A transition of `width` / `height`: the size layout uses while it runs, in px. */
    var shownWidth: Float? = null
    var shownHeight: Float? = null

    /** Lays this box out in `width` × `height` and gives every view under it its frame. */
    fun place(width: Float, height: Float?) {
        val frames = ArrayList<Pair<LiveNode, FloatArray>>()
        Flex.layout(this, width, height, frames, false)
        for ((child, f) in frames) {
            // Rounded edges, not sizes, so neighbours meet exactly; a box lays its own children out in its rounded size.
            val x = roundHalfUp(f[0])
            val y = roundHalfUp(f[1])
            backend.setFrame(child.view, Rect(x, y, roundHalfUp(f[0] + f[2]) - x, roundHalfUp(f[1] + f[3]) - y))
            if (child.scrolls != null) child.placeScrolled(roundHalfUp(f[2]).toFloat(), roundHalfUp(f[3]).toFloat())
            else if (child.vk == ViewKind.Box) child.place(roundHalfUp(f[2]).toFloat(), roundHalfUp(f[3]).toFloat())
        }
    }

    /** Lays out a scrolling box's content in its `width` × `height` viewport: as long as it needs along its
     *  direction, and at least the viewport (as a screen is). */
    fun placeScrolled(width: Float, height: Float) {
        if (scrolls == true) {
            val natural = Flex.layout(this, Flex.UNBOUNDED * 2, height, null, false)[0]
            val fits = natural <= width
            place(if (fits) width else Flex.UNBOUNDED * 2, height)
            backend.setContentSize(view, roundHalfUp(max(natural, width)), roundHalfUp(height))
        } else {
            val natural = Flex.layout(this, width, null, null, false)[1]
            place(width, if (height > natural) height else null)
            backend.setContentSize(view, roundHalfUp(width), roundHalfUp(max(natural, height)))
        }
    }

    /** Runs a native component's `update` (M7). */
    var nativeUpdate: (() -> Unit)? = null

    fun initAdopted(native: Any) {
        vk = ViewKind.Native
        view = backend.adopt(native)
        Runtime.views[view] = this
    }

    fun initView(kind: ViewKind) {
        vk = kind
        view = backend.create(kind)
        Runtime.views[view] = this
    }
}

internal val EMPTY = Computed(NO_STYLE)

internal fun clamp(value: Float, low: Float?, high: Float?): Float {
    var v = value
    if (high != null) v = min(v, high)
    if (low != null) v = max(v, low)
    return v
}
