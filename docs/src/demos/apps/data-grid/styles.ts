import "nuclo";

const mono = "ui-monospace, monospace";
const control = { height: "32px", padding: "0 10px", borderRadius: "8px", border: "1px solid var(--c-border-light)", backgroundColor: "var(--c-bg)", color: "var(--c-text)", fontFamily: "inherit", fontSize: "0.8125rem" };
const cell = { height: "36px", padding: "0 10px", borderBottom: "1px solid var(--c-border)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

export const s = {
  app: css("grid-app", { display: "flex", flexDirection: "column", gap: "10px", width: "100%", height: "100%" }),
  hint: css("grid-hint", { fontSize: "0.8125rem", color: "var(--c-text-dim)", "& strong": { color: "var(--c-primary-ink)", fontVariantNumeric: "tabular-nums" } }),
  toolbar: css("grid-toolbar", { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }),
  search: css("grid-search", { ...control, flex: "1 1 180px", minWidth: "0", maxWidth: "320px" }),
  select: css("grid-select", control),
  bulk: css("grid-bulk", { display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto", fontSize: "0.8125rem", fontWeight: "600", fontVariantNumeric: "tabular-nums" }),
  btn: css("grid-btn", { ...control, fontWeight: "600", whiteSpace: "nowrap", hover: { backgroundColor: "var(--c-bg-secondary)" }, "&:disabled": { opacity: "0.4", cursor: "default" } }),
  danger: css("grid-danger", { borderColor: "transparent", backgroundColor: "var(--c-primary-dark)", color: "#fff", hover: { backgroundColor: "var(--c-primary-dark)", filter: "brightness(0.92)" } }),
  icon: css("grid-icon", { width: "32px", padding: "0" }),
  // The table scrolls inside this box, both ways: on a phone the page itself never does.
  scroller: css("grid-scroller", { flex: "1", minHeight: "200px", overflow: "auto", borderRadius: "10px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg)" }),
  // Fixed layout: the <col> widths are the column widths, whatever the cells hold.
  table: css("grid-table", { tableLayout: "fixed", borderCollapse: "separate", borderSpacing: "0", fontSize: "0.8125rem" }),
  th: css("grid-th", { ...cell, position: "sticky", top: "0", zIndex: 1, padding: "0", textAlign: "left", backgroundColor: "var(--c-bg-secondary)" }),
  sort: css("grid-sort", { display: "flex", alignItems: "center", gap: "4px", width: "100%", height: "36px", padding: "0 10px", fontSize: "inherit", fontWeight: "600", color: "var(--c-text-dim)", hover: { color: "var(--c-text)" } }),
  arrow: css("grid-arrow", { color: "var(--c-text-muted)" }),
  resize: css("grid-resize", { position: "absolute", top: "0", right: "0", width: "8px", height: "100%", borderRight: "1px solid var(--c-border)", cursor: "col-resize", touchAction: "none", hover: { backgroundColor: "var(--c-primary-alpha-19)" } }),
  tr: css("grid-tr", { hover: { backgroundColor: "var(--c-bg-secondary)" } }),
  picked: css("grid-picked", { backgroundColor: "var(--c-primary-alpha-08)", hover: { backgroundColor: "var(--c-primary-alpha-13)" } }),
  td: css("grid-td", cell),
  check: css("grid-check", { textAlign: "center", "& input": { accentColor: "var(--c-primary)", cursor: "pointer" } }),
  right: css("grid-right", { textAlign: "right", justifyContent: "flex-end", fontVariantNumeric: "tabular-nums" }),
  editable: css("grid-editable", { cursor: "text", focusVisible: { outline: "2px solid var(--c-primary)", outlineOffset: "-2px" } }),
  editor: css("grid-editor", { width: "100%", height: "28px", padding: "0 6px", borderRadius: "6px", border: "1px solid var(--c-primary)", outline: "none", backgroundColor: "var(--c-bg)", color: "var(--c-text)", fontFamily: "inherit", fontSize: "inherit", textAlign: "inherit", invalid: { borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.1)" } }),
  pill: css("grid-pill", { display: "inline-block", padding: "2px 8px", borderRadius: "999px", fontSize: "0.6875rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.02em" }),
  active: css("grid-active", { backgroundColor: "var(--c-primary-alpha-13)", color: "var(--c-primary-ink)" }),
  invited: css("grid-invited", { backgroundColor: "var(--c-bg-light)", color: "var(--c-accent-cool)" }),
  suspended: css("grid-suspended", { backgroundColor: "var(--c-bg-light)", color: "var(--c-text-muted)", textDecoration: "line-through" }),
  empty: css("grid-empty", { padding: "32px", textAlign: "center", color: "var(--c-text-muted)" }),
  footer: css("grid-footer", { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 14px", fontSize: "0.8125rem", color: "var(--c-text-dim)", fontVariantNumeric: "tabular-nums" }),
  totals: css("grid-totals", { flex: "1", fontFamily: mono, fontSize: "0.75rem", color: "var(--c-text-muted)" }),
  size: css("grid-size", { display: "flex", alignItems: "center", gap: "6px" }),
  pager: css("grid-pager", { display: "flex", gap: "4px" }),
};
