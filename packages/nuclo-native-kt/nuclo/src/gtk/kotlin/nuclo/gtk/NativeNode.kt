package nuclo.gtk

import gtk.GtkWidget
import kotlinx.cinterop.CPointer
import nuclo.Node
import nuclo.nativeDescriptor

/** A GTK widget as a node. `create` runs once when the node is mounted; `update` runs right after, and again on every update(). */
fun nativeNode(create: () -> CPointer<GtkWidget>, update: (CPointer<GtkWidget>) -> Unit = {}, vararg mods: Any?): Node =
    nativeDescriptor({ create() }, {
        @Suppress("UNCHECKED_CAST")
        update(it as CPointer<GtkWidget>)
    }, mods)
