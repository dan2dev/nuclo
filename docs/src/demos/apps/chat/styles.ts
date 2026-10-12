import "nuclo";

const mono = "ui-monospace, monospace";
const pop = keyframes({ from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } });
const pulse = keyframes({ from: { opacity: "0.35" }, to: { opacity: "1" } });
const bounce = keyframes({ "0%, 60%, 100%": { transform: "none" }, "30%": { transform: "translateY(-3px)" } });
const rule = { content: '""', flex: "1", height: "1px", backgroundColor: "var(--c-border)" };

export const s = {
  app: css("chat-app", { position: "relative", display: "flex", width: "100%", maxWidth: "1060px", height: "100%", margin: "0 auto", borderRadius: "12px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg)", overflow: "hidden" }),

  // ── The sidebar: channels on the left, an overlay drawer on phones. The
  // off-screen transform lives on the *closed* class inside the media query,
  // so opening (which drops the class) always wins the cascade.
  sidebar: css("chat-sidebar", { display: "flex", flexDirection: "column", width: "224px", flexShrink: 0, padding: "14px 10px", borderRight: "1px solid var(--c-border)", backgroundColor: "var(--c-bg-card)", "@media (max-width: 760px)": { position: "absolute", inset: "0 auto 0 0", zIndex: 30, width: "min(80%, 280px)", transition: "transform 0.22s ease", boxShadow: "0 0 60px var(--c-shadow)" } }),
  sidebarClosed: css("chat-sidebar-closed", { "@media (max-width: 760px)": { transform: "translateX(-100%)" } }),
  backdrop: css("chat-backdrop", { display: "none", "@media (max-width: 760px)": { display: "block", position: "absolute", inset: "0", zIndex: 20, backgroundColor: "rgba(0,0,0,0.45)" } }),
  brand: css("chat-brand", { display: "flex", alignItems: "center", gap: "8px", padding: "2px 8px 12px", fontWeight: "700", fontSize: "0.9375rem" }),
  logo: css("chat-logo", { display: "flex", alignItems: "center", justifyContent: "center", width: "26px", height: "26px", borderRadius: "8px", backgroundColor: "var(--c-primary-dark)", color: "#fff", fontSize: "0.75rem" }),
  sideLabel: css("chat-side-label", { padding: "0 8px 6px", fontSize: "0.6875rem", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--c-text-muted)" }),
  channel: css("chat-channel", { display: "flex", alignItems: "center", gap: "8px", width: "100%", height: "34px", padding: "0 8px", borderRadius: "8px", fontSize: "0.875rem", color: "var(--c-text-dim)", hover: { backgroundColor: "var(--c-bg-secondary)", color: "var(--c-text)" } }),
  channelOn: css("chat-channel-on", { backgroundColor: "var(--c-primary-alpha-13)", color: "var(--c-text)" }),
  hash: css("chat-hash", { color: "var(--c-text-muted)", fontWeight: "600" }),
  channelName: css("chat-channel-name", { flex: "1", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left" }),
  badge: css("chat-badge", { minWidth: "20px", height: "20px", padding: "0 6px", borderRadius: "999px", backgroundColor: "var(--c-primary-dark)", color: "#fff", fontSize: "0.6875rem", fontWeight: "700", lineHeight: "20px", textAlign: "center", animation: `${pop} 0.18s ease-out both` }),
  sideFoot: css("chat-side-foot", { marginTop: "auto", padding: "12px 8px 2px", borderTop: "1px solid var(--c-border)" }),
  you: css("chat-you", { display: "flex", alignItems: "center", gap: "10px" }),
  youAvatar: css("chat-you-avatar", { display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, width: "32px", height: "32px", borderRadius: "9px", backgroundColor: "hsl(24 70% 48%)", color: "#fff", fontWeight: "700", fontSize: "0.8125rem" }),
  youMeta: css("chat-you-meta", { display: "flex", flexDirection: "column", minWidth: "0" }),
  youName: css("chat-you-name", { fontSize: "0.875rem", fontWeight: "600", lineHeight: "1.3" }),
  youSub: css("chat-you-sub", { fontSize: "0.75rem", color: "var(--c-text-muted)", lineHeight: "1.3" }),

  // ── The main column: header, log, composer ──
  main: css("chat-main", { display: "flex", flexDirection: "column", flex: "1", minWidth: "0" }),
  head: css("chat-head", { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 12px", padding: "10px 14px", borderBottom: "1px solid var(--c-border)" }),
  menuBtn: css("chat-menu-btn", { display: "none", alignItems: "center", justifyContent: "center", width: "34px", height: "34px", borderRadius: "8px", color: "var(--c-text-dim)", fontSize: "1rem", hover: { backgroundColor: "var(--c-bg-secondary)", color: "var(--c-text)" }, "@media (max-width: 760px)": { display: "flex" } }),
  headMain: css("chat-head-main", { display: "flex", flexDirection: "column", minWidth: "0", fontSize: "0.9375rem" }),
  topic: css("chat-topic", { fontSize: "0.75rem", color: "var(--c-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }),
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

  // ── A message: grid rows for day, divider, avatar+meta, text, reactions ──
  msg: css("chat-msg", { position: "relative", display: "grid", gridTemplateColumns: "36px minmax(0, 1fr)", columnGap: "10px", padding: "1px 10px", borderRadius: "8px", hover: { backgroundColor: "var(--c-bg-secondary)" }, "&:hover [data-chat-actions], &:focus-within [data-chat-actions]": { opacity: "1", pointerEvents: "auto" } }),
  first: css("chat-first", { marginTop: "10px" }),
  sending: css("chat-sending", { opacity: "0.5" }),
  failed: css("chat-failed", { "& p": { color: "#ef4444" } }),
  live: css("chat-live", { animation: `${pop} 0.22s ease-out both` }),
  mentionRow: css("chat-mention-row", { backgroundColor: "var(--c-primary-alpha-08)", boxShadow: "inset 2px 0 0 var(--c-primary)", hover: { backgroundColor: "var(--c-primary-alpha-13)" } }),
  day: css("chat-day", { gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "10px", margin: "10px 0 4px", fontSize: "0.75rem", fontWeight: "600", color: "var(--c-text-muted)", before: rule, after: rule }),
  divider: css("chat-divider", { gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "10px", margin: "12px 0 4px", fontSize: "0.75rem", fontWeight: "700", color: "var(--c-primary-ink)", whiteSpace: "nowrap", before: rule, after: rule }),
  dividerBtn: css("chat-divider-btn", { height: "22px", padding: "0 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600", color: "var(--c-text-dim)", hover: { color: "var(--c-text)", backgroundColor: "var(--c-bg-light)" } }),
  avatar: css("chat-avatar", { gridRow: "span 2", display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", marginTop: "2px", borderRadius: "10px", color: "#fff", fontWeight: "600" }),
  meta: css("chat-meta", { display: "flex", alignItems: "baseline", gap: "8px", fontSize: "0.8125rem", "& time": { fontFamily: mono, fontSize: "0.6875rem", color: "var(--c-text-muted)" } }),
  edited: css("chat-edited", { fontSize: "0.6875rem", color: "var(--c-text-muted)", fontStyle: "italic" }),

  // ── Text: markdown-lite segments, rendered by a nested list ──
  text: css("chat-text", { gridColumn: "2", fontSize: "0.875rem", lineHeight: "1.5", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }),
  code: css("chat-code", { fontFamily: mono, fontSize: "0.8125em", padding: "1px 5px", borderRadius: "5px", backgroundColor: "var(--c-bg-secondary)", border: "1px solid var(--c-border)", color: "var(--c-text)", whiteSpace: "pre-wrap" }),
  link: css("chat-link", { color: "var(--c-primary-ink)", textDecoration: "none", fontWeight: "500", hover: { textDecoration: "underline" } }),
  mention: css("chat-mention", { color: "var(--c-primary-ink)", fontWeight: "600" }),
  mentionMe: css("chat-mention-me", { padding: "0 4px", borderRadius: "5px", backgroundColor: "var(--c-primary-alpha-13)", color: "var(--c-primary-ink)", fontWeight: "600" }),

  edit: css("chat-edit", { gridColumn: "2", display: "block", width: "100%", minHeight: "38px", margin: "0", padding: "6px 8px", borderRadius: "8px", border: "1px solid var(--c-primary)", backgroundColor: "var(--c-bg)", color: "var(--c-text)", fontFamily: "inherit", fontSize: "0.875rem", lineHeight: "1.5", resize: "vertical", whiteSpace: "pre-wrap", overflowWrap: "anywhere", raw: { "field-sizing": "content" }, focus: { outline: "none" } }),

  // ── Reactions, the picker and the hover actions ──
  reactions: css("chat-reactions", { gridColumn: "2", display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }),
  reaction: css("chat-reaction", { display: "inline-flex", alignItems: "center", gap: "5px", height: "24px", padding: "0 8px 0 6px", borderRadius: "999px", border: "1px solid var(--c-border-light)", backgroundColor: "var(--c-bg-secondary)", fontSize: "0.8125rem", hover: { borderColor: "var(--c-primary)" } }),
  reactionMine: css("chat-reaction-mine", { borderColor: "var(--c-primary)", backgroundColor: "var(--c-primary-alpha-13)" }),
  reactionCount: css("chat-reaction-count", { fontSize: "0.75rem", fontWeight: "600", color: "var(--c-text-dim)", fontVariantNumeric: "tabular-nums" }),
  picker: css("chat-picker", { gridColumn: "2", display: "flex", flexWrap: "wrap", gap: "2px", width: "fit-content", marginTop: "6px", padding: "4px", borderRadius: "10px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg-card)", boxShadow: "0 10px 30px var(--c-shadow)", animation: `${pop} 0.15s ease-out both` }),
  pick: css("chat-pick", { display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", fontSize: "1.0625rem", transition: "transform 0.12s ease", hover: { backgroundColor: "var(--c-bg-secondary)", transform: "scale(1.15)" } }),
  actions: css("chat-actions", { position: "absolute", top: "4px", right: "8px", zIndex: 5, display: "flex", alignItems: "center", gap: "2px", padding: "2px", borderRadius: "8px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg-card)", boxShadow: "0 6px 20px var(--c-shadow)", opacity: "0", pointerEvents: "none", transition: "opacity 0.12s ease", "@media (hover: none)": { opacity: "1", pointerEvents: "auto" } }),
  action: css("chat-action", { display: "flex", alignItems: "center", gap: "4px", height: "26px", padding: "0 7px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600", color: "var(--c-text-dim)", whiteSpace: "nowrap", hover: { color: "var(--c-text)", backgroundColor: "var(--c-bg-secondary)" } }),
  retry: css("chat-retry", { gridColumn: "2", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "#ef4444" }),
  small: css("chat-small", { height: "22px", padding: "0 6px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600", color: "var(--c-text-dim)", hover: { color: "var(--c-text)", backgroundColor: "var(--c-bg-light)" } }),

  // ── The new-message pill and the typing row ──
  pill: css("chat-pill", { position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", height: "30px", padding: "0 14px", borderRadius: "999px", backgroundColor: "var(--c-primary-dark)", color: "#fff", fontSize: "0.8125rem", fontWeight: "600", whiteSpace: "nowrap", boxShadow: "0 4px 14px var(--c-shadow)", animation: `${pop} 0.18s ease-out both` }),
  typingRow: css("chat-typing-row", { display: "flex", alignItems: "center", gap: "10px", padding: "6px 10px 2px", fontSize: "0.8125rem", fontStyle: "italic", color: "var(--c-text-muted)" }),
  dots: css("chat-dots", { display: "inline-flex", gap: "3px", "& i": { width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--c-text-muted)", animation: `${bounce} 1s ease-in-out infinite`, "&:nth-child(2)": { raw: { "animation-delay": "0.15s" } }, "&:nth-child(3)": { raw: { "animation-delay": "0.3s" } } } }),

  // ── The composer ──
  composerArea: css("chat-composer-area", { position: "relative", flexShrink: 0 }),
  composer: css("chat-composer", { display: "flex", alignItems: "flex-end", gap: "8px", padding: "0 12px 12px" }),
  // field-sizing grows the box with Shift+Enter lines where it is supported. 16px on phones: iOS zooms into smaller inputs.
  input: css("chat-input", { flex: "1", minWidth: "0", minHeight: "38px", maxHeight: "120px", padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--c-border-light)", backgroundColor: "var(--c-bg-secondary)", color: "var(--c-text)", fontFamily: "inherit", fontSize: "0.875rem", lineHeight: "1.4", resize: "none", raw: { "field-sizing": "content" }, focus: { outline: "none", borderColor: "var(--c-primary)" }, "@media (max-width: 600px)": { fontSize: "16px" } }),
  emojiBtn: css("chat-emoji-btn", { display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, width: "38px", height: "38px", borderRadius: "10px", border: "1px solid var(--c-border-light)", backgroundColor: "var(--c-bg-secondary)", fontSize: "1.0625rem", hover: { backgroundColor: "var(--c-bg-light)" } }),
  composerPicker: css("chat-composer-picker", { position: "absolute", right: "12px", bottom: "calc(100% - 8px)", zIndex: 10, display: "flex", gap: "2px", padding: "4px", borderRadius: "10px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg-card)", boxShadow: "0 10px 30px var(--c-shadow)", animation: `${pop} 0.15s ease-out both` }),
  send: css("chat-send", { height: "38px", padding: "0 16px", borderRadius: "10px", backgroundColor: "var(--c-primary-dark)", color: "#fff", fontSize: "0.875rem", fontWeight: "600", "&:disabled": { opacity: "0.45", cursor: "default" } }),
};
