/** Percent widths: a share of the parent's width, fixed or following a value. */
import { button, div, p, render, update } from "../../src/index.ts";

let value = 30;


const App = () =>
  div(
    { style: { p: 24, gap: 12 } },
    p("25%"),
    div({ style: { height: 16, borderRadius: 8, bg: "#e2e8f0" } }, div({ style: { width: "25%", height: 16, borderRadius: 8, bg: "#4f46e5" } })),
    p("100%"),
    div({ style: { height: 16, borderRadius: 8, bg: "#e2e8f0" } }, div({ style: { width: "100%", height: 16, borderRadius: 8, bg: "#4f46e5" } })),
    p(() => `${value}%`),
    div({ style: { height: 16, borderRadius: 8, bg: "#e2e8f0" } }, div({ style: () => ({ width: `${value}%`, height: 16, borderRadius: 8, bg: "#16a34a" }) })),
    button("+10", { onClick: () => { value = value >= 100 ? 0 : value + 10; update(); } }),
    p("in a row, two halves"),
    div({ style: { row: true } }, div({ style: { width: "50%", height: 24, bg: "#f97316" } }), div({ style: { width: "50%", height: 24, bg: "#0ea5e9" } })),
  );

render(App);
