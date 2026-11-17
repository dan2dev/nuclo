package app

import kotlinx.cinterop.*
import nuclo.*
import platform.AppKit.*
import platform.Foundation.*
import platform.darwin.NSObject

private val keep = ArrayList<Any>()

private class SliderTarget(val change: (Double) -> Unit) : NSObject() {
    @ObjCAction fun fire(sender: NSObject?) { change((sender as NSSlider).doubleValue) }
}

private fun hex(color: String): NSColor {
    val v = color.removePrefix("#").toLongOrNull(16) ?: 0
    return NSColor.colorWithSRGBRed(((v shr 16) and 0xff) / 255.0, ((v shr 8) and 0xff) / 255.0, (v and 0xff) / 255.0, 1.0)
}

private class GaugeView : NSView(platform.CoreGraphics.CGRectMake(0.0, 0.0, 96.0, 96.0)) {
    var progress = 0.0
    var color = "#4f46e5"
    override fun isFlipped() = true
    override fun drawRect(dirtyRect: kotlinx.cinterop.CValue<platform.CoreGraphics.CGRect>) {
        val w = bounds.useContents { size.width }
        val h = bounds.useContents { size.height }
        val c = platform.CoreGraphics.CGPointMake(w / 2, h / 2)
        val r = minOf(w, h) / 2 - 6
        val track = NSBezierPath.bezierPath()
        track.appendBezierPathWithArcWithCenter(c, r, 0.0, 360.0)
        track.setLineWidth(10.0)
        NSColor.colorWithSRGBRed(0.9, 0.91, 0.94, 1.0).setStroke()
        track.stroke()
        val arc = NSBezierPath.bezierPath()
        arc.appendBezierPathWithArcWithCenter(c, r, -90.0, -90.0 + 360.0 * progress.coerceIn(0.0, 1.0))
        arc.setLineWidth(10.0)
        arc.setLineCapStyle(NSLineCapStyleRound)
        hex(color).setStroke()
        arc.stroke()
    }
}

actual fun Slider(value: () -> Double, onChange: (Double) -> Unit, vararg mods: Any?): Node = nativeNode(
    create = {
        val s = NSSlider()
        s.minValue = 0.0
        s.maxValue = 100.0
        val t = SliderTarget(onChange)
        keep.add(t)
        s.target = t
        s.action = NSSelectorFromString("fire:")
        s
    },
    update = { (it as NSSlider).doubleValue = value() },
    mods = mods,
)

actual fun Gauge(progress: () -> Double, color: () -> String, vararg mods: Any?): Node = nativeNode(
    create = { GaugeView() },
    update = { val g = it as GaugeView; g.progress = progress(); g.color = color(); g.setNeedsDisplay(true) },
    mods = mods,
)

actual fun platformName(): String = "macOS ${NSProcessInfo.processInfo.operatingSystemVersionString}"
actual fun vibrate(milliseconds: Int) {}
actual fun batteryLevel(): Double = -1.0
