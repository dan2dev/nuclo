package app

import nuclo.*

/** The platform's own slider: SeekBar, UISlider, NSSlider, <input type="range">, GtkScale, a trackbar. */
expect fun Slider(value: () -> Double, onChange: (Double) -> Unit, vararg mods: Any?): Node

/** A ring drawn by the platform's 2D API. */
expect fun Gauge(progress: () -> Double, color: () -> String, vararg mods: Any?): Node

/** The platform's name and version, e.g. "Android 16". */
expect fun platformName(): String

/** Vibrates (or does nothing where the platform can't). */
expect fun vibrate(milliseconds: Int)

/** The battery level from 0 to 1, or -1 when the device has none. */
expect fun batteryLevel(): Double

var volume = 40.0
var battery = -2.0
var buzzes = 0
var platformText = ""   // read on demand: the name differs per target, so a script's dump stays the same everywhere

val card = css(Style(padding = 16, gap = 12, backgroundColor = "#ffffff", borderRadius = 16, borderWidth = 1, borderColor = "#e2e8f0"))
val muted = css(Style(color = "#64748b", fontSize = 13))
val action = css(Style(color = "#4f46e5", fontWeight = FontWeight.Bold, paddingTop = 8, paddingBottom = 8, pressed = Style(opacity = 0.5)))

fun readBattery() {
    battery = batteryLevel()
    update()
}

fun App() = div(
    style(Style(padding = 20, gap = 16, backgroundColor = "#f1f5f9")),
    div(
        card,
        h2("Native components"),
        div(
            style(Style(flexDirection = FlexDirection.Row, alignItems = Align.Center, gap = 16)),
            Gauge({ volume / 100 }, { if (volume > 80) "#dc2626" else "#4f46e5" }, style(Style(width = 96, height = 96))),
            div(
                style(Style(flex = 1, gap = 4)),
                span({ "Volume ${volume.toInt()}" }, style(Style(fontSize = 22, fontWeight = FontWeight.Bold))),
                small({ if (volume > 80) "Loud" else "Comfortable" }, muted),
            ),
        ),
        Slider({ volume }, { volume = it; update() }, style(Style(height = 40))),
        small("The gauge and the slider are platform views; the text between them is nuclo's.", muted),
    ),
    div(
        card,
        h2("Native functions"),
        p({ if (platformText.isEmpty()) "Platform not read yet" else "Running on $platformText" }),
        p({ if (battery == -2.0) "Battery not read yet" else if (battery < 0) "No battery on this device" else "Battery at ${(battery * 100).toInt()}%" }),
        div(
            style(Style(flexDirection = FlexDirection.Row, gap = 20)),
            span("Read platform", action, onClick { platformText = platformName(); update() }),
            span("Read battery", action, onClick { readBattery() }),
            span({ "Vibrate ($buzzes)" }, action, onClick { vibrate(40); buzzes++; update() }),
        ),
    ),
)

fun main() = runApp { render(::App) }
