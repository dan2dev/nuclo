// Nested variants: pseudo-classes/elements, responsive screens, combinations,
// arbitrary selectors, inline at-rules, and the raw escape hatch. Every variant
// key nests recursively, so md:{ hover:{ … } } and dark:{ … } compose freely.
import { css, cx } from "../theme.ts";
import { card, feature, s } from "../ui.ts";

const btn = css({
  py: 10, px: 16, rounded: "md", border: "none", weight: 600, text: 13,
  color: "#fff", bg: "primary", cursor: "pointer",
  transition: "background-color .15s, transform .1s, box-shadow .15s",
});

export const pseudoSection = feature(
  "Pseudo-classes & elements",
  "hover, focus, focusVisible, active, disabled, before, after, placeholder, and more nest as typed keys inside a style object.",
  div(
    s.grid,
    card("hover + active", button(cx(btn, css({ hover: { bg: "primaryHover" }, active: { transform: "translateY(1px)" } })), "hover me")),
    card("focus (ring)", input({ placeholder: "focus me" }, css({ py: 10, px: 12, rounded: "md", bg: "surface", color: "text", border: "1px solid", borderColor: "border", outline: "none", focus: { borderColor: "primary", shadow: "glow" } }))),
    card("::placeholder", input({ placeholder: "muted placeholder" }, css({ py: 10, px: 12, rounded: "md", bg: "surface", color: "text", border: "1px solid", borderColor: "border", placeholder: { color: "textMuted", fontStyle: "italic" } }))),
    card("disabled", button({ disabled: true }, cx(btn, css({ disabled: { bg: "surfaceMuted", color: "textMuted", cursor: "not-allowed" } })), "disabled")),
    card("::before + ::after", span(css({ color: "accent", weight: 600, before: { content: "'‹ '" }, after: { content: "' ›'" } }), "decorated")),
    card("::selection", p(css({ text: 13, color: "textDim", selection: { bg: "accent", color: "#04121a" } }), "select this text to see ::selection")),
  ),
);

export const responsiveSection = feature(
  "Responsive screens & combinations",
  "screens declared in the theme become typed variant keys. Resize the window: this tile restyles at sm/md/lg. Screens nest with pseudo-classes, and nested @media conditions combine with `and`.",
  div(
    s.grid,
    card("base → sm → md → lg", div(cx(btn, css({ bg: "textMuted", sm: { bg: "warning" }, md: { bg: "primary" }, lg: { bg: "accent" } })), "resize me")),
    card("md:{ hover:{ … } }", button(cx(btn, css({ bg: "surfaceMuted", color: "text", md: { hover: { bg: "primary", color: "#fff" } } })), "hover ≥768px")),
    card("md:{ dark:{ … } }  → combined @media … and …", div(cx(btn, css({ bg: "surfaceMuted", color: "text", md: { dark: { bg: "accent", color: "#04121a" } } })), "wide + dark")),
  ),
);

// Arbitrary "&" selectors target the element itself, its children, or siblings.
const rows = css({
  bg: "surface", rounded: "md", border: "1px solid", borderColor: "border", overflow: "hidden",
  "& > div": { py: 8, px: 12, text: 13, color: "textDim" },
  "& > div:nth-child(even)": { bg: "surfaceMuted" },
  "& > div:first-child": { color: "accent", weight: 600 },
});

export const selectorsSection = feature(
  "Selectors, at-rules & raw",
  'Arbitrary selectors ("& > div", "&:nth-child(2)"), inline at-rules ("@media", "@supports", "@container"), and a raw escape hatch for custom properties and vendor-prefixed declarations.',
  div(
    s.grid,
    card(
      '"& > div", ":nth-child(even)", ":first-child"',
      div(rows, div("first (accent)"), div("second"), div("third"), div("fourth")),
    ),
    card(
      "inline @supports",
      div(css({ p: 14, rounded: "md", bg: "surfaceMuted", text: 13, color: "textDim", "@supports (backdrop-filter: blur(2px))": { backdropFilter: "blur(2px)", color: "accent" } }), "@supports backdrop-filter"),
    ),
    card(
      "inline @media",
      div(css({ p: 14, rounded: "md", bg: "surfaceMuted", text: 13, color: "textDim", "@media (min-width: 900px)": { bg: "primary", color: "#fff" } }), "@media ≥900px"),
    ),
    card(
      "raw: custom props + vendor prefix",
      div(css({ p: 14, rounded: "md", text: 18, weight: 800, raw: { "--stroke": "#14b8a6", "-webkit-text-stroke": "0.6px var(--stroke)", color: "transparent" } }), "outlined"),
    ),
  ),
);
