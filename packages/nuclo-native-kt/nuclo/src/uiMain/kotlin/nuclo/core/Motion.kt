package nuclo.core

import nuclo.*
import nuclo.host.Paint
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min

/** Transitions (opacity, transforms, background colour, radius, width and height) and keyframe animations, both driven by
 *  `backend.requestFrame`. In test mode neither runs: a style is painted at its end value at once. */
internal class MotionState {
    // a transition under way
    var from: Paint? = null
    var to: Paint? = null
    var start = 0.0
    var duration = 0.0
    var easing = Easing.Ease
    var widthFrom: Float? = null
    var widthTo: Float? = null
    var heightFrom: Float? = null
    var heightTo: Float? = null
    // a keyframes animation
    var animation: StyleAnimation? = null
    var animStart = 0.0
    var animDone = false
}

internal object Motion {
    private val moving = ArrayList<LiveNode>()
    private var frame = 0

    fun reset() { moving.clear(); frame = 0 }

    private fun state(n: LiveNode): MotionState = (n.motion as? MotionState) ?: MotionState().also { n.motion = it }

    /** A style change under a transition: from what the view shows now to the new look. */
    fun transition(n: LiveNode, from: Paint, to: Paint, c: Computed, before: Computed) {
        val m = state(n)
        val now = Runtime.backend.now()
        m.from = from; m.to = to
        m.start = now + (c.s.transitionDelay?.toDouble() ?: 0.0)
        m.duration = c.s.transitionDuration!!.toDouble()
        m.easing = c.s.transitionEasing ?: Easing.Ease
        fun size(a: Float?, b: Float?, shown: Float?) = if (a != null && b != null && a != b) (shown ?: a) to b else null
        size(before.width, c.width, n.shownWidth).let { m.widthFrom = it?.first; m.widthTo = it?.second }
        size(before.height, c.height, n.shownHeight).let { m.heightFrom = it?.first; m.heightTo = it?.second }
        n.shownWidth = m.widthFrom; n.shownHeight = m.heightFrom
        // what does not animate (text, border, clipping) changes now
        n.backend.paint(n.view, n.vk!!, at(m, 0.0))
        if (n !in moving) moving.add(n)
        schedule()
    }

    fun stop(n: LiveNode) {
        val m = n.motion as? MotionState ?: return
        m.from = null; m.to = null
        n.shownWidth = null; n.shownHeight = null
        if (m.animation == null) moving.remove(n)
    }

    /** A keyframes animation starts when the style gets it (or another one). */
    fun keyframes(n: LiveNode, c: Computed) {
        val anim = c.s.animation
        val m = n.motion as? MotionState
        if (anim == null && m?.animation == null) return
        val st = state(n)
        if (anim != st.animation) {
            st.animation = anim
            st.animDone = false
            st.animStart = Runtime.backend.now() + (anim?.delay?.toDouble() ?: 0.0)
            if (anim == null) { moving.remove(n); return }
            if (Runtime.testMode) { st.animDone = true; return }
            if (n !in moving) moving.add(n)
            schedule()
        }
    }

    private fun schedule() {
        if (frame != 0 || moving.isEmpty()) return
        frame = Runtime.backend.requestFrame { now -> frame = 0; tick(now) }
    }

    private fun tick(now: Double) {
        var layout = false
        for (n in ArrayList(moving)) {
            if (n.destroyed) { moving.remove(n); continue }
            val m = n.motion as MotionState
            var busy = false
            val to = m.to
            if (to != null) {
                val t = if (m.duration <= 0.0) 1.0 else ((now - m.start) / m.duration).coerceIn(0.0, 1.0)
                if (t < 1.0) busy = true
                if (m.widthTo != null || m.heightTo != null) {
                    val e = ease(m.easing, t.toFloat())
                    n.shownWidth = if (t >= 1.0) null else m.widthFrom?.let { it + (m.widthTo!! - it) * e }
                    n.shownHeight = if (t >= 1.0) null else m.heightFrom?.let { it + (m.heightTo!! - it) * e }
                    n.clearMemo(); Runtime.invalidateLayout(); layout = true
                }
                var paint = at(m, t)
                if (t >= 1.0) { m.from = null; m.to = null }
                n.backend.paint(n.view, n.vk!!, keyframePaint(n, m, paint, now).also { if (it !== paint) busy = true } )
            } else {
                val painted = keyframePaint(n, m, n.look ?: continue, now)
                if (painted !== n.look) { n.backend.paint(n.view, n.vk!!, painted); busy = true }
            }
            if (m.animation != null && !m.animDone) busy = true
            if (!busy) moving.remove(n)
        }
        if (layout) Runtime.settle()
        schedule()
    }

    private fun at(m: MotionState, t: Double): Paint {
        val from = m.from!!
        val to = m.to!!
        val e = ease(m.easing, t.toFloat())
        fun f(a: Float, b: Float) = a + (b - a) * e
        return Paint(
            if (from.background != null && to.background != null) mix(from.background, to.background, e) else to.background,
            to.borders, to.borderColors, f(from.radius, to.radius), to.clip, to.shadow, f(from.opacity, to.opacity), to.visible, to.pointer, to.fit,
            f(from.translateX, to.translateX), f(from.translateY, to.translateY), f(from.rotate, to.rotate), f(from.scale, to.scale), to.text, to.insets,
        )
    }

    private fun mix(a: UInt, b: UInt, e: Float): UInt {
        fun ch(shift: Int): UInt { val x = ((a shr shift) and 0xffu).toFloat(); val y = ((b shr shift) and 0xffu).toFloat(); return (x + (y - x) * e + 0.5f).toInt().coerceIn(0, 255).toUInt() }
        return (ch(24) shl 24) or (ch(16) shl 16) or (ch(8) shl 8) or ch(0)
    }

    /** `base` with the keyframes animation as it is at `now` painted over it (the same object when none runs). */
    private fun keyframePaint(n: LiveNode, m: MotionState, base: Paint, now: Double): Paint {
        val anim = m.animation ?: return base
        if (m.animDone) return base
        val elapsed = now - m.animStart
        if (elapsed < 0) return base
        val dur = anim.duration.toDouble()
        val cycle = if (dur > 0) elapsed / dur else 0.0
        if (dur <= 0.0 || anim.keyframes.stops.isEmpty() || (anim.iterations >= 0 && cycle >= anim.iterations)) { m.animDone = true; return n.look ?: base }
        var phase = cycle - floor(cycle)
        if (anim.alternate && floor(cycle).toInt() % 2 == 1) phase = 1 - phase
        val t = ease(anim.easing, phase.toFloat()).toDouble() * 100.0
        val stops = anim.keyframes.stops.sortedBy { it.first }
        var j = stops.indexOfFirst { it.first >= t }
        if (j < 0) j = stops.size - 1
        val i = if (j > 0 && stops[j].first > t) j - 1 else j
        val span = stops[j].first - stops[i].first
        val f = if (span > 0) ((t - stops[i].first) / span).coerceIn(0.0, 1.0).toFloat() else 0f
        val a = stops[i].second.normalized()
        val b = stops[j].second.normalized()
        fun mixN(x: Number?, y: Number?, unset: Float, cur: Float): Float {
            if (x == null && y == null) return cur
            val p = x?.toFloat() ?: unset
            val q = y?.toFloat() ?: unset
            return p + (q - p) * f
        }
        val bg = if (a.backgroundColor != null || b.backgroundColor != null)
            mix(parseColor(a.backgroundColor) ?: base.background ?: 0u, parseColor(b.backgroundColor) ?: base.background ?: 0u, f) else base.background
        return Paint(bg, base.borders, base.borderColors, base.radius, base.clip, base.shadow, mixN(a.opacity, b.opacity, 1f, base.opacity), base.visible, base.pointer, base.fit,
            mixN(a.translateX, b.translateX, 0f, base.translateX), mixN(a.translateY, b.translateY, 0f, base.translateY),
            mixN(a.rotate, b.rotate, 0f, base.rotate), mixN(a.scale, b.scale, 1f, base.scale), base.text, base.insets)
    }

    private fun bezier(x1: Float, y1: Float, x2: Float, y2: Float, x: Float): Float {
        if (x <= 0f) return 0f
        if (x >= 1f) return 1f
        fun cx(t: Float) = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t
        fun cy(t: Float) = 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t
        var lo = 0f; var hi = 1f; var t = x
        repeat(24) { val v = cx(t); if (abs(v - x) < 1e-4f) return cy(t); if (v < x) lo = t else hi = t; t = (lo + hi) / 2 }
        return cy(t)
    }

    fun ease(easing: Easing, t: Float): Float = when (easing) {
        Easing.Linear -> t
        Easing.Ease -> bezier(0.25f, 0.1f, 0.25f, 1f, t)
        Easing.EaseIn -> bezier(0.42f, 0f, 1f, 1f, t)
        Easing.EaseOut -> bezier(0f, 0f, 0.58f, 1f, t)
        Easing.EaseInOut -> bezier(0.42f, 0f, 0.58f, 1f, t)
        // one overshoot, then settled: the response of a platform spring
        Easing.Spring -> { val u = t - 1; u * u * (2.6f * u + 1.6f) + 1 }
    }
}
