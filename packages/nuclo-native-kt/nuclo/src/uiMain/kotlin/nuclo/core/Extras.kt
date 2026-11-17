package nuclo.core

import nuclo.Router

/** Hooks later milestones fill in: the router (M4), end-of-list detection after a layout (M8). */
internal object Extras {
    var router: Router? = null
    fun reset() { router = null }
    fun afterLayout(root: LiveNode, content: Float) { (Runtime.roots.firstOrNull { it.node === root }?.end as? EndReached)?.let { it.content = content; it.check() } }
    /** The roots a dump walks: the shown screen, then each overlay. With a router (M4): the shown screens. */
    fun shownRoots(): List<LiveNode> {
        val r = router as? RouterImpl ?: return Runtime.roots.map { it.node }
        // the router's shown screens, then each overlay (a root that is not a screen)
        return r.shown() + Runtime.roots.filter { it.overlay }.map { it.node }
    }
    /** A route's onEndReached for the screen `node` is the root of (M8). */
    fun onEndReached(node: LiveNode, run: () -> Unit) { Runtime.roots.firstOrNull { it.node === node }?.end = EndReached(run) }
}

/** list / when / region / into registries live in Reconcile.kt. */
internal object Regions {
    fun reset() = resetRegions()
}

/** A route's onEndReached: runs when the content's end is within half a screen of the visible bottom (once per content height). */
internal class EndReached(val run: () -> Unit) {
    var top = 0f
    var visible = 0f
    var content = 0f
    private var fired = -1f

    fun check() {
        if (visible <= 0f || content <= 0f || content == fired || content - (top + visible) > visible / 2) return
        fired = content
        // not from inside the backend's layout pass or scroll handler: the app will change the tree
        Runtime.backend.setTimer(0) { run(); Runtime.settle() }
    }
}
