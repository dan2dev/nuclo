// NucloJs.kt — JavaScript's semantics for the Kotlin output, without Android: timers, microtasks and promises, JSON
// decoding, numbers and strings as JavaScript prints and compares them, array helpers, bigint. Shared by the Android
// runtime (NucloRuntime.kt) and the plain-JVM build the parity test runs (hosts/jvm); each defines the event loop this
// posts to (`jsPost`, `jsCancelPost`) and `consoleLog`.

@file:Suppress("unused", "FunctionName", "MemberVisibilityCanBePrivate")

package dev.nuclo.runtime

import kotlin.coroutines.Continuation
import kotlin.coroutines.EmptyCoroutineContext
import kotlin.coroutines.startCoroutine
import kotlin.math.max
import kotlin.math.min

// ---------------------------------------------------------------------------
// Timers
// ---------------------------------------------------------------------------

class NTimer internal constructor() {
    internal var runnable: Runnable? = null
    internal var cancelled = false

    internal fun cancel() {
        cancelled = true
        runnable?.let { jsCancelPost(it) }
    }
}

// A timer runs as its own task: the microtasks before it first, then its callback, then the microtasks it queued.
fun setTimeout(callback: () -> Unit, ms: Double): NTimer {
    val timer = NTimer()
    timer.runnable = Runnable {
        if (timer.cancelled) return@Runnable
        jsDrainMicrotasks()
        callback()
        jsDrainMicrotasks()
    }.also { jsPost(ms.toLong(), it) }
    return timer
}

fun setInterval(callback: () -> Unit, ms: Double): NTimer {
    val timer = NTimer()
    val tick = object : Runnable {
        override fun run() {
            if (timer.cancelled) return
            jsDrainMicrotasks()
            callback()
            jsDrainMicrotasks()
            if (!timer.cancelled) jsPost(max(1L, ms.toLong()), this)
        }
    }
    timer.runnable = tick
    jsPost(max(1L, ms.toLong()), tick)
    return timer
}

fun clearTimeout(timer: NTimer) = timer.cancel()
fun clearInterval(timer: NTimer) = timer.cancel()

// ---------------------------------------------------------------------------
// Promises and the microtask queue (see NucloRuntime.swift: the same model, the same job order)
// ---------------------------------------------------------------------------

private val jsJobs = ArrayDeque<() -> Unit>()
private var jsDraining = false
private var jsDrainScheduled = false
private val jsRejected = ArrayList<JsPromise<*>>()

fun jsQueueMicrotask(job: () -> Unit) {
    jsJobs.addLast(job)
    jsScheduleDrain()
}

internal fun jsScheduleDrain() {
    if (jsDraining || jsDrainScheduled) return
    jsDrainScheduled = true
    // Before any other task already due: in JavaScript the microtasks run as soon as the current task ends.
    jsPostFirst(Runnable { jsDrainMicrotasks() })
}

/** Runs every queued microtask (and those they queue), then reports the rejections nothing handled. */
fun jsDrainMicrotasks() {
    if (jsDraining) return
    jsDraining = true
    while (true) (jsJobs.removeFirstOrNull() ?: break)()
    // The job is over: WeakRef targets it read are no longer kept (lib4).
    jsKept.clear()
    jsDraining = false
    jsDrainScheduled = false
    if (jsRejected.isEmpty()) return
    val rejected = jsRejected.toList()
    jsRejected.clear()
    for (p in rejected) if (!p.handled) consoleLog("Uncaught (in promise) ${jsErrorMessage(p.reason!!)}")
}

/** `Promise<T>`: settled once; its reactions run as microtasks and are dropped once it settles. */
class JsPromise<T> {
    private var state = 0
    private var value: Any? = null
    internal var reason: Exception? = null
    private var reactions: ArrayList<(JsPromise<T>) -> Unit>? = ArrayList()
    private var resolved = false
    internal var handled = false
    /** The state machine of the async function this is the promise of; dropped once it settles. */
    internal var step: ((JsPromise<T>) -> Unit)? = null
    private var awaitError: Exception? = null

    fun resolve(v: T) {
        if (resolved) return
        resolved = true
        settle(1, v, null)
    }

    fun reject(e: Exception) {
        if (resolved) return
        resolved = true
        settle(2, null, e)
    }

    /** Resolving with a promise: it follows `p`, starting a job later (JavaScript's NewPromiseResolveThenableJob). */
    fun adopt(p: JsPromise<T>) {
        if (resolved) return
        resolved = true
        if (p === this) return settle(2, null, JsNamedError("TypeError", "Chaining cycle detected for promise #<Promise>"))
        jsQueueMicrotask { p.react({ settle(1, it, null) }, { settle(2, null, it) }) }
    }

    private fun settle(s: Int, v: Any?, e: Exception?) {
        state = s
        value = v
        reason = e
        step = null
        if (s == 2 && !handled) {
            jsRejected.add(this)
            jsScheduleDrain()
        }
        val pending = reactions!!
        reactions = ArrayList()
        for (r in pending) jsQueueMicrotask { r(this) }
    }

    @Suppress("UNCHECKED_CAST")
    internal fun react(onFulfilled: (T) -> Unit, onRejected: (Exception) -> Unit) {
        handled = true
        val reaction: (JsPromise<T>) -> Unit = { p -> if (p.state == 1) onFulfilled(p.value as T) else onRejected(p.reason!!) }
        if (state == 0) reactions!!.add(reaction) else jsQueueMicrotask { reaction(this) }
    }

    fun <U> then(onFulfilled: (T) -> U): JsPromise<U> {
        val d = JsPromise<U>()
        react({ v -> try { d.resolve(onFulfilled(v)) } catch (e: Exception) { d.reject(e) } }, { d.reject(it) })
        return d
    }

    fun <U> thenP(onFulfilled: (T) -> JsPromise<U>): JsPromise<U> {
        val d = JsPromise<U>()
        react({ v -> try { d.adopt(onFulfilled(v)) } catch (e: Exception) { d.reject(e) } }, { d.reject(it) })
        return d
    }

    fun <U> then2(onFulfilled: (T) -> U, onRejected: (Exception) -> U): JsPromise<U> {
        val d = JsPromise<U>()
        react({ v -> try { d.resolve(onFulfilled(v)) } catch (e: Exception) { d.reject(e) } }, { r -> try { d.resolve(onRejected(r)) } catch (e: Exception) { d.reject(e) } })
        return d
    }

    fun <U> then2P(onFulfilled: (T) -> JsPromise<U>, onRejected: (Exception) -> JsPromise<U>): JsPromise<U> {
        val d = JsPromise<U>()
        react({ v -> try { d.adopt(onFulfilled(v)) } catch (e: Exception) { d.reject(e) } }, { r -> try { d.adopt(onRejected(r)) } catch (e: Exception) { d.reject(e) } })
        return d
    }

    fun jsCatch(onRejected: (Exception) -> T): JsPromise<T> = then2({ it }, onRejected)

    fun jsCatchP(onRejected: (Exception) -> JsPromise<T>): JsPromise<T> = then2P({ resolved(it) }, onRejected)

    /** `finally(f)` as the specification writes it: `f`'s result is waited for, then the value or the error goes on. */
    fun jsFinally(f: () -> Unit): JsPromise<T> =
        then2P({ v -> f(); resolved(Unit).then { v } }, { e -> f(); resolved(Unit).then<T> { throw e } })

    fun <X> jsFinallyP(f: () -> JsPromise<X>): JsPromise<T> = then2P({ v -> f().then { v } }, { e -> f().then<T> { throw e } })

    /** `await q` in the async function this is the promise of: it resumes a job after `q` settles. */
    fun <U> awaitOn(q: JsPromise<U>, store: ((U) -> Unit)?) {
        q.react({ v ->
            store?.invoke(v)
            step?.invoke(this)
        }, { e ->
            awaitError = e
            step?.invoke(this)
        })
    }

    fun check() {
        val e = awaitError ?: return
        awaitError = null
        throw e
    }

    companion object {
        fun <T> resolved(v: T): JsPromise<T> = JsPromise<T>().also { it.resolve(v) }

        fun <T> rejected(e: Exception): JsPromise<T> = JsPromise<T>().also { it.reject(e) }

        /** `new Promise<T>(executor)`: the executor runs at once; what it throws rejects the promise. */
        fun <T> create(executor: ((T) -> Unit, (Exception) -> Unit) -> Unit): JsPromise<T> {
            val p = JsPromise<T>()
            try { executor({ p.resolve(it) }, { p.reject(it) }) } catch (e: Exception) { p.reject(e) }
            return p
        }

        fun createVoid(executor: (() -> Unit, (Exception) -> Unit) -> Unit): JsPromise<Unit> {
            val p = JsPromise<Unit>()
            try { executor({ p.resolve(Unit) }, { p.reject(it) }) } catch (e: Exception) { p.reject(e) }
            return p
        }

        @Suppress("UNCHECKED_CAST")
        fun <T> all(ps: List<JsPromise<T>>): JsPromise<MutableList<T>> {
            val d = JsPromise<MutableList<T>>()
            val values = arrayOfNulls<Any?>(ps.size)
            var remaining = ps.size
            if (ps.isEmpty()) d.resolve(ArrayList())
            ps.forEachIndexed { i, p ->
                p.react({ v ->
                    values[i] = v
                    if (--remaining == 0) d.resolve(values.map { it as T }.toMutableList())
                }, { d.reject(it) })
            }
            return d
        }

        fun <T> allSettled(ps: List<JsPromise<T>>): JsPromise<MutableList<JsSettled<T>>> {
            val d = JsPromise<MutableList<JsSettled<T>>>()
            val results = arrayOfNulls<JsSettled<T>>(ps.size)
            var remaining = ps.size
            if (ps.isEmpty()) d.resolve(ArrayList())
            ps.forEachIndexed { i, p ->
                val done = { r: JsSettled<T> ->
                    results[i] = r
                    if (--remaining == 0) d.resolve(results.map { it!! }.toMutableList())
                }
                p.react({ done(JsSettled("fulfilled", it, null)) }, { done(JsSettled("rejected", null, it)) })
            }
            return d
        }

        fun <T> race(ps: List<JsPromise<T>>): JsPromise<T> {
            val d = JsPromise<T>()
            for (p in ps) p.react({ d.resolve(it) }, { d.reject(it) })
            return d
        }

        fun <T> any(ps: List<JsPromise<T>>): JsPromise<T> {
            val d = JsPromise<T>()
            var remaining = ps.size
            if (ps.isEmpty()) d.reject(JsNamedError("AggregateError", ""))
            for (p in ps) p.react({ d.resolve(it) }, { if (--remaining == 0) d.reject(JsNamedError("AggregateError", "")) })
            return d
        }
    }
}

/** An element of `Promise.allSettled`'s result. */
class JsSettled<T>(val status: String, private val v: Any?, private val r: Exception?) {
    @Suppress("UNCHECKED_CAST")
    val value: T get() = v as T
    val reason: Exception get() = r!!
}

/** An async function's promise: `step` runs its body up to its first `await` at once, as JavaScript does. */
fun <T> jsAsync(step: (JsPromise<T>) -> Unit): JsPromise<T> {
    val p = JsPromise<T>()
    p.step = step
    step(p)
    return p
}

/** The promise of a native async call (a `suspend` function): it starts at once; settled from its continuation. */
fun <T> jsNative(call: suspend () -> T): JsPromise<T> {
    val p = JsPromise<T>()
    var starting = true
    call.startCoroutine(Continuation(EmptyCoroutineContext) { result ->
        result.fold({ p.resolve(it) }, { p.reject(it as? Exception ?: Exception(it)) })
        // Finished later, as a task of its own: its microtasks run now.
        if (!starting) jsDrainMicrotasks()
    })
    starting = false
    return p
}

/** `delay(ms)`: a promise a timer resolves. */
fun jsDelay(ms: Double): JsPromise<Unit> {
    val p = JsPromise<Unit>()
    setTimeout({ p.resolve(Unit) }, ms)
    return p
}

// ---------------------------------------------------------------------------
// JSON
// ---------------------------------------------------------------------------

/**
 * Decoders the compiler generates per interface call into these, over what `jsJsonParse` gives: `LinkedHashMap`
 * objects (source order; JavaScript's order is applied where a map is made), `ArrayList` arrays, `String`, `Double`,
 * `Boolean` and null.
 */
object NJSON {
    @Suppress("UNCHECKED_CAST")
    fun obj(v: Any?) = v as? LinkedHashMap<String, Any?> ?: throw Exception("Expected a JSON object")
    fun string(v: Any?) = v as? String ?: throw Exception("Expected a JSON string")
    fun double(v: Any?) = v as? Double ?: throw Exception("Expected a JSON number")
    fun int(v: Any?) = double(v).toInt()
    fun bool(v: Any?) = v as? Boolean ?: throw Exception("Expected a JSON boolean")

    fun <T> array(v: Any?, element: (Any?) -> T): MutableList<T> {
        val a = v as? ArrayList<*> ?: throw Exception("Expected a JSON array")
        return a.mapTo(mutableListOf()) { element(it) }
    }

    fun <T> map(v: Any?, value: (Any?) -> T): MutableMap<String, T> {
        val o = obj(v)
        return o.jsKeys().associateWithTo(mutableMapOf()) { value(o[it]) }
    }

    fun <T> optional(v: Any?, value: (Any?) -> T): T? = if (v == null) null else value(v)
}

/** `JSON.parse(text)`: JavaScript's JSON grammar (a SyntaxError otherwise), a repeated key keeps its first place and last value. */
fun jsJsonParse(text: String): Any? {
    val p = NJSONParser(text)
    p.ws()
    val v = p.value()
    p.ws()
    if (p.i != text.length) throw p.fail()
    return v
}

class NJSONParser(private val s: String) {
    var i = 0
    fun fail() = JsNamedError("SyntaxError", if (i < s.length) "JSON Parse error: Unexpected character" else "JSON Parse error: Unexpected EOF")
    private fun at(c: Char) = i < s.length && s[i] == c
    fun ws() { while (i < s.length && (s[i] == ' ' || s[i] == '\t' || s[i] == '\n' || s[i] == '\r')) i++ }
    private fun lit(w: String) { for (c in w) { if (!at(c)) throw fail(); i++ } }
    private fun digits(): Boolean { val d = i; while (i < s.length && s[i] in '0'..'9') i++; return i > d }
    fun value(): Any? {
        if (i >= s.length) throw fail()
        when (s[i]) {
            '{' -> {
                i++
                val o = LinkedHashMap<String, Any?>()
                ws()
                if (at('}')) { i++; return o }
                while (true) {
                    ws()
                    if (!at('"')) throw fail()
                    val k = str()
                    ws(); lit(":"); ws()
                    o[k] = value()
                    ws()
                    if (at(',')) { i++; continue }
                    if (!at('}')) throw fail()
                    i++
                    return o
                }
            }
            '[' -> {
                i++
                val a = ArrayList<Any?>()
                ws()
                if (at(']')) { i++; return a }
                while (true) {
                    ws()
                    a.add(value())
                    ws()
                    if (at(',')) { i++; continue }
                    if (!at(']')) throw fail()
                    i++
                    return a
                }
            }
            '"' -> return str()
            't' -> { lit("true"); return true }
            'f' -> { lit("false"); return false }
            'n' -> { lit("null"); return null }
            else -> {
                val start = i
                if (at('-')) i++
                if (at('0')) i++ else if (!digits()) throw fail()
                if (at('.')) { i++; if (!digits()) throw fail() }
                if (at('e') || at('E')) {
                    i++
                    if (at('+') || at('-')) i++
                    if (!digits()) throw fail()
                }
                return s.substring(start, i).toDouble()
            }
        }
    }
    private fun str(): String {
        i++
        val b = StringBuilder()
        while (true) {
            if (i >= s.length) throw fail()
            val c = s[i++]
            if (c == '"') return b.toString()
            if (c < ' ') { i--; throw fail() }
            if (c != '\\') { b.append(c); continue }
            if (i >= s.length) throw fail()
            when (val e = s[i++]) {
                '"', '\\', '/' -> b.append(e)
                'b' -> b.append('\b')
                'f' -> b.append('\u000C')
                'n' -> b.append('\n')
                'r' -> b.append('\r')
                't' -> b.append('\t')
                'u' -> {
                    var v = 0
                    repeat(4) {
                        val h = if (i < s.length) Character.digit(s[i], 16) else -1
                        if (h < 0 || s[i].code > 127) throw fail()
                        v = v * 16 + h
                        i++
                    }
                    b.append(v.toChar())
                }
                else -> throw fail()
            }
        }
    }
}

/** What `JSON.stringify` writes into: the generated encoders call it value by value, it lays out `gap` as JavaScript does. */
class NJSONOut(private val gap: String) {
    val out = StringBuilder()
    private val counts = ArrayList<Int>()
    private val arrays = ArrayList<Boolean>()
    private fun line() { if (gap.isNotEmpty()) { out.append('\n'); repeat(counts.size) { out.append(gap) } } }
    private fun next() { val n = counts.size - 1; if (counts[n] > 0) out.append(','); counts[n]++; line() }
    private fun pre() { if (arrays.lastOrNull() == true) next() }
    fun key(k: String) { next(); quote(k); out.append(if (gap.isEmpty()) ":" else ": ") }
    fun nul() { pre(); out.append("null") }
    fun bool(b: Boolean) { pre(); out.append(b) }
    fun num(d: Double) { pre(); out.append(if (d.isFinite()) jsNum(d) else "null") }
    fun num(n: Int) = num(n.toDouble())
    fun str(s: String) { pre(); quote(s) }
    fun date(d: JsDate) { if (d.t.isNaN()) nul() else str(d.toISO()) }
    private fun open(c: Char, array: Boolean) { pre(); out.append(c); counts.add(0); arrays.add(array) }
    private fun close(c: Char) { arrays.removeAt(arrays.size - 1); if (counts.removeAt(counts.size - 1) > 0) line(); out.append(c) }
    inline fun obj(body: () -> Unit) { openObj(); body(); closeObj() }
    fun openObj() = open('{', false)
    fun closeObj() = close('}')
    fun <T> arr(xs: List<T>, f: (T) -> Unit) { open('[', true); for (x in xs.toList()) f(x); close(']') }
    fun <T> map(m: Map<String, T>, f: (T) -> Unit) { open('{', false); for (k in m.jsKeys()) { key(k); @Suppress("UNCHECKED_CAST") f(m[k] as T) }; close('}') }
    /** An object's field: left out when it is undefined. */
    fun <T> field(k: String, v: T?, f: (T) -> Unit) { if (v != null) { key(k); f(v) } }
    fun <T> opt(v: T?, f: (T) -> Unit) { if (v != null) f(v) else nul() }
    private fun quote(s: String) {
        out.append('"')
        for ((n, c) in s.withIndex()) {
            when (c) {
                '"' -> out.append("\\\"")
                '\\' -> out.append("\\\\")
                '\b' -> out.append("\\b")
                '\u000C' -> out.append("\\f")
                '\n' -> out.append("\\n")
                '\r' -> out.append("\\r")
                '\t' -> out.append("\\t")
                else -> {
                    val lone = (c.isHighSurrogate() && !(n + 1 < s.length && s[n + 1].isLowSurrogate())) || (c.isLowSurrogate() && !(n > 0 && s[n - 1].isHighSurrogate()))
                    if (c < ' ' || lone) out.append(String.format("\\u%04x", c.code)) else out.append(c)
                }
            }
        }
        out.append('"')
    }
}

/** `JSON.stringify(value, null, gap)`: `write` writes the value. */
inline fun <T> jsJsonStringify(value: T, gap: String, write: (NJSONOut, T) -> Unit): String { val o = NJSONOut(gap); write(o, value); return o.out.toString() }
/** `JSON.parse(text) as T`: `decode` is T's generated decoder. */
fun <T> jsJsonDecode(text: String, decode: (Any?) -> T): T = decode(jsJsonParse(text))
/** The indent of `JSON.stringify(v, null, n)`: up to 10 spaces; of `(v, null, s)`: the first 10 code units of s. */
fun jsJsonGap(n: Double): String = if (n >= 1) " ".repeat(minOf(10.0, n).toInt()) else ""
fun jsJsonGap(s: String): String = s.take(10)

// ---------------------------------------------------------------------------
// Date
// ---------------------------------------------------------------------------

/** A JavaScript Date: a shared, mutable time value (ms since 1970 UTC, NaN when invalid). Local time is the JVM's zone (TZ). */
class JsDate(t: Double) {
    var t: Double = jsTimeClip(t)
    companion object {
        fun now() = JsDate(jsNow())
        fun parts(vararg a: Double) = JsDate(jsUTCFromLocal(jsMakeParts(a)))
    }
    /** A field: 0 year, 1 month, 2 date, 3 hours, 4 minutes, 5 seconds, 6 ms, 7 weekday. */
    fun get(field: Int, local: Boolean): Double = if (t.isNaN()) Double.NaN else jsDateFields(if (local) t + jsLocalOffset(t) else t)[field]
    /** The setters: `args` replace the fields from `from` on (setFullYear 0 … setMilliseconds 6). */
    fun set(from: Int, local: Boolean, vararg args: Double): Double {
        var base = t
        if (base.isNaN()) { if (from != 0) return Double.NaN; base = 0.0 } else if (local) base += jsLocalOffset(base)
        val f = jsDateFields(base)
        for ((n, a) in args.withIndex()) f[from + n] = a
        val v = jsMakeDate(jsMakeDay(f[0], f[1], f[2]), jsMakeTime(f[3], f[4], f[5], f[6]))
        t = jsTimeClip(if (local) jsUTCFromLocal(v) else v)
        return t
    }
    fun setTime(v: Double): Double { t = jsTimeClip(v); return t }
    fun timezoneOffset(): Double = if (t.isNaN()) Double.NaN else -jsLocalOffset(t) / 60000 + 0.0
    fun toISOString(): String { if (t.isNaN()) throw JsNamedError("RangeError", "Invalid Date"); return toISO() }
    fun toJSON(): String? = if (t.isNaN()) null else toISO()
    fun toISO(): String {
        val f = jsDateFields(t)
        val y = f[0].toInt()
        val year = if (y in 0..9999) jsPad(y, 4) else (if (y < 0) "-" else "+") + jsPad(kotlin.math.abs(y), 6)
        return "$year-${jsPad(f[1].toInt() + 1, 2)}-${jsPad(f[2].toInt(), 2)}T${jsPad(f[3].toInt(), 2)}:${jsPad(f[4].toInt(), 2)}:${jsPad(f[5].toInt(), 2)}.${jsPad(f[6].toInt(), 3)}Z"
    }
    fun toUTCString(): String {
        if (t.isNaN()) return "Invalid Date"
        val f = jsDateFields(t)
        val y = f[0].toInt()
        return "${JS_WEEKDAYS[f[7].toInt()]}, ${jsPad(f[2].toInt(), 2)} ${JS_MONTHS[f[1].toInt()]} ${if (y < 0) "-" else ""}${jsPad(kotlin.math.abs(y), 4)} ${jsPad(f[3].toInt(), 2)}:${jsPad(f[4].toInt(), 2)}:${jsPad(f[5].toInt(), 2)} GMT"
    }
    fun toDateString(): String {
        if (t.isNaN()) return "Invalid Date"
        val f = jsDateFields(t + jsLocalOffset(t))
        val y = f[0].toInt()
        return "${JS_WEEKDAYS[f[7].toInt()]} ${JS_MONTHS[f[1].toInt()]} ${jsPad(f[2].toInt(), 2)} ${if (y < 0) "-" else ""}${jsPad(kotlin.math.abs(y), 4)}"
    }
}

private val JS_WEEKDAYS = arrayOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")
private val JS_MONTHS = arrayOf("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
private fun jsPad(n: Int, width: Int) = n.toString().padStart(width, '0')
private fun trunc(d: Double) = kotlin.math.truncate(d)
private fun fl(d: Double) = kotlin.math.floor(d)

/** TimeClip: NaN past ±8.64e15 ms, else the whole number toward zero (+0, never -0). */
fun jsTimeClip(t: Double): Double = if (!t.isFinite() || kotlin.math.abs(t) > 8.64e15) Double.NaN else trunc(t) + 0.0
/** Date.UTC(y, m?, …) / the local parts of `new Date(y, m, …)` (years 0 to 99 are 1900 to 1999). */
fun jsMakeParts(a: DoubleArray): Double {
    val f = doubleArrayOf(Double.NaN, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0)
    for ((n, v) in a.withIndex()) if (n < 7) f[n] = v
    if (f[0].isFinite()) { val y = trunc(f[0]); if (y in 0.0..99.0) f[0] = 1900 + y }
    return jsMakeDate(jsMakeDay(f[0], f[1], f[2]), jsMakeTime(f[3], f[4], f[5], f[6]))
}
fun jsDateUTC(vararg a: Double) = jsTimeClip(jsMakeParts(a))
fun jsMakeDay(y: Double, m: Double, d: Double): Double {
    if (!y.isFinite() || !m.isFinite() || !d.isFinite()) return Double.NaN
    val mi = trunc(m)
    return jsDaysFromCivil(trunc(y) + fl(mi / 12), mi - fl(mi / 12) * 12 + 1, 1.0) + trunc(d) - 1
}
fun jsMakeTime(h: Double, m: Double, s: Double, ms: Double): Double =
    if (!h.isFinite() || !m.isFinite() || !s.isFinite() || !ms.isFinite()) Double.NaN else trunc(h) * 3_600_000 + trunc(m) * 60000 + trunc(s) * 1000 + trunc(ms)
fun jsMakeDate(day: Double, time: Double): Double = if (day.isFinite() && time.isFinite()) day * 86_400_000 + time else Double.NaN
fun jsDaysFromCivil(y0: Double, m: Double, d: Double): Double {
    val y = if (m <= 2) y0 - 1 else y0
    val era = fl(y / 400)
    val yoe = y - era * 400
    val doy = fl((153 * (if (m > 2) m - 3 else m + 9) + 2) / 5) + d - 1
    val doe = yoe * 365 + fl(yoe / 4) - fl(yoe / 100) + doy
    return era * 146_097 + doe - 719_468
}
/** Year, month (0 to 11), date, hours, minutes, seconds, ms and weekday of a time value. */
fun jsDateFields(t: Double): DoubleArray {
    val day = fl(t / 86_400_000)
    var ms = t - day * 86_400_000
    val z = day + 719_468
    val era = fl(z / 146_097)
    val doe = z - era * 146_097
    val yoe = fl((doe - fl(doe / 1460) + fl(doe / 36524) - fl(doe / 146_096)) / 365)
    val doy = doe - (365 * yoe + fl(yoe / 4) - fl(yoe / 100))
    val mp = fl((5 * doy + 2) / 153)
    val d = doy - fl((153 * mp + 2) / 5) + 1
    val m = if (mp < 10) mp + 2 else mp - 10
    val y = yoe + era * 400 + (if (m <= 1) 1 else 0)
    val h = fl(ms / 3_600_000); ms -= h * 3_600_000
    val mi = fl(ms / 60000); ms -= mi * 60000
    val s = fl(ms / 1000); ms -= s * 1000
    val wd = day + 4 - fl((day + 4) / 7) * 7
    return doubleArrayOf(y, m, d, h, mi, s, ms, wd)
}
/** The JVM zone's offset from UTC at the instant `t`, in ms. */
fun jsLocalOffset(t: Double): Double = java.util.TimeZone.getDefault().getOffset(t.toLong()).toDouble()
/** UTC(t) of a local time: the earlier instant of a repeated hour, the offset before the change for a skipped one. */
fun jsUTCFromLocal(tl: Double): Double {
    if (!tl.isFinite()) return Double.NaN
    val a = jsLocalOffset(tl - 86_400_000)
    val b = jsLocalOffset(tl + 86_400_000)
    val t1 = tl - a
    val t2 = tl - b
    val ok1 = jsLocalOffset(t1) == a
    val ok2 = jsLocalOffset(t2) == b
    return if (ok1 && ok2) minOf(t1, t2) else if (ok1) t1 else if (ok2) t2 else t1
}
/** Date.parse of the ISO format JavaScript reads (date-only forms are UTC, a date-time without an offset local time); NaN otherwise. */
fun jsDateParse(s: String): Double {
    var i = 0
    fun num(n: Int): Double? {
        if (i + n > s.length || !(i until i + n).all { s[it] in '0'..'9' }) return null
        i += n
        return s.substring(i - n, i).toDouble()
    }
    fun at(c: Char): Boolean { if (i < s.length && s[i] == c) { i++; return true }; return false }
    val y: Double
    if (i < s.length && (s[i] == '+' || s[i] == '-')) {
        val neg = s[i] == '-'
        i++
        val v = num(6) ?: return Double.NaN
        if (neg && v == 0.0) return Double.NaN
        y = if (neg) -v else v
    } else y = num(4) ?: return Double.NaN
    var mo = 1.0; var d = 1.0; var h = 0.0; var mi = 0.0; var sec = 0.0; var ms = 0.0
    if (at('-')) {
        mo = num(2)?.takeIf { it in 1.0..12.0 } ?: return Double.NaN
        if (at('-')) d = num(2)?.takeIf { it in 1.0..31.0 } ?: return Double.NaN
    }
    var offset: Double? = 0.0
    if (i < s.length && (s[i] == 'T' || s[i] == 't' || s[i] == ' ')) {
        i++
        h = num(2) ?: return Double.NaN
        if (!at(':')) return Double.NaN
        mi = num(2)?.takeIf { it <= 59 } ?: return Double.NaN
        if (at(':')) {
            sec = num(2)?.takeIf { it <= 59 } ?: return Double.NaN
            if (at('.')) {
                val start = i
                while (i < s.length && s[i] in '0'..'9') i++
                if (i == start) return Double.NaN
                ms = s.substring(start, minOf(i, start + 3)).padEnd(3, '0').toDouble()
            }
        }
        if (!(h < 24 || (h == 24.0 && mi == 0.0 && sec == 0.0 && ms == 0.0))) return Double.NaN
        offset = null
        if (at('Z') || at('z')) offset = 0.0
        else if (i < s.length && (s[i] == '+' || s[i] == '-')) {
            val sign = if (s[i] == '-') -1 else 1
            i++
            val oh = num(2)?.takeIf { it <= 23 } ?: return Double.NaN
            at(':')
            val om = num(2)?.takeIf { it <= 59 } ?: return Double.NaN
            offset = sign * (oh * 60 + om) * 60000
        }
    }
    if (i != s.length) return Double.NaN
    val local = jsMakeDate(jsMakeDay(y, mo - 1, d), jsMakeTime(h, mi, sec, ms))
    return jsTimeClip(if (offset != null) local - offset else jsUTCFromLocal(local))
}

// ---------------------------------------------------------------------------
// JavaScript semantics
// ---------------------------------------------------------------------------

/** Numbers the way JavaScript prints them: 3, not 3.0; 1e+21 and 1e-7, never 1.0E21 or 9.007199254740992E15. */
fun jsNum(d: Double): String {
    if (d.isNaN()) return "NaN"
    if (d.isInfinite()) return if (d > 0) "Infinity" else "-Infinity"
    if (d == 0.0) return "0"
    if (d == Math.rint(d) && kotlin.math.abs(d) < 1e15) return d.toLong().toString()
    // The fewest digits that read back as `d`, the closest such (JavaScript's Number::toString), laid out as
    // JavaScript does. Double.toString's digits read back; up to 15 of them they are the only such digits (doubles
    // have more than 15 digits of precision), so the answer. From 16 (where older JDKs and Android may not give the
    // shortest or closest) the exact value is rounded (BigDecimal, half even) to fewer digits while that reads back.
    val a = kotlin.math.abs(d)
    val s = java.lang.Double.toString(a)
    val ei = s.indexOf('E')
    val mantissa = if (ei < 0) s else s.substring(0, ei)
    val dot = mantissa.indexOf('.')
    var digits = mantissa.removeRange(dot, dot + 1)
    var point = dot + (if (ei < 0) 0 else s.substring(ei + 1).toInt())
    val len = digits.trim('0').length
    // Subnormals too: Double.toString(Double.MIN_VALUE) is "4.9E-324", JavaScript's "5e-324".
    if (len >= 16 || a < java.lang.Double.MIN_NORMAL) {
        val exact = java.math.BigDecimal(a)
        var p = len
        while (p >= 1) {
            var r = exact.round(java.math.MathContext(p, java.math.RoundingMode.HALF_EVEN))
            if (r.toDouble() != a) {
                // Next to a power of two the gaps differ: the neighbor on a's other side may still read back.
                r = if (r < exact) r + r.ulp() else r - r.ulp()
                if (r.toDouble() != a) break
            }
            digits = r.unscaledValue().toString()
            point = digits.length - r.scale()
            p--
        }
    }
    return (if (d < 0) "-" else "") + jsLayout(digits, point)
}

/** Number::toString's layout of the digits `digits` with the decimal point after `point` of them. */
fun jsLayout(digits: String, point: Int): String {
    var ds = digits.trimStart('0').ifEmpty { "0" }
    val n = point - (digits.length - digits.trimStart('0').length)
    ds = ds.trimEnd('0').ifEmpty { "0" }
    val k = ds.length
    return when {
        n in k..21 -> ds + "0".repeat(n - k)
        n in 1..21 -> ds.substring(0, n) + "." + ds.substring(n)
        n in -5..0 -> "0." + "0".repeat(-n) + ds
        else -> {
            val e = n - 1
            ds.substring(0, 1) + (if (k > 1) "." + ds.substring(1) else "") + "e" + (if (e >= 0) "+" else "-") + kotlin.math.abs(e)
        }
    }
}

/** `toFixed`: the exact binary value rounded half up (Java's %f rounds its shortest text: 1.005 → 1.01); -0 is "0". */
fun jsFixed(d: Double, digits: Int): String = when {
    !d.isFinite() || kotlin.math.abs(d) >= 1e21 -> jsNum(d)
    d < 0 -> "-" + jsFixed(-d, digits)
    else -> java.math.BigDecimal(d + 0.0).setScale(digits, java.math.RoundingMode.HALF_UP).toPlainString()
}
/** `Math.round`: the nearest integer, a half up (`d + 0.5` would round 0.49999999999999994 up). */
/** `Math.round` of any number (NaN and ±Infinity stay themselves). */
fun jsRoundD(d: Double): Double = kotlin.math.floor(d).let { if (d - it >= 0.5) it + 1 else it }
fun jsRound(d: Double): Int = kotlin.math.floor(d).let { if (d - it >= 0.5) it + 1 else it }.toInt()
fun jsNow() = System.currentTimeMillis().toDouble()
private val jsDecimal = Regex("[+-]?(\\d+\\.?\\d*|\\.\\d+)([eE][+-]?\\d+)?")
/** `Number(s)`: JavaScript's StringToNumber (white space trimmed, "" is 0, 0x / 0o / 0b, Infinity; not Java's "1d" or "NaN"). */
fun jsNumber(s: String): Double {
    val t = s.jsTrim()
    if (t.isEmpty()) return 0.0
    val radix = if (t.length > 2 && t[0] == '0') when (t[1]) { 'x', 'X' -> 16; 'o', 'O' -> 8; 'b', 'B' -> 2; else -> 0 } else 0
    if (radix != 0) return t.substring(2).fold(0.0) { v, c -> (if (c.code < 128) Character.digit(c, radix) else -1).let { if (it < 0) return Double.NaN else v * radix + it } }
    return when (t) {
        "Infinity", "+Infinity" -> Double.POSITIVE_INFINITY
        "-Infinity" -> Double.NEGATIVE_INFINITY
        else -> if (jsDecimal.matches(t)) t.toDouble() else Double.NaN
    }
}
/** `parseInt(s, radix)`: the longest run of digits after white space, a sign and (radix 16 or none) 0x; NaN if none. */
fun jsParseInt(s: String, radix: Double = 0.0): Double {
    var t = s.jsTrimStart()
    val negative = t.startsWith("-")
    if (t.startsWith("-") || t.startsWith("+")) t = t.substring(1)
    var r = jsI32(radix)
    if (r != 0 && r !in 2..36) return Double.NaN
    if ((r == 0 || r == 16) && (t.startsWith("0x") || t.startsWith("0X"))) { t = t.substring(2); r = 16 }
    if (r == 0) r = 10
    val run = t.takeWhile { c -> c.code < 128 && Character.digit(c, r) >= 0 }
    if (run.isEmpty()) return Double.NaN
    val v = if (r == 10) run.toDouble() else run.fold(0.0) { v, c -> v * r + Character.digit(c, r) }
    return if (negative) -v else v
}
fun jsErrorMessage(e: Exception): String {
    // A native trap the other targets stop on: the JavaScript operation it was, in their words.
    if (e is IndexOutOfBoundsException) return "nuclo: xs[i]! read past the end of an array (${e.message}): JavaScript gives undefined there, which the element type can't hold. Test the index (i < xs.length) or use xs[i] ?? fallback."
    if (e is NullPointerException) return "nuclo: a `!` assertion found null or undefined"
    val name = (e as? JsNamedError)?.jsName ?: "Error"
    return (e.message ?: e.javaClass.simpleName).let { if (it.isEmpty()) name else "$name: $it" }
}

/** An error the runtime throws as JavaScript would, with its class: `RangeError` of a BigInt division by 0. */
/// `obj`: the object of an app's error class (`class E extends Error`) it carries (`throw new E(…)`).
class JsNamedError(val jsName: String, message: String, val obj: Any? = null) : Exception(message)

// BigInt: java.math.BigInteger, whose Kotlin operators are JavaScript's (division truncates, % takes the dividend's
// sign, and / or / xor / inv / shl / shr are two's complement of infinite width).
typealias JsBigInt = java.math.BigInteger

fun jsBig(v: Long): JsBigInt = java.math.BigInteger.valueOf(v)
fun jsBig(literal: String): JsBigInt = java.math.BigInteger(literal)

fun jsBigDiv(a: JsBigInt, b: JsBigInt): JsBigInt {
    if (b.signum() == 0) throw JsNamedError("RangeError", "0 is an invalid divisor value.")
    return a / b
}

fun jsBigMod(a: JsBigInt, b: JsBigInt): JsBigInt {
    if (b.signum() == 0) throw JsNamedError("RangeError", "0 is an invalid divisor value.")
    return a % b
}

fun jsBigPow(a: JsBigInt, b: JsBigInt): JsBigInt {
    if (b.signum() < 0) throw JsNamedError("RangeError", "Negative exponent is not allowed")
    if (b.bitLength() > 31) {
        // Only 0, 1 and -1 have a power this large.
        if (a.abs() > java.math.BigInteger.ONE) throw JsNamedError("RangeError", "Out of memory: BigInt generated from this operation is too big")
        return if (a.signum() < 0 && !b.testBit(0)) java.math.BigInteger.ONE else a
    }
    return a.pow(b.toInt())
}

/** A shift count: past an Int, only the sign matters (no value that big fits in memory). */
private fun shiftCount(b: JsBigInt): Int = if (b.bitLength() < 31) b.toInt() else if (b.signum() < 0) -Int.MAX_VALUE else Int.MAX_VALUE

fun jsBigShl(a: JsBigInt, b: JsBigInt): JsBigInt = a.shiftLeft(shiftCount(b))
fun jsBigShr(a: JsBigInt, b: JsBigInt): JsBigInt = a.shiftRight(shiftCount(b))

/** `Number(b)`: the nearest Double (ties to even), whatever the platform's BigInteger.doubleValue does. */
fun jsBigToDouble(a: JsBigInt): Double {
    val m = a.abs()
    val bits = m.bitLength()
    if (bits <= 63) return a.toLong().toDouble()
    if (bits > 1024) return if (a.signum() < 0) Double.NEGATIVE_INFINITY else Double.POSITIVE_INFINITY
    // The top 63 bits, with a sticky low bit for any bit below them: Long.toDouble then rounds as the whole would.
    val shift = bits - 63
    var top = m.shiftRight(shift).toLong()
    if (m.getLowestSetBit() < shift) top = top or 1L
    val d = Math.scalb(top.toDouble(), shift)
    return if (a.signum() < 0) -d else d
}

fun jsBigFrom(d: Double): JsBigInt {
    if (!d.isFinite() || d != kotlin.math.truncate(d)) throw JsNamedError("RangeError", "Not an integer")
    return java.math.BigDecimal(d).toBigInteger()
}

/** JavaScript's StringToBigInt: decimal with an optional sign, or 0x / 0o / 0b; surrounding white space; "" is 0. */
fun jsBigParse(text: String): JsBigInt {
    val s = text.jsTrim()
    if (s.isEmpty()) return java.math.BigInteger.ZERO
    val radix = if (s.length > 2 && s[0] == '0') when (s[1]) { 'x', 'X' -> 16; 'o', 'O' -> 8; 'b', 'B' -> 2; else -> 10 } else 10
    val signed = radix == 10 && (s[0] == '+' || s[0] == '-')
    val body = if (radix != 10) s.substring(2) else if (signed) s.substring(1) else s
    if (body.isEmpty() || body.any { it.code > 127 || Character.digit(it, radix) < 0 }) throw JsNamedError("SyntaxError", "Failed to parse String to BigInt")
    val v = java.math.BigInteger(body, radix)
    return if (s[0] == '-') v.negate() else v
}

fun jsBigToString(a: JsBigInt, radix: Double): String {
    val r = kotlin.math.truncate(radix)
    if (!(r >= 2 && r <= 36)) throw JsNamedError("RangeError", "toString() radix argument must be between 2 and 36")
    return a.toString(r.toInt())
}

fun jsBigAsUintN(bits: Int, a: JsBigInt): JsBigInt = a.and(java.math.BigInteger.ONE.shiftLeft(bits) - java.math.BigInteger.ONE)

fun jsBigAsIntN(bits: Int, a: JsBigInt): JsBigInt {
    if (bits == 0) return java.math.BigInteger.ZERO
    val u = jsBigAsUintN(bits, a)
    return if (u.testBit(bits - 1)) u - java.math.BigInteger.ONE.shiftLeft(bits) else u
}

/** JavaScript's `symbol`: a value only equal to itself (identity `equals`), with an optional description. */
class JsSymbol(val desc: String?) {
    override fun toString() = "Symbol(${desc ?: ""})"
}

fun <T> MutableList<T>.jsSplice(start: Int, count: Int): MutableList<T> {
    val from = if (start < 0) max(0, size + start) else min(start, size)
    val to = from + min(size - from, max(0, count))
    val range = subList(from, to)
    val removed = range.toMutableList()
    range.clear()
    return removed
}

fun <T> List<T>.jsSlice(start: Int, end: Int?): MutableList<T> {
    val from = if (start < 0) max(0, size + start) else min(start, size)
    val to = end?.let { if (it < 0) max(0, size + it) else min(it, size) } ?: size
    return if (from < to) subList(from, to).toMutableList() else mutableListOf()
}

fun String.jsSlice(start: Int, end: Int?): String {
    val from = if (start < 0) max(0, length + start) else min(start, length)
    val to = end?.let { if (it < 0) max(0, length + it) else min(it, length) } ?: length
    return if (from < to) substring(from, to) else ""
}

/**
 * JavaScript's `sort`: stable, and the same merge sort on every target, so even a comparator that
 * contradicts itself orders the same way everywhere (TimSort would throw). A positive result puts `b` first.
 */
fun <T> MutableList<T>.jsSort(cmp: (T, T) -> Double): MutableList<T> {
    var a = toMutableList()
    var b = toMutableList()
    var width = 1
    while (width < size) {
        var start = 0
        while (start < size) {
            val mid = min(start + width, size)
            val end = min(start + 2 * width, size)
            var l = start
            var r = mid
            var k = start
            while (l < mid && r < end) {
                if (cmp(a[l], a[r]) > 0) b[k++] = a[r++] else b[k++] = a[l++]
            }
            while (l < mid) b[k++] = a[l++]
            while (r < end) b[k++] = a[r++]
            start += 2 * width
        }
        val t = a
        a = b
        b = t
        width *= 2
    }
    for (i in indices) this[i] = a[i]
    return this
}

fun <T> MutableList<T>.jsReverse(): MutableList<T> {
    reverse()
    return this
}

fun <T> MutableList<T>.jsShift(): T? = if (isEmpty()) null else removeAt(0)

/** `for…of`: live, as JavaScript's array iterator (elements pushed during the loop are visited; no concurrent-modification error). */
fun <T> List<T>.jsLive(): Iterator<T> = object : Iterator<T> {
    var i = 0
    override fun hasNext() = i < size
    override fun next() = get(i++)
}

/** `xs[i] = v`: `xs[xs.length] = v` appends, as in JavaScript (a map's `m[k] = v` is a plain set). */
fun <T> jsSet(xs: MutableList<T>, i: Int, v: T) { if (i == xs.size) xs.add(v) else xs[i] = v }
fun <V> jsSet(m: MutableMap<String, V>, k: String, v: V) { m[k] = v }

// Record<string, T> is a MutableMap made by mutableMapOf (a LinkedHashMap: insertion order, a key deleted and set
// again goes last). JavaScript lists integer-like keys first, in numeric order.
fun jsIsIndex(key: String): Boolean =
    key.isNotEmpty() && key.length <= 10 && key.all { it in '0'..'9' } && (key == "0" || key[0] != '0') && key.toLong() <= 4294967294L
fun Map<String, *>.jsKeys(): MutableList<String> {
    if (keys.none(::jsIsIndex)) return keys.toMutableList()
    val (indices, rest) = keys.partition(::jsIsIndex)
    return (indices.sortedBy { it.toLong() } + rest).toMutableList()
}
fun <V> Map<String, V>.jsValues(): MutableList<V> =
    if (keys.none(::jsIsIndex)) values.toMutableList() else jsKeys().mapTo(mutableListOf()) { getValue(it) }
fun <T> List<T>.jsAtRel(i: Int): T? = getOrNull(if (i < 0) size + i else i)
// A boxed Double's equals() finds NaN and tells -0 from 0: compare numbers as `===` (indexOf) / SameValueZero (includes),
// through Double locals (`==` on a smart-cast type parameter is still equals()).
// Arrays and maps (Lists and Maps compare contents) by identity, as `===`.
// `from`: where the search starts (from the end when negative); lastIndexOf searches back from it.
private fun <T> jsSame(x: T): (T) -> Boolean =
    if (x is Collection<*> || x is Map<*, *>) { y -> y === x }
    else if (x is Double) { val v: Double = x; { y -> if (y is Double) { val d: Double = y as Double; d == v } else false } }
    else { y -> y == x }
fun <T> List<T>.jsIndexOf(x: T, from: Int = 0): Int {
    // One loop per kind (no predicate lambda per element: this is the hot search).
    val start = jsRel(from)
    if (x is Double) {
        val v: Double = x
        for (i in start until size) { val y = this[i]; if (y is Double) { val d: Double = y as Double; if (d == v) return i } }
    } else if (x is Collection<*> || x is Map<*, *>) {
        for (i in start until size) if (this[i] === x) return i
    } else {
        for (i in start until size) if (this[i] == x) return i
    }
    return -1
}
fun <T> List<T>.jsLastIndexOf(x: T, from: Int = size - 1): Int {
    val eq = jsSame(x)
    var i = if (from < 0) size + from else min(from, size - 1)
    while (i >= 0) { if (eq(this[i])) return i; i-- }
    return -1
}
fun <T> List<T>.jsIncludes(x: T, from: Int = 0): Boolean =
    if (x is Double && x.isNaN()) (jsRel(from) until size).any { val d = this[it]; d is Double && d.isNaN() } else jsIndexOf(x, from) >= 0

/** A relative index (`fill`, `copyWithin`, `splice`, `indexOf`'s start): from the end when negative, clamped to 0…size. */
fun List<*>.jsRel(i: Int): Int = if (i < 0) max(0, size + i) else min(i, size)
/** `splice(start, count, ...items)`: `items` may be the list itself, so it is copied first. */
fun <T> MutableList<T>.jsSplice(start: Int, count: Int, items: List<T>): MutableList<T> {
    val add = items.toList()
    val from = jsRel(start)
    val range = subList(from, from + min(max(0, count), size - from))
    val removed = range.toMutableList()
    range.clear()
    addAll(from, add)
    return removed
}
fun <T> MutableList<T>.jsFill(v: T, start: Int, end: Int?): MutableList<T> {
    for (i in jsRel(start) until (end?.let { jsRel(it) } ?: size)) this[i] = v
    return this
}
fun <T> MutableList<T>.jsCopyWithin(target: Int, start: Int, end: Int?): MutableList<T> {
    val t = jsRel(target)
    val s = jsRel(start)
    val n = min((end?.let { jsRel(it) } ?: size) - s, size - t)
    if (n > 0) { val b = subList(s, s + n).toList(); for (i in 0 until n) this[t + i] = b[i] }
    return this
}
fun <T> List<List<T>>.jsFlat(): MutableList<T> = flatten().toMutableList()
inline fun <T, R> List<T>.jsReduceRight(initial: R, f: (R, T) -> R): R {
    val s = toList()
    var acc = initial
    for (i in s.indices.reversed()) acc = f(acc, s[i])
    return acc
}
/**
 * A `number[]` the program creates (literal or empty): a growable DoubleArray behind MutableList<Double>, so 8 bytes
 * an element and no Double box kept per element (an ArrayList<Double> holds one 16-byte box for each). Reads and
 * writes still pass boxes through the List interface; the JIT removes them where it inlines (it can't for stored ones).
 */
class JsDoubleList(capacity: Int = 8) : AbstractMutableList<Double>(), java.util.RandomAccess {
    private var a = DoubleArray(maxOf(capacity, 4))
    private var n = 0
    override val size: Int get() = n
    private fun check(i: Int) { if (i < 0 || i >= n) throw IndexOutOfBoundsException("Index $i out of bounds for length $n") }
    override fun get(index: Int): Double { check(index); return a[index] }
    override fun set(index: Int, element: Double): Double { check(index); val old = a[index]; a[index] = element; return old }
    override fun add(element: Double): Boolean {
        if (n == a.size) a = a.copyOf(n * 2)
        a[n++] = element
        modCount++
        return true
    }
    override fun add(index: Int, element: Double) {
        if (index < 0 || index > n) throw IndexOutOfBoundsException("Index $index out of bounds for length $n")
        if (n == a.size) a = a.copyOf(n * 2)
        System.arraycopy(a, index, a, index + 1, n - index)
        a[index] = element
        n++
        modCount++
    }
    override fun removeAt(index: Int): Double {
        check(index)
        val old = a[index]
        System.arraycopy(a, index + 1, a, index, n - index - 1)
        n--
        modCount++
        return old
    }
    override fun clear() { n = 0; modCount++ }
    // A snapshot first (as ArrayList does): `xs.push(...xs)` adds the list to itself.
    override fun addAll(elements: Collection<Double>): Boolean = addAll(n, elements)
    override fun addAll(index: Int, elements: Collection<Double>): Boolean {
        if (index < 0 || index > n) throw IndexOutOfBoundsException("Index $index out of bounds for length $n")
        val c = elements.toDoubleArray()
        if (n + c.size > a.size) a = a.copyOf(maxOf(n + c.size, n * 2))
        System.arraycopy(a, index, a, index + c.size, n - index)
        System.arraycopy(c, 0, a, index, c.size)
        n += c.size
        modCount++
        return c.isNotEmpty()
    }
}
fun jsDoubles(vararg xs: Double): MutableList<Double> = JsDoubleList(xs.size).also { l -> for (x in xs) l.add(x) }

/** An `Int8[]` the program creates: packed in a ByteArray (1 byte an element; Byte boxes are cached, none kept). */
class JsByteList(capacity: Int = 8) : AbstractMutableList<Byte>(), java.util.RandomAccess {
    private var a = ByteArray(maxOf(capacity, 8))
    private var n = 0
    override val size: Int get() = n
    private fun check(i: Int) { if (i < 0 || i >= n) throw IndexOutOfBoundsException("Index $i out of bounds for length $n") }
    override fun get(index: Int): Byte { check(index); return a[index] }
    override fun set(index: Int, element: Byte): Byte { check(index); val old = a[index]; a[index] = element; return old }
    override fun add(index: Int, element: Byte) {
        if (index < 0 || index > n) throw IndexOutOfBoundsException("Index $index out of bounds for length $n")
        if (n == a.size) a = a.copyOf(n * 2)
        System.arraycopy(a, index, a, index + 1, n - index)
        a[index] = element
        n++
        modCount++
    }
    override fun removeAt(index: Int): Byte {
        check(index)
        val old = a[index]
        System.arraycopy(a, index + 1, a, index, n - index - 1)
        n--
        modCount++
        return old
    }
    override fun clear() { n = 0; modCount++ }
    override fun addAll(elements: Collection<Byte>): Boolean = addAll(n, elements)
    override fun addAll(index: Int, elements: Collection<Byte>): Boolean {
        if (index < 0 || index > n) throw IndexOutOfBoundsException("Index $index out of bounds for length $n")
        val c = elements.toByteArray()
        if (n + c.size > a.size) a = a.copyOf(maxOf(n + c.size, n * 2))
        System.arraycopy(a, index, a, index + c.size, n - index)
        System.arraycopy(c, 0, a, index, c.size)
        n += c.size
        modCount++
        return c.isNotEmpty()
    }
}
fun jsBytes(vararg xs: Byte): MutableList<Byte> = JsByteList(xs.size).also { l -> for (x in xs) l.add(x) }

fun <T> jsFilled(n: Int, v: T): MutableList<T> = MutableList(max(0, n)) { v }
inline fun <T> jsFromLength(n: Int, f: (Int) -> T): MutableList<T> = MutableList(max(0, n)) { f(it) }

// ES2023.
inline fun <T> List<T>.jsFindLast(f: (T, Int) -> Boolean): T? {
    val s = toList()
    for (i in s.indices.reversed()) if (f(s[i], i)) return s[i]
    return null
}
inline fun <T> List<T>.jsFindLastIndex(f: (T, Int) -> Boolean): Int {
    val s = toList()
    for (i in s.indices.reversed()) if (f(s[i], i)) return i
    return -1
}
fun <T> List<T>.jsToSpliced(start: Int, count: Int, items: List<T> = emptyList()): MutableList<T> =
    toMutableList().also { it.jsSplice(start, count, items) }
/** `with(i, v)`: a RangeError out of range, as JavaScript throws. */
fun <T> List<T>.jsWith(i: Double, v: T): MutableList<T> {
    val t = jsToInteger(i)
    val k = if (t < 0) size + t else t
    if (k < 0 || k >= size) throw JsNamedError("RangeError", "Array index out of range")
    return toMutableList().also { it[k.toInt()] = v }
}
/** `Object.is` of numbers: SameValue (NaN is NaN, -0 isn't +0). */
fun jsObjectIs(a: Double, b: Double): Boolean = a.toRawBits() == b.toRawBits() || (a.isNaN() && b.isNaN())
/** `Number.isSafeInteger`. */
fun jsIsSafeInteger(d: Double): Boolean = kotlin.math.truncate(d) == d && kotlin.math.abs(d) <= 9007199254740991.0
/** `s.replace(pattern, f)` / `replaceAll`: f(match, offset in UTF-16 units, s) for each match, left to right. */
fun jsReplaceFn(s: String, pattern: String, f: (String, Double, String) -> String): String = jsReplaceBy(s, pattern, false, f)
fun jsReplaceAllFn(s: String, pattern: String, f: (String, Double, String) -> String): String = jsReplaceBy(s, pattern, true, f)
private fun jsReplaceBy(s: String, pattern: String, all: Boolean, f: (String, Double, String) -> String): String {
    val out = StringBuilder()
    var last = 0
    var i = 0
    while (i + pattern.length <= s.length) {
        if (s.regionMatches(i, pattern, 0, pattern.length)) {
            out.append(s, last, i).append(f(pattern, i.toDouble(), s))
            last = i + pattern.length
            if (!all) break
            i += max(pattern.length, 1)
        } else i++
    }
    return out.append(s, last, s.length).toString()
}
/** ToIntegerOrInfinity: NaN is 0, fractions truncate toward 0. */
fun jsToInteger(d: Double): Double = if (d.isNaN()) 0.0 else kotlin.math.truncate(d) + 0.0
/** `new Array(n)`'s length: a RangeError unless n is a whole number below 2^32. */
fun jsArrayLength(n: Double): Int {
    if (!(n >= 0 && n < 4294967296.0 && kotlin.math.truncate(n) == n)) throw JsNamedError("RangeError", "Array length must be a positive integer of safe magnitude.")
    return n.toInt()
}
fun <T> jsFilledChecked(n: Double, v: T): MutableList<T> = jsFilled(jsArrayLength(n), v)
/** `s.repeat(n)` of a count not known statically: a RangeError for a negative or infinite count. */
fun jsStrRepeat(s: String, n: Double): String {
    val t = jsToInteger(n)
    if (t < 0 || t.isInfinite()) throw JsNamedError("RangeError", "String.prototype.repeat argument must be greater than or equal to 0 and not be Infinity")
    return if (t == 0.0 || s.isEmpty()) "" else s.repeat(t.toInt())
}
/** `d.toFixed(f)` of digits not known statically: a RangeError out of 0..100. */
fun jsToFixedChecked(d: Double, f: Double): String {
    val t = jsToInteger(f)
    if (t < 0 || t > 100) throw JsNamedError("RangeError", "toFixed() argument must be between 0 and 100")
    return jsFixed(d, t.toInt())
}
fun <T> List<T>.jsConcat(vararg parts: List<T>): MutableList<T> = (listOf(this) + parts).flatten().toMutableList()

fun <T, U> List<T>.jsMapI(f: (T, Int) -> U): MutableList<U> = mapIndexed { i, x -> f(x, i) }.toMutableList()
fun <T> List<T>.jsFilterI(f: (T, Int) -> Boolean): MutableList<T> = filterIndexed { i, x -> f(x, i) }.toMutableList()
fun <T> List<T>.jsForEachI(f: (T, Int) -> Unit) = forEachIndexed { i, x -> f(x, i) }
fun <T> List<T>.jsSomeI(f: (T, Int) -> Boolean): Boolean = withIndex().any { f(it.value, it.index) }
fun <T> List<T>.jsEveryI(f: (T, Int) -> Boolean): Boolean = withIndex().all { f(it.value, it.index) }
fun <T> List<T>.jsFindI(f: (T, Int) -> Boolean): T? = withIndex().firstOrNull { f(it.value, it.index) }?.value
fun <T> List<T>.jsFindIndexI(f: (T, Int) -> Boolean): Int = withIndex().firstOrNull { f(it.value, it.index) }?.index ?: -1

/** ToInt32, which the bitwise operators apply to their operands. */
fun jsI32(x: Int): Int = x
fun jsI32(x: Double): Int = if (kotlin.math.abs(x) < 9.2e18) x.toLong().toInt() else if (x.isNaN() || x.isInfinite()) 0 else (x % 4294967296.0).toLong().toInt()
fun jsUshr(a: Int, b: Int): Double = ((a ushr b).toLong() and 0xFFFFFFFFL).toDouble()

fun jsSign(x: Double): Double = if (x > 0) 1.0 else if (x < 0) -1.0 else x

/** `x ** y` / `Math.pow` as JavaScriptCore (bun) computes them: a whole exponent 0…1000 by binary powering, else pow; NaN where JavaScript differs (`1 ** Infinity`). */
fun jsPow(x: Double, y: Double): Double {
    if (y.isNaN() || (kotlin.math.abs(x) == 1.0 && y.isInfinite())) return Double.NaN
    if (y >= 0.0 && y <= 1000.0 && y == kotlin.math.truncate(y)) {
        var r = 1.0
        var b = x
        var e = y.toInt()
        while (e != 0) {
            if (e and 1 != 0) r *= b
            b *= b
            e = e shr 1
        }
        return r
    }
    return Math.pow(x, y)
}

/**
 * `a % b` on Doubles. The JVM's drem is a slow loop (30+ ns); whole operands below 2^53 take Long's `%`, which
 * also keeps the dividend's sign (a zero result gets it too: -4 % 2 is -0).
 */
fun jsRem(a: Double, b: Double): Double {
    if (kotlin.math.abs(a) < 9.0e15 && kotlin.math.abs(b) < 9.0e15) {
        val la = a.toLong()
        val lb = b.toLong()
        if (lb != 0L && la.toDouble() == a && lb.toDouble() == b) {
            val r = (la % lb).toDouble()
            return if (r == 0.0) (if (a < 0.0 || 1.0 / a < 0.0) -0.0 else 0.0) else r
        }
    }
    return a.rem(b)
}
fun jsIsInteger(x: Double): Boolean = x.isFinite() && kotlin.math.truncate(x) == x

/** JavaScript's white space and line terminators, which trim() removes. */
private fun jsIsSpace(c: Char): Boolean = c in '\u0009'..'\u000D' || c == ' ' || c == '\u00A0' || c == '\u1680' || c in '\u2000'..'\u200A' ||
    c == '\u2028' || c == '\u2029' || c == '\u202F' || c == '\u205F' || c == '\u3000' || c == '\uFEFF'

fun String.jsTrim(): String = trim(::jsIsSpace)
fun String.jsTrimStart(): String = trimStart(::jsIsSpace)
fun String.jsTrimEnd(): String = trimEnd(::jsIsSpace)
fun String.jsIndexOf(s: String, from: Int = 0): Int = indexOf(s, max(0, min(from, length)))
fun String.jsLastIndexOf(s: String): Int = lastIndexOf(s, length)
fun String.jsSplit(sep: String): MutableList<String> =
    if (sep.isEmpty()) map { it.toString() }.toMutableList() else split(sep).toMutableList()
fun String.jsRepeat(n: Int): String = repeat(max(0, n))
fun String.jsPad(length: Int, fill: String, atStart: Boolean): String {
    if (length <= this.length || fill.isEmpty()) return this
    val pad = StringBuilder()
    while (pad.length < length - this.length) pad.append(fill[pad.length % fill.length])
    return if (atStart) pad.toString() + this else this + pad
}

/** `replace` / `replaceAll` with a string pattern, `$$ $& $` $'` in the replacement included. */
fun String.jsReplace(pattern: String, replacement: String, all: Boolean): String {
    val matches = mutableListOf<Int>()
    var i = 0
    while (i + pattern.length <= length) {
        if (regionMatches(i, pattern, 0, pattern.length)) {
            matches.add(i)
            if (!all) break
            i += max(pattern.length, 1)
        } else i++
    }
    val out = StringBuilder()
    var last = 0
    for (at in matches) {
        out.append(this, last, at)
        var j = 0
        while (j < replacement.length) {
            val next = if (replacement[j] == '$' && j + 1 < replacement.length) replacement[j + 1] else ' '
            when (next) {
                '$' -> out.append('$')
                '&' -> out.append(pattern)
                '`' -> out.append(this, 0, at)
                '\'' -> out.append(this, at + pattern.length, length)
                else -> {
                    out.append(replacement[j])
                    j++
                    continue
                }
            }
            j += 2
        }
        last = at + pattern.length
    }
    out.append(this, last, length)
    return out.toString()
}

/** `a < b` on strings: UTF-16 units in order, as JavaScript compares. */
fun jsCompare(a: String, b: String): Int = a.compareTo(b).coerceIn(-1, 1)

// ---------------------------------------------------------------------------
// String and number APIs (js.fn): positions are UTF-16 units, converted as JavaScript converts them
// ---------------------------------------------------------------------------

/** ToIntegerOrInfinity: NaN is 0, a fraction truncates. */
private fun jsPos(d: Double): Double = if (d.isNaN()) 0.0 else kotlin.math.truncate(d)
private fun jsClampPos(d: Double, len: Int): Int { val p = jsPos(d); return if (p <= 0) 0 else if (p >= len) len else p.toInt() }
private fun jsUnitAt(s: String, i: Double): Char? { val p = jsPos(i); return if (p >= 0 && p < s.length) s[p.toInt()] else null }
fun jsCharAt(s: String, i: Double): String = jsUnitAt(s, i)?.toString() ?: ""
fun jsCharCodeAt(s: String, i: Double): Double = jsUnitAt(s, i)?.code?.toDouble() ?: Double.NaN
fun jsCodePointAt(s: String, i: Double): Double? { val p = jsPos(i); return if (p >= 0 && p < s.length) s.codePointAt(p.toInt()).toDouble() else null }
fun jsStrAt(s: String, i: Double): String? { val p = jsPos(i); val k = if (p < 0) s.length + p else p; return if (k >= 0 && k < s.length) s[k.toInt()].toString() else null }
/** `s[i]`: the UTF-16 unit at an integer index in range, else undefined (rest). */
fun jsStrIndex(s: String, i: Double): String? = if (i >= 0 && i == Math.floor(i) && i < s.length) s[i.toInt()].toString() else null
/** `for (const c of s)`, `[...s]`, `Array.from(s)`: code points, a lone surrogate on its own (rest). */
fun jsCodePoints(s: String): MutableList<String> {
    val out = ArrayList<String>(s.length)
    var i = 0
    while (i < s.length) { val n = Character.charCount(s.codePointAt(i)); out.add(s.substring(i, i + n)); i += n }
    return out
}
/** `xs.reduce(f)` without an initial value: index `i` of the start, or JavaScript's TypeError on an empty array (rest). */
fun jsReduceStart(n: Int, i: Int): Int {
    if (n == 0) throw JsNamedError("TypeError", "Reduce of empty array with no initial value")
    return i
}
/**
 * `Math.hypot(…)` of any count, as JavaScriptCore computes it (rest): 2 → hypot; 3 → libc++'s std::hypot(x, y, z)
 * (scaled sum of squares); more → a running maximum with fused multiply-adds. Infinity wins over NaN.
 */
fun jsHypotN(v: List<Double>): Double {
    if (v.any { it.isInfinite() }) return Double.POSITIVE_INFINITY
    if (v.isEmpty()) return 0.0
    if (v.size == 1) return Math.abs(v[0])
    if (v.any { it.isNaN() }) return Double.NaN
    if (v.size == 2) return kotlin.math.hypot(v[0], v[1])
    if (v.size == 3) {
        val m = Math.max(Math.abs(v[0]), Math.max(Math.abs(v[1]), Math.abs(v[2])))
        val th = Math.scalb(1.0, 512); val small = Math.scalb(1.0, -532)
        val sc = if (m > th) small else if (m < 1 / th) 1 / small else 1.0
        val x = v[0] * sc; val y = v[1] * sc; val z = v[2] * sc
        return Math.sqrt(x * x + y * y + z * z) / sc
    }
    var m = 0.0; var sum = 0.0
    for (x in v) {
        val a = Math.abs(x)
        if (m < a) { val r = m / a; sum = Math.fma(sum, r * r, 1.0); m = a }
        else if (m != 0.0) { val r = a / m; sum = Math.fma(r, r, sum) }
    }
    return if (m == 0.0) 0.0 else Math.sqrt(sum) * m
}
private const val JS_URI_UNRESERVED = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.!~*'()"
private const val JS_URI_RESERVED = ";/?:@&=+$,#"
private fun jsUriEncode(s: String, keepReserved: Boolean): String {
    val out = StringBuilder()
    var i = 0
    while (i < s.length) {
        val c = s[i]
        if (JS_URI_UNRESERVED.indexOf(c) >= 0 || (keepReserved && JS_URI_RESERVED.indexOf(c) >= 0)) { out.append(c); i++; continue }
        val cp = s.codePointAt(i)
        // A lone surrogate has no UTF-8 form: JavaScript's URIError.
        if (cp in 0xD800..0xDFFF) throw JsNamedError("URIError", "URI error")
        val n = Character.charCount(cp)
        for (b in String(Character.toChars(cp)).toByteArray(Charsets.UTF_8)) out.append('%').append("0123456789ABCDEF"[(b.toInt() shr 4) and 15]).append("0123456789ABCDEF"[b.toInt() and 15])
        i += n
    }
    return out.toString()
}
/** `encodeURIComponent(s)` / `encodeURI(s)` (rest): UTF-8, uppercase hex; a lone surrogate is a URIError. */
fun jsEncodeUriComponent(s: String): String = jsUriEncode(s, false)
fun jsEncodeUri(s: String): String = jsUriEncode(s, true)
private fun jsUriDecode(s: String, keepReserved: Boolean): String {
    val u = s.toByteArray(Charsets.UTF_8)
    fun bad() = JsNamedError("URIError", "URI error")
    fun hex(c: Byte): Int { val x = c.toInt(); return if (x in 48..57) x - 48 else if (x in 65..70) x - 55 else if (x in 97..102) x - 87 else throw bad() }
    fun byte(i: Int): Int { if (i + 2 >= u.size || u[i].toInt() != 37) throw bad(); return hex(u[i + 1]) * 16 + hex(u[i + 2]) }
    val out = java.io.ByteArrayOutputStream()
    var i = 0
    while (i < u.size) {
        if (u[i].toInt() != 37) { out.write(u[i].toInt()); i++; continue }
        val b = byte(i)
        if (b < 0x80) {
            if (keepReserved && JS_URI_RESERVED.indexOf(b.toChar()) >= 0) out.write(u, i, 3) else out.write(b)
            i += 3
            continue
        }
        val n = if (b and 0xE0 == 0xC0) 2 else if (b and 0xF0 == 0xE0) 3 else if (b and 0xF8 == 0xF0) 4 else throw bad()
        val seq = ByteArray(n)
        seq[0] = b.toByte()
        for (k in 1 until n) { val c = byte(i + 3 * k); if (c and 0xC0 != 0x80) throw bad(); seq[k] = c.toByte() }
        // Overlong forms, surrogates and code points past U+10FFFF are errors, as in JavaScript.
        try { Charsets.UTF_8.newDecoder().decode(java.nio.ByteBuffer.wrap(seq)) } catch (e: java.nio.charset.CharacterCodingException) { throw bad() }
        out.write(seq)
        i += 3 * n
    }
    return String(out.toByteArray(), Charsets.UTF_8)
}
/** `decodeURIComponent(s)` / `decodeURI(s)` (rest): a URIError on a malformed escape, as JavaScript. */
fun jsDecodeUriComponent(s: String): String = jsUriDecode(s, false)
fun jsDecodeUri(s: String): String = jsUriDecode(s, true)
fun jsSubstring(s: String, a: Double, b: Double): String { val x = jsClampPos(a, s.length); val y = jsClampPos(b, s.length); return s.substring(min(x, y), max(x, y)) }
fun jsSubstr(s: String, start: Double, length: Double): String {
    val n = s.length.toDouble()
    var p = jsPos(start)
    if (p < 0) p = max(n + p, 0.0)
    p = min(p, n)
    val l = min(max(jsPos(length), 0.0), n - p)
    return if (l <= 0) "" else s.substring(p.toInt(), (p + l).toInt())
}
/** ToUint16. */
private fun jsU16(d: Double): Char = if (d.isFinite()) (d % 65536.0).toInt().toChar() else '\u0000'
fun jsFromCharCode(vararg codes: Double): String = String(CharArray(codes.size) { jsU16(codes[it]) })
fun jsFromCharCodes(codes: List<Double>): String = String(CharArray(codes.size) { jsU16(codes[it]) })
fun jsFromCodePoint(vararg points: Double): String = jsFromCodePoints(points.toList())
fun jsFromCodePoints(points: List<Double>): String {
    val out = StringBuilder()
    for (c in points) {
        if (!(c >= 0 && c <= 0x10FFFF && kotlin.math.truncate(c) == c)) throw JsNamedError("RangeError", "Arguments contain a value that is out of range of code points")
        out.appendCodePoint(c.toInt())
    }
    return out.toString()
}
fun jsNormalize(s: String, form: String): String = java.text.Normalizer.normalize(s, java.text.Normalizer.Form.valueOf(form))
/** `split(sep, limit)`: at most ToUint32(limit) parts. */
fun jsSplitLimit(s: String, sep: String, limit: Double): MutableList<String> {
    val lim = jsI32(limit).toLong() and 0xFFFFFFFFL
    val parts = s.jsSplit(sep)
    return if (parts.size > lim) parts.subList(0, lim.toInt()).toMutableList() else parts
}
fun jsStartsWithAt(s: String, t: String, pos: Double): Boolean = s.startsWith(t, jsClampPos(pos, s.length))
fun jsEndsWithAt(s: String, t: String, end: Double): Boolean { val e = jsClampPos(end, s.length); return e >= t.length && s.regionMatches(e - t.length, t, 0, t.length) }
fun jsIncludesAt(s: String, t: String, pos: Double): Boolean = s.indexOf(t, jsClampPos(pos, s.length)) >= 0
fun jsIndexOfFrom(s: String, t: String, pos: Double): Int = s.indexOf(t, jsClampPos(pos, s.length))
/** `lastIndexOf(t, from)`: from NaN searches the whole string. */
fun jsLastIndexOfFrom(s: String, t: String, from: Double): Int = s.lastIndexOf(t, if (from.isNaN()) s.length else jsClampPos(from, s.length))

private val jsFloatPrefix = Regex("^[+-]?(Infinity|(\\d+\\.?\\d*|\\.\\d+)([eE][+-]?\\d+)?)")
/** `parseFloat(s)`: the longest decimal literal (or Infinity) after white space; NaN if none. */
fun jsParseFloat(s: String): Double {
    val m = jsFloatPrefix.find(s.jsTrimStart())?.value ?: return Double.NaN
    return if (m.endsWith("Infinity")) (if (m.startsWith("-")) Double.NEGATIVE_INFINITY else Double.POSITIVE_INFINITY) else m.toDouble()
}

/** d (finite, >= 0) rounded to p significant digits, half up, from its exact value: the digits and the exponent of the first. */
private fun jsRoundDigits(d: Double, p: Int): Pair<String, Int> {
    if (d == 0.0) return "0".repeat(p) to 0
    val r = java.math.BigDecimal(d).round(java.math.MathContext(p, java.math.RoundingMode.HALF_UP))
    val digits = r.unscaledValue().toString()
    return digits.padEnd(p, '0') to digits.length - 1 - r.scale()
}
private fun jsExpText(ds: String, e: Int): String = ds.substring(0, 1) + (if (ds.length > 1) "." + ds.substring(1) else "") + "e" + (if (e >= 0) "+" else "-") + kotlin.math.abs(e)
fun jsToPrecision(d: Double, precision: Double): String {
    val p = jsPos(precision)
    if (!d.isFinite()) return jsNum(d)
    if (!(p >= 1 && p <= 100)) throw JsNamedError("RangeError", "toPrecision() argument must be between 1 and 100")
    val n = p.toInt()
    val (ds, e) = jsRoundDigits(kotlin.math.abs(d), n)
    val sign = if (d < 0) "-" else ""
    return sign + when {
        e < -6 || e >= n -> jsExpText(ds, e)
        e == n - 1 -> ds
        e >= 0 -> ds.substring(0, e + 1) + "." + ds.substring(e + 1)
        else -> "0." + "0".repeat(-(e + 1)) + ds
    }
}
fun jsToExponential(d: Double, digits: Double): String {
    val f = jsPos(digits)
    if (!d.isFinite()) return jsNum(d)
    if (!(f >= 0 && f <= 100)) throw JsNamedError("RangeError", "toExponential() argument must be between 0 and 100")
    val (ds, e) = jsRoundDigits(kotlin.math.abs(d), f.toInt() + 1)
    return (if (d < 0) "-" else "") + jsExpText(ds, e)
}
/** `toExponential()`: the shortest digits that read back as d (those jsNum prints). */
fun jsToExponentialAuto(d: Double): String {
    if (!d.isFinite()) return jsNum(d)
    if (d == 0.0) return "0e+0"
    val a = kotlin.math.abs(d)
    for (precision in 1..17) {
        val text = String.format(java.util.Locale.ROOT, "%.${precision - 1}e", a)
        if (text.toDouble() != a) continue
        val (mantissa, exponent) = text.split('e')
        return (if (d < 0) "-" else "") + jsExpText(mantissa.replace(".", "").trimEnd('0').ifEmpty { "0" }, exponent.toInt())
    }
    return jsNum(d)
}
/** x * 2^by as an integer (x finite, >= 0, a multiple of 2^-by). */
private fun jsScaled(x: Double, by: Int): java.math.BigInteger {
    val bits = java.lang.Double.doubleToRawLongBits(x)
    val be = ((bits ushr 52) and 0x7FF).toInt()
    val m = bits and 0xFFFFFFFFFFFFFL
    return if (be == 0) java.math.BigInteger.valueOf(m).shiftLeft(by - 1074) else java.math.BigInteger.valueOf(m or (1L shl 52)).shiftLeft(be - 1075 + by)
}
/**
 * `toString(radix)`: JavaScriptCore's digits (bun's): the integer part exact, the fraction until the next or previous
 * double would print differently, rounded half to even (NumberPrototype.cpp's toStringWithRadixInternal, exactly).
 */
fun jsToRadix(d: Double, radixArg: Double): String {
    val r = jsPos(radixArg)
    if (!(r >= 2 && r <= 36)) throw JsNamedError("RangeError", "toString() radix argument must be between 2 and 36")
    val radix = r.toInt()
    if (radix == 10 || !d.isFinite()) return jsNum(d)
    val n = kotlin.math.abs(d)
    var ip = kotlin.math.floor(n)
    val fp = n - ip
    if (fp == 0.0 && ip < 4503599627370496.0) return d.toLong().toString(radix)
    val frac = StringBuilder()
    if (fp != 0.0) {
        // Fixed point: every value here is a multiple of 2^-1076.
        val s = 1076
        val one = java.math.BigInteger.ONE.shiftLeft(s)
        val half = java.math.BigInteger.ONE.shiftLeft(s - 1)
        val mask = one - java.math.BigInteger.ONE
        val big = java.math.BigInteger.valueOf(radix.toLong())
        var f = jsScaled(fp, s)
        var next = jsScaled(Math.nextUp(n) - n, s - 1)
        var last = jsScaled(n - Math.nextDown(n), s - 1)
        var digit = if (ip <= 9007199254740991.0 && ip % 2 == 1.0) 1 else 0
        var odd = digit == 1
        var up = false
        while (true) {
            val c = f.compareTo(half)
            if (c > 0 || (c == 0 && (if (radix and 1 == 1) odd else digit and 1 == 1))) {
                if (f + next > one) { up = true; break }
            } else if (f < last) break
            f *= big
            digit = f.shiftRight(s).toInt()
            f = f.and(mask)
            next *= big
            last *= big
            frac.append(Character.forDigit(digit, radix))
            if (digit and 1 == 1) odd = !odd
        }
        if (up) {
            val top = Character.forDigit(radix - 1, radix)
            while (frac.isNotEmpty() && frac[frac.length - 1] == top) frac.setLength(frac.length - 1)
            if (frac.isEmpty()) ip += 1 else frac.setCharAt(frac.length - 1, Character.forDigit(Character.digit(frac[frac.length - 1], radix) + 1, radix))
        } else {
            while (frac.isNotEmpty() && frac[frac.length - 1] == '0') frac.setLength(frac.length - 1)
        }
    }
    val whole = if (ip < 9007199254740992.0) ip.toLong().toString(radix) else java.math.BigDecimal(ip).toBigInteger().toString(radix)
    return (if (d < 0) "-" else "") + whole + (if (frac.isEmpty()) "" else ".$frac")
}

// ---------------------------------------------------------------------------
// Typed arrays: a view (`off`, `length`) over a packed primitive array other views may share (`subarray`).
// Writes convert as JavaScript does (ToInt8…ToUint32 wrap, Uint8Clamped clamps and rounds half to even, Float32 rounds
// to nearest even) and are ignored out of range. Callbacks get each value as a Double and its index.
// ---------------------------------------------------------------------------

/** ToIntegerOrInfinity of a relative index, clamped to `0..len` (negative counts from the end). */
internal fun jsTARel(d: Double, len: Int): Int {
    val t = if (d.isNaN()) 0.0 else kotlin.math.truncate(d)
    return (if (t < 0) max(len + t, 0.0) else min(t, len.toDouble())).toInt()
}

/** A stable merge sort with JavaScript's comparator contract (never throws on an inconsistent comparator). */
internal fun jsMergeSort(v: DoubleArray, cmp: (Double, Double) -> Double) {
    val n = v.size
    var a = v
    var b = DoubleArray(n)
    var width = 1
    while (width < n) {
        var lo = 0
        while (lo < n) {
            val mid = min(lo + width, n); val hi = min(lo + 2 * width, n)
            var i = lo; var j = mid; var k = lo
            while (i < mid && j < hi) { if (cmp(a[j], a[i]) < 0) b[k++] = a[j++] else b[k++] = a[i++] }
            while (i < mid) b[k++] = a[i++]
            while (j < hi) b[k++] = a[j++]
            lo = hi
        }
        val t = a; a = b; b = t
        width *= 2
    }
    if (a !== v) a.copyInto(v)
}

@Suppress("UNCHECKED_CAST")
abstract class JsTypedArray<T : JsTypedArray<T, N>, N>(@JvmField val off: Int, @JvmField val length: Int) {
    abstract val bytesPer: Int
    /** The value at view index i, as a JavaScript number. */
    abstract fun dbl(i: Int): Double
    /** Stores a converted value at view index i (in range). */
    abstract fun store(i: Int, v: Double)
    abstract fun store(i: Int, v: Int)
    abstract fun get(i: Int): N
    abstract fun view(o: Int, n: Int): T
    abstract fun alloc(n: Int): T
    abstract fun copyRaw(from: Int, to: Int, count: Int)
    val byteLength: Int get() = length * bytesPer
    val byteOffset: Int get() = off * bytesPer
    private val self: T get() = this as T
    protected fun check(i: Int) { if (i < 0 || i >= length) throw IndexOutOfBoundsException("typed array index out of range") }
    fun opt(i: Int): N? = if (i in 0 until length) get(i) else null
    fun put(i: Int, v: Int) { if (i in 0 until length) store(i, v) }
    fun putD(i: Int, v: Double) { if (i in 0 until length) store(i, v) }
    fun jsAt(i: Double): N? {
        val t = if (i.isNaN()) 0.0 else kotlin.math.truncate(i)
        val k = if (t < 0) length + t else t
        return if (k >= 0 && k < length) get(k.toInt()) else null
    }
    fun fill(v: Double, start: Double, end: Double): T {
        val a = jsTARel(start, length); val b = jsTARel(end, length)
        for (i in a until b) store(i, v)
        return self
    }
    fun subarray(start: Double, end: Double): T {
        val a = jsTARel(start, length); val b = jsTARel(end, length)
        return view(off + a, max(b, a) - a)
    }
    fun slice(start: Double, end: Double): T {
        val a = jsTARel(start, length); val b = jsTARel(end, length)
        val r = alloc(max(b, a) - a)
        for (i in 0 until r.length) r.store(i, dbl(a + i))
        return r
    }
    private fun setValues(v: DoubleArray, offset: Double) {
        val o = if (offset.isNaN()) 0.0 else kotlin.math.truncate(offset)
        if (o < 0 || o + v.size > length) throw IndexOutOfBoundsException("RangeError: offset is out of bounds")
        for (i in v.indices) store(o.toInt() + i, v[i])
    }
    fun setFrom(xs: List<Double>, offset: Double) = setValues(xs.toDoubleArray(), offset)
    /** Read first, so an overlapping view of the same storage copies as if through a temporary. */
    fun setFromTa(src: JsTypedArray<*, *>, offset: Double) = setValues(src.toDoubles(), offset)
    fun copyWithin(target: Double, start: Double, end: Double): T {
        val t = jsTARel(target, length); val s = jsTARel(start, length); val e = jsTARel(end, length)
        val count = min(max(e - s, 0), length - t)
        if (count > 0) copyRaw(s, t, count)
        return self
    }
    fun reverse(): T {
        val v = toDoubles()
        for (i in v.indices) store(i, v[v.size - 1 - i])
        return self
    }
    private fun writeAll(v: DoubleArray) { for (i in v.indices) store(i, v[i]) }
    /** `sort()`: numeric, -0 before +0, NaN last (java.util.Arrays' order for doubles). */
    fun sortNum(): T { val v = toDoubles(); v.sort(); writeAll(v); return self }
    fun sortBy(cmp: (Double, Double) -> Double): T { val v = toDoubles(); jsMergeSort(v, cmp); writeAll(v); return self }
    fun toDoubles(): DoubleArray = DoubleArray(length) { dbl(it) }
    fun toArray(): MutableList<Double> = toDoubles().toMutableList()
    fun indexOf(v: Double, from: Double): Int {
        for (i in jsTARel(from, length) until length) if (dbl(i) == v) return i
        return -1
    }
    fun lastIndexOf(v: Double, from: Double): Int {
        val t = if (from.isNaN()) 0.0 else kotlin.math.truncate(from)
        val k = if (t < 0) length + t else min(t, length - 1.0)
        if (k < 0) return -1
        for (i in k.toInt() downTo 0) if (dbl(i) == v) return i
        return -1
    }
    fun includes(v: Double, from: Double): Boolean {
        for (i in jsTARel(from, length) until length) { val x = dbl(i); if (x == v || (x.isNaN() && v.isNaN())) return true }
        return false
    }
    fun join(sep: String): String = (0 until length).joinToString(sep) { jsNum(dbl(it)) }
    override fun toString(): String = join(",")
    fun map(f: (Double, Int) -> Double): T { val r = alloc(length); for (i in 0 until length) r.store(i, f(dbl(i), i)); return r }
    fun filter(f: (Double, Int) -> Boolean): T {
        val kept = ArrayList<Double>()
        for (i in 0 until length) if (f(dbl(i), i)) kept.add(dbl(i))
        val r = alloc(kept.size)
        for (i in kept.indices) r.store(i, kept[i])
        return r
    }
    fun forEach(f: (Double, Int) -> Unit) { for (i in 0 until length) f(dbl(i), i) }
    fun some(f: (Double, Int) -> Boolean): Boolean { for (i in 0 until length) if (f(dbl(i), i)) return true; return false }
    fun every(f: (Double, Int) -> Boolean): Boolean { for (i in 0 until length) if (!f(dbl(i), i)) return false; return true }
    fun find(f: (Double, Int) -> Boolean): N? { for (i in 0 until length) if (f(dbl(i), i)) return get(i); return null }
    fun findIndex(f: (Double, Int) -> Boolean): Int { for (i in 0 until length) if (f(dbl(i), i)) return i; return -1 }
    fun <A> reduce(initial: A, f: (A, Double) -> A): A { var acc = initial; for (i in 0 until length) acc = f(acc, dbl(i)); return acc }
}

private fun jsClamp8(v: Double): Int = if (v.isNaN()) 0 else Math.rint(v.coerceIn(0.0, 255.0)).toInt()

class Int8Array(@JvmField val a: ByteArray, off: Int, length: Int) : JsTypedArray<Int8Array, Int>(off, length) {
    constructor(n: Int) : this(ByteArray(n), 0, n)
    constructor(xs: List<Double>) : this(xs.size) { setFrom(xs, 0.0) }
    constructor(src: JsTypedArray<*, *>) : this(src.length) { setFromTa(src, 0.0) }
    override val bytesPer get() = 1
    override fun get(i: Int): Int { check(i); return a[off + i].toInt() }
    override fun dbl(i: Int) = a[off + i].toDouble()
    override fun store(i: Int, v: Int) { a[off + i] = v.toByte() }
    override fun store(i: Int, v: Double) { a[off + i] = jsI32(v).toByte() }
    override fun view(o: Int, n: Int) = Int8Array(a, o, n)
    override fun alloc(n: Int) = Int8Array(n)
    override fun copyRaw(from: Int, to: Int, count: Int) { System.arraycopy(a, off + from, a, off + to, count) }
    companion object { const val BYTES_PER_ELEMENT = 1 }
}
class Uint8Array(@JvmField val a: ByteArray, off: Int, length: Int) : JsTypedArray<Uint8Array, Int>(off, length) {
    constructor(n: Int) : this(ByteArray(n), 0, n)
    constructor(xs: List<Double>) : this(xs.size) { setFrom(xs, 0.0) }
    constructor(src: JsTypedArray<*, *>) : this(src.length) { setFromTa(src, 0.0) }
    override val bytesPer get() = 1
    override fun get(i: Int): Int { check(i); return a[off + i].toInt() and 0xff }
    override fun dbl(i: Int) = (a[off + i].toInt() and 0xff).toDouble()
    override fun store(i: Int, v: Int) { a[off + i] = v.toByte() }
    override fun store(i: Int, v: Double) { a[off + i] = jsI32(v).toByte() }
    override fun view(o: Int, n: Int) = Uint8Array(a, o, n)
    override fun alloc(n: Int) = Uint8Array(n)
    override fun copyRaw(from: Int, to: Int, count: Int) { System.arraycopy(a, off + from, a, off + to, count) }
    companion object { const val BYTES_PER_ELEMENT = 1 }
}
class Uint8ClampedArray(@JvmField val a: ByteArray, off: Int, length: Int) : JsTypedArray<Uint8ClampedArray, Int>(off, length) {
    constructor(n: Int) : this(ByteArray(n), 0, n)
    constructor(xs: List<Double>) : this(xs.size) { setFrom(xs, 0.0) }
    constructor(src: JsTypedArray<*, *>) : this(src.length) { setFromTa(src, 0.0) }
    override val bytesPer get() = 1
    override fun get(i: Int): Int { check(i); return a[off + i].toInt() and 0xff }
    override fun dbl(i: Int) = (a[off + i].toInt() and 0xff).toDouble()
    override fun store(i: Int, v: Int) { a[off + i] = v.coerceIn(0, 255).toByte() }
    override fun store(i: Int, v: Double) { a[off + i] = jsClamp8(v).toByte() }
    override fun view(o: Int, n: Int) = Uint8ClampedArray(a, o, n)
    override fun alloc(n: Int) = Uint8ClampedArray(n)
    override fun copyRaw(from: Int, to: Int, count: Int) { System.arraycopy(a, off + from, a, off + to, count) }
    companion object { const val BYTES_PER_ELEMENT = 1 }
}
class Int16Array(@JvmField val a: ShortArray, off: Int, length: Int) : JsTypedArray<Int16Array, Int>(off, length) {
    constructor(n: Int) : this(ShortArray(n), 0, n)
    constructor(xs: List<Double>) : this(xs.size) { setFrom(xs, 0.0) }
    constructor(src: JsTypedArray<*, *>) : this(src.length) { setFromTa(src, 0.0) }
    override val bytesPer get() = 2
    override fun get(i: Int): Int { check(i); return a[off + i].toInt() }
    override fun dbl(i: Int) = a[off + i].toDouble()
    override fun store(i: Int, v: Int) { a[off + i] = v.toShort() }
    override fun store(i: Int, v: Double) { a[off + i] = jsI32(v).toShort() }
    override fun view(o: Int, n: Int) = Int16Array(a, o, n)
    override fun alloc(n: Int) = Int16Array(n)
    override fun copyRaw(from: Int, to: Int, count: Int) { System.arraycopy(a, off + from, a, off + to, count) }
    companion object { const val BYTES_PER_ELEMENT = 2 }
}
class Uint16Array(@JvmField val a: ShortArray, off: Int, length: Int) : JsTypedArray<Uint16Array, Int>(off, length) {
    constructor(n: Int) : this(ShortArray(n), 0, n)
    constructor(xs: List<Double>) : this(xs.size) { setFrom(xs, 0.0) }
    constructor(src: JsTypedArray<*, *>) : this(src.length) { setFromTa(src, 0.0) }
    override val bytesPer get() = 2
    override fun get(i: Int): Int { check(i); return a[off + i].toInt() and 0xffff }
    override fun dbl(i: Int) = (a[off + i].toInt() and 0xffff).toDouble()
    override fun store(i: Int, v: Int) { a[off + i] = v.toShort() }
    override fun store(i: Int, v: Double) { a[off + i] = jsI32(v).toShort() }
    override fun view(o: Int, n: Int) = Uint16Array(a, o, n)
    override fun alloc(n: Int) = Uint16Array(n)
    override fun copyRaw(from: Int, to: Int, count: Int) { System.arraycopy(a, off + from, a, off + to, count) }
    companion object { const val BYTES_PER_ELEMENT = 2 }
}
class Int32Array(@JvmField val a: IntArray, off: Int, length: Int) : JsTypedArray<Int32Array, Int>(off, length) {
    constructor(n: Int) : this(IntArray(n), 0, n)
    constructor(xs: List<Double>) : this(xs.size) { setFrom(xs, 0.0) }
    constructor(src: JsTypedArray<*, *>) : this(src.length) { setFromTa(src, 0.0) }
    override val bytesPer get() = 4
    override fun get(i: Int): Int { check(i); return a[off + i] }
    override fun dbl(i: Int) = a[off + i].toDouble()
    override fun store(i: Int, v: Int) { a[off + i] = v }
    override fun store(i: Int, v: Double) { a[off + i] = jsI32(v) }
    override fun view(o: Int, n: Int) = Int32Array(a, o, n)
    override fun alloc(n: Int) = Int32Array(n)
    override fun copyRaw(from: Int, to: Int, count: Int) { System.arraycopy(a, off + from, a, off + to, count) }
    companion object { const val BYTES_PER_ELEMENT = 4 }
}
class Uint32Array(@JvmField val a: IntArray, off: Int, length: Int) : JsTypedArray<Uint32Array, Double>(off, length) {
    constructor(n: Int) : this(IntArray(n), 0, n)
    constructor(xs: List<Double>) : this(xs.size) { setFrom(xs, 0.0) }
    constructor(src: JsTypedArray<*, *>) : this(src.length) { setFromTa(src, 0.0) }
    override val bytesPer get() = 4
    override fun get(i: Int): Double { check(i); return (a[off + i].toLong() and 0xffffffffL).toDouble() }
    override fun dbl(i: Int) = (a[off + i].toLong() and 0xffffffffL).toDouble()
    override fun store(i: Int, v: Int) { a[off + i] = v }
    override fun store(i: Int, v: Double) { a[off + i] = jsI32(v) }
    override fun view(o: Int, n: Int) = Uint32Array(a, o, n)
    override fun alloc(n: Int) = Uint32Array(n)
    override fun copyRaw(from: Int, to: Int, count: Int) { System.arraycopy(a, off + from, a, off + to, count) }
    companion object { const val BYTES_PER_ELEMENT = 4 }
}
class Float32Array(@JvmField val a: FloatArray, off: Int, length: Int) : JsTypedArray<Float32Array, Double>(off, length) {
    constructor(n: Int) : this(FloatArray(n), 0, n)
    constructor(xs: List<Double>) : this(xs.size) { setFrom(xs, 0.0) }
    constructor(src: JsTypedArray<*, *>) : this(src.length) { setFromTa(src, 0.0) }
    override val bytesPer get() = 4
    override fun get(i: Int): Double { check(i); return a[off + i].toDouble() }
    override fun dbl(i: Int) = a[off + i].toDouble()
    override fun store(i: Int, v: Int) { a[off + i] = v.toDouble().toFloat() }
    override fun store(i: Int, v: Double) { a[off + i] = v.toFloat() }
    override fun view(o: Int, n: Int) = Float32Array(a, o, n)
    override fun alloc(n: Int) = Float32Array(n)
    override fun copyRaw(from: Int, to: Int, count: Int) { System.arraycopy(a, off + from, a, off + to, count) }
    companion object { const val BYTES_PER_ELEMENT = 4 }
}
class Float64Array(@JvmField val a: DoubleArray, off: Int, length: Int) : JsTypedArray<Float64Array, Double>(off, length) {
    constructor(n: Int) : this(DoubleArray(n), 0, n)
    constructor(xs: List<Double>) : this(xs.size) { setFrom(xs, 0.0) }
    constructor(src: JsTypedArray<*, *>) : this(src.length) { setFromTa(src, 0.0) }
    override val bytesPer get() = 8
    override fun get(i: Int): Double { check(i); return a[off + i] }
    override fun dbl(i: Int) = a[off + i]
    override fun store(i: Int, v: Int) { a[off + i] = v.toDouble() }
    override fun store(i: Int, v: Double) { a[off + i] = v }
    override fun view(o: Int, n: Int) = Float64Array(a, o, n)
    override fun alloc(n: Int) = Float64Array(n)
    override fun copyRaw(from: Int, to: Int, count: Int) { System.arraycopy(a, off + from, a, off + to, count) }
    companion object { const val BYTES_PER_ELEMENT = 8 }
}

// ---------------------------------------------------------------------------
// Map and Set
// ---------------------------------------------------------------------------

private object JsHole

/**
 * JavaScript's `Map` (and `Set`: V = Unit): a shared hash map (O(1) get / set / has / delete) in insertion order.
 * Keys compare by SameValueZero (boxed Double equality with -0 stored as +0: NaN finds NaN) or, `byRef`, by identity
 * (objects, arrays, maps: Kotlin's lists and maps compare contents). A delete leaves a hole until the slots are
 * compacted; each slot keeps the sequence number it was added with, so iteration (`next(s)`: the entry after `s`) is
 * live as in JavaScript: an entry deleted before its turn is skipped, one added during the loop is visited.
 */
class JsOMap<K, V>(private val byRef: Boolean) {
    /**
     * Key -> slot: open addressing (linear probing) over `keys`; cell c is table[2c] (a slot, -1 empty, -2 deleted)
     * and table[2c + 1] (the key's hash, compared before the key). A HashMap index cost a node and a boxed Integer per
     * entry and hashed integral Doubles poorly.
     */
    private var table = IntArray(16).also { it.fill(-1) }
    private var live = 0
    private var filled = 0
    private var keys = arrayOfNulls<Any?>(4)
    private var vals = arrayOfNulls<Any?>(4)
    private var seqs = IntArray(4)
    private var count = 0
    private var nextSeq = 0
    private var cur = 0

    // A Double-typed `d`: `==` is IEEE there (-0.0 == 0.0), `equals` on a boxed one is not.
    private fun norm(k: K): Any? { val d: Double = (k as? Double) ?: return k; return if (d == 0.0) 0.0 else d }

    private fun hashOf(k: Any?): Int {
        // MurmurHash3's fmix32: the table probes by the low bits.
        var h = if (byRef) System.identityHashCode(k) else k.hashCode()
        h = (h xor (h ushr 16)) * -0x7a143595
        h = (h xor (h ushr 13)) * -0x3d4d51cb
        return h xor (h ushr 16)
    }
    /** The table cell holding key `k`, or -1. */
    private fun cellOf(k: Any?): Int {
        val mask = (table.size shr 1) - 1
        val h = hashOf(k)
        var c = h and mask
        while (true) {
            val t = table[2 * c]
            if (t == -1) return -1
            if (t >= 0 && table[2 * c + 1] == h && (if (byRef) keys[t] === k else keys[t] == k)) return c
            c = (c + 1) and mask
        }
    }
    private fun slotOfKey(k: Any?): Int { val c = cellOf(k); return if (c < 0) -1 else table[2 * c] }
    /** Puts an absent key's slot in the first free cell. */
    private fun insertCell(k: Any?, slot: Int) {
        val mask = (table.size shr 1) - 1
        val h = hashOf(k)
        var c = h and mask
        while (table[2 * c] >= 0) c = (c + 1) and mask
        if (table[2 * c] == -1) filled++
        table[2 * c] = slot
        table[2 * c + 1] = h
    }
    /** A new table for the live slots (a quarter full; rebuilt again past half). */
    private fun rebuild() {
        var cap = 8
        while (cap < live * 4) cap *= 2
        table = IntArray(2 * cap).also { it.fill(-1) }
        filled = 0
        for (p in 0 until count) if (keys[p] !== JsHole) insertCell(keys[p], p)
    }

    fun size(): Int = live
    @Suppress("UNCHECKED_CAST")
    fun get(k: K): V? { val i = slotOfKey(norm(k)); return if (i < 0) null else vals[i] as V }
    fun has(k: K): Boolean = cellOf(norm(k)) >= 0
    fun set(k: K, v: V): JsOMap<K, V> {
        val key = norm(k)
        val i = slotOfKey(key)
        if (i >= 0) { vals[i] = v; return this }
        if (count == keys.size) {
            keys = keys.copyOf(count * 2); vals = vals.copyOf(count * 2); seqs = seqs.copyOf(count * 2)
        }
        keys[count] = key; vals[count] = v; seqs[count] = nextSeq++
        count++
        live++
        if ((filled + 1) * 4 > table.size) rebuild() else insertCell(key, count - 1)
        return this
    }
    fun delete(k: K): Boolean {
        val c = cellOf(norm(k))
        if (c < 0) return false
        val i = table[2 * c]
        table[2 * c] = -2
        live--
        keys[i] = JsHole; vals[i] = null
        // Mostly holes: compact, so the slots stay proportional to the entries.
        if (count > 16 && live * 2 < count) {
            var j = 0
            for (p in 0 until count) if (keys[p] !== JsHole) {
                keys[j] = keys[p]; vals[j] = vals[p]; seqs[j] = seqs[p]; j++
            }
            for (p in j until count) { keys[p] = null; vals[p] = null }
            count = j
            cur = 0
            rebuild()
        }
        return true
    }
    fun clear() {
        table.fill(-1)
        filled = 0
        live = 0
        java.util.Arrays.fill(keys, 0, count, null); java.util.Arrays.fill(vals, 0, count, null)
        count = 0
        cur = 0
    }

    private fun after(s: Int): Int {
        var lo = 0; var hi = count
        while (lo < hi) { val mid = (lo + hi) ushr 1; if (seqs[mid] <= s) lo = mid + 1 else hi = mid }
        return lo
    }
    private fun slotOf(s: Int): Int = if (cur < count && seqs[cur] == s) cur else after(s - 1)
    /** The sequence number of the first live entry after `s` (-1: from the start), or -1 at the end. */
    fun next(s: Int): Int {
        var p = if (s < 0) 0 else if (cur < count && seqs[cur] == s) cur + 1 else after(s)
        while (p < count && keys[p] === JsHole) p++
        if (p >= count) return -1
        cur = p
        return seqs[p]
    }
    @Suppress("UNCHECKED_CAST") fun keyAt(s: Int): K = keys[slotOf(s)] as K
    @Suppress("UNCHECKED_CAST") fun valueAt(s: Int): V = vals[slotOf(s)] as V

    @Suppress("UNCHECKED_CAST")
    fun forEach(f: (V, K) -> Unit) {
        var s = -1
        while (true) {
            s = next(s)
            if (s < 0) return
            f(vals[cur] as V, keys[cur] as K)
        }
    }
    @Suppress("UNCHECKED_CAST")
    fun keysArr(): MutableList<K> { val out = ArrayList<K>(live); for (p in 0 until count) if (keys[p] !== JsHole) out.add(keys[p] as K); return out }
    @Suppress("UNCHECKED_CAST")
    fun valuesArr(): MutableList<V> { val out = ArrayList<V>(live); for (p in 0 until count) if (keys[p] !== JsHole) out.add(vals[p] as V); return out }
    @Suppress("UNCHECKED_CAST")
    fun <T> pairs(f: (K, V) -> T): MutableList<T> {
        val (ks, vs, n) = Triple(keys.copyOf(), vals.copyOf(), count)
        val out = ArrayList<T>(live)
        for (p in 0 until n) if (ks[p] !== JsHole) out.add(f(ks[p] as K, vs[p] as V))
        return out
    }
    @Suppress("UNCHECKED_CAST")
    fun copy(): JsOMap<K, V> { val m = JsOMap<K, V>(byRef); for (p in 0 until count) if (keys[p] !== JsHole) m.set(keys[p] as K, vals[p] as V); return m }
    fun setAll(ks: List<K>, vs: List<V>): JsOMap<K, V> { for (i in 0 until minOf(ks.size, vs.size)) set(ks[i], vs[i]); return this }
}

fun <K> JsOMap<K, Unit>.add(k: K): JsOMap<K, Unit> = set(k, Unit)
fun <K> JsOMap<K, Unit>.addAll(ks: List<K>): JsOMap<K, Unit> { for (k in ks) set(k, Unit); return this }
fun <K> JsOMap<K, Unit>.forEachSet(f: (K, K) -> Unit) = forEach { _, k -> f(k, k) }

// ---------------------------------------------------------------------------
// Weak references (lib4)
// ---------------------------------------------------------------------------

/** The targets `new WeakRef(x)` / `deref()` gave during the current job: kept until its microtasks have run. */
internal val jsKept = ArrayList<Any>()
internal fun jsKeep(o: Any) {
    jsKept.add(o)
    jsScheduleDrain()
}

/**
 * `WeakMap<K, V>` (a `WeakSet` has `V == Unit`): entries by the key's identity, the key held weakly (a collected key's
 * entry is dropped by the next sweep, which runs as the map grows), not iterable.
 */
class JsWeakMap<K, V>(@Suppress("UNUSED_PARAMETER") byRef: Boolean = true) {
    private class Entry<V>(key: Any, var value: V) { val ref = java.lang.ref.WeakReference(key) }
    private val buckets = HashMap<Int, ArrayList<Entry<V>>>()
    private var count = 0
    private var sweepAt = 16
    private fun entry(k: K): Entry<V>? = buckets[System.identityHashCode(k)]?.firstOrNull { it.ref.get() === k }
    fun get(k: K): V? = entry(k)?.value
    fun has(k: K): Boolean = entry(k) != null
    fun set(k: K, v: V): JsWeakMap<K, V> {
        val e = entry(k)
        if (e != null) { e.value = v; return this }
        buckets.getOrPut(System.identityHashCode(k)) { ArrayList(1) }.add(Entry(k as Any, v))
        if (++count >= sweepAt) {
            count = 0
            val it = buckets.values.iterator()
            while (it.hasNext()) {
                val b = it.next()
                b.removeAll { x -> x.ref.get() == null }
                if (b.isEmpty()) it.remove() else count += b.size
            }
            sweepAt = maxOf(16, count * 2)
        }
        return this
    }
    fun delete(k: K): Boolean {
        val h = System.identityHashCode(k)
        val b = buckets[h] ?: return false
        val i = b.indexOfFirst { it.ref.get() === k }
        if (i < 0) return false
        b.removeAt(i)
        count--
        if (b.isEmpty()) buckets.remove(h)
        return true
    }
}
fun <K> JsWeakMap<K, Unit>.add(k: K): JsWeakMap<K, Unit> = set(k, Unit)

/** `WeakRef<T>`: its target while something else holds it (and until the job that made or read it ends). */
class JsWeakRef<T : Any>(t: T) {
    private val ref = java.lang.ref.WeakReference(t)
    init { jsKeep(t) }
    fun deref(): T? = ref.get()?.also { jsKeep(it) }
}

// ---------------------------------------------------------------------------
// ArrayBuffer and DataView (lib4)
// ---------------------------------------------------------------------------

/** `ArrayBuffer`: the bytes `Uint8Array` / `Uint8ClampedArray` views share (`new Uint8Array(buffer, …)`, `.buffer`). */
typealias ArrayBuffer = ByteArray

private fun jsRange(message: String) = JsNamedError("RangeError", message)
/** ToIndex, with the message of the RangeError for a negative value. */
private fun jsIndex(d: Double, negative: String): Int {
    val t = jsToInteger(d)
    if (t < 0) throw jsRange(negative)
    if (t > 9007199254740991.0) throw jsRange("length larger than (2 ** 53) - 1")
    return t.toInt()
}
fun jsNewArrayBuffer(n: Double): ArrayBuffer = ByteArray(jsIndex(n, "length cannot be negative"))
fun jsAbByteLength(b: ArrayBuffer): Double = b.size.toDouble()
fun jsAbSlice(b: ArrayBuffer, start: Double, end: Double): ArrayBuffer {
    val s = jsTARel(start, b.size)
    return b.copyOfRange(s, max(jsTARel(end, b.size), s))
}
private fun jsU8Range(b: ArrayBuffer, off: Double, len: Double?): Pair<Int, Int> {
    val o = jsIndex(off, "byteOffset cannot be negative")
    val n = len?.let { jsIndex(it, "length cannot be negative") }
    if (o > b.size || o.toLong() + (n ?: 0) > b.size) throw jsRange("Length out of range of buffer")
    return Pair(o, n ?: (b.size - o))
}
/** `new Uint8Array(buffer, byteOffset, length?)` (and Uint8ClampedArray): a view sharing the buffer's bytes. */
fun jsNewUint8ArrayLen(b: ArrayBuffer, off: Double, len: Double): Uint8Array = jsNewUint8Array(b, off, len)
fun jsNewUint8ClampedArrayLen(b: ArrayBuffer, off: Double, len: Double): Uint8ClampedArray = jsNewUint8ClampedArray(b, off, len)
fun jsNewUint8Array(b: ArrayBuffer, off: Double, len: Double? = null): Uint8Array = jsU8Range(b, off, len).let { Uint8Array(b, it.first, it.second) }
fun jsNewUint8ClampedArray(b: ArrayBuffer, off: Double, len: Double? = null): Uint8ClampedArray = jsU8Range(b, off, len).let { Uint8ClampedArray(b, it.first, it.second) }
fun jsTaBuffer(t: Uint8Array): ArrayBuffer = t.a
fun jsTaBuffer(t: Uint8ClampedArray): ArrayBuffer = t.a

/** `DataView`: reads and writes numbers of any size and byte order in a window of an ArrayBuffer. */
class DataView(@JvmField val buffer: ArrayBuffer, @JvmField val byteOffset: Int, @JvmField val byteLength: Int)

fun jsNewDataViewLen(b: ArrayBuffer, off: Double, len: Double): DataView = jsNewDataView(b, off, len)
fun jsNewDataView(b: ArrayBuffer, off: Double, len: Double? = null): DataView {
    val o = jsIndex(off, "byteOffset cannot be negative")
    if (o > b.size) throw jsRange("byteOffset exceeds source ArrayBuffer byteLength")
    if (len == null) return DataView(b, o, b.size - o)
    val n = jsIndex(len, "byteLength cannot be negative")
    if (o.toLong() + n > b.size) throw jsRange("Length out of range of buffer")
    return DataView(b, o, n)
}
fun jsDvBuffer(d: DataView): ArrayBuffer = d.buffer
fun jsDvByteLength(d: DataView): Double = d.byteLength.toDouble()
fun jsDvByteOffset(d: DataView): Double = d.byteOffset.toDouble()
private val jsDvSizes = intArrayOf(1, 1, 2, 2, 4, 4, 4, 8)
/** The bytes [at, at + size) of the view as an unsigned integer in the given byte order. */
private fun jsDvLoad(d: DataView, at: Double, size: Int, little: Boolean): Long {
    val i = jsIndex(at, "byteOffset cannot be negative")
    if (i.toLong() + size > d.byteLength) throw jsRange("Out of bounds access")
    var v = 0L
    for (k in 0 until size) v = v or ((d.buffer[d.byteOffset + i + if (little) k else size - 1 - k].toLong() and 0xff) shl (8 * k))
    return v
}
private fun jsDvStore(d: DataView, at: Double, size: Int, little: Boolean, v: Long) {
    val i = jsIndex(at, "byteOffset cannot be negative")
    if (i.toLong() + size > d.byteLength) throw jsRange("Out of bounds access")
    for (k in 0 until size) d.buffer[d.byteOffset + i + if (little) k else size - 1 - k] = (v ushr (8 * k)).toByte()
}
/** `getInt8` … `getFloat64` (kind 0 Int8, 1 Uint8, 2 Int16, 3 Uint16, 4 Int32, 5 Uint32, 6 Float32, 7 Float64). */
fun jsDvGet(d: DataView, kind: Int, at: Double, little: Boolean): Double {
    val v = jsDvLoad(d, at, jsDvSizes[kind], little)
    return when (kind) {
        0 -> v.toByte().toDouble()
        2 -> v.toShort().toDouble()
        4 -> v.toInt().toDouble()
        6 -> java.lang.Float.intBitsToFloat(v.toInt()).toDouble()
        7 -> java.lang.Double.longBitsToDouble(v)
        else -> v.toDouble()
    }
}
/** `setInt8` … `setFloat64`: the number converted as a typed array of that kind converts it (NaN stored canonical). */
fun jsDvSet(d: DataView, kind: Int, at: Double, x: Double, little: Boolean) {
    val v = when (kind) {
        6 -> java.lang.Float.floatToIntBits(x.toFloat()).toLong() and 0xffffffffL
        7 -> java.lang.Double.doubleToLongBits(x)
        else -> jsI32(x).toLong() and 0xffffffffL
    }
    jsDvStore(d, at, jsDvSizes[kind], little, v)
}
fun jsDvGetBig(d: DataView, signed: Boolean, at: Double, little: Boolean): JsBigInt {
    val v = jsDvLoad(d, at, 8, little)
    val b = java.math.BigInteger.valueOf(v)
    return if (signed || v >= 0) b else b.add(java.math.BigInteger.ONE.shiftLeft(64))
}
fun jsDvSetBig(d: DataView, @Suppress("UNUSED_PARAMETER") signed: Boolean, at: Double, x: JsBigInt, little: Boolean) {
    jsDvStore(d, at, 8, little, x.toLong())
}

/** An error JavaScript would leave uncaught: stops the program, as Swift's `try!` / Rust's `unwrap` do (lib4). */
class JsFatalError(message: String) : Error(message)
inline fun <T> jsFatal(f: () -> T): T = try { f() } catch (e: JsNamedError) { throw JsFatalError("Uncaught ${jsErrorMessage(e)}") }
