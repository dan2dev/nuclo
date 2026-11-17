package nuclo

import nuclo.core.*

internal actual fun engineRender(view: () -> Node) {
    val node = mount(view())
    val overlay = Runtime.hasMain
    Runtime.hasMain = true
    Runtime.addRoot(node, overlay, true)
    Runtime.mountPending = true
    if (overlay) Runtime.backend.showOverlay(node.view) else Runtime.backend.showScreen(node.view)
    Runtime.settle()
}

internal actual fun engineRenderOutlet(outlet: Outlet) { (outlet.router as nuclo.core.RouterImpl).show() }
internal actual fun engineUpdate(ids: Array<out String>) = Runtime.update(ids)
internal actual fun engineForceUpdate() = Runtime.forceUpdate()
internal actual fun engineGlobalStyle(selector: String, style: Style) = Globals.set(selector, style)
internal actual fun engineCreateRouter(routes: Map<String, Route>, tabs: List<Tab>, initial: String): Router = nuclo.core.createRouterImpl(routes, tabs, initial)
internal actual fun engineSetTimer(ms: Double, repeat: Boolean, callback: () -> Unit): Int = Tasks.setTimer(ms, repeat, callback)
internal actual fun engineClearTimer(id: Int) = Tasks.clearTimer(id)
internal actual fun engineRequestFrame(callback: (Double) -> Unit): Int = Tasks.requestFrame(callback)
internal actual fun engineCancelFrame(id: Int) = Tasks.cancelFrame(id)
internal actual fun engineHttp(method: String, url: String, headers: Map<String, String>, body: String?, done: (Int, String, String?) -> Unit) =
    Tasks.http(method, url, headers, body, done)
internal actual fun engineNow(): Double = Runtime.backend.now()
