package nuclo

import org.w3c.dom.HTMLElement

/** A DOM element as a node. `create` runs once when the node is mounted; `update` runs right after, and again on every update(). */
fun nativeNode(create: () -> HTMLElement, update: (HTMLElement) -> Unit = {}, vararg mods: Any?): Node =
    nativeDescriptor({ create() }, { update(it as HTMLElement) }, mods)
