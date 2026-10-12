import "nuclo";

const mono = "ui-monospace, monospace";
const pulse = keyframes({ from: { opacity: "0.35" }, to: { opacity: "1" } });
const rule = { content: '""', flex: "1", height: "1px", backgroundColor: "var(--c-border)" };

export const s = {
  app: css("chat-app", { display: "flex", flexDirection: "column", width: "100%", maxWidth: "760px", height: "100%", margin: "0 auto", borderRadius: "12px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg)", overflow: "hidden" }),
  head: css("chat-head", { display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 12px", padding: "10px 14px", borderBottom: "1px solid var(--c-border)", fontSize: "0.9375rem" }),
  online: css("chat-online", { display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8125rem", color: "var(--c-text-dim)", before: { content: '""', width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#22c55e" } }),
  state: css("chat-state", { marginLeft: "auto", fontFamily: mono, fontSize: "0.75rem", color: "var(--c-text-muted)", fontVariantNumeric: "tabular-nums" }),
  pane: css("chat-pane", { position: "relative", display: "flex", flexDirection: "column", flex: "1", minHeight: "0" }),
  // The browser's own scroll anchoring is off: the app anchors by hand, the same in every browser.
  log: css("chat-log", { display: "flex", flexDirection: "column", flex: "1", minHeight: "0", overflowY: "auto", padding: "8px 6px", raw: { "overflow-anchor": "none" } }),
  // The auto margin pushes a short history down to the composer, like a chat; once it overflows, it is 0.
  top: css("chat-top", { marginTop: "auto", padding: "12px 10px", fontSize: "0.8125rem" }),
  loading: css("chat-loading", { color: "var(--c-text-muted)", textAlign: "center", animation: `${pulse} 0.7s ease-in-out infinite alternate` }),
  beginning: css("chat-beginning", { fontWeight: "600", color: "var(--c-text-dim)", textAlign: "center" }),
  error: css("chat-error", { display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "10px", border: "1px solid #ef4444", "& span": { flex: "1" } }),
  btn: css("chat-btn", { height: "30px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--c-border-light)", fontSize: "0.8125rem", fontWeight: "600", color: "var(--c-text)", hover: { backgroundColor: "var(--c-bg-secondary)" } }),
  msg: css("chat-msg", { display: "grid", gridTemplateColumns: "36px minmax(0, 1fr)", columnGap: "10px", padding: "1px 10px", borderRadius: "8px", hover: { backgroundColor: "var(--c-bg-secondary)" } }),
  first: css("chat-first", { marginTop: "10px" }),
  sending: css("chat-sending", { opacity: "0.5" }),
  failed: css("chat-failed", { "& p": { color: "#ef4444" } }),
  day: css("chat-day", { gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "10px", margin: "10px 0 4px", fontSize: "0.75rem", fontWeight: "600", color: "var(--c-text-muted)", before: rule, after: rule }),
  avatar: css("chat-avatar", { gridRow: "span 2", display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", marginTop: "2px", borderRadius: "10px", color: "#fff", fontWeight: "600" }),
  meta: css("chat-meta", { display: "flex", alignItems: "baseline", gap: "8px", fontSize: "0.8125rem", "& time": { fontFamily: mono, fontSize: "0.6875rem", color: "var(--c-text-muted)" } }),
  text: css("chat-text", { gridColumn: "2", fontSize: "0.875rem", lineHeight: "1.5", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }),
  retry: css("chat-retry", { gridColumn: "2", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "#ef4444" }),
  small: css("chat-small", { height: "22px", padding: "0 6px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600", color: "var(--c-text-dim)", hover: { color: "var(--c-text)", backgroundColor: "var(--c-bg-light)" } }),
  pill: css("chat-pill", { position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", height: "30px", padding: "0 14px", borderRadius: "999px", backgroundColor: "var(--c-primary-dark)", color: "#fff", fontSize: "0.8125rem", fontWeight: "600", whiteSpace: "nowrap", boxShadow: "0 4px 14px var(--c-shadow)" }),
  // A fixed height: the line is there even when nobody types, so the messages never shift.
  typing: css("chat-typing", { height: "22px", padding: "4px 16px 0", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontSize: "0.75rem", fontStyle: "italic", color: "var(--c-text-muted)" }),
  composer: css("chat-composer", { display: "flex", alignItems: "flex-end", gap: "8px", padding: "0 12px 12px" }),
  // field-sizing grows the box with Shift+Enter lines where it is supported. 16px on phones: iOS zooms into smaller inputs.
  input: css("chat-input", { flex: "1", minWidth: "0", minHeight: "38px", maxHeight: "120px", padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--c-border-light)", backgroundColor: "var(--c-bg-secondary)", color: "var(--c-text)", fontFamily: "inherit", fontSize: "0.875rem", lineHeight: "1.4", resize: "none", raw: { "field-sizing": "content" }, focus: { outline: "none", borderColor: "var(--c-primary)" }, "@media (max-width: 600px)": { fontSize: "16px" } }),
  send: css("chat-send", { height: "38px", padding: "0 16px", borderRadius: "10px", backgroundColor: "var(--c-primary-dark)", color: "#fff", fontSize: "0.875rem", fontWeight: "600", "&:disabled": { opacity: "0.45", cursor: "default" } }),
};
