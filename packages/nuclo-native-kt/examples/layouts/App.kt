package app

import kotlin.math.roundToInt
import nuclo.*

// Layouts and transitions: one dashboard screen laid out by the same flex algorithm on every target.
//   Header     a row, overlapping avatars (negative margins, zIndex) and an absolute badge
//   Segments   a thumb that slides under the labels (translateX + a spring transition)
//   Metrics    a 2 x 2 grid of flex = 1 cards
//   Chart      bars whose height animates, staggered by transitionDelay
//   Carousel   overflow = Scroll on a row, cards sized by aspectRatio, onScroll for the page dots
//   Tags       flexWrap, with a pressed style
//   Questions  an accordion: the height and the chevron's rotation are transitions
//   Button     a second render() layer over the screen, with a shadow

enum class Range { Week, Month, Year }

class Metric(val label: String, val week: String, val month: String, val year: String, val up: Boolean)
class Bar(val label: String, val week: Int, val month: Int, val year: Int)
class Slide(val title: String, val caption: String, val color: String)
class Tag(val name: String, var on: Boolean)
class Question(val title: String, val answer: String, var open: Boolean)

const val SEGMENT = 96
const val SLIDE = 240

var range = Range.Week
var selectedBar = 2
var page = 0
var accent = 0
val ACCENTS = listOf("#4f46e5", "#0d9488", "#db2777")

val metrics = listOf(
    Metric("Revenue", "$12.4k", "$48.9k", "$611k", true),
    Metric("Orders", "318", "1,204", "15,380", true),
    Metric("Refunds", "7", "31", "402", false),
    Metric("Rating", "4.8", "4.7", "4.7", true),
)

val bars = listOf(
    Bar("Mon", 42, 88, 61),
    Bar("Tue", 68, 54, 72),
    Bar("Wed", 96, 71, 80),
    Bar("Thu", 57, 100, 66),
    Bar("Fri", 83, 63, 94),
    Bar("Sat", 31, 47, 58),
    Bar("Sun", 49, 79, 43),
)

val slides = listOf(
    Slide("Spring drop", "24 new arrivals", "#4f46e5"),
    Slide("Free shipping", "On orders over \$40", "#0d9488"),
    Slide("Members", "Early access on Friday", "#db2777"),
    Slide("Clearance", "Up to 60% off", "#ea580c"),
)

val tags = listOf(
    Tag("Shoes", true),
    Tag("Outerwear", false),
    Tag("Accessories", true),
    Tag("Denim", false),
    Tag("Sale", false),
    Tag("New in", true),
    Tag("Sportswear", false),
)

val questions = listOf(
    Question("How is the layout computed?", "One flex algorithm, written once per platform, gives every target the same boxes for the same styles.", true),
    Question("What animates?", "Opacity, transforms, colours, corner radius and a box's width or height, when the style has a transition.", false),
    Question("Is there a virtual DOM?", "No. Views are built once; update() re-runs the dynamic values and touches only what changed.", false),
)

fun accentColor(): String = ACCENTS[accent % ACCENTS.size]

fun metricValue(m: Metric): String = when (range) {
    Range.Week -> m.week
    Range.Month -> m.month
    Range.Year -> m.year
}

fun barValue(b: Bar): Int = when (range) {
    Range.Week -> b.week
    Range.Month -> b.month
    Range.Year -> b.year
}

val pageStyle = Style(padding = 20, paddingBottom = 96, gap = 20, backgroundColor = "#f8fafc")
val card = css(Style(padding = 16, gap = 12, backgroundColor = "#ffffff", borderRadius = 18, shadowRadius = 16, shadowOffsetY = 6, shadowColor = "#0f172a14"))
val muted = css(Style(color = "#64748b", fontSize = 13))
val rowCss = css(Style(flexDirection = FlexDirection.Row, alignItems = Align.Center))

fun Avatar(initials: String, color: String, index: Int) = div(
    style(Style(
        width = 40, height = 40, borderRadius = 20, borderWidth = 2, borderColor = "#f8fafc", backgroundColor = color,
        alignItems = Align.Center, justifyContent = Justify.Center,
        marginLeft = if (index == 0) 0 else -12, zIndex = 10 - index,
    )),
    span(initials, style(Style(color = "#ffffff", fontSize = 13, fontWeight = FontWeight.Bold))),
)

fun Header() = div(
    rowCss,
    div(style(Style(flex = 1, gap = 2)), small("Saturday, 14 November", muted), h1("Overview", style(Style(fontSize = 30)))),
    div(
        rowCss,
        Avatar("AL", "#4f46e5", 0),
        Avatar("GH", "#0d9488", 1),
        Avatar("MH", "#db2777", 2),
        div(
            style(Style(
                position = Position.Absolute, top = -4, right = -4, width = 18, height = 18, borderRadius = 9,
                backgroundColor = "#ef4444", alignItems = Align.Center, justifyContent = Justify.Center, zIndex = 20,
            )),
            span("3", style(Style(color = "#ffffff", fontSize = 11, fontWeight = FontWeight.Bold))),
        ),
    ),
)

fun Segment(value: Range, index: Int) = div(
    style(Style(width = SEGMENT, height = 36, alignItems = Align.Center, justifyContent = Justify.Center, zIndex = 1)),
    onClick {
        range = value
        update("dashboard")
    },
    span(
        when (value) { Range.Week -> "Week"; Range.Month -> "Month"; Range.Year -> "Year" },
        style { Style(fontWeight = FontWeight.Bold, fontSize = 14, color = if (range.ordinal == index) "#0f172a" else "#64748b") },
    ),
)

fun Segments() = div(
    style(Style(flexDirection = FlexDirection.Row, padding = 4, borderRadius = 14, backgroundColor = "#e2e8f0", alignSelf = Align.FlexStart)),
    div(style {
        Style(
            position = Position.Absolute, top = 4, left = 4, width = SEGMENT, height = 36, borderRadius = 10,
            backgroundColor = "#ffffff", shadowRadius = 6, shadowOffsetY = 2, shadowColor = "#0f172a26",
            translateX = range.ordinal * SEGMENT, transitionDuration = 420, transitionEasing = Easing.Spring,
        )
    }),
    Segment(Range.Week, 0),
    Segment(Range.Month, 1),
    Segment(Range.Year, 2),
)

fun MetricCard(metric: Metric) = div(
    card,
    style(Style(flex = 1, gap = 6)),
    small(metric.label, muted),
    strong({ metricValue(metric) }, style(Style(fontSize = 24))),
    div(
        style(Style(
            alignSelf = Align.FlexStart, paddingLeft = 8, paddingRight = 8, paddingTop = 3, paddingBottom = 3,
            borderRadius = 999, backgroundColor = if (metric.up) "#dcfce7" else "#fee2e2",
        )),
        span(
            if (metric.up) "▲ up" else "▼ down",
            style(Style(fontSize = 11, fontWeight = FontWeight.Bold, color = if (metric.up) "#15803d" else "#b91c1c")),
        ),
    ),
)

fun Metrics() = div(
    style(Style(gap = 12)),
    div(style(Style(flexDirection = FlexDirection.Row, gap = 12)), MetricCard(metrics[0]), MetricCard(metrics[1])),
    div(style(Style(flexDirection = FlexDirection.Row, gap = 12)), MetricCard(metrics[2]), MetricCard(metrics[3])),
)

fun ChartBar(bar: Bar, index: Int) = div(
    style(Style(flex = 1, alignItems = Align.Center, justifyContent = Justify.FlexEnd, gap = 6)),
    onClick {
        selectedBar = index
        update("dashboard")
    },
    small({ if (selectedBar == index) "${barValue(bar)}" else "" }, style(Style(fontWeight = FontWeight.Bold, color = "#0f172a"))),
    div(style {
        Style(
            width = 22, height = barValue(bar) * 1.3, borderRadius = 7,
            backgroundColor = if (selectedBar == index) accentColor() else "#cbd5e1",
            transitionDuration = 420, transitionDelay = index * 35, transitionEasing = Easing.EaseOut,
        )
    }),
    small(bar.label, muted),
)

fun Chart() = div(
    card,
    div(rowCss, h2("Sales", style(Style(flex = 1))), small({ "per day · ${range.name.lowercase()}" }, muted)),
    div(
        style(Style(flexDirection = FlexDirection.Row, height = 190, alignItems = Align.Stretch)),
        list({ bars }) { bar, index -> ChartBar(bar, index) },
    ),
)

fun SlideCard(slide: Slide) = div(
    style(Style(width = SLIDE, aspectRatio = 1.6, borderRadius = 18, padding = 16, justifyContent = Justify.FlexEnd, gap = 2, backgroundColor = slide.color)),
    strong(slide.title, style(Style(color = "#ffffff", fontSize = 20))),
    small(slide.caption, style(Style(color = "#ffffffcc"))),
)

fun Dot(index: Int) = div(style {
    Style(
        width = if (page == index) 18 else 6, height = 6, borderRadius = 3,
        backgroundColor = if (page == index) "#0f172a" else "#cbd5e1", transitionDuration = 200,
    )
})

fun Carousel() = div(
    style(Style(gap = 10)),
    h2("Campaigns"),
    div(
        style(Style(
            flexDirection = FlexDirection.Row, gap = 12, overflow = Overflow.Scroll,
            marginLeft = -20, marginRight = -20, paddingLeft = 20, paddingRight = 20,
        )),
        onScroll { e ->
            val next = (e.scrollLeft / (SLIDE + 12)).roundToInt()
            if (next != page) {
                page = next
                update("dots")
            }
        },
        list({ slides }) { slide, _ -> SlideCard(slide) },
    ),
    div(scope("dots"), style(Style(flexDirection = FlexDirection.Row, gap = 6, justifyContent = Justify.Center)), Dot(0), Dot(1), Dot(2), Dot(3)),
)

fun TagChip(tag: Tag) = div(
    style {
        Style(
            paddingLeft = 14, paddingRight = 14, paddingTop = 8, paddingBottom = 8, borderRadius = 999, borderWidth = 1,
            borderColor = if (tag.on) accentColor() else "#cbd5e1",
            backgroundColor = if (tag.on) accentColor() else "#ffffff",
            transitionDuration = 180, pressed = Style(scale = 0.94),
        )
    },
    onClick {
        tag.on = !tag.on
        update("dashboard")
    },
    span(tag.name, style { Style(fontSize = 13, fontWeight = FontWeight.Bold, color = if (tag.on) "#ffffff" else "#334155") }),
)

fun Tags() = div(
    card,
    h2("Filters"),
    div(
        style(Style(flexDirection = FlexDirection.Row, flexWrap = FlexWrap.Wrap, gap = 8)),
        list({ tags }) { tag, _ -> TagChip(tag) },
    ),
)

fun QuestionItem(question: Question) = div(
    style { Style(height = if (question.open) 124 else 48, overflow = Overflow.Hidden, borderRadius = 12, backgroundColor = "#f1f5f9", transitionDuration = 280, transitionEasing = Easing.EaseInOut) },
    div(
        style(Style(flexDirection = FlexDirection.Row, alignItems = Align.Center, height = 48, paddingLeft = 14, paddingRight = 14)),
        onClick {
            question.open = !question.open
            update("dashboard")
        },
        strong(question.title, style(Style(flex = 1, fontSize = 14))),
        span("⌄", style { Style(fontSize = 18, color = "#64748b", rotate = if (question.open) 180 else 0, transitionDuration = 280) }),
    ),
    p(question.answer, muted, style(Style(paddingLeft = 14, paddingRight = 14, lineHeight = 19))),
)

fun Questions() = div(card, h2("Questions"), list({ questions }) { q, _ -> QuestionItem(q) })

fun App() = div(scope("dashboard"), style(pageStyle), Header(), Segments(), Metrics(), Chart(), Carousel(), Tags(), Questions())

/** A layer over the screen: touches pass through it everywhere but on the button. */
fun Floating() = div(
    div(
        style {
            Style(
                position = Position.Absolute, right = 20, bottom = 24, width = 56, height = 56, borderRadius = 28,
                alignItems = Align.Center, justifyContent = Justify.Center, backgroundColor = accentColor(),
                shadowRadius = 18, shadowOffsetY = 8, shadowColor = "#0f172a4d",
                transitionDuration = 220, pressed = Style(scale = 0.9),
            )
        },
        ariaLabel("Change the accent colour"),
        onClick {
            accent++
            update()
        },
        span("✦", style(Style(color = "#ffffff", fontSize = 22))),
    ),
)

fun main() = runApp {
    render(::App)
    render(::Floating)
}
