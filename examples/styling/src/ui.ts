// Shared layout chrome for the showcase page. These styles are themselves
// built with css(), so the page dogfoods the system it demonstrates.
import { css, globalStyle } from "./theme.ts";

// globalStyle(): unscoped rules for resets / element defaults. Deduped by
// content, injected once. (See also the Animations section.)
globalStyle("*", { boxSizing: "border-box" });
globalStyle("body", {
  m: 0,
  font: "body",
  bg: "bg",
  color: "text",
  lineHeight: 1.5,
  raw: { "-webkit-font-smoothing": "antialiased" },
});
globalStyle("h1, h2, h3", { m: 0, lineHeight: 1.2 });
globalStyle("code", { font: "mono" });

export const s = {
  page: css({ maxW: 1040, mx: "auto", px: 20, py: 40 }),

  pageTitle: css({ text: 34, weight: 800, mb: 6, letterSpacing: "-0.02em" }),
  pageLead: css({ text: 17, color: "textDim", mb: 12, maxW: 720 }),

  sectionBox: css({
    bg: "surface",
    border: "1px solid",
    borderColor: "border",
    rounded: "lg",
    p: 24,
    my: 20,
    shadow: "card",
  }),
  sectionTitle: css({ text: 20, weight: 700, mb: 4, color: "text" }),
  sectionDesc: css({ text: 14, color: "textDim", mb: 18, maxW: 760 }),

  // Auto-fitting grid of demo cards.
  grid: css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 14,
  }),

  demoCard: css({
    bg: "surfaceMuted",
    border: "1px solid",
    borderColor: "border",
    rounded: "md",
    p: 14,
    col: true,
    gap: 10,
  }),

  caption: css({ text: 12, color: "textMuted", font: "mono" }),
};

// A titled panel: heading + description + a body node (usually a grid of cards).
export function feature(title: string, description: string, content: NodeModLike<"div">) {
  return section(s.sectionBox, h2(s.sectionTitle, title), p(s.sectionDesc, description), content);
}

// A single demo tile: a monospace caption above one or more demo children.
export function card(caption: string, ...children: NodeModLike<"div">[]) {
  return div(s.demoCard, span(s.caption, caption), ...children);
}
