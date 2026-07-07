import { css, colors } from "../../styles.ts";
import { animations } from "../../styles/animations.ts";

const mono = "'JetBrains Mono', monospace";
const sans = "'Space Grotesk', system-ui, sans-serif";

export const es = {
  hero: css({ animation: `${animations.riseIn} 0.58s cubic-bezier(0.22, 1, 0.36, 1) both`, padding: "60px 0 38px", borderBottom: `1px solid ${colors.border}`, "@media (max-width: 600px)": { padding: "42px 0 30px" } }),
  heroInner: css({ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: "42px", alignItems: "end", "@media (max-width: 900px)": { gridTemplateColumns: "1fr", alignItems: "start", gap: "28px" } }),
  kicker: css({ fontFamily: mono, fontSize: "0.72rem", fontWeight: "800", letterSpacing: "0", textTransform: "uppercase", color: colors.primary, marginBottom: "12px" }),
  title: css({ maxWidth: "660px", fontSize: "3rem", fontWeight: "800", letterSpacing: "0", lineHeight: "1.08", marginBottom: "16px", "@media (max-width: 600px)": { fontSize: "2.15rem" } }),
  lead: css({ maxWidth: "620px", fontSize: "1.05rem", color: colors.textDim, lineHeight: "1.75" }),
  facts: css({ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px", "@media (max-width: 900px)": { maxWidth: "520px" }, "@media (max-width: 600px)": { gridTemplateColumns: "1fr" } }),
  heroMarkWrap: css({ display: "flex", justifyContent: "flex-end", alignItems: "center", minHeight: "150px", "@media (max-width: 900px)": { justifyContent: "flex-start", minHeight: "auto" } }),
  heroMark: css({ width: "142px", height: "142px", transform: "rotate(6deg)", filter: "drop-shadow(0 24px 30px rgba(255,63,0,0.20))" }),
  grid: css({ animation: `${animations.riseIn} 0.58s cubic-bezier(0.22, 1, 0.36, 1) both`, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "18px", padding: "38px 0 64px", "@media (max-width: 900px)": { gridTemplateColumns: "1fr" }, "@media (max-width: 600px)": { padding: "28px 0 52px" } }),

  card: css({ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "8px", overflow: "hidden", display: "flex", flexDirection: "column", minWidth: "0", animation: `${animations.riseIn} 0.56s cubic-bezier(0.22, 1, 0.36, 1) both`, transition: "transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease", hover: { transform: "translateY(-3px)", borderColor: colors.borderPrimary, backgroundColor: "color-mix(in srgb, var(--c-bg-card) 86%, var(--c-bg-secondary))", boxShadow: "0 18px 42px -28px var(--c-primary-glow)" } }),
  cardDelay1: css({ raw: { "animation-delay": "0.04s" } }),
  cardDelay2: css({ raw: { "animation-delay": "0.08s" } }),
  cardDelay3: css({ raw: { "animation-delay": "0.12s" } }),
  cardDelay4: css({ raw: { "animation-delay": "0.16s" } }),
  cardTop: css({ padding: "20px 20px 0", "@media (max-width: 600px)": { padding: "18px 16px 0" } }),
  cardMetaRow: css({ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }),
  cardBadge: css({ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.7rem", fontWeight: "800", letterSpacing: "0", textTransform: "uppercase", padding: "3px 9px", borderRadius: "999px", backgroundColor: colors.primaryAlpha08, color: colors.primary, border: `1px solid ${colors.borderPrimary}` }),
  cardNumber: css({ fontFamily: mono, fontSize: "0.72rem", fontWeight: "800", color: colors.textMuted }),
  cardTitle: css({ fontSize: "1.08rem", fontWeight: "800", marginBottom: "5px" }),
  cardDesc: css({ fontSize: "0.86rem", color: colors.textDim, lineHeight: "1.58", minHeight: "2.75em" }),
  tabs: css({ display: "flex", gap: "4px", borderBottom: `1px solid ${colors.border}`, padding: "14px 20px 0", marginTop: "16px", "@media (max-width: 600px)": { padding: "12px 16px 0" } }),
  tab: css({ fontSize: "0.8rem", fontWeight: "700", color: colors.textMuted, padding: "8px 12px", borderBottom: "2px solid transparent", borderRadius: "6px 6px 0 0", transition: "all 0.18s ease", cursor: "pointer", backgroundColor: "transparent", borderTop: "none", borderLeft: "none", borderRight: "none", fontFamily: sans, hover: { color: colors.textDim, backgroundColor: colors.bgSecondary } }),
  tabActive: css({ color: colors.primary, borderBottomColor: colors.primary, backgroundColor: colors.primaryAlpha08, hover: { color: colors.primary } }),
  pane: css({ display: "none" }),
  paneActive: css({ display: "block" }),
  previewPane: css({ padding: "30px 24px", height: "320px", overflow: "auto", display: "flex", flexDirection: "column", alignItems: "center", backgroundColor: colors.bgCode, borderTop: "1px solid rgba(255,255,255,0.02)", "&::before": { content: "''", flex: "1" }, "&::after": { content: "''", flex: "1" }, "@media (max-width: 600px)": { height: "260px", padding: "24px 16px" } }),
  codePaneActive: css({ display: "flex", flexDirection: "column", height: "320px", overflow: "hidden", "& > *": { flex: "1", minHeight: "0", display: "flex", flexDirection: "column", overflow: "hidden" }, "& > * > *:last-child": { flex: "1", minHeight: "0", overflow: "auto" }, "@media (max-width: 600px)": { height: "260px" } }),

  counter: css({ textAlign: "center", width: "100%" }),
  countValue: css({ fontSize: "5rem", fontWeight: "700", lineHeight: "1", color: colors.text, marginBottom: "6px", fontVariantNumeric: "tabular-nums", transition: "transform 0.1s ease" }),
  countLabel: css({ fontSize: "0.78rem", color: colors.textMuted, letterSpacing: "0", marginBottom: "24px" }),
  buttonRow: css({ display: "flex", gap: "10px", justifyContent: "center" }),
  button: css({ padding: "9px 22px", borderRadius: "6px", fontSize: "0.875rem", fontWeight: "600", cursor: "pointer", border: `1px solid ${colors.borderLight}`, color: colors.textDim, backgroundColor: colors.bgSecondary, transition: "all 0.18s ease", fontFamily: sans, hover: { color: colors.text, borderColor: colors.primary } }),
  buttonPrimary: css({ backgroundImage: "linear-gradient(135deg, var(--c-accent-warm), var(--c-primary) 60%, var(--c-accent-secondary) 130%)", color: "#fff", borderColor: "transparent", hover: { backgroundColor: colors.primaryHover, filter: "brightness(1.04)" } }),
  buttonDisabled: css({ opacity: "0.7", cursor: "not-allowed" }),

  todo: css({ width: "100%", maxWidth: "340px" }),
  row: css({ display: "flex", gap: "8px", marginBottom: "14px" }),
  input: css({ flex: "1", padding: "9px 13px", borderRadius: "6px", border: `1px solid ${colors.borderLight}`, backgroundColor: colors.bgSecondary, color: colors.text, fontFamily: sans, fontSize: "0.875rem", outline: "none", transition: "border-color 0.18s ease", focus: { borderColor: colors.primary } }),
  list: css({ display: "flex", flexDirection: "column", gap: "6px" }),
  item: css({ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "6px", border: `1px solid ${colors.border}`, backgroundColor: colors.bgSecondary, fontSize: "0.875rem" }),
  itemText: css({ flex: "1" }),
  itemDoneText: css({ textDecoration: "line-through", color: colors.textMuted }),
  itemDelete: css({ color: colors.textMuted, backgroundColor: "transparent", border: "none", fontSize: "1rem", cursor: "pointer", padding: "0 4px", transition: "color 0.18s ease", fontFamily: "inherit", hover: { color: "#ff6b6b" } }),
  empty: css({ fontSize: "0.85rem", color: colors.textMuted, textAlign: "center", padding: "20px 0" }),
  filters: css({ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }),
  filter: css({ padding: "4px 12px", borderRadius: "999px", fontSize: "0.78rem", fontWeight: "500", cursor: "pointer", border: `1px solid ${colors.borderLight}`, color: colors.textMuted, backgroundColor: "transparent", transition: "all 0.18s ease", fontFamily: "inherit", hover: { color: colors.textDim } }),
  filterActive: css({ backgroundColor: colors.primaryAlpha08, color: colors.primary, borderColor: colors.borderPrimary }),
  countSummary: css({ fontSize: "0.8rem", color: colors.textMuted, marginTop: "10px", textAlign: "center" }),

  search: css({ width: "100%", maxWidth: "360px" }),
  searchInput: css({ width: "100%", marginBottom: "14px" }),
  userCard: css({ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "6px", border: `1px solid ${colors.border}`, backgroundColor: colors.bgSecondary, marginBottom: "6px" }),
  avatar: css({ width: "34px", height: "34px", borderRadius: "8px", backgroundImage: "linear-gradient(135deg, var(--c-accent-warm), var(--c-primary))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "800", color: "#fff", flexShrink: 0 }),
  userName: css({ fontSize: "0.875rem", fontWeight: "500" }),
  userEmail: css({ fontSize: "0.78rem", color: colors.textMuted }),
  noResults: css({ fontSize: "0.85rem", color: colors.textMuted, textAlign: "center", padding: "20px 0" }),

  asyncRoot: css({ width: "100%", maxWidth: "380px" }),
  statusBar: css({ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "6px", border: `1px solid ${colors.border}`, backgroundColor: colors.bgSecondary, fontSize: "0.82rem", color: colors.textDim, marginBottom: "12px" }),
  statusDot: css({ width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0 }),
  statusIdle: css({ backgroundColor: colors.textMuted }),
  statusLoading: css({ backgroundColor: "#febc2e", animation: `${animations.pulse} 1s infinite` }),
  statusSuccess: css({ backgroundColor: "#28c840" }),
  statusError: css({ backgroundColor: "#ff5f57" }),
  productCard: css({ padding: "10px 12px", borderRadius: "6px", border: `1px solid ${colors.border}`, backgroundColor: colors.bgSecondary, marginBottom: "6px" }),
  productTitle: css({ fontSize: "0.875rem", fontWeight: "600", marginBottom: "2px" }),
  productCat: css({ fontSize: "0.78rem", color: colors.textMuted }),
  errorMsg: css({ padding: "10px 12px", borderRadius: "6px", border: "1px solid rgba(255,95,87,0.3)", backgroundColor: "rgba(255,95,87,0.08)", fontSize: "0.85rem", color: "#ff8080" }),

  styleDemo: css({ width: "100%", maxWidth: "400px" }),
  styleHint: css({ fontSize: "0.82rem", color: colors.textMuted, marginBottom: "14px", lineHeight: "1.5", "& code": { fontFamily: mono, fontSize: "0.78rem", backgroundColor: colors.bgSecondary, padding: "1px 5px", borderRadius: "3px" } }),
  styleChips: css({ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }),
  styleResult: css({ fontSize: "0.82rem", color: colors.textMuted, minHeight: "1.2em" }),

  chartRoot: css({ width: "100%", maxWidth: "380px" }),
  chartControls: css({ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }),
  chartLabel: css({ fontSize: "0.82rem", fontWeight: "600", color: colors.textDim }),
  chartSelect: css({ flex: "1", padding: "8px 12px", borderRadius: "6px", border: `1px solid ${colors.borderLight}`, backgroundColor: colors.bgSecondary, color: colors.text, fontFamily: sans, fontSize: "0.85rem", outline: "none", cursor: "pointer", transition: "border-color 0.18s ease", raw: { appearance: "none" }, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23607970'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "30px", focus: { borderColor: colors.primary } }),
  chartArea: css({ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "20px 16px", minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center" }),
  chartSvg: css({ display: "block", maxWidth: "100%", overflow: "visible" }),
  chartAnimatedShape: css({ raw: { "vector-effect": "non-scaling-stroke", "shape-rendering": "geometricPrecision" } }),
};

export function cardDelay(index: number) {
  if (index === 1) return es.cardDelay1;
  if (index === 2) return es.cardDelay2;
  if (index === 3) return es.cardDelay3;
  if (index >= 4) return es.cardDelay4;
  return null;
}

export function statusDotStyle(status: "idle" | "loading" | "success" | "error") {
  if (status === "loading") return es.statusLoading;
  if (status === "success") return es.statusSuccess;
  if (status === "error") return es.statusError;
  return es.statusIdle;
}
