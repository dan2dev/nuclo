// Shared chrome. Isomorphic: these styles are registered on the server too,
// so the HTML arrives already styled and there is no flash before hydration.
import { css, globalStyle } from "./theme.ts";

globalStyle("*", { boxSizing: "border-box" });
globalStyle("body", { m: 0, font: "body", bg: "bg", color: "text", lineHeight: 1.5 });
globalStyle("h1, h2, h3", { m: 0, lineHeight: 1.2 });
globalStyle("code", { font: "mono" });

export const s = {
  shell: css({ maxW: 900, mx: "auto", px: 20, py: 26 }),
  nav: css({ row: true, items: "center", gap: 6, flexWrap: "wrap", mb: 20 }),
  link: css({
    font: "body",
    text: 13,
    weight: 600,
    px: 11,
    py: 7,
    rounded: "md",
    border: "1px solid",
    borderColor: "border",
    bg: "surfaceMuted",
    color: "textDim",
    textDecoration: "none",
    hover: { borderColor: "primary", color: "#fff" },
  }),
  linkActive: css({ bg: "primary", borderColor: "primary", color: "#fff" }),
  panel: css({ bg: "surface", border: "1px solid", borderColor: "border", rounded: "lg", p: 20, shadow: "card" }),
  h1: css({ text: 26, weight: 800, mb: 8, letterSpacing: "-0.02em" }),
  lead: css({ text: 15, color: "textDim", mb: 14 }),
  kv: css({ display: "grid", gap: 6, my: 12, md: { gridTemplateColumns: "auto 1fr" } }),
  key: css({ font: "mono", text: 12, color: "textMuted" }),
  val: css({ font: "mono", text: 12, color: "accent" }),
  foot: css({ mt: 22, pt: 14, borderTop: "1px solid", borderColor: "border", text: 12, color: "textMuted" }),
  pill: css({
    font: "mono",
    text: 11,
    px: 8,
    py: 3,
    rounded: "pill",
    border: "1px solid",
    borderColor: "border",
    bg: "surfaceMuted",
    color: "textDim",
    display: "inline-block",
  }),
};

/** A labelled value row, used to show the live route context. */
export function kv(label: string, value: () => string) {
  return [span(s.key, label), span(s.val, value)];
}
