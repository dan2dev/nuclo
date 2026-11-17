package nuclo

import nuclo.host.Host
import nuclo.host.ViewKind
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class M1Test {
    @Test fun rendersText() {
        val b = fresh()
        render { div(p("a"), p({ "b" })) }
        assertEquals(listOf("a", "b"), b.texts())
    }

    @Test fun boxTextBecomesSpan() {
        val b = fresh()
        render { div("a", p("b"), { "c" }) }
        assertEquals(listOf("a", "b", "c"), b.texts())
    }

    @Test fun rejectsNodeInText() {
        fresh()
        assertFailsWith<IllegalArgumentException> { render { p(div()) } }
    }

    @Test fun updateTouchesOnlyChanges() {
        val b = fresh()
        var one = 1
        var two = 2
        render { div(p({ one }), p({ two })) }
        val before = b.setTextCount
        one = 5
        update()
        assertEquals(before + 1, b.setTextCount)
        assertEquals(listOf("5", "2"), b.texts())
        update()
        assertEquals(before + 1, b.setTextCount)
    }

    @Test fun clickRunsHandler() {
        val b = fresh()
        var count = 0
        render { div(p({ "Count: $count" }), button("Increment", onClick { count++; update() })) }
        b.click(b.find("Increment"))
        b.click(b.find("Increment"))
        assertEquals("Count: 2", b.texts()[0])
    }

    @Test fun columnLayout() {
        val b = fresh()
        render { div(style(Style(padding = 24, gap = 16)), p("ab"), p("cd")) }
        b.layout()
        val a = b.frame(b.find("ab"))
        val c = b.frame(b.find("cd"))
        assertEquals(listOf(24, 24, 372, 18), listOf(a.x, a.y, a.w, a.h))
        assertEquals(listOf(24, 58, 372, 18), listOf(c.x, c.y, c.w, c.h))
    }

    @Test fun rowLayout() {
        val b = fresh()
        render { div(style(Style(row = true, gap = 8, padding = 10)), p("a"), div(style(Style(flex = 1)), p("mid")), p("zz")) }
        b.layout()
        val root = b.roots()[0]
        val kids = b.childrenOf(root)
        val frames = kids.map { b.frame(it) }
        // inner width 400: two fixed widths (7.5 -> 8 and 15), two gaps of 8, the middle takes the rest
        assertEquals(400, frames.sumOf { it.w } + 16)
        assertEquals(10, frames[0].x)
        assertEquals(frames[0].x + frames[0].w + 8, frames[1].x)
        assertEquals(frames[1].x + frames[1].w + 8, frames[2].x)
    }

    @Test fun alignAndJustify() {
        val b = fresh()
        render { div(div(style(Style(width = 200, height = 100, center = true)), div(style(Style(width = 40, height = 20))))) }
        b.layout()
        val box = b.childrenOf(b.roots()[0])[0]
        assertEquals(200, b.frame(box).w)
        val inner = b.frame(b.childrenOf(box)[0])
        assertEquals(80, inner.x)
        assertEquals(40, inner.y)
    }

    @Test fun paintResolves() {
        val b = fresh()
        render { p(style(Style(bg = "#ff0000", borderWidth = 2, borderColor = "#00ff00", rounded = 6, color = "#0000ff", fontSize = 20)), "x") }
        val paint = b.paintOf(b.roots()[0])
        assertEquals(0xff0000ffu, paint.background)
        assertEquals(2f, paint.borders[0])
        assertEquals(0x00ff00ff.toInt(), paint.borderColors[1])
        assertEquals(6f, paint.radius)
        assertEquals(0x0000ffffu, paint.text.color)
        assertEquals(20f, paint.text.fontSize)
        assertEquals(24f, paint.text.lineHeight)
        assertEquals(2f, paint.insets[3])
    }

    @Test fun numbersPrintLikeJs() {
        val b = fresh()
        render { div(p(3), p(1.5), p(2.0)) }
        assertEquals(listOf("3", "1.5", "2"), b.texts())
    }

    @Test fun globalAndClassStyles() {
        val b = fresh()
        globalStyle("p", Style(color = "#111111"))
        val c = css(Style(color = "#222222"))
        render { div(p("a"), p(c, "b"), p(c, style(Style(color = "#333333")), "c")) }
        val ps = b.roots()[0].let { b.childrenOf(it) }.map { b.paintOf(it).text.color }
        assertEquals(listOf(0x111111ffu, 0x222222ffu, 0x333333ffu), ps)
        assertTrue(b.kindOf(b.roots()[0]) == ViewKind.Box)
        Host.layoutRoot(b.roots()[0], 420f, 780f)
    }
}
