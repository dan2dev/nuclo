package app

import nuclo.*

var count = 0

fun App() = div(
    style(Style(padding = 24, gap = 16)),
    p({ "Count: $count" }),
    button("Increment", onClick { count++; update() }),
)

fun main() = runApp { render(::App) }
