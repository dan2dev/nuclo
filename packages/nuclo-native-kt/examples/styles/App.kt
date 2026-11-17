package app

import nuclo.*

// createCss themes are out of scope: tokens are plain constants.
const val INK = "#0f172a"
const val SOFT = "#64748b"
const val BRAND = "#7c3aed"
const val BRAND_SOFT = "#ede9fe"
const val LINE = "#e2e8f0"
const val CARD = "#ffffff"
const val PAGE = "#f8fafc"
const val OK = "#16a34a"
const val MONO = "ui-monospace, Menlo, monospace"
const val CARD_RADIUS = 16
const val PILL = 999

val pulse = keyframes(
    0 to Style(opacity = 0.35, scale = 0.9),
    50 to Style(opacity = 1, scale = 1),
    100 to Style(opacity = 0.35, scale = 0.9),
)

val card = css(
    Style(
        bg = CARD, rounded = CARD_RADIUS, p = 16, gap = 12,
        shadowColor = "rgba(15, 23, 42, 0.12)", shadowRadius = 12, shadowOffsetX = 0, shadowOffsetY = 4,
        media = listOf(minWidth(600, Style(p = 24))),
    ),
)
val label = css(Style(font = MONO, text = 12, color = SOFT))

val swatch = variants(
    base = Style(size = 40, rounded = 12, center = true, borderWidth = 2, borderColor = "#00000000"),
    variants = mapOf(
        "tone" to mapOf(
            "brand" to Style(bg = BRAND),
            "soft" to Style(bg = BRAND_SOFT),
            "ok" to Style(bg = OK),
        ),
        "picked" to mapOf("true" to Style(borderWidth = 2, borderColor = INK)),
    ),
    defaults = mapOf("tone" to "brand"),
    compounds = listOf(Compound(mapOf("tone" to "soft", "picked" to "true"), Style(borderColor = BRAND))),
)

var picked = "brand"
var typed = ""
var agree = false
var rows = listOf("Alpha", "Beta", "Gamma", "Delta", "Epsilon")

fun App() = div(
    style(Style(p = 16, gap = 16, maxWidth = 720, alignSelf = Align.Center, widthPct = 100, media = listOf(minWidth(900, Style(p = 32))))),
    div(
        card,
        h2("Tokens and shorthands"),
        p("Theme colour, font, shadow and radius tokens; CSS strings for lengths, borders and transforms.", style(Style(leading = 1.4, color = INK))),
        div(
            style(Style(row = true, gap = 12, items = Align.Center, flexWrap = FlexWrap.Wrap)),
            span("brand", label, style(Style(color = BRAND, borderBottomWidth = 2, borderBottomColor = BRAND, pb = 2))),
            span(OK, label),
            div(style(Style(size = 28, rounded = 14, bg = "hsl(262, 83%, 58%)"))),
            div(style(Style(w = 28, h = 28, bg = "rgba(124, 58, 237, 0.35)", rotate = 45, scale = 0.8))),
            div(style(Style(w = 56, aspectRatio = 16.0 / 9.0, bg = "#0ea5e9", rounded = 6, opacity = 0.7))),
        ),
        span("Semibold 600 · medium 500 · light 300", style(Style(weight = FontWeight.Semibold))),
        span("medium", style(Style(weight = FontWeight.Medium))),
        span("light", style(Style(fontWeight = FontWeight.Light))),
        span("capitalize every word", style(Style(textTransform = TextTransform.Capitalize))),
        span("raw declarations", style(Style(letterSpacing = 2, borderLeftWidth = 3, borderLeftColor = "#f59e0b", paddingLeft = 8))),
    ),
    div(
        card,
        h2("States"),
        button(
            "Hover, press me",
            style(
                Style(
                    bg = BRAND, color = "#ffffff", rounded = PILL, px = 18, py = 10,
                    transitionDuration = 150, transitionEasing = Easing.EaseOut,
                    hover = Style(bg = "#6d28d9"),
                    pressed = Style(translateY = 1, scale = 0.98),
                    disabled = Style(opacity = 0.5),
                ),
            ),
        ),
        button("Disabled", disabled(true), style(Style(bg = LINE, color = SOFT, rounded = PILL, px = 18, py = 10, disabled = Style(bg = "#f1f5f9")))),
        input(
            placeholder("Focus me"),
            value { typed },
            style(
                Style(
                    borderWidth = 1, borderColor = LINE, rounded = 10, p = 10,
                    focused = Style(borderColor = BRAND),
                    placeholderColor = "#a78bfa",
                    placeholderShown = Style(bg = "#faf5ff"),
                ),
            ),
            onInput { typed = it.target.value; update() },
        ),
        div(
            style(Style(row = true, gap = 10, items = Align.Center)),
            input(type("checkbox"), checked { agree }, onChange { agree = it.target.checked; update() }),
            span({ if (agree) "Checked" else "Not checked" }, style { Style(color = if (agree) OK else SOFT) }),
        ),
    ),
    div(
        card,
        h2("Lists: first, last, odd, even, empty"),
        div(
            style(Style(rounded = 12, overflow = Overflow.Hidden, borderWidth = 1, borderColor = LINE)),
            list({ rows }) { row, _ ->
                div(
                    style(
                        Style(
                            p = 10, borderTopWidth = 1, borderTopColor = LINE,
                            first = Style(borderTopWidth = 0, bg = BRAND_SOFT),
                            odd = Style(bg = "#fafafa"),
                            last = Style(weight = FontWeight.Bold),
                        ),
                    ),
                    row,
                )
            },
        ),
        div(
            style(Style(row = true, gap = 8)),
            button("Rotate", onClick {
                if (rows.isNotEmpty()) rows = rows.drop(1) + rows.first()
                update()
            }),
            button("Drop first", onClick { rows = rows.drop(1); update() }),
        ),
        div(style(Style(h = 24, bg = "#fee2e2", rounded = 6, empty = Style(bg = "#dcfce7")))),
    ),
    div(
        card,
        h2("Responsive and animated"),
        div(
            style(Style(row = true, gap = 12, items = Align.Center)),
            div(style(Style(size = 18, rounded = PILL, bg = OK, animation = StyleAnimation(pulse, duration = 1200, easing = Easing.EaseInOut, iterations = -1)))),
            span("Pulsing with keyframes()"),
        ),
        div(
            style(Style(p = 12, rounded = 10, bg = "#e0f2fe", media = listOf(maxWidth(599, Style(bg = "#fef3c7"))))),
            span("Blue at 600 px and wider, amber when narrower", css(Style(media = listOf(minWidth(600, Style(weight = FontWeight.Bold)))))),
        ),
        div(
            style(Style(row = true, gap = 8)),
            list({ listOf("brand", "soft", "ok") }) { tone, _ ->
                div(
                    cx(if (picked == tone) swatch("tone" to tone, "picked" to "true") else swatch("tone" to tone)),
                    onClick { picked = tone; update() },
                )
            },
        ),
    ),
)

fun main() = runApp {
    globalStyle("body", Style(bg = PAGE, color = INK))
    globalStyle("h2", Style(text = 13, weight = FontWeight.Semibold, color = SOFT, textTransform = TextTransform.Uppercase, tracking = 0.5))
    render(::App)
}
