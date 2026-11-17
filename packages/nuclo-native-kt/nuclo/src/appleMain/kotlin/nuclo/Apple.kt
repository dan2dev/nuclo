package nuclo

import kotlinx.cinterop.*
import nuclo.host.*
import platform.CoreGraphics.*
import platform.Foundation.*
import platform.QuartzCore.CALayer
import platform.darwin.dispatch_async
import platform.darwin.dispatch_get_main_queue

/** 0xRRGGBBAA → a CGColor. The caller releases it. */
internal fun cgColor(rgba: UInt): CGColorRef? = CGColorCreateSRGB(
    ((rgba shr 24) and 0xffu).toDouble() / 255.0, ((rgba shr 16) and 0xffu).toDouble() / 255.0,
    ((rgba shr 8) and 0xffu).toDouble() / 255.0, (rgba and 0xffu).toDouble() / 255.0,
)

internal fun setLayerColor(layer: CALayer, apply: (CGColorRef?) -> Unit, rgba: UInt?) {
    if (rgba == null) { apply(null); return }
    val c = cgColor(rgba)
    apply(c)
    CGColorRelease(c)
}

/** Background, corners, border, shadow and clipping of a view's layer. Both `UIView.layer` and a layer-backed
 *  `NSView.layer` are CALayers. Per-side borders that differ are four sublayers; one border when the sides agree. */
internal fun paintLayer(layer: CALayer, paint: Paint, width: Double, height: Double) {
    setLayerColor(layer, { layer.backgroundColor = it }, paint.background)
    layer.cornerRadius = minOf(paint.radius.toDouble(), minOf(width, height) / 2.0)
    layer.masksToBounds = paint.clip
    val b = paint.borders
    val same = b[0] == b[1] && b[1] == b[2] && b[2] == b[3] && paint.borderColors.all { it == paint.borderColors[0] }
    // sublayers for sides that differ
    val old = layer.sublayers?.filterIsInstance<CALayer>()?.filter { it.name == "nuclo-border" } ?: emptyList()
    for (l in old) l.removeFromSuperlayer()
    if (same || b.all { it == 0f }) {
        layer.borderWidth = b[0].toDouble()
        setLayerColor(layer, { layer.borderColor = it }, if (b[0] > 0f) paint.borderColors[0].toUInt() else null)
    } else {
        layer.borderWidth = 0.0
        val rects = listOf(
            doubleArrayOf(0.0, 0.0, width, b[0].toDouble()), doubleArrayOf(width - b[1], 0.0, b[1].toDouble(), height),
            doubleArrayOf(0.0, height - b[2], width, b[2].toDouble()), doubleArrayOf(0.0, 0.0, b[3].toDouble(), height),
        )
        for (i in 0..3) {
            if (b[i] <= 0f) continue
            val side = CALayer()
            side.name = "nuclo-border"
            side.frame = CGRectMake(rects[i][0], rects[i][1], rects[i][2], rects[i][3])
            setLayerColor(side, { side.backgroundColor = it }, paint.borderColors[i].toUInt())
            layer.addSublayer(side)
        }
    }
    val sh = paint.shadow
    if (sh != null) {
        setLayerColor(layer, { layer.shadowColor = it }, sh.color or 0xffu)
        layer.shadowOpacity = ((sh.color and 0xffu).toFloat() / 255f)
        layer.shadowRadius = sh.blur.toDouble() / 2.0
        layer.shadowOffset = CGSizeMake(sh.dx.toDouble(), sh.dy.toDouble())
    } else layer.shadowOpacity = 0f
    layer.opacity = paint.opacity
}

/** Runs `block` on the main queue (a network callback arrives on another thread). */
internal fun onMain(block: () -> Unit) {
    dispatch_async(dispatch_get_main_queue()) { block() }
}

internal fun appleEnv(name: String): String? = NSProcessInfo.processInfo.environment[name] as? String

internal fun appleNow(): Double = NSDate().timeIntervalSince1970 * 1000.0

/** NSTimer-backed one-shot timers by id (the core re-arms intervals itself). */
internal class AppleTimers {
    private val timers = HashMap<Int, NSTimer>()
    private var next = 1

    fun set(ms: Int, callback: () -> Unit): Int {
        val id = next++
        timers[id] = NSTimer.scheduledTimerWithTimeInterval(ms / 1000.0, false) { _ ->
            timers.remove(id)
            callback()
        }
        return id
    }

    fun clear(id: Int) { timers.remove(id)?.invalidate() }
}

internal fun ByteArray.toNSData(): NSData =
    if (isEmpty()) NSData() else usePinned { NSData.create(bytes = it.addressOf(0), length = size.toULong()) }

internal fun NSData.toByteArray(): ByteArray {
    val n = length.toInt()
    val out = ByteArray(n)
    if (n > 0) out.usePinned { platform.posix.memcpy(it.addressOf(0), bytes, n.toULong()) }
    return out
}

/** An HTTP exchange through NSURLSession; `done` runs on the main queue. */
internal fun appleHttp(request: HttpRequest, done: (HttpResult) -> Unit) {
    val url = NSURL.URLWithString(request.url)
    if (url == null) { done(HttpResult(0, ByteArray(0), "bad url")); return }
    val req = NSMutableURLRequest.requestWithURL(url)
    req.setHTTPMethod(request.method)
    for ((k, v) in request.headers) req.setValue(v, forHTTPHeaderField = k)
    request.body?.let { req.setHTTPBody(it.encodeToByteArray().toNSData()) }
    NSURLSession.sharedSession.dataTaskWithRequest(req) { data, response, error ->
        val status = (response as? NSHTTPURLResponse)?.statusCode?.toInt() ?: 0
        val bytes = data?.toByteArray() ?: ByteArray(0)
        val failure = if (response == null) (error?.localizedDescription ?: "no response") else null
        onMain { done(HttpResult(status, bytes, failure)) }
    }.resume()
}

/** Where an image of `iw` × `ih` is drawn in a `w` × `h` box: cover, contain or fill (0, 1, 2). x, y, width, height. */
internal fun fitImage(iw: Double, ih: Double, w: Double, h: Double, fit: Int): DoubleArray {
    if (iw <= 0 || ih <= 0 || fit == 2) return doubleArrayOf(0.0, 0.0, w, h)
    val s = if (fit == 0) maxOf(w / iw, h / ih) else minOf(w / iw, h / ih)
    val dw = iw * s
    val dh = ih * s
    return doubleArrayOf((w - dw) / 2, (h - dh) / 2, dw, dh)
}
