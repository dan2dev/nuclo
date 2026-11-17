package nuclo.core

import nuclo.*
import nuclo.host.*

/** The navigation chrome for a backend that has no native navigation (`navCreate` is not implemented): a 56 px bar
 *  (back arrow and title), the top screen of the active tab, a 64 px tab bar, and a modal screen as a sheet over all of
 *  it. It is drawn with the same primitives every backend implements (boxes, texts, buttons, a scrolling box), so it
 *  looks and behaves the same everywhere. `nuclo-native-ts` draws the same chrome on Android, macOS and the web. */
internal class Chrome(private val router: RouterImpl, private val tabs: List<Tab>) {
    private val b: Backend get() = Runtime.backend
    private val root = box()
    private val bar = box()
    private val title = text()
    private val back = button("←")
    private val tabBar = box()
    private val tabButtons = tabs.map { button(it.title) }
    private val sheet = box()
    private val wrappers = HashMap<RouterImpl.Entry, ViewId>()

    private fun style(s: Style, kind: Kind) = Computed(s).paint(kind, false, true)

    private fun box(): ViewId = b.create(ViewKind.Box).also { b.paint(it, ViewKind.Box, style(Style(), Kind.Box)) }

    private fun text(): ViewId = b.create(ViewKind.Text).also {
        b.paint(it, ViewKind.Text, style(Style(fontSize = 20, fontWeight = FontWeight.Bold, color = "#0f172a", numberOfLines = 1), Kind.Text))
    }

    private fun button(label: String): ViewId = b.create(ViewKind.Button).also {
        b.setText(it, label)
        b.paint(it, ViewKind.Button, style(Style(fontSize = if (label == "←") 24 else 12, color = "#64748b"), Kind.Button))
        b.listen(it, InputKind.Click)
    }

    init {
        b.paint(root, ViewKind.Box, style(Style(backgroundColor = "#ffffff"), Kind.Box))
        b.paint(bar, ViewKind.Box, style(Style(backgroundColor = "#ffffff", borderBottomWidth = 1, borderColor = "#e2e8f0"), Kind.Box))
        b.paint(tabBar, ViewKind.Box, style(Style(backgroundColor = "#f8fafc", borderTopWidth = 1, borderColor = "#e2e8f0"), Kind.Box))
        b.paint(sheet, ViewKind.Box, style(Style(backgroundColor = "#ffffff", shadowColor = "#00000040", shadowRadius = 12), Kind.Box))
        b.setChildren(bar, intArrayOf(back, title))
        b.setChildren(tabBar, tabButtons.toIntArray())
        Runtime.chromeHandlers[back] = { router.back() }
        tabButtons.forEachIndexed { i, v -> Runtime.chromeHandlers[v] = { router.selectTab(i) } }
        Runtime.chromeRoot = root
        b.showScreen(root)
    }

    private fun wrapperOf(e: RouterImpl.Entry): ViewId = wrappers.getOrPut(e) {
        val w = b.create(ViewKind.Box)
        b.makeScrollable(w, false)
        b.paint(w, ViewKind.Box, style(Style(backgroundColor = "#ffffff"), Kind.Box))
        b.setChildren(w, intArrayOf(e.node.view))
        b.listen(w, InputKind.Scroll)
        Runtime.chromeScrollers[w] = e.node.view
        w
    }

    /** A screen left its stack. */
    fun forget(e: RouterImpl.Entry) {
        val w = wrappers.remove(e) ?: return
        Runtime.chromeScrollers.remove(w)
        b.setChildren(w, IntArray(0))
        b.destroy(w)
    }

    private fun shown(): Pair<RouterImpl.Entry?, RouterImpl.Entry?> {
        val s = router.shown()
        val entries = router.stacks.getOrNull(router.active) ?: return null to null
        val top = entries.lastOrNull() ?: return null to null
        val below = if (top.modal && entries.size > 1) entries[entries.size - 2] else null
        return below to top
    }

    /** The views that are on screen: called after every change of the stacks. */
    fun sync() {
        val (below, top) = shown()
        top ?: return
        val modal = top.modal
        val screen = if (modal) below else top
        val children = ArrayList<Int>()
        screen?.let { children.add(wrapperOf(it)) }
        if (!modal && top.header) children.add(bar)
        if (tabs.isNotEmpty()) children.add(tabBar)
        if (modal) { children.add(sheet); b.setChildren(sheet, intArrayOf(wrapperOf(top))) }
        b.setChildren(root, children.toIntArray())
        b.setText(title, if (modal) "" else top.title)
        tabButtons.forEachIndexed { i, v ->
            b.paint(v, ViewKind.Button, style(Style(fontSize = 12, color = if (i == router.active) "#4f46e5" else "#64748b", fontWeight = if (i == router.active) FontWeight.Bold else FontWeight.Normal), Kind.Button))
        }
        b.requestLayout()
    }

    private fun place(e: RouterImpl.Entry, x: Int, y: Int, w: Int, h: Int) {
        val wrapper = wrapperOf(e)
        b.setFrame(wrapper, Rect(x, y, w, h))
        val view = e.node.view
        val natural = Host.measureRoot(view, w.toFloat())
        val ch = maxOf(natural.toInt() + (if (natural > natural.toInt()) 1 else 0), h)
        b.setFrame(view, Rect(0, 0, w, ch))
        b.setContentSize(wrapper, w, ch)
        Host.layoutRoot(view, w.toFloat(), ch.toFloat())
    }

    /** Lays the chrome and the shown screens out in the window `w` × `h`. */
    fun layout(w: Float, h: Float) {
        val (below, top) = shown()
        top ?: return
        val W = w.toInt()
        val H = h.toInt()
        val modal = top.modal
        val barH = if (!modal && top.header) 56 else 0
        val tabsH = if (tabs.isNotEmpty() && !modal) 64 else 0
        val screen = if (modal) below else top
        screen?.let { place(it, 0, barH, W, H - barH - tabsH) }
        b.setFrame(root, Rect(0, 0, W, H))
        b.setFrame(bar, Rect(0, 0, W, barH))
        b.setFrame(back, Rect(0, 0, 56, 56))
        b.setFrame(title, Rect(if (router.canGoBack) 56 else 20, 16, maxOf(0, W - 112), 24))
        // the back arrow only where there is somewhere to go
        b.paint(back, ViewKind.Button, style(Style(fontSize = 24, color = "#0f172a", display = if (router.canGoBack) Display.Flex else Display.None), Kind.Button))
        if (tabs.isNotEmpty()) {
            val tabY = if (modal) H else H - 64
            b.setFrame(tabBar, Rect(0, tabY, W, 64))
            tabButtons.forEachIndexed { i, v ->
                val x0 = W * i / tabs.size
                b.setFrame(v, Rect(x0, 0, W * (i + 1) / tabs.size - x0, 64))
            }
        }
        if (modal) {
            b.setFrame(sheet, Rect(0, 0, W, H))
            place(top, 0, 0, W, H)
            // a screen inside the sheet is placed relative to it: the wrapper was framed against the window above
        }
    }
}
