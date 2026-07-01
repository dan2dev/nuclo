// cx(): compose styles/strings/conditionals/arrays with exact, last-wins
// conflict resolution. Because the engine records what every atom means, the
// overridden declaration's atom is dropped — no specificity guesswork.
import { css, cx } from "../theme.ts";
import { card, feature, s } from "../ui.ts";

const chip = css({ py: 10, px: 16, rounded: "md", text: 13, weight: 600, align: "center", color: "#fff" });
const base = css({ py: 10, px: 16, rounded: "md", text: 13, weight: 600, bg: "surfaceMuted", color: "text", border: "1px solid", borderColor: "border", cursor: "pointer" });
const active = css({ bg: "primary", color: "#fff", borderColor: "primary" });

// Interactive: the button's className is a reactive function returning a cx() result.
let isActive = false;

export const composeSection = feature(
  "cx() — composition",
  "cx() merges inputs with last-wins conflict resolution, skips falsy values for conditionals, flattens nested arrays, and passes through external class strings.",
  div(
    s.grid,
    card(
      "last wins  ·  cx(danger, primary)",
      div(cx(css({ ...chip, bg: "danger" }), css({ bg: "primary" })), "primary wins"),
    ),
    card(
      "conditional  ·  cx(base, isActive && active)",
      button(
        () => cx(base, isActive && active),
        () => (isActive ? "active" : "click to toggle"),
        on("click", () => { isActive = !isActive; update(); }),
      ),
    ),
    card(
      "nested arrays  ·  cx([a, false && b], c)",
      div(cx([base, false && active], css({ tracking: "0.06em" })), "arrays flatten"),
    ),
    card(
      'external classes  ·  cx("plain-class", base)',
      div(cx("plain-class", base), "+ external string"),
    ),
  ),
);
