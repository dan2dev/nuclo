package nuclo

import kotlin.test.Test
import kotlin.test.assertEquals

class M5Test {
    @Test fun timersAndLaunch() {
        val b = fresh()
        val log = ArrayList<String>()
        setTimeout(10) { log.add("t10") }
        val i = setInterval(20) { log.add("i") }
        launch {
            delay(50)
            log.add("L50")
            log.add(if (runCatching { fetch("http://example.invalid/") }.isFailure) "fail" else "ok")
        }
        b.runFor(70.0)
        assertEquals(listOf("t10", "i", "i", "L50", "fail", "i"), log)
        clearInterval(i)
        b.runFor(200.0)
        assertEquals(6, log.size)
    }

    @Test fun imageDownloadFailureClearsTheImage() {
        val b = fresh()
        render { div(img(src("http://example.invalid/a.png"))) }
        b.runFor(50.0)
        assertEquals(0, b.images.values.single())
    }
}
