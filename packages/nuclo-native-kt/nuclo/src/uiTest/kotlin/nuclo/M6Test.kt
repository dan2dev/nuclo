package nuclo

import nuclo.core.Runtime
import nuclo.host.Host
import nuclo.host.PointerPhase
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class M6Test {
    @Test fun transitionEndsAtTarget() {
        val b = fresh()
        Runtime.testMode = false   // a headless backend is always in test mode: switch it off for this one
        var on = false
        render { div(p("x", style { Style(opacity = if (on) 1.0 else 0.2, transitionDuration = 100) })) }
        val v = b.childrenOf(b.roots()[0])[0]
        assertEquals(0.2f, b.paintOf(v).opacity)
        on = true
        update()
        b.runFor(40.0)
        val mid = b.paintOf(v).opacity
        assertTrue(mid > 0.2f && mid < 1f, "opacity in between: $mid")
        b.runFor(300.0)
        assertEquals(1f, b.paintOf(v).opacity)
    }

    @Test fun gestureHandlersGetEvents() {
        val b = fresh()
        val log = ArrayList<String>()
        render {
            div(
                onPan { log.add("pan ${it.state}") }, onPinch { log.add("pinch ${it.state}") },
                onPointerDown { log.add("down") }, onPointerMove { log.add("move") }, onPointerUp { log.add("up") },
                onLongPress { log.add("long") }, onDoubleClick { log.add("double") }, onKeyDown { log.add("key ${it.key}") },
                onScroll { log.add("scroll ${it.scrollTop}") },
            )
        }
        val v = b.roots()[0]
        val e = PointerEvent(1.0, 2.0, 3.0, 4.0, 0)
        Host.pointer(v, PointerPhase.Down, e)
        Host.pointer(v, PointerPhase.Move, e)
        Host.pointer(v, PointerPhase.Up, e)
        Host.pointer(v, PointerPhase.LongPress, e)
        Host.pointer(v, PointerPhase.DoubleClick, e)
        Host.pan(v, PanEvent("start", 0.0, 0.0, 0.0, 0.0, 0.0, 0.0))
        Host.pinch(v, PinchEvent("end", 1.0, 0.0, 0.0))
        Host.key(v, "Enter")
        Host.scrolled(v, ScrollEvent(5.0, 0.0, 10.0, 10.0, 5.0, 5.0))
        assertEquals(listOf("down", "move", "up", "long", "double", "pan start", "pinch end", "key Enter", "scroll 5.0"), log)
    }
}
