package nuclo.gtk

import gtk.*
import kotlinx.cinterop.*
import nuclo.PanEvent
import nuclo.PinchEvent
import nuclo.PointerEvent
import nuclo.ScrollEvent
import nuclo.host.*
import platform.posix.exit
import platform.posix.getenv
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

// The GTK 4 backend. Every ViewId is a NucloView: a GtkWidget subclass registered from Kotlin that places its
// children at the frames the core gave them (frames are law), paints its own box and holds a leaf's native
// widget (a label, a button…) inside its padding. These sources are compiled into linuxMain on Linux, and by
// :gtk-preview on macOS against Homebrew's GTK: they use only the public API of :nuclo and the cinterop package `gtk`.

private class VInfo(val id: ViewId, val kind: ViewKind, val widget: CPointer<GtkWidget>) {
    var frame = Rect(0, 0, 0, 0)
    var paint: Paint? = null
    /** A leaf's widget, and whether it fills the frame (a button, a control) or sits inside the padding (text). */
    var native: CPointer<GtkWidget>? = null
    var fills = true
    /** The core lays this view out from the size GTK gives it. */
    var root = false
    /** The pointer hits this view itself: it reports some input. */
    var hit = false
    /** The scrolled content of a scrolling box. */
    var content = false
    val refs = ArrayList<StableRef<*>>()
    /** A scrolling box's content: where its children go. */
    var contentInfo: VInfo? = null
    var drag: DragState? = null
}

/** One drag gesture per view reports its pointer moves and recognizes its pan. */
private class DragState(val id: ViewId) {
    var pointers = false
    var pan = false
    var panning = false
    var startX = 0.0
    var startY = 0.0
    var baseX = 0.0
    var baseY = 0.0
    var lastX = 0.0
    var lastY = 0.0
    var lastMs = 0.0
    var velX = 0.0
    var velY = 0.0
}

private val byWidget = HashMap<Long, VInfo>()
private val byId = HashMap<ViewId, VInfo>()
private var framePending = false

private fun key(w: CPointer<*>?): Long = w.rawValue.toLong()

// ---- the NucloView class

private var parentDispose: CPointer<CFunction<(CPointer<GObject>?) -> Unit>>? = null

private fun viewMeasure(widget: CPointer<GtkWidget>?, orientation: GtkOrientation, forSize: Int,
                        minimum: CPointer<IntVar>?, natural: CPointer<IntVar>?, minBaseline: CPointer<IntVar>?, natBaseline: CPointer<IntVar>?) {
    val info = byWidget[key(widget)]
    val horizontal = orientation == GtkOrientation.GTK_ORIENTATION_HORIZONTAL
    var min = 0
    var nat = 0
    if (info != null) {
        val f = info.frame
        if (info.content) { val size = max(0, if (horizontal) f.w else f.h); min = size; nat = size }
        else {
            nat = when {
            // A root is as wide as it is given; its height is its content's at that width.
            info.root && horizontal -> 0
            info.root -> ceil(Host.measureRoot(info.id, (if (forSize < 0) max(1, f.w) else forSize).toFloat())).toInt()
            horizontal -> f.w
            else -> f.h
            }.coerceAtLeast(0)
            // A root's height is its content's: a viewport asks for the minimum unless told otherwise, so the minimum is the natural size.
            if (info.root && !horizontal) min = nat
        }
    }
    minimum?.pointed?.value = min
    natural?.pointed?.value = nat
    minBaseline?.pointed?.value = -1
    natBaseline?.pointed?.value = -1
}

private fun viewRequestMode(widget: CPointer<GtkWidget>?): GtkSizeRequestMode = GTK_SIZE_REQUEST_HEIGHT_FOR_WIDTH

private fun contentRect(info: VInfo, width: Int, height: Int): IntArray {
    val p = info.paint
    if (info.fills || p == null) return intArrayOf(0, 0, width, height)
    val i = p.insets
    return intArrayOf(i[3].roundToInt(), i[0].roundToInt(), (width - i[3] - i[1]).roundToInt(), (height - i[0] - i[2]).roundToInt())
}

private fun viewAllocate(widget: CPointer<GtkWidget>?, width: Int, height: Int, baseline: Int) {
    val info = byWidget[key(widget)] ?: return
    if (info.root) {
        info.frame = Rect(0, 0, width, height)
        Host.layoutRoot(info.id, width.toFloat(), height.toFloat())
        framePending = false
    }
    var child = gtk_widget_get_first_child(widget)
    while (child != null) {
        val next = gtk_widget_get_next_sibling(child)
        // GTK wants a widget measured before it is allocated.
        gtk_widget_measure(child, GtkOrientation.GTK_ORIENTATION_HORIZONTAL, -1, null, null, null, null)
        val ci = byWidget[key(child)]
        if (ci != null) {
            val f = ci.frame
            memScoped {
                val point = alloc<graphene_point_t>()
                point.x = f.x.toFloat(); point.y = f.y.toFloat()
                var t = gsk_transform_translate(null, point.ptr)
                val p = ci.paint
                if (p != null && (p.translateX != 0f || p.translateY != 0f || p.rotate != 0f || p.scale != 1f)) {
                    // the transform turns about the view's centre
                    val cx = f.w / 2f; val cy = f.h / 2f
                    point.x = p.translateX + cx; point.y = p.translateY + cy
                    t = gsk_transform_translate(t, point.ptr)
                    t = gsk_transform_rotate(t, p.rotate)
                    t = gsk_transform_scale(t, p.scale, p.scale)
                    point.x = -cx; point.y = -cy
                    t = gsk_transform_translate(t, point.ptr)
                }
                gtk_widget_allocate(child, max(0, f.w), max(0, f.h), -1, t)
            }
        } else {
            val r = contentRect(info, width, height)
            memScoped {
                val a = alloc<GtkAllocation>()
                a.x = r[0]; a.y = r[1]; a.width = max(0, r[2]); a.height = max(0, r[3])
                gtk_widget_size_allocate(child, a.ptr, -1)
            }
        }
        child = next
    }
}

private fun rgba(c: MemScope, color: UInt): GdkRGBA {
    val o = c.alloc<GdkRGBA>()
    o.red = ((color shr 24) and 0xffu).toFloat() / 255f
    o.green = ((color shr 16) and 0xffu).toFloat() / 255f
    o.blue = ((color shr 8) and 0xffu).toFloat() / 255f
    o.alpha = (color and 0xffu).toFloat() / 255f
    return o
}

private fun viewSnapshot(widget: CPointer<GtkWidget>?, snapshot: CPointer<GtkSnapshot>?) {
    val info = byWidget[key(widget)]
    val paint = info?.paint
    memScoped {
        if (paint != null) {
            val w = gtk_widget_get_width(widget).toFloat()
            val h = gtk_widget_get_height(widget).toFloat()
            val bounds = alloc<graphene_rect_t>()
            graphene_rect_init(bounds.ptr, 0f, 0f, w, h)
            val outline = alloc<GskRoundedRect>()
            gsk_rounded_rect_init_from_rect(outline.ptr, bounds.ptr, min(paint.radius, min(w, h) / 2f))
            paint.shadow?.let { s -> gtk_snapshot_append_outset_shadow(snapshot, outline.ptr, rgba(this, s.color).ptr, s.dx, s.dy, 0f, s.blur) }
            paint.background?.let { bg ->
                gtk_snapshot_push_rounded_clip(snapshot, outline.ptr)
                gtk_snapshot_append_color(snapshot, rgba(this, bg).ptr, bounds.ptr)
                gtk_snapshot_pop(snapshot)
            }
            if (paint.clip) gtk_snapshot_push_rounded_clip(snapshot, outline.ptr)
            var child = gtk_widget_get_first_child(widget)
            while (child != null) { gtk_widget_snapshot_child(widget, child, snapshot); child = gtk_widget_get_next_sibling(child) }
            if (paint.clip) gtk_snapshot_pop(snapshot)
            if (paint.borders.any { it > 0f }) {
                val widths = allocArray<FloatVar>(4)
                for (i in 0..3) widths[i] = paint.borders[i]
                val colors = allocArray<GdkRGBA>(4)
                for (i in 0..3) {
                    val c = rgba(this, paint.borderColors[i].toUInt())
                    colors[i].red = c.red; colors[i].green = c.green; colors[i].blue = c.blue; colors[i].alpha = c.alpha
                }
                gtk_snapshot_append_border(snapshot, outline.ptr, widths, colors)
            }
        } else {
            var child = gtk_widget_get_first_child(widget)
            while (child != null) { gtk_widget_snapshot_child(widget, child, snapshot); child = gtk_widget_get_next_sibling(child) }
        }
    }
}

/** Whether the pointer hits this view itself (its children are asked first): a box that reports no input lets it through. */
private fun viewContains(widget: CPointer<GtkWidget>?, x: Double, y: Double): Int {
    val info = byWidget[key(widget)] ?: return 0
    if (!info.hit) return 0
    return if (x >= 0 && y >= 0 && x < gtk_widget_get_width(widget) && y < gtk_widget_get_height(widget)) 1 else 0
}

private fun viewDispose(obj: CPointer<GObject>?) {
    val widget = obj?.reinterpret<GtkWidget>()
    var child = gtk_widget_get_first_child(widget)
    while (child != null) { val next = gtk_widget_get_next_sibling(child); gtk_widget_unparent(child); child = next }
    parentDispose?.invoke(obj)
}

private fun viewClassInit(klass: gpointer?, data: gpointer?) {
    val w = klass!!.reinterpret<GtkWidgetClass>().pointed
    w.measure = staticCFunction(::viewMeasure)
    w.size_allocate = staticCFunction(::viewAllocate)
    w.snapshot = staticCFunction(::viewSnapshot)
    w.contains = staticCFunction(::viewContains)
    w.get_request_mode = staticCFunction(::viewRequestMode)
    val o = klass.reinterpret<GObjectClass>().pointed
    val parent = g_type_class_peek_parent(klass)!!.reinterpret<GObjectClass>().pointed
    parentDispose = parent.dispose
    o.dispose = staticCFunction(::viewDispose)
}

private val nucloViewType: GType by lazy {
    g_type_register_static_simple(gtk_widget_get_type(), "NucloView", sizeOf<GtkWidgetClass>().toUInt(),
        staticCFunction(::viewClassInit), sizeOf<GtkWidget>().toUInt(), null, 0u)
}

// ---- signals

private fun buttonClicked(button: CPointer<GtkButton>?, data: gpointer?) {
    val id = data!!.asStableRef<Int>().get()
    Host.event(id, ViewEvent.Click)
}

private fun connect(instance: CPointer<*>?, signal: String, handler: CPointer<CFunction<() -> Unit>>, data: StableRef<*>?) {
    g_signal_connect_data(instance?.reinterpret<GObject>(), signal, handler, data?.asCPointer(), null, 0u)
}

/** Set while the core writes a control, so it reports no event (GTK emits "changed" for programmatic writes). */
private var writing = false

private fun fireEvent(instance: COpaquePointer?, data: gpointer?) {
    if (writing) return
    val (id, event) = data!!.asStableRef<Pair<ViewId, ViewEvent>>().get()
    Host.event(id, event)
}

private class HttpCall(val proc: CPointer<GSubprocess>, val done: (HttpResult) -> Unit)

private fun httpFinished(source: CPointer<GObject>?, result: CPointer<GAsyncResult>?, data: gpointer?) {
    val ref = data!!.asStableRef<HttpCall>()
    val call = ref.get()
    ref.dispose()
    val bytes: ByteArray = memScoped {
        val out = alloc<CPointerVar<GBytes>>()
        val ok = g_subprocess_communicate_finish(call.proc, result, out.ptr, null, null)
        val gb = out.value
        if (ok == 0 || gb == null) ByteArray(0) else {
            val size = alloc<ULongVar>()
            val p = g_bytes_get_data(gb, size.ptr)?.reinterpret<ByteVar>()
            val arr = if (p == null) ByteArray(0) else p.readBytes(size.value.toInt())
            g_bytes_unref(gb)
            arr
        }
    }
    g_object_unref(call.proc)
    call.done(parseCurl(bytes))
}

/** `curl -i` output: header blocks (one per redirect), a blank line, the body. */
private fun parseCurl(b: ByteArray): HttpResult {
    if (b.isEmpty()) return HttpResult(0, b, "curl returned nothing")
    var start = 0
    var status = 0
    while (start + 5 < b.size && b[start] == 'H'.code.toByte() && b[start + 1] == 'T'.code.toByte() && b[start + 2] == 'T'.code.toByte() && b[start + 3] == 'P'.code.toByte()) {
        var end = start
        while (end + 3 < b.size && !(b[end] == 13.toByte() && b[end + 1] == 10.toByte() && b[end + 2] == 13.toByte() && b[end + 3] == 10.toByte())) end++
        if (end + 3 >= b.size) break
        val line = b.copyOfRange(start, minOf(b.size, start + 16)).decodeToString().split(' ')
        status = line.getOrNull(1)?.toIntOrNull() ?: 0
        start = end + 4
    }
    return HttpResult(status, b.copyOfRange(start, b.size), null)
}

private class TimerBox(val run: () -> Unit)

private fun timerFired(data: gpointer?): Int {
    val ref = data!!.asStableRef<TimerBox>()
    val box = ref.get()
    ref.dispose()
    box.run()
    return 0
}

private fun idleFired(data: gpointer?): Int {
    val ref = data!!.asStableRef<TimerBox>()
    val box = ref.get()
    ref.dispose()
    box.run()
    return 0
}

// ---- text

private fun textAttributes(t: TextPaint): CPointer<PangoAttrList>? {
    val list = pango_attr_list_new()
    fun add(a: CPointer<PangoAttribute>?) { pango_attr_list_insert(list, a) }
    val scale = PANGO_SCALE
    add(pango_attr_size_new_absolute((t.fontSize * scale).toInt()))
    add(pango_attr_weight_new(when {
        t.weight <= 300 -> PANGO_WEIGHT_LIGHT
        t.weight >= 700 -> PANGO_WEIGHT_BOLD
        t.weight >= 600 -> PANGO_WEIGHT_SEMIBOLD
        t.weight >= 500 -> PANGO_WEIGHT_MEDIUM
        else -> PANGO_WEIGHT_NORMAL
    }))
    if (t.italic) add(pango_attr_style_new(PangoStyle.PANGO_STYLE_ITALIC))
    if (t.family != "sans-serif") add(pango_attr_family_new(t.family))
    add(pango_attr_line_height_new_absolute((t.lineHeight * scale).toInt()))
    if (t.letterSpacing != 0f) add(pango_attr_letter_spacing_new((t.letterSpacing * scale).toInt()))
    if (t.underline) add(pango_attr_underline_new(PangoUnderline.PANGO_UNDERLINE_SINGLE))
    if (t.strike) add(pango_attr_strikethrough_new(1))
    add(pango_attr_foreground_new((((t.color shr 24) and 0xffu).toInt() * 257).toUShort(), (((t.color shr 16) and 0xffu).toInt() * 257).toUShort(), (((t.color shr 8) and 0xffu).toInt() * 257).toUShort()))
    add(pango_attr_foreground_alpha_new(max(1, ((t.color and 0xffu).toInt() * 257)).toUShort()))
    return list
}

private val CSS = """
.nuclo-bare, .nuclo-bare:hover, .nuclo-bare:active, .nuclo-bare:focus-within, .nuclo-bare > text {
  background: none; border: none; box-shadow: none; padding: 0; margin: 0; min-height: 0; min-width: 0; border-radius: 0;
}
entry.nuclo-bare, entry.nuclo-bare:focus-within { outline: none; }
.nuclo-screen { background: white; }
scrolledwindow.nuclo-scroll, scrolledwindow.nuclo-scroll > viewport { background: none; }
"""

internal class GtkBackend(private val window: CPointer<GtkWidget>, private val layers: CPointer<GtkWidget>) : Backend {
    private var nextId = 1
    private var nextTimer = 1
    private val timers = HashMap<Int, UInt>()
    private val roots = ArrayList<VInfo>()

    private fun info(id: ViewId) = byId[id] ?: error("gtk: no view $id")

    private fun label(i: VInfo): CPointer<GtkLabel>? = when (i.kind) {
        ViewKind.Text -> i.native?.reinterpret()
        ViewKind.Button -> gtk_button_get_child(i.native?.reinterpret())?.reinterpret()
        else -> null
    }

    // ---- views

    override fun create(kind: ViewKind): ViewId {
        val widget = g_object_new(nucloViewType, null)!!.reinterpret<GtkWidget>()
        // We own a reference: moving a view between parents (unparent) would otherwise finalize it.
        g_object_ref_sink(widget)
        val id = nextId++
        val info = VInfo(id, kind, widget)
        byWidget[key(widget)] = info
        byId[id] = info
        when (kind) {
            ViewKind.Text -> {
                val l = gtk_label_new(null)!!
                gtk_label_set_wrap(l.reinterpret(), 1)
                gtk_label_set_wrap_mode(l.reinterpret(), PangoWrapMode.PANGO_WRAP_WORD_CHAR)
                gtk_label_set_xalign(l.reinterpret(), 0f)
                gtk_label_set_yalign(l.reinterpret(), 0f)
                // Text never takes the pointer: a click reaches the view (or the box) under it.
                gtk_widget_set_can_target(l, 0)
                info.native = l; info.fills = false
            }
            ViewKind.Button -> {
                val l = gtk_label_new(null)!!
                gtk_label_set_wrap(l.reinterpret(), 1)
                gtk_label_set_wrap_mode(l.reinterpret(), PangoWrapMode.PANGO_WRAP_WORD_CHAR)
                gtk_label_set_justify(l.reinterpret(), GtkJustification.GTK_JUSTIFY_CENTER)
                val b = gtk_button_new()!!
                gtk_button_set_child(b.reinterpret(), l)
                gtk_widget_add_css_class(b, "nuclo-bare")
                val ref = StableRef.create(id)
                info.refs.add(ref)
                connect(b, "clicked", staticCFunction(::buttonClicked).reinterpret(), ref)
                info.native = b; info.fills = true
            }
            ViewKind.Input -> {
                val e = gtk_entry_new()!!
                signal(info, e, "changed", ViewEvent.Input)
                signal(info, e, "activate", ViewEvent.Change)
                focus(info, e)
                info.native = e; info.fills = false
            }
            ViewKind.Image -> {
                val pic = gtk_picture_new()!!
                gtk_widget_set_can_target(pic, 0)
                info.native = pic; info.fills = true
            }
            ViewKind.Checkbox -> {
                val c = gtk_check_button_new()!!
                signal(info, c, "toggled", ViewEvent.Change)
                info.native = c; info.fills = true
            }
            ViewKind.Textarea -> {
                val t = gtk_text_view_new()!!
                gtk_text_view_set_wrap_mode(t.reinterpret(), GtkWrapMode.GTK_WRAP_WORD_CHAR)
                signal(info, gtk_text_view_get_buffer(t.reinterpret()), "changed", ViewEvent.Input)
                focus(info, t)
                info.native = t; info.fills = false
            }
            else -> {}
        }
        info.native?.let { gtk_widget_set_parent(it, widget) }
        return id
    }

    private fun signal(info: VInfo, instance: CPointer<*>?, name: String, event: ViewEvent) {
        val ref = StableRef.create(info.id to event)
        info.refs.add(ref)
        g_signal_connect_data(instance?.reinterpret<GObject>(), name, staticCFunction(::fireEvent).reinterpret(), ref.asCPointer(), null, 0u)
    }

    private fun focus(info: VInfo, widget: CPointer<GtkWidget>) {
        val c = gtk_event_controller_focus_new()!!
        signal(info, c, "enter", ViewEvent.Focus)
        signal(info, c, "leave", ViewEvent.Blur)
        gtk_widget_add_controller(widget, c)
    }

    private fun write(block: () -> Unit) { writing = true; try { block() } finally { writing = false } }

    // ---- async

    override fun setImage(view: ViewId, bytes: ByteArray) {
        val i = info(view)
        val pic = i.native?.reinterpret<GtkPicture>() ?: return
        if (bytes.isEmpty()) { gtk_picture_set_paintable(pic, null); return }
        val gb = bytes.usePinned { g_bytes_new(it.addressOf(0), bytes.size.toULong()) }
        val texture = gdk_texture_new_from_bytes(gb, null)
        g_bytes_unref(gb)
        gtk_picture_set_paintable(pic, texture?.reinterpret())
    }

    // ponytail: curl subprocess; libsoup when the POC needs streaming or cookies (GTK has no HTTP client of its own, and libsoup would be a new dependency)
    override fun http(request: HttpRequest, done: (HttpResult) -> Unit) {
        val args = arrayListOf("curl", "-s", "-i", "-L", "--max-time", "30", "-X", request.method)
        for ((k, v) in request.headers) { args.add("-H"); args.add("$k: $v") }
        request.body?.let { args.add("--data-binary"); args.add(it) }
        args.add(request.url)
        memScoped {
            val argv = allocArray<CPointerVar<ByteVar>>(args.size + 1)
            args.forEachIndexed { i, a -> argv[i] = a.cstr.getPointer(this) }
            argv[args.size] = null
            val proc = g_subprocess_newv(argv, G_SUBPROCESS_FLAGS_STDOUT_PIPE, null)
            if (proc == null) { done(HttpResult(0, ByteArray(0), "could not start curl")); return }
            val ref = StableRef.create(HttpCall(proc, done))
            g_subprocess_communicate_async(proc, null, null, staticCFunction(::httpFinished), ref.asCPointer())
        }
    }

    override fun adopt(native: Any): ViewId {
        val id = create(ViewKind.Native)
        val i = info(id)
        @Suppress("UNCHECKED_CAST")
        val widget = native as CPointer<GtkWidget>
        gtk_widget_set_parent(widget, i.widget)
        i.native = widget; i.fills = true
        return id
    }

    override fun handleOf(view: ViewId): Any = info(view).let { it.native ?: it.widget }

    // ---- controls

    private fun entry(id: ViewId): CPointer<GtkEntry>? = info(id).let { if (it.kind == ViewKind.Input) it.native?.reinterpret() else null }
    private fun area(id: ViewId): CPointer<GtkTextView>? = info(id).let { if (it.kind == ViewKind.Textarea) it.native?.reinterpret() else null }
    private fun check(id: ViewId): CPointer<GtkCheckButton>? = info(id).let { if (it.kind == ViewKind.Checkbox) it.native?.reinterpret() else null }

    override fun controlText(view: ViewId): String {
        entry(view)?.let { return gtk_editable_get_text(it.reinterpret())?.toKString() ?: "" }
        area(view)?.let { a ->
            val buffer = gtk_text_view_get_buffer(a)
            return memScoped {
                val start = alloc<GtkTextIter>(); val end = alloc<GtkTextIter>()
                gtk_text_buffer_get_start_iter(buffer, start.ptr); gtk_text_buffer_get_end_iter(buffer, end.ptr)
                gtk_text_buffer_get_text(buffer, start.ptr, end.ptr, 0)?.toKString() ?: ""
            }
        }
        return ""
    }

    override fun controlChecked(view: ViewId): Boolean = check(view)?.let { gtk_check_button_get_active(it) != 0 } ?: false

    override fun setValue(view: ViewId, text: String) {
        if (controlText(view) == text) return
        write {
            entry(view)?.let { gtk_editable_set_text(it.reinterpret(), text) }
            area(view)?.let { gtk_text_buffer_set_text(gtk_text_view_get_buffer(it), text, -1) }
        }
    }

    override fun setPlaceholder(view: ViewId, text: String) { entry(view)?.let { gtk_entry_set_placeholder_text(it, text) } }
    override fun setChecked(view: ViewId, checked: Boolean) { check(view)?.let { if ((gtk_check_button_get_active(it) != 0) != checked) write { gtk_check_button_set_active(it, if (checked) 1 else 0) } } }
    override fun setEnabled(view: ViewId, enabled: Boolean) { gtk_widget_set_sensitive(info(view).widget, if (enabled) 1 else 0) }
    override fun setInputType(view: ViewId, inputType: String) {
        val e = entry(view) ?: return
        gtk_entry_set_visibility(e, if (inputType == "password") 0 else 1)
        gtk_entry_set_input_purpose(e, when (inputType) {
            "password" -> GtkInputPurpose.GTK_INPUT_PURPOSE_PASSWORD
            "email" -> GtkInputPurpose.GTK_INPUT_PURPOSE_EMAIL
            "number" -> GtkInputPurpose.GTK_INPUT_PURPOSE_NUMBER
            else -> GtkInputPurpose.GTK_INPUT_PURPOSE_FREE_FORM
        })
    }

    // ponytail: gtk_accessible_update_property is variadic and cannot be called from Kotlin/Native; the label stays in the core for the harness, screen readers do not get it
    override fun setLabel(view: ViewId, label: String) {}

    override fun openUrl(url: String) {
        val launcher = gtk_uri_launcher_new(url)
        gtk_uri_launcher_launch(launcher, window.reinterpret(), null, null, null)
    }

    override fun destroy(view: ViewId) {
        val i = byId.remove(view) ?: return
        byWidget.remove(key(i.widget))
        if (gtk_widget_get_parent(i.widget) != null && byWidget[key(gtk_widget_get_parent(i.widget))] != null) gtk_widget_unparent(i.widget)
        roots.remove(i)
        i.refs.forEach { it.dispose() }
        g_object_unref(i.widget)
    }

    private fun container(id: ViewId): CPointer<GtkWidget> = info(id).let { (it.contentInfo ?: it).widget }

    override fun setChildren(parent: ViewId, children: IntArray) {
        val p = container(parent)
        val wanted = children.map { info(it).widget }
        val keep = wanted.map { key(it) }.toHashSet()
        // Only views that arrive or leave are touched: layout places children by frame, and the widget order is only the drawing order.
        var next = gtk_widget_get_first_child(p)
        while (next != null) {
            val child = next
            next = gtk_widget_get_next_sibling(child)
            if (byWidget.containsKey(key(child)) && key(child) !in keep) gtk_widget_unparent(child)
        }
        for (c in wanted) {
            if (gtk_widget_get_parent(c) != p) {
                if (gtk_widget_get_parent(c) != null) gtk_widget_unparent(c)
                gtk_widget_set_parent(c, p)
            }
        }
        gtk_widget_queue_allocate(p)
    }

    override fun setFrame(view: ViewId, frame: Rect) {
        val i = info(view)
        if (i.frame != frame) {
            i.frame = frame
            gtk_widget_queue_allocate(i.widget)
            gtk_widget_get_parent(i.widget)?.let { gtk_widget_queue_allocate(it) }
        }
    }

    override fun frameOf(view: ViewId): Rect {
        val i = info(view)
        // compute_bounds is the transformed box's bounding rectangle: a transformed view reports the frame the core gave it
        i.paint?.let { p -> if (p.translateX != 0f || p.translateY != 0f || p.rotate != 0f || p.scale != 1f) return i.frame }
        return memScoped {
            val r = alloc<graphene_rect_t>()
            val parent = gtk_widget_get_parent(i.widget)
            if (parent == null || gtk_widget_compute_bounds(i.widget, parent, r.ptr) == 0) Rect(0, 0, 0, 0)
            else Rect(r.origin.x.roundToInt(), r.origin.y.roundToInt(), r.size.width.roundToInt(), r.size.height.roundToInt())
        }
    }

    override fun paint(view: ViewId, kind: ViewKind, paint: Paint) {
        val i = info(view)
        val before = i.paint
        i.paint = paint
        if (before?.text != paint.text) {
            label(i)?.let { l ->
                val attrs = textAttributes(paint.text)
                gtk_label_set_attributes(l, attrs)
                pango_attr_list_unref(attrs)
                gtk_label_set_ellipsize(l, if (paint.text.lines > 0) PangoEllipsizeMode.PANGO_ELLIPSIZE_END else PangoEllipsizeMode.PANGO_ELLIPSIZE_NONE)
                gtk_label_set_lines(l, if (paint.text.lines > 0) paint.text.lines else -1)
                if (kind == ViewKind.Text) {
                    gtk_label_set_xalign(l, when (paint.text.align) { 1 -> 0.5f; 2 -> 1f; else -> 0f })
                    gtk_label_set_justify(l, when (paint.text.align) { 1 -> GtkJustification.GTK_JUSTIFY_CENTER; 2 -> GtkJustification.GTK_JUSTIFY_RIGHT; else -> GtkJustification.GTK_JUSTIFY_LEFT })
                }
            }
        }
        if (kind == ViewKind.Input || kind == ViewKind.Textarea) {
            // A field the app gave a box is drawn by that box; a plain one keeps the theme's own.
            val styled = paint.background != null || paint.borders.any { it > 0f }
            i.native?.let { n -> if (styled) gtk_widget_add_css_class(n, "nuclo-bare") else gtk_widget_remove_css_class(n, "nuclo-bare") }
            i.fills = !styled
            entry(view)?.let { e ->
                val attrs = textAttributes(paint.text)
                gtk_entry_set_attributes(e, attrs)
                pango_attr_list_unref(attrs)
                gtk_editable_set_alignment(e.reinterpret(), when (paint.text.align) { 1 -> 0.5f; 2 -> 1f; else -> 0f })
            }
        }
        if (kind == ViewKind.Image) i.native?.let { gtk_picture_set_content_fit(it.reinterpret(), when (paint.fit) { 1 -> GtkContentFit.GTK_CONTENT_FIT_CONTAIN; 2 -> GtkContentFit.GTK_CONTENT_FIT_FILL; else -> GtkContentFit.GTK_CONTENT_FIT_COVER }) }
        gtk_widget_set_opacity(i.widget, paint.opacity.coerceIn(0f, 1f).toDouble())
        gtk_widget_set_visible(i.widget, if (paint.visible) 1 else 0)
        // GTK does not pick a widget that can't be targeted, nor anything in it.
        gtk_widget_set_can_target(i.widget, if (paint.pointer) 1 else 0)
        if (before == null || before.translateX != paint.translateX || before.translateY != paint.translateY || before.rotate != paint.rotate || before.scale != paint.scale) {
            gtk_widget_get_parent(i.widget)?.let { gtk_widget_queue_allocate(it) }   // the transform is part of where the parent puts this view
        }
        if (before?.insets?.contentEquals(paint.insets) != true) gtk_widget_queue_allocate(i.widget)
        gtk_widget_queue_draw(i.widget)
    }

    override fun measure(view: ViewId, maxWidth: Float): Size {
        val i = info(view)
        val paint = i.paint
        fun textSize(text: String): Size {
            val layout = gtk_widget_create_pango_layout(i.widget, text)
            if (paint != null) { val a = textAttributes(paint.text); pango_layout_set_attributes(layout, a); pango_attr_list_unref(a) }
            val (w, h) = memScoped {
                val wv = alloc<IntVar>(); val hv = alloc<IntVar>()
                pango_layout_get_pixel_size(layout, wv.ptr, hv.ptr)
                wv.value to hv.value
            }
            var result = Size(w.toFloat(), h.toFloat())
            if (w > maxWidth) {
                pango_layout_set_wrap(layout, PangoWrapMode.PANGO_WRAP_WORD_CHAR)
                pango_layout_set_width(layout, maxWidth.toInt() * PANGO_SCALE)
                if (paint != null && paint.text.lines > 0) {
                    pango_layout_set_ellipsize(layout, PangoEllipsizeMode.PANGO_ELLIPSIZE_END)
                    pango_layout_set_height(layout, -paint.text.lines)
                }
                val h2 = memScoped { val wv = alloc<IntVar>(); val hv = alloc<IntVar>(); pango_layout_get_pixel_size(layout, wv.ptr, hv.ptr); hv.value }
                result = Size(maxWidth, h2.toFloat())
            }
            g_object_unref(layout)
            return result
        }
        return when (i.kind) {
            ViewKind.Text, ViewKind.Button -> textSize(label(i)?.let { gtk_label_get_text(it)?.toKString() } ?: "")
            ViewKind.Input -> Size(maxWidth, textSize("Ag").h)
            ViewKind.Textarea -> controlText(view).let { t -> textSize(if (t.isEmpty()) "Ag" else t).let { Size(maxWidth, max(it.h, 3f * (paint?.text?.lineHeight ?: it.h))) } }
            ViewKind.Checkbox -> memScoped {
                val w = alloc<IntVar>(); val h = alloc<IntVar>()
                gtk_widget_measure(i.native, GtkOrientation.GTK_ORIENTATION_HORIZONTAL, -1, null, w.ptr, null, null)
                gtk_widget_measure(i.native, GtkOrientation.GTK_ORIENTATION_VERTICAL, -1, null, h.ptr, null, null)
                Size(w.value.toFloat(), h.value.toFloat())
            }
            else -> Size(0f, 0f)
        }
    }

    override fun setText(view: ViewId, text: String) { label(info(view))?.let { gtk_label_set_text(it, text) } }

    override fun listen(view: ViewId, input: InputKind) {
        val i = info(view)
        i.hit = true
        when (input) {
            InputKind.Click -> {
                if (i.kind == ViewKind.Button) return   // A button reports its own clicks.
                val ref = StableRef.create(view)
                i.refs.add(ref)
                val click = gtk_gesture_click_new()!!
                g_signal_connect_data(click.reinterpret<GObject>(), "released", staticCFunction(::clickReleased).reinterpret(), ref.asCPointer(), null, 0u)
                gtk_widget_add_controller(i.widget, click.reinterpret())
            }
            InputKind.Pointer -> {
                val ref = StableRef.create(view)
                i.refs.add(ref)
                val click = gtk_gesture_click_new()!!
                g_signal_connect_data(click.reinterpret<GObject>(), "pressed", staticCFunction(::pointerPressed).reinterpret(), ref.asCPointer(), null, 0u)
                g_signal_connect_data(click.reinterpret<GObject>(), "released", staticCFunction(::pointerReleased).reinterpret(), ref.asCPointer(), null, 0u)
                g_signal_connect_data(click.reinterpret<GObject>(), "cancel", staticCFunction(::pointerCancelled).reinterpret(), ref.asCPointer(), null, 0u)
                gtk_widget_add_controller(i.widget, click.reinterpret())
                drag(i).pointers = true
            }
            InputKind.Pan -> { drag(i).pan = true }
            InputKind.Pinch -> {
                val ref = StableRef.create(view)
                i.refs.add(ref)
                val zoom = gtk_gesture_zoom_new()!!
                g_signal_connect_data(zoom.reinterpret<GObject>(), "begin", staticCFunction(::zoomBegin).reinterpret(), ref.asCPointer(), null, 0u)
                g_signal_connect_data(zoom.reinterpret<GObject>(), "scale-changed", staticCFunction(::zoomChanged).reinterpret(), ref.asCPointer(), null, 0u)
                g_signal_connect_data(zoom.reinterpret<GObject>(), "end", staticCFunction(::zoomEnd).reinterpret(), ref.asCPointer(), null, 0u)
                gtk_widget_add_controller(i.widget, zoom.reinterpret())
            }
            InputKind.LongPress -> {
                val ref = StableRef.create(view)
                i.refs.add(ref)
                val press = gtk_gesture_long_press_new()!!
                g_signal_connect_data(press.reinterpret<GObject>(), "pressed", staticCFunction(::longPressed).reinterpret(), ref.asCPointer(), null, 0u)
                gtk_widget_add_controller(i.widget, press.reinterpret())
            }
            InputKind.DoubleClick -> {
                val ref = StableRef.create(view)
                i.refs.add(ref)
                val click = gtk_gesture_click_new()!!
                g_signal_connect_data(click.reinterpret<GObject>(), "pressed", staticCFunction(::doublePressed).reinterpret(), ref.asCPointer(), null, 0u)
                gtk_widget_add_controller(i.widget, click.reinterpret())
            }
            InputKind.Keys -> {
                val ref = StableRef.create(view)
                i.refs.add(ref)
                gtk_widget_set_focusable(i.widget, 1)
                val key = gtk_event_controller_key_new()!!
                g_signal_connect_data(key.reinterpret<GObject>(), "key-pressed", staticCFunction(::keyPressed).reinterpret(), ref.asCPointer(), null, 0u)
                gtk_widget_add_controller(i.widget, key)
                val focus = gtk_gesture_click_new()!!
                g_signal_connect_data(focus.reinterpret<GObject>(), "pressed", staticCFunction(::grabFocus).reinterpret(), ref.asCPointer(), null, 0u)
                gtk_widget_add_controller(i.widget, focus.reinterpret())
            }
            InputKind.Scroll -> {
                val ref = StableRef.create(view)
                i.refs.add(ref)
                val sc = i.native?.reinterpret<GtkScrolledWindow>()
                if (sc != null) {
                    g_signal_connect_data(gtk_scrolled_window_get_vadjustment(sc)?.reinterpret<GObject>(), "value-changed", staticCFunction(::scrolled).reinterpret(), ref.asCPointer(), null, 0u)
                    g_signal_connect_data(gtk_scrolled_window_get_hadjustment(sc)?.reinterpret<GObject>(), "value-changed", staticCFunction(::scrolled).reinterpret(), ref.asCPointer(), null, 0u)
                }
            }
            InputKind.Hover -> {
                val ref = StableRef.create(view)
                i.refs.add(ref)
                val motion = gtk_event_controller_motion_new()!!
                g_signal_connect_data(motion.reinterpret<GObject>(), "enter", staticCFunction(::hoverEnter).reinterpret(), ref.asCPointer(), null, 0u)
                g_signal_connect_data(motion.reinterpret<GObject>(), "leave", staticCFunction(::hoverLeave).reinterpret(), ref.asCPointer(), null, 0u)
                gtk_widget_add_controller(i.widget, motion)
            }
            else -> {}
        }
    }

    private fun drag(i: VInfo): DragState {
        i.drag?.let { return it }
        val d = DragState(i.id)
        i.drag = d
        val ref = StableRef.create(d)
        i.refs.add(ref)
        val g = gtk_gesture_drag_new()!!
        g_signal_connect_data(g.reinterpret<GObject>(), "drag-begin", staticCFunction(::dragBegin).reinterpret(), ref.asCPointer(), null, 0u)
        g_signal_connect_data(g.reinterpret<GObject>(), "drag-update", staticCFunction(::dragUpdate).reinterpret(), ref.asCPointer(), null, 0u)
        g_signal_connect_data(g.reinterpret<GObject>(), "drag-end", staticCFunction(::dragEnd).reinterpret(), ref.asCPointer(), null, 0u)
        gtk_widget_add_controller(i.widget, g.reinterpret())
        return d
    }

    // ---- layout extras

    override fun makeScrollable(view: ViewId, horizontal: Boolean) {
        val i = info(view)
        val content = g_object_new(nucloViewType, null)!!.reinterpret<GtkWidget>()
        val ci = VInfo(-view, ViewKind.Box, content)
        ci.content = true
        byWidget[key(content)] = ci
        val scroller = gtk_scrolled_window_new()!!
        gtk_scrolled_window_set_policy(scroller.reinterpret(),
            if (horizontal) GtkPolicyType.GTK_POLICY_EXTERNAL else GtkPolicyType.GTK_POLICY_NEVER,
            if (horizontal) GtkPolicyType.GTK_POLICY_NEVER else GtkPolicyType.GTK_POLICY_AUTOMATIC)   // a row scrolls without a bar, as elsewhere
        gtk_scrolled_window_set_child(scroller.reinterpret(), content)
        gtk_widget_add_css_class(scroller, "nuclo-scroll")
        gtk_widget_set_parent(scroller, i.widget)
        i.native = scroller; i.fills = true
        i.contentInfo = ci
    }

    override fun setContentSize(view: ViewId, width: Int, height: Int) {
        val ci = info(view).contentInfo ?: return
        val frame = Rect(0, 0, width, height)
        if (ci.frame != frame) { ci.frame = frame; gtk_widget_queue_resize(ci.widget) }
    }

    override fun reorder(parent: ViewId, children: IntArray) {
        val p = container(parent)
        for (c in children) { val w = info(c).widget; if (gtk_widget_get_parent(w) == p) gtk_widget_insert_before(w, p, null) }
    }

    // ---- windows

    private fun screenOf(root: ViewId): CPointer<GtkWidget> {
        val i = info(root)
        i.root = true
        roots.add(i)
        val scroller = gtk_scrolled_window_new()!!
        gtk_scrolled_window_set_policy(scroller.reinterpret(), GtkPolicyType.GTK_POLICY_NEVER, GtkPolicyType.GTK_POLICY_AUTOMATIC)
        gtk_widget_set_vexpand(scroller, 1)
        gtk_scrolled_window_set_child(scroller.reinterpret(), i.widget)
        gtk_widget_add_css_class(scroller, "nuclo-screen")
        val ref = StableRef.create(root)
        i.refs.add(ref)
        val adj = gtk_scrolled_window_get_vadjustment(scroller.reinterpret())?.reinterpret<GObject>()
        g_signal_connect_data(adj, "value-changed", staticCFunction(::screenScrolled).reinterpret(), ref.asCPointer(), null, 0u)
        g_signal_connect_data(adj, "changed", staticCFunction(::screenScrolled).reinterpret(), ref.asCPointer(), null, 0u)
        return scroller
    }

    override fun showScreen(root: ViewId) {
        gtk_overlay_set_child(layers.reinterpret(), screenOf(root))
        requestLayout()
    }

    override fun showOverlay(root: ViewId) {
        val i = info(root)
        i.root = true
        roots.add(i)
        gtk_overlay_add_overlay(layers.reinterpret(), i.widget)
        requestLayout()
    }

    override fun requestLayout() {
        for (r in roots) gtk_widget_queue_resize(r.widget)
        framePending = true   // the window is presented right after the app's first render; a hidden one gets no frame, so waits are capped
    }

    override fun windowWidth(): Float {
        val w = gtk_widget_get_width(window)
        if (w > 0) return w.toFloat()
        return memScoped { val wv = alloc<IntVar>(); val hv = alloc<IntVar>(); gtk_window_get_default_size(window.reinterpret(), wv.ptr, hv.ptr); wv.value.toFloat() }
    }

    // ---- the main loop

    override fun setTimer(ms: Int, callback: () -> Unit): Int {
        val id = nextTimer++
        var due: (() -> Unit)? = null
        var waits = 0
        // What the app changed before the timer was due is not on screen until GTK laid out: wait for that frame (a hidden window never gets one).
        due = {
            if (ms > 0 && framePending && waits < 15) { waits++; arm(id, 16, due!!) }
            else { timers.remove(id); callback() }
        }
        arm(id, ms, due)
        return id
    }

    private fun arm(id: Int, ms: Int, run: () -> Unit) {
        val ref = StableRef.create(TimerBox(run))
        timers[id] = g_timeout_add(max(1, ms).toUInt(), staticCFunction(::timerFired), ref.asCPointer())
    }

    override fun clearTimer(timer: Int) { timers.remove(timer)?.let { g_source_remove(it) } }
    override fun log(line: String) { println(line) }
    override fun now(): Double = kotlin.time.Clock.System.now().toEpochMilliseconds().toDouble()
    override fun env(name: String): String? = getenv(name)?.toKString()
    override fun exit(code: Int) { platform.posix.fflush(null); platform.posix._exit(code) }   // GTK's teardown can crash a process that is exiting from inside its main loop
}

private fun clickReleased(gesture: CPointer<GtkGestureClick>?, nPress: Int, x: Double, y: Double, data: gpointer?) {
    gtk_gesture_set_state(gesture?.reinterpret(), GtkEventSequenceState.GTK_EVENT_SEQUENCE_CLAIMED)
    Host.event(data!!.asStableRef<Int>().get(), ViewEvent.Click)
}

private fun pointerOf(gesture: CPointer<GtkGestureClick>?, x: Double, y: Double): PointerEvent = PointerEvent(x, y, x, y, 0)

private fun pointerPressed(gesture: CPointer<GtkGestureClick>?, nPress: Int, x: Double, y: Double, data: gpointer?) {
    Host.pointer(data!!.asStableRef<Int>().get(), PointerPhase.Down, pointerOf(gesture, x, y))
}

private fun pointerReleased(gesture: CPointer<GtkGestureClick>?, nPress: Int, x: Double, y: Double, data: gpointer?) {
    Host.pointer(data!!.asStableRef<Int>().get(), PointerPhase.Up, pointerOf(gesture, x, y))
}

private fun pointerCancelled(gesture: CPointer<GtkGestureClick>?, sequence: COpaquePointer?, data: gpointer?) {
    Host.pointer(data!!.asStableRef<Int>().get(), PointerPhase.Cancel, PointerEvent(0.0, 0.0, 0.0, 0.0, 0))
}

private fun hoverEnter(controller: COpaquePointer?, x: Double, y: Double, data: gpointer?) { Host.hover(data!!.asStableRef<Int>().get(), true) }
private fun hoverLeave(controller: COpaquePointer?, data: gpointer?) { Host.hover(data!!.asStableRef<Int>().get(), false) }

private fun nowMs(): Double = kotlin.time.Clock.System.now().toEpochMilliseconds().toDouble()

private fun dragBegin(gesture: COpaquePointer?, x: Double, y: Double, data: gpointer?) {
    val d = data!!.asStableRef<DragState>().get()
    d.panning = false; d.startX = x; d.startY = y; d.lastX = 0.0; d.lastY = 0.0; d.lastMs = nowMs(); d.velX = 0.0; d.velY = 0.0
}

private fun dragUpdate(gesture: COpaquePointer?, ox: Double, oy: Double, data: gpointer?) {
    val d = data!!.asStableRef<DragState>().get()
    if (d.pointers) Host.pointer(d.id, PointerPhase.Move, PointerEvent(d.startX + ox, d.startY + oy, d.startX + ox, d.startY + oy, 0))
    if (!d.pan) return
    val now = nowMs()
    val dt = (now - d.lastMs) / 1000
    if (dt > 0) { d.velX = (ox - d.lastX) / dt; d.velY = (oy - d.lastY) / dt }
    d.lastX = ox; d.lastY = oy; d.lastMs = now
    if (!d.panning) {
        if (kotlin.math.hypot(ox, oy) >= 8.0) {
            d.panning = true
            // the translation counts from where the drag was recognized, so the view does not jump
            d.baseX = ox; d.baseY = oy
            Host.pan(d.id, PanEvent("start", 0.0, 0.0, 0.0, 0.0, d.startX + ox, d.startY + oy))
        }
    } else Host.pan(d.id, PanEvent("move", ox - d.baseX, oy - d.baseY, d.velX, d.velY, d.startX + ox, d.startY + oy))
}

private fun dragEnd(gesture: COpaquePointer?, ox: Double, oy: Double, data: gpointer?) {
    val d = data!!.asStableRef<DragState>().get()
    if (d.panning) { d.panning = false; Host.pan(d.id, PanEvent("end", ox - d.baseX, oy - d.baseY, d.velX, d.velY, d.startX + ox, d.startY + oy)) }
}

private fun zoomScale(gesture: COpaquePointer?): Triple<Double, Double, Double> = memScoped {
    val cx = alloc<DoubleVar>(); val cy = alloc<DoubleVar>()
    gtk_gesture_get_bounding_box_center(gesture?.reinterpret(), cx.ptr, cy.ptr)
    Triple(gtk_gesture_zoom_get_scale_delta(gesture?.reinterpret()), cx.value, cy.value)
}

private fun zoomBegin(gesture: COpaquePointer?, sequence: COpaquePointer?, data: gpointer?) {
    val (_, x, y) = zoomScale(gesture)
    Host.pinch(data!!.asStableRef<Int>().get(), PinchEvent("start", 1.0, x, y))
}

private fun zoomChanged(gesture: COpaquePointer?, scale: Double, data: gpointer?) {
    val (_, x, y) = zoomScale(gesture)
    Host.pinch(data!!.asStableRef<Int>().get(), PinchEvent("move", scale, x, y))
}

private fun zoomEnd(gesture: COpaquePointer?, sequence: COpaquePointer?, data: gpointer?) {
    val (s, x, y) = zoomScale(gesture)
    Host.pinch(data!!.asStableRef<Int>().get(), PinchEvent("end", s, x, y))
}

private fun longPressed(gesture: COpaquePointer?, x: Double, y: Double, data: gpointer?) {
    Host.pointer(data!!.asStableRef<Int>().get(), PointerPhase.LongPress, PointerEvent(x, y, x, y, 0))
}

private fun doublePressed(gesture: COpaquePointer?, nPress: Int, x: Double, y: Double, data: gpointer?) {
    if (nPress == 2) Host.pointer(data!!.asStableRef<Int>().get(), PointerPhase.DoubleClick, PointerEvent(x, y, x, y, 0))
}

private fun grabFocus(gesture: COpaquePointer?, nPress: Int, x: Double, y: Double, data: gpointer?) {
    byId[data!!.asStableRef<Int>().get()]?.widget?.let { gtk_widget_grab_focus(it) }
}

private fun keyPressed(controller: COpaquePointer?, keyval: UInt, keycode: UInt, state: UInt, data: gpointer?): Int {
    val name = when (keyval.toInt()) {
        0xff0d, 0xff8d -> "Enter"; 0xff1b -> "Escape"; 0xff08 -> "Backspace"; 0xffff -> "Delete"; 0xff09 -> "Tab"
        0xff51 -> "ArrowLeft"; 0xff52 -> "ArrowUp"; 0xff53 -> "ArrowRight"; 0xff54 -> "ArrowDown"
        else -> gdk_keyval_to_unicode(keyval).let { if (it == 0u) "" else it.toInt().toChar().toString() }
    }
    Host.key(data!!.asStableRef<Int>().get(), name)
    return 0
}

private fun scrolled(adjustment: COpaquePointer?, data: gpointer?) {
    val i = byId[data!!.asStableRef<Int>().get()] ?: return
    val sc = i.native?.reinterpret<GtkScrolledWindow>() ?: return
    val v = gtk_scrolled_window_get_vadjustment(sc)
    val h = gtk_scrolled_window_get_hadjustment(sc)
    Host.scrolled(i.id, ScrollEvent(gtk_adjustment_get_value(v), gtk_adjustment_get_value(h), gtk_adjustment_get_upper(v), gtk_adjustment_get_upper(h),
        gtk_adjustment_get_page_size(v), gtk_adjustment_get_page_size(h)))
}

private fun screenScrolled(adjustment: COpaquePointer?, data: gpointer?) {
    val adj = adjustment?.reinterpret<GtkAdjustment>() ?: return
    Host.screenScrolled(data!!.asStableRef<Int>().get(), gtk_adjustment_get_value(adj).toFloat(), gtk_adjustment_get_page_size(adj).toFloat())
}

private var pendingEntry: (() -> Unit)? = null

private fun activate(app: CPointer<GApplication>?, data: gpointer?) {
    // Screens are white with black text unless the app says otherwise, as on the other platforms.
    adw_style_manager_set_color_scheme(adw_style_manager_get_default(), AdwColorScheme.ADW_COLOR_SCHEME_FORCE_LIGHT)
    val provider = gtk_css_provider_new()
    gtk_css_provider_load_from_string(provider, CSS)
    gtk_style_context_add_provider_for_display(gdk_display_get_default(), provider?.reinterpret(), GTK_STYLE_PROVIDER_PRIORITY_APPLICATION.toUInt())
    val layers = gtk_overlay_new()!!
    val window = adw_application_window_new(app?.reinterpret())!!
    val size = getenv("NUCLO_SIZE")?.toKString()?.split('x')
    gtk_window_set_default_size(window.reinterpret(), size?.getOrNull(0)?.toIntOrNull() ?: 420, size?.getOrNull(1)?.toIntOrNull() ?: 780)
    adw_application_window_set_content(window.reinterpret(), layers)
    val backend = GtkBackend(window, layers)
    Host.start(backend, pendingEntry!!)
    gtk_window_present(window.reinterpret())
}

fun runGtkApp(entry: () -> Unit) {
    if (getenv("NUCLO_HEADLESS")?.toKString() == "1") exit(runHeadless({ getenv(it)?.toKString() }, entry))
    pendingEntry = entry
    val app = adw_application_new("dev.nuclo.app", G_APPLICATION_NON_UNIQUE)!!
    g_signal_connect_data(app.reinterpret<GObject>(), "activate", staticCFunction(::activate).reinterpret(), null, null, 0u)
    g_application_run(app.reinterpret(), 0, null)
}
