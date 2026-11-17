package nuclo

/** What a tag builder returns: a description of a view. Nothing exists until an engine mounts it. */
class Node internal constructor(internal val tag: String, internal val kind: Kind, internal val children: Array<out Any?>) {
    /** Set by `nativeNode` (M7): how the platform makes and updates the view. */
    internal var native: NativeSpec? = null
}

internal class NativeSpec(val create: Any, val update: Any)

/** What a platform's `nativeNode` returns (02-api.md section 10). Public only because the GTK sources are compiled by another module too: apps use their platform's `nativeNode`. */
fun nativeDescriptor(create: () -> Any, update: (Any) -> Unit, mods: Array<out Any?>): Node =
    node("native", Kind.Native, mods).also { it.native = NativeSpec(create, update) }

internal enum class Kind { Box, Text, Button, Input, Textarea, Image, Native }

/** Something a builder applies to its node instead of adding a view. A sealed hierarchy, so both engines
 *  must handle every case in an exhaustive `when`. */
sealed class Mod

internal val textTags: Set<String> = hashSetOf("span", "p", "h1", "h2", "h3", "h4", "h5", "h6", "label", "strong", "b", "small", "em", "i", "u", "s", "del", "ins", "mark", "code", "pre", "kbd", "samp", "var", "abbr", "cite", "q", "dfn", "sub", "sup", "time", "legend", "caption", "figcaption", "summary", "dt", "dd", "a", "bdi", "bdo", "data", "output", "rt", "rp", "ruby")

/** Builds a node and applies the children rules (02-api.md section 1): checked here, so every target fails the same way. */
internal fun node(tag: String, kind: Kind, children: Array<out Any?>): Node {
    val out = ArrayList<Any>(children.size)
    for (c in children) {
        when {
            c == null || c is Boolean -> {}
            c is Mod -> out.add(c)
            c is Node -> {
                if (kind != Kind.Box) throw IllegalArgumentException("nuclo: $tag takes text, not elements")
                out.add(c)
            }
            c is String || c is Number || c is Function0<*> ->
                out.add(if (kind == Kind.Box) Node("span", Kind.Text, arrayOf<Any?>(c)) else c)
            else -> throw IllegalArgumentException("nuclo: $tag cannot take a child of type ${c::class.simpleName}")
        }
    }
    return Node(tag, kind, out.toTypedArray())
}

/** Content of when_ / into / region: text becomes an implicit span, as in a box. */
@Suppress("UNCHECKED_CAST")
internal fun content(children: Array<out Any?>): Array<Any> = node("div", Kind.Box, children).children as Array<Any>

/** The text a dynamic child (or an attribute) produced. */
internal fun textOf(value: Any?): String = when (value) {
    null -> ""
    is String -> value
    is Number -> jsNum(value)
    is Boolean -> ""
    is Unit -> throw IllegalArgumentException("nuclo: a function child must return text; wrap handlers in onClick { }")
    else -> throw IllegalArgumentException("nuclo: a function child must return text, not ${value::class.simpleName}")
}

/** Number → text as JavaScript's String(n). Used by both engines. */
internal fun jsNum(n: Number): String {
    if (n is Byte || n is Short || n is Int || n is Long) return n.toString()
    val d = if (n is Float) n.toString().toDouble() else n.toDouble()
    if (d.isNaN()) return "NaN"
    if (d.isInfinite()) return if (d > 0) "Infinity" else "-Infinity"
    if (d == 0.0) return "0"
    val abs = if (d < 0) -d else d
    if (d == kotlin.math.floor(d) && abs < 1e15) return d.toLong().toString()
    val s = d.toString()
    val e = s.indexOf('E')
    if (e < 0) return s
    // Kotlin writes 1.0E-4 and 1.5E10 where JavaScript writes 0.0001 and 15000000000.
    val exp = s.substring(e + 1).toInt()
    val neg = s.startsWith("-")
    val mantissa = s.substring(if (neg) 1 else 0, e)
    if (exp >= 21 || exp < -6) return (if (neg) "-" else "") + mantissa.removeSuffix(".0") + "e" + (if (exp > 0) "+" else "") + exp
    val dot = mantissa.indexOf('.')
    val digits = mantissa.replace(".", "")
    val point = (if (dot < 0) mantissa.length else dot) + exp
    var body = when {
        point <= 0 -> "0." + "0".repeat(-point) + digits
        point >= digits.length -> digits + "0".repeat(point - digits.length)
        else -> digits.substring(0, point) + "." + digits.substring(point)
    }
    if (body.contains('.')) body = body.trimEnd('0').removeSuffix(".")
    return (if (neg) "-" else "") + body
}

/** Any other tag name; a box unless the name is in the text list. */
fun el(tag: String, vararg children: Any?): Node = node(tag, if (tag in textTags) Kind.Text else Kind.Box, children)

fun button(vararg children: Any?): Node = node("button", Kind.Button, children)
fun input(vararg children: Any?): Node = node("input", Kind.Input, children)
fun textarea(vararg children: Any?): Node = node("textarea", Kind.Textarea, children)
fun img(vararg children: Any?): Node = node("img", Kind.Image, children)

// Boxes
fun div(vararg children: Any?): Node = node("div", Kind.Box, children)
fun section(vararg children: Any?): Node = node("section", Kind.Box, children)
fun header(vararg children: Any?): Node = node("header", Kind.Box, children)
fun footer(vararg children: Any?): Node = node("footer", Kind.Box, children)
fun main(vararg children: Any?): Node = node("main", Kind.Box, children)
fun nav(vararg children: Any?): Node = node("nav", Kind.Box, children)
fun article(vararg children: Any?): Node = node("article", Kind.Box, children)
fun aside(vararg children: Any?): Node = node("aside", Kind.Box, children)
fun form(vararg children: Any?): Node = node("form", Kind.Box, children)
fun ul(vararg children: Any?): Node = node("ul", Kind.Box, children)
fun ol(vararg children: Any?): Node = node("ol", Kind.Box, children)
fun li(vararg children: Any?): Node = node("li", Kind.Box, children)
fun figure(vararg children: Any?): Node = node("figure", Kind.Box, children)
fun fieldset(vararg children: Any?): Node = node("fieldset", Kind.Box, children)
fun blockquote(vararg children: Any?): Node = node("blockquote", Kind.Box, children)
fun address(vararg children: Any?): Node = node("address", Kind.Box, children)
fun hgroup(vararg children: Any?): Node = node("hgroup", Kind.Box, children)
fun menu(vararg children: Any?): Node = node("menu", Kind.Box, children)
fun search(vararg children: Any?): Node = node("search", Kind.Box, children)
fun dl(vararg children: Any?): Node = node("dl", Kind.Box, children)
fun details(vararg children: Any?): Node = node("details", Kind.Box, children)
fun dialog(vararg children: Any?): Node = node("dialog", Kind.Box, children)
fun table(vararg children: Any?): Node = node("table", Kind.Box, children)
fun thead(vararg children: Any?): Node = node("thead", Kind.Box, children)
fun tbody(vararg children: Any?): Node = node("tbody", Kind.Box, children)
fun tfoot(vararg children: Any?): Node = node("tfoot", Kind.Box, children)
fun tr(vararg children: Any?): Node = node("tr", Kind.Box, children)
fun td(vararg children: Any?): Node = node("td", Kind.Box, children)
fun th(vararg children: Any?): Node = node("th", Kind.Box, children)
fun hr(vararg children: Any?): Node = node("hr", Kind.Box, children)
fun body(vararg children: Any?): Node = node("body", Kind.Box, children)
fun html(vararg children: Any?): Node = node("html", Kind.Box, children)
fun colgroup(vararg children: Any?): Node = node("colgroup", Kind.Box, children)
fun col(vararg children: Any?): Node = node("col", Kind.Box, children)
fun map(vararg children: Any?): Node = node("map", Kind.Box, children)
fun picture(vararg children: Any?): Node = node("picture", Kind.Box, children)
fun slot(vararg children: Any?): Node = node("slot", Kind.Box, children)
fun head(vararg children: Any?): Node = node("head", Kind.Box, children)
fun base(vararg children: Any?): Node = node("base", Kind.Box, children)
fun link(vararg children: Any?): Node = node("link", Kind.Box, children)
fun meta(vararg children: Any?): Node = node("meta", Kind.Box, children)
fun script(vararg children: Any?): Node = node("script", Kind.Box, children)
fun title(vararg children: Any?): Node = node("title", Kind.Box, children)
fun template(vararg children: Any?): Node = node("template", Kind.Box, children)
fun noscript(vararg children: Any?): Node = node("noscript", Kind.Box, children)
fun datalist(vararg children: Any?): Node = node("datalist", Kind.Box, children)
fun area(vararg children: Any?): Node = node("area", Kind.Box, children)
fun source(vararg children: Any?): Node = node("source", Kind.Box, children)
fun track(vararg children: Any?): Node = node("track", Kind.Box, children)
fun br(vararg children: Any?): Node = node("br", Kind.Box, children)
fun wbr(vararg children: Any?): Node = node("wbr", Kind.Box, children)

// Text
fun span(vararg children: Any?): Node = node("span", Kind.Text, children)
fun p(vararg children: Any?): Node = node("p", Kind.Text, children)
fun h1(vararg children: Any?): Node = node("h1", Kind.Text, children)
fun h2(vararg children: Any?): Node = node("h2", Kind.Text, children)
fun h3(vararg children: Any?): Node = node("h3", Kind.Text, children)
fun h4(vararg children: Any?): Node = node("h4", Kind.Text, children)
fun h5(vararg children: Any?): Node = node("h5", Kind.Text, children)
fun h6(vararg children: Any?): Node = node("h6", Kind.Text, children)
fun label(vararg children: Any?): Node = node("label", Kind.Text, children)
fun strong(vararg children: Any?): Node = node("strong", Kind.Text, children)
fun b(vararg children: Any?): Node = node("b", Kind.Text, children)
fun small(vararg children: Any?): Node = node("small", Kind.Text, children)
fun em(vararg children: Any?): Node = node("em", Kind.Text, children)
fun i(vararg children: Any?): Node = node("i", Kind.Text, children)
fun u(vararg children: Any?): Node = node("u", Kind.Text, children)
fun s(vararg children: Any?): Node = node("s", Kind.Text, children)
fun del(vararg children: Any?): Node = node("del", Kind.Text, children)
fun ins(vararg children: Any?): Node = node("ins", Kind.Text, children)
fun mark(vararg children: Any?): Node = node("mark", Kind.Text, children)
fun code(vararg children: Any?): Node = node("code", Kind.Text, children)
fun pre(vararg children: Any?): Node = node("pre", Kind.Text, children)
fun kbd(vararg children: Any?): Node = node("kbd", Kind.Text, children)
fun samp(vararg children: Any?): Node = node("samp", Kind.Text, children)
fun var_(vararg children: Any?): Node = node("var", Kind.Text, children)
fun abbr(vararg children: Any?): Node = node("abbr", Kind.Text, children)
fun cite(vararg children: Any?): Node = node("cite", Kind.Text, children)
fun q(vararg children: Any?): Node = node("q", Kind.Text, children)
fun dfn(vararg children: Any?): Node = node("dfn", Kind.Text, children)
fun sub(vararg children: Any?): Node = node("sub", Kind.Text, children)
fun sup(vararg children: Any?): Node = node("sup", Kind.Text, children)
fun time(vararg children: Any?): Node = node("time", Kind.Text, children)
fun legend(vararg children: Any?): Node = node("legend", Kind.Text, children)
fun caption(vararg children: Any?): Node = node("caption", Kind.Text, children)
fun figcaption(vararg children: Any?): Node = node("figcaption", Kind.Text, children)
fun summary(vararg children: Any?): Node = node("summary", Kind.Text, children)
fun dt(vararg children: Any?): Node = node("dt", Kind.Text, children)
fun dd(vararg children: Any?): Node = node("dd", Kind.Text, children)
fun a(vararg children: Any?): Node = node("a", Kind.Text, children)
fun bdi(vararg children: Any?): Node = node("bdi", Kind.Text, children)
fun bdo(vararg children: Any?): Node = node("bdo", Kind.Text, children)
fun data(vararg children: Any?): Node = node("data", Kind.Text, children)
fun output(vararg children: Any?): Node = node("output", Kind.Text, children)
fun rt(vararg children: Any?): Node = node("rt", Kind.Text, children)
fun rp(vararg children: Any?): Node = node("rp", Kind.Text, children)
fun ruby(vararg children: Any?): Node = node("ruby", Kind.Text, children)
