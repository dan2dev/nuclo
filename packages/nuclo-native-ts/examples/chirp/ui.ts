// Chirp's look: a nuclo-core theme (createCss) whose tokens every style names, and the few building blocks the
// screens share. The theme is read at compile time natively, and by the web runtime as the app runs.
import { type Node, createCss, div, span } from "../../src/index.ts";

export const { css, cx, theme, globalStyle } = createCss({
  colors: {
    page: "#f3f4f8",
    card: "#ffffff",
    field: "#f1f3f7",
    text: "#111827",
    muted: "#6b7280",
    accent: "#4f46e5",
    accentSoft: "#e0e7ff",
    bad: "#dc2626",
    line: "#e5e7eb",
    like: "#e11d48",
    repost: "#16a34a",
    warning: "#fee2e2",
  },
  radii: { field: 10, card: 14, pill: 18 },
});

// The page behind every screen.
globalStyle("body", { bg: "page" });

/** A row of items, centred across. */
export const row = css({ row: true, gap: 10, items: "center" });

/** A section of a screen: a white band with a hairline under it. */
export const band = css({ bg: "card", borderBottom: "1px solid line" });

export const field = css({ bg: "field", color: "text", rounded: "field", p: 10, text: 15, placeholder: { color: "muted" } });

export const muted = (text: string, size = 13) => span(text, { style: { color: "muted", fontSize: size } });
export const mutedFn = (text: () => string, size = 13) => span(text, { style: { color: "muted", fontSize: size } });
export const name = (text: string, size = 15) => span(text, { style: { color: "text", fontSize: size, fontWeight: "bold" } });
export const nameFn = (text: () => string, size = 15) => span(text, { style: { color: "text", fontSize: size, fontWeight: "bold" } });
export const body = (text: string, size = 15) => span(text, { style: { color: "text", fontSize: size } });

/** A filled button; dimmed while `enabled()` is false. */
export const action = (label: () => string, onClick: () => void, enabled: () => boolean): Node =>
  div(
    {
      style: () => ({ bg: "accent", rounded: "field", p: 12, items: "center", opacity: enabled() ? 1 : 0.4 }),
      onClick: () => {
        if (enabled()) onClick();
      },
    },
    span(label, { style: { color: "#ffffff", fontSize: 15, fontWeight: "bold" } }),
  );

/** A pill that is filled while `active()`: tabs, segmented choices. */
export const chip = (label: string, active: () => boolean, onClick: () => void): Node =>
  div(
    { style: () => ({ bg: active() ? "accent" : "accentSoft", borderRadius: 16, p: 8, flex: 1, items: "center" }), onClick },
    span(label, { style: () => ({ color: active() ? "#ffffff" : "accent", fontSize: 13, fontWeight: "bold" }) }),
  );
