// styles.ts: the editor's look. Nodes have fixed row heights, so app.ts can
// work out where every port is from a node's x and y, without measuring the DOM.
import "nuclo";

export const W = 188; // a node's width, px
export const HEAD = 32; // its header
export const ROW = 28; // one row: an input port on the left, an output port on the right

const mono = "ui-monospace, monospace";
const wide = "@media (min-width: 760px)"; // functions and nodes left, canvas right; stacked below
const focus = { outline: "2px solid var(--c-primary)", outlineOffset: "1px" };
const control = { height: "30px", padding: "0 10px", borderRadius: "8px", border: "1px solid var(--c-border-light)", backgroundColor: "var(--c-bg)", color: "var(--c-text)", fontFamily: "inherit", fontSize: "0.8125rem", fontWeight: "600", whiteSpace: "nowrap", hover: { backgroundColor: "var(--c-bg-secondary)" }, "&:disabled": { opacity: "0.45", cursor: "default" }, "&:focus-visible": focus };
const small = { height: "22px", minWidth: "0", padding: "0 6px", borderRadius: "6px", border: "1px solid var(--c-border-light)", backgroundColor: "var(--c-bg)", color: "var(--c-text)", fontFamily: mono, fontSize: "0.75rem", "&:focus-visible": focus };
const accent = (color: string) => ({ raw: { "--ng-accent": color } });

export const s = {
  app: css("ng-app", { display: "flex", flexDirection: "column", gap: "12px", width: "100%", height: "100%", [wide]: { flexDirection: "row" } }),

  side: css("ng-side", { display: "grid", gridTemplateColumns: "1fr 1fr", alignContent: "start", gap: "14px", [wide]: { display: "flex", flexDirection: "column", flexShrink: 0, width: "204px", overflowY: "auto" } }),
  section: css("ng-section", { display: "flex", flexDirection: "column", gap: "6px", "& h3": { fontSize: "0.6875rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--c-text-muted)" } }),
  fn: css("ng-fn", { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "1px", padding: "6px 10px", borderRadius: "8px", textAlign: "left", fontSize: "0.8125rem", fontWeight: "600", color: "var(--c-text)", hover: { backgroundColor: "var(--c-bg-secondary)" }, "&:focus-visible": focus }),
  current: css("ng-current", { backgroundColor: "var(--c-primary-alpha-13)", color: "var(--c-primary-ink)", hover: { backgroundColor: "var(--c-primary-alpha-13)" } }),
  sig: css("ng-sig", { fontFamily: mono, fontSize: "0.6875rem", fontWeight: "400", color: "var(--c-text-muted)", overflowWrap: "anywhere" }),
  btn: css("ng-btn", control),
  group: css("ng-group", { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", "& > span": { gridColumn: "1 / -1", marginTop: "4px", fontSize: "0.6875rem", color: "var(--c-text-muted)" } }),
  add: css("ng-add", { ...control, height: "28px", padding: "0 8px", overflow: "hidden", textOverflow: "ellipsis", fontWeight: "500", textAlign: "left", "&::before": { content: '""', display: "inline-block", width: "7px", height: "7px", marginRight: "6px", borderRadius: "50%", backgroundColor: "var(--ng-accent)" } }),

  main: css("ng-main", { display: "flex", flexDirection: "column", gap: "10px", flex: "1", minWidth: "0", minHeight: "0" }),
  bar: css("ng-bar", { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 12px" }),
  crumbs: css("ng-crumbs", { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "2px", fontSize: "0.8125rem", "& > span": { color: "var(--c-text-muted)" } }),
  crumb: css("ng-crumb", { padding: "3px 6px", borderRadius: "6px", color: "var(--c-text-dim)", hover: { backgroundColor: "var(--c-bg-secondary)", color: "var(--c-text)" }, "&[aria-current=true]": { fontWeight: "700", color: "var(--c-text)" }, "&:focus-visible": focus }),
  name: css("ng-name", { ...control, width: "130px", fontWeight: "400", cursor: "text" }),
  stats: css("ng-stats", { flex: "1 1 auto", textAlign: "right", fontFamily: mono, fontSize: "0.6875rem", color: "var(--c-text-muted)", fontVariantNumeric: "tabular-nums" }),

  // The canvas: a dot grid that moves and scales with the view, and the world inside it.
  canvas: css("ng-canvas", { position: "relative", flex: "1", minHeight: "440px", overflow: "hidden", borderRadius: "12px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg)", backgroundImage: "radial-gradient(circle, var(--c-border-light) 1px, transparent 1.5px)", touchAction: "none", [wide]: { minHeight: "0" } }),
  world: css("ng-world", { position: "absolute", left: "0", top: "0", transformOrigin: "0 0" }),
  wires: css("ng-wires", { position: "absolute", left: "0", top: "0", width: "1px", height: "1px", overflow: "visible", pointerEvents: "none" }),
  link: css("ng-link", { "&:hover > :first-child": { raw: { stroke: "var(--c-accent-warm)", "stroke-dasharray": "none" } } }),
  wire: css("ng-wire", { transition: "opacity 0.2s ease", raw: { fill: "none", stroke: "var(--c-text-muted)", "stroke-width": "2.5", "stroke-linecap": "round" } }),
  num: css("ng-num", { raw: { stroke: "var(--c-tok-number)" } }),
  str: css("ng-str", { raw: { stroke: "var(--c-tok-string)" } }),
  yes: css("ng-yes", { raw: { stroke: "var(--c-primary)" } }),
  no: css("ng-no", { raw: { stroke: "var(--c-text-muted)", "stroke-dasharray": "2 5" } }),
  faint: css("ng-faint", { opacity: "0.22" }),
  hit: css("ng-hit", { cursor: "pointer", raw: { fill: "none", stroke: "transparent", "stroke-width": "14", "pointer-events": "stroke" } }),
  loose: css("ng-loose", { raw: { stroke: "var(--c-primary)", "stroke-dasharray": "6 5" } }),
  zoom: css("ng-zoom", { position: "absolute", right: "10px", bottom: "10px", display: "flex", gap: "4px", "& button": { minWidth: "30px", fontVariantNumeric: "tabular-nums" } }),
  hint: css("ng-hint", { position: "absolute", left: "12px", right: "150px", bottom: "14px", fontSize: "0.75rem", lineHeight: "1.4", color: "var(--c-text-muted)", pointerEvents: "none" }),
  notice: css("ng-notice", { color: "var(--c-accent-warm)", fontWeight: "600" }),

  node: css("ng-node", { position: "absolute", left: "0", top: "0", width: `${W}px`, borderRadius: "10px", backgroundColor: "var(--c-bg-card)", boxShadow: "0 0 0 1px var(--c-border-light), 0 6px 18px rgba(0, 0, 0, 0.12)", fontSize: "0.75rem", userSelect: "none", cursor: "grab", transition: "opacity 0.2s ease" }),
  value: css("ng-value", accent("var(--c-tok-number)")),
  op: css("ng-op", accent("var(--c-tok-keyword)")),
  flow: css("ng-flow", accent("var(--c-primary)")),
  port: css("ng-port", accent("var(--c-tok-string)")),
  call: css("ng-call", accent("var(--c-tok-fn)")),
  selected: css("ng-selected", { zIndex: 2, boxShadow: "0 0 0 2px var(--c-primary), 0 10px 26px rgba(0, 0, 0, 0.18)" }),
  target: css("ng-target", { outline: "2px dashed var(--c-primary)", outlineOffset: "4px" }),
  dim: css("ng-dim", { opacity: "0.5" }),
  failed: css("ng-failed", { boxShadow: "0 0 0 2px var(--c-accent-warm)" }),
  head: css("ng-head", { display: "flex", alignItems: "center", gap: "6px", height: `${HEAD}px`, padding: "0 4px 0 10px", borderRadius: "10px 10px 0 0", backgroundColor: "var(--c-bg-secondary)", boxShadow: "inset 0 -1px 0 var(--c-border)", fontWeight: "700" }),
  dot: css("ng-dot", { flex: "none", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--ng-accent)" }),
  title: css("ng-title", { flex: "1", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }),
  icon: css("ng-icon", { flex: "none", width: "22px", height: "22px", borderRadius: "6px", fontSize: "0.875rem", lineHeight: "1", color: "var(--c-text-muted)", hover: { color: "var(--c-text)", backgroundColor: "var(--c-bg-light)" }, "&:focus-visible": focus }),
  row: css("ng-row", { position: "relative", display: "flex", alignItems: "center", gap: "6px", height: `${ROW}px`, padding: "0 12px" }),
  socket: css("ng-socket", { position: "absolute", top: "50%", width: "12px", height: "12px", marginTop: "-6px", borderRadius: "50%", backgroundColor: "var(--ng-accent)", boxShadow: "0 0 0 2px var(--c-bg-card)", cursor: "crosshair", transition: "transform 0.1s ease", hover: { transform: "scale(1.4)" } }),
  in: css("ng-in", { left: "-6px" }),
  out: css("ng-out", { right: "-6px" }),
  label: css("ng-label", { flex: "none", fontFamily: mono, fontSize: "0.6875rem", color: "var(--c-text-muted)" }),
  result: css("ng-result", { display: "flex", alignItems: "baseline", gap: "6px", minWidth: "0", marginLeft: "auto", fontFamily: mono, fontWeight: "600", whiteSpace: "nowrap", "& > :last-child": { overflow: "hidden", textOverflow: "ellipsis" } }),
  field: css("ng-field", { ...small, flex: "1", width: "100%" }),
  select: css("ng-select", { ...small, flex: "1", fontFamily: "inherit", cursor: "pointer" }),
  toggle: css("ng-toggle", { display: "flex", alignItems: "center", gap: "8px", flex: "1", fontFamily: mono, cursor: "pointer", "& input": { accentColor: "var(--c-primary)", width: "15px", height: "15px", margin: "0" } }),
  big: css("ng-big", { flex: "1", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: mono, fontSize: "1rem", fontWeight: "700", color: "var(--c-primary-ink)" }),
  error: css("ng-error", { color: "var(--c-accent-warm)", fontSize: "0.75rem" }),
};
