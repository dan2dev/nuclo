import { css, colors } from "../../styles.ts";
import { animations } from "../../styles/animations.ts";

const mono = "'JetBrains Mono', monospace";
const sans = "'Space Grotesk', system-ui, sans-serif";

export const es = {
  heroSection: css("pages-examples-styles-heroSection", { padding: "40px 0 8px", "@media (max-width: 600px)": { padding: "26px 0 8px" } }),
  hero: css("pages-examples-styles-hero", { animation: `${animations.riseIn} 0.58s cubic-bezier(0.22, 1, 0.36, 1) both`, position: "relative", borderRadius: "28px", backgroundColor: colors.bgCard, boxShadow: "var(--c-shadow)", padding: "44px 40px", "@media (max-width: 600px)": { padding: "30px 22px", borderRadius: "22px" } }),
  heroInner: css("pages-examples-styles-heroInner", { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: "42px", alignItems: "end", "@media (max-width: 900px)": { gridTemplateColumns: "1fr", alignItems: "start", gap: "28px" } }),
  kicker: css("pages-examples-styles-kicker", { fontFamily: mono, fontSize: "0.72rem", fontWeight: "800", letterSpacing: "0", textTransform: "uppercase", color: colors.primary, marginBottom: "12px" }),
  title: css("pages-examples-styles-title", { maxWidth: "660px", fontSize: "3rem", fontWeight: "800", letterSpacing: "0", lineHeight: "1.08", marginBottom: "16px", "@media (max-width: 600px)": { fontSize: "2.15rem" } }),
  lead: css("pages-examples-styles-lead", { maxWidth: "620px", fontSize: "1.05rem", color: colors.textDim, lineHeight: "1.75" }),
  facts: css("pages-examples-styles-facts", { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px", "@media (max-width: 900px)": { maxWidth: "520px" }, "@media (max-width: 600px)": { gridTemplateColumns: "1fr" } }),
  heroMarkWrap: css("pages-examples-styles-heroMarkWrap", { display: "flex", justifyContent: "flex-end", alignItems: "center", minHeight: "150px", "@media (max-width: 900px)": { justifyContent: "flex-start", minHeight: "auto" } }),
  heroMark: css("pages-examples-styles-heroMark", { width: "142px", height: "142px", transform: "rotate(6deg)", filter: "drop-shadow(0 24px 30px rgba(255,63,0,0.20))" }),
  grid: css("pages-examples-styles-grid", { animation: `${animations.riseIn} 0.58s cubic-bezier(0.22, 1, 0.36, 1) both`, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "18px", padding: "38px 0 64px", "@media (max-width: 900px)": { gridTemplateColumns: "1fr" }, "@media (max-width: 600px)": { padding: "28px 0 52px" } }),

  card: css("pages-examples-styles-card", { backgroundColor: colors.bgCard, borderRadius: "20px", overflow: "hidden", display: "flex", flexDirection: "column", minWidth: "0", animation: `${animations.riseIn} 0.56s cubic-bezier(0.22, 1, 0.36, 1) both`, transition: "transform 0.2s ease", hover: { transform: "translateY(-3px)", backgroundColor: "color-mix(in srgb, var(--c-bg-card) 86%, var(--c-bg-secondary))", boxShadow: "0 18px 42px -28px var(--c-primary-glow)" } }),
  cardDelay1: css("pages-examples-styles-cardDelay1", { raw: { "animation-delay": "0.04s" } }),
  cardDelay2: css("pages-examples-styles-cardDelay2", { raw: { "animation-delay": "0.08s" } }),
  cardDelay3: css("pages-examples-styles-cardDelay3", { raw: { "animation-delay": "0.12s" } }),
  cardDelay4: css("pages-examples-styles-cardDelay4", { raw: { "animation-delay": "0.16s" } }),
  cardTop: css("pages-examples-styles-cardTop", { padding: "20px 20px 0", "@media (max-width: 600px)": { padding: "18px 16px 0" } }),
  cardMetaRow: css("pages-examples-styles-cardMetaRow", { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }),
  cardBadge: css("pages-examples-styles-cardBadge", { display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.7rem", fontWeight: "800", letterSpacing: "0", textTransform: "uppercase", color: colors.primary }),
  cardNumber: css("pages-examples-styles-cardNumber", { fontFamily: mono, fontSize: "0.72rem", fontWeight: "800", color: colors.textMuted }),
  cardTitle: css("pages-examples-styles-cardTitle", { fontSize: "1.08rem", fontWeight: "800", marginBottom: "5px" }),
  cardDesc: css("pages-examples-styles-cardDesc", { fontSize: "0.86rem", color: colors.textDim, lineHeight: "1.58", minHeight: "2.75em" }),
  tabs: css("pages-examples-styles-tabs", { display: "flex", gap: "4px", borderBottom: `1px solid ${colors.border}`, padding: "14px 20px 0", marginTop: "16px", "@media (max-width: 600px)": { padding: "12px 16px 0" } }),
  tab: css("pages-examples-styles-tab", { fontSize: "0.8rem", fontWeight: "700", color: colors.textMuted, padding: "8px 12px", borderBottom: "2px solid transparent", borderRadius: "6px 6px 0 0", cursor: "pointer", backgroundColor: "transparent", borderTop: "none", borderLeft: "none", borderRight: "none", fontFamily: sans, hover: { color: colors.textDim, backgroundColor: colors.bgSecondary } }),
  tabActive: css("pages-examples-styles-tabActive", { color: colors.primary, borderBottomColor: colors.primary, backgroundColor: colors.primaryAlpha08, hover: { color: colors.primary } }),
  pane: css("pages-examples-styles-pane", { display: "none" }),
  paneActive: css("pages-examples-styles-paneActive", { display: "block" }),
  previewPane: css("pages-examples-styles-previewPane", { padding: "30px 24px", height: "320px", overflow: "auto", display: "flex", flexDirection: "column", alignItems: "center", backgroundColor: colors.bgCode, "&::before": { content: "''", flex: "1" }, "&::after": { content: "''", flex: "1" }, "@media (max-width: 600px)": { height: "260px", padding: "24px 16px" } }),
  codePaneActive: css("pages-examples-styles-codePaneActive", { display: "flex", flexDirection: "column", height: "320px", overflow: "hidden", "& > *": { flex: "1", minHeight: "0", display: "flex", flexDirection: "column", overflow: "hidden" }, "& > * > *:last-child": { flex: "1", minHeight: "0", overflow: "auto" }, "@media (max-width: 600px)": { height: "260px" } }),

  counter: css("pages-examples-styles-counter", { textAlign: "center", width: "100%" }),
  countValue: css("pages-examples-styles-countValue", { fontSize: "5rem", fontWeight: "700", lineHeight: "1", color: colors.text, marginBottom: "6px", fontVariantNumeric: "tabular-nums", transition: "transform 0.1s ease" }),
  countLabel: css("pages-examples-styles-countLabel", { fontSize: "0.78rem", color: colors.textMuted, letterSpacing: "0", marginBottom: "24px" }),
  buttonRow: css("pages-examples-styles-buttonRow", { display: "flex", gap: "10px", justifyContent: "center" }),
  button: css("pages-examples-styles-button", { padding: "9px 22px", borderRadius: "9999px", fontSize: "0.875rem", fontWeight: "600", cursor: "pointer", color: colors.textDim, backgroundColor: colors.bgSecondary, fontFamily: sans, hover: { color: colors.text, backgroundColor: colors.bgLight } }),
  buttonPrimary: css("pages-examples-styles-buttonPrimary", { backgroundColor: colors.primary, color: "#fff", borderColor: "transparent", hover: { backgroundColor: colors.primaryHover } }),

  todo: css("pages-examples-styles-todo", { width: "100%", maxWidth: "340px" }),
  row: css("pages-examples-styles-row", { display: "flex", gap: "8px", marginBottom: "14px" }),
  input: css("pages-examples-styles-input", { flex: "1", padding: "9px 13px", borderRadius: "6px", border: `1px solid ${colors.borderLight}`, backgroundColor: colors.bgSecondary, color: colors.text, fontFamily: sans, fontSize: "0.875rem", outline: "none", focus: { borderColor: colors.primary } }),
  list: css("pages-examples-styles-list", { display: "flex", flexDirection: "column", gap: "6px" }),
  item: css("pages-examples-styles-item", { display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "6px", backgroundColor: colors.bgSecondary, fontSize: "0.875rem" }),
  itemText: css("pages-examples-styles-itemText", { flex: "1" }),
  itemDoneText: css("pages-examples-styles-itemDoneText", { textDecoration: "line-through", color: colors.textMuted }),
  itemDelete: css("pages-examples-styles-itemDelete", { color: colors.textMuted, backgroundColor: "transparent", border: "none", fontSize: "1rem", cursor: "pointer", padding: "0 4px", fontFamily: "inherit", hover: { color: "#ff6b6b" } }),
  empty: css("pages-examples-styles-empty", { fontSize: "0.85rem", color: colors.textMuted, textAlign: "center", padding: "20px 0" }),
  filters: css("pages-examples-styles-filters", { display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }),
  filter: css("pages-examples-styles-filter", { padding: "4px 12px", borderRadius: "999px", fontSize: "0.78rem", fontWeight: "500", cursor: "pointer", border: `1px solid ${colors.borderLight}`, color: colors.textMuted, backgroundColor: "transparent", fontFamily: "inherit", hover: { color: colors.textDim } }),
  filterActive: css("pages-examples-styles-filterActive", { backgroundColor: colors.primaryAlpha08, color: colors.primary }),
  countSummary: css("pages-examples-styles-countSummary", { fontSize: "0.8rem", color: colors.textMuted, marginTop: "10px", textAlign: "center" }),

  search: css("pages-examples-styles-search", { width: "100%", maxWidth: "360px" }),
  searchInput: css("pages-examples-styles-searchInput", { width: "100%", marginBottom: "14px" }),
  userCard: css("pages-examples-styles-userCard", { display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "6px", backgroundColor: colors.bgSecondary, marginBottom: "6px" }),
  avatar: css("pages-examples-styles-avatar", { width: "34px", height: "34px", borderRadius: "8px", backgroundColor: colors.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "800", color: "#fff", flexShrink: 0 }),
  userName: css("pages-examples-styles-userName", { fontSize: "0.875rem", fontWeight: "500" }),
  userEmail: css("pages-examples-styles-userEmail", { fontSize: "0.78rem", color: colors.textMuted }),
  noResults: css("pages-examples-styles-noResults", { fontSize: "0.85rem", color: colors.textMuted, textAlign: "center", padding: "20px 0" }),

  styleDemo: css("pages-examples-styles-styleDemo", { width: "100%", maxWidth: "400px" }),
  styleHint: css("pages-examples-styles-styleHint", { fontSize: "0.82rem", color: colors.textMuted, marginBottom: "14px", lineHeight: "1.5", "& code": { fontFamily: mono, fontSize: "0.78rem", backgroundColor: colors.bgSecondary, padding: "1px 5px", borderRadius: "3px" } }),
};

export function cardDelay(index: number) {
  if (index === 1) return es.cardDelay1;
  if (index === 2) return es.cardDelay2;
  if (index === 3) return es.cardDelay3;
  if (index >= 4) return es.cardDelay4;
  return null;
}
