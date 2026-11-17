package nuclo

import kotlinx.browser.document
import kotlinx.browser.window
import org.w3c.dom.HTMLElement

/** The router on the URL fragment (`#/albums/3`), so a screen can be opened, reloaded and shared. Stacks per tab live in
 *  memory; the chrome is plain elements: a 56 px bar, the top screen of the active stack, 64 px tabs, a modal in a sheet.
 *  Each screen is its own nuclo-core `render(…)` into its element; a popped screen is switched off with a `when` so
 *  nuclo-core runs its destroy callbacks, then its element is removed. */
internal class WebRouter(private val routes: Map<String, Route>, private val tabs: List<Tab>, private val initial: String) : Router {
    class Entry(val path: String, val el: HTMLElement, val alive: BooleanArray, val title: String, val modal: Boolean, val header: Boolean)

    private val stacks = ArrayList<ArrayList<Entry>>()
    private var active = 0
    private lateinit var root: HTMLElement
    private lateinit var stackEl: HTMLElement
    private lateinit var titleEl: HTMLElement
    private lateinit var backEl: HTMLElement
    private lateinit var barEl: HTMLElement
    private val tabEls = ArrayList<HTMLElement>()
    private var sheet: HTMLElement? = null

    override val outlet: Outlet = Outlet(this)
    override val path: String get() = stacks.getOrNull(active)?.lastOrNull()?.path ?: initial
    override val canGoBack: Boolean get() = (stacks.getOrNull(active)?.size ?: 0) > 1

    private fun make(tag: String, cls: String): HTMLElement = (document.createElement(tag) as HTMLElement).also { it.className = cls }

    private fun tabOf(path: String): Int {
        var best = -1
        for ((i, t) in tabs.withIndex()) {
            val owns = t.path == "/" || path == t.path || path.startsWith(t.path + "/")
            if (owns && (best < 0 || t.path.length > tabs[best].path.length)) best = i
        }
        return best
    }

    private fun entry(path: String): Entry {
        val found = routes.entries.firstNotNullOfOrNull { (pattern, r) -> matchRoute(pattern, path)?.let { r to it } }
        val alive = booleanArrayOf(true)
        val el = make("div", "nuclo-screen")
        val node = if (found != null) found.first.view(found.second) else p("No route matches $path")
        NucloCore.render({ NucloCore.`when`({ alive[0] }, toNuclo(node)) }, el)
        val route = found?.first
        // a route's onEndReached: when the screen is scrolled within half a screen of its end (or is too short to scroll), once per height
        found?.first?.onEndReached?.let { end ->
            var fired = -1.0
            val check = {
                val h = (el.asDynamic().scrollHeight as Number).toDouble()
                val c = (el.asDynamic().clientHeight as Number).toDouble()
                val t = (el.asDynamic().scrollTop as Number).toDouble()
                if (c > 0 && h != fired && h - (t + c) <= c / 2) { fired = h; window.setTimeout({ end(found.second); NucloCore.update() }, 0) }
            }
            el.addEventListener("scroll", { check() })
            window.setInterval({ if (el.isConnected) check() }, 250)
        }
        val title = if (found == null) "Not found" else route!!.titleFor?.invoke(found.second) ?: route.title ?: ""
        return Entry(path, el, alive, title, route?.presentation == Presentation.Modal, route?.header ?: true)
    }

    /** Builds the chrome into `.nuclo-main` (replacing the plain screen) and shows the start screen. */
    fun show() {
        val main = screenElement().parentElement as HTMLElement
        while (main.firstChild != null) main.removeChild(main.firstChild!!)
        root = main
        val start = window.location.hash.let { if (it.length > 1) js("decodeURI")(it.substring(1)).unsafeCast<String>() else initial }
        val tabRoots = if (tabs.isEmpty()) listOf(initial) else tabs.map { it.path }
        active = maxOf(0, tabOf(start))
        Web.router = this
        for ((i, r) in tabRoots.withIndex()) stacks.add(if (i == active && r != start) arrayListOf(entry(r), entry(start)) else arrayListOf(entry(r)))
        barEl = make("div", "nuclo-bar")
        backEl = make("button", "nuclo-back")
        backEl.textContent = "←"
        backEl.setAttribute("aria-label", "Back")
        backEl.onclick = { back(); null }
        titleEl = make("div", "")
        barEl.appendChild(backEl)
        barEl.appendChild(titleEl)
        stackEl = make("div", "nuclo-stack")
        main.appendChild(barEl)
        main.appendChild(stackEl)
        if (tabs.isNotEmpty()) {
            val bottom = make("div", "nuclo-tabs")
            tabs.forEachIndexed { i, t ->
                val item = make("button", "")
                item.textContent = t.title
                item.onclick = { select(i); null }
                tabEls.add(item)
                bottom.appendChild(item)
            }
            main.appendChild(bottom)
        }
        // The browser's back and forward buttons move through the same stack.
        window.addEventListener("popstate", {
            val h = window.location.hash
            val target = if (h.length > 1) js("decodeURI")(h.substring(1)).unsafeCast<String>() else tabs.getOrNull(active)?.path ?: initial
            val stack = stacks[active]
            if (stack.size > 1 && stack[stack.size - 2].path == target) pop() else if (stack.last().path != target) push(target)
        })
        window.history.replaceState(null, "", "#" + js("encodeURI")(path).unsafeCast<String>())
        display()
        NucloCore.update()
    }

    private fun hash(p: String) = "#" + js("encodeURI")(p).unsafeCast<String>()

    override fun go(path: String) { window.history.pushState(null, "", hash(path)); push(path) }
    override fun back() { if (canGoBack) window.history.back() }

    override fun replace(path: String) {
        val stack = stacks[active]
        val gone = stack.removeAt(stack.size - 1)
        stack.add(entry(path))
        discard(gone)
        window.history.replaceState(null, "", hash(path))
        display()
        NucloCore.update()
    }

    override fun reset(path: String) {
        val tab = tabOf(path)
        if (tab >= 0) active = tab
        val stack = stacks[active]
        val keep = if (stack[0].path == path) stack[0] else entry(path)
        for (e in stack) if (e !== keep) discard(e)
        stacks[active] = arrayListOf(keep)
        window.history.replaceState(null, "", hash(path))
        display()
        NucloCore.update()
    }

    private fun push(path: String) { stacks[active].add(entry(path)); display(); NucloCore.update() }

    private fun pop() {
        val stack = stacks[active]
        if (stack.size < 2) return
        val gone = stack.removeAt(stack.size - 1)
        display()
        NucloCore.update()
        discard(gone)
    }

    private fun select(at: Int) {
        if (at == active) return reset(stacks[at][0].path)
        active = at
        window.history.replaceState(null, "", hash(path))
        display()
        NucloCore.update()
    }

    /** Switches the screen off (nuclo-core runs its destroy callbacks on the next update) and takes its element out. */
    private fun discard(e: Entry) {
        e.alive[0] = false
        NucloCore.update()
        e.el.remove()
    }

    /** Puts the active stack's top screen on screen (and the one under it when it is a modal). */
    private fun display() {
        val stack = stacks[active]
        val top = stack.last()
        val below = if (top.modal && stack.size > 1) stack[stack.size - 2] else null
        val screen = if (top.modal) below else top
        while (stackEl.firstChild != null) stackEl.removeChild(stackEl.firstChild!!)
        screen?.let { stackEl.appendChild(it.el) }
        sheet?.remove(); sheet = null
        if (top.modal) {
            val s = make("div", "nuclo-sheet")
            s.appendChild(top.el)
            root.appendChild(s)
            sheet = s
        }
        barEl.style.display = if (!top.modal && top.header) "" else "none"
        backEl.style.display = if (canGoBack) "" else "none"
        titleEl.textContent = top.title
        tabEls.forEachIndexed { i, el -> if (i == active) el.classList.add("active") else el.classList.remove("active") }
        (root.querySelector(".nuclo-tabs") as? HTMLElement)?.style?.display = if (top.modal) "none" else ""
    }
}
