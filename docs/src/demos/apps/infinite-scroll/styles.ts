import "nuclo";

const mono = "ui-monospace, monospace";
const pulse = keyframes({ from: { opacity: "0.35" }, to: { opacity: "1" } });
// A row is 112px plus an 8px margin: the 120px the app's ROW constant counts with.
const card = { display: "flex", gap: "12px", height: "112px", marginBottom: "8px", padding: "10px 14px", borderRadius: "12px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg)" };

export const s = {
  app: css("feed-app", { display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "640px", height: "100%", margin: "0 auto" }),
  head: css("feed-head", { display: "flex", alignItems: "center", gap: "10px", fontSize: "0.875rem", "& strong": { fontVariantNumeric: "tabular-nums" } }),
  state: css("feed-state", { flex: "1", fontFamily: mono, fontSize: "0.75rem", color: "var(--c-text-muted)" }),
  btn: css("feed-btn", { height: "32px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--c-border-light)", fontSize: "0.8125rem", fontWeight: "600", color: "var(--c-text)", whiteSpace: "nowrap", hover: { backgroundColor: "var(--c-bg-secondary)" }, "&:disabled": { opacity: "0.45", cursor: "default" } }),
  feed: css("feed-feed", { flex: "1", minHeight: "0", overflowY: "auto", paddingRight: "4px" }),
  post: css("feed-post", card),
  avatar: css("feed-avatar", { display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, width: "36px", height: "36px", borderRadius: "10px", color: "#fff", fontWeight: "600" }),
  // The text is cut at two lines by height: a -webkit-box clamp would give the row the width of the unwrapped text.
  body: css("feed-body", { display: "flex", flexDirection: "column", alignItems: "flex-start", flex: "1", minWidth: "0", "& > div": { alignSelf: "stretch" }, "& p": { maxHeight: "2.9em", overflow: "hidden", margin: "2px 0 4px", fontSize: "0.875rem", lineHeight: "1.45" } }),
  meta: css("feed-meta", { display: "flex", alignItems: "baseline", gap: "8px", fontSize: "0.8125rem", color: "var(--c-text-muted)", "& strong": { color: "var(--c-text)" } }),
  id: css("feed-id", { marginLeft: "auto", fontFamily: mono, fontSize: "0.6875rem" }),
  like: css("feed-like", { display: "inline-flex", alignItems: "center", height: "24px", marginTop: "auto", padding: "0 10px", borderRadius: "999px", border: "1px solid var(--c-border)", fontSize: "0.75rem", color: "var(--c-text-dim)", fontVariantNumeric: "tabular-nums", hover: { borderColor: "var(--c-primary)", color: "var(--c-primary-ink)" } }),
  liked: css("feed-liked", { borderColor: "var(--c-primary)", color: "var(--c-primary-ink)", backgroundColor: "var(--c-primary-alpha-08)" }),
  sentinel: css("feed-sentinel", { minHeight: "1px" }),
  skeleton: css("feed-skeleton", { ...card, animation: `${pulse} 0.7s ease-in-out infinite alternate` }),
  bone: css("feed-bone", { height: "12px", borderRadius: "6px", backgroundColor: "var(--c-bg-light)" }),
  boneAvatar: css("feed-boneAvatar", { flexShrink: 0, width: "36px", height: "36px", borderRadius: "10px" }),
  boneLines: css("feed-boneLines", { display: "flex", flexDirection: "column", gap: "10px", flex: "1", paddingTop: "4px" }),
  boneShort: css("feed-boneShort", { width: "60%" }),
  error: css("feed-error", { display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "12px", border: "1px solid #ef4444", fontSize: "0.875rem", "& span": { flex: "1" } }),
};
