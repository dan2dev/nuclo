import { css, colors } from "../../styles.ts";
import { animations } from "../../styles/animations.ts";

const mono = "ui-monospace, monospace";

export const es = {
  // Page header: label / title / sub come from the shared section styles (s.sectionLabel …).
  header: css("pages-examples-styles-header", { animation: `${animations.riseIn} 0.58s cubic-bezier(0.22, 1, 0.36, 1) both`, padding: "40px 0 0", medium: { padding: "56px 0 0" } }),
  // One example per row; each example is a full-width panel (see card).
  grid: css("pages-examples-styles-grid", { animation: `${animations.riseIn} 0.58s cubic-bezier(0.22, 1, 0.36, 1) both`, display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "20px", padding: "40px 0 64px", "@media (max-width: 600px)": { padding: "32px 0 52px" } }),

  // One bordered panel per example. Below 1025px: intro, tab bar, active pane.
  // From 1025px: intro + live preview on the left, the source beside them on the right.
  card: css("pages-examples-styles-card", { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", minWidth: "0", overflow: "hidden", backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "16px", animation: `${animations.riseIn} 0.56s cubic-bezier(0.22, 1, 0.36, 1) both`, large: { gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.15fr)", gridTemplateRows: "auto 1fr", raw: { "grid-template-areas": '"top code" "preview code"' } } }),
  cardDelay1: css("pages-examples-styles-cardDelay1", { raw: { "animation-delay": "0.04s" } }),
  cardDelay2: css("pages-examples-styles-cardDelay2", { raw: { "animation-delay": "0.08s" } }),
  cardDelay3: css("pages-examples-styles-cardDelay3", { raw: { "animation-delay": "0.12s" } }),
  cardDelay4: css("pages-examples-styles-cardDelay4", { raw: { "animation-delay": "0.16s" } }),
  cardTop: css("pages-examples-styles-cardTop", { padding: "24px 24px 16px", "@media (max-width: 600px)": { padding: "20px 16px 14px" }, large: { padding: "28px 28px 0", raw: { "grid-area": "top" } } }),
  cardTitle: css("pages-examples-styles-cardTitle", { fontSize: "1.125rem", fontWeight: "600", lineHeight: "1.3", marginBottom: "6px" }),
  cardDesc: css("pages-examples-styles-cardDesc", { fontSize: "0.9375rem", color: colors.textDim, lineHeight: "1.65", "& code": { fontFamily: mono, fontSize: "0.875em", backgroundColor: colors.bgSecondary, padding: "1px 5px", borderRadius: "4px", color: colors.text } }),
  // The active tab's 2px underline sits on the bar's bottom divider (negative margin).
  tabs: css("pages-examples-styles-tabs", { display: "flex", gap: "20px", borderBottom: `1px solid ${colors.border}`, padding: "0 24px", "@media (max-width: 600px)": { padding: "0 16px" }, large: { display: "none" } }),
  tab: css("pages-examples-styles-tab", { height: "44px", marginBottom: "-1px", borderBottom: "2px solid transparent", fontSize: "0.875rem", fontWeight: "500", color: colors.textDim, hover: { color: colors.text } }),
  tabActive: css("pages-examples-styles-tabActive", { color: colors.text, borderBottomColor: colors.primary }),
  previewPane: css("pages-examples-styles-previewPane", { padding: "28px 24px", height: "320px", overflow: "auto", display: "flex", flexDirection: "column", alignItems: "center", "&::before": { content: "''", flex: "1" }, "&::after": { content: "''", flex: "1" }, "@media (max-width: 600px)": { height: "260px", padding: "24px 16px" }, large: { height: "340px", padding: "24px 28px 28px", raw: { "grid-area": "preview" } } }),
  // The code block fills its pane flush, so its own frame (border, radius) is dropped. Side by side it is
  // absolutely positioned so long sources scroll instead of stretching the row.
  codePane: css("pages-examples-styles-codePane", { position: "relative", display: "flex", flexDirection: "column", height: "320px", overflow: "hidden", "& > div": { flex: "1", minHeight: "0", display: "flex", flexDirection: "column", overflow: "hidden", border: "none", borderRadius: "0" }, "& > * > *:last-child": { flex: "1", minHeight: "0", overflow: "auto" }, "@media (max-width: 600px)": { height: "260px" }, large: { height: "auto", borderLeft: `1px solid ${colors.border}`, raw: { "grid-area": "code" }, "& > div": { position: "absolute", inset: "0" } } }),
  // Only the tab layout hides the inactive pane; side by side, both show. Defined after the panes so it wins.
  paneHidden: css("pages-examples-styles-paneHidden", { "@media (max-width: 1024px)": { display: "none" } }),

  counter: css("pages-examples-styles-counter", { textAlign: "center", width: "100%" }),
  countValue: css("pages-examples-styles-countValue", { fontSize: "5rem", fontWeight: "700", lineHeight: "1", color: colors.text, marginBottom: "8px", fontVariantNumeric: "tabular-nums" }),
  countLabel: css("pages-examples-styles-countLabel", { fontSize: "0.8125rem", color: colors.textMuted, marginBottom: "24px" }),
  buttonRow: css("pages-examples-styles-buttonRow", { display: "flex", gap: "8px", justifyContent: "center" }),
  button: css("pages-examples-styles-button", { display: "inline-flex", alignItems: "center", justifyContent: "center", height: "44px", minWidth: "44px", padding: "0 18px", borderRadius: "8px", border: `1px solid ${colors.borderLight}`, fontSize: "0.9375rem", fontWeight: "600", color: colors.text, whiteSpace: "nowrap", hover: { backgroundColor: colors.bgSecondary } }),
  buttonPrimary: css("pages-examples-styles-buttonPrimary", { backgroundColor: colors.primaryDark, borderColor: "transparent", color: "#fff", hover: { backgroundColor: colors.primaryDark, filter: "brightness(0.92)" } }),

  todo: css("pages-examples-styles-todo", { width: "100%", maxWidth: "340px" }),
  row: css("pages-examples-styles-row", { display: "flex", gap: "8px", marginBottom: "12px" }),
  input: css("pages-examples-styles-input", { flex: "1", minWidth: "0", height: "44px", padding: "0 12px", borderRadius: "8px", border: `1px solid ${colors.borderLight}`, backgroundColor: colors.bg, color: colors.text, fontFamily: "inherit", fontSize: "0.9375rem", outline: "none", focus: { borderColor: colors.primary }, "@media (max-width: 600px)": { fontSize: "16px" } }),
  // Rows split by 1px dividers inside one bordered block (todos, search results).
  list: css("pages-examples-styles-list", { border: `1px solid ${colors.border}`, borderRadius: "10px", overflow: "hidden", "& > * + *": { raw: { "border-top": "1px solid var(--c-border)" } } }),
  item: css("pages-examples-styles-item", { display: "flex", alignItems: "center", gap: "10px", minHeight: "44px", padding: "0 4px 0 12px", fontSize: "0.9375rem" }),
  itemText: css("pages-examples-styles-itemText", { flex: "1", minWidth: "0", overflowWrap: "anywhere" }),
  itemDoneText: css("pages-examples-styles-itemDoneText", { textDecoration: "line-through", color: colors.textMuted }),
  itemDelete: css("pages-examples-styles-itemDelete", { display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, width: "36px", height: "36px", borderRadius: "8px", color: colors.textMuted, hover: { color: colors.text, backgroundColor: colors.bgSecondary }, "@media (max-width: 600px)": { width: "44px", height: "44px" } }),
  empty: css("pages-examples-styles-empty", { fontSize: "0.875rem", color: colors.textMuted, textAlign: "center", padding: "20px 0" }),
  // Segmented control: one bordered group split by 1px dividers.
  filters: css("pages-examples-styles-filters", { display: "inline-flex", marginBottom: "12px", border: `1px solid ${colors.border}`, borderRadius: "8px", overflow: "hidden", "& > * + *": { raw: { "border-left": "1px solid var(--c-border)" } } }),
  filter: css("pages-examples-styles-filter", { height: "32px", padding: "0 14px", fontSize: "0.8125rem", fontWeight: "500", color: colors.textDim, hover: { color: colors.text }, "@media (max-width: 600px)": { height: "44px", padding: "0 16px" } }),
  filterActive: css("pages-examples-styles-filterActive", { color: colors.text, backgroundColor: colors.bgSecondary }),
  countSummary: css("pages-examples-styles-countSummary", { fontSize: "0.8125rem", color: colors.textMuted, marginTop: "10px", textAlign: "center" }),

  search: css("pages-examples-styles-search", { width: "100%", maxWidth: "360px" }),
  searchInput: css("pages-examples-styles-searchInput", { width: "100%", marginBottom: "12px" }),
  userCard: css("pages-examples-styles-userCard", { display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px" }),
  avatar: css("pages-examples-styles-avatar", { width: "32px", height: "32px", borderRadius: "8px", border: `1px solid ${colors.border}`, backgroundColor: colors.bgSecondary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "600", color: colors.textDim, flexShrink: 0 }),
  userName: css("pages-examples-styles-userName", { fontSize: "0.9375rem", fontWeight: "500" }),
  userEmail: css("pages-examples-styles-userEmail", { fontSize: "0.8125rem", color: colors.textMuted }),

  styleDemo: css("pages-examples-styles-styleDemo", { width: "100%", maxWidth: "400px" }),
  styleHint: css("pages-examples-styles-styleHint", { fontSize: "0.875rem", color: colors.textDim, marginBottom: "14px", lineHeight: "1.6", "& code": { fontFamily: mono, fontSize: "0.875em", backgroundColor: colors.bgSecondary, padding: "1px 5px", borderRadius: "4px", color: colors.text } }),
};

export function cardDelay(index: number) {
  if (index === 1) return es.cardDelay1;
  if (index === 2) return es.cardDelay2;
  if (index === 3) return es.cardDelay3;
  if (index >= 4) return es.cardDelay4;
  return null;
}
