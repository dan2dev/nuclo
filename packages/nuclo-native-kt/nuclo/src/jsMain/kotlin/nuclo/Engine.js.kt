package nuclo

import kotlinx.browser.document
import kotlinx.browser.window
import org.w3c.dom.HTMLElement

private val globals: dynamic get() = js("globalThis")

/** The nuclo-core tag builder for a descriptor's tag. A few tags are plain boxes here, so the browser's own behaviour and layout stay out. */
private fun htmlTag(tag: String): String = when (tag) {
    "form", "details", "dialog", "table", "thead", "tbody", "tfoot", "native", "progress", "meter" -> "div"
    else -> tag
}

private fun kindClass(n: Node, checkbox: Boolean): String = when (n.kind) {
    Kind.Box -> "box"; Kind.Text -> "text"; Kind.Button -> "button"; Kind.Input -> if (checkbox) "checkbox" else "input"
    Kind.Textarea -> "textarea"; Kind.Image -> "image"; Kind.Native -> "native"
}

/** One child of a node or of a fragment's content, for nuclo-core. `null`: nothing to pass. */
internal fun toNuclo(child: Any?): dynamic = when (child) {
    null, is Boolean -> null
    is Node -> build(child)
    is Mod -> modToNuclo(child)
    is String -> child
    is Number -> jsNum(child)
    is Function0<*> -> { val f = child; { textOf(f()) } }
    else -> throw IllegalArgumentException("nuclo: cannot take a child of type ${child::class.simpleName}")
}

private fun build(n: Node): dynamic {
    val args = ArrayList<dynamic>()
    val checkbox = n.kind == Kind.Input && n.children.any { it is AttrMod && it.name == "type" && it.value == "checkbox" }
    for (c in n.children) { val x: dynamic = toNuclo(c); if (x != null) args.add(x) }
    n.native?.let { spec ->
        // the platform's element goes inside this box once it is mounted; update() runs it again through a reactive attribute
        @Suppress("UNCHECKED_CAST") val make = spec.create as () -> Any
        @Suppress("UNCHECKED_CAST") val refresh = spec.update as (Any) -> Unit
        val held = arrayOfNulls<Any>(1)
        args.add(NucloCore.on("mount", { el: dynamic -> val x = make(); held[0] = x; el.appendChild(x); refresh(x); undefined }))
        val reactive = obj()
        reactive["data-native"] = { held[0]?.let { refresh(it) }; "" }
        args.add(reactive)
    }
    val base = obj()
    val kind = kindClass(n, checkbox)
    base["className"] = (if (kind == "box" || kind == "text") "n $kind" else "n $kind touch") + (if (n.tag == "progress" || n.tag == "meter") " nuclo-${n.tag}" else "")
    args.add(base)
    val fn = globals[htmlTag(n.tag).let { if (it == "var") "var_" else it }]
    return fn.apply(null, args.toTypedArray())
}

private fun attrObj(name: String, value: dynamic): dynamic { val o = obj(); o[name] = value; return o }

private fun modToNuclo(mod: Mod): dynamic = when (mod) {
    is StyleClass -> classOf(mod.style, mod.name)
    is StyleMod -> styleMod(mod)
    is AttrMod -> attrMod(mod)
    is EventMod -> eventMod(mod)
    is LifecycleMod -> lifecycleMod(mod)
    is ScopeMod -> NucloCore.scope(*mod.ids)
    is ListMod<*> -> NucloCore.list({ mod.itemsNow().toTypedArray() }, { item, i -> toNuclo(mod.build(item, i)) })
    is WhenBuilder -> whenToNuclo(mod)
    is RegionMod -> NucloCore.region(regionOptions(mod))
    is IntoMod -> NucloCore.into(mod.id, *mod.content.map { toNuclo(it) }.toTypedArray())
}

private fun styleMod(mod: StyleMod): dynamic {
    mod.style?.let { return classOf(it) }
    mod.classFn?.let { f -> return attrObj("className", { classOf(f().style) }) }
    val f = mod.styleFn!!
    val previous = HashSet<String>()
    val o = obj()
    o["style"] = { inlineOf(f(), previous) }
    // What an inline style cannot carry (states, media) goes into a class made from the current result.
    o["className"] = { nestedClassOf(f())?.className ?: "" }
    return o
}

private fun attrMod(mod: AttrMod): dynamic {
    val name = if (mod.name == "ariaLabel") "aria-label" else mod.name
    val fn = mod.fn
    return if (fn != null) attrObj(name, { val v = fn(); if (v is Boolean) v else textOf(v) }) else attrObj(name, mod.value)
}

private fun targetOf(e: dynamic): NativeEvent {
    val t = e.target
    val value: String = if (t != null && t.value != null && jsTypeOf(t.value) == "string") t.value else ""
    val checked: Boolean = t != null && t.checked == true
    return NativeEvent(InputTarget(value, checked))
}

private fun eventMod(mod: EventMod): dynamic {
    val h = mod.handler
    @Suppress("UNCHECKED_CAST")
    return when (mod.kind) {
        EventKind.Click -> NucloCore.on("click", { e: dynamic -> (h as (NativeEvent) -> Unit)(targetOf(e)) })
        EventKind.Input -> NucloCore.on("input", { e: dynamic -> (h as (NativeEvent) -> Unit)(targetOf(e)) })
        EventKind.Change -> NucloCore.on("change", { e: dynamic -> (h as (NativeEvent) -> Unit)(targetOf(e)) })
        EventKind.Focus -> NucloCore.on("focus", { e: dynamic -> (h as (NativeEvent) -> Unit)(targetOf(e)) })
        EventKind.Blur -> NucloCore.on("blur", { e: dynamic -> (h as (NativeEvent) -> Unit)(targetOf(e)) })
        EventKind.Scroll -> NucloCore.on("scroll", { e: dynamic ->
            val t = e.target
            (h as (ScrollEvent) -> Unit)(ScrollEvent((t.scrollTop as Number).toDouble(), (t.scrollLeft as Number).toDouble(), (t.scrollHeight as Number).toDouble(),
                (t.scrollWidth as Number).toDouble(), (t.clientHeight as Number).toDouble(), (t.clientWidth as Number).toDouble()))
        })
        else -> gestureMod(mod)
    }
}

private fun lifecycleMod(mod: LifecycleMod): dynamic {
    val h = mod.handler
    @Suppress("UNCHECKED_CAST")
    return when (mod.kind) {
        LifecycleKind.Mount -> NucloCore.on("mount", { el: dynamic -> (h as (NativeElement) -> Unit)(NativeElement(el)); undefined })
        LifecycleKind.MountCleanup -> NucloCore.on("mount", { el: dynamic -> (h as (NativeElement) -> (() -> Unit))(NativeElement(el)) })
        LifecycleKind.Destroy -> NucloCore.on("destroy", { el: dynamic -> (h as (NativeElement) -> Unit)(NativeElement(el)); undefined })
    }
}

private fun call(target: dynamic, method: String, args: Array<dynamic>): dynamic = target[method].apply(target, args)

private fun whenToNuclo(b: WhenBuilder): dynamic {
    var builder: dynamic = null
    for (br in b.branches) {
        val cond: dynamic = br.condition
        val content = br.content.map { toNuclo(it) }.toTypedArray()
        builder = if (builder == null) NucloCore.`when`(cond, *content) else call(builder, "when", arrayOf<dynamic>(cond, *content))
    }
    b.otherwise?.let { o ->
        val content = o.map { toNuclo(it) }.toTypedArray()
        if (builder == null) builder = NucloCore.`when`(false)
        builder = call(builder, "else", content)
    }
    return builder
}

private fun regionOptions(mod: RegionMod): dynamic {
    val o = obj()
    o["id"] = mod.id
    o["type"] = if (mod.stack) "stack" else "latest"
    if (mod.empty.isNotEmpty()) o["empty"] = if (mod.empty.size == 1) toNuclo(mod.empty[0]) else build(div(*mod.empty))
    return o
}

// ---- the page and the engine

private var mainRoot: dynamic = null
private var appElement: HTMLElement? = null

/** The element a screen is rendered into; set up by `platformRunApp`. */
internal fun screenElement(): HTMLElement = appElement ?: error("nuclo: the page is not set up: call runApp { … }")

internal fun setUpPage() {
    // First in the head, so the base rules sit before every class nuclo-core makes (they have no specificity anyway).
    val style = document.createElement("style")
    style.textContent = BASE_CSS
    document.head!!.insertBefore(style, document.head!!.firstChild)
    val root = document.createElement("div") as HTMLElement
    root.id = "nuclo"
    val main = document.createElement("div") as HTMLElement
    main.className = "nuclo-main"
    val screen = document.createElement("div") as HTMLElement
    screen.className = "nuclo-screen"
    main.appendChild(screen)
    root.appendChild(main)
    document.body!!.appendChild(root)
    appElement = screen
}

internal actual fun engineRender(view: () -> Node) {
    val parent: dynamic
    if (mainRoot == null) {
        parent = screenElement()
        mainRoot = true
    } else {
        val layer = document.createElement("div") as HTMLElement
        layer.className = "nuclo-layer"
        screenElement().parentElement!!.appendChild(layer)
        parent = layer
    }
    NucloCore.render({ toNuclo(view()) }, parent)
}

internal actual fun engineRenderOutlet(outlet: Outlet) {
    mainRoot = true
    (outlet.router as WebRouter).show()
}
internal actual fun engineUpdate(ids: Array<out String>) { NucloCore.update(*ids) }
internal actual fun engineForceUpdate() { NucloCore.forceUpdate() }

internal actual fun engineGlobalStyle(selector: String, style: Style) {
    // "body" is the page behind the app: the screens. A tag's rule has no specificity, so classes and inline styles win, as natively.
    val sel = selector.split(',').joinToString(",") { part ->
        when (val t = part.trim()) {
            "body", "html", ":root", "*" -> ".nuclo-screen"
            else -> ":where($t.n)"
        }
    }
    val raw: dynamic = rawOf(declarations(style))
    style.normalized().placeholderColor?.let { raw["raw"]["--nuclo-placeholder"] = it }
    NucloCore.globalStyle(sel, raw)
}

internal actual fun engineCreateRouter(routes: Map<String, Route>, tabs: List<Tab>, initial: String): Router = WebRouter(routes, tabs, initial)

internal actual fun engineSetTimer(ms: Double, repeat: Boolean, callback: () -> Unit): Int =
    if (repeat) window.setInterval(callback, ms.toInt()) else window.setTimeout(callback, ms.toInt())

internal actual fun engineClearTimer(id: Int) { window.clearTimeout(id); window.clearInterval(id) }
internal actual fun engineRequestFrame(callback: (Double) -> Unit): Int = window.requestAnimationFrame { callback(js("Date.now()") as Double) }
internal actual fun engineCancelFrame(id: Int) { window.cancelAnimationFrame(id) }

internal actual fun engineHttp(method: String, url: String, headers: Map<String, String>, body: String?, done: (Int, String, String?) -> Unit) {
    // test mode (`?test=1`): no network on any target, so a script's dumps are the same everywhere
    if (window.location.search.contains("test=1")) { window.setTimeout({ done(0, "", "no network in headless") }, 0); return }
    val init = obj()
    init["method"] = method
    val h = obj()
    for ((k, v) in headers) h[k] = v
    init["headers"] = h
    if (body != null) init["body"] = body
    window.fetch(url, init.unsafeCast<org.w3c.fetch.RequestInit>()).then { r ->
        r.text().then { t -> done(r.status.toInt(), t, null) }
    }.catch { e -> done(0, "", e.toString()) }
}

internal actual fun engineNow(): Double = js("Date.now()") as Double
