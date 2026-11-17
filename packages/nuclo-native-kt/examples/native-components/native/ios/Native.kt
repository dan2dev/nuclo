package app

import kotlinx.cinterop.*
import nuclo.*
import platform.CoreGraphics.*
import platform.Foundation.*
import platform.UIKit.*
import platform.darwin.NSObject

private val keep = ArrayList<Any>()

private class SliderTarget(val change: (Double) -> Unit) : NSObject() {
    @ObjCAction fun fire(sender: NSObject?) { change((sender as UISlider).value.toDouble()) }
}

private fun hex(color: String): UIColor {
    val v = color.removePrefix("#").toLongOrNull(16) ?: 0
    return UIColor.colorWithRed(((v shr 16) and 0xff) / 255.0, ((v shr 8) and 0xff) / 255.0, (v and 0xff) / 255.0, 1.0)
}

private class GaugeView : UIView(CGRectMake(0.0, 0.0, 96.0, 96.0)) {
    var progress = 0.0
    var color = "#4f46e5"
    override fun drawRect(rect: CValue<CGRect>) {
        val w = bounds.useContents { size.width }
        val h = bounds.useContents { size.height }
        val c = CGPointMake(w / 2, h / 2)
        val r = minOf(w, h) / 2 - 6
        val track = UIBezierPath.bezierPathWithArcCenter(c, r, 0.0, 2 * kotlin.math.PI, true)
        track.lineWidth = 10.0
        UIColor.colorWithRed(0.9, 0.91, 0.94, 1.0).setStroke()
        track.stroke()
        val arc = UIBezierPath.bezierPathWithArcCenter(c, r, -kotlin.math.PI / 2, -kotlin.math.PI / 2 + 2 * kotlin.math.PI * progress.coerceIn(0.0, 1.0), true)
        arc.lineWidth = 10.0
        arc.lineCapStyle = CGLineCap.kCGLineCapRound
        hex(color).setStroke()
        arc.stroke()
    }
}

actual fun Slider(value: () -> Double, onChange: (Double) -> Unit, vararg mods: Any?): Node = nativeNode(
    create = {
        val s = UISlider()
        s.minimumValue = 0f
        s.maximumValue = 100f
        val t = SliderTarget(onChange)
        keep.add(t)
        s.addTarget(t, NSSelectorFromString("fire:"), UIControlEventValueChanged)
        s
    },
    update = { val s = it as UISlider; val v = value().toFloat(); if (s.value != v) s.value = v },
    mods = mods,
)

actual fun Gauge(progress: () -> Double, color: () -> String, vararg mods: Any?): Node = nativeNode(
    create = { GaugeView().also { it.backgroundColor = null; it.opaque = false } },
    update = { val g = it as GaugeView; g.progress = progress(); g.color = color(); g.setNeedsDisplay() },
    mods = mods,
)

actual fun platformName(): String = "${UIDevice.currentDevice.systemName} ${UIDevice.currentDevice.systemVersion}"
actual fun vibrate(milliseconds: Int) {}   // ponytail: no haptics here; UIImpactFeedbackGenerator when the POC needs it
actual fun batteryLevel(): Double {
    UIDevice.currentDevice.batteryMonitoringEnabled = true
    val level = UIDevice.currentDevice.batteryLevel.toDouble()
    return if (level < 0) -1.0 else level
}
