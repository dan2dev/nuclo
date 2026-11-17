package nuclo

import kotlinx.cinterop.*
import nuclo.host.*
import platform.CoreGraphics.*
import platform.Foundation.*
import platform.UIKit.*
import platform.darwin.NSObject
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.min

/** The iOS backend: every ViewId is a UIView with its frame set directly (no auto layout). Text and buttons draw
 *  themselves, so a touch lands on the view that owns it. */
internal class UView : UIView {
    @OverrideInit constructor(frame: CValue<CGRect>) : super(frame)

    var id: ViewId = 0
    var backend: UIKitBackend? = null
    var kind: ViewKind = ViewKind.Box
    var paint: Paint? = null
    var text: String = ""
    var attributed: NSAttributedString? = null
    var content: UIView = this
    var listens = HashSet<InputKind>()
    var pressed = false
    var takesPointer = true
    var control: Any? = null
    var placeholder = ""
    var scroller: UIScrollView? = null
    var image: UIImage? = null
    val keep = ArrayList<Any>()

    override fun hitTest(point: CValue<CGPoint>, withEvent: UIEvent?): UIView? = if (!takesPointer) null else super.hitTest(point, withEvent)

    override fun drawRect(rect: CValue<CGRect>) {
        val p = paint ?: return
        if (kind == ViewKind.Image) {
            val img = image ?: return
            val (w, h) = bounds.useContents { size.width to size.height }
            val (iw, ih) = img.size.useContents { width to height }
            val r = fitImage(iw, ih, w, h, p.fit)
            UIRectClip(CGRectMake(0.0, 0.0, w, h))
            img.drawInRect(CGRectMake(r[0], r[1], r[2], r[3]))
            return
        }
        if (kind != ViewKind.Text && kind != ViewKind.Button) return
        val a = attributed ?: return
        if (text.isEmpty()) return
        val ins = p.insets
        val (w, h) = bounds.useContents { size.width to size.height }
        val cw = w - ins[1] - ins[3]
        var ch = h - ins[0] - ins[2]
        var y = ins[0].toDouble()
        var opts = NSStringDrawingUsesLineFragmentOrigin
        if (p.text.lines > 0) { ch = min(ch, p.text.lines * p.text.lineHeight.toDouble()); opts = opts or NSStringDrawingTruncatesLastVisibleLine }
        if (kind == ViewKind.Button) {
            val th = a.boundingRectWithSize(CGSizeMake(cw, 100000.0), opts, null).useContents { size.height }
            y += max(0.0, (h - ins[0] - ins[2] - th) / 2.0)
        }
        a.drawWithRect(CGRectMake(ins[3].toDouble(), y, cw, ch), opts, null)
    }

    private fun pointOf(touches: Set<*>): Pair<CGPoint, CGPoint>? = null

    override fun touchesBegan(touches: Set<*>, withEvent: UIEvent?) {
        val b = backend
        if (b == null || (InputKind.Pointer !in listens && InputKind.Click !in listens)) { super.touchesBegan(touches, withEvent); return }
        pressed = true
        b.touch(this, PointerPhase.Down, touches.firstOrNull() as? UITouch)
    }

    override fun touchesEnded(touches: Set<*>, withEvent: UIEvent?) {
        val b = backend
        if (b == null || !pressed) { super.touchesEnded(touches, withEvent); return }
        pressed = false
        val t = touches.firstOrNull() as? UITouch
        val inside = t?.locationInView(this)?.useContents {
            val (bw, bh) = bounds.useContents { size.width to size.height }
            x >= 0 && y >= 0 && x <= bw && y <= bh
        } ?: false
        b.touch(this, PointerPhase.Up, t)
        if (inside && InputKind.Click in listens) b.click(id)
    }

    override fun touchesMoved(touches: Set<*>, withEvent: UIEvent?) {
        val b = backend
        if (b == null || InputKind.Pointer !in listens) { super.touchesMoved(touches, withEvent); return }
        b.touch(this, PointerPhase.Move, touches.firstOrNull() as? UITouch)
    }

    override fun touchesCancelled(touches: Set<*>, withEvent: UIEvent?) {
        if (!pressed) { super.touchesCancelled(touches, withEvent); return }
        pressed = false
        backend?.touch(this, PointerPhase.Cancel, touches.firstOrNull() as? UITouch)
    }
}

/** An NSObject a gesture recogniser calls back with itself: `fire:`. */
internal class SenderTarget(private val run: (NSObject?) -> Unit) : NSObject() {
    @ObjCAction fun fire(sender: NSObject?) { run(sender) }
}

/** Reports a scroll view's position. */
internal class ScrollWatcher(private val report: (UIScrollView) -> Unit) : NSObject(), UIScrollViewDelegateProtocol {
    override fun scrollViewDidScroll(scrollView: UIScrollView) { report(scrollView) }
}

/** An NSObject a control calls back: `fire:`. */
internal class ActionTarget(private val run: () -> Unit) : NSObject() {
    @ObjCAction fun fire(sender: NSObject?) { run() }
}

internal class NucloViewController : UIViewController {
    @OverrideInit constructor() : super(nibName = null, bundle = null)
    var onLayout: (() -> Unit)? = null
    override fun viewDidLayoutSubviews() { super.viewDidLayoutSubviews(); onLayout?.invoke() }
}

internal class UIKitBackend(private val controller: NucloViewController) : Backend {
    private val views = HashMap<ViewId, UView>()
    private var nextId = 1
    private val timers = AppleTimers()
    private var layoutQueued = false
    private var screen: UIScrollView? = null
    private var screenRoot: ViewId = 0
    private var screenWatcher: ScrollWatcher? = null
    private val overlays = ArrayList<ViewId>()

    init {
        controller.view.backgroundColor = UIColor.whiteColor
        controller.onLayout = { layoutPass() }
    }

    private fun v(id: ViewId) = views[id] ?: error("uikit: no view $id")

    override fun create(kind: ViewKind): ViewId {
        val id = nextId++
        val view = UView(CGRectMake(0.0, 0.0, 0.0, 0.0))
        view.id = id
        view.backend = this
        view.kind = kind
        view.contentMode = UIViewContentMode.UIViewContentModeRedraw
        view.backgroundColor = null
        views[id] = view
        when (kind) {
            ViewKind.Input -> makeField(view)
            ViewKind.Checkbox -> makeSwitch(view)
            ViewKind.Textarea -> makeTextarea(view)
            else -> {}
        }
        return id
    }

    private fun observe(view: UView, name: String?, source: Any?, event: ViewEvent) {
        val token = NSNotificationCenter.defaultCenter.addObserverForName(name, source, null) { _ -> Host.event(view.id, event) }
        view.keep.add(token)
    }

    private fun makeField(view: UView) {
        val field = UITextField(CGRectMake(0.0, 0.0, 0.0, 0.0))
        field.borderStyle = UITextBorderStyle.UITextBorderStyleNone
        field.returnKeyType = UIReturnKeyType.UIReturnKeyDone
        val change = ActionTarget { if (!writing) Host.event(view.id, ViewEvent.Input) }
        val commit = ActionTarget { Host.event(view.id, ViewEvent.Change) }
        val begin = ActionTarget { Host.event(view.id, ViewEvent.Focus) }
        val end = ActionTarget { Host.event(view.id, ViewEvent.Blur) }
        field.addTarget(change, NSSelectorFromString("fire:"), UIControlEventEditingChanged)
        field.addTarget(commit, NSSelectorFromString("fire:"), UIControlEventEditingDidEndOnExit)
        field.addTarget(begin, NSSelectorFromString("fire:"), UIControlEventEditingDidBegin)
        field.addTarget(end, NSSelectorFromString("fire:"), UIControlEventEditingDidEnd)
        view.keep.addAll(listOf(change, commit, begin, end))
        view.addSubview(field)
        view.control = field
    }

    private fun makeSwitch(view: UView) {
        val sw = UISwitch(CGRectMake(0.0, 0.0, 51.0, 31.0))
        val change = ActionTarget { if (!writing) Host.event(view.id, ViewEvent.Change) }
        sw.addTarget(change, NSSelectorFromString("fire:"), UIControlEventValueChanged)
        view.keep.add(change)
        view.addSubview(sw)
        view.control = sw
    }

    private fun makeTextarea(view: UView) {
        val text = UITextView(CGRectMake(0.0, 0.0, 0.0, 0.0))
        text.backgroundColor = null
        text.scrollEnabled = false
        text.textContainerInset = UIEdgeInsetsZero.readValue()
        text.textContainer.lineFragmentPadding = 0.0
        observe(view, UITextViewTextDidChangeNotification, text, ViewEvent.Input)
        observe(view, UITextViewTextDidBeginEditingNotification, text, ViewEvent.Focus)
        observe(view, UITextViewTextDidEndEditingNotification, text, ViewEvent.Blur)
        view.addSubview(text)
        view.control = text
    }

    /** Set while the core writes a control, so it reports no event. */
    private var writing = false

    private fun layoutInner(v: UView) {
        val c = v.control as? UIView ?: return
        val (w, h) = v.bounds.useContents { size.width to size.height }
        if (v.kind == ViewKind.Native) { c.setFrame(CGRectMake(0.0, 0.0, w, h)); return }
        if (v.kind == ViewKind.Checkbox) {
            // a UISwitch has its own size: scale it into the 20 × 20 box
            c.transform = CGAffineTransformIdentity.readValue()
            c.setFrame(CGRectMake(0.0, 0.0, 51.0, 31.0))
            val k = min(w, h) / 51.0
            c.transform = CGAffineTransformMakeScale(k, k)
            c.setCenter(CGPointMake(w / 2, h / 2))
            return
        }
        val ins = v.paint?.insets ?: return
        c.setFrame(CGRectMake(ins[3].toDouble(), ins[0].toDouble(), max(0.0, w - ins[1] - ins[3]), max(0.0, h - ins[0] - ins[2])))
    }

    private fun styleControl(v: UView, p: Paint) {
        val font = fontFor(p.text)
        val color = uiColor(p.text.color)
        val align = when (p.text.align) { 1 -> NSTextAlignmentCenter; 2 -> NSTextAlignmentRight; else -> NSTextAlignmentLeft }
        (v.control as? UITextField)?.let { f ->
            f.font = font; f.textColor = color; f.textAlignment = align
            applyPlaceholder(f, v, p)
        }
        (v.control as? UITextView)?.let { t -> t.font = font; t.textColor = color; t.textAlignment = align }
    }

    private fun applyPlaceholder(f: UITextField, v: UView, p: Paint) {
        if (v.placeholder.isEmpty()) return
        val attrs = HashMap<Any?, Any?>()
        attrs[NSFontAttributeName] = fontFor(p.text)
        attrs[NSForegroundColorAttributeName] = uiColor(p.text.placeholderColor ?: 0x757575ffu)
        f.attributedPlaceholder = NSAttributedString.create(string = v.placeholder, attributes = attrs)
    }

    override fun destroy(view: ViewId) {
        val v = views.remove(view) ?: return
        v.removeFromSuperview()
        v.backend = null
    }

    override fun setChildren(parent: ViewId, children: IntArray) {
        val p = v(parent).content
        val wanted = children.map { v(it) }
        val keep = wanted.toSet()
        for (old in p.subviews.toList()) if (old is UView && old !in keep) old.removeFromSuperview()
        var inOrder = p.subviews.size == wanted.size
        if (inOrder) for (i in wanted.indices) if (p.subviews[i] !== wanted[i]) { inOrder = false; break }
        if (!inOrder) {
            for (c in wanted) c.removeFromSuperview()
            for (c in wanted) p.addSubview(c)
        }
    }

    override fun setFrame(view: ViewId, frame: Rect) {
        val v = v(view)
        v.transform = CGAffineTransformIdentity.readValue()
        v.setFrame(CGRectMake(frame.x.toDouble(), frame.y.toDouble(), frame.w.toDouble(), frame.h.toDouble()))
        v.scroller?.setFrame(CGRectMake(0.0, 0.0, frame.w.toDouble(), frame.h.toDouble()))
        v.paint?.let { applyPaint(v, it) }
        layoutInner(v)
        v.setNeedsDisplay()
    }

    /** From centre and bounds, which a transform leaves alone (`frame` is the transformed box's bounding rectangle). */
    override fun frameOf(view: ViewId): Rect {
        val v = v(view)
        val (cx, cy) = v.center.useContents { x to y }
        val (w, h) = v.bounds.useContents { size.width to size.height }
        return Rect(kotlin.math.round(cx - w / 2).toInt(), kotlin.math.round(cy - h / 2).toInt(), kotlin.math.round(w).toInt(), kotlin.math.round(h).toInt())
    }

    override fun paint(view: ViewId, kind: ViewKind, paint: Paint) {
        val v = v(view)
        v.paint = paint
        v.takesPointer = paint.pointer && paint.visible
        if (kind == ViewKind.Text || kind == ViewKind.Button) v.attributed = attributedText(v.text, paint.text, kind == ViewKind.Button)
        applyPaint(v, paint)
        styleControl(v, paint)
        layoutInner(v)
        v.setNeedsDisplay()
    }

    private fun applyPaint(v: UView, paint: Paint) {
        val (w, h) = v.bounds.useContents { size.width to size.height }
        paintLayer(v.layer, paint, w, h)
        // UIKit turns a transform about the view's centre; the frame (set untransformed) stays what the core said
        var t = CGAffineTransformMakeTranslation(paint.translateX.toDouble(), paint.translateY.toDouble())
        t = CGAffineTransformRotate(t, paint.rotate.toDouble() * kotlin.math.PI / 180.0)
        t = CGAffineTransformScale(t, paint.scale.toDouble(), paint.scale.toDouble())
        v.transform = t
        v.hidden = !paint.visible
    }

    override fun measure(view: ViewId, maxWidth: Float): Size {
        val v = v(view)
        val p = v.paint ?: return Size(0f, 0f)
        return when (v.kind) {
            ViewKind.Text, ViewKind.Button -> {
                val a = v.attributed ?: attributedText(v.text, p.text, false)
                val r = a.boundingRectWithSize(CGSizeMake(maxWidth.toDouble(), 100000.0), NSStringDrawingUsesLineFragmentOrigin, null)
                val (w, h) = r.useContents { size.width to size.height }
                var lines = max(1, kotlin.math.round(h / p.text.lineHeight).toInt())
                if (p.text.lines > 0) lines = min(lines, p.text.lines)
                Size(ceil(w).toFloat(), lines * p.text.lineHeight)
            }
            ViewKind.Checkbox -> Size(20f, 20f)
            ViewKind.Textarea -> {
                val text = (v.control as? UITextView)?.text ?: ""
                val a = attributedText(if (text.isEmpty()) "Ag" else text, p.text, false)
                val h = a.boundingRectWithSize(CGSizeMake(maxWidth.toDouble(), 100000.0), NSStringDrawingUsesLineFragmentOrigin, null).useContents { size.height }
                Size(maxWidth, max(3f * p.text.lineHeight, h.toFloat()))
            }
            ViewKind.Input -> Size(maxWidth, p.text.lineHeight)
            else -> Size(min(maxWidth, 100f), p.text.lineHeight)
        }
    }

    override fun http(request: HttpRequest, done: (HttpResult) -> Unit) = appleHttp(request, done)

    override fun setImage(view: ViewId, bytes: ByteArray) {
        val v = v(view)
        v.image = if (bytes.isEmpty()) null else UIImage.imageWithData(bytes.toNSData())
        v.setNeedsDisplay()
    }

    override fun adopt(native: Any): ViewId {
        val id = create(ViewKind.Native)
        val view = v(id)
        view.addSubview(native as UIView)
        view.control = native
        return id
    }

    override fun handleOf(view: ViewId): Any = v(view).let { it.control ?: it }

    // ---- controls

    private fun write(block: () -> Unit) { writing = true; try { block() } finally { writing = false } }

    override fun setValue(view: ViewId, text: String) {
        val v = v(view)
        (v.control as? UITextField)?.let { if (it.text != text) write { it.text = text } }
        (v.control as? UITextView)?.let { if (it.text != text) write { it.text = text } }
    }

    override fun setPlaceholder(view: ViewId, text: String) {
        val v = v(view)
        v.placeholder = text
        (v.control as? UITextField)?.let { it.placeholder = text; v.paint?.let { p -> applyPlaceholder(it, v, p) } }
    }

    override fun setChecked(view: ViewId, checked: Boolean) { (v(view).control as? UISwitch)?.let { if (it.on != checked) write { it.setOn(checked, false) } } }
    override fun setEnabled(view: ViewId, enabled: Boolean) {
        (v(view).control as? UIControl)?.enabled = enabled
        (v(view).control as? UITextView)?.setEditable(enabled)
    }
    override fun setInputType(view: ViewId, inputType: String) {
        (v(view).control as? UITextField)?.let {
            it.secureTextEntry = inputType == "password"
            it.keyboardType = when (inputType) {
                "email" -> UIKeyboardTypeEmailAddress
                "number" -> UIKeyboardTypeDecimalPad
                else -> UIKeyboardTypeDefault
            }
        }
    }
    override fun setLabel(view: ViewId, label: String) { (v(view).control as? UIView ?: v(view)).accessibilityLabel = label; v(view).isAccessibilityElement = true }
    override fun controlText(view: ViewId): String = (v(view).control as? UITextField)?.text ?: (v(view).control as? UITextView)?.text ?: ""
    override fun controlChecked(view: ViewId): Boolean = (v(view).control as? UISwitch)?.on ?: false
    override fun openUrl(url: String) { NSURL.URLWithString(url)?.let { UIApplication.sharedApplication.openURL(it, emptyMap<Any?, Any?>(), null) } }

    override fun setText(view: ViewId, text: String) {
        val v = v(view)
        v.text = text
        v.paint?.let { v.attributed = attributedText(text, it.text, v.kind == ViewKind.Button) }
        v.setNeedsDisplay()
    }

    override fun listen(view: ViewId, input: InputKind) {
        val v = v(view)
        v.listens.add(input)
        val id = view
        when (input) {
            InputKind.Pan -> {
                val t = SenderTarget { s ->
                    val g = s as? UIPanGestureRecognizer ?: return@SenderTarget
                    val (tx, ty) = g.translationInView(v).useContents { x to y }
                    val (vx, vy) = g.velocityInView(v).useContents { x to y }
                    val (lx, ly) = g.locationInView(v).useContents { x to y }
                    val state = when (g.state) {
                        UIGestureRecognizerStateBegan -> { g.setTranslation(CGPointMake(0.0, 0.0), v); "start" }
                        UIGestureRecognizerStateChanged -> "move"
                        UIGestureRecognizerStateEnded -> "end"
                        else -> "cancel"
                    }
                    Host.pan(id, PanEvent(state, if (state == "start") 0.0 else tx, if (state == "start") 0.0 else ty, vx, vy, lx, ly))
                }
                v.keep.add(t)
                v.addGestureRecognizer(UIPanGestureRecognizer(t, NSSelectorFromString("fire:")))
            }
            InputKind.Pinch -> {
                val t = SenderTarget { s ->
                    val g = s as? UIPinchGestureRecognizer ?: return@SenderTarget
                    val (fx, fy) = g.locationInView(v).useContents { x to y }
                    val state = when (g.state) { UIGestureRecognizerStateBegan -> "start"; UIGestureRecognizerStateChanged -> "move"; UIGestureRecognizerStateEnded -> "end"; else -> "cancel" }
                    Host.pinch(id, PinchEvent(state, g.scale, fx, fy))
                }
                v.keep.add(t)
                v.addGestureRecognizer(UIPinchGestureRecognizer(t, NSSelectorFromString("fire:")))
            }
            InputKind.LongPress -> {
                val t = SenderTarget { s ->
                    val g = s as? UILongPressGestureRecognizer ?: return@SenderTarget
                    if (g.state == UIGestureRecognizerStateBegan) touchPoint(v, g.locationInView(v), PointerPhase.LongPress)
                }
                v.keep.add(t)
                v.addGestureRecognizer(UILongPressGestureRecognizer(t, NSSelectorFromString("fire:")))
            }
            InputKind.DoubleClick -> {
                val t = SenderTarget { s ->
                    val g = s as? UITapGestureRecognizer ?: return@SenderTarget
                    if (g.state == UIGestureRecognizerStateEnded) touchPoint(v, g.locationInView(v), PointerPhase.DoubleClick)
                }
                v.keep.add(t)
                val g = UITapGestureRecognizer(t, NSSelectorFromString("fire:"))
                g.numberOfTapsRequired = 2u
                v.addGestureRecognizer(g)
            }
            InputKind.Scroll -> v.scroller?.let { sc ->
                val w = ScrollWatcher { s ->
                    val (ox, oy) = s.contentOffset.useContents { x to y }
                    val (cw, ch) = s.contentSize.useContents { width to height }
                    val (bw, bh) = s.bounds.useContents { size.width to size.height }
                    Host.scrolled(id, ScrollEvent(oy, ox, ch, cw, bh, bw))
                }
                v.keep.add(w)
                sc.delegate = w
            }
            else -> {}
        }
    }

    private fun touchPoint(v: UView, p: CValue<CGPoint>, phase: PointerPhase) {
        val (x, y) = p.useContents { x to y }
        Host.pointer(v.id, phase, PointerEvent(x, y, x, y, 0))
    }

    // ---- layout extras

    override fun makeScrollable(view: ViewId, horizontal: Boolean) {
        val v = v(view)
        val scroll = UIScrollView(CGRectMake(0.0, 0.0, 0.0, 0.0))
        scroll.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentBehavior.UIScrollViewContentInsetAdjustmentNever
        scroll.showsVerticalScrollIndicator = !horizontal
        scroll.showsHorizontalScrollIndicator = false
        val doc = UView(CGRectMake(0.0, 0.0, 0.0, 0.0))
        scroll.addSubview(doc)
        v.addSubview(scroll)
        v.scroller = scroll
        v.content = doc
    }

    override fun setContentSize(view: ViewId, width: Int, height: Int) {
        val v = v(view)
        v.content.setFrame(CGRectMake(0.0, 0.0, width.toDouble(), height.toDouble()))
        v.scroller?.setContentSize(CGSizeMake(width.toDouble(), height.toDouble()))
    }

    override fun reorder(parent: ViewId, children: IntArray) {
        val p = v(parent).content
        children.map { v(it) }.forEach { it.removeFromSuperview() }
        children.map { v(it) }.forEach { p.addSubview(it) }
    }

    // ---- windows

    override fun showScreen(root: ViewId) {
        screenRoot = root
        val scroll = UIScrollView(controller.view.bounds)
        scroll.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentBehavior.UIScrollViewContentInsetAdjustmentNever
        scroll.addSubview(v(root))
        val watcher = ScrollWatcher { s -> Host.screenScrolled(root, s.contentOffset.useContents { y }.toFloat(), s.bounds.useContents { size.height }.toFloat()) }
        scroll.delegate = watcher
        screenWatcher = watcher
        controller.view.addSubview(scroll)
        screen = scroll
        requestLayout()
    }

    override fun showOverlay(root: ViewId) {
        overlays.add(root)
        controller.view.addSubview(v(root))
        requestLayout()
    }

    override fun requestLayout() {
        if (layoutQueued) return
        layoutQueued = true
        onMain { layoutQueued = false; layoutPass() }
    }

    private fun safeFrame(): CValue<CGRect> {
        val ins = controller.view.safeAreaInsets
        val (w, h) = controller.view.bounds.useContents { size.width to size.height }
        return ins.useContents { CGRectMake(left, top, w - left - right, h - top - bottom) }
    }

    fun layoutPass() {
        val area = safeFrame()
        val (w, h) = area.useContents { size.width to size.height }
        screen?.let { s ->
            s.setFrame(area)
            val root = v(screenRoot)
            val natural = Host.measureRoot(screenRoot, w.toFloat())
            val height = max(natural.toDouble(), h)
            root.setFrame(CGRectMake(0.0, 0.0, w, height))
            root.paint?.let { applyPaint(root, it) }
            s.setContentSize(CGSizeMake(w, height))
            Host.layoutRoot(screenRoot, w.toFloat(), height.toFloat())
        }
        for (o in overlays) {
            val ov = views[o] ?: continue
            ov.setFrame(area)
            ov.paint?.let { applyPaint(ov, it) }
            Host.layoutRoot(o, w.toFloat(), h.toFloat())
        }
    }

    override fun windowWidth(): Float = safeFrame().useContents { size.width.toFloat() }

    // ---- the main loop

    override fun setTimer(ms: Int, callback: () -> Unit): Int = timers.set(ms, callback)
    override fun clearTimer(timer: Int) = timers.clear(timer)
    override fun log(line: String) { println(line) }
    override fun now(): Double = appleNow()
    override fun env(name: String): String? = appleEnv(name)
    override fun exit(code: Int) { platform.posix.exit(code) }

    // ---- input from UView

    fun click(id: ViewId) = Host.event(id, ViewEvent.Click)

    fun touch(view: UView, phase: PointerPhase, t: UITouch?) {
        val (lx, ly) = t?.locationInView(view)?.useContents { x to y } ?: (0.0 to 0.0)
        val (wx, wy) = t?.locationInView(null)?.useContents { x to y } ?: (0.0 to 0.0)
        Host.pointer(view.id, phase, PointerEvent(lx, ly, wx, wy, 0))
    }
}

internal fun attributedText(text: String, p: TextPaint, centered: Boolean): NSAttributedString {
    val font = fontFor(p)
    val style = NSMutableParagraphStyle()
    style.setMinimumLineHeight(p.lineHeight.toDouble())
    style.setMaximumLineHeight(p.lineHeight.toDouble())
    style.setAlignment(if (centered) NSTextAlignmentCenter else when (p.align) { 1 -> NSTextAlignmentCenter; 2 -> NSTextAlignmentRight; else -> NSTextAlignmentLeft })
    style.setLineBreakMode(if (p.lines > 0) NSLineBreakByTruncatingTail else NSLineBreakByWordWrapping)
    val natural = font.ascender - font.descender + font.leading
    val attrs = HashMap<Any?, Any?>()
    attrs[NSFontAttributeName] = font
    attrs[NSParagraphStyleAttributeName] = style
    attrs[NSForegroundColorAttributeName] = uiColor(p.color)
    attrs[NSBaselineOffsetAttributeName] = (p.lineHeight - natural) / 2.0
    if (p.letterSpacing != 0f) attrs[NSKernAttributeName] = p.letterSpacing.toDouble()
    if (p.underline) attrs[NSUnderlineStyleAttributeName] = NSUnderlineStyleSingle
    if (p.strike) attrs[NSStrikethroughStyleAttributeName] = NSUnderlineStyleSingle
    return NSAttributedString.create(string = text, attributes = attrs)
}

internal fun uiColor(rgba: UInt): UIColor = UIColor.colorWithRed(
    ((rgba shr 24) and 0xffu).toDouble() / 255.0, ((rgba shr 16) and 0xffu).toDouble() / 255.0,
    ((rgba shr 8) and 0xffu).toDouble() / 255.0, (rgba and 0xffu).toDouble() / 255.0,
)

private fun weightOf(css: Int): Double = when {
    css <= 300 -> UIFontWeightLight
    css >= 700 -> UIFontWeightBold
    css >= 600 -> UIFontWeightSemibold
    css >= 500 -> UIFontWeightMedium
    else -> UIFontWeightRegular
}

internal fun fontFor(p: TextPaint): UIFont {
    val size = p.fontSize.toDouble()
    var font: UIFont = when (p.family) {
        "monospace" -> UIFont.monospacedSystemFontOfSize(size, weightOf(p.weight))
        "serif" -> UIFont.fontWithName("Times New Roman", size) ?: UIFont.systemFontOfSize(size, weightOf(p.weight))
        "sans-serif" -> UIFont.systemFontOfSize(size, weightOf(p.weight))
        else -> UIFont.fontWithName(p.family, size) ?: UIFont.systemFontOfSize(size, weightOf(p.weight))
    }
    if (p.italic) font.fontDescriptor.fontDescriptorWithSymbolicTraits(UIFontDescriptorTraitItalic)?.let { font = UIFont.fontWithDescriptor(it, size) }
    return font
}
