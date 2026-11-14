package dev.nuclo.host

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.res.ColorStateList
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.Outline
import android.graphics.Typeface
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.RippleDrawable
import android.os.BatteryManager
import android.os.Build
import android.os.Bundle
import android.text.Editable
import android.text.InputType
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

/** nuclo-native host for Android: platform Views driven by QuickJS (src/main/cpp). */
class MainActivity : Activity() {
    private val views = HashMap<Int, View>()
    private val flex = HashMap<View, Float>()
    private val alignItems = HashMap<View, Int>()
    private val widths = HashMap<View, Int>()
    private val heights = HashMap<View, Int>()
    private val backgrounds = HashMap<View, GradientDrawable>()

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
        val root = LinearLayout(this).apply { id = 1; orientation = LinearLayout.VERTICAL }
        views[1] = root
        // Dark icons on the light system bars.
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or
            if (Build.VERSION.SDK_INT >= 26) View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR else 0
        setContentView(ScrollView(this).apply { isFillViewport = true; addView(root) })

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

    // ---- Device (device.ts) -------------------------------------------

    private var batteryWatch: BroadcastReceiver? = null
    private var batteryJson = ""

    /** Called by __nuclo_device(name) from JS: its JSON now, empty when there is none. The first call starts watching. */
    @Suppress("unused")
    private fun device(name: ByteArray): ByteArray {
        if (String(name) != "battery") return ByteArray(0)
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

    private fun dp(value: String) = dp(value.removeSuffix("px").toFloat())
    private fun dp(value: Float) = (value * resources.displayMetrics.density).toInt()

    private fun apply(op: JSONArray) {
        val id = op.getInt(1)
        val kind = op.getString(0)
        if (kind == "create") {
            views[id] = when (op.getString(2)) {
                "text" -> TextView(this)
                "button" -> Button(this).apply { isAllCaps = false }
                "input" -> EditText(this).apply { setSingleLine() }
                "checkbox" -> CheckBox(this)
                "image" -> ImageView(this).apply { scaleType = ImageView.ScaleType.CENTER_CROP }
                "stack" -> Stack(id).also { stacks[id] = it }.box
                "tabs" -> Tabs(id).also { tabs = it }.root
                "screen" -> screen(id)
                else -> LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
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
                        val parent = view as LinearLayout
                        (child.parent as? ViewGroup)?.removeView(child)
                        parent.addView(child, if (before == 0) parent.childCount else parent.indexOfChild(views[before]))
                        place(parent, child)
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

    /** A screen is a vertical flex column (its id) inside a vertical ScrollView. */
    private fun screen(id: Int): View {
        titles[id] = ""
        val content = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        ScrollView(this).apply {
            isFillViewport = true
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
