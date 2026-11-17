package nuclo

import kotlin.test.Test
import kotlin.test.assertEquals

class M7Test {
    @Test fun nativeNodeIsCreatedOnceAndUpdatedOnEveryUpdate() {
        val b = fresh()
        var created = 0
        var updated = 0
        var mounted: Any? = null
        render { div(nativeDescriptor({ created++; "the platform view" }, { updated++ }, arrayOf(onMount { mounted = it.handle }))) }
        assertEquals(1, created)
        assertEquals(1, updated)
        update()
        update()
        assertEquals(1, created)
        assertEquals(3, updated)
        assertEquals("the platform view", mounted)
        b.layout()
        val f = b.frame(b.childrenOf(b.roots()[0])[0])
        assertEquals(listOf(100, 40), listOf(f.w, f.h).let { listOf(minOf(it[0], 100), it[1]) })
    }
}
