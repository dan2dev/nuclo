// styles.ts: the look. Nothing here says left or right: text aligns to start
// or end, spacing is symmetric, and flex and grid follow the text direction.
// With dir="rtl" the whole shop mirrors by itself.
import "nuclo";

const mono = "ui-monospace, monospace";
const wide = "@media (min-width: 900px)";
const control = { height: "30px", padding: "0 10px", borderRadius: "8px", border: "1px solid var(--c-border-light)", backgroundColor: "var(--c-bg)", color: "var(--c-text)", fontFamily: "inherit", fontSize: "0.75rem", fontWeight: "600", whiteSpace: "nowrap" };
const panel = { borderRadius: "12px", border: "1px solid var(--c-border)" };

export const s = {
  app: css("i18n-app", { display: "flex", flexDirection: "column", gap: "10px", width: "100%", height: "100%" }),
  host: css("i18n-host", { flex: "1", minHeight: "0" }),
  shop: css("i18n-shop", { display: "flex", flexDirection: "column", gap: "14px", height: "100%", overflowY: "auto", textAlign: "start", color: "var(--c-text)" }),
  head: css("i18n-head", { display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "10px", "& h1": { fontSize: "1.25rem", fontWeight: "700", lineHeight: "1.2" } }),
  muted: css("i18n-muted", { fontSize: "0.75rem", color: "var(--c-text-muted)", lineHeight: "1.4" }),
  langs: css("i18n-langs", { display: "flex", flexWrap: "wrap", gap: "2px", padding: "3px", borderRadius: "10px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg-secondary)" }),
  lang: css("i18n-lang", { height: "28px", padding: "0 10px", borderRadius: "7px", fontSize: "0.8125rem", fontWeight: "600", color: "var(--c-text-dim)", hover: { color: "var(--c-text)" } }),
  on: css("i18n-on", { backgroundColor: "var(--c-bg-card)", color: "var(--c-primary-ink)", boxShadow: "0 1px 3px var(--c-shadow)" }),
  body: css("i18n-body", { display: "flex", flexDirection: "column", gap: "14px", [wide]: { flexDirection: "row", flex: "1", minHeight: "0" } }),
  grid: css("i18n-grid", { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", alignContent: "start", gap: "10px", listStyle: "none", "@media (min-width: 640px)": { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }, [wide]: { flex: "1", overflowY: "auto" } }),
  card: css("i18n-card", { ...panel, display: "flex", flexDirection: "column", gap: "2px", padding: "10px", backgroundColor: "var(--c-bg-card)", "& strong": { fontSize: "0.875rem", fontWeight: "600" } }),
  emoji: css("i18n-emoji", { display: "flex", alignItems: "center", justifyContent: "center", height: "64px", marginBottom: "6px", borderRadius: "8px", backgroundColor: "var(--c-bg-secondary)", fontSize: "2.25rem" }),
  buy: css("i18n-buy", { display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "6px", marginTop: "auto", paddingTop: "8px" }),
  price: css("i18n-price", { fontSize: "0.875rem", fontWeight: "600", fontVariantNumeric: "tabular-nums" }),
  btn: css("i18n-btn", { ...control, hover: { backgroundColor: "var(--c-bg-secondary)" }, "&:disabled": { opacity: "0.45", cursor: "default" } }),
  add: css("i18n-add", { borderColor: "transparent", backgroundColor: "var(--c-primary-alpha-13)", color: "var(--c-primary-ink)", hover: { backgroundColor: "var(--c-primary-alpha-19)" } }),
  primary: css("i18n-primary", { height: "36px", borderColor: "transparent", backgroundColor: "var(--c-primary-dark)", color: "#fff", fontSize: "0.875rem", hover: { backgroundColor: "var(--c-primary-dark)", filter: "brightness(0.92)" } }),
  cart: css("i18n-cart", { ...panel, display: "flex", flexDirection: "column", gap: "12px", padding: "14px", backgroundColor: "var(--c-bg-secondary)", [wide]: { width: "320px", flexShrink: 0, overflowY: "auto" } }),
  cartHead: css("i18n-cartHead", { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", "& h2": { fontSize: "1rem", fontWeight: "700" } }),
  lines: css("i18n-lines", { display: "flex", flexDirection: "column", gap: "6px", listStyle: "none" }),
  line: css("i18n-line", { display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8125rem" }),
  name: css("i18n-name", { flex: "1", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }),
  icon: css("i18n-icon", { ...control, width: "24px", height: "24px", padding: "0", borderRadius: "6px", fontSize: "0.875rem", color: "var(--c-text-dim)", hover: { color: "var(--c-text)" } }),
  qty: css("i18n-qty", { minWidth: "22px", textAlign: "center", fontVariantNumeric: "tabular-nums" }),
  amount: css("i18n-amount", { minWidth: "76px", textAlign: "end", fontWeight: "500", fontVariantNumeric: "tabular-nums" }),
  totals: css("i18n-totals", { display: "flex", flexDirection: "column", gap: "4px", paddingTop: "10px", borderTop: "1px solid var(--c-border)", fontSize: "0.8125rem", "& div": { display: "flex", justifyContent: "space-between", gap: "8px" }, "& dt": { color: "var(--c-text-dim)" }, "& dd": { fontVariantNumeric: "tabular-nums" } }),
  total: css("i18n-total", { paddingTop: "4px", fontSize: "0.9375rem", fontWeight: "700", "& dt": { color: "var(--c-text)" } }),
  field: css("i18n-field", { display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.75rem", color: "var(--c-text-dim)", "& input": { ...control, fontWeight: "400", fontSize: "0.8125rem" } }),
  delivery: css("i18n-delivery", { display: "flex", flexDirection: "column", gap: "2px", fontSize: "0.8125rem" }),
  foot: css("i18n-foot", { display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "4px 16px", paddingTop: "10px", borderTop: "1px solid var(--c-border)" }),
  diag: css("i18n-diag", { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 16px", padding: "8px 12px", borderRadius: "10px", backgroundColor: "var(--c-bg-secondary)", fontFamily: mono, fontSize: "0.75rem", color: "var(--c-text-muted)", "& strong": { color: "var(--c-primary-ink)", fontVariantNumeric: "tabular-nums" } }),
  diagLabel: css("i18n-diagLabel", { fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--c-text-dim)" }),
};
