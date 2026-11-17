// NucloJvm.kt — what NucloJs.kt needs from its platform, on a plain JVM: an event loop on the calling thread
// (Android's Handler order: by due time, then in posting order) and the console.

package dev.nuclo.runtime

import java.util.PriorityQueue

private class Posted(val due: Long, val seq: Long, val job: Runnable)

private val posted = PriorityQueue<Posted>(compareBy<Posted>({ it.due }, { it.seq }))
private var postSeq = 0L

private fun nowMs() = System.nanoTime() / 1_000_000

internal fun jsPost(ms: Long, job: Runnable) {
    posted.add(Posted(nowMs() + ms.coerceAtLeast(0), postSeq++, job))
}

/** Runs `job` next, before anything already due. */
internal fun jsPostFirst(job: Runnable) {
    posted.add(Posted(Long.MIN_VALUE / 2, postSeq++, job))
}

internal fun jsCancelPost(job: Runnable) {
    posted.removeIf { it.job === job }
}

fun consoleLog(vararg values: String) = println(values.joinToString(" "))

/** Runs posted jobs as they fall due until `done()` or nothing is left, at most `maxMs`. */
fun jvmRunLoop(maxMs: Long, done: () -> Boolean) {
    val end = nowMs() + maxMs
    while (!done() && nowMs() < end) {
        val next = posted.peek() ?: return
        val wait = next.due - nowMs()
        if (wait > 0) Thread.sleep(minOf(wait, end - nowMs()).coerceAtLeast(0)) else posted.poll().job.run()
    }
}
