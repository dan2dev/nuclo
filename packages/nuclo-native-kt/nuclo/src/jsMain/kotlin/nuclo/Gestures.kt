package nuclo

import kotlin.math.sqrt

private const val SLOP = 8.0
private fun num(x: dynamic): Double = (x as Number).toDouble()

private fun pointerOf(el: dynamic, e: dynamic): PointerEvent {
    val r = el.getBoundingClientRect()
    return PointerEvent(num(e.clientX) - num(r.left), num(e.clientY) - num(r.top), num(e.clientX), num(e.clientY), if (e.pointerId != undefined) num(e.pointerId).toInt() else 0)
}

private fun hypot(a: Double, b: Double) = sqrt(a * a + b * b)

/** Pointer, key, scroll-free gesture events (pan, pinch, long press, double click) on nuclo-core's `on(…)` and DOM pointer events. */
internal fun gestureMod(mod: EventMod): dynamic {
    val h = mod.handler
    @Suppress("UNCHECKED_CAST")
    return when (mod.kind) {
        EventKind.PointerDown -> NucloCore.on("pointerdown", { e: dynamic -> (h as (PointerEvent) -> Unit)(pointerOf(e.currentTarget, e)) })
        EventKind.PointerMove -> NucloCore.on("pointermove", { e: dynamic -> (h as (PointerEvent) -> Unit)(pointerOf(e.currentTarget, e)) })
        EventKind.PointerUp -> NucloCore.on("pointerup", { e: dynamic -> (h as (PointerEvent) -> Unit)(pointerOf(e.currentTarget, e)) })
        EventKind.PointerCancel -> NucloCore.on("pointercancel", { e: dynamic -> (h as (PointerEvent) -> Unit)(pointerOf(e.currentTarget, e)) })
        EventKind.DoubleClick -> NucloCore.on("dblclick", { e: dynamic -> (h as (PointerEvent) -> Unit)(pointerOf(e.currentTarget, e)) })
        EventKind.KeyDown -> NucloCore.on("keydown", { e: dynamic -> (h as (KeyboardEvent) -> Unit)(KeyboardEvent(e.key as String)) })
        EventKind.LongPress -> NucloCore.on("mount", { el: dynamic -> longPress(el, h as (PointerEvent) -> Unit); undefined })
        EventKind.Pan -> NucloCore.on("mount", { el: dynamic -> pan(el, h as (PanEvent) -> Unit); undefined })
        EventKind.Pinch -> NucloCore.on("mount", { el: dynamic -> pinch(el, h as (PinchEvent) -> Unit); undefined })
        else -> error("not a gesture")
    }
}

private fun listen(el: dynamic, type: String, handler: (dynamic) -> Unit) { el.addEventListener(type, handler) }

private fun longPress(el: dynamic, call: (PointerEvent) -> Unit) {
    var timer = 0
    var startX = 0.0
    var startY = 0.0
    val cancel = { kotlinx.browser.window.clearTimeout(timer) }
    listen(el, "pointerdown") { e ->
        startX = num(e.clientX); startY = num(e.clientY)
        cancel()
        timer = kotlinx.browser.window.setTimeout({ call(pointerOf(el, e)) }, 500)
    }
    listen(el, "pointermove") { e -> if (hypot(num(e.clientX) - startX, num(e.clientY) - startY) > SLOP) cancel() }
    for (t in listOf("pointerup", "pointercancel", "pointerleave")) listen(el, t) { cancel() }
    listen(el, "contextmenu") { e -> e.preventDefault() }
}

private class Sample(val t: Double, val x: Double, val y: Double)

private fun pan(el: dynamic, call: (PanEvent) -> Unit) {
    el.style.touchAction = "none"
    var id = -1
    var startX = 0.0
    var startY = 0.0
    var active = false
    var samples = ArrayList<Sample>()
    fun emit(state: String, e: dynamic) {
        val now = num(js("performance.now()"))
        samples.add(Sample(now, num(e.clientX), num(e.clientY)))
        samples = ArrayList(samples.filter { now - it.t <= 100 })
        val first = samples[0]
        val dt = (now - first.t) / 1000
        val p = pointerOf(el, e)
        call(PanEvent(state, num(e.clientX) - startX, num(e.clientY) - startY,
            if (dt > 0) (num(e.clientX) - first.x) / dt else 0.0, if (dt > 0) (num(e.clientY) - first.y) / dt else 0.0, p.x, p.y))
    }
    listen(el, "pointerdown") { e ->
        if (id == -1) { id = num(e.pointerId).toInt(); startX = num(e.clientX); startY = num(e.clientY); active = false; samples = ArrayList() }
    }
    listen(el, "pointermove") { e ->
        if (num(e.pointerId).toInt() == id) {
            if (!active) {
                if (hypot(num(e.clientX) - startX, num(e.clientY) - startY) >= SLOP) {
                    active = true
                    el.setPointerCapture(id)
                    // The translation counts from where the drag was recognized, so the view does not jump.
                    startX = num(e.clientX); startY = num(e.clientY)
                    emit("start", e)
                }
            } else emit("move", e)
        }
    }
    for ((type, state) in listOf("pointerup" to "end", "pointercancel" to "cancel")) listen(el, type) { e ->
        if (num(e.pointerId).toInt() == id) { id = -1; if (active) emit(state, e); active = false }
    }
}

private fun pinch(el: dynamic, call: (PinchEvent) -> Unit) {
    el.style.touchAction = "none"
    val points = HashMap<Int, dynamic>()
    var startDistance = 1.0
    var scale = 1.0
    fun measure(): DoubleArray {
        val list = points.values.toList()
        val a = list[0]; val b = list[1]
        val r = el.getBoundingClientRect()
        return doubleArrayOf(hypot(num(a.clientX) - num(b.clientX), num(a.clientY) - num(b.clientY)),
            (num(a.clientX) + num(b.clientX)) / 2 - num(r.left), (num(a.clientY) + num(b.clientY)) / 2 - num(r.top))
    }
    listen(el, "pointerdown") { e ->
        points[num(e.pointerId).toInt()] = e
        if (points.size == 2) {
            el.setPointerCapture(e.pointerId)
            val m = measure()
            startDistance = if (m[0] == 0.0) 1.0 else m[0]
            scale = 1.0
            call(PinchEvent("start", scale, m[1], m[2]))
        }
    }
    listen(el, "pointermove") { e ->
        val id = num(e.pointerId).toInt()
        if (points.containsKey(id)) {
            points[id] = e
            if (points.size == 2) { val m = measure(); scale = m[0] / startDistance; call(PinchEvent("move", scale, m[1], m[2])) }
        }
    }
    for ((type, state) in listOf("pointerup" to "end", "pointercancel" to "cancel")) listen(el, type) { e ->
        val id = num(e.pointerId).toInt()
        if (points.size == 2 && points.containsKey(id)) { val m = measure(); call(PinchEvent(state, scale, m[1], m[2])) }
        points.remove(id)
    }
    // A trackpad pinch (and ctrl + wheel) arrives as wheel events: each one is a whole small gesture.
    var wheelScale = 1.0
    var wheelTimer = 0
    el.addEventListener("wheel", { e: dynamic ->
        if (e.ctrlKey == true) {
            e.preventDefault()
            val p = pointerOf(el, e)
            val starting = wheelTimer == 0
            if (starting) wheelScale = 1.0
            wheelScale *= kotlin.math.exp(-num(e.deltaY) / 100)
            call(PinchEvent(if (starting) "start" else "move", wheelScale, p.x, p.y))
            kotlinx.browser.window.clearTimeout(wheelTimer)
            wheelTimer = kotlinx.browser.window.setTimeout({ wheelTimer = 0; call(PinchEvent("end", wheelScale, p.x, p.y)) }, 150)
        }
    }, js("({ passive: false })"))
}
