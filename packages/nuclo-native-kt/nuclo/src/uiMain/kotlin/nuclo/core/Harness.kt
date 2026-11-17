package nuclo.core

import nuclo.host.*

/** `NUCLO_SCRIPT`: commands separated by `;`, each run 100 ms after the previous one finished, so a layout pass
 *  happens in between. This is how every target is driven and checked without a human (03-core.md). */
internal object Harness {
    private val b get() = Runtime.backend
    private var commands = emptyList<String>()
    private var index = 0
    private var waits = 0

    fun start(script: String) {
        commands = script.split(';').map { it.trim() }.filter { it.isNotEmpty() }
        index = 0
        schedule(0)
    }

    private fun schedule(extra: Int) {
        if (index >= commands.size) return
        b.setTimer(100 + extra) {
            // A slow device (a cold emulator) may not have laid out yet: wait for the first layout pass (at most ~10 s).
            if (Runtime.rootWidth == 0 && !Runtime.testNoLayoutWait && waits < 200) { waits++; schedule(-50); return@setTimer }
            val command = commands[index++]
            val wait = run(command)
            if (wait >= 0) schedule(wait)
        }
    }

    private fun fail(command: String, why: String): Int {
        b.log("NUCLO_SCRIPT_ERROR $command: $why")
        b.exit(1)
        return -1
    }

    /** Runs one command; returns the extra milliseconds to wait before the next, or -1 to stop. */
    private fun run(command: String): Int {
        val name = command.substringBefore(':')
        val arg = if (command.contains(':')) command.substringAfter(':') else ""
        when (name) {
            "tap" -> {
                val node = findText(arg) ?: return fail(command, "no view shows \"$arg\"")
                var n: LiveNode? = node
                while (n != null && !(n.view != 0 && n.listeners.containsKey(nuclo.EventKind.Click))) n = n.parent
                if (n == null) return fail(command, "no click handler at or above \"$arg\"")
                Host.event(n.view, ViewEvent.Click)
            }
            "type" -> {
                val placeholder = arg.substringBefore('=')
                val text = arg.substringAfter('=', "")
                val node = findField(placeholder) ?: return fail(command, "no field with placeholder \"$placeholder\"")
                b.setValue(node.view, text)
                Host.event(node.view, ViewEvent.Input)
            }
            "enter" -> {
                val node = findField(arg) ?: return fail(command, "no field with placeholder \"$arg\"")
                Host.event(node.view, ViewEvent.Change)
            }
            "toggle" -> {
                val node = all().firstOrNull { it.vk == ViewKind.Checkbox && it.label == arg } ?: return fail(command, "no checkbox labelled \"$arg\"")
                b.setChecked(node.view, !b.controlChecked(node.view))
                Host.event(node.view, ViewEvent.Change)
            }
            "go" -> (Extras.router ?: return fail(command, "no router")).go(arg)
            "back" -> (Extras.router ?: return fail(command, "no router")).back()
            "wait" -> return arg.toIntOrNull() ?: return fail(command, "not a number")
            "dump" -> dump()
            "exit" -> {
                b.log("NUCLO_EXIT")
                b.exit(0)
                return -1
            }
            else -> return fail(command, "unknown command")
        }
        return 0
    }

    /** The roots in the order dumps and lookups walk them: the shown screen, then each overlay. */
    private fun roots(): List<LiveNode> = Extras.shownRoots()

    private fun all(): List<LiveNode> {
        val out = ArrayList<LiveNode>()
        fun walk(n: LiveNode) { out.add(n); for (c in n.items) walk(c) }
        for (r in roots()) walk(r)
        return out
    }

    private fun findText(text: String) = all().firstOrNull {
        ((it.vk == ViewKind.Text || it.vk == ViewKind.Button) && it.lastText == text) || (it.label == text && it.label.isNotEmpty())
    }

    private fun findField(placeholder: String) = all().firstOrNull { (it.vk == ViewKind.Input || it.vk == ViewKind.Textarea) && it.placeholder == placeholder }

    private var dumps = 0

    private fun dump() {
        dumps++
        // An overlay is as big as the window, so with one the header also tells the window's size: scripts/test.sh
        // runs the headless reference in a window of that size (the screen root alone can be taller than the window).
        val overlay = roots().getOrNull(1)?.let { b.frameOf(it.view) }
        b.log("NUCLO_DUMP_BEGIN $dumps ${Runtime.rootWidth}x${Runtime.rootHeight}" + (overlay?.let { " ${it.w}x${it.h}" } ?: ""))
        fun walk(n: LiveNode, ox: Int, oy: Int, root: Boolean) {
            if (n.computed.hidden) return
            val f = b.frameOf(n.view)
            val x = if (root) 0 else ox + f.x
            val y = if (root) 0 else oy + f.y
            val kind = when (n.vk) {
                ViewKind.Box -> "box"; ViewKind.Text -> "text"; ViewKind.Button -> "button"; ViewKind.Input -> "input"
                ViewKind.Checkbox -> "checkbox"; ViewKind.Textarea -> "textarea"; ViewKind.Image -> "image"; else -> "native"
            }
            val text = when (n.vk) {
                ViewKind.Text, ViewKind.Button -> n.lastText ?: ""
                ViewKind.Input, ViewKind.Textarea -> b.controlText(n.view)
                ViewKind.Checkbox -> b.controlChecked(n.view).toString()
                else -> ""
            }.replace("\n", "\\n")
            b.log("$kind|$x|$y|${f.w}|${f.h}|$text")
            for (c in n.items) walk(c, if (root) 0 else x, if (root) 0 else y, false)
        }
        for (r in roots()) walk(r, 0, 0, true)
        b.log("NUCLO_DUMP_END")
    }
}
