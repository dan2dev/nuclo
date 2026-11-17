package nuclo.core

import nuclo.*
import nuclo.host.*

/** Roots, update(), scopes, the layout pass, media restyle. One per process: the app is one tree. */
internal object Runtime {
    class Root(val node: LiveNode, val overlay: Boolean, var attached: Boolean, var end: Any? = null)

    private var backendOrNull: Backend? = null
    val backend: Backend get() = backendOrNull ?: error("nuclo: no backend: call runApp { … }")
    var testMode = false
    /** The router chrome's root view, when the core draws the chrome, and what its buttons do. */
    var chromeRoot: ViewId = 0
    val chromeHandlers = HashMap<ViewId, () -> Unit>()
    /** A chrome screen's scroller → the screen's root view. */
    val chromeScrollers = HashMap<ViewId, ViewId>()
    /** The size the screen root was last laid out with. */
    var testNoLayoutWait = false
    var rootWidth = 0
    var rootHeight = 0
    val views = HashMap<ViewId, LiveNode>()
    val roots = ArrayList<Root>()
    /** Counts update passes: a node built during one has already run its bindings. */
    var generation = 0
    /** Counts changes that can move a frame: measures are reused within one epoch. */
    var epoch = 0
    var laidOut = -1
    var hasMain = false
    var updating = false
    private var queuedAll = false
    private val queuedIds = ArrayList<String>()
    var mountPending = false
    /** forceUpdate() is running: every binding applies its value, changed or not. */
    var forced = false
    /** The window's width the styles were last matched against, once a style has `@media`. */
    private var mediaWidth: Float? = null
    private var restylePending = false

    fun reset() {
        backendOrNull = null
        testMode = false; rootWidth = 0; rootHeight = 0; chromeRoot = 0; chromeHandlers.clear(); chromeScrollers.clear()
        views.clear(); roots.clear()
        generation = 0; epoch = 0; laidOut = -1
        hasMain = false; updating = false; queuedAll = false; queuedIds.clear(); mountPending = false; forced = false
        mediaWidth = null; restylePending = false
        Globals.styles.clear(); Globals.version++
        Regions.reset()
        Tasks.reset()
        Motion.reset()
        Extras.reset()
    }

    fun start(b: Backend, entry: () -> Unit) {
        reset()
        backendOrNull = b
        testMode = b is HeadlessBackend || b.env("NUCLO_TEST") == "1"
        entry()
        b.env("NUCLO_SCRIPT")?.let { Harness.start(it) }
    }

    /** The window's width, for `@media`. Styling with it means a resize styles again. */
    fun viewportWidth(): Double {
        val w = backend.windowWidth()
        mediaWidth = w
        return w.toDouble()
    }

    /** The window's width changed under styles with `@media`: style every root again, soon (not inside the
     *  backend's layout pass, which is where it is noticed). */
    private fun restyleForWidth() {
        val stale = mediaWidth?.let { it != backend.windowWidth() } == true && !restylePending
        if (!stale) return
        restylePending = true
        backend.setTimer(0) {
            restylePending = false
            for (r in ArrayList(roots)) r.node.applyStylesDeep()
            settle()
        }
    }

    fun invalidateLayout() { epoch++ }

    /** After anything that may have changed the tree: runs pending onMounts and asks for a layout. */
    fun settle() {
        if (mountPending) {
            mountPending = false
            for (r in ArrayList(roots)) if (r.attached) r.node.mountDeep()
        }
        if (laidOut != epoch) {
            laidOut = epoch
            backend.requestLayout()
        }
    }

    fun addRoot(node: LiveNode, overlay: Boolean, attached: Boolean) {
        roots.add(Root(node, overlay, attached))
        node.applyStylesDeep()
    }

    /** A router screen came on screen or left it: onMount runs only for what is on screen. */
    fun setAttached(node: LiveNode, attached: Boolean) {
        mountPending = true
        val r = roots.firstOrNull { it.node === node } ?: return
        r.attached = attached
        if (attached) (r.end as? EndReached)?.check()
    }

    /** The screen whose root is `view` is scrolled `top` px down and shows `visible` px (M8). */
    fun screenScrolled(view: ViewId, top: Float, visible: Float) {
        val end = roots.firstOrNull { it.attached && it.node.view == view }?.end as? EndReached ?: return
        end.top = top; end.visible = visible
        end.check()
    }

    fun removeRoot(node: LiveNode) {
        roots.removeAll { it.node === node }
        node.destroy()
    }

    fun update(ids: Array<out String>) {
        if (updating) {
            if (ids.isEmpty()) queuedAll = true else queuedIds.addAll(ids)
            return
        }
        updating = true
        try {
            run(ids.toList())
            while (queuedAll || queuedIds.isNotEmpty()) {
                val next = if (queuedAll) emptyList() else ArrayList(queuedIds)
                queuedAll = false
                queuedIds.clear()
                run(next)
            }
        } finally {
            updating = false
        }
        settle()
    }

    fun forceUpdate() {
        forced = true
        try { update(emptyArray()) } finally { forced = false }
    }

    private fun run(ids: List<String>) {
        generation++
        val nodes = roots.map { it.node }
        if (ids.isEmpty()) { for (n in nodes) n.refresh(); return }
        val wanted = ids.toSet()
        val found = ArrayList<LiveNode>()
        fun visit(n: LiveNode) { if (n.scopes.any { it in wanted }) found.add(n) else for (c in ArrayList(n.children)) visit(c) }
        for (n in nodes) visit(n)
        for (n in found) n.refresh()
    }

    fun measureRoot(view: ViewId, width: Float): Float =
        views[view]?.let { Flex.layout(it, width, null, null, false)[1] } ?: 0f

    fun layoutRoot(view: ViewId, width: Float, height: Float) {
        if (view == chromeRoot && view != 0) { (Extras.router as? RouterImpl)?.layoutChrome(width, height); return }
        val node = views[view] ?: return
        if (node.scrolls != null) {
            node.placeScrolled(width, height)
        } else {
            val overlay = node.isOverlay()
            if (!overlay) { rootWidth = roundHalfUp(width); rootHeight = roundHalfUp(height) }
            // A screen is as tall as its content, or the window when that is taller (then a column's free space is
            // shared out). An overlay is exactly the window.
            val content = Flex.layout(node, width, null, null, false)[1]
            node.place(width, if (overlay || height > content) height else null)
            Extras.afterLayout(node, content)
        }
        laidOut = epoch
        restyleForWidth()
    }

    fun dispatch(view: ViewId, event: ViewEvent) {
        chromeHandlers[view]?.let { if (event == ViewEvent.Click) { it(); settle() }; return }
        val node = views[view] ?: return
        when (event) {
            ViewEvent.Input -> if (node.vk == ViewKind.Textarea) { node.clearMemo(); invalidateLayout() }
            ViewEvent.Focus -> node.setState(true, { node.focused }, { node.focused = it }) { it.focused != null }
            ViewEvent.Blur -> node.setState(false, { node.focused }, { node.focused = it }) { it.focused != null }
            else -> {}
        }
        // States that follow what the user did to the control.
        val s = node.computed.s
        if ((event == ViewEvent.Input && s.placeholderShown != null) || (event == ViewEvent.Change && s.checked != null)) node.applyStyle()
        when (event) {
            ViewEvent.Click -> node.click()
            ViewEvent.Input -> node.fire(EventKind.Input)
            ViewEvent.Change -> node.fire(EventKind.Change)
            ViewEvent.Focus -> node.fire(EventKind.Focus)
            ViewEvent.Blur -> node.fire(EventKind.Blur)
        }
        settle()
    }

    fun pointer(view: ViewId, phase: PointerPhase, e: PointerEvent) {
        val node = views[view] ?: return
        when (phase) {
            PointerPhase.Down -> node.setState(true, { node.pressed }, { node.pressed = it }) { it.pressed != null }
            PointerPhase.Up, PointerPhase.Cancel -> node.setState(false, { node.pressed }, { node.pressed = it }) { it.pressed != null }
            else -> {}
        }
        val kind = when (phase) {
            PointerPhase.Down -> EventKind.PointerDown; PointerPhase.Move -> EventKind.PointerMove
            PointerPhase.Up -> EventKind.PointerUp; PointerPhase.Cancel -> EventKind.PointerCancel
            PointerPhase.LongPress -> EventKind.LongPress; PointerPhase.DoubleClick -> EventKind.DoubleClick
        }
        @Suppress("UNCHECKED_CAST")
        (node.listeners[kind] as? (PointerEvent) -> Unit)?.invoke(e)
        settle()
    }

    fun hover(view: ViewId, over: Boolean) {
        val node = views[view] ?: return
        node.setState(over, { node.hovered }, { node.hovered = it }) { it.hover != null }
        settle()
    }

    /** Runs the handler a node has for a kind of input, then settles. */
    fun <E> deliver(view: ViewId, kind: EventKind, event: E) {
        val node = views[view] ?: return
        @Suppress("UNCHECKED_CAST")
        (node.listeners[kind] as? (E) -> Unit)?.invoke(event)
        settle()
    }
}
