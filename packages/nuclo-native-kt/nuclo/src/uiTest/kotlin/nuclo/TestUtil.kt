package nuclo

import nuclo.host.HeadlessBackend
import nuclo.host.Host

/** A fresh runtime on a fresh headless backend. */
fun fresh(width: Int = 420, height: Int = 780): HeadlessBackend {
    val b = HeadlessBackend(width = width, height = height)
    Host.start(b) {}
    return b
}
