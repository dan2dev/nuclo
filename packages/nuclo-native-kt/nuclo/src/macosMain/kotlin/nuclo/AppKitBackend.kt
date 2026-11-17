package nuclo

import kotlinx.cinterop.*
import nuclo.host.*
import platform.AppKit.*
import platform.CoreGraphics.*
import platform.Foundation.*
import platform.darwin.NSObject
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.min

/** The macOS backend: every ViewId is an NSView in a flipped, layer-backed tree. Text and buttons draw themselves,
 *  so a click lands on the view that owns it. Frames are law: no auto layout anywhere. */
internal class NView : NSView {
    @OverrideInit constructor(frame: CValue<CGRect>) : super(frame)

    var id: ViewId = 0
    var backend: AppKitBackend? = null
    var kind: ViewKind = ViewKind.Box
    var paint: Paint? = null
    var text: String = ""
    var attributed: NSAttributedString? = null
    /** The view children are added to: itself, or a scroll view's document view. */
    var content: NSView = this
    var listens = HashSet<InputKind>()
    var pressed = false
    var takesPointer = true
    /** An inner control (input, textarea) the paint positions inside the insets. */
    var inner: NSView? = null
    /** The control inside (NSTextField, NSTextView, NSButton) and what keeps its target and observers alive. */
    var control: Any? = null
    val keep = ArrayList<Any>()
    var scroller: NSScrollView? = null
    var image: NSImage? = null
    var tracking = false

    override fun isFlipped() = true
    override fun acceptsFirstMouse(event: NSEvent?) = true

    override fun hitTest(point: CValue<CGPoint>): NSView? = if (!takesPointer) null else super.hitTest(point)

    override fun drawRect(dirtyRect: CValue<CGRect>) {
        val p = paint ?: return
        if (kind == ViewKind.Image) {
            val img = image ?: return
            val (w, h) = bounds.useContents { size.width to size.height }
            val (iw, ih) = img.size.useContents { width to height }
            val r = fitImage(iw, ih, w, h, p.fit)
            NSGraphicsContext.saveGraphicsState()
            NSRectClip(CGRectMake(0.0, 0.0, w, h))
            img.drawInRect(CGRectMake(r[0], r[1], r[2], r[3]), fromRect = NSZeroRect.readValue(), operation = NSCompositingOperation.NSCompositingOperationSourceOver, fraction = 1.0, respectFlipped = true, hints = null)
            NSGraphicsContext.restoreGraphicsState()
            return
        }
        if (kind != ViewKind.Text && kind != ViewKind.Button) return
        val a = attributed ?: return
        if (text.isEmpty()) return
        val ins = p.insets
        val w = bounds.useContents { size.width }
        val h = bounds.useContents { size.height }
        val cw = w - ins[1] - ins[3]
        var ch = h - ins[0] - ins[2]
        var y = ins[0].toDouble()
        var opts = NSStringDrawingUsesLineFragmentOrigin
        if (p.text.lines > 0) { ch = min(ch, p.text.lines * p.text.lineHeight.toDouble()); opts = opts or NSStringDrawingTruncatesLastVisibleLine }
        if (kind == ViewKind.Button) {
            val th = a.boundingRectWithSize(CGSizeMake(cw, 100000.0), opts).useContents { size.height }
            y += max(0.0, (h - ins[0] - ins[2] - th) / 2.0)
        }
        a.drawWithRect(CGRectMake(ins[3].toDouble(), y, cw, ch), opts)
    }

    override fun mouseEntered(event: NSEvent) { backend?.hover(id, true) }
    override fun mouseExited(event: NSEvent) { backend?.hover(id, false) }
    override fun mouseMoved(event: NSEvent) { if (InputKind.Pointer in listens) backend?.pointerEvent(this, PointerPhase.Move, event) }

    private var panning = false
    private var startX = 0.0
    private var startY = 0.0
    private var lastX = 0.0
    private var lastY = 0.0
    private var lastTime = 0.0
    private var velX = 0.0
    private var velY = 0.0
    private var longPress: NSTimer? = null
    private var pinchScale = 1.0

    private fun wantsMouse() = listens.any { it == InputKind.Click || it == InputKind.Pointer || it == InputKind.Pan || it == InputKind.LongPress || it == InputKind.DoubleClick }

    override fun acceptsFirstResponder() = InputKind.Keys in listens

    override fun mouseDown(event: NSEvent) {
        val b = backend
        if (b == null || !wantsMouse()) { super.mouseDown(event); return }
        pressed = true
        panning = false
        if (InputKind.Keys in listens) window?.makeFirstResponder(this)
        val p = event.locationInWindow.useContents { x to y }
        startX = p.first; startY = -p.second; lastX = startX; lastY = startY; lastTime = event.timestamp; velX = 0.0; velY = 0.0
        if (InputKind.Pointer in listens || InputKind.Click in listens) b.pointerEvent(this, PointerPhase.Down, event)
        if (event.clickCount == 2L && InputKind.DoubleClick in listens) b.pointerEvent(this, PointerPhase.DoubleClick, event)
        if (InputKind.LongPress in listens) {
            longPress = NSTimer.scheduledTimerWithTimeInterval(0.5, false) { _ -> if (pressed && !panning) b.pointerEvent(this, PointerPhase.LongPress, event) }
        }
    }

    override fun mouseDragged(event: NSEvent) {
        val b = backend
        if (b == null || !pressed) { super.mouseDragged(event); return }
        if (InputKind.Pointer in listens) b.pointerEvent(this, PointerPhase.Move, event)
        if (InputKind.Pan in listens) {
            val (x, wy) = event.locationInWindow.useContents { x to y }
            val y = -wy
            val dt = event.timestamp - lastTime
            if (dt > 0) { velX = (x - lastX) / dt; velY = (y - lastY) / dt }
            lastX = x; lastY = y; lastTime = event.timestamp
            if (!panning) {
                if (kotlin.math.hypot(x - startX, y - startY) >= 8.0) {
                    panning = true
                    longPress?.invalidate()
                    // the translation counts from where the drag was recognized, so the view does not jump
                    startX = x; startY = y
                    b.panEvent(this, "start", event, 0.0, 0.0, 0.0, 0.0)
                }
            } else b.panEvent(this, "move", event, x - startX, y - startY, velX, velY)
        }
    }

    override fun mouseUp(event: NSEvent) {
        val b = backend
        if (b == null || !pressed) { super.mouseUp(event); return }
        pressed = false
        longPress?.invalidate()
        val p = convertPoint(event.locationInWindow, fromView = null)
        val (px, py) = p.useContents { x to y }
        val (bw, bh) = bounds.useContents { size.width to size.height }
        val inside = px >= 0 && py >= 0 && px <= bw && py <= bh
        if (panning) {
            panning = false
            val (x, wy) = event.locationInWindow.useContents { x to y }
            b.panEvent(this, "end", event, x - startX, -wy - startY, velX, velY)
        }
        if (InputKind.Pointer in listens || InputKind.Click in listens) b.pointerEvent(this, PointerPhase.Up, event)
        if (inside && InputKind.Click in listens && !(InputKind.Pan in listens && kotlin.math.hypot(lastX - startX, lastY - startY) >= 8.0)) b.click(id)
    }

    override fun magnifyWithEvent(event: NSEvent) {
        val b = backend
        if (b == null || InputKind.Pinch !in listens) { super.magnifyWithEvent(event); return }
        val p = convertPoint(event.locationInWindow, fromView = null).useContents { x to y }
        val phase = event.phase
        when {
            phase and NSEventPhaseBegan != 0uL -> { pinchScale = 1.0; Host.pinch(id, PinchEvent("start", 1.0, p.first, p.second)) }
            phase and NSEventPhaseEnded != 0uL -> Host.pinch(id, PinchEvent("end", pinchScale, p.first, p.second))
            phase and NSEventPhaseCancelled != 0uL -> Host.pinch(id, PinchEvent("cancel", pinchScale, p.first, p.second))
            else -> { pinchScale *= 1.0 + event.magnification; Host.pinch(id, PinchEvent("move", pinchScale, p.first, p.second)) }
        }
    }

    override fun keyDown(event: NSEvent) {
        if (InputKind.Keys !in listens) { super.keyDown(event); return }
        val name = when (event.keyCode.toInt()) {
            36, 76 -> "Enter"; 53 -> "Escape"; 51 -> "Backspace"; 117 -> "Delete"; 48 -> "Tab"
            123 -> "ArrowLeft"; 124 -> "ArrowRight"; 125 -> "ArrowDown"; 126 -> "ArrowUp"
            else -> event.characters ?: ""
        }
        Host.key(id, name)
    }
}

internal class ActionTarget(private val run: () -> Unit) : NSObject() {
    @ObjCAction fun fire(sender: NSObject?) { run() }
}

internal class AppKitBackend(private val window: NSWindow) : Backend {
    private val views = HashMap<ViewId, NView>()
    private var nextId = 1
    private val timers = HashMap<Int, NSTimer>()
    private var nextTimer = 1
    private var layoutQueued = false
    private val contentView = NView(CGRectMake(0.0, 0.0, 420.0, 780.0))
    private var screen: NSScrollView? = null
    private var screenRoot: ViewId = 0
    private val overlays = ArrayList<ViewId>()

    init {
        contentView.backend = this
        contentView.wantsLayer = true
        window.contentView = contentView
    }

    private fun v(id: ViewId) = views[id] ?: error("appkit: no view $id")

    // ---- views

    override fun create(kind: ViewKind): ViewId {
        val id = nextId++
        val view = NView(CGRectMake(0.0, 0.0, 0.0, 0.0))
        view.id = id
        view.backend = this
        view.kind = kind
        view.wantsLayer = true
        views[id] = view
        when (kind) {
            ViewKind.Input -> makeField(view)
            ViewKind.Checkbox -> makeCheckbox(view)
            ViewKind.Textarea -> makeTextarea(view)
            else -> {}
        }
        return id
    }

    private fun observe(view: NView, name: String?, source: Any?, event: ViewEvent) {
        val token = NSNotificationCenter.defaultCenter.addObserverForName(name, source, null) { _ -> Host.event(view.id, event) }
        view.keep.add(token)
    }

    private fun makeField(view: NView) {
        val field = NSTextField(CGRectMake(0.0, 0.0, 0.0, 0.0))
        field.setBezeled(false)
        field.setDrawsBackground(false)
        field.setFocusRingType(NSFocusRingTypeNone)
        field.setEditable(true)
        val target = ActionTarget { Host.event(view.id, ViewEvent.Change) }
        field.setTarget(target)
        field.setAction(NSSelectorFromString("fire:"))
        view.keep.add(target)
        observe(view, NSControlTextDidChangeNotification, field, ViewEvent.Input)
        observe(view, NSControlTextDidBeginEditingNotification, field, ViewEvent.Focus)
        observe(view, NSControlTextDidEndEditingNotification, field, ViewEvent.Blur)
        view.addSubview(field)
        view.inner = field
        view.control = field
    }

    private fun makeCheckbox(view: NView) {
        val box = NSButton(CGRectMake(0.0, 0.0, 20.0, 20.0))
        box.setButtonType(NSButtonTypeSwitch)
        box.setTitle("")
        val target = ActionTarget { Host.event(view.id, ViewEvent.Change) }
        box.setTarget(target)
        box.setAction(NSSelectorFromString("fire:"))
        view.keep.add(target)
        view.addSubview(box)
        view.inner = box
        view.control = box
    }

    private fun makeTextarea(view: NView) {
        val scroll = NSScrollView(CGRectMake(0.0, 0.0, 0.0, 0.0))
        scroll.setDrawsBackground(false)
        scroll.setHasVerticalScroller(false)
        val text = NSTextView(CGRectMake(0.0, 0.0, 100.0, 100.0))
        text.setDrawsBackground(false)
        text.setRichText(false)
        text.setVerticallyResizable(true)
        text.setTextContainerInset(NSMakeSize(0.0, 0.0))
        text.textContainer?.setLineFragmentPadding(0.0)
        scroll.setDocumentView(text)
        observe(view, NSTextDidChangeNotification, text, ViewEvent.Input)
        observe(view, NSTextDidBeginEditingNotification, text, ViewEvent.Focus)
        observe(view, NSTextDidEndEditingNotification, text, ViewEvent.Blur)
        view.addSubview(scroll)
        view.inner = scroll
        view.control = text
    }

    /** Puts an inner control inside the padding and border (a checkbox fills the frame). */
    private fun layoutInner(v: NView) {
        val inner = v.inner ?: return
        val (w, h) = v.bounds.useContents { size.width to size.height }
        val ins = v.paint?.insets
        if (v.kind == ViewKind.Checkbox || v.kind == ViewKind.Native || ins == null) { inner.setFrame(CGRectMake(0.0, 0.0, w, h)); return }
        inner.setFrame(CGRectMake(ins[3].toDouble(), ins[0].toDouble(), max(0.0, w - ins[1] - ins[3]), max(0.0, h - ins[0] - ins[2])))
        (v.control as? NSTextView)?.let { it.setFrame(CGRectMake(0.0, 0.0, max(0.0, w - ins[1] - ins[3]), max(h, it.frame.useContents { size.height }))) }
    }

    private fun styleControl(v: NView, p: Paint) {
        val font = fontFor(p.text)
        val color = nsColor(p.text.color)
        val align = when (p.text.align) { 1 -> NSTextAlignmentCenter; 2 -> NSTextAlignmentRight; else -> NSTextAlignmentLeft }
        (v.control as? NSTextField)?.let { f ->
            f.setFont(font); f.setTextColor(color); f.setAlignment(align)
            applyPlaceholder(f, p)
        }
        (v.control as? NSTextView)?.let { t -> t.setFont(font); t.setTextColor(color); t.setAlignment(align) }
    }

    private fun applyPlaceholder(f: NSTextField, p: Paint) {
        val v = views.values.firstOrNull { it.control === f } ?: return
        if (v.text.isEmpty()) return
        val attrs = HashMap<Any?, Any?>()
        attrs[NSFontAttributeName] = fontFor(p.text)
        attrs[NSForegroundColorAttributeName] = nsColor(p.text.placeholderColor ?: 0x757575ffu)
        f.setPlaceholderAttributedString(NSAttributedString.create(string = v.text, attributes = attrs))
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
        for (old in p.subviews.toList()) if (old is NView && old !in keep) old.removeFromSuperview()
        for (c in wanted) if (c.superview !== p) p.addSubview(c)
        val current = p.subviews
        if (current.size != wanted.size || current.indices.any { current[it] !== wanted[it] }) p.setSubviews(wanted)
    }

    override fun setFrame(view: ViewId, frame: Rect) {
        val v = v(view)
        v.setFrame(CGRectMake(frame.x.toDouble(), frame.y.toDouble(), frame.w.toDouble(), frame.h.toDouble()))
        v.scroller?.setFrame(CGRectMake(0.0, 0.0, frame.w.toDouble(), frame.h.toDouble()))
        v.paint?.let { applyPaint(v, it) }
        layoutInner(v)
        v.setNeedsDisplay(true)
    }

    override fun frameOf(view: ViewId): Rect {
        val r = v(view).frame
        return r.useContents { Rect(kotlin.math.round(origin.x).toInt(), kotlin.math.round(origin.y).toInt(), kotlin.math.round(size.width).toInt(), kotlin.math.round(size.height).toInt()) }
    }

    override fun paint(view: ViewId, kind: ViewKind, paint: Paint) {
        val v = v(view)
        v.paint = paint
        v.takesPointer = paint.pointer && paint.visible
        if (kind == ViewKind.Text || kind == ViewKind.Button) v.attributed = attributedText(v.text, paint.text, kind == ViewKind.Button)
        applyPaint(v, paint)
        styleControl(v, paint)
        layoutInner(v)
        v.setNeedsDisplay(true)
    }

    private fun applyPaint(v: NView, paint: Paint) {
        val layer = v.layer ?: return
        val (w, h) = v.bounds.useContents { size.width to size.height }
        paintLayer(layer, paint, w, h)
        // AppKit rewrites a layer-backed view's transform as it lays out: set it again after every frame and paint. The
        // transform turns about the view's centre, as UIKit's does.
        if (paint.translateX != 0f || paint.translateY != 0f || paint.rotate != 0f || paint.scale != 1f) {
            var t = CGAffineTransformMakeTranslation(-w / 2, -h / 2)
            t = CGAffineTransformScale(t, paint.scale.toDouble(), paint.scale.toDouble())
            t = CGAffineTransformRotate(t, paint.rotate.toDouble() * kotlin.math.PI / 180.0)
            t = CGAffineTransformTranslate(t, paint.translateX.toDouble(), paint.translateY.toDouble())
            t = CGAffineTransformTranslate(t, w / 2, h / 2)
            layer.setAffineTransform(t)
        } else layer.setAffineTransform(CGAffineTransformIdentity.readValue())
        v.hidden = !paint.visible
    }

    override fun measure(view: ViewId, maxWidth: Float): Size {
        val v = v(view)
        val p = v.paint ?: return Size(0f, 0f)
        return when (v.kind) {
            ViewKind.Text, ViewKind.Button -> {
                val a = v.attributed ?: attributedText(v.text, p.text, false)
                val opts = NSStringDrawingUsesLineFragmentOrigin
                val r = a.boundingRectWithSize(CGSizeMake(maxWidth.toDouble(), 100000.0), opts)
                val (w, h) = r.useContents { size.width to size.height }
                var lines = max(1, kotlin.math.round(h / p.text.lineHeight).toInt())
                if (p.text.lines > 0) lines = min(lines, p.text.lines)
                Size(ceil(w).toFloat(), lines * p.text.lineHeight)
            }
            ViewKind.Checkbox -> Size(20f, 20f)
            ViewKind.Textarea -> {
                val text = (v.control as? NSTextView)?.string ?: ""
                val a = attributedText(if (text.isEmpty()) "Ag" else text, p.text, false)
                val h = a.boundingRectWithSize(CGSizeMake(maxWidth.toDouble(), 100000.0), NSStringDrawingUsesLineFragmentOrigin).useContents { size.height }
                Size(maxWidth, max(3f * p.text.lineHeight, h.toFloat()))
            }
            ViewKind.Input -> Size(maxWidth, p.text.lineHeight)
            else -> Size(min(maxWidth, 100f), p.text.lineHeight)
        }
    }

    override fun http(request: HttpRequest, done: (HttpResult) -> Unit) = appleHttp(request, done)

    override fun setImage(view: ViewId, bytes: ByteArray) {
        val v = v(view)
        v.image = if (bytes.isEmpty()) null else NSImage(data = bytes.toNSData())
        v.setNeedsDisplay(true)
    }

    override fun adopt(native: Any): ViewId {
        val id = create(ViewKind.Native)
        val view = v(id)
        view.addSubview(native as NSView)
        view.inner = native
        view.control = native
        return id
    }

    override fun handleOf(view: ViewId): Any = v(view).let { it.control ?: it }

    // ---- controls

    override fun setValue(view: ViewId, text: String) {
        val v = v(view)
        (v.control as? NSTextField)?.let { if (it.stringValue != text) it.setStringValue(text) }
        (v.control as? NSTextView)?.let { if (it.string != text) it.setString(text) }
    }

    override fun setPlaceholder(view: ViewId, text: String) {
        val v = v(view)
        v.text = text
        val f = v.control as? NSTextField ?: return
        f.setPlaceholderString(text)
        v.paint?.let { applyPlaceholder(f, it) }
    }

    override fun setChecked(view: ViewId, checked: Boolean) { (v(view).control as? NSButton)?.setState(if (checked) NSControlStateValueOn else NSControlStateValueOff) }
    override fun setEnabled(view: ViewId, enabled: Boolean) {
        (v(view).control as? NSControl)?.setEnabled(enabled)
        (v(view).control as? NSTextView)?.setEditable(enabled)
    }
    override fun setInputType(view: ViewId, inputType: String) {}
    override fun setLabel(view: ViewId, label: String) { (v(view).control as? NSView ?: v(view)).setAccessibilityLabel(label) }
    override fun controlText(view: ViewId): String = (v(view).control as? NSTextField)?.stringValue ?: (v(view).control as? NSTextView)?.string ?: ""
    override fun controlChecked(view: ViewId): Boolean = (v(view).control as? NSButton)?.state == NSControlStateValueOn
    override fun openUrl(url: String) { NSURL.URLWithString(url)?.let { NSWorkspace.sharedWorkspace.openURL(it) } }

    override fun setText(view: ViewId, text: String) {
        val v = v(view)
        v.text = text
        v.paint?.let { v.attributed = attributedText(text, it.text, v.kind == ViewKind.Button) }
        v.setNeedsDisplay(true)
    }

    override fun listen(view: ViewId, input: InputKind) {
        val v = v(view)
        v.listens.add(input)
        if (input == InputKind.Hover && !v.tracking) {
            v.tracking = true
            v.addTrackingArea(NSTrackingArea(CGRectMake(0.0, 0.0, 0.0, 0.0),
                NSTrackingMouseEnteredAndExited or NSTrackingActiveInKeyWindow or NSTrackingInVisibleRect, v, null))
        }
        if (input == InputKind.Pointer && !v.tracking) {
            v.tracking = true
            v.addTrackingArea(NSTrackingArea(CGRectMake(0.0, 0.0, 0.0, 0.0),
                NSTrackingMouseMoved or NSTrackingActiveInKeyWindow or NSTrackingInVisibleRect, v, null))
        }
        if (input == InputKind.Scroll) v.scroller?.let { sc ->
            val id = v.id
            watchScroll(sc) { top, left, cw, ch, dw, dh -> Host.scrolled(id, ScrollEvent(top, left, dh, dw, ch, cw)) }
        }
    }

    fun hover(id: ViewId, over: Boolean) = Host.hover(id, over)

    fun panEvent(view: NView, state: String, event: NSEvent, tx: Double, ty: Double, vx: Double, vy: Double) {
        val (lx, ly) = view.convertPoint(event.locationInWindow, fromView = null).useContents { x to y }
        Host.pan(view.id, PanEvent(state, tx, ty, vx, vy, lx, ly))
    }

    /** A scrolling box (or the screen) reports its scroll position as its clip view's bounds move. */
    private fun watchScroll(scroll: NSScrollView, report: (top: Double, left: Double, viewW: Double, viewH: Double, docW: Double, docH: Double) -> Unit) {
        scroll.contentView().setPostsBoundsChangedNotifications(true)
        val token = NSNotificationCenter.defaultCenter.addObserverForName(NSViewBoundsDidChangeNotification, scroll.contentView(), null) { _ ->
            val (ox, oy) = scroll.contentView().bounds.useContents { origin.x to origin.y }
            val (cw, ch) = scroll.contentView().bounds.useContents { size.width to size.height }
            val (dw, dh) = (scroll.documentView?.frame ?: CGRectMake(0.0, 0.0, 0.0, 0.0)).useContents { size.width to size.height }
            report(oy, ox, cw, ch, dw, dh)
        }
        observers.add(token)
    }
    private val observers = ArrayList<Any>()

    // ---- layout extras

    override fun makeScrollable(view: ViewId, horizontal: Boolean) {
        val v = v(view)
        val scroll = NSScrollView(CGRectMake(0.0, 0.0, 0.0, 0.0))
        scroll.setDrawsBackground(false)
        scroll.setHasVerticalScroller(!horizontal)
        scroll.setHasHorizontalScroller(horizontal)
        scroll.setAutohidesScrollers(true)
        val doc = NView(CGRectMake(0.0, 0.0, 0.0, 0.0))
        doc.wantsLayer = true
        scroll.setDocumentView(doc)
        v.addSubview(scroll)
        v.scroller = scroll
        v.content = doc
    }

    override fun setContentSize(view: ViewId, width: Int, height: Int) {
        v(view).content.setFrame(CGRectMake(0.0, 0.0, width.toDouble(), height.toDouble()))
    }

    override fun reorder(parent: ViewId, children: IntArray) {
        val p = v(parent).content
        val wanted = children.map { v(it) }
        if (p.subviews.size == wanted.size) p.setSubviews(wanted)
    }

    // ---- windows

    override fun showScreen(root: ViewId) {
        screenRoot = root
        val scroll = NSScrollView(contentView.bounds)
        scroll.hasVerticalScroller = true
        scroll.autohidesScrollers = true
        scroll.drawsBackground = false
        scroll.autoresizingMask = NSViewWidthSizable or NSViewHeightSizable
        scroll.documentView = v(root)
        contentView.addSubview(scroll)
        watchScroll(scroll) { top, _, _, ch, _, _ -> Host.screenScrolled(root, top.toFloat(), ch.toFloat()) }
        screen = scroll
        requestLayout()
    }

    override fun showOverlay(root: ViewId) {
        overlays.add(root)
        contentView.addSubview(v(root))
        requestLayout()
    }

    override fun requestLayout() {
        if (layoutQueued) return
        layoutQueued = true
        onMain { layoutQueued = false; layoutPass() }
    }

    /** Called when the window resizes, and after requestLayout. */
    fun layoutPass() {
        val (w, h) = contentView.bounds.useContents { size.width to size.height }
        screen?.let { s ->
            s.setFrame(CGRectMake(0.0, 0.0, w, h))
            val width = s.contentSize.useContents { width }
            val root = v(screenRoot)
            val natural = Host.measureRoot(screenRoot, width.toFloat())
            val height = max(natural.toDouble(), h)
            root.setFrame(CGRectMake(0.0, 0.0, width, height))
            root.paint?.let { applyPaint(root, it) }
            Host.layoutRoot(screenRoot, width.toFloat(), height.toFloat())
        }
        for (o in overlays) {
            val ov = views[o] ?: continue
            ov.setFrame(CGRectMake(0.0, 0.0, w, h))
            ov.paint?.let { applyPaint(ov, it) }
            Host.layoutRoot(o, w.toFloat(), h.toFloat())
        }
    }

    fun windowSizeChanged() = requestLayout()

    override fun windowWidth(): Float = contentView.bounds.useContents { size.width.toFloat() }

    // ---- the main loop

    override fun setTimer(ms: Int, callback: () -> Unit): Int {
        val id = nextTimer++
        val timer = NSTimer.scheduledTimerWithTimeInterval(ms / 1000.0, false) { _ ->
            timers.remove(id)
            callback()
        }
        timers[id] = timer
        return id
    }

    override fun clearTimer(timer: Int) { timers.remove(timer)?.invalidate() }
    override fun log(line: String) { println(line) }
    override fun now(): Double = appleNow()
    override fun env(name: String): String? = appleEnv(name)
    override fun exit(code: Int) { platform.posix.exit(code) }

    // ---- input from NView

    fun click(id: ViewId) = Host.event(id, ViewEvent.Click)

    fun pointerEvent(view: NView, phase: PointerPhase, event: NSEvent) {
        val p = view.convertPoint(event.locationInWindow, fromView = null)
        val (lx, ly) = p.useContents { x to y }
        val (wx, wy) = event.locationInWindow.useContents { x to y }
        Host.pointer(view.id, phase, PointerEvent(lx, ly, wx, wy, 0))
    }
}

/** An attributed string in the text paint: font, colour, line height, alignment, letter spacing, decoration. */
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
    attrs[NSForegroundColorAttributeName] = nsColor(p.color)
    attrs[NSBaselineOffsetAttributeName] = (p.lineHeight - natural) / 2.0 
    if (p.letterSpacing != 0f) attrs[NSKernAttributeName] = p.letterSpacing.toDouble()
    if (p.underline) attrs[NSUnderlineStyleAttributeName] = NSUnderlineStyleSingle
    if (p.strike) attrs[NSStrikethroughStyleAttributeName] = NSUnderlineStyleSingle
    return NSAttributedString.create(string = text, attributes = attrs)
}

internal fun nsColor(rgba: UInt): NSColor = NSColor.colorWithSRGBRed(
    ((rgba shr 24) and 0xffu).toDouble() / 255.0, ((rgba shr 16) and 0xffu).toDouble() / 255.0,
    ((rgba shr 8) and 0xffu).toDouble() / 255.0, (rgba and 0xffu).toDouble() / 255.0,
)

private fun weightOf(css: Int): Double = when {
    css <= 300 -> NSFontWeightLight
    css >= 700 -> NSFontWeightBold
    css >= 600 -> NSFontWeightSemibold
    css >= 500 -> NSFontWeightMedium
    else -> NSFontWeightRegular
}

internal fun fontFor(p: TextPaint): NSFont {
    val size = p.fontSize.toDouble()
    var font: NSFont = when (p.family) {
        "monospace" -> NSFont.monospacedSystemFontOfSize(size, weightOf(p.weight))
        "serif" -> NSFont.fontWithName("Times New Roman", size) ?: NSFont.systemFontOfSize(size, weightOf(p.weight))
        "sans-serif" -> NSFont.systemFontOfSize(size, weightOf(p.weight))
        else -> NSFont.fontWithName(p.family, size) ?: NSFont.systemFontOfSize(size, weightOf(p.weight))
    }
    if (p.italic) font = NSFontManager.sharedFontManager.convertFont(font, toHaveTrait = NSItalicFontMask)
    return font
}
