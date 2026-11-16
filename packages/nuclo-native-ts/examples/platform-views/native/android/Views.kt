// The Android side of examples/platform-views, compiled with the generated App.kt (WebViewProps and DatePickerProps
// are the compiler's classes for the app's interfaces).
package dev.nuclo.app

import android.app.DatePickerDialog
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.view.Gravity
import android.view.View
import android.webkit.WebView as AndroidWebView
import android.webkit.WebViewClient
import android.widget.TextView
import dev.nuclo.runtime.NativeComponent
import dev.nuclo.runtime.Runtime
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.time.temporal.ChronoUnit

class WebView : NativeComponent<WebViewProps> {
    private var props: WebViewProps? = null
    private var url = ""

    override fun create(context: Context): View = AndroidWebView(context).apply {
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: AndroidWebView, url: String) {
                props?.onLoad(view.title ?: "")
            }
        }
        // A page scrolls inside the app's scrolling screen: the drag is the page's.
        setOnTouchListener { v, _ ->
            v.parent?.requestDisallowInterceptTouchEvent(true)
            false
        }
    }

    override fun update(view: View, props: WebViewProps) {
        this.props = props
        if (props.url == url) return
        url = props.url
        (view as AndroidWebView).loadUrl(url)
    }

    override fun destroy(view: View) = (view as AndroidWebView).destroy()
}

/** Android has no inline date picker the size of a field: this is a field that opens the platform's date dialog. */
class DatePicker : NativeComponent<DatePickerProps> {
    private var props: DatePickerProps? = null

    override fun create(context: Context): View = TextView(context).apply {
        gravity = Gravity.CENTER
        textSize = 15f
        setTextColor(Color.parseColor("#0f172a"))
        val pad = (12 * resources.displayMetrics.density).toInt()
        setPadding(pad, 0, pad, 0)
        background = android.graphics.drawable.GradientDrawable().apply {
            cornerRadius = 8 * resources.displayMetrics.density
            setColor(Color.parseColor("#f1f5f9"))
        }
        setOnClickListener {
            val day = props?.value?.let { runCatching { LocalDate.parse(it) }.getOrNull() } ?: LocalDate.now()
            DatePickerDialog(context, { _, year, month, dayOfMonth ->
                props?.onChange(LocalDate.of(year, month + 1, dayOfMonth).toString())
            }, day.year, day.monthValue - 1, day.dayOfMonth).show()
        }
    }

    override fun update(view: View, props: DatePickerProps) {
        this.props = props
        val day = runCatching { LocalDate.parse(props.value) }.getOrNull()
        (view as TextView).text = day?.format(DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM)) ?: props.value
    }
}

fun daysUntil(date: String): Int =
    runCatching { ChronoUnit.DAYS.between(LocalDate.now(), LocalDate.parse(date)).toInt() }.getOrDefault(0)

/** Android doesn't say whether the person picked a target, only that the chooser was shown. */
suspend fun share(text: String): String {
    val send = Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text)
    Runtime.activity.startActivity(Intent.createChooser(send, null))
    return "Share sheet shown"
}
