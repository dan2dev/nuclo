import "nuclo";

const mono = "ui-monospace, monospace";
const control = { height: "34px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--c-border-light)", backgroundColor: "var(--c-bg)", color: "var(--c-text)", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: "600" };

export const s = {
  app: css("three-app", { display: "flex", flexDirection: "column", gap: "12px", width: "100%", height: "100%", "@media (min-width: 900px)": { flexDirection: "row" } }),
  stage: css("three-stage", { position: "relative", flex: "1", minWidth: "0", minHeight: "260px", borderRadius: "12px", border: "1px solid var(--c-border)", overflow: "hidden", backgroundColor: "var(--c-bg-secondary)" }),
  canvas: css("three-canvas", { display: "block", width: "100%", height: "100%", cursor: "crosshair", touchAction: "none" }),
  loading: css("three-loading", { position: "absolute", inset: "0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", color: "var(--c-text-muted)" }),
  panel: css("three-panel", { display: "flex", flexDirection: "column", gap: "10px", flexShrink: 0, width: "100%", overflowY: "auto", "@media (min-width: 900px)": { width: "300px" } }),
  panelHead: css("three-panelHead", { display: "flex", flexDirection: "column", gap: "2px", fontSize: "0.9375rem" }),
  stats: css("three-stats", { fontFamily: mono, fontSize: "0.75rem", color: "var(--c-text-muted)", fontVariantNumeric: "tabular-nums" }),
  list: css("three-list", { listStyle: "none", borderRadius: "10px", border: "1px solid var(--c-border)", overflow: "hidden", "& > * + *": { raw: { "border-top": "1px solid var(--c-border)" } } }),
  row: css("three-row", { display: "flex", alignItems: "center", gap: "8px", height: "36px", padding: "0 10px", fontSize: "0.8125rem", cursor: "pointer", hover: { backgroundColor: "var(--c-bg-secondary)" } }),
  selected: css("three-selected", { backgroundColor: "var(--c-primary-alpha-13)", hover: { backgroundColor: "var(--c-primary-alpha-13)" } }),
  swatch: css("three-swatch", { width: "12px", height: "12px", borderRadius: "4px", flexShrink: 0 }),
  name: css("three-name", { flex: "1", fontWeight: "500" }),
  coords: css("three-coords", { fontFamily: mono, fontSize: "0.6875rem", color: "var(--c-text-muted)", whiteSpace: "pre", fontVariantNumeric: "tabular-nums" }),
  hint: css("three-hint", { fontSize: "0.8125rem", color: "var(--c-text-dim)" }),
  props: css("three-props", { display: "flex", flexDirection: "column", gap: "8px", padding: "12px", borderRadius: "10px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg-card)" }),
  propsTitle: css("three-propsTitle", { fontSize: "0.875rem", fontWeight: "600" }),
  field: css("three-field", { display: "grid", gridTemplateColumns: "52px 1fr", alignItems: "center", gap: "8px", fontSize: "0.8125rem", color: "var(--c-text-dim)", "& input": { width: "100%", accentColor: "var(--c-primary)" }, "& input[type=color]": { height: "28px", padding: "0", border: "none", backgroundColor: "transparent", cursor: "pointer" } }),
  check: css("three-check", { display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8125rem", color: "var(--c-text-dim)", cursor: "pointer", "& input": { accentColor: "var(--c-primary)" } }),
  btn: css("three-btn", { ...control, hover: { backgroundColor: "var(--c-bg-secondary)" } }),
  primary: css("three-primary", { backgroundColor: "var(--c-primary-dark)", borderColor: "transparent", color: "#fff", hover: { backgroundColor: "var(--c-primary-dark)", filter: "brightness(0.92)" } }),
};
