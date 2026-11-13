package dev.nuclo.host

import android.app.Activity
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.text.Editable
import android.text.InputType
import android.text.TextWatcher
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import org.json.JSONArray
import org.json.JSONObject

/** nuclo-native host for Android: platform Views driven by QuickJS (src/main/cpp). */
class MainActivity : Activity() {
    private val views = HashMap<Int, View>()
    private val flex = HashMap<View, Float>()
    private val alignItems = HashMap<View, Int>()
    private val widths = HashMap<View, Int>()
    private val heights = HashMap<View, Int>()
    private val backgrounds = HashMap<View, GradientDrawable>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        views[1] = root
        setContentView(ScrollView(this).apply { isFillViewport = true; addView(root) })

        evaluate(assets.open("app.js").use { it.readBytes() })
    }

    override fun onDestroy() {
        close()
        super.onDestroy()
    }

    private external fun evaluate(code: ByteArray)
    private external fun close()

    /** Called by __nuclo_host(json) from JS. */
    @Suppress("unused")
    private fun receive(json: ByteArray) {
        val ops = JSONArray(String(json))
        for (i in 0 until ops.length()) apply(ops.getJSONArray(i))
    }

    private fun emit(id: Int, type: String, value: Any? = null) {
        val arg = when (value) {
            null -> ""
            is String -> "," + JSONObject.quote(value)
            else -> ",$value"
        }
        evaluate("__nuclo_event($id,'$type'$arg)".toByteArray())
    }

    companion object {
        init {
            System.loadLibrary("nuclo")
        }
    }

    private fun dp(value: String) =
        (value.removeSuffix("px").toFloat() * resources.displayMetrics.density).toInt()

    private fun apply(op: JSONArray) {
        val id = op.getInt(1)
        when (op.getString(0)) {
            "create" -> views[id] = when (op.getString(2)) {
                "text" -> TextView(this)
                "button" -> Button(this).apply { isAllCaps = false }
                "input" -> EditText(this).apply { setSingleLine() }
                "checkbox" -> CheckBox(this)
                "image" -> ImageView(this).apply { scaleType = ImageView.ScaleType.CENTER_CROP }
                else -> LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
            }.also { it.id = id }

            "insert" -> {
                val parent = views.getValue(id) as LinearLayout
                val child = views.getValue(op.getInt(2))
                (child.parent as? ViewGroup)?.removeView(child)
                val before = op.getInt(3)
                parent.addView(child, if (before == 0) parent.childCount else parent.indexOfChild(views[before]))
                place(parent, child)
            }

            "remove" -> views.getValue(id).let {
                (it.parent as? ViewGroup)?.removeView(it)
                forget(it)
            }

            "set" -> set(views.getValue(id), op.getString(2), op.opt(3).takeUnless { it == JSONObject.NULL })
            "style" -> style(views.getValue(id), op.getString(2), op.getString(3))
            "listen" -> listen(views.getValue(id), id, op.getString(2))
        }
    }

    private fun forget(view: View) {
        if (view is LinearLayout) for (i in 0 until view.childCount) forget(view.getChildAt(i))
        views.remove(view.id)
        for (map in listOf(flex, alignItems, widths, heights, backgrounds)) map.remove(view)
    }

    // A child's flex and its parent's alignItems depend on the parent's direction.
    private fun place(parent: LinearLayout, child: View) {
        val row = parent.orientation == LinearLayout.HORIZONTAL
        val grow = flex[child] ?: 0f
        val stretch = if (row || parent in alignItems) WRAP_CONTENT else MATCH_PARENT
        val width = widths[child] ?: if (row) (if (grow > 0) 0 else WRAP_CONTENT) else stretch
        val height = heights[child] ?: if (row) WRAP_CONTENT else if (grow > 0) 0 else WRAP_CONTENT
        child.layoutParams = LinearLayout.LayoutParams(width, height, grow)
    }

    private fun relayout(box: LinearLayout) {
        val align = alignItems[box] ?: Gravity.START
        box.gravity = if (box.orientation == LinearLayout.HORIZONTAL) {
            when (align) { Gravity.CENTER -> Gravity.CENTER_VERTICAL; Gravity.END -> Gravity.BOTTOM; else -> Gravity.TOP }
        } else {
            when (align) { Gravity.CENTER -> Gravity.CENTER_HORIZONTAL; else -> align }
        }
        for (i in 0 until box.childCount) place(box, box.getChildAt(i))
    }

    private fun set(view: View, key: String, value: Any?) {
        when {
            key == "text" && view !is EditText -> (view as? TextView)?.text = value as String
            key == "value" -> (view as EditText).let {
                val text = value?.toString() ?: ""
                if (it.text.toString() != text) it.setText(text)
            }
            key == "placeholder" -> (view as EditText).hint = value as String?
            key == "checked" -> (view as CheckBox).isChecked = value == true
            key == "type" && value == "password" ->
                (view as EditText).inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            // Asset paths are relative to the bundle.
            key == "src" -> assets.open(value as String).use {
                (view as ImageView).setImageBitmap(BitmapFactory.decodeStream(it))
            }
            key == "disabled" -> view.isEnabled = value != true
        }
    }

    private fun style(view: View, key: String, value: String) {
        when (key) {
            "flexDirection" -> (view as? LinearLayout)?.let {
                it.orientation = if (value == "row") LinearLayout.HORIZONTAL else LinearLayout.VERTICAL
                relayout(it)
            }
            "gap" -> (view as? LinearLayout)?.let {
                it.dividerDrawable = GradientDrawable().apply { setSize(dp(value), dp(value)) }
                it.showDividers = LinearLayout.SHOW_DIVIDER_MIDDLE
            }
            "alignItems" -> (view as? LinearLayout)?.let {
                when (value) {
                    "center" -> alignItems[it] = Gravity.CENTER
                    "flex-end" -> alignItems[it] = Gravity.END
                    "flex-start" -> alignItems[it] = Gravity.START
                    else -> alignItems.remove(it)
                }
                relayout(it)
            }
            "flex" -> {
                flex[view] = value.toFloat()
                (view.parent as? LinearLayout)?.let { place(it, view) }
            }
            "padding" -> dp(value).let { view.setPadding(it, it, it, it) }
            "opacity" -> view.alpha = value.toFloat()
            "width", "height" -> {
                (if (key == "width") widths else heights)[view] = dp(value)
                (view.parent as? LinearLayout)?.let { place(it, view) }
            }
            "backgroundColor" -> background(view).setColor(Color.parseColor(value))
            "borderRadius" -> {
                background(view).cornerRadius = dp(value).toFloat()
                view.clipToOutline = true
            }
            "textAlign" -> (view as? TextView)?.gravity = if (value == "center") Gravity.CENTER_HORIZONTAL else Gravity.START
            "color" -> (view as? TextView)?.setTextColor(Color.parseColor(value))
            "fontSize" -> (view as? TextView)?.setTextSize(TypedValue.COMPLEX_UNIT_DIP, value.removeSuffix("px").toFloat())
            "fontWeight" -> (view as? TextView)?.setTypeface(null, if (value == "bold") Typeface.BOLD else Typeface.NORMAL)
        }
    }

    // One drawable carries both colour and corner radius.
    private fun background(view: View) =
        backgrounds.getOrPut(view) { GradientDrawable().also { view.background = it } }

    private fun listen(view: View, id: Int, type: String) {
        when {
            type == "click" -> view.setOnClickListener { emit(id, type) }
            type == "change" && view is CheckBox -> view.setOnCheckedChangeListener { _, checked -> emit(id, type, checked) }
            type == "change" -> (view as EditText).setOnEditorActionListener { _, _, _ -> emit(id, type); true }
            type == "input" -> (view as EditText).addTextChangedListener(object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
                override fun afterTextChanged(s: Editable?) = emit(id, type, s.toString())
            })
        }
    }
}
