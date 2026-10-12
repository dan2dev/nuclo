/**
 * Shared pieces of the chart examples: styles, a seeded random generator and
 * the timer that drives a live chart. The previews read the site's theme
 * through CSS variables; the sources keep plain colors.
 */
import { colors, css } from "../../styles.ts";

/** One color per series, as theme variables. */
export const SERIES = ["var(--c-primary)", "var(--c-accent-cool)", "var(--c-accent-secondary)", "var(--c-text-muted)"];

export const cs = {
  hit: css("pages-examples-chart-kit-hit", { cursor: "crosshair", touchAction: "none", raw: { fill: "transparent" } }),
  ghost: css("pages-examples-chart-kit-ghost", { pointerEvents: "none", raw: { stroke: "var(--c-text-muted)" } }),
  glide: css("pages-examples-chart-kit-glide", { transition: "transform 0.12s linear" }),
  band: css("pages-examples-chart-kit-band", { transition: "d 0.5s cubic-bezier(0.22, 1, 0.36, 1)", raw: { stroke: "var(--c-bg-card)" } }),
  tween: css("pages-examples-chart-kit-tween", { transition: "x 0.25s ease, y 0.25s ease, width 0.25s ease, height 0.25s ease" }),
  legend: css("pages-examples-chart-kit-legend", { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px" }),
  chip: css("pages-examples-chart-kit-chip", {
    display: "inline-flex", alignItems: "center", gap: "6px", height: "30px", padding: "0 12px", borderRadius: "15px",
    border: `1px solid ${colors.borderLight}`, fontSize: "0.8125rem", color: colors.text, cursor: "pointer",
    hover: { backgroundColor: colors.bgSecondary },
    "&[aria-pressed=false]": { opacity: "0.45" },
    "&[aria-pressed=true]": { outline: `2px solid ${colors.text}`, outlineOffset: "1px" },
  }),
  toggle: css("pages-examples-chart-kit-toggle", { "&[aria-pressed=true]": { outline: `2px solid ${colors.text}`, outlineOffset: "2px" } }),
  pip: css("pages-examples-chart-kit-pip", { width: "9px", height: "9px", borderRadius: "50%", flexShrink: 0 }),
  stat: css("pages-examples-chart-kit-stat", { fontFamily: "ui-monospace, monospace", fontSize: "12px", color: colors.textMuted, textAlign: "center", minHeight: "36px", fontVariantNumeric: "tabular-nums" }),
  name: css("pages-examples-chart-kit-name", { fontSize: "11px", fontWeight: "600", raw: { fill: "var(--c-text)" } }),
  nameOn: css("pages-examples-chart-kit-nameOn", { fontSize: "10px", pointerEvents: "none", transition: "opacity 0.2s ease", raw: { fill: "#fff" } }),
  big: css("pages-examples-chart-kit-big", { fontWeight: "800", fontSize: "54px", fontVariantNumeric: "tabular-nums", pointerEvents: "none", raw: { fill: "var(--c-text)", "fill-opacity": "0.12" } }),
  slide: css("pages-examples-chart-kit-slide", { width: "100%", maxWidth: "320px", accentColor: colors.primary }),
  row: css("pages-examples-chart-kit-row", { display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "8px" }),
};

/** A seeded generator, so the server and the client draw the same first frame. */
export const seeded = (seed: number) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

export const sum = (list: number[]) => list.reduce((a, b) => a + b, 0);

/**
 * An onMount handler that calls step() every `ms`, then updates only the
 * scope `id`. step() returns false when nothing changed, which skips the update.
 */
export const every = (id: string, ms: number, step: () => boolean | void) => () => {
  const timer = setInterval(() => {
    if (step() !== false) update(id);
  }, ms);
  return () => clearInterval(timer);
};

/** A smooth path through the points: horizontal tangents, so a curve never overshoots its data. */
export function smooth(points: number[][], from: "M" | "L" = "M") {
  let d = `${from}${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const mid = ((x0 + x1) / 2).toFixed(1);
    d += ` C${mid},${y0.toFixed(1)} ${mid},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  return d;
}
