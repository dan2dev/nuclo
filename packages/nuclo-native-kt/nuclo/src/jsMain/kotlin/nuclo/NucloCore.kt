package nuclo

/** nuclo-core: importing the module also registers its tag builders as globals (reached through `globalThis`). */
@JsModule("nuclo")
internal external object NucloCore {
    fun render(view: dynamic, parent: dynamic = definedExternally): dynamic
    fun update(vararg scopeIds: String)
    fun forceUpdate()
    fun list(items: () -> Array<dynamic>, render: (item: dynamic, index: Int) -> dynamic): dynamic
    fun `when`(condition: dynamic, vararg content: dynamic): dynamic
    fun region(options: dynamic): dynamic
    fun into(id: String, vararg content: dynamic): dynamic
    fun scope(vararg ids: String): dynamic
    fun on(type: String, listener: dynamic): dynamic
    fun css(style: dynamic): dynamic
    fun css(name: String, style: dynamic): dynamic
    fun cx(vararg classes: dynamic): dynamic
    fun globalStyle(selector: String, style: dynamic)
    fun keyframes(frames: dynamic): String
}
