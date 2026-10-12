import "nuclo";

const mono = "ui-monospace, monospace";
const flash = keyframes({ from: { boxShadow: "0 0 0 2px var(--c-primary)" }, to: { boxShadow: "0 0 0 2px transparent" } });

export const s = {
  app: css("kanban-app", { display: "flex", flexDirection: "column", gap: "12px", width: "100%", height: "100%" }),
  hint: css("kanban-hint", { fontSize: "0.8125rem", color: "var(--c-text-dim)", "& strong": { color: "var(--c-primary-ink)", fontVariantNumeric: "tabular-nums" } }),
  board: css("kanban-board", { display: "flex", gap: "12px", flex: "1", minHeight: "0", overflowX: "auto", paddingBottom: "4px" }),
  column: css("kanban-column", { display: "flex", flexDirection: "column", flex: "1 0 240px", minWidth: "0", maxWidth: "340px", borderRadius: "12px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg-secondary)" }),
  after: css("kanban-after", { boxShadow: "inset 0 -3px 0 var(--c-primary)" }),
  columnHead: css("kanban-columnHead", { display: "flex", alignItems: "center", gap: "6px", padding: "10px 10px 8px", "& h3": { flex: "1", fontSize: "0.875rem", fontWeight: "600" } }),
  count: css("kanban-count", { marginLeft: "6px", fontFamily: mono, fontSize: "0.75rem", fontWeight: "400", color: "var(--c-text-muted)" }),
  small: css("kanban-small", { height: "26px", padding: "0 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600", color: "var(--c-text-dim)", hover: { color: "var(--c-text)", backgroundColor: "var(--c-bg-light)" } }),
  cards: css("kanban-cards", { display: "flex", flexDirection: "column", gap: "8px", flex: "1", minHeight: "60px", padding: "0 8px 8px", overflowY: "auto" }),
  card: css("kanban-card", { padding: "8px 10px 10px", borderRadius: "10px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg-card)", cursor: "grab", animation: `${flash} 0.8s ease-out`, "&:active": { cursor: "grabbing" } }),
  lifted: css("kanban-lifted", { opacity: "0.4" }),
  before: css("kanban-before", { boxShadow: "0 -7px 0 -2px var(--c-primary)" }),
  cardHead: css("kanban-cardHead", { display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }),
  priority: css("kanban-priority", { height: "20px", padding: "0 7px", borderRadius: "999px", fontSize: "0.6875rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.02em" }),
  p1: css("kanban-p1", { backgroundColor: "var(--c-bg-light)", color: "var(--c-text-dim)" }),
  p2: css("kanban-p2", { backgroundColor: "var(--c-primary-alpha-13)", color: "var(--c-primary-ink)" }),
  p3: css("kanban-p3", { backgroundColor: "var(--c-primary-dark)", color: "#fff" }),
  id: css("kanban-id", { flex: "1", fontFamily: mono, fontSize: "0.6875rem", color: "var(--c-text-muted)" }),
  icon: css("kanban-icon", { width: "24px", height: "24px", borderRadius: "6px", fontSize: "0.875rem", color: "var(--c-text-muted)", hover: { color: "var(--c-text)", backgroundColor: "var(--c-bg-light)" } }),
  title: css("kanban-title", { fontSize: "0.875rem", lineHeight: "1.4" }),
};
