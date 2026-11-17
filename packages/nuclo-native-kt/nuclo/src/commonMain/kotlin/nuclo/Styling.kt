package nuclo

class StyleClass internal constructor(internal val style: Style, internal val name: String? = null) : Mod()

fun css(style: Style): StyleClass = StyleClass(style)
/** The name is a CSS class name on the web, a label natively. */
fun css(name: String, style: Style): StyleClass = StyleClass(style, name)
/** Merged left to right, nulls skipped. */
fun cx(vararg classes: StyleClass?): StyleClass = StyleClass(classes.filterNotNull().fold(Style()) { acc, c -> acc.merged(c.style) })

class Compound(val match: Map<String, String>, val style: Style)

class Variants internal constructor(
    private val base: Style,
    private val variants: Map<String, Map<String, Style>>,
    private val defaults: Map<String, String>,
    private val compounds: List<Compound>,
) {
    private val cache = HashMap<String, StyleClass>()

    /** btn("tone" to "ghost", "size" to "lg") — unknown group or value: IllegalArgumentException. Results are cached. */
    operator fun invoke(vararg selection: Pair<String, String>): StyleClass {
        val chosen = LinkedHashMap(defaults)
        for ((group, value) in selection) {
            val values = variants[group] ?: throw IllegalArgumentException("nuclo: unknown variant group \"$group\"")
            if (!values.containsKey(value)) throw IllegalArgumentException("nuclo: unknown value \"$value\" for variant group \"$group\"")
            chosen[group] = value
        }
        for ((group, values) in variants) if (chosen[group] == null && values.containsKey("false")) chosen[group] = "false"
        val key = chosen.entries.sortedBy { it.key }.joinToString(";") { "${it.key}=${it.value}" }
        return cache.getOrPut(key) {
            var style = base
            for ((group, values) in variants) chosen[group]?.let { values[it] }?.let { style = style.merged(it) }
            for (c in compounds) if (c.match.all { chosen[it.key] == it.value }) style = style.merged(c.style)
            StyleClass(style)
        }
    }
}

fun variants(
    base: Style = Style(),
    variants: Map<String, Map<String, Style>>,
    defaults: Map<String, String> = emptyMap(),
    compounds: List<Compound> = emptyList(),
): Variants = Variants(base, variants, defaults, compounds)

/** Styles for a tag ("h1", "button", several as "h1, h2") or for the screens ("body"): background and inherited text. */
fun globalStyle(selector: String, style: Style) = engineGlobalStyle(selector, style)

// M6
class Keyframes internal constructor(internal val stops: List<Pair<Double, Style>>)
/** keyframes(0 to Style(opacity = 1), 50 to Style(opacity = .4), 100 to Style(opacity = 1)) — percentages. */
fun keyframes(vararg stops: Pair<Number, Style>): Keyframes = Keyframes(stops.map { it.first.toDouble() to it.second })

class StyleAnimation(val keyframes: Keyframes, val duration: Number, val delay: Number = 0,
                     val easing: Easing = Easing.Ease, /** -1 = forever */ val iterations: Int = 1, val alternate: Boolean = false) {
    override fun equals(other: Any?) = other is StyleAnimation && keyframes === other.keyframes && duration.toDouble() == other.duration.toDouble() &&
        delay.toDouble() == other.delay.toDouble() && easing == other.easing && iterations == other.iterations && alternate == other.alternate
    override fun hashCode() = (keyframes.hashCode() * 31 + duration.toDouble().hashCode()) * 31 + iterations
}
