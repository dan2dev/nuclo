package dev.nuclo.host

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.res.ColorStateList
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Outline
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.InsetDrawable
import android.graphics.drawable.LayerDrawable
import android.graphics.drawable.RippleDrawable
import android.icu.text.BreakIterator
import android.os.BatteryManager
import android.os.Build
import android.os.Bundle
import android.text.Editable
import android.text.InputType
import android.text.TextPaint
import android.text.TextWatcher
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.ViewOutlineProvider
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import android.view.animation.PathInterpolator
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toolbar
import android.window.BackEvent
import android.window.OnBackAnimationCallback
import android.window.OnBackInvokedCallback
import android.window.OnBackInvokedDispatcher
import org.json.JSONArray
import org.json.JSONObject
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.max

/**
 * nuclo-native host for Android: platform Views driven by QuickJS (src/main/cpp).
 * JS lays everything out (src/layout.ts) and sends frames; this host places views at them,
 * measures text and paints.
 */
class MainActivity : Activity() {
    private val views = HashMap<Int, View>()
    private val backgrounds = HashMap<View, GradientDrawable>()
    private val fonts = HashMap<View, Font>()
    /** Frames as JS sent them (dp, relative to the parent); views get them snapped to device pixels (snapFrames). */
    private val frames = HashMap<Int, DoubleArray>()
    private var placed = false
    private val density by lazy { resources.displayMetrics.density.toDouble() }
    private val inter by lazy { Typeface.createFromAsset(assets, "fonts/Inter-Regular.ttf") }
    private val interBold by lazy { Typeface.createFromAsset(assets, "fonts/Inter-Bold.ttf") }

    // Navigation (router.ts): screens by id, their titles, the stack holding each.
    private val titles = HashMap<Int, String>()
    private val screenOf = HashMap<Int, Stack>()
    private val stacks = HashMap<Int, Stack>()
    private var tabs: Tabs? = null
    private var rootStack: Stack? = null
    private var pageColor = Color.WHITE

    // Material 3 emphasized easing.
    private val emphasized = PathInterpolator(0.4f, 0f, 0.2f, 1f)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = Box(this).apply { id = 1 }
        views[1] = root
        // Dark icons on the light system bars.
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or
            if (Build.VERSION.SDK_INT >= 26) View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR else 0
        // Without the router the body is the layout root: JS lays it out at the window's size.
        setContentView(Scroller(1).apply { isFillViewport = true; addView(root) })

        evaluate(assets.open("app.js").use { it.readBytes() })
    }

    override fun onDestroy() {
        batteryWatch?.let(::unregisterReceiver)
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
        if (placed) snapFrames()
        for (stack in stacks.values) sync(stack)
        updateBack()
    }

    private fun emit(id: Int, type: String, value: Any? = null) {
        val arg = when (value) {
            null -> ""
            is String -> "," + JSONObject.quote(value)
            else -> ",$value"
        }
        evaluate("__nuclo_event($id,'$type'$arg)".toByteArray())
    }

    // ---- Layout: JS's frames, text measured and drawn the contract's way (layout.ts) ----

    /** Called by __nuclo_measure(id, maxWidth) from JS: a leaf's content size, "w h" in dp (layout.ts adds padding). */
    @Suppress("unused")
    private fun measure(id: Int, maxWidth: Double): ByteArray = when (val view = views[id]) {
        is Label -> view.measure(maxWidth)
        is CheckBox -> "0 0"
        is Button -> measureText(view.text.toString(), view.paint, view.textSize / density, maxWidth, density)
        // Its natural size: the bitmap's pixels, as the browser's naturalWidth.
        is ImageView -> (view.drawable as? BitmapDrawable)?.bitmap?.let { "${it.width} ${it.height}" } ?: "0 0"
        else -> "0 0"
    }.toByteArray()

    /**
     * Places views at their frames with edges on device pixels, as the browser paints boxes:
     * each edge rounds from its unsnapped position on screen, so boxes never blur or gap.
     */
    private fun snapFrames() {
        placed = false
        val s = density
        fun place(parent: Box, x0: Double, y0: Double, left: Int, top: Int) {
            for (i in 0 until parent.childCount) {
                val child = parent.getChildAt(i)
                val f = frames[child.id] ?: continue
                val x = x0 + f[0]
                val y = y0 + f[1]
                val l = snap(x, s)
                val t = snap(y, s)
                val w = snap(x + f[2], s) - l
                val h = snap(y + f[3], s) - t
                val lp = child.layoutParams as ViewGroup.MarginLayoutParams
                if (lp.leftMargin != l - left || lp.topMargin != t - top || lp.width != w || lp.height != h) {
                    lp.leftMargin = l - left
                    lp.topMargin = t - top
                    lp.width = w
                    lp.height = h
                    child.requestLayout()
                }
                when (child) {
                    is Label -> child.place(x - l / s, y - t / s, f[2])
                    is Box -> place(child, x, y, l, t)
                }
            }
        }
        for (root in titles.keys.mapNotNull { views[it] } + views.getValue(1)) place(root as Box, 0.0, 0.0, 0, 0)
    }

    /** __nuclo_device("frames"): every view's frame as placed, in dp relative to its parent (check.ts). */
    private fun framesJson(): String {
        val json = JSONObject()
        for ((id, view) in views) {
            if (id in stacks || id == tabs?.id) continue
            // Layout roots are their own origin.
            val root = id == 1 || id in titles
            val box = listOf(if (root) 0 else view.left, if (root) 0 else view.top, view.width, view.height)
            json.put("$id", JSONArray(box.map { Math.round(it / density * 100) / 100.0 }))
        }
        return json.toString()
    }

    /**
     * A layout root's scroll view (the body's, or a screen's): tells JS the root's size, a screen's when its width
     * changes. Posted: frames that arrive during a layout pass would leave views measured at their old size.
     */
    private inner class Scroller(val root: Int) : ScrollView(this@MainActivity) {
        override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
            super.onSizeChanged(w, h, oldw, oldh)
            if (w > 0 && (root == 1 || w != oldw)) post { emit(root, "resize", "${w / density} ${h / density} $density") }
        }

        /** JS loads more as the end comes near (dom.ts, "end"). Posted: a fling scrolls mid-draw. */
        override fun onScrollChanged(l: Int, t: Int, oldl: Int, oldt: Int) {
            super.onScrollChanged(l, t, oldl, oldt)
            post { emit(root, "scroll", "${scrollY / density} ${height / density}") }
        }
    }

    // ---- Device (device.ts) -------------------------------------------

    private var batteryWatch: BroadcastReceiver? = null
    private var batteryJson = ""

    /** Called by __nuclo_device(name) from JS: its JSON now, empty when there is none. The first call starts watching. */
    @Suppress("unused")
    private fun device(name: ByteArray): ByteArray {
        val key = String(name)
        if (key == "frames") return framesJson().toByteArray()
        if (key != "battery") return ByteArray(0)
        if (batteryWatch == null) {
            val watch = object : BroadcastReceiver() {
                override fun onReceive(context: Context, intent: Intent) {
                    val json = battery(intent)
                    if (json == batteryJson) return
                    batteryJson = json
                    deviceChanged("battery", json)
                }
            }
            batteryWatch = watch
            // The broadcast is sticky: registering returns the current reading.
            registerReceiver(watch, IntentFilter(Intent.ACTION_BATTERY_CHANGED))?.let { batteryJson = battery(it) }
        }
        return batteryJson.toByteArray()
    }

    private fun deviceChanged(name: String, json: String) =
        evaluate("__nuclo_device_changed(${JSONObject.quote(name)},${JSONObject.quote(json)})".toByteArray())

    private fun battery(intent: Intent): String {
        if (!intent.getBooleanExtra(BatteryManager.EXTRA_PRESENT, true)) return ""
        val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
        val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
        val plugged = intent.getIntExtra(BatteryManager.EXTRA_PLUGGED, 0) != 0
        val state = when (intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)) {
            BatteryManager.BATTERY_STATUS_CHARGING -> "charging"
            BatteryManager.BATTERY_STATUS_FULL -> "full"
            BatteryManager.BATTERY_STATUS_NOT_CHARGING -> if (plugged && level == scale) "full" else "discharging"
            BatteryManager.BATTERY_STATUS_DISCHARGING -> "discharging"
            else -> "unknown"
        }
        // Time to full (API 28+, -1 when unknown); Android has no public time to empty.
        val ms = if (state == "charging" && Build.VERSION.SDK_INT >= 28)
            getSystemService(BatteryManager::class.java).computeChargeTimeRemaining() else -1L
        return JSONObject()
            .put("level", if (level >= 0 && scale > 0) level.toDouble() / scale else JSONObject.NULL)
            .put("state", state)
            .put("minutes", if (ms >= 0) ms / 60_000 else JSONObject.NULL)
            .toString()
    }

    companion object {
        init {
            System.loadLibrary("nuclo")
        }
    }

    private fun dp(value: Float) = (value * density).toInt()
    private fun px(dp: Double) = Math.round(dp * density).toInt()
    private fun num(value: String) = value.removeSuffix("px").toDouble()

    private fun apply(op: JSONArray) {
        val id = op.getInt(1)
        val kind = op.getString(0)
        if (kind == "create") {
            views[id] = when (op.getString(2)) {
                "text" -> Label(this, inter)
                "button" -> Button(this).apply {
                    isAllCaps = false
                    // Fills its frame (layout.ts adds the 8 / 16 padding): no insets, no minimum size.
                    background = uninset(background)
                    minWidth = 0
                    minHeight = 0
                    setPadding(0, 0, 0, 0)
                    includeFontPadding = false
                    letterSpacing = 0f
                    paintFlags = paintFlags or TEXT_FLAGS
                    typeface = inter
                    setTextSize(TypedValue.COMPLEX_UNIT_DIP, 14f)
                }
                "input" -> EditText(this).apply {
                    setSingleLine()
                    // Its text centred in the box and 8 in, as the browser pads it.
                    gravity = Gravity.CENTER_VERTICAL
                    includeFontPadding = false
                    setPadding(dp(8f), 0, dp(8f), 0)
                    typeface = inter
                    setTextSize(TypedValue.COMPLEX_UNIT_DIP, 14f)
                }
                "checkbox" -> Check(this).apply { setPadding(0, 0, 0, 0) }
                "image" -> ImageView(this).apply { scaleType = ImageView.ScaleType.CENTER_CROP }
                "stack" -> Stack(id).also { stacks[id] = it }.box
                "tabs" -> Tabs(id).also { tabs = it }.root
                "screen" -> screen(id)
                else -> Box(this)
            }.also { it.id = id }
            return
        }
        // Ops can trail a screen the user already popped natively: ignore them.
        val view = views[id] ?: return
        when (kind) {
            "insert" -> {
                val child = views[op.getInt(2)] ?: return
                val before = op.getInt(3)
                val stack = stacks[id]
                val tabs = tabs
                when {
                    stack != null -> stack.model.run {
                        remove(child.id)
                        add(indexOf(before).takeIf { before != 0 && it >= 0 } ?: size, child.id)
                        screenOf[child.id] = stack
                    }
                    tabs != null && id == tabs.id -> tabs.add(stacks.getValue(child.id), before)
                    // A navigation root replaces the body's scroll view.
                    id == 1 && (child.id in stacks || child.id == tabs?.id) -> {
                        rootStack = stacks[child.id]
                        setContentView(child)
                    }
                    else -> {
                        val parent = view as Box
                        (child.parent as? ViewGroup)?.removeView(child)
                        parent.addView(child, if (before == 0) parent.childCount else parent.indexOfChild(views[before]))
                    }
                }
            }

            // A screen leaves its stack's model; sync() animates it out, then forgets it.
            "remove" -> screenOf[id]?.model?.remove(id) ?: run {
                (view.parent as? ViewGroup)?.removeView(view)
                forget(view)
            }

            "set" -> {
                val key = op.getString(2)
                val value = op.opt(3).takeUnless { it == JSONObject.NULL }
                when {
                    id in stacks -> stacks.getValue(id).set(key, value as String? ?: "")
                    id == tabs?.id && key == "selected" -> tabs!!.select(value.toString().toInt(), animate = true)
                    id in titles && key == "title" -> {
                        titles[id] = value as String? ?: ""
                        screenOf[id]?.refresh()
                    }
                    else -> set(view, key, value)
                }
            }
            "style" -> style(view, op.getString(2), op.getString(3))
            "listen" -> listen(view, id, op.getString(2))
            "frame" -> {
                val f = DoubleArray(4) { op.getDouble(2 + it) }
                when {
                    // A screen's frame is its scrollable content.
                    id in titles -> view.layoutParams = FrameLayout.LayoutParams(px(f[2]), px(f[3]))
                    id != 1 -> {
                        frames[id] = f
                        placed = true
                    }
                }
            }
        }
    }

    private fun forget(view: View) {
        if (view is Box) for (i in 0 until view.childCount) forget(view.getChildAt(i))
        views.remove(view.id)
        frames.remove(view.id)
        backgrounds.remove(view)
        fonts.remove(view)
    }

    private fun set(view: View, key: String, value: Any?) {
        when {
            key == "text" && view is Label -> view.text = value as String? ?: ""
            key == "text" && view is Button -> view.text = value as String?
            key == "value" -> (view as EditText).let {
                val text = value?.toString() ?: ""
                if (it.text.toString() != text) it.setText(text)
            }
            key == "placeholder" -> (view as EditText).hint = value as String?
            key == "checked" -> (view as CheckBox).isChecked = value == true
            // A password input type switches to monospace: keep the font.
            key == "type" && value == "password" -> (view as EditText).let {
                val face = it.typeface
                it.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
                it.typeface = face
            }
            // Asset paths are relative to the bundle.
            key == "src" -> assets.open(value as String).use {
                (view as ImageView).setImageBitmap(BitmapFactory.decodeStream(it))
            }
            key == "disabled" -> view.isEnabled = value != true
        }
    }

    /** Paint and text styles. Layout styles (flexDirection, gap, alignItems, flex, width, height) are JS's: they arrive as frames. */
    private fun style(view: View, key: String, value: String) {
        when (key) {
            // Boxes are laid out padded already; a text draws inside its padding, an input's text sits that far in.
            "padding" -> if (view is EditText) px(num(value)).let { view.setPadding(it, 0, it, 0) } else (view as? Label)?.padding = num(value)
            "opacity" -> view.alpha = num(value).toFloat()
            "backgroundColor" -> {
                background(view).setColor(Color.parseColor(value))
                // The body's colour is the page behind every screen.
                if (view.id == 1) {
                    pageColor = Color.parseColor(value)
                    window.setBackgroundDrawable(ColorDrawable(pageColor))
                    @Suppress("DEPRECATION")
                    window.statusBarColor = pageColor
                    for (screen in titles.keys) outer(screen).setBackgroundColor(pageColor)
                }
            }
            // The outline of the background clips the children.
            "borderRadius" -> {
                background(view).cornerRadius = (num(value) * density).toFloat()
                view.clipToOutline = true
            }
            "textAlign" -> (view as? Label)?.align = when (value) { "center" -> 0.5f; "right" -> 1f; else -> 0f }
            "color" -> Color.parseColor(value).let { if (view is Label) view.color = it else (view as? TextView)?.setTextColor(it) }
            "fontSize", "fontWeight", "fontFamily" -> font(view, key, value)
        }
    }

    /** Inter, or the system font for `fontFamily: "system"`; bold for `bold` or ≥ 600. */
    private fun font(view: View, key: String, value: String) {
        val font = fonts.getOrPut(view) { Font() }
        when (key) {
            "fontSize" -> font.size = num(value)
            "fontWeight" -> font.bold = value == "bold" || (value.toIntOrNull() ?: 400) >= 600
            else -> font.system = value == "system"
        }
        val face = when {
            font.system -> if (font.bold) Typeface.DEFAULT_BOLD else Typeface.DEFAULT
            font.bold -> interBold
            else -> inter
        }
        if (view is Label) view.setFont(face, font.size)
        else (view as? TextView)?.apply {
            typeface = face
            setTextSize(TypedValue.COMPLEX_UNIT_DIP, font.size.toFloat())
        }
    }

    // One drawable carries both colour and corner radius.
    private fun background(view: View) =
        backgrounds.getOrPut(view) { GradientDrawable().also { view.background = it } }

    private fun listen(view: View, id: Int, type: String) {
        when {
            type == "click" -> {
                view.setOnClickListener { emit(id, type) }
                // Press feedback for styled views; clipToOutline rounds it with the background.
                if (Build.VERSION.SDK_INT >= 23 && view !is Button && view.foreground == null)
                    view.foreground = ripple(ColorDrawable(Color.WHITE))
            }
            type == "change" && view is CheckBox -> view.setOnCheckedChangeListener { _, checked -> emit(id, type, checked) }
            type == "change" -> (view as EditText).setOnEditorActionListener { _, _, _ -> emit(id, type); true }
            type == "input" -> (view as EditText).addTextChangedListener(object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
                override fun afterTextChanged(s: Editable?) = emit(id, type, s.toString())
            })
        }
    }

    private fun ripple(mask: Drawable) =
        RippleDrawable(ColorStateList.valueOf(0x1F000000), null, mask)

    // ---- Navigation -------------------------------------------------------

    /** A screen: its content (its id), the layout root JS lays out at the screen's width, in a vertical scroll view. */
    private fun screen(id: Int): View {
        titles[id] = ""
        val content = Box(this)
        Scroller(id).apply {
            setBackgroundColor(pageColor)
            addView(content)
        }
        return content
    }

    private fun outer(screen: Int) = views.getValue(screen).parent as View

    private fun reset(view: View) {
        view.animate().cancel()
        view.animate().startDelay = 0
        view.alpha = 1f
        view.translationX = 0f
        view.scaleX = 1f
        view.scaleY = 1f
        view.elevation = 0f
        view.clipToOutline = false
        view.outlineProvider = ViewOutlineProvider.BACKGROUND
    }

    /** The shrinking screen of a back gesture: rounded, lifted off the one below. */
    private val card = object : ViewOutlineProvider() {
        override fun getOutline(view: View, outline: Outline) =
            outline.setRoundRect(0, 0, view.width, view.height, dp(28f).toFloat())
    }

    /** A navigation stack: an app bar over the top screen. */
    private inner class Stack(val id: Int) {
        /** Screen order from insert/remove ops, bottom to top. */
        val model = ArrayList<Int>()
        /** What the user sees: model as of the last sync. */
        var shown = listOf<Int>()
        /** Screens out of the model, forgotten once their animation ends. */
        val dropped = ArrayList<Int>()

        val frame = FrameLayout(this@MainActivity)
        val toolbar = Toolbar(this@MainActivity).apply {
            setTitleTextAppearance(context, android.R.style.TextAppearance_Material_Large)
            setNavigationContentDescription("Back")
            setNavigationOnClickListener { back(this@Stack, shown.size - 1) }
        }
        val box = LinearLayout(this@MainActivity).apply {
            orientation = LinearLayout.VERTICAL
            addView(toolbar, LinearLayout.LayoutParams(MATCH_PARENT, dp(64f)))
            addView(frame, LinearLayout.LayoutParams(MATCH_PARENT, 0, 1f))
        }

        // Its tab: a 24dp icon in a 64x32dp pill, a 12sp label below.
        val icon = ImageView(this@MainActivity)
        val pill = FrameLayout(this@MainActivity).apply {
            background = GradientDrawable().apply { cornerRadius = dp(16f).toFloat() }
            foreground = ripple(GradientDrawable().apply { cornerRadius = dp(16f).toFloat(); setColor(Color.WHITE) })
            isDuplicateParentStateEnabled = true
            addView(icon, FrameLayout.LayoutParams(dp(24f), dp(24f), Gravity.CENTER))
        }
        val label = TextView(this@MainActivity).apply {
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
        }
        val item = LinearLayout(this@MainActivity).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(0, dp(12f), 0, 0)
            addView(pill, LinearLayout.LayoutParams(dp(64f), dp(32f)))
            addView(label, LinearLayout.LayoutParams(WRAP_CONTENT, WRAP_CONTENT).apply { topMargin = dp(4f) })
            setOnClickListener { tabs?.tap(this@Stack) }
        }

        fun set(key: String, value: String) {
            when (key) {
                "title" -> label.text = value
                "icon" -> icon.setImageResource(resources.getIdentifier("ic_$value", "drawable", packageName))
            }
        }

        fun refresh() {
            toolbar.title = shown.lastOrNull()?.let { titles[it] } ?: ""
            toolbar.navigationIcon = if (shown.size > 1) getDrawable(R.drawable.ic_arrow_back) else null
        }
    }

    /** Ends any running transition: only the shown top screen stays, at rest. */
    private fun settle(s: Stack) {
        val top = s.shown.lastOrNull()?.let(::outer)
        for (i in s.frame.childCount - 1 downTo 0) {
            val view = s.frame.getChildAt(i)
            reset(view)
            if (view !== top) s.frame.removeViewAt(i)
        }
        if (top != null && top.parent == null) s.frame.addView(top)
        for (id in s.dropped) if (id !in s.model) {
            views[id]?.let(::forget)
            screenOf.remove(id)
            titles.remove(id)
        }
        s.dropped.clear()
    }

    /** End of a batch: animate what changed since the last one. */
    private fun sync(s: Stack) {
        val old = s.shown.lastOrNull()
        val top = s.model.lastOrNull()
        val changed = top != old
        val from = old?.let(::outer)
        val wasShown = s.shown
        if (changed) settle(s)
        s.dropped += wasShown - s.model.toSet()
        s.shown = s.model.toList()
        if (s.shown != wasShown) s.refresh()
        when {
            !changed -> if (s.frame.childCount <= 1 && s.dropped.isNotEmpty()) settle(s)
            from == null || top == null -> settle(s)
            top !in wasShown -> transition(s, from, outer(top), forward = true)
            old !in s.model -> transition(s, from, outer(top), forward = false)
            else -> settle(s)
        }
    }

    /** Material shared axis X: both slide 30dp over 300ms; the fades are staggered (out 90ms, then in 210ms). */
    private fun transition(s: Stack, from: View, to: View, forward: Boolean) {
        val shift = dp(30f) * if (forward) 1f else -1f
        s.frame.addView(to, if (forward) -1 else 0)
        to.alpha = 0f
        to.translationX = shift
        to.animate().translationX(0f).setStartDelay(0).setDuration(300).setInterpolator(emphasized).start()
        to.animate().alpha(1f).setStartDelay(90).setDuration(210).start()
        from.animate().translationX(-shift).setStartDelay(0).setDuration(300).setInterpolator(emphasized)
            .withEndAction { settle(s) }.start()
        from.animate().alpha(0f).setDuration(90).start()
    }

    /** The user went back natively: pop to `depth` first, then tell JS. */
    private fun back(s: Stack, depth: Int, gesture: Boolean = false) {
        if (depth < 1 || s.shown.size <= depth) return
        val from = outer(s.shown.last())
        if (!gesture) settle(s)
        while (s.model.size > depth) s.dropped += s.model.removeAt(s.model.lastIndex)
        s.shown = s.model.toList()
        if (gesture) {
            // The previous screen is already under it: let the top one go.
            from.animate().alpha(0f).setDuration(150).setInterpolator(emphasized).withEndAction { settle(s) }.start()
        } else {
            transition(s, from, outer(s.shown.last()), forward = false)
        }
        s.refresh()
        updateBack()
        emit(s.id, "pop", depth)
    }

    /** One tab per stack, under a Material 3 navigation bar. */
    private inner class Tabs(val id: Int) {
        val stacks = ArrayList<Stack>()
        var selected = 0

        private fun sys(res: Int, fallback: Long) = if (Build.VERSION.SDK_INT >= 31) getColor(res) else fallback.toInt()
        private val container = sys(android.R.color.system_neutral1_50, 0xFFF3EDF7)
        private val indicator = sys(android.R.color.system_accent2_100, 0xFFE8DEF8)
        private val onIndicator = sys(android.R.color.system_accent2_900, 0xFF1D192B)
        private val onSurface = sys(android.R.color.system_neutral1_900, 0xFF1D1B20)
        private val onSurfaceVariant = sys(android.R.color.system_neutral2_700, 0xFF49454F)

        val content = FrameLayout(this@MainActivity)
        val bar = LinearLayout(this@MainActivity).apply { setBackgroundColor(container) }

        init {
            @Suppress("DEPRECATION")
            window.navigationBarColor = container
        }
        val root = LinearLayout(this@MainActivity).apply {
            orientation = LinearLayout.VERTICAL
            addView(content, LinearLayout.LayoutParams(MATCH_PARENT, 0, 1f))
            addView(bar, LinearLayout.LayoutParams(MATCH_PARENT, dp(80f)))
        }

        fun add(s: Stack, before: Int) {
            val index = stacks.indexOfFirst { it.id == before }.takeIf { it >= 0 } ?: stacks.size
            stacks.add(index, s)
            content.addView(s.box)
            bar.addView(s.item, index, LinearLayout.LayoutParams(0, MATCH_PARENT, 1f))
            render()
        }

        /** Final state: the selected stack visible, its tab highlighted. */
        private fun render() {
            stacks.forEachIndexed { i, s ->
                val on = i == selected
                s.box.animate().cancel()
                s.box.visibility = if (on) View.VISIBLE else View.GONE
                s.box.alpha = 1f
                s.box.scaleX = 1f
                s.box.scaleY = 1f
                (s.pill.background as GradientDrawable).setColor(if (on) indicator else Color.TRANSPARENT)
                s.icon.imageTintList = ColorStateList.valueOf(if (on) onIndicator else onSurfaceVariant)
                s.label.setTextColor(if (on) onSurface else onSurfaceVariant)
                s.item.isSelected = on
            }
        }

        /** Programmatic or user selection; fade through when animated. */
        fun select(index: Int, animate: Boolean) {
            if (index == selected) return
            val out = stacks.getOrNull(selected)
            selected = index
            render()
            val inn = stacks.getOrNull(index) ?: return
            if (!animate || out == null) return
            out.box.visibility = View.VISIBLE
            out.box.animate().alpha(0f).setStartDelay(0).setDuration(90).setInterpolator(emphasized)
                .withEndAction { out.box.visibility = View.GONE; out.box.alpha = 1f }.start()
            inn.box.alpha = 0f
            inn.box.scaleX = 0.92f
            inn.box.scaleY = 0.92f
            inn.box.animate().alpha(1f).scaleX(1f).scaleY(1f).setStartDelay(90).setDuration(210)
                .setInterpolator(emphasized).start()
        }

        fun tap(s: Stack) {
            val index = stacks.indexOf(s)
            if (index == selected) {
                // Re-tapping the current tab pops it to its root.
                back(s, 1)
            } else {
                select(index, animate = true)
                updateBack()
                emit(id, "select", index)
            }
        }
    }

    // ---- Back: predictive on API 34+, plain on 33, onBackPressed before ----

    private fun active() = tabs?.let { it.stacks.getOrNull(it.selected) } ?: rootStack

    private var backRegistered = false
    /** The stack whose previous screen is shown under a back gesture. */
    private var gesture: Stack? = null

    private val backCallback: Any? by lazy {
        when {
            Build.VERSION.SDK_INT >= 34 -> object : OnBackAnimationCallback {
                override fun onBackProgressed(event: BackEvent) {
                    val s = active() ?: return
                    if (s.shown.size < 2) return
                    if (gesture == null) {
                        settle(s)
                        s.frame.addView(outer(s.shown[s.shown.size - 2]), 0)
                        gesture = s
                        outer(s.shown.last()).apply {
                            outlineProvider = card
                            clipToOutline = true
                            elevation = dp(6f).toFloat()
                        }
                    }
                    // Material predictive back: scale to 90%, drift with the swipe.
                    val top = outer(s.shown.last())
                    val p = event.progress
                    val drift = (s.frame.width / 20f - dp(8f)) * p
                    top.scaleX = 1f - 0.1f * p
                    top.scaleY = 1f - 0.1f * p
                    top.translationX = if (event.swipeEdge == BackEvent.EDGE_LEFT) drift else -drift
                }

                override fun onBackInvoked() {
                    val s = active() ?: return
                    val wasGesture = gesture == s
                    gesture = null
                    back(s, s.shown.size - 1, wasGesture)
                }

                override fun onBackCancelled() {
                    val s = gesture ?: return
                    gesture = null
                    outer(s.shown.last()).animate().scaleX(1f).scaleY(1f).translationX(0f)
                        .setDuration(200).setInterpolator(emphasized).withEndAction { settle(s) }.start()
                }
            }
            Build.VERSION.SDK_INT >= 33 -> OnBackInvokedCallback {
                active()?.let { back(it, it.shown.size - 1) }
            }
            else -> null
        }
    }

    /** Claim back only while there is a screen to pop, so the system back-to-home runs at the root. */
    private fun updateBack() {
        if (Build.VERSION.SDK_INT < 33) return
        val want = (active()?.shown?.size ?: 0) > 1
        if (want == backRegistered) return
        backRegistered = want
        val callback = backCallback as OnBackInvokedCallback
        if (want) onBackInvokedDispatcher.registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT, callback)
        else onBackInvokedDispatcher.unregisterOnBackInvokedCallback(callback)
    }

    @Suppress("OVERRIDE_DEPRECATION", "DEPRECATION")
    override fun onBackPressed() {
        val s = active()
        if (s != null && s.shown.size > 1) back(s, s.shown.size - 1) else super.onBackPressed()
    }
}

/** A container. JS lays its children out (layout.ts); each sits at its snapped frame, kept in its MarginLayoutParams. */
private class Box(context: Context) : ViewGroup(context) {
    override fun generateDefaultLayoutParams() = MarginLayoutParams(0, 0)

    override fun shouldDelayChildPressedState() = false

    override fun onMeasure(widthSpec: Int, heightSpec: Int) {
        var bottom = 0
        for (i in 0 until childCount) {
            val child = getChildAt(i)
            val lp = child.layoutParams as MarginLayoutParams
            child.measure(exactly(lp.width), exactly(lp.height))
            bottom = max(bottom, lp.topMargin + lp.height)
        }
        // A box is its frame. A layout root without one (the body) fills its scroll view, and grows to what overflows it.
        val lp = layoutParams
        setMeasuredDimension(
            if (lp.width >= 0) lp.width else MeasureSpec.getSize(widthSpec),
            if (lp.height >= 0) lp.height else max(bottom, MeasureSpec.getSize(heightSpec)),
        )
    }

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        for (i in 0 until childCount) {
            val child = getChildAt(i)
            val lp = child.layoutParams as MarginLayoutParams
            child.layout(lp.leftMargin, lp.topMargin, lp.leftMargin + lp.width, lp.topMargin + lp.height)
        }
    }

    private fun exactly(size: Int) = MeasureSpec.makeMeasureSpec(size, MeasureSpec.EXACTLY)
}

/** The platform checkbox, centred in its 24×24 box: its drawable is wider than the box. */
private class Check(context: Context) : CheckBox(context) {
    override fun onDraw(canvas: Canvas) {
        canvas.save()
        canvas.translate((width - (buttonDrawable?.intrinsicWidth ?: 0)) / 2f, 0f)
        super.onDraw(canvas)
        canvas.restore()
    }
}

/** A drawable without its insets: the Material button's shape is inset inside its ripple. */
private fun uninset(drawable: Drawable?): Drawable? = when (drawable) {
    is InsetDrawable -> drawable.drawable
    is LayerDrawable -> drawable.apply { for (i in 0 until numberOfLayers) setDrawable(i, uninset(getDrawable(i))) }
    else -> drawable
}

private class Font(var size: Double = 14.0, var bold: Boolean = false, var system: Boolean = false)

// ── Text, the contract's way (layout.ts): the bundled font, line height 1.35 × size ──

/** A position in dp as the browser paints it, in device pixels: on its 1/64-pixel layout grid, rounded half up. */
private fun snap(dp: Double, scale: Double) = Math.floorDiv(Math.round(dp * scale * 64) + 32, 64L).toInt()

/** A line's height: 1.35 × the font size on the browser's 1/64 device-pixel grid (layout.ts lineHeight). */
private fun lineHeight(size: Double, scale: Double) = floor(size * 1.35 * scale * 64 + 1e-6) / (scale * 64)

/**
 * Where the browser puts the baseline in a line, `scale` device pixels per dp (Blink lays text out
 * in device pixels): ascent and descent rounded to device pixels, then half the leading above them,
 * floored to a device pixel.
 */
private fun baseline(size: Double, ascent: Double, descent: Double, scale: Double): Double {
    val a = Math.round(ascent * scale).toDouble()
    val d = Math.round(descent * scale).toDouble()
    return (a + floor((lineHeight(size, scale) * scale - a - d) / 2)) / scale
}

/** Text as the browser sets it: unhinted (linear) advances, glyphs placed at fractional positions. */
private const val TEXT_FLAGS = Paint.LINEAR_TEXT_FLAG or Paint.SUBPIXEL_TEXT_FLAG

/** A line of a text: its characters, trailing spaces left out (they hang past the line, as in CSS), and its width in px. */
private class Line(val start: Int, val end: Int, val width: Float)

private val breaks = BreakIterator.getLineInstance()

/**
 * `text` broken into lines the browser's way: greedily at line-break opportunities, and at newlines,
 * never inside a word (a word wider than `max` overflows). `max` in px.
 * ponytail: re-measures each line from its start per word, O(n²) in a paragraph's length; fine for UI text.
 */
private fun typeset(text: String, paint: Paint, max: Float): List<Line> {
    val lines = ArrayList<Line>()
    if (text.isEmpty()) return lines
    fun line(start: Int, end: Int): Line {
        var visible = end
        while (visible > start && text[visible - 1].isWhitespace()) visible--
        // Not measureText: it rounds up to a whole pixel.
        return Line(start, visible, paint.getRunAdvance(text, start, visible, start, visible, false, visible))
    }
    var from = 0
    for (paragraph in text.removeSuffix("\n").split('\n')) {
        breaks.setText(paragraph)
        var start = from
        var last = from
        var at = breaks.next()
        while (at != BreakIterator.DONE) {
            if (last > start && line(start, from + at).width > max) {
                lines += line(start, last)
                start = last
            }
            last = from + at
            at = breaks.next()
        }
        lines += line(start, last)
        from += paragraph.length + 1
    }
    return lines
}

/** __nuclo_measure for a text: its widest line, rounded up to 1/100, and its lines' height, in dp. */
private fun measureText(text: String, paint: Paint, size: Double, maxWidth: Double, scale: Double): String {
    val lines = typeset(text, paint, if (maxWidth < 0) Float.MAX_VALUE else (maxWidth * scale).toFloat())
    val widest = (lines.maxOfOrNull { it.width } ?: 0f) / scale
    return "${ceil(widest * 100 - 0.001) / 100} ${lines.size * lineHeight(size, scale)}"
}

/** A text, drawn line by line at the browser's baselines: what is measured is exactly what is drawn. */
private class Label(context: Context, typeface: Typeface) : View(context) {
    private val scale = resources.displayMetrics.density.toDouble()
    private val paint = TextPaint(Paint.ANTI_ALIAS_FLAG or TEXT_FLAGS).also {
        it.typeface = typeface
        it.textSize = (14 * scale).toFloat()
        it.color = Color.BLACK
    }
    private var size = 14.0

    var text = ""
        set(value) {
            field = value
            contentDescription = value
            invalidate()
        }
    var color: Int
        get() = paint.color
        set(value) {
            paint.color = value
            invalidate()
        }
    /** The share of each line's slack before it: 0 left, 0.5 centre, 1 right. */
    var align = 0f
        set(value) {
            field = value
            invalidate()
        }
    var padding = 0.0
        set(value) {
            field = value
            invalidate()
        }

    // Where JS put the box (dp): its offset from the snapped frame, and its unsnapped width.
    private var offsetX = 0.0
    private var offsetY = 0.0
    private var boxWidth = 0.0

    fun setFont(typeface: Typeface, size: Double) {
        paint.typeface = typeface
        paint.textSize = (size * scale).toFloat()
        this.size = size
        invalidate()
    }

    fun place(x: Double, y: Double, width: Double) {
        if (x == offsetX && y == offsetY && width == boxWidth) return
        offsetX = x
        offsetY = y
        boxWidth = width
        invalidate()
    }

    fun measure(maxWidth: Double) = measureText(text, paint, size, maxWidth, scale)

    override fun onDraw(canvas: Canvas) {
        val room = (boxWidth - 2 * padding) * scale
        // Lines break at the width JS laid the box out at (a hair over: widths were rounded up).
        val lines = typeset(text, paint, (room + 0.01).toFloat())
        // The font's ascent and descent (Inter's are its hhea 0.96875 and 0.2412109375 em).
        val metrics = paint.fontMetrics
        val line = lineHeight(size, scale)
        val first = baseline(size, -metrics.ascent / scale, metrics.descent / scale, scale)
        val left = (offsetX + padding) * scale
        lines.forEachIndexed { i, l ->
            val x = left + (room - l.width) * align
            // The baseline lands on a device pixel, as the browser paints it.
            val y = snap(offsetY + padding + i * line + first, scale)
            canvas.drawText(text, l.start, l.end, x.toFloat(), y.toFloat(), paint)
        }
    }
}
