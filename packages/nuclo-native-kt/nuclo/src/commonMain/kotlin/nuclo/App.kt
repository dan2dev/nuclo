package nuclo

/** Replaces the platform's startup (used by :gtk-preview to run an example on the GTK backend). */
var runAppOverride: ((() -> Unit) -> Unit)? = null

/** Starts the platform's application and event loop, then runs `entry` on the UI thread. On the desktop and
 *  iOS it does not return. Call it once, from `fun main()`. */
fun runApp(entry: () -> Unit) = (runAppOverride ?: ::platformRunApp)(entry)

internal expect fun platformRunApp(entry: () -> Unit)

/** Shows a view. The first call is the app; each later call is a layer over it, the size of the window,
 *  that lets the pointer through where it has no view (modals, toasts). */
fun render(view: () -> Node) = engineRender(view)
fun render(outlet: Outlet) = engineRenderOutlet(outlet)

/** Re-runs every dynamic value — or only those inside scope(id) nodes for the given ids — and applies the
 *  ones that changed. */
fun update(vararg scopeIds: String) = engineUpdate(scopeIds)
/** Re-runs and applies every dynamic value, changed or not. */
fun forceUpdate() = engineForceUpdate()
