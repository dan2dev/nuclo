package nuclo

import android.content.Context
import android.view.View

/** A platform view as a node. `create` runs once when the node is mounted; `update` runs right after, and again on every update(). */
fun nativeNode(create: (Context) -> View, update: (View) -> Unit = {}, vararg mods: Any?): Node =
    nativeDescriptor({ create(NucloActivity.current) }, { update(it as View) }, mods)
