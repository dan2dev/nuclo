package nuclo.host

import kotlin.math.max

/** A complete Backend with no toolkit: the test double, and the reference real backends are compared against.
 *  Time is virtual: nothing sleeps, `run()` jumps the clock from timer to timer. */
class HeadlessBackend(
    private val env: (String) -> String? = { null },
    width: Int = 420,
    height: Int = 780,
) : Backend {
    private class HView(val kind: ViewKind) {
        var children = IntArray(0)
        var frame = Rect(0, 0, 0, 0)
        var paint: Paint? = null
        var text = ""
        var value = ""
        var label = ""
        var checked = false
        var enabled = true
        val listened = HashSet<InputKind>()
    }

    private class Entry(val id: Int, val due: Double, val seq: Int, val action: () -> Unit)

    private val views = HashMap<ViewId, HView>()
    private var nextId = 1
    private var nextSeq = 0
    private val queue = ArrayList<Entry>()
    private var clock = 0.0
    private val epoch = 1_700_000_000_000.0
    private var layoutQueued = false
    private var main: ViewId = 0
    private val overlays = ArrayList<ViewId>()

    var windowW: Int = 0
        private set
    var windowH: Int = 0
        private set
    /** The size the screen root was last laid out with. */
    var rootWidth = 0
        private set
    var rootHeight = 0
        private set
    var exited = false
        private set
    var exitCode = 0
        private set
    val logLines = ArrayList<String>()
    val destroyed = ArrayList<ViewId>()
    var createCount = 0
        private set
    var setTextCount = 0
        private set
    var setValueCount = 0
        private set
    /** nav* calls in order, as "push 0 /path" style lines. */
    val navLog = ArrayList<String>()

    init {
        val size = env("NUCLO_SIZE")?.split('x')
        windowW = size?.getOrNull(0)?.toIntOrNull() ?: width
        windowH = size?.getOrNull(1)?.toIntOrNull() ?: height
    }

    private fun v(view: ViewId) = views[view] ?: error("headless: no view $view")

    override fun create(kind: ViewKind): ViewId { val id = nextId++; views[id] = HView(kind); createCount++; return id }
    override fun destroy(view: ViewId) { views.remove(view); destroyed.add(view) }
    override fun setChildren(parent: ViewId, children: IntArray) { v(parent).children = children.copyOf() }
    override fun setFrame(view: ViewId, frame: Rect) { v(view).frame = frame }
    override fun paint(view: ViewId, kind: ViewKind, paint: Paint) { v(view).paint = paint }
    override fun measure(view: ViewId, maxWidth: Float) = Size(0f, 0f)
    override fun setText(view: ViewId, text: String) { v(view).text = text; setTextCount++ }
    override fun listen(view: ViewId, input: InputKind) { v(view).listened.add(input) }

    override fun showScreen(root: ViewId) { main = root; requestLayout() }
    override fun showOverlay(root: ViewId) { overlays.add(root); requestLayout() }
    override fun requestLayout() {
        if (layoutQueued) return
        layoutQueued = true
        enqueue(16.0) { layoutQueued = false; layout() }
    }
    override fun windowWidth() = windowW.toFloat()

    override fun setTimer(ms: Int, callback: () -> Unit): Int = enqueue(ms.toDouble(), callback)
    override fun clearTimer(timer: Int) { queue.removeAll { it.id == timer } }
    override fun log(line: String) { logLines.add(line); println(line) }
    override fun now(): Double = epoch + clock

    override fun frameOf(view: ViewId) = v(view).frame
    override fun env(name: String): String? = env.invoke(name)
    override fun exit(code: Int) { exited = true; exitCode = code }

    override fun setValue(view: ViewId, text: String) { v(view).value = text; setValueCount++ }
    
    override fun setChecked(view: ViewId, checked: Boolean) { v(view).checked = checked }
    override fun setEnabled(view: ViewId, enabled: Boolean) { v(view).enabled = enabled }
    override fun setLabel(view: ViewId, label: String) { v(view).label = label }
    override fun controlText(view: ViewId) = v(view).value
    override fun controlChecked(view: ViewId) = v(view).checked

    // ---- the virtual clock

    private fun enqueue(ms: Double, action: () -> Unit): Int {
        val id = nextSeq + 1
        queue.add(Entry(id, clock + max(0.0, ms), nextSeq++, action))
        return id
    }

    /** Pops the earliest entry, advances the clock to its due time and runs it, until the queue is empty or `exit` was called. */
    fun run() { while (!exited && step(Double.MAX_VALUE)) {} }

    /** Runs what falls due within the next `ms` virtual milliseconds, then moves the clock there. */
    fun runFor(ms: Double) {
        val until = clock + ms
        while (!exited && step(until)) {}
        if (!exited) clock = max(clock, until)
    }

    private fun step(until: Double): Boolean {
        val next = queue.minWithOrNull(compareBy<Entry>({ it.due }, { it.seq })) ?: return false
        if (next.due > until) return false
        queue.remove(next)
        clock = max(clock, next.due)
        next.action()
        return true
    }

    /** One layout pass, now: measure and place every shown root. */
    fun layout() {
        if (main != 0) {
            val natural = Host.measureRoot(main, windowW.toFloat())
            val h = max(natural, windowH.toFloat())
            v(main).frame = Rect(0, 0, windowW, h.toInt())
            rootWidth = windowW
            rootHeight = h.toInt()
            Host.layoutRoot(main, windowW.toFloat(), h)
        }
        for (s in shownScreens()) {
            if (views[s.root] == null) continue
            val natural = Host.measureRoot(s.root, windowW.toFloat())
            val h = if (s.modal) windowH.toFloat() else max(natural, windowH.toFloat())
            v(s.root).frame = Rect(0, 0, windowW, h.toInt())
            rootWidth = windowW
            rootHeight = h.toInt()
            Host.layoutRoot(s.root, windowW.toFloat(), h)
        }
        for (o in overlays) {
            if (views[o] == null) continue
            v(o).frame = Rect(0, 0, windowW, windowH)
            Host.layoutRoot(o, windowW.toFloat(), windowH.toFloat())
        }
    }

    override fun http(request: HttpRequest, done: (HttpResult) -> Unit) { enqueue(0.0) { done(HttpResult(0, ByteArray(0), "no network in headless")) } }
    /** The images the core handed over, by view (the number of bytes). */
    val images = HashMap<ViewId, Int>()
    override fun setImage(view: ViewId, bytes: ByteArray) { images[view] = bytes.size }

    private val natives = HashMap<ViewId, Any>()
    override fun adopt(native: Any): ViewId { val id = create(ViewKind.Native); natives[id] = native; return id }
    override fun handleOf(view: ViewId): Any = natives[view] ?: view

    // ---- layout extras (recorded for the tests)

    private val contentSizes = HashMap<ViewId, Pair<Int, Int>>()
    private val scrollable = HashMap<ViewId, Boolean>()
    val reorders = ArrayList<List<ViewId>>()
    override fun makeScrollable(view: ViewId, horizontal: Boolean) { scrollable[view] = horizontal }
    override fun setContentSize(view: ViewId, width: Int, height: Int) { contentSizes[view] = width to height }
    override fun reorder(parent: ViewId, children: IntArray) { reorders.add(children.toList()) }
    fun contentSizeOf(view: ViewId): Pair<Int, Int>? = contentSizes[view]
    fun isScrollable(view: ViewId): Boolean? = scrollable[view]

    /** The window changed size: a layout pass follows. */
    fun resize(width: Int, height: Int) { windowW = width; windowH = height; requestLayout() }

    // ---- navigation records (the router reads them in tests)

    private val stacks = ArrayList<ArrayList<Screen>>()
    private var activeTab = 0

    override fun navCreate(tabs: List<TabInfo>, active: Int) { navLog.add("create ${tabs.size} $active"); stacks.clear(); repeat(max(1, tabs.size)) { stacks.add(ArrayList()) }; activeTab = active }
    override fun navPush(tab: Int, screen: Screen, animated: Boolean) { navLog.add("push $tab ${screen.title}"); stacks[tab].add(screen) }
    override fun navPop(tab: Int, animated: Boolean) { navLog.add("pop $tab"); stacks[tab].removeLastOrNull() }
    override fun navReplace(tab: Int, screen: Screen) { navLog.add("replace $tab ${screen.title}"); stacks[tab].clear(); stacks[tab].add(screen) }
    override fun navSelectTab(tab: Int) { navLog.add("select $tab"); activeTab = tab }

    /** The screens the router shows: the top of the active tab, under its modal. No bar or tab bar is drawn: a screen has the whole window. */
    private fun shownScreens(): List<Screen> {
        val stack = stacks.getOrNull(activeTab) ?: return emptyList()
        val top = stack.lastOrNull() ?: return emptyList()
        return if (top.modal && stack.size > 1) listOf(stack[stack.size - 2], top) else listOf(top)
    }

    // ---- test helpers

    fun click(view: ViewId) = Host.event(view, ViewEvent.Click)
    fun input(view: ViewId, text: String) { v(view).value = text; Host.event(view, ViewEvent.Input) }
    fun frame(view: ViewId): Rect = v(view).frame
    fun input2(view: ViewId): String = v(view).value
    fun paintOf(view: ViewId): Paint = v(view).paint ?: error("headless: view $view was never painted")
    fun kindOf(view: ViewId): ViewKind = v(view).kind
    fun textOf(view: ViewId): String = v(view).text
    fun labelOf(view: ViewId): String = v(view).label
    fun enabled(view: ViewId): Boolean = v(view).enabled
    fun listens(view: ViewId, input: InputKind): Boolean = v(view).listened.contains(input)
    fun exists(view: ViewId): Boolean = views.containsKey(view)
    fun childrenOf(view: ViewId): IntArray = v(view).children
    fun roots(): List<ViewId> = (if (main != 0) listOf(main) else emptyList()) + shownScreens().map { it.root } + overlays

    private fun walk(view: ViewId, out: (ViewId) -> Unit) { out(view); for (c in v(view).children) walk(c, out) }

    /** The first view, in tree order over all roots, whose text or label equals `text`. */
    fun find(text: String): ViewId {
        var found = 0
        for (r in roots()) walk(r) { if (found == 0 && views[it] != null && (v(it).text == text || v(it).label == text)) found = it }
        if (found == 0) error("headless: no view shows \"$text\"")
        return found
    }

    /** The text of every Text and Button view, in tree order. */
    fun texts(): List<String> {
        val out = ArrayList<String>()
        for (r in roots()) walk(r) { val h = v(it); if (h.kind == ViewKind.Text || h.kind == ViewKind.Button) out.add(h.text) }
        return out
    }
}

/** `NUCLO_HEADLESS=1`: the app on a HeadlessBackend, run to completion on the virtual clock. Returns the exit code. */
fun runHeadless(env: (String) -> String?, entry: () -> Unit): Int {
    val b = HeadlessBackend(env)
    Host.start(b, entry)
    b.run()
    return b.exitCode
}
