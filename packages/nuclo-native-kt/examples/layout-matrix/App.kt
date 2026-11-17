package app

import nuclo.*

/*
 * Layout matrix: every flex layout the runtimes implement, one small labelled box each. The matrix is responsive:
 * 1 cell a row on a phone, 2 from 480 px, 3 from 768 px, 4 from 1024 px and 6 from 1440 px.
 */

const val INK = "#0f172a"
const val SOFT = "#64748b"
const val LINE = "#cbd5e1"
const val FRAME = "#f1f5f9"
const val WHITE = "#ffffff"
const val CARD_LINE = "#e2e8f0"

val COLORS = listOf("#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899")

var dirIx = 0
var justIx = 0
var alignIx = 0
var wrapOn = false
var gapPx = 8
var count = 3
val IDS = (0..11).toList()

val JUSTIFY = listOf("flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly")
val JUSTIFY_VALUES = listOf(Justify.FlexStart, Justify.Center, Justify.FlexEnd, Justify.SpaceBetween, Justify.SpaceAround, Justify.SpaceEvenly)
val ALIGN = listOf("stretch", "flex-start", "center", "flex-end")
val ALIGN_VALUES = listOf(Align.Stretch, Align.FlexStart, Align.Center, Align.FlexEnd)

val cell = css(Style(
    widthPct = 100, p = 6,
    media = listOf(
        minWidth(480, Style(widthPct = 50)),
        minWidth(768, Style(widthPct = 33.333)),
        minWidth(1024, Style(widthPct = 25)),
        minWidth(1440, Style(widthPct = 16.666)),
    ),
))
val labelStyle = css(Style(text = 11, color = SOFT, font = "monospace"))
// the dashed border becomes a solid one
val frame = css(Style(bg = FRAME, rounded = 6, borderWidth = 1, borderColor = LINE))
val card = Style(bg = WHITE, rounded = 10, p = 8, gap = 6, borderWidth = 1, borderColor = CARD_LINE)
val matrixRow = Style(row = true, flexWrap = FlexWrap.Wrap)

fun color(i: Int): String = COLORS[i % COLORS.size]
fun boxW(i: Int): Int = 36 + (i % 3) * 14
fun boxH(i: Int): Int = 28 + (i % 2) * 14

fun playBox(i: Int) =
    div(style(Style(w = boxW(i), h = boxH(i), bg = color(i), rounded = 4, center = true)),
        span("${i + 1}", style(Style(color = WHITE, text = 11, weight = FontWeight.Bold))))

fun nestRow(k: Int) =
    div(style(Style(row = true, gap = 2)),
        div(style(Style(flex = 1, h = 10, bg = color(k)))),
        div(style(Style(w = 10, h = 10, bg = color(k + 1)))))

fun nestColumn(c: Int) = div(style(Style(flex = 1, gap = 4)), nestRow(c), nestRow(c + 1), nestRow(c + 2))

fun chip(i: Int) =
    div(style(Style(minWidth = 18, minHeight = 18, p = 4, bg = color(i), rounded = 4, center = true)),
        span("${i + 1}", style(Style(color = WHITE, text = 10, weight = FontWeight.Bold))))

// One labelled box of the matrix.
fun cellOf(name: String, box: Style, n: Int) =
    div(cell, div(style(card),
        span(name, labelStyle),
        div(frame, style(box), list({ COLORS.take(n) }) { _, i -> chip(i) }),
    ))

// A cell holding a custom body under a label.
fun cellBody(name: String, vararg body: Node) =
    div(cell, div(style(card), span(name, labelStyle), *body))

fun cycle(text: () -> String, action: () -> Unit) =
    button(text, onClick { action(); update() },
        style(Style(px = 10, py = 6, rounded = 6, borderWidth = 1, borderColor = LINE, text = 12, bg = WHITE)))

fun playground() =
    div(
        style(Style(bg = WHITE, rounded = 12, p = 12, gap = 10, borderWidth = 1, borderColor = CARD_LINE)),
        div(
            style(Style(row = true, flexWrap = FlexWrap.Wrap, gap = 6)),
            cycle({ "direction: ${if (dirIx == 0) "row" else "column"}" }) { dirIx = 1 - dirIx },
            cycle({ "justify: ${JUSTIFY[justIx]}" }) { justIx = (justIx + 1) % JUSTIFY.size },
            cycle({ "align: ${ALIGN[alignIx]}" }) { alignIx = (alignIx + 1) % ALIGN.size },
            cycle({ "wrap: ${if (wrapOn) "wrap" else "nowrap"}" }) { wrapOn = !wrapOn },
            cycle({ "gap: $gapPx" }) { gapPx = if (gapPx >= 24) 0 else gapPx + 8 },
            cycle({ "items: $count" }) { count = if (count >= 12) 1 else count + 1 },
        ),
        div(
            frame,
            style {
                Style(
                    h = 200, p = 8, gap = gapPx,
                    flexDirection = if (dirIx == 0) FlexDirection.Row else FlexDirection.Column,
                    flexWrap = if (wrapOn) FlexWrap.Wrap else FlexWrap.Nowrap,
                    justifyContent = JUSTIFY_VALUES[justIx],
                    alignItems = ALIGN_VALUES[alignIx],
                    media = listOf(minWidth(768, Style(h = 260))),
                )
            },
            list({ IDS.take(count) }) { n, _ -> playBox(n) },
        ),
    )

fun justifyCells() = div(
    style(matrixRow),
    // justifyContent, row
    cellOf("row · flex-start", Style(row = true, h = 44, justify = Justify.FlexStart), 3),
    cellOf("row · center", Style(row = true, h = 44, justify = Justify.Center), 3),
    cellOf("row · flex-end", Style(row = true, h = 44, justify = Justify.FlexEnd), 3),
    cellOf("row · space-between", Style(row = true, h = 44, justify = Justify.SpaceBetween), 3),
    cellOf("row · space-around", Style(row = true, h = 44, justify = Justify.SpaceAround), 3),
    cellOf("row · space-evenly", Style(row = true, h = 44, justify = Justify.SpaceEvenly), 3),
    // justifyContent, column
    cellOf("col · flex-start", Style(h = 110, justify = Justify.FlexStart, items = Align.Center), 3),
    cellOf("col · center", Style(h = 110, justify = Justify.Center, items = Align.Center), 3),
    cellOf("col · flex-end", Style(h = 110, justify = Justify.FlexEnd, items = Align.Center), 3),
    cellOf("col · space-between", Style(h = 110, justify = Justify.SpaceBetween, items = Align.Center), 3),
    cellOf("col · space-around", Style(h = 110, justify = Justify.SpaceAround, items = Align.Center), 3),
    cellOf("col · space-evenly", Style(h = 110, justify = Justify.SpaceEvenly, items = Align.Center), 3),
)

fun alignCells() = div(
    style(matrixRow),
    // alignItems
    cellOf("row · items stretch", Style(row = true, h = 60, gap = 4, items = Align.Stretch), 3),
    cellOf("row · items flex-start", Style(row = true, h = 60, gap = 4, items = Align.FlexStart), 3),
    cellOf("row · items center", Style(row = true, h = 60, gap = 4, items = Align.Center), 3),
    cellOf("row · items flex-end", Style(row = true, h = 60, gap = 4, items = Align.FlexEnd), 3),
    cellOf("col · items stretch", Style(gap = 4, items = Align.Stretch), 3),
    cellOf("col · items center", Style(gap = 4, items = Align.Center), 3),
    // alignSelf over alignItems
    cellBody("alignSelf: start / center / end / stretch",
        div(frame, style(Style(row = true, h = 70, gap = 4, items = Align.Center)),
            div(style(Style(w = 24, h = 20, bg = color(0), alignSelf = Align.FlexStart))),
            div(style(Style(w = 24, h = 20, bg = color(1), alignSelf = Align.Center))),
            div(style(Style(w = 24, h = 20, bg = color(2), alignSelf = Align.FlexEnd))),
            div(style(Style(w = 24, bg = color(3), alignSelf = Align.Stretch))),
        )),
)

fun sizingCells() = div(
    style(matrixRow),
    // flex weights
    cellBody("flex 1 : 2 : 3 · fixed + flex · min / max",
        div(frame, style(Style(row = true, h = 20)),
            div(style(Style(flex = 1, bg = color(0)))), div(style(Style(flex = 2, bg = color(1)))), div(style(Style(flex = 3, bg = color(2))))),
        div(frame, style(Style(row = true, h = 20)),
            div(style(Style(w = 40, bg = color(3)))), div(style(Style(flex = 1, bg = color(4)))), div(style(Style(w = 40, bg = color(5))))),
        div(frame, style(Style(row = true, h = 20)),
            div(style(Style(flex = 1, maxWidth = 50, bg = color(0)))), div(style(Style(flex = 1, minWidth = 120, bg = color(1)))), div(style(Style(flex = 1, bg = color(2))))),
        div(frame, style(Style(row = true, h = 20)),
            div(style(Style(flex = 1, bg = color(3)))), div(style(Style(flex = 1, bg = color(4)))), div(style(Style(flex = 2, bg = color(5))))),
    ),
    // wrap and percent widths
    cellOf("row · wrap · gap 6", Style(row = true, flexWrap = FlexWrap.Wrap, gap = 6, maxWidth = 140), 6),
    cellBody("percent widths: 25 / 50 / 75 / 100",
        div(frame, style(Style(gap = 3)),
            div(style(Style(widthPct = 25, h = 10, bg = color(0)))), div(style(Style(widthPct = 50, h = 10, bg = color(1)))),
            div(style(Style(widthPct = 75, h = 10, bg = color(2)))), div(style(Style(widthPct = 100, h = 10, bg = color(3))))),
        div(frame, style(Style(row = true)),
            div(style(Style(widthPct = 30, h = 14, bg = color(4)))), div(style(Style(widthPct = 70, h = 14, bg = color(5))))),
    ),
    // spacing
    cellBody("margin / padding per side · negative margin",
        div(frame, style(Style(row = true, items = Align.FlexStart)),
            div(style(Style(mt = 4, ml = 16, mb = 12, mr = 4, pt = 2, pl = 10, pb = 6, pr = 2, bg = color(0))), div(style(Style(size = 12, bg = WHITE)))),
            div(style(Style(m = 8, p = 8, bg = color(1))), div(style(Style(size = 12, bg = WHITE)))),
            div(style(Style(mx = 4, my = 12, px = 12, py = 2, bg = color(2))), div(style(Style(size = 12, bg = WHITE)))),
        ),
        div(frame, style(Style(row = true, p = 8)),
            list({ listOf(0, 1, 2, 3, 4) }) { i, _ ->
                div(style(Style(size = 28, rounded = 14, bg = color(i), borderWidth = 2, borderColor = WHITE,
                    ml = if (i == 0) 0 else -10, zIndex = 5 - i)))
            },
        ),
    ),
)

fun placementCells() = div(
    style(matrixRow),
    // absolute positioning (no `inset` key: the centred box spells out its four sides)
    cellBody("absolute corners · centred · inset",
        div(frame, style(Style(h = 110)),
            div(style(Style(position = Position.Absolute, top = 4, left = 4, size = 20, bg = color(0)))),
            div(style(Style(position = Position.Absolute, top = 4, right = 4, size = 20, bg = color(1)))),
            div(style(Style(position = Position.Absolute, bottom = 4, left = 4, size = 20, bg = color(2)))),
            div(style(Style(position = Position.Absolute, bottom = 4, right = 4, size = 20, bg = color(3)))),
            div(style(Style(position = Position.Absolute, top = 30, right = 30, bottom = 30, left = 30, bg = "#e0e7ff", rounded = 6, center = true)),
                div(style(Style(size = 16, bg = color(4), rounded = 8)))),
        )),
    cellBody("zIndex: 3 over 2 over 1 (written 1, 3, 2)",
        div(frame, style(Style(h = 110)),
            div(style(Style(position = Position.Absolute, top = 10, left = 10, size = 60, bg = color(0), zIndex = 1, center = true)),
                span("1", style(Style(color = WHITE)))),
            div(style(Style(position = Position.Absolute, top = 40, left = 70, size = 60, bg = color(4), zIndex = 3, center = true)),
                span("3", style(Style(color = WHITE)))),
            div(style(Style(position = Position.Absolute, top = 25, left = 40, size = 60, bg = color(2), zIndex = 2, center = true)),
                span("2", style(Style(color = WHITE)))),
        )),
)

fun otherCells() = div(
    style(matrixRow),
    // overflow
    cellBody("overflow hidden · scroll y · scroll x",
        div(frame, style(Style(h = 40, overflow = Overflow.Hidden, rounded = 20)), div(style(Style(w = 400, h = 80, bg = color(5))))),
        div(frame, style(Style(h = 70, overflow = Overflow.Scroll, gap = 4, p = 4)),
            list({ (0..7).toList() }) { i, _ -> div(style(Style(h = 16, bg = color(i), rounded = 3))) }),
        div(frame, style(Style(row = true, overflow = Overflow.Scroll, gap = 4, p = 4)),
            list({ (0..9).toList() }) { i, _ -> div(style(Style(w = 50, h = 30, bg = color(i), rounded = 3))) }),
    ),
    // aspect ratio
    cellBody("aspectRatio 1 · 16/9 · 3/4 · from height",
        div(frame, style(Style(row = true, gap = 6, items = Align.FlexStart, p = 6)),
            div(style(Style(w = 40, aspectRatio = 1, bg = color(0)))),
            div(style(Style(w = 64, aspectRatio = 16.0 / 9, bg = color(1)))),
            div(style(Style(w = 36, aspectRatio = 3.0 / 4, bg = color(2)))),
            div(style(Style(h = 30, aspectRatio = 2, bg = color(3)))),
        )),
)

fun moreCells() = div(
    style(matrixRow),
    // display (out of scope: `visibility: hidden` does not exist, so that chip is dropped)
    cellBody("2 display:none",
        div(frame, style(Style(row = true, gap = 4, p = 4)),
            chip(0), div(style(Style(display = Display.None)), chip(1)), chip(2), chip(4),
        )),
    // nesting
    cellBody("row › columns › rows",
        div(frame, style(Style(row = true, gap = 4, p = 4)),
            nestColumn(0), nestColumn(1), nestColumn(2),
        )),
)

fun App() = div(
    style(Style(p = 12, gap = 12, media = listOf(minWidth(768, Style(p = 20))))),
    h1("Layout matrix", style(Style(text = 22, weight = FontWeight.Bold, media = listOf(minWidth(768, Style(text = 28)))))),
    playground(),
    div(
        style(Style(margin = -6)),
        justifyCells(),
        alignCells(),
        sizingCells(),
        placementCells(),
        otherCells(),
        moreCells(),
    ),
)

fun main() = runApp { render(::App) }
