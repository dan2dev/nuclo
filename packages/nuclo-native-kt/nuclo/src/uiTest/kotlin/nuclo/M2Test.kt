package nuclo

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class M2Test {
    class Item(val name: String)

    @Test fun listReusesRows() {
        val b = fresh()
        val items = mutableListOf(Item("a"), Item("b"))
        render { div(list({ items }) { it, _ -> p(it.name) }) }
        val first = b.find("a")
        val created = b.createCount
        items.add(Item("c"))
        update()
        assertEquals(first, b.find("a"))
        assertEquals(created + 1, b.createCount)
        assertEquals(listOf("a", "b", "c"), b.texts())
    }

    @Test fun listReorders() {
        val b = fresh()
        val x = Item("x"); val y = Item("y")
        val items = mutableListOf(x, y)
        render { div(list({ items }) { it, _ -> p(it.name) }) }
        b.layout()
        val vx = b.find("x"); val vy = b.find("y")
        val fx = b.frame(vx).y; val fy = b.frame(vy).y
        items.reverse()
        update()
        b.layout()
        assertEquals(vx, b.find("x")); assertEquals(vy, b.find("y"))
        assertEquals(fy, b.frame(vx).y); assertEquals(fx, b.frame(vy).y)
        assertEquals(listOf("y", "x"), b.texts())
    }

    @Test fun listKeysStringsByValue() {
        val b = fresh()
        var n = 0
        render { div(list({ listOf("a", "b").map { "$it" + "" } }) { s, _ -> n++; p(s) }) }
        val created = b.createCount
        update()
        assertEquals(created, b.createCount)
        assertEquals(2, n)
    }

    @Test fun whenSwitchesBranch() {
        val b = fresh()
        var open = true
        render { div(when_({ open }, p("yes")).else_(p("no"))) }
        assertEquals(listOf("yes"), b.texts())
        val old = b.find("yes")
        open = false
        update()
        assertEquals(listOf("no"), b.texts())
        assertFalse(b.exists(old))
    }

    @Test fun whenBranchIsLazy() {
        fresh()
        var mounted = 0
        render { div(when_({ false }, div(onMount { mounted++ }))) }
        update()
        assertEquals(0, mounted)
    }

    @Test fun regionShowsInto() {
        val b = fresh()
        var show = true
        render { div(div(region("r", false, p("empty"))), when_({ show }, div(into("r", p("x"))))) }
        assertEquals(listOf("x"), b.texts())
        show = false
        update()
        assertEquals(listOf("empty"), b.texts())
    }

    @Test fun scopedUpdate() {
        val b = fresh()
        var a = 1; var c = 1
        render { div(div(scope("a"), p({ a })), p({ c })) }
        a = 2; c = 2
        update("a")
        assertEquals(listOf("2", "1"), b.texts())
        update()
        assertEquals(listOf("2", "2"), b.texts())
    }

    @Test fun inputValueAndEvents() {
        val b = fresh()
        var draft = ""
        render { div(input(placeholder("p"), value { draft }, onInput { draft = it.target.value })) }
        val field = b.roots()[0].let { b.childrenOf(it)[0] }
        b.input(field, "hi")
        assertEquals("hi", draft)
        val before = b.setValueCount
        update()
        assertEquals(before, b.setValueCount)
        draft = "reset"
        update()
        assertEquals(before + 1, b.setValueCount)
        assertEquals("reset", b.input2(field))
    }

    @Test fun lifecycle() {
        fresh()
        var mounts = 0; var cleaned = 0; var destroyed = 0
        var open = true
        render { div(when_({ open }, div(onMountCleanup { mounts++; { cleaned++ } }, onDestroy { destroyed++ }))) }
        assertEquals(1, mounts)
        update()
        assertEquals(1, mounts)
        open = false
        update()
        assertEquals(1, cleaned)
        assertEquals(1, destroyed)
        assertTrue(true)
    }
}
