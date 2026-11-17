package app

import nuclo.*

/** `select`: a control that shows the chosen option and opens the options below it. The same boxes and text on every platform. */
class City(val id: String, val name: String)

var size = "m"
var fruit = ""
var city = "oslo"
var picked = 0
val cities = listOf(City("oslo", "Oslo"), City("lima", "Lima"), City("kyoto", "Kyoto"))

val card = Style(padding = 16, gap = 10, borderRadius = 12, backgroundColor = "#f8fafc", borderWidth = 1, borderColor = "#e2e8f0")

fun App() = div(
    style(Style(padding = 24, gap = 16, backgroundColor = "#ffffff")),
    h1("Select"),
    div(
        style(card),
        h2("Controlled"),
        select(
            { listOf(Option("s", "Small"), Option("m", "Medium"), Option("l", "Large"), Option("xl", "Extra large (sold out)", disabled = true)) },
            { size }, { size = it; picked++; update() }, ariaLabel("Size"),
        ),
        p({ "size = $size, $picked changes" }),
    ),
    div(
        style(card),
        h2("Groups, and no value of its own"),
        // out of scope: optgroup labels (Citrus, Berries); the options are listed flat
        select(
            { listOf(Option("orange", "Orange"), Option("lemon", "Lemon"), Option("strawberry", "Strawberry"), Option("blueberry", "Blueberry")) },
            { fruit }, { fruit = it; update() },
        ),
        p({ if (fruit == "") "nothing picked yet" else "picked $fruit" }),
    ),
    div(
        style(card),
        h2("Options from a list"),
        select({ cities.map { Option(it.id, it.name) } }, { city }, { city = it; update() }),
        small({ "city = $city" }),
    ),
    div(
        style(card),
        h2("Disabled"),
        select({ listOf(Option("a", "Cannot be opened")) }, { "a" }, {}, disabled(true)),
    ),
)

fun main() = runApp { render(::App) }
