/**
 * `progress` and `meter`: bars drawn the same on every platform. `value` follows the state through
 * a function; `meter` colors its fill by `low`, `high` and `optimum` as HTML does.
 */
import { type Style, button, div, h1, h2, meter, p, progress, render, small, update } from "../../src/index.ts";

let done = 30;

const card: Style = { padding: 16, gap: 8, borderRadius: 12, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0" };
const row: Style = { flexDirection: "row", alignItems: "center", gap: 12 };

const App = () =>
  div(
    { style: { padding: 24, gap: 16, backgroundColor: "#f8fafc" } },
    h1("Gauges"),
    div(
      { style: card },
      h2("Progress"),
      progress({ value: 0.5 }),
      progress({ value: () => done, max: 100, style: { width: "100%" } }),
      p(() => `${done}%`),
      div({ style: row }, button("−10", { onClick: () => { done = Math.max(0, done - 10); update(); } }), button("+10", { onClick: () => { done = Math.min(100, done + 10); update(); } })),
      small("No value: an empty track"),
      progress(),
    ),
    div(
      { style: card },
      h2("Meter · best value is low"),
      div({ style: row }, meter({ value: 10, max: 100, low: 33, high: 66, optimum: 0 }), small("10")),
      div({ style: row }, meter({ value: 50, max: 100, low: 33, high: 66, optimum: 0 }), small("50")),
      div({ style: row }, meter({ value: 90, max: 100, low: 33, high: 66, optimum: 0 }), small("90")),
    ),
    div(
      { style: card },
      h2("Meter · best value is in the middle"),
      div({ style: row }, meter({ value: 20, max: 100, low: 33, high: 66, optimum: 50 }), small("20")),
      div({ style: row }, meter({ value: 50, max: 100, low: 33, high: 66, optimum: 50 }), small("50")),
    ),
    div(
      { style: card },
      h2("Meter · best value is high"),
      div({ style: row }, meter({ value: 10, max: 100, low: 33, high: 66, optimum: 100 }), small("10")),
      div({ style: row }, meter({ value: 50, max: 100, low: 33, high: 66, optimum: 100 }), small("50")),
      div({ style: row }, meter({ value: () => done, max: 100, low: 33, high: 66, optimum: 100 }), small(() => `${done}, follows the buttons`)),
    ),
  );

render(App);
