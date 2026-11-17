package nuclo

// select, progress and meter: written once out of the builders (boxes, text, list, when_), so they need no engine or backend
// work and look the same on every target, the web included.

class Option(val value: String, val label: String = value, val disabled: Boolean = false)

private const val TRACK = "#e5e7eb"

private fun fill(percent: () -> Double, color: () -> String): Node =
    div(style { Style(widthPct = percent(), backgroundColor = color()) })

/** A 160 × 16 track (#e5e7eb, radius 8) with a fill to value / max; a null value is an empty track. */
fun progress(value: () -> Number?, max: Number = 1, vararg mods: Any?): Node =
    el("progress", *mods, fill({ ((value()?.toDouble() ?: 0.0) / max.toDouble() * 100).coerceIn(0.0, 100.0) }, { "#2563eb" }))

/** An 80 × 16 track with a fill between min and max, coloured as HTML's <meter>: green near `optimum`, yellow one range
 *  away, red two away. */
fun meter(value: () -> Number, min: Number = 0, max: Number = 1, low: Number? = null, high: Number? = null,
          optimum: Number? = null, vararg mods: Any?): Node {
    val lo0 = min.toDouble()
    val hi0 = max.toDouble()
    val lo = (low?.toDouble() ?: lo0).coerceIn(lo0, hi0)
    val hi = (high?.toDouble() ?: hi0).coerceIn(lo, hi0)
    val best = (optimum?.toDouble() ?: (lo0 + hi0) / 2).coerceIn(lo0, hi0)
    val green = "#22c55e"; val yellow = "#eab308"; val red = "#ef4444"
    fun color(): String {
        val v = value().toDouble()
        return when {
            best < lo -> if (v < lo) green else if (v > hi) red else yellow
            best > hi -> if (v > hi) green else if (v < lo) red else yellow
            else -> if (v in lo..hi) green else yellow
        }
    }
    return el("meter", *mods, fill({ ((value().toDouble() - lo0) / (hi0 - lo0) * 100).coerceIn(0.0, 100.0) }, ::color))
}

/** A box showing the chosen option's label and a chevron; pressed, it opens the options below it (inline, pushing what
 *  follows down). Picking one closes it and calls onChange. Look: white, 1 px #cbd5e1 border, radius 8. */
fun select(options: () -> List<Option>, value: () -> String, onChange: (String) -> Unit, vararg mods: Any?): Node {
    var open = false
    fun off() = mods.any { it is AttrMod && it.name == "disabled" && (it.value == true || it.fn?.invoke() == true) }
    return div(
        style(Style(backgroundColor = "#ffffff", borderWidth = 1, borderColor = "#cbd5e1", borderRadius = 8, overflow = Overflow.Hidden)),
        *mods,
        div(
            style(Style(row = true, items = Align.Center, padding = 10, pressed = Style(backgroundColor = "#f1f5f9"))),
            onClick { if (!off()) { open = !open; update() } },
            span({ options().firstOrNull { it.value == value() }?.label ?: options().firstOrNull()?.label ?: "" }, style(Style(flex = 1))),
            span("⌄", style(Style(color = "#64748b"))),
        ),
        when_({ open },
            div(
                style(Style(borderTopWidth = 1, borderColor = "#e2e8f0")),
                list(options) { o, _ ->
                    div(
                        style { Style(padding = 10, backgroundColor = if (o.value == value()) "#eef2ff" else "#ffffff", opacity = if (o.disabled) 0.4 else 1.0, pressed = Style(backgroundColor = "#f1f5f9")) },
                        onClick { if (!o.disabled) { open = false; onChange(o.value); update() } },
                        span(o.label),
                    )
                },
            ),
        ),
    )
}
