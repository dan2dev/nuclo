package nuclo.host

import nuclo.core.Runtime

/** What a backend calls. Always on the UI thread. */
object Host {
    /** Installs the backend and runs the app's entry. A backend's platformRunApp calls it once its window exists. */
    fun start(backend: Backend, entry: () -> Unit) = Runtime.start(backend, entry)
    /** The natural height of a root laid out `width` wide. */
    fun measureRoot(root: ViewId, width: Float): Float = Runtime.measureRoot(root, width)
    /** Lays a root out in width × height: every view under it gets setFrame. */
    fun layoutRoot(root: ViewId, width: Float, height: Float) = Runtime.layoutRoot(root, width, height)

    fun event(view: ViewId, event: ViewEvent) = Runtime.dispatch(view, event)
    // M3 (Down, Up and Cancel, for the `pressed` state; Move, LongPress and DoubleClick arrive in M6)
    fun pointer(view: ViewId, phase: PointerPhase, event: nuclo.PointerEvent) = Runtime.pointer(view, phase, event)
    fun hover(view: ViewId, over: Boolean) = Runtime.hover(view, over)
    // M4
    /** The screen `root` left `tab`'s stack: report every pop, the user's and the ones navPop asked for. */
    fun navPopped(tab: Int, root: ViewId) { (nuclo.core.Extras.router as? nuclo.core.RouterImpl)?.popped(tab, root); Runtime.settle() }
    fun navTabSelected(tab: Int) { (nuclo.core.Extras.router as? nuclo.core.RouterImpl)?.tabSelected(tab); Runtime.settle() }
    // M6
    fun pan(view: ViewId, event: nuclo.PanEvent) = Runtime.deliver(view, nuclo.EventKind.Pan, event)
    fun pinch(view: ViewId, event: nuclo.PinchEvent) = Runtime.deliver(view, nuclo.EventKind.Pinch, event)
    fun key(view: ViewId, key: String) = Runtime.deliver(view, nuclo.EventKind.KeyDown, nuclo.KeyboardEvent(key))
    fun scrolled(view: ViewId, event: nuclo.ScrollEvent) {
        // a chrome screen's scroller reports the screen's position (its route's onEndReached)
        Runtime.chromeScrollers[view]?.let { Runtime.screenScrolled(it, event.scrollTop.toFloat(), event.clientHeight.toFloat()); return }
        Runtime.deliver(view, nuclo.EventKind.Scroll, event)
    }
    // M8
    /** The screen whose root is `root` is scrolled `top` px down and shows `visible` px. */
    fun screenScrolled(root: ViewId, top: Float, visible: Float) = Runtime.screenScrolled(root, top, visible)
}
