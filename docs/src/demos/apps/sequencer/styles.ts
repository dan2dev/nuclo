import "nuclo";

const mono = "ui-monospace, monospace";
const control = { height: "34px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--c-border-light)", backgroundColor: "var(--c-bg)", color: "var(--c-text)", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: "600" };

export const s = {
  app: css("seq-app", { display: "flex", flexDirection: "column", gap: "10px", width: "100%", height: "100%" }),
  bar: css("seq-bar", { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }),
  btn: css("seq-btn", { ...control, whiteSpace: "nowrap", hover: { backgroundColor: "var(--c-bg-secondary)" } }),
  primary: css("seq-primary", { minWidth: "92px", backgroundColor: "var(--c-primary-dark)", borderColor: "transparent", color: "#fff", hover: { backgroundColor: "var(--c-primary-dark)", filter: "brightness(0.92)" } }),
  field: css("seq-field", { display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8125rem", color: "var(--c-text-dim)", "& input": { width: "110px", accentColor: "var(--c-primary)" } }),
  readout: css("seq-readout", { minWidth: "4ch", fontFamily: mono, fontSize: "0.75rem", color: "var(--c-text)", fontVariantNumeric: "tabular-nums" }),
  // The grid scrolls sideways on phones; every row is at least as wide as its content, so the sticky heads stay put.
  grid: css("seq-grid", { display: "flex", flexDirection: "column", gap: "6px", flex: "0 1 auto", minHeight: "0", overflow: "auto", padding: "10px 10px 10px 0", borderRadius: "12px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg-secondary)" }),
  track: css("seq-track", { display: "flex", gap: "10px", minWidth: "max-content" }),
  muted: css("seq-muted", { "& > div + div": { opacity: "0.35" } }),
  head: css("seq-head", { position: "sticky", left: "0", zIndex: 1, display: "flex", alignItems: "center", gap: "6px", width: "170px", flexShrink: 0, padding: "0 4px 0 10px", backgroundColor: "var(--c-bg-secondary)" }),
  name: css("seq-name", { flex: "1", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.8125rem", fontWeight: "600" }),
  mute: css("seq-mute", { width: "26px", height: "26px", flexShrink: 0, borderRadius: "6px", border: "1px solid var(--c-border-light)", fontSize: "0.6875rem", fontWeight: "700", color: "var(--c-text-dim)", hover: { color: "var(--c-text)" }, "&[aria-pressed=true]": { backgroundColor: "var(--c-text-dim)", borderColor: "transparent", color: "var(--c-bg)" } }),
  volume: css("seq-volume", { width: "52px", flexShrink: 0, accentColor: "var(--c-primary)" }),
  beat: css("seq-beat", { display: "flex", gap: "3px", flex: "1" }),
  cell: css("seq-cell", { flex: "1", minWidth: "26px", height: "34px", borderRadius: "6px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg-card)", cursor: "pointer", "@media (min-width: 900px)": { height: "44px" }, hover: { borderColor: "var(--c-primary)" }, "&[aria-pressed=true]": { backgroundColor: "var(--c-primary)", borderColor: "var(--c-primary)" } }),
  // The playhead column: lit when empty, brighter when it plays a hit.
  now: css("seq-now", { backgroundColor: "var(--c-primary-alpha-19)", "&[aria-pressed=true]": { backgroundColor: "var(--c-accent-secondary)", borderColor: "var(--c-accent-secondary)" } }),
  hint: css("seq-hint", { fontSize: "0.8125rem", color: "var(--c-text-dim)" }),
};
