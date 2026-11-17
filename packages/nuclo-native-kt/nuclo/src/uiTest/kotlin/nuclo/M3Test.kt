package nuclo

import nuclo.host.Host
import nuclo.host.PointerPhase
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue

class M3Test {
    private fun colorOf(b: nuclo.host.HeadlessBackend, view: Int) = b.paintOf(view).text.color

    @Test fun classPrecedence() {
        val b = fresh()
        globalStyle("button", Style(color = "#111111"))
        val c = css(Style(color = "#222222"))
        render { div(button("a"), button(c, "b"), button(c, style(Style(color = "#333333")), "c"), button(c, className { css(Style(color = "#444444")) }, "d")) }
        val colors = b.childrenOf(b.roots()[0]).map { colorOf(b, it) }
        assertEquals(listOf(0x111111ffu, 0x222222ffu, 0x333333ffu, 0x444444ffu), colors)
        // without a global style the tag's own default shows
        val b2 = fresh()
        render { button("x") }
        assertEquals(0x2563ebffu, colorOf(b2, b2.roots()[0]))
    }

    @Test fun variantsSelect() {
        val tone = variants(
            base = Style(padding = 1),
            variants = mapOf("tone" to mapOf("a" to Style(color = "#aaaaaa"), "b" to Style(color = "#bbbbbb")), "big" to mapOf("true" to Style(fontSize = 30), "false" to Style(fontSize = 10))),
            defaults = mapOf("tone" to "a"),
            compounds = listOf(Compound(mapOf("tone" to "b", "big" to "true"), Style(backgroundColor = "#cccccc"))),
        )
        assertEquals(Style(padding = 1, color = "#aaaaaa", fontSize = 10), tone().style)
        assertEquals("#bbbbbb", tone("tone" to "b").style.color)
        assertEquals("#cccccc", tone("tone" to "b", "big" to "true").style.backgroundColor)
        assertEquals(tone("tone" to "b"), tone("tone" to "b"))
        assertFailsWith<IllegalArgumentException> { tone("tone" to "zzz") }
        assertFailsWith<IllegalArgumentException> { tone("nope" to "a") }
    }

    @Test fun stateStyles() {
        val b = fresh()
        render { div(button("go", style(Style(backgroundColor = "#ffffff", pressed = Style(backgroundColor = "#000000"))), onClick {}),
            button("off", disabled(true), style(Style(backgroundColor = "#ffffff", disabled = Style(backgroundColor = "#eeeeee"))))) }
        val go = b.find("go")
        assertEquals(0xffffffffu, b.paintOf(go).background)
        Host.pointer(go, PointerPhase.Down, PointerEvent(0.0, 0.0, 0.0, 0.0, 0))
        assertEquals(0x000000ffu, b.paintOf(go).background)
        Host.pointer(go, PointerPhase.Up, PointerEvent(0.0, 0.0, 0.0, 0.0, 0))
        assertEquals(0xffffffffu, b.paintOf(go).background)
        assertEquals(0xeeeeeeffu, b.paintOf(b.find("off")).background)
        assertTrue(b.paintOf(b.find("off")).opacity < 1f)
    }

    @Test fun structuralStyles() {
        val b = fresh()
        val rows = mutableListOf("a", "b", "c")
        val row = Style(color = "#000000", first = Style(color = "#ff0000"), last = Style(color = "#0000ff"), odd = Style(backgroundColor = "#eeeeee"))
        render { div(list({ rows }) { r, _ -> p(row.let { st -> style(st) }, r) }) }
        fun colors() = b.childrenOf(b.roots()[0]).map { colorOf(b, it) }
        assertEquals(listOf(0xff0000ffu, 0x000000ffu, 0x0000ffffu), colors())
        rows.removeAt(2)
        update()
        assertEquals(listOf(0xff0000ffu, 0x0000ffffu), colors())
        assertEquals(0xeeeeeeffu, b.paintOf(b.childrenOf(b.roots()[0])[0]).background)
    }

    @Test fun mediaRules() {
        val b = fresh(420, 780)
        render { div(p("x", style(Style(color = "#000000", media = listOf(minWidth(768, Style(color = "#ff0000"))))))) }
        b.layout()
        val v = b.childrenOf(b.roots()[0])[0]
        assertEquals(0x000000ffu, colorOf(b, v))
        b.resize(800, 780)
        b.layout()
        b.runFor(50.0)
        assertEquals(0xff0000ffu, colorOf(b, v))
    }

    @Test fun inheritance() {
        val b = fresh()
        render { div(style(Style(color = "#123456", fontSize = 20)), div(p("deep"))) }
        val p = b.find("deep")
        assertEquals(0x123456ffu, colorOf(b, p))
        assertEquals(20f, b.paintOf(p).text.fontSize)
        assertEquals(24f, b.paintOf(p).text.lineHeight)
    }

    @Test fun wrapAbsoluteScroll() {
        val b = fresh()
        render {
            div(
                div(style(Style(row = true, flexWrap = FlexWrap.Wrap, width = 100)), *Array(4) { div(style(Style(width = 40, height = 10))) }),
                div(style(Style(width = 200, height = 100)), div(style(Style(position = Position.Absolute, top = 5, right = 7, width = 20, height = 20)))),
                div(style(Style(height = 50, overflow = Overflow.Scroll)), *Array(5) { div(style(Style(height = 20))) }),
            )
        }
        b.layout()
        val top = b.childrenOf(b.roots()[0])
        val wrapped = b.childrenOf(top[0]).map { b.frame(it) }
        assertEquals(listOf(0, 40, 0, 40), wrapped.map { it.x })
        assertEquals(listOf(0, 0, 10, 10), wrapped.map { it.y })
        val abs = b.frame(b.childrenOf(top[1])[0])
        assertEquals(173, abs.x)
        assertEquals(5, abs.y)
        assertEquals(true, b.isScrollable(top[2]) == false)
        assertEquals(100, b.contentSizeOf(top[2])?.second)
    }
}
