// The Android side of examples/native-components. It is compiled with the generated App.kt, in
// its package: SliderProps and GaugeProps are the classes the compiler made from the app's interfaces.
package dev.nuclo.app

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.res.ColorStateList
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.os.BatteryManager
import android.os.Build
import android.view.HapticFeedbackConstants
import android.view.View
import android.widget.SeekBar
import dev.nuclo.runtime.NativeComponent
import dev.nuclo.runtime.Runtime

private const val STEPS = 1000

class Slider : NativeComponent<SliderProps> {
    private var props: SliderProps? = null

    override fun create(context: Context): View = SeekBar(context).apply {
        max = STEPS
        setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(bar: SeekBar, progress: Int, fromUser: Boolean) {
                val p = props ?: return
                if (fromUser) p.onChange(p.min + (p.max - p.min) * progress / STEPS)
            }

            override fun onStartTrackingTouch(bar: SeekBar) {
                // A slider inside a scrolling screen: the drag is the slider's.
                bar.parent?.requestDisallowInterceptTouchEvent(true)
            }

            override fun onStopTrackingTouch(bar: SeekBar) {}
        })
    }

    override fun update(view: View, props: SliderProps) {
        this.props = props
        val bar = view as SeekBar
        val progress = ((props.value - props.min) / (props.max - props.min) * STEPS).toInt()
        if (bar.progress != progress) bar.progress = progress
        props.tint?.let {
            val tint = ColorStateList.valueOf(Color.parseColor(it))
            bar.progressTintList = tint
            bar.thumbTintList = tint
        }
    }
}

class Gauge : NativeComponent<GaugeProps> {
    private class Ring(context: Context) : View(context) {
        var props: GaugeProps? = null
        private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeCap = Paint.Cap.ROUND
        }

        override fun onDraw(canvas: Canvas) {
            val p = props ?: return
            val stroke = (p.thickness * resources.displayMetrics.density).toFloat()
            paint.strokeWidth = stroke
            val inset = stroke / 2
            paint.color = Color.parseColor("#e2e8f0")
            canvas.drawArc(inset, inset, width - inset, height - inset, 0f, 360f, false, paint)
            paint.color = Color.parseColor(p.color)
            canvas.drawArc(inset, inset, width - inset, height - inset, -90f, (360 * p.progress.coerceIn(0.0, 1.0)).toFloat(), false, paint)
        }
    }

    override fun create(context: Context): View = Ring(context)

    override fun update(view: View, props: GaugeProps) {
        (view as Ring).props = props
        view.invalidate()
    }
}

fun platformName(): String = "Android ${Build.VERSION.RELEASE}"

fun vibrate(milliseconds: Int) {
    // Haptic feedback needs no permission; `milliseconds` is the web's and iOS's unit.
    Runtime.activity.window.decorView.performHapticFeedback(if (milliseconds > 30) HapticFeedbackConstants.LONG_PRESS else HapticFeedbackConstants.KEYBOARD_TAP)
}

suspend fun batteryLevel(): Double {
    val status = Runtime.activity.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED)) ?: return -1.0
    val level = status.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
    val scale = status.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
    return if (level < 0 || scale <= 0) -1.0 else level.toDouble() / scale
}
