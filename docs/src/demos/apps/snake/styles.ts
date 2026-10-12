// styles.ts: the look. Cells are sized in % of the board, so the board can
// take any size: it is the largest square its stage can hold.
import "nuclo";
import { GRID } from "./game.ts";

const mono = "ui-monospace, monospace";
const cell = `${100 / GRID}%`;
const control = { height: "34px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--c-border-light)", backgroundColor: "var(--c-bg)", color: "var(--c-text)", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: "600" };
const slide = keyframes({ from: { transform: "translateX(-100%)" } }); // from the neck, in the head's rotated frame
const pop = keyframes({ from: { transform: "scale(0)" } });
const flash = keyframes({ from: { color: "var(--c-primary-ink)", transform: "scale(1.4)" } });

export const s = {
  app: css("snake-app", {
    display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gridTemplateRows: "auto minmax(240px, 1fr) auto", gridTemplateAreas: '"stats" "stage" "pad"', gap: "12px", width: "100%", height: "100%",
    "@media (min-width: 760px)": { gridTemplateColumns: "minmax(0, 1fr) 220px", gridTemplateRows: "auto minmax(0, 1fr)", gridTemplateAreas: '"stage stats" "stage pad"' },
  }),
  // A size container: the board is 100cqmin, the smaller of its width and height.
  stage: css("snake-stage", { gridArea: "stage", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "240px", containerType: "size" }),
  board: css("snake-board", {
    position: "relative", width: "100cqmin", height: "100cqmin", borderRadius: "12px", border: "1px solid var(--c-border)", overflow: "hidden", outline: "none", touchAction: "none", userSelect: "none",
    backgroundColor: "var(--c-bg-secondary)", backgroundImage: "radial-gradient(circle, var(--c-border-light) 1px, transparent 1.5px)", backgroundSize: `${cell} ${cell}`,
    focusVisible: { boxShadow: "0 0 0 2px var(--c-primary)" },
  }),
  // No transition on the position: the element that moves each tick is the
  // tail jumping to the front, and it must not glide across the board.
  segment: css("snake-segment", { position: "absolute", top: "0", left: "0", width: cell, height: cell, borderRadius: "30%", border: "1px solid var(--c-bg-secondary)", backgroundColor: "var(--c-primary)" }),
  // The slide replays whenever this class lands on a new element. Its duration is one tick, set inline.
  head: css("snake-head", { zIndex: 1, backgroundColor: "var(--c-primary-dark)", animation: `${slide} linear`, "& > span": { display: "block" } }),
  eye: css("snake-eye", { display: "none", position: "absolute", right: "14%", width: "26%", height: "26%", borderRadius: "50%", backgroundImage: "radial-gradient(circle at 70% 50%, #111 38%, #fff 42%)", first: { top: "16%" }, last: { bottom: "16%" } }),
  food: css("snake-food", { position: "absolute", top: "0", left: "0", width: cell, height: cell, backgroundImage: "radial-gradient(circle closest-side, var(--c-accent-cool) 70%, transparent 76%)", animation: `${pop} 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)` }),
  overlay: css("snake-overlay", {
    position: "absolute", inset: "0", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", padding: "16px", textAlign: "center",
    backgroundColor: "color-mix(in srgb, var(--c-bg) 88%, transparent)", backdropFilter: "blur(3px)", "& strong": { fontSize: "1.25rem" }, "& p": { fontSize: "0.875rem", color: "var(--c-text-dim)" },
  }),
  small: css("snake-small", { fontSize: "0.75rem", color: "var(--c-text-muted)" }),
  again: css("snake-again", { ...control, marginTop: "8px", backgroundColor: "var(--c-primary-dark)", borderColor: "transparent", color: "#fff", hover: { filter: "brightness(0.92)" } }),
  panel: css("snake-panel", { gridArea: "stats", display: "flex", flexDirection: "column", gap: "10px", minWidth: "0" }),
  // Cells grow to fill each row, so five stats never leave one orphaned in a half-empty row.
  stats: css("snake-stats", { display: "flex", flexWrap: "wrap", gap: "6px", "& > *": { flex: "1 1 88px" } }),
  stat: css("snake-stat", {
    padding: "6px 10px", borderRadius: "10px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg-card)",
    "& dt": { fontSize: "0.6875rem", color: "var(--c-text-muted)" }, "& dd": { margin: "2px 0 0", fontFamily: mono, fontSize: "1rem", fontWeight: "600", fontVariantNumeric: "tabular-nums" },
  }),
  flash: css("snake-flash", { display: "inline-block", animation: `${flash} 0.45s ease-out` }),
  note: css("snake-note", { fontSize: "0.75rem", lineHeight: "1.5", color: "var(--c-text-dim)", "& strong": { color: "var(--c-primary-ink)" }, "@media (max-width: 759px)": { display: "none" } }),
  // Touch screens and narrow windows get a pad; the keyboard does not need one.
  pad: css("snake-pad", {
    gridArea: "pad", display: "none", gridTemplateColumns: "repeat(3, 48px)", gridTemplateRows: "repeat(3, 48px)", gridTemplateAreas: '". up ." "left mid right" ". down ."', gap: "6px", justifyContent: "center",
    "@media (pointer: coarse), (max-width: 759px)": { display: "grid" },
  }),
  padBtn: css("snake-padBtn", { ...control, height: "auto", padding: "0", fontSize: "1.125rem", touchAction: "manipulation", hover: { backgroundColor: "var(--c-bg-secondary)" }, active: { backgroundColor: "var(--c-primary-alpha-13)" } }),
};
