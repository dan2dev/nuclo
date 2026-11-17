package app

import kotlinx.browser.document
import kotlinx.browser.window
import nuclo.*
import org.w3c.dom.HTMLElement
import org.w3c.dom.HTMLInputElement

actual fun Slider(value: () -> Double, onChange: (Double) -> Unit, vararg mods: Any?): Node = nativeNode(
    create = {
        val input = document.createElement("input") as HTMLInputElement
        input.type = "range"
        input.min = "0"
        input.max = "100"
        input.style.width = "100%"
        input.addEventListener("input", { onChange(input.value.toDouble()) })
        input
    },
    update = { val i = it as HTMLInputElement; val v = value().toString(); if (i.value != v) i.value = v },
    mods = mods,
)

actual fun Gauge(progress: () -> Double, color: () -> String, vararg mods: Any?): Node = nativeNode(
    create = { (document.createElement("div") as HTMLElement).also { it.style.borderRadius = "50%"; it.style.width = "100%"; it.style.height = "100%" } },
    update = {
        it.style.background = "conic-gradient(${color()} ${(progress() * 360).toInt()}deg, #e5e7eb 0)"
        it.style.asDynamic().webkitMask = "radial-gradient(farthest-side, transparent calc(100% - 10px), #000 0)"
        it.style.asDynamic().mask = "radial-gradient(farthest-side, transparent calc(100% - 10px), #000 0)"
    },
    mods = mods,
)

actual fun platformName(): String = "Web (${window.navigator.platform})"
actual fun vibrate(milliseconds: Int) { window.navigator.asDynamic().vibrate?.invoke(milliseconds) }
actual fun batteryLevel(): Double = -1.0
