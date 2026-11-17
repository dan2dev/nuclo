package nuclo.core

import nuclo.*
import nuclo.host.Backend
import nuclo.host.Screen
import nuclo.host.TabInfo
import nuclo.host.ViewId

/** The router's state: a navigation stack per tab, route patterns, params and titles. The backend mirrors it in the
 *  platform's own navigation (`Backend.nav*`) and reports what the user does there (`Host.navPopped`, `Host.navTabSelected`). */
internal class RouterImpl(private val routes: Map<String, Route>, private val tabs: List<Tab>, private val initial: String) : Router {
    class Entry(val path: String, val node: LiveNode, val title: String, val modal: Boolean, val header: Boolean) {
        fun screen() = Screen(node.view, title, modal, header)
    }

    /** Whether the backend has native navigation (`navCreate` is implemented); otherwise the core draws the chrome. */
    private var native = true
    private var chrome: Chrome? = null
    private inline fun nav(f: Backend.() -> Unit) { if (native) Runtime.backend.f() }
    private fun changed() { chrome?.sync() }

    val stacks = ArrayList<ArrayList<Entry>>()
    var active = 0
        private set

    override val outlet: Outlet = Outlet(this)
    override val path: String get() = stacks.getOrNull(active)?.lastOrNull()?.path ?: initial
    override val canGoBack: Boolean get() = (stacks.getOrNull(active)?.size ?: 0) > 1

    /** Pushes a screen onto the current tab's stack. */
    override fun go(path: String) {
        attachTop(false)
        push(active, path, true)
        attachTop(true)
        changed()
        Runtime.update(emptyArray())
    }

    override fun back() {
        if (canGoBack) {
            // The stack first: the backend reports the pop back, and must find it done.
            dropTop(active)
            nav { navPop(active, true) }
        }
    }

    /** Selects the tab that owns `path` and makes it the only screen there. */
    override fun reset(path: String) {
        attachTop(false)
        tabOf(path)?.let { active = it; nav { navSelectTab(it) } }
        replaceStack(path)
    }

    /** Replaces the current screen, without a transition. */
    override fun replace(path: String) {
        val tab = active
        attachTop(false)
        if (!canGoBack) return replaceStack(path)
        val gone = stacks[tab].removeAt(stacks[tab].size - 1)
        nav { navPop(tab, false) }
        chrome?.forget(gone)
        Runtime.removeRoot(gone.node)
        push(tab, path, false)
        attachTop(true)
        changed()
        Runtime.update(emptyArray())
    }

    private fun replaceStack(path: String) {
        val tab = active
        val old = ArrayList(stacks[tab])
        stacks[tab].clear()
        val keep = if (old[0].path == path) old.removeAt(0) else entry(path)
        nav { navReplace(tab, keep.screen()) }
        stacks[tab].add(keep)
        for (e in old) { chrome?.forget(e); Runtime.removeRoot(e.node) }
        attachTop(true)
        changed()
        Runtime.update(emptyArray())
    }

    private fun push(tab: Int, path: String, animated: Boolean) {
        val e = entry(path)
        nav { navPush(tab, e.screen(), animated) }
        stacks[tab].add(e)
    }

    /** The top screen of `tab` left its stack: the one under it shows, and it is destroyed once it has slid out. */
    fun dropTop(tab: Int) {
        val gone = stacks[tab].removeAt(stacks[tab].size - 1)
        Runtime.setAttached(gone.node, false)
        Runtime.backend.setTimer(POP_MS) { chrome?.forget(gone); Runtime.removeRoot(gone.node); Runtime.settle() }
        attachTop(true)
        changed()
        Runtime.update(emptyArray())
    }

    /** Only the top screen of the active tab is on screen (its onMount may run). */
    private fun attachTop(attached: Boolean) { stacks[active].lastOrNull()?.let { Runtime.setAttached(it.node, attached) } }

    private fun entry(path: String): Entry {
        val found = routes.entries.firstNotNullOfOrNull { (pattern, route) -> matchRoute(pattern, path)?.let { route to it } }
        val node: LiveNode
        val title: String
        var modal = false
        var header = true
        if (found != null) {
            val (route, params) = found
            node = mount(route.view(params))
            title = route.titleFor?.invoke(params) ?: route.title ?: ""
            modal = route.presentation == Presentation.Modal
            header = route.header
        } else {
            node = mount(p("No route matches $path"))
            title = "Not found"
        }
        Runtime.addRoot(node, false, false)
        found?.let { (route, params) -> route.onEndReached?.let { end -> Extras.onEndReached(node) { end(params) } } }
        return Entry(path, node, title, modal, header)
    }

    /** The tab whose path owns `path`: the longest prefix wins. */
    private fun tabOf(path: String): Int? {
        var best: Int? = null
        for ((i, tab) in tabs.withIndex()) {
            val owns = tab.path == "/" || path == tab.path || path.startsWith(tab.path + "/")
            if (owns && (best == null || tab.path.length > tabs[best].path.length)) best = i
        }
        return best
    }

    /** render(router.outlet): builds each tab's root screen and shows the navigation. */
    fun show() {
        Runtime.hasMain = true
        val roots = if (tabs.isEmpty()) listOf(initial) else tabs.map { it.path }
        active = tabOf(initial) ?: 0
        native = try { Runtime.backend.navCreate(tabs.map { TabInfo(it.title, it.icon) }, active); true } catch (e: IllegalStateException) { false }
        if (!native) chrome = Chrome(this, tabs)
        stacks.clear()
        roots.forEach { _ -> stacks.add(ArrayList()) }
        for ((tab, root) in roots.withIndex()) {
            push(tab, root, false)
            if (tab == active && root != initial) push(tab, initial, false)
        }
        attachTop(true)
        changed()
        Extras.router = this
        Runtime.settle()
    }

    /** The user popped `root` with the platform's controls. Ignored when the router popped it itself. */
    fun popped(tab: Int, root: ViewId) {
        val stack = stacks.getOrNull(tab) ?: return
        if (stack.size > 1 && stack.last().node.view == root) dropTop(tab)
    }

    /** The user tapped a tab (the chrome's, or a native tab bar reported it). */
    fun selectTab(tab: Int) {
        if (tab != active && tab < stacks.size) { nav { navSelectTab(tab) }; tabSelected(tab) }
    }

    fun tabSelected(tab: Int) {
        if (tab != active && tab < stacks.size) {
            attachTop(false)
            active = tab
            attachTop(true)
            changed()
            Runtime.update(emptyArray())
        }
    }

    /** What a dump walks: the shown screen of the active tab, under the modal over it when the top screen is one. */
    fun shown(): List<LiveNode> {
        val stack = stacks.getOrNull(active) ?: return emptyList()
        val top = stack.lastOrNull() ?: return emptyList()
        return if (top.modal && stack.size > 1) listOf(stack[stack.size - 2].node, top.node) else listOf(top.node)
    }

    fun layoutChrome(w: Float, h: Float) { chrome?.layout(w, h) }

    companion object { const val POP_MS = 400 }
}

internal fun createRouterImpl(routes: Map<String, Route>, tabs: List<Tab>, initial: String): Router = RouterImpl(routes, tabs, initial)
