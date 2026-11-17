package nuclo.core

import nuclo.*
import kotlin.math.max
import kotlin.math.min

/** The flex layout every runtime implements the same way (a port of flex.rs, with the same arithmetic in the same order).
 *  Sizes are border boxes in px; a child's margins are added around its box. `flex` shares a line's free space by weight
 *  (a column shares only a definite height); `flexWrap` breaks a row into lines; nothing shrinks below its measured size. */
internal object Flex {
    /** "No width limit": a width at or above it is unbounded. */
    const val UNBOUNDED = Float.MAX_VALUE / 8

    /** Lays out `node`'s views in a box `width` wide (and `height` tall when definite); fills `frames` when given.
     *  The size returned is the box's; with `fit`, its width is what the content needs. */
    fun layout(node: LiveNode, width: Float, height: Float?, frames: MutableList<Pair<LiveNode, FloatArray>>?, fit: Boolean): FloatArray {
        val s = node.computed
        val (pt, pr, pb, pl) = s.insets.toList()
        val innerW = if (width >= UNBOUNDED) width else max(0f, width - pl - pr)
        val innerH = height?.let { max(0f, it - pt - pb) }
        val items = node.items
        val flow = items.filter { it.inFlow }
        val out = Array(flow.size) { FloatArray(4) }
        val content = if (!s.column) row(s, flow, innerW, innerH, pt, pl, out) else column(s, flow, innerW, innerH, pt, pl, out, fit)
        val natural = floatArrayOf(content[0] + pl + pr, content[1] + pt + pb)
        val w = if (width < UNBOUNDED) min(width, natural[0]) else natural[0]
        val h = height ?: natural[1]

        if (frames != null) {
            flow.forEachIndexed { i, child -> frames.add(child to out[i]) }
            // An absolute child is placed in the padding box, as in CSS.
            val (bt, br, bb, bl) = s.borders.toList()
            val boxW = (if (width < UNBOUNDED) width else natural[0]) - bl - br
            for (child in items) {
                if (child.computed.absolute && !child.computed.hidden) {
                    val f = absoluteFrame(child, boxW, h - bt - bb)
                    f[0] += bl
                    f[1] += bt
                    frames.add(child to f)
                }
            }
        }
        return floatArrayOf(w, h)
    }

    private fun crossAlign(s: Computed, child: Computed) = child.s.alignSelf ?: s.s.alignItems ?: Align.Stretch

    private fun clampHeight(h: Float, s: Computed): Float {
        var v = h
        s.maxHeight?.let { v = min(v, it) }
        s.minHeight?.let { v = max(v, it) }
        return v
    }

    /** A row: one line, or several when it wraps. Returns the content size. */
    private fun row(s: Computed, flow: List<LiveNode>, innerW: Float, innerH: Float?, pt: Float, pl: Float, out: Array<FloatArray>): FloatArray {
        val n = flow.size
        val bounded = innerW < UNBOUNDED
        val gap = s.gap
        val margins = Array(n) { flow[it].computed.margins }
        val flexes = FloatArray(n) { if (bounded) flow[it].computed.flex else 0f }
        val sizes = Array(n) { i ->
            if (flexes[i] > 0) floatArrayOf(0f, 0f) else flow[i].measure(if (bounded) max(0f, innerW - margins[i][1] - margins[i][3]) else innerW, false)
        }
        // Lines: an item that does not fit after the ones before it starts the next line.
        val wrap = s.s.flexWrap == FlexWrap.Wrap && bounded
        val starts = ArrayList<Int>()
        if (n > 0) starts.add(0)
        if (wrap) {
            var used = 0f
            for (i in 0 until n) {
                val w = sizes[i][0] + margins[i][1] + margins[i][3]
                if (i > starts.last() && used + gap + w > innerW + 0.5f) {
                    starts.add(i)
                    used = w
                } else {
                    used += (if (i > starts.last()) gap else 0f) + w
                }
            }
        }
        val justify = s.s.justifyContent ?: Justify.FlexStart
        var y = pt
        var contentW = 0f
        for (li in starts.indices) {
            val from = starts[li]
            val to = if (li + 1 < starts.size) starts[li + 1] else n
            val count = to - from
            var fixed = gap * (count - 1)
            var totalFlex = 0f
            for (i in from until to) {
                fixed += sizes[i][0] + margins[i][1] + margins[i][3]
                totalFlex += flexes[i]
            }
            val space = if (bounded) max(0f, innerW - fixed) else 0f
            if (totalFlex > 0) {
                for (i in from until to) if (flexes[i] > 0) sizes[i] = flow[i].measure(space * flexes[i] / totalFlex, true)
            }
            var lineH = 0f
            for (i in from until to) lineH = max(lineH, sizes[i][1] + margins[i][0] + margins[i][2])
            if (!wrap && innerH != null) lineH = innerH
            val free = if (totalFlex > 0) 0f else space
            var x = pl
            var spacing = gap
            when (justify) {
                Justify.Center -> x += free / 2
                Justify.FlexEnd -> x += free
                Justify.SpaceBetween -> if (count > 1) spacing += free / (count - 1)
                Justify.SpaceAround -> { spacing += free / count; x += free / count / 2 }
                Justify.SpaceEvenly -> { spacing += free / (count + 1); x += free / (count + 1) }
                Justify.FlexStart -> {}
            }
            for (i in from until to) {
                val m = margins[i]
                val cs = flow[i].computed
                val w = sizes[i][0]
                var h = sizes[i][1]
                var cy = y + m[0]
                when (crossAlign(s, cs)) {
                    Align.Stretch -> if (cs.height == null && cs.aspectRatio == null) h = clampHeight(lineH - m[0] - m[2], cs)
                    Align.Center -> cy += (lineH - h - m[0] - m[2]) / 2
                    Align.FlexEnd -> cy += lineH - h - m[0] - m[2]
                    Align.FlexStart -> {}
                }
                out[i] = floatArrayOf(x + m[3], cy, w, h)
                x += w + m[1] + m[3] + spacing
            }
            var lineW = gap * (count - 1)
            for (i in from until to) lineW += sizes[i][0] + margins[i][1] + margins[i][3]
            contentW = max(contentW, if (totalFlex > 0) innerW else lineW)
            y += lineH + (if (li + 1 < starts.size) gap else 0f)
        }
        return floatArrayOf(contentW, y - pt)
    }

    /** A column. Returns the content size. */
    private fun column(s: Computed, flow: List<LiveNode>, innerW: Float, innerH: Float?, pt: Float, pl: Float, out: Array<FloatArray>, fit: Boolean): FloatArray {
        val n = flow.size
        val bounded = innerW < UNBOUNDED
        val gap = s.gap
        val gaps = gap * max(0, n - 1)
        val margins = Array(n) { flow[it].computed.margins }
        val flexes = FloatArray(n) { flow[it].computed.flex }
        // What each child needs before stretching: the column's own width when it is asked to fit.
        val needs = FloatArray(n)
        val sizes = Array(n) { i ->
            val cs = flow[i].computed
            val available = if (bounded) max(0f, innerW - margins[i][1] - margins[i][3]) else innerW
            // A stretched child is as wide as the column; one with its own width or alignment keeps its measure.
            val stretched = bounded && crossAlign(s, cs) == Align.Stretch && cs.width == null && cs.widthPct == null && !(cs.aspectRatio != null && cs.height != null)
            val size = flow[i].measure(available, stretched)
            needs[i] = if (stretched && fit) flow[i].measure(available, false)[0] else size[0]
            size
        }
        var totalFlex = 0f
        var content = gaps
        for (i in 0 until n) {
            totalFlex += flexes[i]
            content += sizes[i][1] + margins[i][0] + margins[i][2]
        }
        var free = 0f
        if (innerH != null) {
            if (totalFlex > 0) {
                var basis = gaps
                for (i in 0 until n) basis += margins[i][0] + margins[i][2] + (if (flexes[i] > 0) 0f else sizes[i][1])
                val space = max(0f, innerH - basis)
                for (i in 0 until n) if (flexes[i] > 0) sizes[i] = floatArrayOf(sizes[i][0], clampHeight(space * flexes[i] / totalFlex, flow[i].computed))
            } else {
                free = max(0f, innerH - content)
            }
        }
        var y = pt
        var spacing = gap
        when (s.s.justifyContent ?: Justify.FlexStart) {
            Justify.Center -> y += free / 2
            Justify.FlexEnd -> y += free
            Justify.SpaceBetween -> if (n > 1) spacing += free / (n - 1)
            Justify.SpaceAround -> if (n > 0) { spacing += free / n; y += free / n / 2 }
            Justify.SpaceEvenly -> { spacing += free / (n + 1); y += free / (n + 1) }
            Justify.FlexStart -> {}
        }
        var contentW = 0f
        for (i in 0 until n) {
            val m = margins[i]
            val w = sizes[i][0]
            val h = sizes[i][1]
            var x = pl + m[3]
            if (bounded) {
                when (crossAlign(s, flow[i].computed)) {
                    Align.Center -> x += (innerW - w - m[1] - m[3]) / 2
                    Align.FlexEnd -> x += innerW - w - m[1] - m[3]
                    else -> {}
                }
            }
            y += m[0]
            out[i] = floatArrayOf(x, y, w, h)
            y += h + m[2] + spacing
            contentW = max(contentW, (if (fit) needs[i] else w) + m[1] + m[3])
        }
        return floatArrayOf(contentW, innerH ?: content)
    }

    private fun absoluteFrame(child: LiveNode, bw: Float, bh: Float): FloatArray {
        val s = child.computed
        val l = s.s.left?.toFloat()
        val r = s.s.right?.toFloat()
        val t = s.s.top?.toFloat()
        val b = s.s.bottom?.toFloat()
        val w = s.width ?: s.widthPct?.let { bw * it / 100f } ?: if (l != null && r != null) bw - l - r else child.measure(bw, false)[0]
        val h = s.height ?: if (t != null && b != null) bh - t - b else child.measure(w, true)[1]
        val x = l ?: if (r != null) bw - r - w else 0f
        val y = t ?: if (b != null) bh - b - h else 0f
        return floatArrayOf(x, y, w, h)
    }
}
