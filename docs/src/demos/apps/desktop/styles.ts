// styles.ts: the look. The colors are the docs theme variables, so the desktop
// follows the light and dark themes.
import "nuclo";

const mono = "ui-monospace, monospace";
const pop = keyframes({ from: { opacity: "0", transform: "scale(0.97)" }, to: { opacity: "1", transform: "none" } });
const control = { height: "30px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--c-border-light)", backgroundColor: "var(--c-bg)", color: "var(--c-text)", fontFamily: "inherit", fontSize: "0.8125rem", fontWeight: "600", whiteSpace: "nowrap" };
const panel = { borderRadius: "12px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg-card)", animation: `${pop} 0.15s ease-out` };

export const s = {
  app: css("os-app", { position: "relative", isolation: "isolate", display: "flex", flexDirection: "column", width: "100%", height: "100%", overflow: "hidden", borderRadius: "12px", border: "1px solid var(--c-border)" }),
  // isolation: the windows' ever-growing z-indexes stay inside the desktop, under the taskbar and the modal layer
  desk: css("os-desk", { position: "relative", isolation: "isolate", flex: "1", minHeight: "0", overflow: "hidden", backgroundColor: "var(--c-bg-secondary)", backgroundImage: "radial-gradient(circle at 15% 10%, var(--c-primary-alpha-19), transparent 45%), radial-gradient(circle at 85% 95%, var(--c-primary-alpha-13), transparent 50%)" }),
  icons: css("os-icons", { display: "flex", flexDirection: "column", flexWrap: "wrap", alignContent: "flex-start", gap: "4px", height: "100%", padding: "10px" }),
  icon: css("os-icon", { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", width: "76px", padding: "8px 4px", borderRadius: "10px", fontSize: "0.75rem", color: "var(--c-text)", touchAction: "manipulation", userSelect: "none", hover: { backgroundColor: "var(--c-primary-alpha-13)" } }),
  glyph: css("os-glyph", { fontSize: "1.75rem", lineHeight: "1" }),

  win: css("os-win", { ...panel, position: "absolute", display: "flex", flexDirection: "column", borderRadius: "10px", overflow: "hidden", boxShadow: "0 2px 10px rgb(0 0 0 / 0.12)" }),
  active: css("os-active", { borderColor: "var(--c-border-light)", boxShadow: "var(--c-shadow), 0 0 0 1px var(--c-primary-alpha-19)", "& > header": { color: "var(--c-text)", backgroundColor: "var(--c-primary-alpha-08)" } }),
  minimized: css("os-minimized", { display: "none" }),
  maximized: css("os-maximized", { borderRadius: "0", "& .os-grip": { display: "none" } }),
  bar: css("os-bar", { display: "flex", alignItems: "center", gap: "2px", height: "34px", flexShrink: 0, paddingRight: "4px", borderBottom: "1px solid var(--c-border)", backgroundColor: "var(--c-bg-secondary)", color: "var(--c-text-muted)", userSelect: "none" }),
  title: css("os-title", { flex: "1", minWidth: "0", height: "100%", lineHeight: "34px", paddingLeft: "10px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontSize: "0.8125rem", fontWeight: "600", cursor: "grab", touchAction: "none" }),
  ctl: css("os-ctl", { width: "28px", height: "26px", borderRadius: "6px", fontSize: "0.875rem", hover: { color: "var(--c-text)", backgroundColor: "var(--c-bg-light)" } }),
  close: css("os-close", { hover: { color: "#fff", backgroundColor: "#dc2626" } }),
  body: css("os-body", { display: "flex", flexDirection: "column", flex: "1", minHeight: "0" }),
  grip: css("os-grip", { position: "absolute", right: "0", bottom: "0", width: "14px", height: "14px", cursor: "nwse-resize", touchAction: "none", backgroundImage: "linear-gradient(135deg, transparent 55%, var(--c-text-muted) 55% 62%, transparent 62% 76%, var(--c-text-muted) 76% 83%, transparent 83%)" }),

  backdrop: css("os-backdrop", { position: "absolute", inset: "0", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", backgroundColor: "rgb(0 0 0 / 0.3)" }),
  dialog: css("os-dialog", { ...panel, display: "flex", flexDirection: "column", gap: "8px", width: "min(340px, 100%)", padding: "18px", boxShadow: "var(--c-shadow)", "& h3": { fontSize: "1rem", fontWeight: "600" }, "& p": { fontSize: "0.875rem", color: "var(--c-text-dim)" } }),
  actions: css("os-actions", { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "6px" }),

  taskbar: css("os-taskbar", { position: "relative", display: "flex", alignItems: "center", gap: "6px", height: "46px", flexShrink: 0, padding: "0 6px", borderTop: "1px solid var(--c-border)", backgroundColor: "var(--c-bg-card)" }),
  start: css("os-start", { ...control, flexShrink: 0, hover: { backgroundColor: "var(--c-bg-secondary)" } }),
  menu: css("os-menu", { ...panel, position: "absolute", left: "6px", bottom: "calc(100% + 6px)", zIndex: 1, display: "flex", flexDirection: "column", width: "210px", padding: "6px", boxShadow: "var(--c-shadow)" }),
  item: css("os-item", { display: "flex", alignItems: "center", gap: "10px", height: "36px", padding: "0 10px", borderRadius: "8px", fontSize: "0.875rem", color: "var(--c-text)", textAlign: "left", hover: { backgroundColor: "var(--c-bg-secondary)" } }),
  tasks: css("os-tasks", { display: "flex", gap: "4px", flex: "1", minWidth: "0", overflowX: "auto", raw: { "scrollbar-width": "none" } }),
  task: css("os-task", { display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, maxWidth: "150px", height: "34px", padding: "0 10px", borderRadius: "8px", fontSize: "0.8125rem", color: "var(--c-text-dim)", hover: { backgroundColor: "var(--c-bg-secondary)" } }),
  current: css("os-current", { color: "var(--c-primary-ink)", backgroundColor: "var(--c-primary-alpha-13)", boxShadow: "inset 0 -2px 0 var(--c-primary)", hover: { backgroundColor: "var(--c-primary-alpha-13)" } }),
  faded: css("os-faded", { opacity: "0.55" }),
  label: css("os-label", { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", "@media (max-width: 600px)": { display: "none" } }),
  tray: css("os-tray", { display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, paddingLeft: "8px", borderLeft: "1px solid var(--c-border)", fontFamily: mono, fontSize: "0.75rem", fontVariantNumeric: "tabular-nums" }),
  trayItem: css("os-trayItem", { height: "28px", padding: "0 8px", borderRadius: "6px", fontFamily: "inherit", fontSize: "inherit", color: "var(--c-primary-ink)", backgroundColor: "var(--c-primary-alpha-13)" }),
  clock: css("os-clock", { padding: "0 6px", color: "var(--c-text-dim)" }),

  btn: css("os-btn", { ...control, hover: { backgroundColor: "var(--c-bg-secondary)" }, "&:disabled": { opacity: "0.45", cursor: "default" } }),
  primary: css("os-primary", { backgroundColor: "var(--c-primary-dark)", borderColor: "transparent", color: "#fff", hover: { backgroundColor: "var(--c-primary-dark)", filter: "brightness(0.92)" } }),
  danger: css("os-danger", { backgroundColor: "#dc2626", borderColor: "transparent", color: "#fff", hover: { backgroundColor: "#dc2626", filter: "brightness(0.92)" } }),
  notes: css("os-notes", { display: "flex", flexDirection: "column", flex: "1", minHeight: "0" }),
  textarea: css("os-textarea", { flex: "1", width: "100%", padding: "12px", border: "none", outline: "none", resize: "none", backgroundColor: "transparent", color: "var(--c-text)", fontFamily: "inherit", fontSize: "0.875rem", lineHeight: "1.5" }),
  foot: css("os-foot", { display: "flex", alignItems: "center", gap: "10px", padding: "6px 10px", borderTop: "1px solid var(--c-border)", fontSize: "0.75rem", color: "var(--c-text-muted)" }),
  calc: css("os-calc", { display: "flex", flexDirection: "column", gap: "8px", flex: "1", minHeight: "0", padding: "12px" }),
  display: css("os-display", { display: "block", padding: "6px 10px", borderRadius: "8px", backgroundColor: "var(--c-bg-secondary)", fontFamily: mono, fontSize: "1.5rem", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }),
  keys: css("os-keys", { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridAutoRows: "1fr", gap: "6px", flex: "1", minHeight: "0" }),
  key: css("os-key", { borderRadius: "8px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)", fontSize: "1rem", fontWeight: "600", hover: { backgroundColor: "var(--c-bg-secondary)" }, "&:nth-child(4n)": { color: "var(--c-primary-ink)" }, "&:last-child": { gridColumn: "span 4" } }),
  timer: css("os-timer", { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px", flex: "1", padding: "12px" }),
  countdown: css("os-countdown", { fontFamily: mono, fontSize: "2.75rem", fontWeight: "600", fontVariantNumeric: "tabular-nums" }),
  row: css("os-row", { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px" }),
  term: css("os-term", { display: "flex", flexDirection: "column-reverse", flex: "1", minHeight: "0", overflowY: "auto", padding: "10px", backgroundColor: "var(--c-bg)", fontFamily: mono, fontSize: "0.75rem", lineHeight: "1.5", "& pre": { margin: "0", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit" } }),
  prompt: css("os-prompt", { display: "flex", gap: "8px", color: "var(--c-primary-ink)", "& input": { flex: "1", minWidth: "0", border: "none", outline: "none", backgroundColor: "transparent", color: "var(--c-text)", fontFamily: "inherit", fontSize: "inherit" } }),
  about: css("os-about", { display: "flex", flexDirection: "column", gap: "8px", flex: "1", minHeight: "0", overflowY: "auto", padding: "14px", fontSize: "0.8125rem", lineHeight: "1.5", color: "var(--c-text-dim)", "& strong": { color: "var(--c-text)" }, "& ol": { listStyle: "none", borderRadius: "8px", border: "1px solid var(--c-border)" }, "& li": { display: "flex", justifyContent: "space-between", gap: "8px", padding: "5px 10px", color: "var(--c-text)" }, "& li + li": { borderTop: "1px solid var(--c-border)" }, "& li span:last-child": { fontFamily: mono, color: "var(--c-text-muted)" } }),
};
