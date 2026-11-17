package nuclo

import platform.UIKit.UIView

/** A platform view as a node. `create` runs once when the node is mounted; `update` runs right after, and again on every update(). */
fun nativeNode(create: () -> UIView, update: (UIView) -> Unit = {}, vararg mods: Any?): Node =
    nativeDescriptor({ create() }, { update(it as UIView) }, mods)
