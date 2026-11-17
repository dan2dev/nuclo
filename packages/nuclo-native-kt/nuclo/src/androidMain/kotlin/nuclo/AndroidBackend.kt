package nuclo

import android.app.Activity
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Path
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.text.Editable
import android.text.InputType
import android.text.TextWatcher
import android.view.inputmethod.EditorInfo
import android.widget.CheckBox
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.ScrollView
import android.widget.TextView
import nuclo.host.*
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/** The frame the core gave a view, in logical pixels, kept on the view. */
internal class Slot(val id: ViewId, val kind: ViewKind) {
    var frame = Rect(0, 0, 0, 0)
    var paint: Paint? = null
    var text = ""
    var backdrop: Backdrop? = null
    val listens = HashSet<InputKind>()
    /** A scrolling box: where its children go (inside the scroller). */
    var content: NBox? = null
}

internal val View.slot: Slot get() = tag as Slot
internal val View.slotOrNull: Slot? get() = tag as? Slot

/** A box: a ViewGroup that puts each child exactly at the frame the core gave it (frames are law). */
internal class NBox(context: Context, private val density: Float) : ViewGroup(context) {
    init { clipChildren = false; clipToPadding = false }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        for (i in 0 until childCount) {
            val c = getChildAt(i)
            val f = c.slotOrNull?.frame ?: (tag as Slot).frame
            c.measure(MeasureSpec.makeMeasureSpec(px(f.w), MeasureSpec.EXACTLY), MeasureSpec.makeMeasureSpec(px(f.h), MeasureSpec.EXACTLY))
        }
        val f = (tag as? Slot)?.frame
        setMeasuredDimension(if (f != null) px(f.w) else MeasureSpec.getSize(widthMeasureSpec), if (f != null) px(f.h) else MeasureSpec.getSize(heightMeasureSpec))
    }

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        for (i in 0 until childCount) {
            val c = getChildAt(i)
            val f = c.slotOrNull?.frame ?: HRectFill(r - l, b - t)
            // rounded edges, not sizes: neighbours meet exactly
            c.layout(px(f.x), px(f.y), px(f.x + f.w), px(f.y + f.h))
        }
    }

    private fun px(dp: Int) = (dp * density).roundToInt()
    /** A scroller fills its box, in logical pixels. */
    @Suppress("FunctionName")
    private fun HRectFill(wPx: Int, hPx: Int) = Rect(0, 0, (wPx / density).roundToInt(), (hPx / density).roundToInt())
}

/** A text or a button's view: lets touches through under `pointerEvents = None`. */
internal class NText(context: Context) : TextView(context, null, 0, 0) {
    var takesPointer = true
    override fun dispatchTouchEvent(event: MotionEvent): Boolean = if (!takesPointer) false else super.dispatchTouchEvent(event)
}

/** A view's background: the fill, border and corners, and a CSS-like drop shadow drawn outside the bounds. */
internal class Backdrop : GradientDrawable() {
    var shadow = false
    var shadowColor = 0
    var shadowBlur = 0f
    var shadowX = 0f
    var shadowY = 0f
    var radius = 0f
    /** Borders that differ per side, in px (top, right, bottom, left) and their colours; drawn over the fill. */
    var sides: FloatArray? = null
    val sideColors = IntArray(4)
    private val paint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG)
    private val path = Path()

    override fun draw(canvas: Canvas) {
        val b = bounds
        val r = min(radius, min(b.width(), b.height()) / 2f)
        if (shadow) {
            path.rewind()
            path.addRoundRect(b.left.toFloat(), b.top.toFloat(), b.right.toFloat(), b.bottom.toFloat(), r, r, Path.Direction.CW)
            paint.color = shadowColor or 0xFF000000.toInt()
            paint.setShadowLayer(max(shadowBlur * 0.87f, 0.01f), shadowX, shadowY, shadowColor)
            val save = canvas.save()
            canvas.clipOutPath(path)
            canvas.drawPath(path, paint)
            canvas.restoreToCount(save)
        }
        super.draw(canvas)
        val w = sides ?: return
        val l = b.left.toFloat(); val t = b.top.toFloat(); val rt = b.right.toFloat(); val bt = b.bottom.toFloat()
        paint.clearShadowLayer()
        paint.style = android.graphics.Paint.Style.FILL
        if (w[0] > 0) canvas.drawRect(l, t, rt, t + w[0], paint.apply { color = sideColors[0] })
        if (w[1] > 0) canvas.drawRect(rt - w[1], t, rt, bt, paint.apply { color = sideColors[1] })
        if (w[2] > 0) canvas.drawRect(l, bt - w[2], rt, bt, paint.apply { color = sideColors[2] })
        if (w[3] > 0) canvas.drawRect(l, t, l + w[3], bt, paint.apply { color = sideColors[3] })
    }
}

/** The screen: a vertical scroller around the root. It asks the core for the layout in onMeasure, so frames
 *  are stored before any view is measured. */
internal class ScreenView(context: Context, private val density: Float, private val root: View, private val overlay: Boolean) : ScrollView(context) {
    init {
        isFillViewport = true
        if (overlay) overlayMode() else addView(root, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))
    }

    private fun overlayMode() { addView(root, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)) }

    var onScreenLayout: (() -> Unit)? = null

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val wPx = MeasureSpec.getSize(widthMeasureSpec)
        val hPx = MeasureSpec.getSize(heightMeasureSpec)
        setMeasuredDimension(wPx, hPx)
        val w = wPx / density
        val id = root.slot.id
        val h = if (overlay) hPx / density else max(Host.measureRoot(id, w), hPx / density)
        root.slot.frame = Rect(0, 0, w.roundToInt(), h.roundToInt())
        Host.layoutRoot(id, w, h)
        root.measure(MeasureSpec.makeMeasureSpec((w * density).roundToInt(), MeasureSpec.EXACTLY), MeasureSpec.makeMeasureSpec((h * density).roundToInt(), MeasureSpec.EXACTLY))
    }

    override fun onScrollChanged(l: Int, t: Int, oldl: Int, oldt: Int) {
        super.onScrollChanged(l, t, oldl, oldt)
        if (!overlay) Host.screenScrolled(root.slot.id, t / density, height / density)
    }

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        root.layout(0, 0, root.measuredWidth, root.measuredHeight)
        onScreenLayout?.invoke()
    }
}

private const val R_TOUCH = 0x7f0b0001

/** DOM `key` names for the keys an app is likely to handle. */
private fun keyName(code: Int, event: android.view.KeyEvent): String = when (code) {
    android.view.KeyEvent.KEYCODE_ENTER, android.view.KeyEvent.KEYCODE_NUMPAD_ENTER -> "Enter"
    android.view.KeyEvent.KEYCODE_ESCAPE -> "Escape"
    android.view.KeyEvent.KEYCODE_DEL -> "Backspace"
    android.view.KeyEvent.KEYCODE_FORWARD_DEL -> "Delete"
    android.view.KeyEvent.KEYCODE_TAB -> "Tab"
    android.view.KeyEvent.KEYCODE_SPACE -> " "
    android.view.KeyEvent.KEYCODE_DPAD_LEFT -> "ArrowLeft"
    android.view.KeyEvent.KEYCODE_DPAD_RIGHT -> "ArrowRight"
    android.view.KeyEvent.KEYCODE_DPAD_UP -> "ArrowUp"
    android.view.KeyEvent.KEYCODE_DPAD_DOWN -> "ArrowDown"
    else -> event.unicodeChar.takeIf { it != 0 }?.toChar()?.toString() ?: android.view.KeyEvent.keyCodeToString(code).removePrefix("KEYCODE_")
}

/** A view's pointers and gestures: pointer phases, a pan (past the touch slop), a pinch, a long press and a double tap,
 *  with the platform's detectors. The view stays an ordinary clickable view; a pan or pinch keeps the gesture from the first touch. */
internal class Touch(private val id: ViewId, private val view: View, private val density: Float) : View.OnTouchListener {
    private val enabled = HashSet<InputKind>()
    private val slop = android.view.ViewConfiguration.get(view.context).scaledTouchSlop
    private var tracker: android.view.VelocityTracker? = null
    private var startX = 0f
    private var startY = 0f
    private var panning = false
    private var pinching = false
    private var pinchScale = 1f

    private val taps = android.view.GestureDetector(view.context, object : android.view.GestureDetector.SimpleOnGestureListener() {
        override fun onLongPress(e: MotionEvent) { if (InputKind.LongPress in enabled) Host.pointer(id, PointerPhase.LongPress, pointer(e)) }
        override fun onDoubleTap(e: MotionEvent): Boolean { if (InputKind.DoubleClick in enabled) Host.pointer(id, PointerPhase.DoubleClick, pointer(e)); return false }
    })

    private val scales = android.view.ScaleGestureDetector(view.context, object : android.view.ScaleGestureDetector.SimpleOnScaleGestureListener() {
        override fun onScaleBegin(d: android.view.ScaleGestureDetector): Boolean { pinching = true; pinchScale = 1f; Host.pinch(id, PinchEvent("start", 1.0, d.focusX / density.toDouble(), d.focusY / density.toDouble())); return true }
        override fun onScale(d: android.view.ScaleGestureDetector): Boolean { pinchScale *= d.scaleFactor; Host.pinch(id, PinchEvent("move", pinchScale.toDouble(), d.focusX / density.toDouble(), d.focusY / density.toDouble())); return true }
        override fun onScaleEnd(d: android.view.ScaleGestureDetector) { pinching = false; Host.pinch(id, PinchEvent("end", pinchScale.toDouble(), d.focusX / density.toDouble(), d.focusY / density.toDouble())) }
    })

    fun enable(input: InputKind) { enabled.add(input); view.isClickable = true; view.setOnTouchListener(this) }

    private fun pointer(e: MotionEvent) = PointerEvent(e.x / density.toDouble(), e.y / density.toDouble(), e.rawX / density.toDouble(), e.rawY / density.toDouble(), e.getPointerId(e.actionIndex))

    private fun pan(state: String, e: MotionEvent) {
        val t = tracker
        t?.computeCurrentVelocity(1000)
        Host.pan(id, PanEvent(state, (e.rawX - startX) / density.toDouble(), (e.rawY - startY) / density.toDouble(),
            (t?.xVelocity ?: 0f) / density.toDouble(), (t?.yVelocity ?: 0f) / density.toDouble(), e.x / density.toDouble(), e.y / density.toDouble()))
    }

    override fun onTouch(v: View, e: MotionEvent): Boolean {
        if (InputKind.LongPress in enabled || InputKind.DoubleClick in enabled) taps.onTouchEvent(e)
        if (InputKind.Pinch in enabled) scales.onTouchEvent(e)
        if (InputKind.Pan in enabled) {
            val screen = MotionEvent.obtain(e)
            screen.setLocation(e.rawX, e.rawY)
            (tracker ?: android.view.VelocityTracker.obtain().also { tracker = it }).addMovement(screen)
            screen.recycle()
        }
        when (e.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                startX = e.rawX; startY = e.rawY; panning = false
                if (InputKind.Pan in enabled || InputKind.Pinch in enabled) v.parent?.requestDisallowInterceptTouchEvent(true)
                Host.pointer(id, PointerPhase.Down, pointer(e))
            }
            MotionEvent.ACTION_MOVE -> {
                if (InputKind.Pointer in enabled) Host.pointer(id, PointerPhase.Move, pointer(e))
                if (InputKind.Pan in enabled && !pinching) {
                    if (panning) pan("move", e)
                    else if (kotlin.math.max(kotlin.math.abs(e.rawX - startX), kotlin.math.abs(e.rawY - startY)) > slop) {
                        panning = true
                        // the translation counts from where the drag was recognized, so the view does not jump
                        startX = e.rawX; startY = e.rawY
                        // the drag is not a click: the view's own press ends here
                        val cancel = MotionEvent.obtain(e)
                        cancel.action = MotionEvent.ACTION_CANCEL
                        v.onTouchEvent(cancel)
                        cancel.recycle()
                        pan("start", e)
                    }
                }
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                val cancelled = e.actionMasked == MotionEvent.ACTION_CANCEL
                Host.pointer(id, if (cancelled) PointerPhase.Cancel else PointerPhase.Up, pointer(e))
                val was = panning
                if (was) pan(if (cancelled) "cancel" else "end", e)
                panning = false
                tracker?.recycle(); tracker = null
                if (was) return true
            }
        }
        // while it drags, the view's own touch handling (press, click) stays out
        return panning
    }
}

internal class AndroidBackend(private val activity: Activity) : Backend {
    private val density = activity.resources.displayMetrics.density
    private val main = Handler(Looper.getMainLooper())
    private val views = HashMap<ViewId, View>()
    private var nextId = 1
    private val timers = HashMap<Int, Runnable>()
    private var nextTimer = 1
    private var layoutQueued = false
    private val rootLayout = FrameLayout(activity)
    private var screen: ScreenView? = null
    private val overlays = ArrayList<ScreenView>()

    init {
        rootLayout.setBackgroundColor(Color.WHITE)
        // Edge to edge: keep content clear of the status and navigation bars and the keyboard.
        rootLayout.setOnApplyWindowInsetsListener { v, insets ->
            val bars = insets.getInsets(android.view.WindowInsets.Type.systemBars() or android.view.WindowInsets.Type.ime())
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            android.view.WindowInsets.CONSUMED
        }
        activity.setContentView(rootLayout)
    }

    private fun v(id: ViewId) = views[id] ?: error("android: no view $id")
    private fun px(dp: Float) = dp * density

    // ---- views

    override fun create(kind: ViewKind): ViewId {
        val id = nextId++
        val view: View = when (kind) {
            ViewKind.Box, ViewKind.Native -> NBox(activity, density)
            ViewKind.Text -> NText(activity)
            ViewKind.Button -> NText(activity).apply { gravity = Gravity.CENTER; isClickable = true }
            ViewKind.Input -> EditText(activity).apply { isSingleLine = true; imeOptions = EditorInfo.IME_ACTION_DONE; background = null }
            ViewKind.Textarea -> EditText(activity).apply { inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_MULTI_LINE; background = null; gravity = Gravity.TOP }
            ViewKind.Checkbox -> CheckBox(activity)
            ViewKind.Image -> ImageView(activity).apply { scaleType = ImageView.ScaleType.CENTER_CROP }
            else -> NBox(activity, density)
        }
        view.tag = Slot(id, kind)
        wireControl(id, view)
        if (view is TextView) { view.includeFontPadding = false }
        views[id] = view
        return id
    }

    /** Set while the core writes a control, so it reports no event (as in the browser). */
    private var writing = false

    private fun write(block: () -> Unit) { writing = true; try { block() } finally { writing = false } }

    private fun wireControl(id: ViewId, view: View) {
        when (view) {
            is CheckBox -> view.setOnCheckedChangeListener { _, _ -> if (!writing) Host.event(id, ViewEvent.Change) }
            is EditText -> {
                view.addTextChangedListener(object : TextWatcher {
                    override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                    override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
                    override fun afterTextChanged(s: Editable?) { if (!writing) Host.event(id, ViewEvent.Input) }
                })
                view.setOnEditorActionListener { _, action, _ ->
                    if (action == EditorInfo.IME_ACTION_DONE) Host.event(id, ViewEvent.Change)
                    false
                }
                view.setOnFocusChangeListener { _, has -> Host.event(id, if (has) ViewEvent.Focus else ViewEvent.Blur) }
            }
            else -> {}
        }
    }

    override fun destroy(view: ViewId) {
        val v = views.remove(view) ?: return
        (v.parent as? ViewGroup)?.removeView(v)
    }

    override fun setChildren(parent: ViewId, children: IntArray) {
        val p = (v(parent).slot.content ?: v(parent)) as ViewGroup
        val wanted = children.map { v(it) }
        val keep = wanted.toHashSet()
        for (i in p.childCount - 1 downTo 0) if (p.getChildAt(i) !in keep) p.removeViewAt(i)
        var inOrder = p.childCount == wanted.size
        if (inOrder) for (i in wanted.indices) if (p.getChildAt(i) !== wanted[i]) { inOrder = false; break }
        if (!inOrder) {
            p.removeAllViews()
            for (c in wanted) { (c.parent as? ViewGroup)?.removeView(c); p.addView(c) }
        }
    }

    override fun setFrame(view: ViewId, frame: Rect) {
        val v = v(view)
        val old = v.slot.frame
        v.slot.frame = frame
        if (old != frame) v.paint()?.let { applyPaint(v, it) }
    }

    private fun View.paint(): Paint? = slot.paint

    override fun frameOf(view: ViewId): Rect {
        val v = v(view)
        return Rect((v.left / density).roundToInt(), (v.top / density).roundToInt(), (v.width / density).roundToInt(), (v.height / density).roundToInt())
    }

    override fun paint(view: ViewId, kind: ViewKind, paint: Paint) {
        val v = v(view)
        v.slot.paint = paint
        applyPaint(v, paint)
    }

    private fun applyPaint(v: View, p: Paint) {
        val bg = p.background
        val b = p.borders
        val border = b.any { it > 0f }
        if (bg != null || border || p.radius > 0f || p.shadow != null) {
            val d = v.slot.backdrop ?: Backdrop().also { v.slot.backdrop = it; it.setColor(Color.TRANSPARENT); v.background = it }
            val radius = px(p.radius)
            d.cornerRadius = radius
            d.radius = radius
            d.shadow = p.shadow != null
            p.shadow?.let { d.shadowColor = it.color.toInt().argb(); d.shadowBlur = px(it.blur); d.shadowX = px(it.dx); d.shadowY = px(it.dy) }
            val uniform = b[0] == b[1] && b[1] == b[2] && b[2] == b[3] && p.borderColors.all { it == p.borderColors[0] }
            if (border && uniform) {
                d.sides = null
                d.setStroke(px(b[0]).roundToInt(), p.borderColors[0].argb())
            } else {
                d.setStroke(0, Color.TRANSPARENT)
                d.sides = if (border) FloatArray(4) { px(b[it]) } else null
                for (i in 0..3) d.sideColors[i] = p.borderColors[i].argb()
            }
            d.setColor(bg?.toInt()?.argb() ?: Color.TRANSPARENT)
            d.invalidateSelf()
        } else if (v.slot.backdrop != null) {
            v.slot.backdrop = null
            v.background = null
        }
        v.visibility = if (p.visible) View.VISIBLE else View.GONE
        v.alpha = p.opacity
        v.translationX = px(p.translateX); v.translationY = px(p.translateY)
        v.rotation = p.rotate; v.scaleX = p.scale; v.scaleY = p.scale
        (v as? NBox)?.clipChildren = p.clip
        v.clipToOutline = p.clip && p.radius > 0f
        if (v.clipToOutline) v.outlineProvider = android.view.ViewOutlineProvider.BACKGROUND
        (v as? NText)?.takesPointer = p.pointer
        (v as? ImageView)?.scaleType = when (p.fit) { 1 -> ImageView.ScaleType.FIT_CENTER; 2 -> ImageView.ScaleType.FIT_XY; else -> ImageView.ScaleType.CENTER_CROP }
        if (v is TextView) paintText(v, p)
    }

    private fun paintText(v: TextView, p: Paint) {
        val t = p.text
        v.setTextSize(TypedValue.COMPLEX_UNIT_PX, px(t.fontSize))
        val family = when (t.family) {
            "sans-serif" -> Typeface.DEFAULT
            "monospace" -> Typeface.MONOSPACE
            "serif" -> Typeface.SERIF
            else -> Typeface.create(t.family, Typeface.NORMAL)
        }
        v.typeface = Typeface.create(family, t.weight, t.italic)
        v.setTextColor(t.color.toInt().argb())
        if (v is EditText) v.setHintTextColor((t.placeholderColor ?: 0x757575ffu).toInt().argb())
        v.letterSpacing = if (t.letterSpacing != 0f) t.letterSpacing / t.fontSize else 0f
        v.lineHeight = px(t.lineHeight).roundToInt()
        var flags = v.paintFlags and (android.graphics.Paint.UNDERLINE_TEXT_FLAG or android.graphics.Paint.STRIKE_THRU_TEXT_FLAG).inv()
        if (t.underline) flags = flags or android.graphics.Paint.UNDERLINE_TEXT_FLAG
        if (t.strike) flags = flags or android.graphics.Paint.STRIKE_THRU_TEXT_FLAG
        v.paintFlags = flags
        v.maxLines = if (t.lines > 0) t.lines else Int.MAX_VALUE
        v.ellipsize = if (t.lines > 0) android.text.TextUtils.TruncateAt.END else null
        if (v.slot.kind != ViewKind.Button) {
            v.gravity = (when (t.align) { 1 -> Gravity.CENTER_HORIZONTAL; 2 -> Gravity.END; else -> Gravity.START }) or Gravity.TOP
        }
        val i = p.insets
        v.setPadding(px(i[3]).roundToInt(), px(i[0]).roundToInt(), px(i[1]).roundToInt(), px(i[2]).roundToInt())
    }

    private fun Int.argb(): Int = this  // packed RRGGBBAA bits → Android's AARRGGBB
        .let { rgba -> ((rgba and 0xff) shl 24) or ((rgba ushr 8) and 0xffffff) }

    override fun measure(view: ViewId, maxWidth: Float): Size {
        val v = v(view)
        val p = v.slot.paint ?: return Size(0f, 0f)
        if (v is CheckBox) return Size(20f, 20f)
        if (v !is TextView) return Size(0f, 0f)
        if (v.slot.kind == ViewKind.Input) return Size(maxWidth, p.text.lineHeight)
        val i = p.insets
        val padW = px(i[1]) + px(i[3])
        v.measure(MeasureSpec(ceil(px(maxWidth) + padW).toInt().coerceAtLeast(0), View.MeasureSpec.AT_MOST), View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED))
        val w = (v.measuredWidth - padW) / density
        // a line is exactly lineHeight tall; TextView's own spacing adds only between lines
        val lines = if (v.slot.kind == ViewKind.Textarea) max(3, v.lineCount) else v.lineCount
        return Size(ceil(w), lines * p.text.lineHeight)
    }

    @Suppress("FunctionName")
    private fun MeasureSpec(size: Int, mode: Int) = View.MeasureSpec.makeMeasureSpec(size, mode)

    override fun setText(view: ViewId, text: String) {
        val v = v(view)
        v.slot.text = text
        (v as? TextView)?.text = text
    }

    // ---- async

    override fun http(request: HttpRequest, done: (HttpResult) -> Unit) {
        kotlin.concurrent.thread {
            val result = try {
                val c = java.net.URL(request.url).openConnection() as java.net.HttpURLConnection
                c.requestMethod = request.method
                c.connectTimeout = 15000
                c.readTimeout = 30000
                for ((k, v) in request.headers) c.setRequestProperty(k, v)
                request.body?.let { c.doOutput = true; c.outputStream.use { o -> o.write(it.toByteArray()) } }
                val status = c.responseCode
                val stream = if (status >= 400) c.errorStream else c.inputStream
                HttpResult(status, stream?.use { it.readBytes() } ?: ByteArray(0), null)
            } catch (e: Exception) {
                HttpResult(0, ByteArray(0), e.message ?: e.toString())
            }
            main.post { done(result) }
        }
    }

    override fun requestFrame(callback: (Double) -> Unit): Int {
        val id = nextTimer++
        val c = android.view.Choreographer.getInstance()
        val frame = android.view.Choreographer.FrameCallback { timers.remove(id); callback(now()) }
        timers[id] = Runnable { c.removeFrameCallback(frame) }
        c.postFrameCallback(frame)
        return id
    }

    override fun cancelFrame(frame: Int) { timers.remove(frame)?.run() }

    override fun setImage(view: ViewId, bytes: ByteArray) {
        (v(view) as? ImageView)?.setImageBitmap(if (bytes.isEmpty()) null else android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.size))
    }

    override fun adopt(native: Any): ViewId {
        val id = create(ViewKind.Native)
        (v(id) as ViewGroup).addView(native as View)
        return id
    }

    override fun handleOf(view: ViewId): Any = v(view).let { if (it.slot.kind == ViewKind.Native) (it as ViewGroup).getChildAt(0) else it }

    // ---- controls

    override fun setValue(view: ViewId, text: String) { (v(view) as? EditText)?.let { if (it.text.toString() != text) write { it.setText(text) } } }
    override fun setPlaceholder(view: ViewId, text: String) { (v(view) as? EditText)?.hint = text }
    override fun setChecked(view: ViewId, checked: Boolean) { (v(view) as? CheckBox)?.let { if (it.isChecked != checked) write { it.isChecked = checked } } }
    override fun setEnabled(view: ViewId, enabled: Boolean) { v(view).isEnabled = enabled }
    override fun setInputType(view: ViewId, inputType: String) {
        (v(view) as? EditText)?.inputType = when (inputType) {
            "password" -> InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            "email" -> InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
            "number" -> InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_DECIMAL
            else -> InputType.TYPE_CLASS_TEXT
        }
    }
    override fun setLabel(view: ViewId, label: String) { v(view).contentDescription = label }
    override fun controlText(view: ViewId): String = (v(view) as? EditText)?.text?.toString() ?: ""
    override fun controlChecked(view: ViewId): Boolean = (v(view) as? CheckBox)?.isChecked ?: false
    override fun openUrl(url: String) {
        runCatching { activity.startActivity(android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url))) }
    }

    override fun listen(view: ViewId, input: InputKind) {
        val v = v(view)
        v.slot.listens.add(input)
        val id = view
        when (input) {
            InputKind.Click -> v.setOnClickListener { Host.event(id, ViewEvent.Click) }
            InputKind.Pointer, InputKind.Pan, InputKind.Pinch, InputKind.LongPress, InputKind.DoubleClick -> touchOf(v, id).enable(input)
            InputKind.Keys -> {
                v.isFocusable = true
                v.isFocusableInTouchMode = true
                v.setOnKeyListener { _, code, event ->
                    if (event.action == android.view.KeyEvent.ACTION_DOWN) Host.key(id, keyName(code, event))
                    false
                }
            }
            InputKind.Scroll -> {
                val scroller = v.slot.content?.parent as? FrameLayout
                scroller?.setOnScrollChangeListener { sv0, x, y, _, _ ->
                    val sv = sv0 as FrameLayout
                    val c = sv.getChildAt(0)
                    Host.scrolled(id, ScrollEvent(y / density.toDouble(), x / density.toDouble(), c.height / density.toDouble(), c.width / density.toDouble(), sv.height / density.toDouble(), sv.width / density.toDouble()))
                }
            }
            InputKind.Hover -> v.setOnHoverListener { _, e ->
                Host.hover(id, e.action != MotionEvent.ACTION_HOVER_EXIT)
                false
            }
            else -> {}
        }
    }

    private fun touchOf(v: View, id: ViewId): Touch = (v.getTag(R_TOUCH) as? Touch) ?: Touch(id, v, density).also { v.setTag(R_TOUCH, it) }

    // ---- layout extras

    override fun makeScrollable(view: ViewId, horizontal: Boolean) {
        val outer = v(view) as NBox
        val content = NBox(activity, density)
        content.tag = Slot(0, ViewKind.Box)
        val scroller: FrameLayout = if (horizontal) android.widget.HorizontalScrollView(activity).apply { isFillViewport = true; isHorizontalScrollBarEnabled = false }
        else ScrollView(activity).apply { isFillViewport = true }
        scroller.addView(content, FrameLayout.LayoutParams(FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT))
        outer.addView(scroller)
        outer.slot.content = content
    }

    override fun setContentSize(view: ViewId, width: Int, height: Int) {
        val c = v(view).slot.content ?: return
        c.slot.frame = Rect(0, 0, width, height)
        c.requestLayout()
    }

    override fun reorder(parent: ViewId, children: IntArray) {
        val p = (v(parent).slot.content ?: v(parent)) as ViewGroup
        val wanted = children.map { v(it) }
        if (p.childCount != wanted.size) return
        p.removeAllViews()
        for (c in wanted) p.addView(c)
    }

    // ---- windows

    override fun showScreen(root: ViewId) {
        val s = ScreenView(activity, density, v(root), false)
        screen = s
        rootLayout.addView(s, 0, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
    }

    override fun showOverlay(root: ViewId) {
        val s = ScreenView(activity, density, v(root), true)
        overlays.add(s)
        rootLayout.addView(s, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
    }

    override fun requestLayout() {
        if (layoutQueued) return
        layoutQueued = true
        main.post {
            layoutQueued = false
            screen?.requestLayout()
            for (o in overlays) o.requestLayout()
            rootLayout.requestLayout()
        }
    }

    override fun windowWidth(): Float {
        val w = if (rootLayout.width > 0) rootLayout.width - rootLayout.paddingLeft - rootLayout.paddingRight else activity.resources.displayMetrics.widthPixels
        return w / density
    }

    // ---- the main loop

    override fun setTimer(ms: Int, callback: () -> Unit): Int {
        val id = nextTimer++
        val r = Runnable { timers.remove(id); callback() }
        timers[id] = r
        main.postDelayed(r, ms.toLong())
        return id
    }

    override fun clearTimer(timer: Int) { timers.remove(timer)?.let { main.removeCallbacks(it) } }
    override fun log(line: String) { Log.i("nuclo", line) }
    override fun now(): Double = System.currentTimeMillis().toDouble()
    override fun env(name: String): String? = activity.intent?.getStringExtra(name)
    override fun exit(code: Int) { activity.finishAndRemoveTask() }
}
