// Theme tokens: color / font / shadow / radius names resolve against the
// createCss() theme and autocomplete at the call site. Raw values (hex, rgb,
// gradients, stacks) still pass through unchanged.
import { css } from "../theme.ts";
import { card, feature, s } from "../ui.ts";

const chip = css({ py: 10, px: 14, rounded: "md", text: 13, weight: 600, color: "#fff" });

export const tokensSection = feature(
  "Theme tokens",
  "colors (bg, color, borderColor, …), fonts (font), shadows (shadow) and radii (rounded) accept token names from the theme — or any raw CSS value.",
  div(
    s.grid,
    card('color tokens  ·  bg:"primary"', div(css({ ...chip, bg: "primary" }), "primary")),
    card('bg:"accent"  color:"#fff"', div(css({ ...chip, bg: "accent" }), "accent")),
    card('bg:"danger"', div(css({ ...chip, bg: "danger" }), "danger")),
    card('borderColor token  ·  border:"primary"', div(css({ p: 12, rounded: "md", border: "2px solid", borderColor: "primary", color: "textDim", text: 13 }), 'borderColor: "primary"')),
    card('font token  ·  font:"mono"', div(css({ font: "mono", bg: "surfaceMuted", p: 12, rounded: "sm", text: 13 }), "const x = 42")),
    card('shadow token  ·  shadow:"glow"', div(css({ bg: "surfaceMuted", p: 16, rounded: "md", shadow: "glow", text: 13 }), 'shadow: "glow"')),
    card('radius token  ·  rounded:"lg"', div(css({ bg: "primary", size: 60, rounded: "lg" }))),
    card("raw values still allowed  ·  gradient + rounded:20", div(css({ backgroundImage: "linear-gradient(135deg,#6366f1,#14b8a6)", p: 16, rounded: 20, color: "#fff", text: 13, weight: 600 }), "raw gradient")),
  ),
);
