package nuclo

import kotlinx.cinterop.*
import nuclo.host.Host
import nuclo.host.runHeadless
import platform.Foundation.NSStringFromClass
import platform.UIKit.*
import platform.posix.exit
import platform.posix.getenv

private var pendingEntry: (() -> Unit)? = null
private var keepBackend: UIKitBackend? = null

class NucloAppDelegate : UIResponder, UIApplicationDelegateProtocol {
    @OverrideInit constructor() : super()
    companion object : UIResponderMeta(), UIApplicationDelegateProtocolMeta
    private var _window: UIWindow? = null
    override fun window() = _window
    override fun setWindow(window: UIWindow?) { _window = window }
    override fun application(application: UIApplication, didFinishLaunchingWithOptions: Map<Any?, *>?): Boolean {
        val w = UIWindow(frame = UIScreen.mainScreen.bounds)
        val controller = NucloViewController()
        w.rootViewController = controller
        w.makeKeyAndVisible()
        _window = w
        val backend = UIKitBackend(controller)
        keepBackend = backend
        pendingEntry?.let { Host.start(backend, it) }
        return true
    }
}

internal actual fun platformRunApp(entry: () -> Unit) {
    if (getenv("NUCLO_HEADLESS")?.toKString() == "1") exit(runHeadless({ getenv(it)?.toKString() }, entry))
    pendingEntry = entry
    memScoped { autoreleasepool { UIApplicationMain(0, null, null, NSStringFromClass(NucloAppDelegate)) } }
}
