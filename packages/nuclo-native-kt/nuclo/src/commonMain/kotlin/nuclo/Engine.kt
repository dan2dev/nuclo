package nuclo

// What only an engine can do. jsMain implements these on nuclo-core, uiMain on the core and a Backend.

internal expect fun engineRender(view: () -> Node)
internal expect fun engineRenderOutlet(outlet: Outlet)
internal expect fun engineUpdate(ids: Array<out String>)
internal expect fun engineForceUpdate()
internal expect fun engineGlobalStyle(selector: String, style: Style)
internal expect fun engineCreateRouter(routes: Map<String, Route>, tabs: List<Tab>, initial: String): Router
internal expect fun engineSetTimer(ms: Double, repeat: Boolean, callback: () -> Unit): Int
internal expect fun engineClearTimer(id: Int)
internal expect fun engineRequestFrame(callback: (Double) -> Unit): Int
internal expect fun engineCancelFrame(id: Int)
/** `done` runs on the UI thread. `error` is set (and `status` 0) when there was no HTTP answer. */
internal expect fun engineHttp(method: String, url: String, headers: Map<String, String>, body: String?, done: (Int, String, String?) -> Unit)
internal expect fun engineNow(): Double
