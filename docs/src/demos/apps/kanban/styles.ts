import "nuclo";

const mono = "ui-monospace, monospace";
const flash = keyframes({ from: { boxShadow: "0 0 0 2px var(--c-primary)" }, to: { boxShadow: "0 0 0 2px transparent" } });
const pop = keyframes({ from: { opacity: "0", transform: "translateY(8px) scale(0.98)" }, to: { opacity: "1", transform: "none" } });
const fade = keyframes({ from: { opacity: "0" }, to: { opacity: "1" } });
const focus = { outline: "2px solid var(--c-primary)", outlineOffset: "1px" };
const clamp = { WebkitLineClamp: "2", WebkitBoxOrient: "vertical" } as object; // not in the Style type
const control = { height: "34px", padding: "0 12px", borderRadius: "8px", fontSize: "0.8125rem", fontWeight: "600" };

export const s = {
  app: css("kanban-app", { position: "relative", display: "flex", flexDirection: "column", gap: "12px", width: "100%", height: "100%" }),
  hint: css("kanban-hint", { fontSize: "0.75rem", color: "var(--c-text-muted)", "& strong": { color: "var(--c-primary-ink)", fontVariantNumeric: "tabular-nums" } }),

  bar: css("kanban-bar", { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 16px", padding: "10px 12px", borderRadius: "12px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg-card)" }),
  brand: css("kanban-brand", { display: "flex", alignItems: "center", gap: "10px", "& h2": { fontSize: "1rem", fontWeight: "700", lineHeight: "1.2" } }),
  logo: css("kanban-logo", { display: "grid", placeItems: "center", width: "34px", height: "34px", borderRadius: "9px", backgroundColor: "var(--c-primary-dark)", color: "#fff", fontSize: "1.0625rem" }),
  sub: css("kanban-sub", { fontSize: "0.75rem", color: "var(--c-text-muted)", fontVariantNumeric: "tabular-nums" }),
  progress: css("kanban-progress", { flex: "1 1 80px", minWidth: "60px", maxWidth: "220px", height: "6px", borderRadius: "999px", backgroundColor: "var(--c-bg-light)", overflow: "hidden" }),
  fill: css("kanban-fill", { height: "100%", borderRadius: "999px", backgroundColor: "var(--c-primary)", transition: "width 0.3s ease" }),
  tools: css("kanban-tools", { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginLeft: "auto" }),
  search: css("kanban-search", { ...control, width: "170px", border: "1px solid var(--c-border-light)", backgroundColor: "var(--c-bg)", color: "var(--c-text)", fontWeight: "400", "&:focus-visible": focus }),
  team: css("kanban-team", { display: "flex", alignItems: "center", gap: "4px" }),
  member: css("kanban-member", { display: "grid", placeItems: "center", width: "34px", height: "34px", borderRadius: "999px", border: "2px solid transparent", opacity: "0.75", hover: { opacity: "1" }, "&:focus-visible": focus }),
  chip: css("kanban-chip", { height: "30px", padding: "0 10px", borderRadius: "999px", border: "1px solid var(--c-border-light)", fontSize: "0.75rem", fontWeight: "600", color: "var(--c-text-dim)", hover: { color: "var(--c-text)" }, "&:focus-visible": focus }),
  picked: css("kanban-picked", { opacity: "1", borderColor: "var(--c-primary)", backgroundColor: "var(--c-primary-alpha-13)", color: "var(--c-primary-ink)" }),

  primary: css("kanban-primary", { ...control, backgroundColor: "var(--c-primary-dark)", color: "#fff", whiteSpace: "nowrap", hover: { filter: "brightness(1.1)" }, "&:disabled": { opacity: "0.45", cursor: "not-allowed" }, "&:focus-visible": focus }),
  btn: css("kanban-btn", { ...control, border: "1px solid var(--c-border-light)", backgroundColor: "var(--c-bg)", color: "var(--c-text)", hover: { backgroundColor: "var(--c-bg-secondary)" }, "&:focus-visible": focus }),
  danger: css("kanban-danger", { ...control, color: "#d64545", hover: { backgroundColor: "rgba(214, 69, 69, 0.12)" }, "&:focus-visible": focus }),
  link: css("kanban-link", { fontSize: "0.8125rem", fontWeight: "700", color: "var(--c-primary-ink)", textDecoration: "underline" }),

  board: css("kanban-board", { display: "flex", gap: "12px", flex: "1", minHeight: "0", overflowX: "auto", paddingBottom: "4px", scrollSnapType: "x proximity" }),
  column: css("kanban-column", { display: "flex", flexDirection: "column", flex: "1 0 260px", minWidth: "0", scrollSnapAlign: "start", borderRadius: "12px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg-secondary)", "@media (max-width: 599px)": { flexBasis: "82%" } }),
  after: css("kanban-after", { boxShadow: "inset 0 -3px 0 var(--c-primary)" }),
  columnHead: css("kanban-columnHead", { display: "flex", alignItems: "center", gap: "4px", padding: "10px 10px 8px", "& h3": { flex: "1", fontSize: "0.8125rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--c-text-dim)" } }),
  count: css("kanban-count", { marginLeft: "8px", padding: "1px 7px", borderRadius: "999px", backgroundColor: "var(--c-bg-light)", fontFamily: mono, fontSize: "0.6875rem", fontWeight: "400", letterSpacing: "0", color: "var(--c-text-muted)" }),
  small: css("kanban-small", { minWidth: "26px", height: "26px", padding: "0 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600", color: "var(--c-text-dim)", hover: { color: "var(--c-text)", backgroundColor: "var(--c-bg-light)" }, "&:focus-visible": focus }),
  cards: css("kanban-cards", { display: "flex", flexDirection: "column", gap: "8px", flex: "1", minHeight: "60px", padding: "2px 8px 8px", overflowY: "auto" }),
  empty: css("kanban-empty", { display: "grid", placeItems: "center", minHeight: "64px", borderRadius: "10px", border: "1px dashed var(--c-border-light)", fontSize: "0.8125rem", color: "var(--c-text-muted)" }),
  addTask: css("kanban-addTask", { margin: "0 8px 8px", height: "32px", borderRadius: "8px", fontSize: "0.8125rem", fontWeight: "600", color: "var(--c-text-muted)", hover: { color: "var(--c-text)", backgroundColor: "var(--c-bg-light)" }, "&:focus-visible": focus }),

  card: css("kanban-card", { display: "flex", flexDirection: "column", gap: "6px", padding: "8px 10px 10px", borderRadius: "10px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg-card)", cursor: "grab", animation: `${flash} 0.8s ease-out`, hover: { borderColor: "var(--c-border-light)" }, "&:active": { cursor: "grabbing" }, "&:focus-visible": focus }),
  lifted: css("kanban-lifted", { opacity: "0.4" }),
  before: css("kanban-before", { boxShadow: "0 -7px 0 -2px var(--c-primary)" }),
  cardHead: css("kanban-cardHead", { display: "flex", alignItems: "center", gap: "6px" }),
  priority: css("kanban-priority", { height: "20px", padding: "0 7px", borderRadius: "999px", fontSize: "0.6875rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.02em" }),
  p1: css("kanban-p1", { backgroundColor: "var(--c-bg-light)", color: "var(--c-text-dim)" }),
  p2: css("kanban-p2", { backgroundColor: "var(--c-primary-alpha-13)", color: "var(--c-primary-ink)" }),
  p3: css("kanban-p3", { backgroundColor: "var(--c-primary-dark)", color: "#fff" }),
  id: css("kanban-id", { flex: "1", fontFamily: mono, fontSize: "0.6875rem", color: "var(--c-text-muted)" }),
  actions: css("kanban-actions", { display: "flex", gap: "2px" }),
  icon: css("kanban-icon", { width: "24px", height: "24px", borderRadius: "6px", fontSize: "0.875rem", color: "var(--c-text-muted)", hover: { color: "var(--c-text)", backgroundColor: "var(--c-bg-light)" }, "&:focus-visible": focus }),
  title: css("kanban-title", { fontSize: "0.875rem", fontWeight: "600", lineHeight: "1.4", overflowWrap: "anywhere" }),
  desc: css("kanban-desc", { fontSize: "0.8125rem", lineHeight: "1.4", color: "var(--c-text-dim)", display: "-webkit-box", ...clamp, overflow: "hidden" }),
  cardFoot: css("kanban-cardFoot", { display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }),
  avatar: css("kanban-avatar", { display: "grid", placeItems: "center", flex: "none", width: "24px", height: "24px", borderRadius: "999px", color: "#fff", fontSize: "0.625rem", fontWeight: "700", letterSpacing: "0.02em" }),
  nobody: css("kanban-nobody", { border: "1px dashed var(--c-text-muted)", color: "var(--c-text-muted)", backgroundColor: "transparent" }),
  assign: css("kanban-assign", { minWidth: "0", maxWidth: "100%", height: "24px", padding: "0 4px", borderRadius: "6px", border: "none", backgroundColor: "transparent", fontSize: "0.75rem", color: "var(--c-text-dim)", cursor: "pointer", hover: { backgroundColor: "var(--c-bg-light)", color: "var(--c-text)" }, "&:focus-visible": focus }),

  toast: css("kanban-toast", { position: "absolute", left: "50%", bottom: "16px", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: "14px", padding: "10px 16px", borderRadius: "10px", backgroundColor: "var(--c-bg-card)", border: "1px solid var(--c-border-light)", boxShadow: "0 8px 24px var(--c-shadow)", fontSize: "0.8125rem", animation: `${pop} 0.2s ease-out` }),

  overlay: css("kanban-overlay", { position: "absolute", inset: "0", zIndex: 10, display: "flex", overflowY: "auto", padding: "16px", backgroundColor: "rgba(0, 0, 0, 0.45)", animation: `${fade} 0.15s ease-out` }),
  dialog: css("kanban-dialog", { display: "flex", flexDirection: "column", gap: "14px", flex: "none", width: "100%", maxWidth: "440px", margin: "auto", padding: "16px", borderRadius: "14px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg-card)", boxShadow: "0 20px 50px var(--c-shadow)", animation: `${pop} 0.2s ease-out` }),
  dialogHead: css("kanban-dialogHead", { display: "flex", alignItems: "center", justifyContent: "space-between", "& h3": { fontSize: "1rem", fontWeight: "700" } }),
  dialogFoot: css("kanban-dialogFoot", { display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }),
  grow: css("kanban-grow", { flex: "1" }),
  field: css("kanban-field", { display: "flex", flexDirection: "column", gap: "6px", flex: "1", minWidth: "0", "& > span": { fontSize: "0.75rem", fontWeight: "600", color: "var(--c-text-dim)" } }),
  row: css("kanban-row", { display: "flex", gap: "12px" }),
  input: css("kanban-input", { width: "100%", minHeight: "36px", padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--c-border-light)", backgroundColor: "var(--c-bg)", color: "var(--c-text)", fontSize: "0.875rem", fontFamily: "inherit", "&:focus-visible": focus }),
  area: css("kanban-area", { resize: "vertical", lineHeight: "1.4" }),
  modes: css("kanban-modes", { display: "flex", padding: "2px", borderRadius: "9px", border: "1px solid var(--c-border-light)", backgroundColor: "var(--c-bg)" }),
  mode: css("kanban-mode", { flex: "1", height: "30px", borderRadius: "7px", fontSize: "0.8125rem", fontWeight: "600", color: "var(--c-text-dim)", hover: { color: "var(--c-text)" }, "&:focus-visible": focus }),
  on: css("kanban-on", { backgroundColor: "var(--c-primary-dark)", color: "#fff", hover: { color: "#fff" } }),
};
