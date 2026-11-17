package app

import gtk.*
import kotlinx.cinterop.*
import nuclo.*
import nuclo.gtk.nativeNode

private class GaugeState(var progress: Double = 0.0, var color: String = "#4f46e5")

private val states = HashMap<Long, GaugeState>()

private fun hex(color: String): Triple<Double, Double, Double> {
    val v = color.removePrefix("#").toLongOrNull(16) ?: 0
    return Triple(((v shr 16) and 0xff) / 255.0, ((v shr 8) and 0xff) / 255.0, (v and 0xff) / 255.0)
}

private fun drawGauge(area: CPointer<GtkDrawingArea>?, cr: CPointer<cairo_t>?, width: Int, height: Int, data: COpaquePointer?) {
    val state = states[area.rawValue.toLong()] ?: return
    val cx = width / 2.0
    val cy = height / 2.0
    val r = minOf(width, height) / 2.0 - 6
    cairo_set_line_width(cr, 10.0)
    cairo_set_source_rgb(cr, 0.9, 0.91, 0.94)
    cairo_arc(cr, cx, cy, r, 0.0, 2 * kotlin.math.PI)
    cairo_stroke(cr)
    val (red, green, blue) = hex(state.color)
    cairo_set_source_rgb(cr, red, green, blue)
    cairo_set_line_cap(cr, cairo_line_cap_t.CAIRO_LINE_CAP_ROUND)
    cairo_arc(cr, cx, cy, r, -kotlin.math.PI / 2, -kotlin.math.PI / 2 + 2 * kotlin.math.PI * state.progress.coerceIn(0.0, 1.0))
    cairo_stroke(cr)
}

private class SliderRef(val change: (Double) -> Unit)

private fun sliderChanged(range: CPointer<GtkRange>?, data: COpaquePointer?) {
    data!!.asStableRef<SliderRef>().get().change(gtk_range_get_value(range))
}

actual fun Slider(value: () -> Double, onChange: (Double) -> Unit, vararg mods: Any?): Node = nativeNode(
    create = {
        val scale = gtk_scale_new_with_range(GtkOrientation.GTK_ORIENTATION_HORIZONTAL, 0.0, 100.0, 1.0)!!
        gtk_scale_set_draw_value(scale.reinterpret(), 0)
        g_signal_connect_data(scale.reinterpret<GObject>(), "value-changed", staticCFunction(::sliderChanged).reinterpret(), StableRef.create(SliderRef(onChange)).asCPointer(), null, 0u)
        scale
    },
    update = { val r = it.reinterpret<GtkRange>(); val v = value(); if (gtk_range_get_value(r) != v) gtk_range_set_value(r, v) },
    mods = mods,
)

actual fun Gauge(progress: () -> Double, color: () -> String, vararg mods: Any?): Node = nativeNode(
    create = {
        val area = gtk_drawing_area_new()!!
        states[area.rawValue.toLong()] = GaugeState()
        gtk_drawing_area_set_draw_func(area.reinterpret(), staticCFunction(::drawGauge), null, null)
        area
    },
    update = { val s = states[it.rawValue.toLong()]!!; s.progress = progress(); s.color = color(); gtk_widget_queue_draw(it) },
    mods = mods,
)

actual fun platformName(): String = "Linux (GTK)"
actual fun vibrate(milliseconds: Int) {}
actual fun batteryLevel(): Double = -1.0
