@file:OptIn(kotlin.native.concurrent.ObsoleteWorkersApi::class)

package nuclo

import kotlinx.cinterop.*
import nuclo.host.Backend
import nuclo.host.Host
import nuclo.PanEvent
import nuclo.host.HttpRequest
import nuclo.host.HttpResult
import nuclo.host.InputKind
import nuclo.host.Paint
import nuclo.host.PointerPhase
import nuclo.host.Size
import nuclo.host.TextPaint
import nuclo.host.ViewEvent
import nuclo.host.ViewId
import nuclo.host.ViewKind
import nuclo.host.Rect as HRect
import platform.gdiplus.*
import platform.winhttp.*
import kotlin.concurrent.AtomicReference
import kotlin.native.concurrent.TransferMode
import kotlin.native.concurrent.Worker
import platform.posix.getenv
import platform.windows.*
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

// The Windows backend: one top-level window that paints every box and text itself with GDI+ (as WPF and WinUI do,
// their elements are windowless too). Cross-compiled and linked on a Mac, never run: keep it simple.

private class WView(val id: ViewId, val kind: ViewKind) {
    var parent: WView? = null
    var children: List<WView> = emptyList()
    var frame = HRect(0, 0, 0, 0)
    var paint: Paint? = null
    var text = ""
    val listens = HashSet<InputKind>()
    /** A child EDIT / BUTTON control of an input, a textarea or a checkbox (its id is the view's id). */
    var control: HWND? = null
    /** A scrolling box: whether along a row, its content size and the offset the wheel moved it to (logical pixels). */
    var scrolls: Boolean? = null
    var contentW = 0
    var contentH = 0
    var offX = 0f
    var offY = 0f
}

private val views = HashMap<ViewId, WView>()
private var backend: Win32Backend? = null
private var hwndMain: HWND? = null
private var scale = 1.0f
private var screenRoot: WView? = null
private val overlayRoots = ArrayList<WView>()
private var pressedView: WView? = null
private var hoverView: WView? = null
private var gdiToken: ULongVar? = null
private const val WM_LAYOUT = 0x8001u   // WM_APP + 1
private const val WM_RUN = 0x8002u      // a posted callback

/** Callbacks a worker thread asks the UI thread to run (posted with WM_RUN). */
private val posted = AtomicReference<List<() -> kotlin.Unit>>(emptyList())

private fun postToUi(block: () -> kotlin.Unit) {
    while (true) { val cur = posted.value; if (posted.compareAndSet(cur, cur + block)) break }
    PostMessageW(hwndMain, WM_RUN, 0u, 0)
}

private fun drainPosted() {
    while (true) { val cur = posted.value; if (posted.compareAndSet(cur, emptyList())) { cur.forEach { it() }; break } }
}

/** One HTTP exchange with WinHTTP, blocking: it runs on a worker thread. */
private fun winHttp(r: HttpRequest): HttpResult = memScoped {
    val https = r.url.startsWith("https://")
    val rest = r.url.substringAfter("://")
    val hostPort = rest.substringBefore('/')
    val path = "/" + rest.substringAfter('/', "")
    val host = hostPort.substringBefore(':')
    val port = hostPort.substringAfter(':', if (https) "443" else "80").toInt()
    val session = WinHttpOpen("nuclo".wcstr.ptr, 0u, null, null, 0u) ?: return@memScoped HttpResult(0, ByteArray(0), "WinHttpOpen failed")
    val connect = WinHttpConnect(session, host.wcstr.ptr, port.toUShort(), 0u)
    val request = WinHttpOpenRequest(connect, r.method.wcstr.ptr, path.wcstr.ptr, null, null, null, if (https) 0x00800000u else 0u)
    val headers = r.headers.entries.joinToString("") { "${it.key}: ${it.value}\r\n" }
    val body = r.body?.encodeToByteArray()
    val sent = body.let { b ->
        if (b == null || b.isEmpty()) WinHttpSendRequest(request, headers.wcstr.ptr, headers.length.toUInt(), null, 0u, 0u, 0u)
        else b.usePinned { WinHttpSendRequest(request, headers.wcstr.ptr, headers.length.toUInt(), it.addressOf(0), b.size.toUInt(), b.size.toUInt(), 0u) }
    }
    var result = HttpResult(0, ByteArray(0), "request failed")
    if (sent != 0 && WinHttpReceiveResponse(request, null) != 0) {
        val status = alloc<UIntVar>()
        val size = alloc<UIntVar>()
        size.value = 4u
        WinHttpQueryHeaders(request, (19u or 0x20000000u), null, status.ptr, size.ptr, null)   // STATUS_CODE | FLAG_NUMBER
        val out = ArrayList<Byte>()
        val buffer = allocArray<ByteVar>(8192)
        val read = alloc<UIntVar>()
        while (WinHttpReadData(request, buffer, 8192u, read.ptr) != 0 && read.value > 0u) for (i in 0 until read.value.toInt()) out.add(buffer[i])
        result = HttpResult(status.value.toInt(), out.toByteArray(), null)
    }
    WinHttpCloseHandle(request); WinHttpCloseHandle(connect); WinHttpCloseHandle(session)
    result
}

internal class Win32Backend(private val hwnd: HWND) : Backend {
    private var nextId = 1
    private var nextTimer = 1
    private val timers = HashMap<Int, () -> kotlin.Unit>()
    private var layoutQueued = false

    private fun v(id: ViewId) = views[id] ?: error("win32: no view $id")

    override fun create(kind: ViewKind): ViewId {
        val id = nextId++
        val w = WView(id, kind)
        views[id] = w
        val instance = GetModuleHandleW(null)
        val common = (WS_CHILD or WS_VISIBLE).toUInt()
        w.control = when (kind) {
            ViewKind.Input -> CreateWindowExW(0u, "EDIT", "", common or ES_AUTOHSCROLL.toUInt(), 0, 0, 0, 0, hwnd, id.toLong().toCPointer(), instance, null)
            ViewKind.Textarea -> CreateWindowExW(0u, "EDIT", "", common or (ES_MULTILINE or ES_AUTOVSCROLL or ES_WANTRETURN).toUInt(), 0, 0, 0, 0, hwnd, id.toLong().toCPointer(), instance, null)
            ViewKind.Checkbox -> CreateWindowExW(0u, "BUTTON", "", common or BS_AUTOCHECKBOX.toUInt(), 0, 0, 0, 0, hwnd, id.toLong().toCPointer(), instance, null)
            else -> null
        }
        w.control?.let { SendMessageW(it, WM_SETFONT.toUInt(), GetStockObject(DEFAULT_GUI_FONT).toLong().toULong(), 1) }
        return id
    }

    override fun destroy(view: ViewId) {
        val w = views.remove(view) ?: return
        w.control?.let { DestroyWindow(it) }
        w.parent?.let { p -> p.children = p.children.filter { it !== w } }
        if (pressedView === w) pressedView = null
    }

    override fun setChildren(parent: ViewId, children: IntArray) {
        val p = v(parent)
        val next = children.map { v(it) }
        for (old in p.children) if (old !in next) old.parent = null
        for (c in next) c.parent = p
        p.children = next
        invalidate()
    }

    override fun setFrame(view: ViewId, frame: HRect) { v(view).frame = frame; invalidate() }
    override fun frameOf(view: ViewId): HRect = v(view).frame

    override fun paint(view: ViewId, kind: ViewKind, paint: Paint) { v(view).paint = paint; invalidate() }

    override fun measure(view: ViewId, maxWidth: Float): Size {
        val w = v(view)
        val p = w.paint ?: return Size(0f, 0f)
        if (w.kind != ViewKind.Text && w.kind != ViewKind.Button) return Size(0f, 0f)
        return measureText(w.text, p.text, maxWidth)
    }

    override fun setText(view: ViewId, text: String) { v(view).text = text; invalidate() }

    // ---- async

    override fun http(request: HttpRequest, done: (HttpResult) -> kotlin.Unit) {
        val worker = Worker.start()
        worker.execute(TransferMode.SAFE, { request to done }) { (req, callback) ->
            val result = try { winHttp(req) } catch (e: Throwable) { HttpResult(0, ByteArray(0), e.message ?: "http failed") }
            postToUi { callback(result) }
        }
    }

    override fun adopt(native: Any): ViewId {
        val id = create(ViewKind.Native)
        @Suppress("UNCHECKED_CAST")
        v(id).control = native as HWND
        return id
    }

    override fun handleOf(view: ViewId): Any = v(view).let { it.control ?: it.id }

    // ---- controls

    override fun setValue(view: ViewId, text: String) { v(view).control?.let { if (controlText(view) != text) SetWindowTextW(it, text) } }
    override fun setPlaceholder(view: ViewId, text: String) { v(view).control?.let { c -> memScoped { SendMessageW(c, 0x1501u, 0u, text.wcstr.ptr.toLong()) } } }   // EM_SETCUEBANNER
    override fun setChecked(view: ViewId, checked: Boolean) { v(view).control?.let { SendMessageW(it, BM_SETCHECK.toUInt(), (if (checked) BST_CHECKED else BST_UNCHECKED).toULong(), 0) } }
    override fun setEnabled(view: ViewId, enabled: Boolean) { v(view).control?.let { EnableWindow(it, if (enabled) 1 else 0) } }
    override fun setInputType(view: ViewId, inputType: String) { v(view).control?.let { SendMessageW(it, EM_SETPASSWORDCHAR.toUInt(), (if (inputType == "password") 0x2022 else 0).toULong(), 0) } }
    override fun setLabel(view: ViewId, label: String) {}
    override fun controlText(view: ViewId): String = memScoped {
        val c = v(view).control ?: return@memScoped ""
        val n = GetWindowTextLengthW(c)
        val buffer = allocArray<UShortVar>(n + 1)
        GetWindowTextW(c, buffer, n + 1)
        buffer.toKStringFromUtf16()
    }
    override fun controlChecked(view: ViewId): Boolean = v(view).control?.let { SendMessageW(it, BM_GETCHECK.toUInt(), 0u, 0) == BST_CHECKED.toLong() } ?: false
    override fun openUrl(url: String) { ShellExecuteW(null, "open", url, null, null, SW_SHOWNORMAL) }

    /** A control's frame is in window coordinates: the ancestors' frames added up. */
    private fun placeControls(w: WView, ox: Float, oy: Float) {
        val x = ox + w.frame.x
        val y = oy + w.frame.y
        w.control?.let { c ->
            val ins = if (w.kind == ViewKind.Checkbox) null else w.paint?.insets
            val l = x + (ins?.get(3) ?: 0f); val t = y + (ins?.get(0) ?: 0f)
            val cw = w.frame.w - (ins?.let { it[1] + it[3] } ?: 0f); val ch = w.frame.h - (ins?.let { it[0] + it[2] } ?: 0f)
            SetWindowPos(c, null, (l * scale).roundToInt(), (t * scale).roundToInt(), (cw * scale).roundToInt(), (ch * scale).roundToInt(),
                (SWP_NOZORDER or (if (w.paint?.visible == false) SWP_HIDEWINDOW else SWP_SHOWWINDOW)).toUInt())
        }
        for (c in w.children) placeControls(c, x, y)
    }

    /** WM_COMMAND from a child control: its id is the view's id. */
    fun command(id: Int, code: Int) {
        if (!views.containsKey(id)) return
        when (code) {
            EN_CHANGE -> Host.event(id, ViewEvent.Input)
            EN_SETFOCUS -> Host.event(id, ViewEvent.Focus)
            // ponytail: a field commits on blur here; Enter would need the EDIT window subclassed
            EN_KILLFOCUS -> { Host.event(id, ViewEvent.Change); Host.event(id, ViewEvent.Blur) }
            BN_CLICKED -> if (views[id]?.kind == ViewKind.Checkbox) Host.event(id, ViewEvent.Change)
        }
    }
    override fun listen(view: ViewId, input: InputKind) { v(view).listens.add(input) }

    // ---- layout extras

    override fun makeScrollable(view: ViewId, horizontal: Boolean) { v(view).scrolls = horizontal }
    override fun setContentSize(view: ViewId, width: Int, height: Int) { v(view).let { it.contentW = width; it.contentH = height }; invalidate() }
    override fun reorder(parent: ViewId, children: IntArray) { val p = v(parent); p.children = children.map { v(it) }; invalidate() }

    /** WM_MOUSEWHEEL: scrolls the deepest scrolling box under the pointer. */
    fun wheel(x: Int, y: Int, delta: Int) {
        val step = delta / 120f * 40f
        val target = scrollTarget(x / scale, y / scale)
        if (target == null) {
            // the screen itself scrolls vertically when its content is taller than the window
            val root = screenRoot ?: return
            val (_, h) = clientSize()
            screenOffY = (screenOffY - step).coerceIn(0f, max(0f, root.frame.h - h))
            screenRoot?.let { placeControls(it, 0f, -screenOffY) }
            Host.screenScrolled(root.id, screenOffY, h)
            invalidate()
            return
        }
        if (target.scrolls == true) target.offX = (target.offX - step).coerceIn(0f, max(0f, target.contentW - target.frame.w.toFloat()))
        else target.offY = (target.offY - step).coerceIn(0f, max(0f, target.contentH - target.frame.h.toFloat()))
        invalidate()
    }

    private var screenOffY = 0f

    private fun scrollTarget(x: Float, y: Float): WView? {
        fun walk(w: WView, ox: Float, oy: Float): WView? {
            val fx = ox + w.frame.x; val fy = oy + w.frame.y
            if (x < fx || y < fy || x >= fx + w.frame.w || y >= fy + w.frame.h) return null
            for (c in w.children.asReversed()) walk(c, fx - w.offX, fy - w.offY)?.let { return it }
            return if (w.scrolls != null) w else null
        }
        return screenRoot?.let { walk(it, 0f, -screenOffY) }
    }

    fun doubleClick(x: Int, y: Int) {
        val hit = hitTest(x / scale, y / scale) ?: return
        if (InputKind.DoubleClick in hit.listens) Host.pointer(hit.id, PointerPhase.DoubleClick, PointerEvent(0.0, 0.0, x / scale.toDouble(), y / scale.toDouble(), 0))
        mouse(x, y, true)   // the second press of a double click is also a press
    }

    /** WM_KEYDOWN: goes to the first view that listens for keys (there is no focus model here). */
    fun key(vk: Int) {
        val target = views.values.firstOrNull { InputKind.Keys in it.listens } ?: return
        val name = when (vk) {
            0x0D -> "Enter"; 0x1B -> "Escape"; 0x08 -> "Backspace"; 0x2E -> "Delete"; 0x09 -> "Tab"
            0x25 -> "ArrowLeft"; 0x26 -> "ArrowUp"; 0x27 -> "ArrowRight"; 0x28 -> "ArrowDown"
            in 0x30..0x5A -> vk.toChar().lowercaseChar().toString()
            else -> return
        }
        Host.key(target.id, name)
    }

    private var panning = false
    private var panStartX = 0f
    private var panStartY = 0f
    private var downX = 0f
    private var downY = 0f

    fun move(x: Int, y: Int) {
        val lx = x / scale
        val ly = y / scale
        pressedView?.let { p ->
            if (InputKind.Pointer in p.listens) Host.pointer(p.id, PointerPhase.Move, PointerEvent(lx.toDouble(), ly.toDouble(), lx.toDouble(), ly.toDouble(), 0))
            if (InputKind.Pan in p.listens) {
                if (!panning && kotlin.math.hypot(lx - downX, ly - downY) >= 8f) {
                    panning = true
                    panStartX = lx; panStartY = ly   // the translation counts from where the drag was recognized
                    Host.pan(p.id, PanEvent("start", 0.0, 0.0, 0.0, 0.0, lx.toDouble(), ly.toDouble()))
                } else if (panning) Host.pan(p.id, PanEvent("move", (lx - panStartX).toDouble(), (ly - panStartY).toDouble(), 0.0, 0.0, lx.toDouble(), ly.toDouble()))
            }
        }
        val over = hitTest(x / scale, y / scale)
        if (over?.listens?.contains(InputKind.Hover) != true && hoverView?.listens?.contains(InputKind.Hover) != true) { hoverView = over; return }
        if (over !== hoverView) { hoverView?.let { if (InputKind.Hover in it.listens) Host.hover(it.id, false) }; over?.let { if (InputKind.Hover in it.listens) Host.hover(it.id, true) }; hoverView = over }
    }

    override fun showScreen(root: ViewId) { screenRoot = v(root); requestLayout() }
    override fun showOverlay(root: ViewId) { overlayRoots.add(v(root)); requestLayout() }

    override fun requestLayout() {
        if (layoutQueued) return
        layoutQueued = true
        PostMessageW(hwnd, WM_LAYOUT, 0u, 0)
    }

    fun layoutPass() {
        layoutQueued = false
        val (w, h) = clientSize()
        screenRoot?.let { r ->
            val natural = Host.measureRoot(r.id, w)
            val height = max(natural, h)
            r.frame = HRect(0, 0, w.roundToInt(), height.roundToInt())
            Host.layoutRoot(r.id, w, height)
        }
        for (o in overlayRoots) { o.frame = HRect(0, 0, w.roundToInt(), h.roundToInt()); Host.layoutRoot(o.id, w, h) }
        screenRoot?.let { placeControls(it, 0f, -screenOffY) }
        for (o in overlayRoots) placeControls(o, 0f, 0f)
        invalidate()
    }

    private fun clientSize(): Pair<Float, Float> = memScoped {
        val r = alloc<RECT>()
        GetClientRect(hwnd, r.ptr)
        ((r.right - r.left) / scale) to ((r.bottom - r.top) / scale)
    }

    override fun windowWidth(): Float = clientSize().first

    private fun invalidate() { InvalidateRect(hwnd, null, 0) }

    // ---- the main loop: SetTimer → WM_TIMER

    override fun setTimer(ms: Int, callback: () -> kotlin.Unit): Int {
        val id = nextTimer++
        timers[id] = callback
        SetTimer(hwnd, id.toULong(), max(1, ms).toUInt(), null)
        return id
    }

    override fun clearTimer(timer: Int) { timers.remove(timer); KillTimer(hwnd, timer.toULong()) }

    fun timerFired(id: Int) {
        KillTimer(hwnd, id.toULong())
        timers.remove(id)?.invoke()
    }

    override fun log(line: String) { println(line) }
    override fun now(): Double = kotlin.time.Clock.System.now().toEpochMilliseconds().toDouble()
    override fun env(name: String): String? = getenv(name)?.toKString()
    override fun exit(code: Int) { PostQuitMessage(code) }

    // ---- input

    fun mouse(x: Int, y: Int, down: Boolean) {
        val hit = hitTest(x / scale, y / scale)
        if (down) { downX = x / scale; downY = y / scale; panning = false; pressedView = hit; hit?.let { Host.pointer(it.id, PointerPhase.Down, PointerEvent(0.0, 0.0, x / scale.toDouble(), y / scale.toDouble(), 0)) } }
        else {
            val was = pressedView
            pressedView = null
            if (was != null) {
                if (panning) { panning = false; Host.pan(was.id, PanEvent("end", (x / scale - panStartX).toDouble(), (y / scale - panStartY).toDouble(), 0.0, 0.0, x / scale.toDouble(), y / scale.toDouble())) }
                Host.pointer(was.id, PointerPhase.Up, PointerEvent(0.0, 0.0, x / scale.toDouble(), y / scale.toDouble(), 0))
                if (was === hit && InputKind.Click in was.listens && kotlin.math.hypot(x / scale - downX, y / scale - downY) < 8f) Host.event(was.id, ViewEvent.Click)
            }
        }
    }

    /** The deepest view under (x, y) that listens, walking children from the top-most backwards. */
    private fun hitTest(x: Float, y: Float): WView? {
        fun walk(w: WView, ox: Float, oy: Float): WView? {
            val p = w.paint
            if (p != null && (!p.visible || !p.pointer)) return null
            val fx = ox + w.frame.x
            val fy = oy + w.frame.y
            if (x < fx || y < fy || x >= fx + w.frame.w || y >= fy + w.frame.h) return null
            for (c in w.children.asReversed()) walk(c, fx - w.offX, fy - w.offY)?.let { return it }
            return if (InputKind.Click in w.listens || InputKind.Pointer in w.listens || InputKind.Hover in w.listens) w else null
        }
        for (o in overlayRoots.asReversed()) walk(o, 0f, 0f)?.let { return it }
        return screenRoot?.let { walk(it, 0f, -screenOffY) }
    }

    // ---- painting

    fun paintWindow() = memScoped {
        val ps = alloc<PAINTSTRUCT>()
        val dc = BeginPaint(hwnd, ps.ptr)
        val r = alloc<RECT>()
        GetClientRect(hwnd, r.ptr)
        val w = r.right - r.left
        val h = r.bottom - r.top
        val mem = CreateCompatibleDC(dc)
        val bmp = CreateCompatibleBitmap(dc, w, h)
        val old = SelectObject(mem, bmp)
        val g = alloc<COpaquePointerVar>()
        GdipCreateFromHDC(mem, g.ptr)
        GdipSetSmoothingMode(g.value, 4)
        GdipGraphicsClear(g.value, 0xFFFFFFFFu)
        screenRoot?.let { paintView(g.value!!, it, 0f, -screenOffY) }   // ponytail: no drop shadows, no per-side borders that differ
        for (o in overlayRoots) paintView(g.value!!, o, 0f, 0f)
        GdipDeleteGraphics(g.value)
        BitBlt(dc, 0, 0, w, h, mem, 0, 0, SRCCOPY)
        SelectObject(mem, old)
        DeleteObject(bmp)
        DeleteDC(mem)
        EndPaint(hwnd, ps.ptr)
    }

    private fun argb(rgba: UInt): UInt = ((rgba and 0xffu) shl 24) or (rgba shr 8)

    private fun paintView(g: COpaquePointer, w: WView, ox: Float, oy: Float) {
        val p = w.paint
        if (p != null && !p.visible) return
        val x = (ox + w.frame.x) * scale
        val y = (oy + w.frame.y) * scale
        val width = w.frame.w * scale
        val height = w.frame.h * scale
        // a transform turns about the view's centre; a clip keeps the children inside the box
        var saved: UInt? = null
        if (p != null && (p.clip || p.rotate != 0f || p.scale != 1f || p.translateX != 0f || p.translateY != 0f)) memScoped {
            val state = alloc<UIntVar>()
            GdipSaveGraphics(g, state.ptr)
            saved = state.value
            if (p.rotate != 0f || p.scale != 1f || p.translateX != 0f || p.translateY != 0f) {
                GdipTranslateWorldTransform(g, x + width / 2 + p.translateX * scale, y + height / 2 + p.translateY * scale, 0u)
                GdipRotateWorldTransform(g, p.rotate, 0u)
                GdipScaleWorldTransform(g, p.scale, p.scale, 0u)
                GdipTranslateWorldTransform(g, -(x + width / 2), -(y + height / 2), 0u)
            }
            if (p.clip) GdipSetClipRect(g, x, y, width, height, 1u)
        }
        if (p != null) memScoped {
            val radius = min(p.radius * scale, min(width, height) / 2f)
            p.background?.let { bg ->
                val brush = alloc<COpaquePointerVar>()
                GdipCreateSolidFill(argb(bg), brush.ptr)
                fillRounded(g, brush.value!!, x, y, width, height, radius)
                GdipDeleteBrush(brush.value)
            }
            val bw = p.borders[0] * scale
            if (bw > 0f && p.borders.all { it == p.borders[0] }) {
                val pen = alloc<COpaquePointerVar>()
                GdipCreatePen1(argb(p.borderColors[0].toUInt()), bw, 2u, pen.ptr)
                val path = roundedPath(x + bw / 2, y + bw / 2, width - bw, height - bw, max(0f, radius - bw / 2))
                GdipDrawPath(g, pen.value, path)
                GdipDeletePath(path)
                GdipDeletePen(pen.value)
            }
            if ((w.kind == ViewKind.Text || w.kind == ViewKind.Button) && w.text.isNotEmpty()) drawText(g, w, p, x, y, width, height)
        }
        for (c in w.children) paintView(g, c, ox + w.frame.x - w.offX, oy + w.frame.y - w.offY)
        if (saved != null) { GdipRestoreGraphics(g, saved) }
    }

    private fun roundedPath(x: Float, y: Float, w: Float, h: Float, r: Float): COpaquePointer? = memScoped {
        val path = alloc<COpaquePointerVar>()
        GdipCreatePath(0u, path.ptr)
        if (r <= 0.5f) GdipAddPathRectangle(path.value, x, y, w, h)
        else {
            val d = r * 2
            GdipAddPathArc(path.value, x, y, d, d, 180f, 90f)
            GdipAddPathArc(path.value, x + w - d, y, d, d, 270f, 90f)
            GdipAddPathArc(path.value, x + w - d, y + h - d, d, d, 0f, 90f)
            GdipAddPathArc(path.value, x, y + h - d, d, d, 90f, 90f)
            GdipClosePathFigure(path.value)
        }
        path.value
    }

    private fun fillRounded(g: COpaquePointer, brush: COpaquePointer, x: Float, y: Float, w: Float, h: Float, r: Float) {
        val path = roundedPath(x, y, w, h, r)
        GdipFillPath(g, brush, path)
        GdipDeletePath(path)
    }

    private fun drawText(g: COpaquePointer, w: WView, p: Paint, x: Float, y: Float, width: Float, height: Float) = memScoped {
        val font = makeFont(p.text)
        val fmt = alloc<COpaquePointerVar>()
        GdipCreateStringFormat(0, 0u, fmt.ptr)
        GdipSetStringFormatAlign(fmt.value, if (w.kind == ViewKind.Button) 1u else when (p.text.align) { 1 -> 1u; 2 -> 2u; else -> 0u })
        if (w.kind == ViewKind.Button) GdipSetStringFormatLineAlign(fmt.value, 1u)
        val brush = alloc<COpaquePointerVar>()
        GdipCreateSolidFill(argb(p.text.color), brush.ptr)
        val ins = p.insets
        val rect = alloc<RectF>()
        rect.X = x + ins[3] * scale; rect.Y = y + ins[0] * scale
        rect.Width = width - (ins[1] + ins[3]) * scale; rect.Height = height - (ins[0] + ins[2]) * scale
        GdipDrawString(g, w.text.wcstr.ptr, -1, font.value, rect.ptr, fmt.value, brush.value)
        GdipDeleteBrush(brush.value)
        GdipDeleteStringFormat(fmt.value)
        GdipDeleteFont(font.value)
    }

    private fun MemScope.makeFont(t: TextPaint): COpaquePointerVar {
        val family = alloc<COpaquePointerVar>()
        val name = when (t.family) { "monospace" -> "Consolas"; "serif" -> "Times New Roman"; "sans-serif" -> "Segoe UI"; else -> t.family }
        GdipCreateFontFamilyFromName(name.wcstr.ptr, null, family.ptr)
        val style = (if (t.weight >= 600) 1 else 0) or (if (t.italic) 2 else 0) or (if (t.underline) 4 else 0) or (if (t.strike) 8 else 0)
        val font = alloc<COpaquePointerVar>()
        GdipCreateFont(family.value, t.fontSize * scale, style, 2u, font.ptr)
        GdipDeleteFontFamily(family.value)
        return font
    }

    private fun measureText(text: String, t: TextPaint, maxWidth: Float): Size = memScoped {
        val dc = GetDC(hwndMain)
        val g = alloc<COpaquePointerVar>()
        GdipCreateFromHDC(dc, g.ptr)
        val font = makeFont(t)
        val layout = alloc<RectF>()
        layout.X = 0f; layout.Y = 0f; layout.Width = maxWidth * scale; layout.Height = 100000f
        val bounds = alloc<RectF>()
        val fmt = alloc<COpaquePointerVar>()
        GdipCreateStringFormat(0, 0u, fmt.ptr)
        GdipMeasureString(g.value, text.wcstr.ptr, -1, font.value, layout.ptr, fmt.value, bounds.ptr, null, null)
        GdipDeleteStringFormat(fmt.value)
        GdipDeleteFont(font.value)
        GdipDeleteGraphics(g.value)
        ReleaseDC(hwndMain, dc)
        val lines = max(1, (bounds.Height / scale / t.lineHeight).roundToInt())
        Size(ceil(bounds.Width / scale), lines * t.lineHeight)
    }
}

private fun wndProc(hwnd: HWND?, msg: UINT, wParam: WPARAM, lParam: LPARAM): LRESULT {
    val b = backend
    when (msg) {
        WM_PAINT.toUInt() -> { b?.paintWindow(); return 0 }
        WM_SIZE.toUInt() -> { b?.requestLayout(); return 0 }
        WM_HSCROLL.toUInt() -> { nativeScrolled(lParam, SendMessageW(lParam.toCPointer(), 0x0400u, 0u, 0).toInt()); return 0 }   // TBM_GETPOS
        WM_LAYOUT -> { b?.layoutPass(); return 0 }
        WM_RUN -> { drainPosted(); return 0 }
        WM_TIMER.toUInt() -> { b?.timerFired(wParam.toInt()); return 0 }
        WM_MOUSEMOVE.toUInt() -> { b?.move((lParam and 0xffff).toInt(), ((lParam shr 16) and 0xffff).toInt()); return 0 }
        WM_MOUSEWHEEL.toUInt() -> {
            memScoped { val pt = alloc<POINT>(); GetCursorPos(pt.ptr); ScreenToClient(hwnd, pt.ptr); b?.wheel(pt.x, pt.y, ((wParam shr 16) and 0xffffu).toShort().toInt()) }
            return 0
        }
        WM_LBUTTONDBLCLK.toUInt() -> { b?.doubleClick((lParam and 0xffff).toInt(), ((lParam shr 16) and 0xffff).toInt()); return 0 }
        WM_KEYDOWN.toUInt() -> { b?.key(wParam.toInt()); return 0 }
        WM_LBUTTONDOWN.toUInt() -> { b?.mouse((lParam and 0xffff).toInt(), ((lParam shr 16) and 0xffff).toInt(), true); return 0 }
        WM_LBUTTONUP.toUInt() -> { b?.mouse((lParam and 0xffff).toInt(), ((lParam shr 16) and 0xffff).toInt(), false); return 0 }
        WM_COMMAND.toUInt() -> { b?.command((wParam and 0xffffu).toInt(), ((wParam shr 16) and 0xffffu).toInt()); return 0 }
        WM_DESTROY.toUInt() -> { PostQuitMessage(0); return 0 }
    }
    return DefWindowProcW(hwnd, msg, wParam, lParam)
}

internal fun runWin32(entry: () -> kotlin.Unit) {
    SetProcessDPIAware()
    memScoped {
        val input = alloc<GdiplusStartupInput>()
        input.GdiplusVersion = 1u
        val token = alloc<ULongVar>()
        GdiplusStartup(token.ptr, input.ptr, null)
        gdiToken = token
        val instance = GetModuleHandleW(null)
        val className = "NucloWindow".wcstr
        val wc = alloc<WNDCLASSEXW>()
        wc.cbSize = sizeOf<WNDCLASSEXW>().toUInt()
        wc.lpfnWndProc = staticCFunction(::wndProc)
        wc.style = CS_DBLCLKS.toUInt()
        wc.hInstance = instance
        wc.lpszClassName = className.ptr
        wc.hCursor = LoadCursorW(null, 32512.toLong().toCPointer())
        RegisterClassExW(wc.ptr)
        val size = getenv("NUCLO_SIZE")?.toKString()?.split('x')
        val w = size?.getOrNull(0)?.toIntOrNull() ?: 420
        val h = size?.getOrNull(1)?.toIntOrNull() ?: 780
        val hwnd = CreateWindowExW(0u, className.ptr, "nuclo".wcstr.ptr, WS_OVERLAPPEDWINDOW.toUInt(), CW_USEDEFAULT, CW_USEDEFAULT, w, h, null, null, instance, null)
        hwndMain = hwnd
        val dc = GetDC(hwnd)
        scale = GetDeviceCaps(dc, LOGPIXELSX) / 96f
        ReleaseDC(hwnd, dc)
        val be = Win32Backend(hwnd!!)
        backend = be
        Host.start(be, entry)
        ShowWindow(hwnd, SW_SHOW)
        UpdateWindow(hwnd)
        val msg = alloc<MSG>()
        while (GetMessageW(msg.ptr, null, 0u, 0u) != 0) {
            TranslateMessage(msg.ptr)
            DispatchMessageW(msg.ptr)
        }
    }
}

internal fun mainWindow(): HWND? = hwndMain
