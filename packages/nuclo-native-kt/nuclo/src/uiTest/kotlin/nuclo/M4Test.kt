package nuclo

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class M4Test {
    @Test fun routerStacks() {
        val b = fresh()
        val router = createRouter(
            linkedMapOf(
                "/" to Route(title = "Home", view = { div(p("home")) }),
                "/a/:id" to Route(titleFor = { "A ${it["id"]}" }, view = { params -> div(p("a ${params["id"]}")) }),
                "/b" to Route(title = "B", view = { div(p("b")) }),
                "/m" to Route(presentation = Presentation.Modal, header = false, view = { div(p("modal")) }),
            ),
            listOf(Tab("/", "Home", "home"), Tab("/b", "B", "list")),
        )
        render(router.outlet)
        b.layout()
        assertEquals("/", router.path)
        assertFalse(router.canGoBack)
        assertEquals(listOf("home"), b.texts())

        router.go("/a/7")
        b.layout()
        assertEquals("/a/7", router.path)
        assertTrue(router.canGoBack)
        assertEquals(listOf("a 7"), b.texts())

        router.back()
        b.layout()
        assertEquals("/", router.path)
        assertEquals(listOf("home"), b.texts())

        router.go("/a/1")
        router.replace("/a/2")
        b.layout()
        assertEquals("/a/2", router.path)
        assertEquals(listOf("a 2"), b.texts())

        router.reset("/b")
        b.layout()
        assertEquals("/b", router.path)
        assertFalse(router.canGoBack)
        assertEquals(listOf("b"), b.texts())

        router.go("/m")
        b.layout()
        // the modal over the screen under it
        assertEquals(listOf("b", "modal"), b.texts())

        b.runFor(1000.0)
        assertEquals(
            listOf("create 2 0", "push 0 Home", "push 1 B", "push 0 A 7", "pop 0", "push 0 A 1", "pop 0", "push 0 A 2", "select 1", "replace 1 B", "push 1 "),
            b.navLog,
        )
    }

    @Test fun routeEndReachedFiresOncePerContentHeight() {
        val b = fresh()
        var ends = 0
        val router = createRouter(linkedMapOf("/" to Route(onEndReached = { ends++ }, view = { div(p("short")) })))
        render(router.outlet)
        b.layout()
        b.runFor(50.0)
        val root = b.roots()[0]
        nuclo.host.Host.screenScrolled(root, 0f, 700f)
        b.runFor(50.0)
        assertEquals(1, ends)
        nuclo.host.Host.screenScrolled(root, 0f, 700f)
        b.runFor(50.0)
        assertEquals(1, ends)
    }
}
