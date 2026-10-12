// styles.ts: the editor's own chrome. It uses the global css() and the docs
// theme, so it follows the docs light/dark switch and none of the theme it edits.
import "nuclo";

const mono = "ui-monospace, monospace";
const control = { height: "30px", padding: "0 10px", borderRadius: "8px", border: "1px solid var(--c-border-light)", backgroundColor: "var(--c-bg)", color: "var(--c-text)", fontFamily: "inherit", fontSize: "0.8125rem", fontWeight: "600" };

export const s = {
  // Phones: one scrolling column. Wider: the panel and the preview scroll side by side.
  app: css("te-app", { display: "flex", flexDirection: "column", gap: "12px", width: "100%", height: "100%", overflowY: "auto", "@media (min-width: 900px)": { flexDirection: "row", overflowY: "hidden" } }),
  panel: css("te-panel", { display: "flex", flexDirection: "column", gap: "16px", flexShrink: 0, "@media (min-width: 900px)": { width: "300px", overflowY: "auto", paddingRight: "6px" } }),
  head: css("te-head", { display: "flex", alignItems: "center", gap: "8px", "& > :first-child": { flex: "1" }, "& strong": { fontSize: "0.9375rem" } }),
  hint: css("te-hint", { fontSize: "0.8125rem", lineHeight: "1.5", color: "var(--c-text-dim)" }),
  group: css("te-group", { display: "flex", flexDirection: "column", gap: "8px" }),
  label: css("te-label", { fontSize: "0.6875rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--c-text-muted)" }),
  row: css("te-row", { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }),
  btn: css("te-btn", { ...control, hover: { backgroundColor: "var(--c-bg-secondary)" } }),
  active: css("te-active", { borderColor: "var(--c-primary)", backgroundColor: "var(--c-primary-alpha-13)", color: "var(--c-primary-ink)", hover: { backgroundColor: "var(--c-primary-alpha-19)" } }),
  color: css("te-color", { display: "grid", gridTemplateColumns: "28px 1fr 88px", alignItems: "center", gap: "8px", fontSize: "0.8125rem", color: "var(--c-text-dim)", "& input[type=color]": { width: "28px", height: "28px", padding: "0", border: "none", backgroundColor: "transparent", cursor: "pointer" } }),
  hex: css("te-hex", { ...control, width: "100%", height: "28px", fontFamily: mono, fontSize: "0.75rem", fontWeight: "400" }),
  field: css("te-field", { display: "grid", gridTemplateColumns: "64px 1fr 44px", alignItems: "center", gap: "8px", fontSize: "0.8125rem", color: "var(--c-text-dim)", "& input": { width: "100%", accentColor: "var(--c-primary)" } }),
  value: css("te-value", { fontFamily: mono, fontSize: "0.75rem", textAlign: "right", fontVariantNumeric: "tabular-nums" }),
  select: css("te-select", { ...control, gridColumn: "2 / 4", fontWeight: "400" }),
  contrast: css("te-contrast", { display: "grid", gridTemplateColumns: "32px 1fr auto auto", alignItems: "center", gap: "8px", fontSize: "0.8125rem", color: "var(--c-text-dim)", "& strong": { fontFamily: mono, fontSize: "0.75rem", fontVariantNumeric: "tabular-nums", color: "var(--c-text)" } }),
  sample: css("te-sample", { display: "flex", alignItems: "center", justifyContent: "center", height: "24px", borderRadius: "6px", border: "1px solid var(--c-border)", fontSize: "0.75rem", fontWeight: "700" }),
  verdict: css("te-verdict", { minWidth: "48px", padding: "1px 6px", borderRadius: "999px", fontSize: "0.6875rem", fontWeight: "700", textAlign: "center" }),
  pass: css("te-pass", { backgroundColor: "rgba(34,197,94,0.18)", color: "var(--c-text)" }),
  fail: css("te-fail", { backgroundColor: "var(--c-primary-alpha-13)", color: "var(--c-primary-ink)" }),
  pre: css("te-pre", { maxHeight: "260px", overflow: "auto", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg-secondary)", fontFamily: mono, fontSize: "0.6875rem", lineHeight: "1.6", whiteSpace: "pre" }),
  preview: css("te-preview", { flexShrink: 0, borderRadius: "12px", border: "1px solid var(--c-border)", overflow: "hidden", "@media (min-width: 900px)": { flex: "1", minWidth: "0", overflowY: "auto" } }),
};
