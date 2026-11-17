package nuclo

import kotlin.coroutines.Continuation
import kotlin.coroutines.EmptyCoroutineContext
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.startCoroutine
import kotlin.coroutines.suspendCoroutine

/** Runs a suspending block on the UI thread. An uncaught exception is logged, not thrown. */
fun launch(block: suspend () -> Unit) {
    block.startCoroutine(Continuation(EmptyCoroutineContext) { result ->
        result.exceptionOrNull()?.let { println("nuclo: uncaught exception in launch: $it") }
    })
}

class Response internal constructor(val status: Int, private val body: String) {
    val ok: Boolean get() = status in 200..299
    fun text(): String = body
    /** The body parsed as JSON: Map<String, Any?>, List<Any?>, String, Double, Boolean or null. */
    fun json(): Any? = parseJson(body)
}

/** Throws Exception("fetch failed: <reason>") when there was no HTTP answer. */
suspend fun fetch(url: String, method: String = "GET", body: String? = null, headers: Map<String, String> = emptyMap()): Response =
    suspendCoroutine { cont ->
        engineHttp(method, url, headers, body) { status, text, error ->
            if (error != null) cont.resumeWithException(Exception("fetch failed: $error")) else cont.resume(Response(status, text))
        }
    }

suspend fun delay(ms: Number) = suspendCoroutine<Unit> { cont -> engineSetTimer(ms.toDouble(), false) { cont.resume(Unit) } }

class Timer internal constructor(internal val id: Int)
fun setTimeout(ms: Number, callback: () -> Unit): Timer = Timer(engineSetTimer(ms.toDouble(), false, callback))
fun setInterval(ms: Number, callback: () -> Unit): Timer = Timer(engineSetTimer(ms.toDouble(), true, callback))
fun clearTimeout(timer: Timer) = engineClearTimer(timer.id)
fun clearInterval(timer: Timer) = engineClearTimer(timer.id)

class Frame internal constructor(internal val id: Int)
/** Runs `callback` before the next frame; `time` is milliseconds since the epoch. */
fun requestAnimationFrame(callback: (time: Double) -> Unit): Frame = Frame(engineRequestFrame(callback))
fun cancelAnimationFrame(frame: Frame) = engineCancelFrame(frame.id)
/** Milliseconds since the epoch, as Date.now(). */
fun now(): Double = engineNow()
