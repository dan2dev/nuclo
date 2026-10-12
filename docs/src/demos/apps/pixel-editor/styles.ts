// styles.ts: the editor's look. The canvas is a CSS grid over a checkerboard, so a
// transparent pixel ("" in the array) is simply a cell with no background.
import "nuclo";
import { SIZE } from "./history.ts";

const mono = "ui-monospace, monospace";
const wide = "@media (min-width: 760px)"; // tools left, canvas, history right; stacked below
const control = { height: "32px", padding: "0 10px", borderRadius: "8px", border: "1px solid var(--c-border-light)", backgroundColor: "var(--c-bg)", color: "var(--c-text)", fontFamily: "inherit", fontSize: "0.8125rem", fontWeight: "600", whiteSpace: "nowrap" };

export const s = {
  app: css("px-app", { display: "flex", flexDirection: "column", gap: "14px", width: "100%", [wide]: { flexDirection: "row", height: "100%" } }),
  tools: css("px-tools", { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", alignContent: "start", gap: "6px", [wide]: { gridTemplateColumns: "repeat(2, 1fr)", flexShrink: 0, width: "172px" } }),
  tool: css("px-tool", { ...control, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px", hover: { backgroundColor: "var(--c-bg-secondary)" }, "& kbd": { fontFamily: mono, fontSize: "0.6875rem", fontWeight: "400", color: "var(--c-text-muted)" } }),
  on: css("px-on", { borderColor: "var(--c-primary)", backgroundColor: "var(--c-primary-alpha-13)", color: "var(--c-primary-ink)", hover: { backgroundColor: "var(--c-primary-alpha-19)" } }),
  palette: css("px-palette", { gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "5px", margin: "6px 0", [wide]: { gridTemplateColumns: "repeat(4, 1fr)" } }),
  swatch: css("px-swatch", { aspectRatio: "1", borderRadius: "6px", border: "1px solid var(--c-border-light)" }),
  picked: css("px-picked", { boxShadow: "0 0 0 2px var(--c-bg-card), 0 0 0 4px var(--c-primary)" }),
  custom: css("px-custom", { ...control, gridColumn: "span 2", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", "& input": { width: "22px", height: "22px", padding: "0", border: "none", backgroundColor: "transparent", cursor: "pointer" } }),
  actions: css("px-actions", { gridColumn: "span 2", display: "flex", gap: "6px", "& button": { flex: "1 1 auto" } }),
  btn: css("px-btn", { ...control, hover: { backgroundColor: "var(--c-bg-secondary)" }, "&:disabled": { opacity: "0.45", cursor: "default" } }),
  // Wide, the stage is a size container: the canvas takes the smaller of its width and height.
  stage: css("px-stage", { display: "flex", alignItems: "center", justifyContent: "center", flex: "1", minWidth: "0", [wide]: { containerType: "size" } }),
  canvas: css("px-canvas", {
    display: "grid",
    gridTemplateColumns: `repeat(${SIZE}, 1fr)`,
    gridTemplateRows: `repeat(${SIZE}, 1fr)`,
    width: "100%",
    maxWidth: "480px",
    aspectRatio: "1",
    // A checkerboard behind the transparent cells: one tile is two cells wide.
    backgroundImage: "conic-gradient(var(--c-bg-light) 25%, var(--c-bg) 0 50%, var(--c-bg-light) 0 75%, var(--c-bg) 0)",
    backgroundSize: `${200 / SIZE}% ${200 / SIZE}%`,
    boxShadow: "0 0 0 1px var(--c-border)", // not a border: the cell math reads the box edge to edge
    cursor: "crosshair",
    touchAction: "none",
    [wide]: { width: "min(100cqw, 100cqh)", maxWidth: "none" },
  }),
  cell: css("px-cell", { hover: { boxShadow: "inset 0 0 0 1px var(--c-primary)" } }),
  history: css("px-history", { display: "flex", flexDirection: "column", gap: "8px", [wide]: { flexShrink: 0, width: "232px", minHeight: "0" } }),
  head: css("px-head", { display: "flex", alignItems: "center", gap: "6px", "& strong": { flex: "1", fontSize: "0.9375rem" } }),
  stats: css("px-stats", { fontFamily: mono, fontSize: "0.75rem", lineHeight: "1.4", color: "var(--c-text-muted)" }),
  entries: css("px-entries", { display: "flex", flexDirection: "column", gap: "2px", maxHeight: "240px", overflowY: "auto", [wide]: { flex: "1", minHeight: "0", maxHeight: "none" } }),
  entry: css("px-entry", { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, padding: "4px 8px 4px 4px", borderRadius: "8px", fontSize: "0.8125rem", textAlign: "left", color: "var(--c-text-dim)", hover: { backgroundColor: "var(--c-bg-secondary)" } }),
  current: css("px-current", { backgroundColor: "var(--c-primary-alpha-13)", color: "var(--c-primary-ink)", fontWeight: "600", hover: { backgroundColor: "var(--c-primary-alpha-13)" } }),
  future: css("px-future", { opacity: "0.45" }),
  thumb: css("px-thumb", { flexShrink: 0, width: "32px", height: "32px", borderRadius: "4px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg)", raw: { "image-rendering": "pixelated" } }),
};
