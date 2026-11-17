package nuclo

import kotlinx.browser.document
import kotlinx.browser.window
import org.w3c.dom.HTMLElement
import org.w3c.dom.HTMLInputElement
import org.w3c.dom.HTMLTextAreaElement
import org.w3c.dom.Element
import org.w3c.dom.events.Event
import org.w3c.dom.EventInit
import org.w3c.dom.get
import kotlin.math.floor

/** `?script=<urlencoded>`: the same script language as the native harness (03-core.md), on the DOM. */
internal object HarnessWeb {
    private var dumps = 0
    private var dumpElement: HTMLElement? = null

    fun startIfRequested() {
        val query = window.location.search
        val script = query.removePrefix("?").split('&').firstOrNull { it.startsWith("script=") }?.removePrefix("script=") ?: return
        val commands = js("decodeURIComponent")(script.replace("+", "%20")).unsafeCast<String>().split(';').map { it.trim() }.filter { it.isNotEmpty() }
        step(commands, 0)
    }

    private fun out(line: String) {
        val pre = dumpElement ?: (document.createElement("pre") as HTMLElement).also {
            it.id = "nuclo-dump"
            it.style.display = "none"
            document.body!!.appendChild(it)
            dumpElement = it
        }
        pre.appendChild(document.createTextNode(line + "\n"))
    }

    private fun step(commands: List<String>, i: Int) {
        if (i >= commands.size) return
        window.setTimeout({
            val wait = run(commands[i])
            if (wait >= 0) step(commands, i + 1).also { if (wait > 0) Unit }
        }, 100 + (if (i > 0) lastWait else 0))
    }

    private var lastWait = 0

    private fun fail(command: String, why: String): Int {
        out("NUCLO_SCRIPT_ERROR $command: $why")
        return -1
    }

    private fun all(): List<Element> {
        val out = ArrayList<Element>()
        fun walk(e: Element) { out.add(e); for (i in 0 until e.children.length) { val c = e.children[i]!!; if (c.classList.contains("n")) walk(c) } }
        for (root in roots()) walk(root)
        return out
    }

    private fun roots(): List<Element> {
        val out = ArrayList<Element>()
        // the app's screens (with a router: the shown one, then the modal sheet), then each layer over them
        val screens = document.querySelectorAll(".nuclo-main > .nuclo-screen, .nuclo-stack > .nuclo-screen, .nuclo-sheet > .nuclo-screen")
        for (i in 0 until screens.length) { val sc = screens.item(i) as Element; for (j in 0 until sc.children.length) sc.children[j]?.let { if (it.classList.contains("n")) out.add(it) } }
        val layers = document.getElementsByClassName("nuclo-layer")
        for (i in 0 until layers.length) { val l = layers[i]!!; for (j in 0 until l.children.length) l.children[j]?.let { if (it.classList.contains("n")) out.add(it) } }
        return out
    }

    private fun textOfElement(e: Element) = e.textContent ?: ""

    private fun rnd(d: Double) = floor(d + 0.5).toInt()

    private fun kindOf(e: Element) = listOf("box", "text", "button", "input", "checkbox", "textarea", "image", "native").firstOrNull { e.classList.contains(it) } ?: "box"

    private fun fire(e: Element, type: String) = e.dispatchEvent(Event(type, EventInit(bubbles = true)))

    private fun run(command: String): Int {
        val name = command.substringBefore(':')
        val arg = if (command.contains(':')) command.substringAfter(':') else ""
        lastWait = 0
        when (name) {
            "tap" -> {
                val e = all().firstOrNull { (kindOf(it) == "text" || kindOf(it) == "button") && textOfElement(it) == arg || it.getAttribute("aria-label") == arg }
                    ?: return fail(command, "no element shows \"$arg\"")
                (e as HTMLElement).click()
            }
            "type" -> {
                val placeholder = arg.substringBefore('=')
                val e = all().firstOrNull { it.getAttribute("placeholder") == placeholder } ?: return fail(command, "no field with placeholder \"$placeholder\"")
                if (e is HTMLInputElement) e.value = arg.substringAfter('=', "") else (e as HTMLTextAreaElement).value = arg.substringAfter('=', "")
                fire(e, "input")
            }
            "enter" -> fire(all().firstOrNull { it.getAttribute("placeholder") == arg } ?: return fail(command, "no field with placeholder \"$arg\""), "change")
            "toggle" -> (all().firstOrNull { kindOf(it) == "checkbox" && it.getAttribute("aria-label") == arg } as? HTMLElement ?: return fail(command, "no checkbox labelled \"$arg\"")).click()
            "go" -> (Web.router ?: return fail(command, "no router")).go(arg)
            "back" -> (Web.router ?: return fail(command, "no router")).back()
            "wait" -> lastWait = arg.toIntOrNull() ?: return fail(command, "not a number")
            "dump" -> dump()
            "exit" -> { out("NUCLO_EXIT"); return -1 }
            else -> return fail(command, "unknown command")
        }
        return 0
    }

    private fun dump() {
        dumps++
        val roots = shownRoots()
        val first = roots.firstOrNull()?.getBoundingClientRect()
        val layer = roots.getOrNull(1)?.getBoundingClientRect()
        out("NUCLO_DUMP_BEGIN $dumps ${first?.width?.let { rnd(it) } ?: 0}x${first?.height?.let { rnd(it) } ?: 0}" + (layer?.let { " ${rnd(it.width)}x${rnd(it.height)}" } ?: ""))
        for (root in roots) {
            val r0 = root.getBoundingClientRect()
            fun walk(e: Element) {
                val r = e.getBoundingClientRect()
                val cs = window.getComputedStyle(e)
                if (cs.display == "none") return
                val kind = kindOf(e)
                val text = when (kind) {
                    "text", "button" -> textOfElement(e)
                    "input" -> (e as HTMLInputElement).value
                    "textarea" -> (e as HTMLTextAreaElement).value
                    "checkbox" -> (e as HTMLInputElement).checked.toString()
                    else -> ""
                }.replace("\n", "\\n")
                out("$kind|${rnd(r.left - r0.left)}|${rnd(r.top - r0.top)}|${rnd(r.width)}|${rnd(r.height)}|$text")
                for (i in 0 until e.children.length) { val c = e.children[i]!!; if (c.classList.contains("n")) walk(c) }
            }
            walk(root)
        }
        out("NUCLO_DUMP_END")
    }

    /** The roots a dump walks: the app (with a router, the shown screens), then each layer. */
    private fun shownRoots(): List<Element> = roots()
}

/** Shared web state the harness reads (the router, M4). */
internal object Web {
    var router: Router? = null
}
