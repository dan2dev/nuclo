package nuclo

import kotlinx.cinterop.*
import nuclo.host.Host
import nuclo.host.runHeadless
import platform.AppKit.*
import platform.Foundation.*
import platform.darwin.NSObject
import platform.posix.exit
import platform.posix.getenv

private class WindowDelegate(val backend: () -> AppKitBackend?) : NSObject(), NSWindowDelegateProtocol {
    override fun windowDidResize(notification: NSNotification) { backend()?.windowSizeChanged() }
    override fun windowShouldClose(sender: NSWindow): Boolean { NSApplication.sharedApplication.terminate(null); return true }
}

internal actual fun platformRunApp(entry: () -> Unit) {
    if (getenv("NUCLO_HEADLESS")?.toKString() == "1") exit(runHeadless({ getenv(it)?.toKString() }, entry))
    val app = NSApplication.sharedApplication
    app.setActivationPolicy(NSApplicationActivationPolicy.NSApplicationActivationPolicyRegular)
    val size = appleEnv("NUCLO_SIZE")?.split('x')
    val w = size?.getOrNull(0)?.toDoubleOrNull() ?: 420.0
    val h = size?.getOrNull(1)?.toDoubleOrNull() ?: 780.0
    val window = NSWindow(NSMakeRect(0.0, 0.0, w, h),
        NSWindowStyleMaskTitled or NSWindowStyleMaskClosable or NSWindowStyleMaskResizable, NSBackingStoreBuffered, false)
    window.title = "nuclo"
    // screens are white with black text: a dark system appearance would draw the controls for a dark background
    window.appearance = NSAppearance.appearanceNamed(NSAppearanceNameAqua)
    val backend = AppKitBackend(window)
    val delegate = WindowDelegate { backend }
    window.delegate = delegate
    window.setContentSize(NSMakeSize(w, h))
    window.center()
    Host.start(backend, entry)
    window.makeKeyAndOrderFront(null)
    app.activateIgnoringOtherApps(true)
    app.run()
}
