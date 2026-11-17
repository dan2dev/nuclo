package nuclo.core

import nuclo.host.HttpRequest
import nuclo.host.HttpResult

/** Timers, frames and http on the backend. A public timer id stays the same while an interval re-arms. */
internal object Tasks {
    private var next = 1
    private val live = HashMap<Int, Int>()

    fun reset() { next = 1; live.clear() }

    fun setTimer(ms: Double, repeat: Boolean, callback: () -> Unit): Int {
        val id = next++
        arm(id, ms.toInt().coerceAtLeast(0), repeat, callback)
        return id
    }

    private fun arm(id: Int, ms: Int, repeat: Boolean, callback: () -> Unit) {
        live[id] = Runtime.backend.setTimer(ms) {
            if (repeat) arm(id, ms, true, callback) else live.remove(id)
            callback()
            Runtime.settle()
        }
    }

    fun clearTimer(id: Int) { live.remove(id)?.let { Runtime.backend.clearTimer(it) } }

    fun requestFrame(callback: (Double) -> Unit): Int {
        val id = next++
        live[id] = Runtime.backend.requestFrame { t -> live.remove(id); callback(t); Runtime.settle() }
        return id
    }

    fun cancelFrame(id: Int) { live.remove(id)?.let { Runtime.backend.cancelFrame(it) } }

    /** An HTTP exchange. In test mode there is no network on any target (so a script's dumps are the same everywhere). */
    fun request(request: HttpRequest, done: (HttpResult) -> Unit) {
        if (Runtime.testMode) Runtime.backend.setTimer(0) { done(HttpResult(0, ByteArray(0), "no network in headless")) }
        else Runtime.backend.http(request, done)
    }

    fun http(method: String, url: String, headers: Map<String, String>, body: String?, done: (Int, String, String?) -> Unit) {
        request(HttpRequest(method, url, headers, body)) { r ->
            done(r.status, r.body.decodeToString(), r.error)
            Runtime.settle()
        }
    }
}
