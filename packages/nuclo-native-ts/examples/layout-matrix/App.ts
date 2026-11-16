/**
 * Layout matrix: every flex layout the runtimes implement, one small labelled box each, so a platform that lays one
 * out differently is easy to spot. The matrix itself is responsive: 1 cell a row on a phone, 2 from 480 px,
 * 3 from 768 px, 4 from 1024 px and 6 from 1440 px.
 *
 *   Playground  direction × justify × align × wrap × gap, cycled by buttons
 *   Justify     the six justifyContent values, in a row and in a column
 *   Align       the alignItems values, and alignSelf overriding them
 *   Grow        flex weights, fixed + flexible, min / max clamping
 *   Wrap        a wrapping row with gaps, percent widths
 *   Spacing     margin and padding per side, negative margins
 *   Position    absolute corners, inset, centring, zIndex
 *   Overflow    hidden, vertical and horizontal scrolling
 *   Ratio       aspectRatio with width or height given
 *   Display     display: none, visibility: hidden
 *   Nesting     a row of columns of rows
 */
import { type Int, type Style, button, createCss, div, h1, list, render, span, update } from "../../src/index.ts";

const { css } = createCss({
  colors: { ink: "#0f172a", soft: "#64748b", line: "#cbd5e1", frame: "#f1f5f9" },
  screens: { sm: "(min-width: 480px)", md: "(min-width: 768px)", lg: "(min-width: 1024px)", xl: "(min-width: 1440px)" },
});

const COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

let direction = 0;
let justify: Int = 0;
let align: Int = 0;
let wrap = false;
let gap = 8;
let count: Int = 3;
const IDS: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const JUSTIFY = ["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"];
const ALIGN = ["stretch", "flex-start", "center", "flex-end"];

const cell = css({ width: "100%", p: 6, sm: { width: "50%" }, md: { width: "33.333%" }, lg: { width: "25%" }, xl: { width: "16.666%" } });
const label = css({ text: 11, color: "soft", fontFamily: "monospace" });
const frame = css({ bg: "frame", border: "1px dashed line", rounded: 6 });

const color = (i: Int): string => COLORS[i % COLORS.length] ?? "#6366f1";
const boxW = (i: Int): number => 36 + (i % 3) * 14;
const boxH = (i: Int): number => 28 + (i % 2) * 14;
const label1 = (i: Int): string => `${i + 1}`;
const PlayBox = (i: Int) =>
  div({ style: { w: boxW(i), h: boxH(i), bg: color(i), rounded: 4, center: true } }, span(label1(i), { style: { color: "#ffffff", text: 11, weight: 700 } }));
const NestRow = (k: Int) =>
  div({ style: { row: true, gap: 2 } }, div({ style: { flex: 1, h: 10, bg: color(k) } }), div({ style: { w: 10, h: 10, bg: color(k + 1) } }));
const NestColumn = (c: Int) => div({ style: { flex: 1, gap: 4 } }, NestRow(c), NestRow(c + 1), NestRow(c + 2));
const chip = (i: Int) => div({ style: { minWidth: 18, minHeight: 18, p: 4, bg: color(i), rounded: 4, center: true } }, span(`${i + 1}`, { style: { color: "#ffffff", text: 10, weight: 700 } }));

// One labelled box of the matrix.
const Cell = (name: string, box: Style, n: Int) =>
  div(cell, div({ style: { bg: "#ffffff", rounded: 10, p: 8, gap: 6, border: "1px solid #e2e8f0" } },
    span(name, label),
    div(frame, { style: box }, list(() => COLORS.slice(0, n), (_c, i) => chip(i))),
  ));

const Cycle = (text: () => string, onClick: () => void) =>
  button(text, { style: { px: 10, py: 6, rounded: 6, border: "1px solid line", text: 12, bg: "#ffffff" }, onClick });

const Playground = () =>
  div(
    { style: { bg: "#ffffff", rounded: 12, p: 12, gap: 10, border: "1px solid #e2e8f0" } },
    div(
      { style: { row: true, flexWrap: "wrap", gap: 6 } },
      Cycle(() => `direction: ${direction === 0 ? "row" : "column"}`, () => { direction = 1 - direction; update(); }),
      Cycle(() => `justify: ${JUSTIFY[justify] ?? ""}`, () => { justify = (justify + 1) % JUSTIFY.length; update(); }),
      Cycle(() => `align: ${ALIGN[align] ?? ""}`, () => { align = (align + 1) % ALIGN.length; update(); }),
      Cycle(() => `wrap: ${wrap ? "wrap" : "nowrap"}`, () => { wrap = !wrap; update(); }),
      Cycle(() => `gap: ${gap}`, () => { gap = gap >= 24 ? 0 : gap + 8; update(); }),
      Cycle(() => `items: ${count}`, () => { count = count >= 12 ? 1 : count + 1; update(); }),
    ),
    div(
      frame,
      {
        style: () => ({
          h: 200,
          p: 8,
          gap: gap,
          flexDirection: direction === 0 ? "row" : "column",
          flexWrap: wrap ? "wrap" : "nowrap",
          justifyContent: justify === 0 ? "flex-start" : justify === 1 ? "center" : justify === 2 ? "flex-end" : justify === 3 ? "space-between" : justify === 4 ? "space-around" : "space-evenly",
          alignItems: align === 0 ? "stretch" : align === 1 ? "flex-start" : align === 2 ? "center" : "flex-end",
          "@media (min-width: 768px)": { h: 260 },
        }),
      },
      list(() => IDS.slice(0, count), (n) => PlayBox(Math.floor(n))),
    ),
  );

// The matrix in parts: one long expression is more than Swift's type checker takes.
const JustifyCells = () =>
  div(
    { style: { row: true, flexWrap: "wrap" } },
    // justifyContent, row
    Cell("row · flex-start", { row: true, h: 44, justify: "flex-start" }, 3),
    Cell("row · center", { row: true, h: 44, justify: "center" }, 3),
    Cell("row · flex-end", { row: true, h: 44, justify: "flex-end" }, 3),
    Cell("row · space-between", { row: true, h: 44, justify: "space-between" }, 3),
    Cell("row · space-around", { row: true, h: 44, justify: "space-around" }, 3),
    Cell("row · space-evenly", { row: true, h: 44, justify: "space-evenly" }, 3),
    // justifyContent, column
    Cell("col · flex-start", { h: 110, justify: "flex-start", items: "center" }, 3),
    Cell("col · center", { h: 110, justify: "center", items: "center" }, 3),
    Cell("col · flex-end", { h: 110, justify: "flex-end", items: "center" }, 3),
    Cell("col · space-between", { h: 110, justify: "space-between", items: "center" }, 3),
    Cell("col · space-around", { h: 110, justify: "space-around", items: "center" }, 3),
    Cell("col · space-evenly", { h: 110, justify: "space-evenly", items: "center" }, 3)
  );

const AlignCells = () =>
  div(
    { style: { row: true, flexWrap: "wrap" } },
    // alignItems
    Cell("row · items stretch", { row: true, h: 60, gap: 4, items: "stretch" }, 3),
    Cell("row · items flex-start", { row: true, h: 60, gap: 4, items: "flex-start" }, 3),
    Cell("row · items center", { row: true, h: 60, gap: 4, items: "center" }, 3),
    Cell("row · items flex-end", { row: true, h: 60, gap: 4, items: "flex-end" }, 3),
    Cell("col · items stretch", { gap: 4, items: "stretch" }, 3),
    Cell("col · items center", { gap: 4, items: "center" }, 3),

    // alignSelf over alignItems
    div(cell, div({ style: { bg: "#ffffff", rounded: 10, p: 8, gap: 6, border: "1px solid #e2e8f0" } },
      span("alignSelf: start / center / end / stretch", label),
      div(frame, { style: { row: true, h: 70, gap: 4, items: "center" } },
        div({ style: { w: 24, h: 20, bg: color(0), alignSelf: "flex-start" } }),
        div({ style: { w: 24, h: 20, bg: color(1), alignSelf: "center" } }),
        div({ style: { w: 24, h: 20, bg: color(2), alignSelf: "flex-end" } }),
        div({ style: { w: 24, bg: color(3), alignSelf: "stretch" } }),
      ),
    ))
  );

const SizingCells = () =>
  div(
    { style: { row: true, flexWrap: "wrap" } },
    // flex weights
    div(cell, div({ style: { bg: "#ffffff", rounded: 10, p: 8, gap: 6, border: "1px solid #e2e8f0" } },
      span("flex 1 : 2 : 3 · fixed + flex · min / max", label),
      div(frame, { style: { row: true, h: 20 } },
        div({ style: { flex: 1, bg: color(0) } }), div({ style: { flex: 2, bg: color(1) } }), div({ style: { flex: 3, bg: color(2) } }),
      ),
      div(frame, { style: { row: true, h: 20 } },
        div({ style: { w: 40, bg: color(3) } }), div({ style: { flex: 1, bg: color(4) } }), div({ style: { w: 40, bg: color(5) } }),
      ),
      div(frame, { style: { row: true, h: 20 } },
        div({ style: { flex: 1, maxWidth: 50, bg: color(0) } }), div({ style: { flex: 1, minWidth: 120, bg: color(1) } }), div({ style: { flex: 1, bg: color(2) } }),
      ),
      div(frame, { style: { row: true, h: 20 } },
        div({ style: { flex: "1 1 0%", bg: color(3) } }), div({ style: { flexGrow: 1, bg: color(4) } }), div({ style: { flex: "2", bg: color(5) } }),
      ),
    )),

    // wrap and percent widths
    Cell("row · wrap · gap 6", { row: true, flexWrap: "wrap", gap: 6, maxWidth: 140 }, 6),
    div(cell, div({ style: { bg: "#ffffff", rounded: 10, p: 8, gap: 6, border: "1px solid #e2e8f0" } },
      span("percent widths: 25 / 50 / 75 / 100", label),
      div(frame, { style: { gap: 3 } },
        div({ style: { width: "25%", h: 10, bg: color(0) } }), div({ style: { width: "50%", h: 10, bg: color(1) } }),
        div({ style: { width: "75%", h: 10, bg: color(2) } }), div({ style: { width: "100%", h: 10, bg: color(3) } }),
      ),
      div(frame, { style: { row: true } }, div({ style: { width: "30%", h: 14, bg: color(4) } }), div({ style: { width: "70%", h: 14, bg: color(5) } })),
    )),

    // spacing
    div(cell, div({ style: { bg: "#ffffff", rounded: 10, p: 8, gap: 6, border: "1px solid #e2e8f0" } },
      span("margin / padding per side · negative margin", label),
      div(frame, { style: { row: true, items: "flex-start" } },
        div({ style: { mt: 4, ml: 16, mb: 12, mr: 4, pt: 2, pl: 10, pb: 6, pr: 2, bg: color(0) } }, div({ style: { size: 12, bg: "#ffffff" } })),
        div({ style: { m: 8, p: 8, bg: color(1) } }, div({ style: { size: 12, bg: "#ffffff" } })),
        div({ style: { mx: 4, my: 12, px: 12, py: 2, bg: color(2) } }, div({ style: { size: 12, bg: "#ffffff" } })),
      ),
      div(frame, { style: { row: true, p: 8 } },
        list(() => [0, 1, 2, 3, 4], (i) =>
          div({ style: { size: 28, rounded: 14, bg: color(i), border: "2px solid #ffffff", ml: i === 0 ? 0 : -10, zIndex: 5 - i } }),
        ),
      ),
    ))
  );

const PlacementCells = () =>
  div(
    { style: { row: true, flexWrap: "wrap" } },
    // absolute positioning
    div(cell, div({ style: { bg: "#ffffff", rounded: 10, p: 8, gap: 6, border: "1px solid #e2e8f0" } },
      span("absolute corners · centred · inset", label),
      div(frame, { style: { h: 110 } },
        div({ style: { position: "absolute", top: 4, left: 4, size: 20, bg: color(0) } }),
        div({ style: { position: "absolute", top: 4, right: 4, size: 20, bg: color(1) } }),
        div({ style: { position: "absolute", bottom: 4, left: 4, size: 20, bg: color(2) } }),
        div({ style: { position: "absolute", bottom: 4, right: 4, size: 20, bg: color(3) } }),
        div({ style: { position: "absolute", inset: 30, bg: "#e0e7ff", rounded: 6, center: true } }, div({ style: { size: 16, bg: color(4), rounded: 8 } })),
      ),
    )),
    div(cell, div({ style: { bg: "#ffffff", rounded: 10, p: 8, gap: 6, border: "1px solid #e2e8f0" } },
      span("zIndex: 3 over 2 over 1 (written 1, 3, 2)", label),
      div(frame, { style: { h: 110 } },
        div({ style: { position: "absolute", top: 10, left: 10, size: 60, bg: color(0), zIndex: 1, center: true } }, span("1", { style: { color: "#ffffff" } })),
        div({ style: { position: "absolute", top: 40, left: 70, size: 60, bg: color(4), zIndex: 3, center: true } }, span("3", { style: { color: "#ffffff" } })),
        div({ style: { position: "absolute", top: 25, left: 40, size: 60, bg: color(2), zIndex: 2, center: true } }, span("2", { style: { color: "#ffffff" } })),
      ),
    ))
  );

const OtherCells = () =>
  div(
    { style: { row: true, flexWrap: "wrap" } },
    // overflow
    div(cell, div({ style: { bg: "#ffffff", rounded: 10, p: 8, gap: 6, border: "1px solid #e2e8f0" } },
      span("overflow hidden · scroll y · scroll x", label),
      div(frame, { style: { h: 40, overflow: "hidden", rounded: 20 } }, div({ style: { w: 400, h: 80, bg: color(5) } })),
      div(frame, { style: { h: 70, overflow: "scroll", gap: 4, p: 4 } },
        list(() => [0, 1, 2, 3, 4, 5, 6, 7], (i) => div({ style: { h: 16, bg: color(i), rounded: 3 } })),
      ),
      div(frame, { style: { row: true, overflow: "scroll", gap: 4, p: 4 } },
        list(() => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], (i) => div({ style: { w: 50, h: 30, bg: color(i), rounded: 3 } })),
      ),
    )),

    // aspect ratio
    div(cell, div({ style: { bg: "#ffffff", rounded: 10, p: 8, gap: 6, border: "1px solid #e2e8f0" } },
      span("aspectRatio 1 · 16/9 · 3/4 · from height", label),
      div(frame, { style: { row: true, gap: 6, items: "flex-start", p: 6 } },
        div({ style: { w: 40, aspectRatio: 1, bg: color(0) } }),
        div({ style: { w: 64, aspectRatio: "16 / 9", bg: color(1) } }),
        div({ style: { w: 36, aspectRatio: "3/4", bg: color(2) } }),
        div({ style: { h: 30, aspectRatio: 2, bg: color(3) } }),
      ),
    )),
  );

const MoreCells = () =>
  div(
    { style: { row: true, flexWrap: "wrap" } },
  // display and visibility
    div(cell, div({ style: { bg: "#ffffff", rounded: 10, p: 8, gap: 6, border: "1px solid #e2e8f0" } },
      span("2 display:none · 4 visibility:hidden", label),
      div(frame, { style: { row: true, gap: 4, p: 4 } },
        chip(0), div({ style: { display: "none" } }, chip(1)), chip(2), div({ style: { visibility: "hidden" } }, chip(3)), chip(4),
      ),
    )),

    // nesting
    div(cell, div({ style: { bg: "#ffffff", rounded: 10, p: 8, gap: 6, border: "1px solid #e2e8f0" } },
      span("row › columns › rows", label),
      div(frame, { style: { row: true, gap: 4, p: 4 } },
        NestColumn(0), NestColumn(1), NestColumn(2),
      ),
    ))
  );

const App = () =>
  div(
    { style: { p: 12, gap: 12, "@media (min-width: 768px)": { p: 20 } } },
    h1("Layout matrix", css({ text: 22, weight: 800, md: { text: 28 } })),
    Playground(),
    div(
      { style: { margin: -6 } },
      JustifyCells(),
      AlignCells(),
      SizingCells(),
      PlacementCells(),
      OtherCells(),
      MoreCells(),
    ),
  );

render(App);
