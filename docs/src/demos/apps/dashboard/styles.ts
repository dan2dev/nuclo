// styles.ts: the cards and their grid. One column on phones, two on tablets,
// three on desktops, where the tickers run down the left. The queries do not
// overlap: media rules are emitted in the order they were first seen, so two
// min-width queries that both match would not cascade by size.
import "nuclo";

const mono = "ui-monospace, monospace";
const desktop = "@media (min-width: 900px)"; // the tickers span two rows, the load chart two columns
const flash = keyframes({ from: { backgroundColor: "var(--c-primary-alpha-19)" }, to: { backgroundColor: "transparent" } });

export const s = {
  app: css("dash-app", { display: "flex", flexDirection: "column", gap: "12px", width: "100%", height: "100%" }),
  stats: css("dash-stats", { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 16px" }),
  total: css("dash-total", { display: "flex", alignItems: "baseline", gap: "8px", flex: "1 1 260px", fontSize: "0.875rem", color: "var(--c-text-dim)", "& strong": { fontFamily: mono, fontSize: "1.625rem", color: "var(--c-primary-ink)", fontVariantNumeric: "tabular-nums" } }),
  controls: css("dash-controls", { display: "flex", flexWrap: "wrap", gap: "8px" }),
  modes: css("dash-modes", { display: "flex", padding: "2px", borderRadius: "9px", border: "1px solid var(--c-border-light)", backgroundColor: "var(--c-bg)" }),
  mode: css("dash-mode", { height: "28px", padding: "0 10px", borderRadius: "7px", fontSize: "0.8125rem", fontWeight: "600", color: "var(--c-text-dim)", whiteSpace: "nowrap", hover: { color: "var(--c-text)" } }),
  on: css("dash-on", { backgroundColor: "var(--c-primary-dark)", color: "#fff", hover: { color: "#fff" } }),
  btn: css("dash-btn", { height: "34px", padding: "0 14px", borderRadius: "8px", border: "1px solid var(--c-border-light)", backgroundColor: "var(--c-bg)", color: "var(--c-text)", fontSize: "0.8125rem", fontWeight: "600", hover: { backgroundColor: "var(--c-bg-secondary)" } }),
  hint: css("dash-hint", { flexBasis: "100%", fontSize: "0.8125rem", lineHeight: "1.5", color: "var(--c-text-dim)", "& code": { fontFamily: mono, fontSize: "0.75rem", color: "var(--c-primary-ink)" } }),
  grid: css("dash-grid", { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", alignContent: "start", gap: "12px", flex: "1", minHeight: "0", overflowY: "auto", "@media (min-width: 600px) and (max-width: 899px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }, [desktop]: { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" } }),
  card: css("dash-card", { display: "flex", flexDirection: "column", gap: "8px", minWidth: "0", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg-card)" }),
  tall: css("dash-tall", { [desktop]: { gridRow: "span 2" } }),
  wide: css("dash-wide", { [desktop]: { gridColumn: "span 2" } }),
  cardHead: css("dash-cardHead", { display: "flex", alignItems: "center", gap: "8px", "& h3": { fontSize: "0.875rem", fontWeight: "600" } }),
  rate: css("dash-rate", { padding: "1px 7px", borderRadius: "999px", backgroundColor: "var(--c-bg-light)", fontFamily: mono, fontSize: "0.6875rem", color: "var(--c-text-dim)" }),
  evals: css("dash-evals", { marginLeft: "auto", fontFamily: mono, fontSize: "0.75rem", color: "var(--c-primary-ink)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }),
  call: css("dash-call", { marginTop: "-4px", fontFamily: mono, fontSize: "0.6875rem", color: "var(--c-text-muted)" }),
  // On the desktop grid the card is two rows tall: the rows share the height.
  tickers: css("dash-tickers", { display: "flex", flexDirection: "column", justifyContent: "space-around", flex: "1", listStyle: "none" }),
  ticker: css("dash-ticker", { display: "grid", gridTemplateColumns: "44px minmax(0, 1fr) 60px 60px", alignItems: "center", gap: "8px", height: "30px", fontFamily: mono, fontSize: "0.8125rem", fontVariantNumeric: "tabular-nums", textAlign: "right", "& strong": { textAlign: "left", color: "var(--c-text)" } }),
  up: css("dash-up", { color: "var(--c-accent-cool)" }),
  down: css("dash-down", { color: "var(--c-accent-warm)" }),
  spark: css("dash-spark", { width: "100%", height: "18px", overflow: "visible" }),
  line: css("dash-line", { raw: { fill: "none", stroke: "currentColor", "stroke-width": "1.5", "stroke-linejoin": "round", "vector-effect": "non-scaling-stroke" } }),
  price: css("dash-price", { color: "var(--c-text)" }),
  readings: css("dash-readings", { display: "flex", flexWrap: "wrap", gap: "4px 16px", fontFamily: mono, fontSize: "0.8125rem", fontVariantNumeric: "tabular-nums", color: "var(--c-text-dim)" }),
  cpu: css("dash-cpu", { color: "var(--c-primary)" }),
  memory: css("dash-memory", { color: "var(--c-accent-cool)" }),
  chart: css("dash-chart", { width: "100%", height: "120px", overflow: "visible" }),
  rule: css("dash-rule", { raw: { stroke: "var(--c-border)", "vector-effect": "non-scaling-stroke" } }),
  area: css("dash-area", { color: "var(--c-primary)", raw: { fill: "currentColor", "fill-opacity": "0.12" } }),
  clock: css("dash-clock", { display: "flex", flexDirection: "column", justifyContent: "center", gap: "2px", flex: "1", "& strong": { fontFamily: mono, fontSize: "2rem", fontWeight: "600", fontVariantNumeric: "tabular-nums" }, "& span": { fontSize: "0.8125rem", color: "var(--c-text-dim)" } }),
  log: css("dash-log", { listStyle: "none", fontSize: "0.8125rem" }),
  order: css("dash-order", { display: "flex", gap: "8px", padding: "3px 6px", borderRadius: "6px", fontVariantNumeric: "tabular-nums", animation: `${flash} 1s ease-out` }),
  id: css("dash-id", { fontFamily: mono, fontSize: "0.75rem", color: "var(--c-text-muted)" }),
  what: css("dash-what", { flex: "1", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }),
};
