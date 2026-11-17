package nuclo

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class CommonTest {
    @Test fun numbersPrintLikeJs() {
        assertEquals("3", jsNum(3))
        assertEquals("1.5", jsNum(1.5))
        assertEquals("2", jsNum(2.0))
        assertEquals("0.0001", jsNum(0.0001))
        assertEquals("12345678.5", jsNum(12345678.5))
        assertEquals("-0.5", jsNum(-0.5))
        assertEquals("NaN", jsNum(Double.NaN))
    }

    @Test fun styleMerges() {
        val a = Style(padding = 8, color = "#000", pressed = Style(bg = "#111"), media = listOf(minWidth(100, Style(gap = 1))))
        val b = Style(paddingTop = 2, color = "#fff", pressed = Style(color = "#222"), media = listOf(maxWidth(50, Style(gap = 2))))
        val m = a.merged(b)
        assertEquals(8.0, m.padding?.toDouble())
        assertEquals(2.0, m.paddingTop?.toDouble())
        assertEquals("#fff", m.color)
        assertEquals("#111", m.pressed?.backgroundColor)
        assertEquals("#222", m.pressed?.color)
        assertEquals(2, m.media?.size)
        // a shorthand set later resets the sides set before it
        assertEquals(null, Style(paddingTop = 2).merged(Style(padding = 4)).paddingTop)
        // width and widthPct exclude each other
        assertEquals(null, Style(width = 10).merged(Style(widthPct = 50)).width)
        assertEquals(Style(padding = 8), Style(p = 8.0))
    }

    @Test fun shortKeysNormalize() {
        val n = Style(px = 4, py = 2, bg = "#abc", rounded = 6, row = true, center = true, size = 10, truncate = true, paddingLeft = 9).normalized()
        assertEquals(9, n.paddingLeft?.toInt())
        assertEquals(4, n.paddingRight?.toInt())
        assertEquals(2, n.paddingTop?.toInt())
        assertEquals("#abc", n.backgroundColor)
        assertEquals(6, n.borderRadius?.toInt())
        assertEquals(FlexDirection.Row, n.flexDirection)
        assertEquals(Align.Center, n.alignItems)
        assertEquals(Justify.Center, n.justifyContent)
        assertEquals(10, n.width?.toInt())
        assertEquals(10, n.height?.toInt())
        assertEquals(1, n.numberOfLines)
    }

    @Test fun jsonParses() {
        val v = parseJson("""{"a":[1,2.5,"x\nA",true,false,null],"b":{"c":-3e2}}""") as Map<*, *>
        val a = v["a"] as List<*>
        assertEquals(listOf(1.0, 2.5, "x\nA", true, false, null), a)
        assertEquals(-300.0, (v["b"] as Map<*, *>)["c"])
        assertEquals(null, parseJson("null"))
        assertFailsWith<IllegalArgumentException> { parseJson("{") }
        assertFailsWith<IllegalArgumentException> { parseJson("[1,]") }
        assertFailsWith<IllegalArgumentException> { parseJson("1 2") }
    }

    @Test fun rejectsNodeInText() {
        val e = assertFailsWith<IllegalArgumentException> { p(div()) }
        assertEquals("nuclo: p takes text, not elements", e.message)
        assertFailsWith<IllegalArgumentException> { button(span("x")) }
        assertFailsWith<IllegalArgumentException> { div(object {}) }
        val d = div("a", p("b"), { "c" })
        assertEquals(listOf("span", "p", "span"), d.children.map { (it as Node).tag })
        assertTrue(textOf(null).isEmpty())
        assertFailsWith<IllegalArgumentException> { textOf(Unit) }
    }
}
