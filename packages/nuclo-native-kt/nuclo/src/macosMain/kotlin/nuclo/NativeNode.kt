package nuclo

import platform.AppKit.NSView

/** A platform view as a node. `create` runs once when the node is mounted; `update` runs right after, and again on every update(). */
fun nativeNode(create: () -> NSView, update: (NSView) -> Unit = {}, vararg mods: Any?): Node =
    nativeDescriptor({ create() }, { update(it as NSView) }, mods)
