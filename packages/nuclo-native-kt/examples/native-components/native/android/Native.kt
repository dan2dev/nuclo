package app

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.os.BatteryManager
import android.os.Build
import android.view.View
import android.widget.SeekBar
import nuclo.*

private class GaugeView(context: Context) : View(context) {
    var progress = 0.0
    var color = "#4f46e5"
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE; strokeCap = Paint.Cap.ROUND }
    override fun onDraw(canvas: Canvas) {
        val stroke = 10 * resources.displayMetrics.density
        paint.strokeWidth = stroke
        val box = RectF(stroke / 2, stroke / 2, width - stroke / 2, height - stroke / 2)
        paint.color = Color.parseColor("#e5e7eb")
        canvas.drawArc(box, 0f, 360f, false, paint)
        paint.color = Color.parseColor(color)
        canvas.drawArc(box, -90f, (360 * progress.coerceIn(0.0, 1.0)).toFloat(), false, paint)
    }
}

actual fun Slider(value: () -> Double, onChange: (Double) -> Unit, vararg mods: Any?): Node = nativeNode(
    create = { context ->
        SeekBar(context).apply {
            max = 100
            setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(bar: SeekBar, progress: Int, fromUser: Boolean) { if (fromUser) onChange(progress.toDouble()) }
                override fun onStartTrackingTouch(bar: SeekBar) {}
                override fun onStopTrackingTouch(bar: SeekBar) {}
            })
        }
    },
    update = { val bar = it as SeekBar; val v = value().toInt(); if (bar.progress != v) bar.progress = v },
    mods = mods,
)

actual fun Gauge(progress: () -> Double, color: () -> String, vararg mods: Any?): Node = nativeNode(
    create = { GaugeView(it) },
    update = { val g = it as GaugeView; g.progress = progress(); g.color = color(); g.invalidate() },
    mods = mods,
)

actual fun platformName(): String = "Android ${Build.VERSION.RELEASE}"

actual fun vibrate(milliseconds: Int) {
    runCatching {
        val vibrator = NucloActivity.current.getSystemService(android.os.Vibrator::class.java)
        vibrator?.vibrate(android.os.VibrationEffect.createOneShot(milliseconds.toLong(), android.os.VibrationEffect.DEFAULT_AMPLITUDE))
    }
}

actual fun batteryLevel(): Double {
    val manager = NucloActivity.current.getSystemService(BatteryManager::class.java) ?: return -1.0
    val percent = manager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
    return if (percent in 0..100) percent / 100.0 else -1.0
}
