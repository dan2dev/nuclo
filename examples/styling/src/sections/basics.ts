// Properties, value coercion, Tailwind-style aliases, and composite utilities.
import { css, cx } from "../theme.ts";
import { card, feature, s } from "../ui.ts";

const tile = css({ bg: "primary", color: "#fff", rounded: "sm", py: 10, px: 12, text: 13, align: "center" });
const muted = css({ bg: "surfaceMuted", border: "1px solid", borderColor: "border", rounded: "sm", p: 12, text: 13 });

export const basicsSection = feature(
  "Properties, values & aliases",
  "camelCase properties convert to kebab-case; bare numbers become px, except unitless properties (opacity, zIndex, lineHeight, flex…); Tailwind-style aliases (p, px, w, text, weight…) sit beside plain CSS.",
  div(
    s.grid,
    card(
      "camelCase → kebab-case",
      div(css({ backgroundColor: "surfaceMuted", textAlign: "center", borderRadius: 8, padding: 12, borderBottom: "2px solid #6366f1" }), "backgroundColor, textAlign"),
    ),
    card(
      "number → px  ·  p:16 w:130",
      div(cx(tile, css({ p: 16, w: 130 })), "16px padding"),
    ),
    card(
      "unitless  ·  opacity:0.55 leading:1.6",
      div(cx(muted, css({ opacity: 0.55, leading: 1.6 })), "stays unitless"),
    ),
    card(
      "spacing aliases  ·  px/py/mx",
      div(cx(tile, css({ px: 20, py: 6, mx: "auto", w: "fit-content" })), "px:20 py:6"),
    ),
    card(
      "sizing aliases  ·  size:56 rounded:pill",
      div(css({ size: 56, rounded: "pill", bg: "accent" })),
    ),
    card(
      "typography  ·  text/weight/tracking",
      div(css({ text: 18, weight: 700, tracking: "0.06em", textTransform: "uppercase", color: "accent" }), "Nuclo"),
    ),
  ),
);

export const compositesSection = feature(
  "Composite utilities",
  "Boolean shorthands expand to several declarations: row/col set display:flex + direction, center sets align+justify, truncate clips overflowing text with an ellipsis.",
  div(
    s.grid,
    card("row: true  (+ items/justify)", div(cx(muted, css({ row: true, items: "center", justify: "space-between" })), span("left"), span("right"))),
    card("col: true  ·  gap:6", div(cx(muted, css({ col: true, gap: 6 })), span("top"), span("bottom"))),
    card("center: true", div(cx(muted, css({ center: true, h: 70 })), span("centered"))),
    card("truncate: true", div(cx(muted, css({ truncate: true, w: 150 })), "this text is far too long to fit and will be clipped")),
  ),
);
