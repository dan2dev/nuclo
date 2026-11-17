package app

import nuclo.*

/** `progress` and `meter`: bars drawn the same on every platform. `value` follows the state through a function; `meter` colours its fill by `low`, `high` and `optimum` as HTML does. */
var done = 30

val card = Style(padding = 16, gap = 8, borderRadius = 12, backgroundColor = "#ffffff", borderWidth = 1, borderColor = "#e2e8f0")
val row = Style(flexDirection = FlexDirection.Row, alignItems = Align.Center, gap = 12)

fun App() = div(
    style(Style(padding = 24, gap = 16, backgroundColor = "#f8fafc")),
    h1("Gauges"),
    div(
        style(card),
        h2("Progress"),
        progress({ 0.5 }),
        progress({ done }, 100, style(Style(widthPct = 100))),
        p({ "$done%" }),
        div(style(row), button("−10", onClick { done = maxOf(0, done - 10); update() }), button("+10", onClick { done = minOf(100, done + 10); update() })),
        small("No value: an empty track"),
        progress({ null }),
    ),
    div(
        style(card),
        h2("Meter · best value is low"),
        div(style(row), meter({ 10 }, 0, 100, 33, 66, 0), small("10")),
        div(style(row), meter({ 50 }, 0, 100, 33, 66, 0), small("50")),
        div(style(row), meter({ 90 }, 0, 100, 33, 66, 0), small("90")),
    ),
    div(
        style(card),
        h2("Meter · best value is in the middle"),
        div(style(row), meter({ 20 }, 0, 100, 33, 66, 50), small("20")),
        div(style(row), meter({ 50 }, 0, 100, 33, 66, 50), small("50")),
    ),
    div(
        style(card),
        h2("Meter · best value is high"),
        div(style(row), meter({ 10 }, 0, 100, 33, 66, 100), small("10")),
        div(style(row), meter({ 50 }, 0, 100, 33, 66, 100), small("50")),
        div(style(row), meter({ done }, 0, 100, 33, 66, 100), small({ "$done, follows the buttons" })),
    ),
)

fun main() = runApp { render(::App) }
