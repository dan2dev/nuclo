package nuclo

import kotlinx.cinterop.toKString
import nuclo.host.runHeadless
import platform.posix.exit
import platform.posix.getenv

internal actual fun platformRunApp(entry: () -> Unit) {
    if (getenv("NUCLO_HEADLESS")?.toKString() == "1") exit(runHeadless({ getenv(it)?.toKString() }, entry))
    runWin32(entry)
}
