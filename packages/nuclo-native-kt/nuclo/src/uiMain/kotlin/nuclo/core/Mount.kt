package nuclo.core

import nuclo.*
import nuclo.host.InputKind
import nuclo.host.ViewKind

/** Mounting descriptors: `Node` → `LiveNode`, and every `Mod` applied with an exhaustive `when`. */
internal fun mount(desc: Node): LiveNode {
    val checkbox = desc.kind == Kind.Input && desc.children.any { it is AttrMod && it.name == "type" && it.value == "checkbox" }
    val n = LiveNode(desc.kind, desc.tag)
    if (desc.kind == Kind.Native) return mountNative(n, desc)
    n.initView(when (desc.kind) {
        Kind.Box -> ViewKind.Box
        Kind.Text -> ViewKind.Text
        Kind.Button -> ViewKind.Button
        Kind.Input -> if (checkbox) ViewKind.Checkbox else ViewKind.Input
        Kind.Textarea -> ViewKind.Textarea
        Kind.Image -> ViewKind.Image
        Kind.Native -> ViewKind.Native
    })
    for (c in desc.children) applyChild(n, c)
    n.finish()
    return n
}

/** A child of a node (or of a fragment standing in for one): a node, a mod, or text. */
internal fun applyChild(target: LiveNode, child: Any?) {
    when (child) {
        null, is Boolean -> {}
        is Node -> target.append(mount(child))
        is Mod -> applyMod(target, child)
        is String, is Number -> target.addText(textOf(child))
        is Function0<*> -> target.addText(child)
        else -> throw IllegalArgumentException("nuclo: cannot take a child of type ${child::class.simpleName}")
    }
}

internal fun applyMod(n: LiveNode, mod: Mod) {
    when (mod) {
        is StyleClass -> n.classes.add(mod.style)
        is StyleMod -> {
            mod.style?.let { n.inline = n.inline.merged(it) }
            mod.styleFn?.let { n.dynamicInline = it }
            mod.classFn?.let { n.dynamicClass = it }
        }
        is AttrMod -> applyAttr(n, mod)
        is EventMod -> applyEvent(n, mod)
        is LifecycleMod -> applyLifecycle(n, mod)
        is ScopeMod -> n.scopes.addAll(mod.ids)
        is ListMod<*> -> mountList(n, mod)
        is WhenBuilder -> mountWhen(n, mod)
        is RegionMod -> mountRegion(n, mod)
        is IntoMod -> mountInto(n, mod)
    }
}

private fun <T> attr(n: LiveNode, mod: AttrMod, apply: (T) -> Unit) {
    @Suppress("UNCHECKED_CAST")
    val fn = mod.fn as (() -> T)?
    if (fn != null) n.bind(fn, apply) else { @Suppress("UNCHECKED_CAST") apply(mod.value as T) }
}

private fun applyAttr(n: LiveNode, mod: AttrMod) {
    val b = n.backend
    val view = n.view
    if (view == 0) return
    when (mod.name) {
        "value" -> attr<String>(n, mod) { text ->
            // Never reset what the user is typing to the same text (the caret would jump).
            if (b.controlText(view) != text) {
                n.write { b.setValue(view, text) }
                n.restyleIf { it.placeholderShown != null }
            }
        }
        "placeholder" -> attr<String>(n, mod) { text -> n.placeholder = text; b.setPlaceholder(view, text) }
        "checked" -> attr<Boolean>(n, mod) { on ->
            if (b.controlChecked(view) != on) {
                n.write { b.setChecked(view, on) }
                n.restyleIf { it.checked != null }
            }
        }
        "disabled" -> attr<Boolean>(n, mod) { off ->
            b.setEnabled(view, !off)
            n.disabled = off
            n.restyleIf { it.disabled != null || it.enabled != null }
            // A disabled view is dimmed: paint again with the style it has.
            n.painted?.let { n.paint(it, null) }
        }
        "src" -> attr<String>(n, mod) { url -> loadImage(n, url) }
        "href" -> { attr<String>(n, mod) { url -> n.href = url }; n.clickable() }
        "ariaLabel" -> attr<String>(n, mod) { text -> n.label = text; b.setLabel(view, text) }
        "type" -> b.setInputType(view, mod.value as String)
    }
}

private fun applyEvent(n: LiveNode, mod: EventMod) {
    n.listen(mod.kind, mod.handler)
    when (mod.kind) {
        EventKind.KeyDown -> n.want(InputKind.Keys)
        EventKind.PointerDown, EventKind.PointerMove, EventKind.PointerUp, EventKind.PointerCancel -> n.want(InputKind.Pointer)
        EventKind.LongPress -> n.want(InputKind.LongPress)
        EventKind.DoubleClick -> n.want(InputKind.DoubleClick)
        EventKind.Pan -> n.want(InputKind.Pan)
        EventKind.Pinch -> n.want(InputKind.Pinch)
        EventKind.Scroll -> n.want(InputKind.Scroll)
        else -> {}
    }
}

private fun applyLifecycle(n: LiveNode, mod: LifecycleMod) {
    @Suppress("UNCHECKED_CAST")
    when (mod.kind) {
        LifecycleKind.Mount -> { val h = mod.handler as (NativeElement) -> Unit; n.mountCallbacks.add { h(it); null }; Runtime.mountPending = true }
        LifecycleKind.MountCleanup -> { n.mountCallbacks.add(mod.handler as (NativeElement) -> (() -> Unit)); Runtime.mountPending = true }
        LifecycleKind.Destroy -> n.destroyCallbacks.add(mod.handler as (NativeElement) -> Unit)
    }
}

/** A platform view as a node (M7): the platform's `nativeNode` made the spec; `create` runs once, `update` after it and on every update(). */
private fun mountNative(n: LiveNode, desc: Node): LiveNode {
    val spec = desc.native ?: error("nuclo: a native node is made with nativeNode(…)")
    @Suppress("UNCHECKED_CAST")
    val obj = (spec.create as () -> Any)()
    n.initAdopted(obj)
    for (c in desc.children) applyChild(n, c)
    @Suppress("UNCHECKED_CAST")
    val update = spec.update as (Any) -> Unit
    n.nativeUpdate = { update(obj) }
    n.nativeUpdate!!()
    n.finish()
    return n
}
