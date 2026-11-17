package nuclo

/** A fresh JavaScript object ({}), for what nuclo-core takes as plain objects. */
internal fun obj(): dynamic = js("({})")

private fun px(n: Number) = jsNum(n) + "px"

/** FlexStart → flex-start, LineThrough → line-through. */
private fun kebab(name: String): String {
    val b = StringBuilder()
    for ((i, c) in name.withIndex()) { if (c.isUpperCase() && i > 0) b.append('-'); b.append(c.lowercaseChar()) }
    return b.toString()
}

private val easings = mapOf(
    Easing.Linear to "linear", Easing.Ease to "ease", Easing.EaseIn to "ease-in", Easing.EaseOut to "ease-out", Easing.EaseInOut to "ease-in-out",
    // One overshoot, then settled: the response of a platform spring (damping ≈ 0.7).
    Easing.Spring to "linear(0, 0.36 8%, 0.82 18%, 1.06 28%, 1.1 36%, 1.05 48%, 1 60%, 0.99 75%, 1)",
)

/** The declarations of a style's own properties (not its states or media), as CSS property → value. */
internal fun declarations(style: Style): LinkedHashMap<String, String> {
    val s = style.normalized()
    val o = LinkedHashMap<String, String>()
    s.flexDirection?.let { o["flex-direction"] = if (it == FlexDirection.Row) "row" else "column" }
    s.alignItems?.let { o["align-items"] = kebab(it.name) }
    s.alignSelf?.let { o["align-self"] = kebab(it.name) }
    s.justifyContent?.let { o["justify-content"] = kebab(it.name) }
    s.flexWrap?.let { o["flex-wrap"] = kebab(it.name) }
    s.flex?.let { o["flex"] = if (it.toDouble() > 0) "${jsNum(it)} 1 0%" else "0 0 auto" }
    s.gap?.let { o["gap"] = px(it) }
    s.margin?.let { o["margin"] = px(it) }
    s.marginTop?.let { o["margin-top"] = px(it) }; s.marginRight?.let { o["margin-right"] = px(it) }
    s.marginBottom?.let { o["margin-bottom"] = px(it) }; s.marginLeft?.let { o["margin-left"] = px(it) }
    s.padding?.let { o["padding"] = px(it) }
    s.paddingTop?.let { o["padding-top"] = px(it) }; s.paddingRight?.let { o["padding-right"] = px(it) }
    s.paddingBottom?.let { o["padding-bottom"] = px(it) }; s.paddingLeft?.let { o["padding-left"] = px(it) }
    // A box is at most as wide as its container, unless it says how wide it is.
    s.width?.let { o["width"] = px(it); if (s.maxWidth == null) o["max-width"] = "none" }
    s.widthPct?.let { o["width"] = "${jsNum(it)}%"; if (s.maxWidth == null) o["max-width"] = "none" }
    s.height?.let { o["height"] = px(it) }
    s.minWidth?.let { o["min-width"] = px(it) }; s.maxWidth?.let { o["max-width"] = px(it) }
    s.minHeight?.let { o["min-height"] = px(it) }; s.maxHeight?.let { o["max-height"] = px(it) }
    s.aspectRatio?.let { o["aspect-ratio"] = jsNum(it) }
    s.overflow?.let {
        if (it == Overflow.Scroll) {
            if (s.flexDirection == FlexDirection.Row) { o["overflow-x"] = "auto"; o["overflow-y"] = "hidden" } else { o["overflow-y"] = "auto"; o["overflow-x"] = "hidden" }
            o["scrollbar-width"] = "none"
        } else o["overflow"] = kebab(it.name)
    }
    s.position?.let { o["position"] = kebab(it.name) }
    s.top?.let { o["top"] = px(it) }; s.right?.let { o["right"] = px(it) }; s.bottom?.let { o["bottom"] = px(it) }; s.left?.let { o["left"] = px(it) }
    s.zIndex?.let { o["z-index"] = jsNum(it) }
    if (s.display == Display.None) o["display"] = "none"
    s.backgroundColor?.let { o["background-color"] = it }
    s.color?.let { o["color"] = it }
    s.opacity?.let { o["opacity"] = jsNum(it) }
    s.borderRadius?.let { o["border-radius"] = px(it) }
    s.borderWidth?.let { o["border-width"] = px(it) }
    s.borderColor?.let { o["border-color"] = it }
    s.borderTopWidth?.let { o["border-top-width"] = px(it) }; s.borderRightWidth?.let { o["border-right-width"] = px(it) }
    s.borderBottomWidth?.let { o["border-bottom-width"] = px(it) }; s.borderLeftWidth?.let { o["border-left-width"] = px(it) }
    s.borderTopColor?.let { o["border-top-color"] = it }; s.borderRightColor?.let { o["border-right-color"] = it }
    s.borderBottomColor?.let { o["border-bottom-color"] = it }; s.borderLeftColor?.let { o["border-left-color"] = it }
    s.textTransform?.let { o["text-transform"] = kebab(it.name) }
    s.objectFit?.let { o["object-fit"] = kebab(it.name) }
    s.pointerEvents?.let { o["pointer-events"] = kebab(it.name) }
    s.fontSize?.let {
        o["font-size"] = px(it)
        if (s.lineHeight == null) o["line-height"] = px(kotlin.math.floor(it.toDouble() * 1.2 + 0.5))
    }
    s.fontWeight?.let { o["font-weight"] = it.css.toString() }
    s.fontStyle?.let { o["font-style"] = kebab(it.name) }
    s.fontFamily?.let { o["font-family"] = when (it) { "sans-serif" -> "system-ui,sans-serif"; "monospace" -> "ui-monospace,monospace"; else -> it } }
    // A bare number under 4 is a multiple of the font size, in whole pixels as natively.
    s.lineHeight?.let { o["line-height"] = px(if (it.toDouble() < 4) kotlin.math.floor((s.fontSize?.toDouble() ?: 15.0) * it.toDouble() + 0.5) else it) }
    s.letterSpacing?.let { o["letter-spacing"] = px(it) }
    s.textAlign?.let { o["text-align"] = kebab(it.name) }
    s.textDecoration?.let { o["text-decoration"] = kebab(it.name) }
    s.numberOfLines?.let {
        if (it == 1) { o["white-space"] = "nowrap"; o["overflow"] = "hidden"; o["text-overflow"] = "ellipsis" }
        else { o["display"] = "-webkit-box"; o["-webkit-box-orient"] = "vertical"; o["-webkit-line-clamp"] = "$it"; o["overflow"] = "hidden" }
    }
    // A box is at most as wide as the space its margins leave (negative margins widen it), as natively.
    val side = (s.marginLeft ?: s.margin)?.toDouble().let { it ?: 0.0 } + (s.marginRight ?: s.margin)?.toDouble().let { it ?: 0.0 }
    if (side != 0.0 && s.width == null && s.widthPct == null && s.maxWidth == null) o["max-width"] = "calc(100% - ${px(side)})"
    if (s.translateX != null || s.translateY != null || s.rotate != null || s.scale != null) {
        o["transform"] = "translate(${px(s.translateX ?: 0)},${px(s.translateY ?: 0)}) rotate(${jsNum(s.rotate ?: 0)}deg) scale(${jsNum(s.scale ?: 1)})"
    }
    if (s.shadowRadius != null || s.shadowColor != null) {
        o["box-shadow"] = "${px(s.shadowOffsetX ?: 0)} ${px(s.shadowOffsetY ?: 0)} ${px(s.shadowRadius ?: 0)} ${s.shadowColor ?: "#00000040"}"
    }
    if (s.transitionDuration != null) {
        o["transition"] = "${jsNum(s.transitionDuration)}ms ${easings[s.transitionEasing ?: Easing.Ease]} ${jsNum(s.transitionDelay ?: 0)}ms"
        o["transition-property"] = "opacity, transform, background-color, border-radius, width, height"
    }
    s.animation?.let { a ->
        o["animation"] = "${keyframesName(a.keyframes)} ${jsNum(a.duration)}ms ${easings[a.easing]} ${jsNum(a.delay)}ms ${if (a.iterations < 0) "infinite" else a.iterations.toString()}${if (a.alternate) " alternate" else ""}"
    }
    return o
}

/** The keyframes of an animation as a nuclo-core `keyframes()` rule: its generated name. */
private val keyframeNames = ArrayList<Pair<Keyframes, String>>()
private fun keyframesName(k: Keyframes): String {
    keyframeNames.firstOrNull { it.first === k }?.let { return it.second }
    val frames = obj()
    for ((at, st) in k.stops) frames["${jsNum(at)}%"] = rawOf(declarations(st))
    val name = NucloCore.keyframes(frames)
    keyframeNames.add(k to name)
    return name
}

internal fun rawOf(decl: Map<String, String>): dynamic {
    val raw = obj()
    for ((k, v) in decl) raw[k] = v
    val o = obj()
    o["raw"] = raw
    return o
}

private val stateKeys = listOf<Pair<String, (Style) -> Style?>>(
    "active" to { it.pressed }, "hover" to { it.hover }, "focus" to { it.focused }, "disabled" to { it.disabled }, "enabled" to { it.enabled },
    "checked" to { it.checked }, "placeholderShown" to { it.placeholderShown }, "first" to { it.first }, "last" to { it.last },
    "only" to { it.only }, "odd" to { it.odd }, "even" to { it.even }, "empty" to { it.empty },
)

private fun mediaKey(r: MediaRule): String {
    val parts = ArrayList<String>()
    r.min?.let { parts.add("(min-width: ${px(it)})") }
    r.max?.let { parts.add("(max-width: ${px(it)})") }
    return "@media " + parts.joinToString(" and ")
}

/** A nuclo-core style object (`raw` declarations, state keys, `@media` keys) for `css()`. `onlyNested`: leave the style's own declarations out. */
internal fun toNucloStyle(style: Style, onlyNested: Boolean = false): dynamic {
    val s = style.normalized()
    val o = obj()
    val own = if (onlyNested) LinkedHashMap<String, String>() else declarations(s)
    s.placeholderColor?.let { own["--nuclo-placeholder"] = it }
    if (own.isNotEmpty()) o["raw"] = rawOf(own)["raw"]
    for ((key, get) in stateKeys) get(s)?.let { o[key] = toNucloStyle(it) }
    s.media?.forEach { r -> o[mediaKey(r)] = toNucloStyle(r.style) }
    return o
}

private val classCache = HashMap<Style, dynamic>()

/** The nuclo-core class (an object with `className`) of a style: made once per distinct style. */
internal fun classOf(style: Style, name: String? = null): dynamic {
    if (name != null) return NucloCore.css(name, toNucloStyle(style))
    return classCache.getOrPut(style) { NucloCore.css(toNucloStyle(style)) }
}

private val nestedCache = HashMap<Style, dynamic>()

/** Only the states and media of a style, as a class (the part an inline style cannot carry). */
internal fun nestedClassOf(style: Style): dynamic? {
    val s = style.normalized()
    val has = s.media != null || stateKeys.any { it.second(s) != null } || s.placeholderColor != null
    if (!has) return null
    return nestedCache.getOrPut(s) { NucloCore.css(toNucloStyle(s, onlyNested = true)) }
}

/** The inline-style object of a style's own declarations (kebab-case keys). Properties set before and now missing are cleared. */
internal fun inlineOf(style: Style, previous: MutableSet<String>): dynamic {
    val d = declarations(style)
    d.remove("--nuclo-placeholder")
    val o = obj()
    for ((k, v) in d) o[k] = v
    for (k in previous) if (!d.containsKey(k)) o[k] = ""
    previous.clear(); previous.addAll(d.keys)
    return o
}

// ---- the base stylesheet: zero-specificity (:where) so every css() class and inline style wins over it, in order

internal const val BASE_CSS = """
:root,:root>body{margin:0;height:100%;overflow:hidden;overscroll-behavior:none}
body{font:15px/18px system-ui,sans-serif;color:#000;background:#fff;-webkit-text-size-adjust:100%}
:where(.n){box-sizing:border-box;display:flex;flex-direction:column;align-items:stretch;flex:0 0 auto;position:relative;margin:0;padding:0;
border:0 solid #000;min-width:0;min-height:0;max-width:100%;list-style:none;background:none;font:inherit;color:inherit;text-align:inherit;
letter-spacing:inherit;outline:none;text-decoration:none;-webkit-tap-highlight-color:transparent}
:where(.n.text){display:block;white-space:pre-wrap;overflow-wrap:anywhere;max-width:100%}
:where(.n.button){flex-direction:row;align-items:center;justify-content:center;text-align:center;cursor:pointer;padding:8px 14px;color:#2563eb;
appearance:none;user-select:none;-webkit-user-select:none;max-width:100%}
:where(.n.button:disabled,.n.input:disabled){opacity:.4;cursor:default}
:where(.n.input){padding:8px;appearance:none;border-radius:0;max-width:100%}
:where(.n.textarea){padding:8px;resize:none;min-height:3em}
:where(.n.checkbox){width:20px;height:20px;margin:0;accent-color:#4f46e5}
:where(.n.image){height:120px;object-fit:cover;max-width:100%}
.n::placeholder{color:var(--nuclo-placeholder,#757575)}
:where(h1.n){font-size:32px;line-height:38px;font-weight:bold}:where(h2.n){font-size:22px;line-height:26px;font-weight:bold}:where(h3.n){font-size:19px;line-height:23px;font-weight:bold}
:where(h4.n){font-size:17px;line-height:20px;font-weight:bold}:where(h5.n){font-size:15px;line-height:18px;font-weight:bold}:where(h6.n){font-size:13px;line-height:16px;font-weight:bold}
:where(strong.n,b.n,th.n,dt.n){font-weight:bold}:where(small.n,sub.n,sup.n){font-size:12px;line-height:14px}:where(em.n,i.n,cite.n,dfn.n,var.n){font-style:italic}
:where(u.n,ins.n){text-decoration:underline}:where(s.n,del.n){text-decoration:line-through}:where(mark.n){background-color:#fef08a}
:where(code.n,pre.n,kbd.n,samp.n){font-family:ui-monospace,monospace}:where(a.n){color:#2563eb;cursor:pointer}
:where(.nuclo-progress,.nuclo-meter){flex-direction:row;width:160px;height:16px;overflow:hidden;background-color:#e5e7eb;border-radius:8px}:where(.nuclo-meter){width:80px}
:where(tr.n){flex-direction:row}:where(td.n,th.n){flex:1 1 0%}:where(hr.n){height:1px;background-color:#cbd5e1}
:where(head.n,base.n,link.n,meta.n,script.n,style.n,title.n,template.n,noscript.n,datalist.n,area.n,source.n,track.n,wbr.n){display:none}
#nuclo{position:fixed;inset:0;display:flex;flex-direction:column;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
.nuclo-main{flex:1;min-height:0;display:flex;flex-direction:column;position:relative}
.nuclo-screen{position:absolute;inset:0;overflow-y:auto;background:#fff;display:flex;flex-direction:column}
.nuclo-screen>.n{flex:1 0 auto}
.nuclo-layer{position:absolute;inset:0;pointer-events:none}
.nuclo-layer>.n{width:100%;height:100%}
.nuclo-layer .touch{pointer-events:auto}
.nuclo-bar{height:56px;flex:none;display:flex;align-items:center;background:#fff;box-shadow:0 1px 3px #0003;z-index:2;font-size:20px;line-height:24px;font-weight:bold}
.nuclo-back{width:56px;height:56px;font:24px system-ui;background:none;border:0;cursor:pointer}
.nuclo-tabs{height:64px;flex:none;display:flex;background:#f8fafc;box-shadow:0 -1px 4px #0002;z-index:2}
.nuclo-tabs button{flex:1;border:0;background:none;font:12px/14px system-ui;color:#64748b;white-space:pre-line;cursor:pointer}
.nuclo-tabs button.active{color:#4f46e5}
.nuclo-stack{flex:1;min-height:0;position:relative;overflow:hidden}
.nuclo-sheet{position:absolute;inset:0;z-index:3;background:#fff;display:flex;flex-direction:column}
"""
