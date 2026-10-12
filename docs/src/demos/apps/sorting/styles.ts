import "nuclo";

const mono = "ui-monospace, monospace";
const control = { height: "34px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--c-border-light)", backgroundColor: "var(--c-bg)", color: "var(--c-text)", fontFamily: "inherit", fontSize: "0.875rem" };

export const s = {
  app: css("sorting-app", { display: "flex", flexDirection: "column", gap: "14px", width: "100%", height: "100%", minHeight: "360px" }),
  toolbar: css("sorting-toolbar", { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }),
  select: css("sorting-select", { ...control, paddingRight: "28px" }),
  btn: css("sorting-btn", { ...control, fontWeight: "600", hover: { backgroundColor: "var(--c-bg-secondary)" }, "&:disabled": { opacity: "0.45", cursor: "default" } }),
  primary: css("sorting-primary", { minWidth: "72px", backgroundColor: "var(--c-primary-dark)", borderColor: "transparent", color: "#fff", hover: { backgroundColor: "var(--c-primary-dark)", filter: "brightness(0.92)" } }),
  speed: css("sorting-speed", { display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto", fontSize: "0.8125rem", color: "var(--c-text-dim)", "& input": { width: "120px", accentColor: "var(--c-primary)" }, "& span": { fontFamily: mono, fontSize: "0.75rem", minWidth: "40px" } }),
  bars: css("sorting-bars", { display: "flex", alignItems: "flex-end", gap: "3px", flex: "1", minHeight: "0", padding: "12px 0 0", borderBottom: "1px solid var(--c-border)" }),
  bar: css("sorting-bar", { position: "relative", flex: "1", minWidth: "0", borderRadius: "4px 4px 0 0", backgroundColor: "var(--c-bg-light)", transition: "background-color 0.12s ease" }),
  compare: css("sorting-compare", { backgroundColor: "var(--c-accent-cool)" }),
  swap: css("sorting-swap", { backgroundColor: "var(--c-primary)" }),
  sorted: css("sorting-sorted", { backgroundColor: "#22c55e", opacity: "0.75" }),
  value: css("sorting-value", { position: "absolute", top: "-18px", left: "0", right: "0", textAlign: "center", fontFamily: mono, fontSize: "0.625rem", color: "var(--c-text-muted)", "@media (max-width: 600px)": { display: "none" } }),
  status: css("sorting-status", { display: "flex", justifyContent: "space-between", gap: "12px", fontFamily: mono, fontSize: "0.75rem", color: "var(--c-text-dim)", "& span:last-child": { color: "var(--c-text)" } }),
};
