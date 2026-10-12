import { css, colors } from "../../styles.ts";
import { animations } from "../../styles/animations.ts";

const mono = "ui-monospace, monospace";

export const es = {
  // Page header: label / title / sub come from the shared section styles (s.sectionLabel …).
  header: css("pages-examples-styles-header", { animation: `${animations.riseIn} 0.58s cubic-bezier(0.22, 1, 0.36, 1) both`, padding: "40px 0 0", medium: { padding: "56px 0 0" } }),

  // ── The grid: one section per group, cards link to /examples/:id ──
  group: css("pages-examples-styles-group", { animation: `${animations.riseIn} 0.58s cubic-bezier(0.22, 1, 0.36, 1) both`, padding: "40px 0 0", "&:last-of-type": { paddingBottom: "72px" } }),
  groupHead: css("pages-examples-styles-groupHead", { display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "18px" }),
  groupTitle: css("pages-examples-styles-groupTitle", { fontSize: "1.25rem", fontWeight: "600", letterSpacing: "-0.01em" }),
  groupCount: css("pages-examples-styles-groupCount", { fontFamily: mono, fontSize: "0.8125rem", color: colors.textMuted }),
  groupSub: css("pages-examples-styles-groupSub", { fontSize: "0.9375rem", color: colors.textDim, marginBottom: "18px", marginTop: "-10px" }),
  grid: css("pages-examples-styles-grid", { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 270px), 1fr))", gap: "14px" }),
  card: css("pages-examples-styles-card", { display: "flex", flexDirection: "column", gap: "10px", minHeight: "164px", padding: "20px 20px 16px", backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "14px", color: colors.text, textDecoration: "none", animation: `${animations.riseIn} 0.5s cubic-bezier(0.22, 1, 0.36, 1) both`, transition: "border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease", hover: { borderColor: colors.borderPrimary, transform: "translateY(-2px)", boxShadow: "0 18px 40px -28px var(--c-primary-glow)" }, "&:hover [data-arrow]": { transform: "translateX(3px)", color: colors.primaryInk }, focusVisible: { outline: `2px solid ${colors.primary}`, outlineOffset: "2px" } }),
  cardNum: css("pages-examples-styles-cardNum", { fontFamily: mono, fontSize: "0.75rem", color: colors.primaryInk }),
  cardTitle: css("pages-examples-styles-cardTitle", { fontSize: "1.0625rem", fontWeight: "600", lineHeight: "1.3" }),
  cardDesc: css("pages-examples-styles-cardDesc", { flex: "1", fontSize: "0.875rem", color: colors.textDim, lineHeight: "1.6", display: "-webkit-box", overflow: "hidden", raw: { "-webkit-line-clamp": "3", "-webkit-box-orient": "vertical" }, "& code": { fontFamily: mono, fontSize: "0.875em", backgroundColor: colors.bgSecondary, padding: "1px 5px", borderRadius: "4px", color: colors.text } }),
  cardPkg: css("pages-examples-styles-cardPkg", { marginLeft: "8px", padding: "2px 7px", borderRadius: "999px", border: `1px solid ${colors.borderPrimary}`, fontFamily: mono, fontSize: "0.6875rem", color: colors.primaryInk, whiteSpace: "nowrap" }),
  cardFoot: css("pages-examples-styles-cardFoot", { display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8125rem", color: colors.textMuted, marginTop: "4px" }),
  cardArrow: css("pages-examples-styles-cardArrow", { display: "inline-flex", color: colors.textMuted, transition: "transform 0.18s ease, color 0.18s ease" }),

  // ── The modal an open example sends to the app's "modal" region: a backdrop, a panel and a bar with the nav ──
  overlay: css("pages-examples-styles-overlay", { display: "flex", alignItems: "stretch", justifyContent: "center", position: "fixed", inset: "0", zIndex: 230, padding: "0", backgroundColor: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(6px)", animation: `${animations.pageFadeIn} 0.22s ease both`, medium: { padding: "24px" }, large: { padding: "32px 40px" } }),
  panel: css("pages-examples-styles-panel", { display: "flex", flexDirection: "column", width: "100%", maxWidth: "1240px", minHeight: "0", backgroundColor: colors.bg, border: `1px solid ${colors.border}`, boxShadow: "0 40px 90px -40px rgba(0,0,0,0.5)", overflow: "hidden", medium: { borderRadius: "18px" } }),
  bar: css("pages-examples-styles-bar", { display: "flex", alignItems: "center", gap: "12px", flexShrink: 0, height: "56px", padding: "0 8px 0 16px", borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.bgCard, medium: { padding: "0 12px 0 22px" } }),
  close: css("pages-examples-styles-close", { display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, width: "40px", height: "40px", marginLeft: "auto", borderRadius: "10px", color: colors.textDim, hover: { color: colors.text, backgroundColor: colors.bgSecondary } }),
  body: css("pages-examples-styles-body", { flex: "1", minHeight: "0", overflow: "auto", raw: { "overscroll-behavior": "contain", "scrollbar-gutter": "stable" } }),

  // ── The bar: a fixed-width pager (prev, position, next) so nothing moves between examples, then the crumb ──
  nav: css("pages-examples-styles-nav", { display: "flex", alignItems: "center", gap: "14px", minWidth: "0", flex: "1" }),
  pager: css("pages-examples-styles-pager", { display: "inline-flex", alignItems: "center", flexShrink: 0, height: "34px", border: `1px solid ${colors.border}`, borderRadius: "10px", overflow: "hidden", "& > * + *": { raw: { "border-left": "1px solid var(--c-border)" } } }),
  pagerBtn: css("pages-examples-styles-pagerBtn", { display: "flex", alignItems: "center", justifyContent: "center", width: "38px", height: "100%", color: colors.textDim, hover: { color: colors.text, backgroundColor: colors.bgSecondary } }),
  pagerBtnOff: css("pages-examples-styles-pagerBtnOff", { opacity: "0.35", pointerEvents: "none" }),
  navPos: css("pages-examples-styles-navPos", { display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minWidth: "72px", padding: "0 10px", fontFamily: mono, fontSize: "0.75rem", color: colors.textMuted, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }),
  navCrumb: css("pages-examples-styles-navCrumb", { display: "flex", alignItems: "center", gap: "8px", minWidth: "0", fontSize: "0.8125rem", color: colors.textMuted, whiteSpace: "nowrap", "& strong": { fontWeight: "600", color: colors.text, overflow: "hidden", textOverflow: "ellipsis" } }),
  navCrumbPath: css("pages-examples-styles-navCrumbPath", { display: "none", alignItems: "center", gap: "8px", medium: { display: "flex" } }),

  // ── The example itself, inside the panel body ──
  detail: css("pages-examples-styles-detail", { display: "flex", flexDirection: "column", minHeight: "100%" }),
  detailHead: css("pages-examples-styles-detailHead", { padding: "28px 20px 20px", medium: { padding: "36px 32px 24px" } }),
  detailKicker: css("pages-examples-styles-detailKicker", { fontSize: "0.8125rem", fontWeight: "600", color: colors.primaryInk, marginBottom: "8px" }),
  detailTitle: css("pages-examples-styles-detailTitle", { fontSize: "1.75rem", fontWeight: "700", letterSpacing: "-0.02em", lineHeight: "1.15", marginBottom: "10px", outline: "none", medium: { fontSize: "2.125rem" } }),
  detailDesc: css("pages-examples-styles-detailDesc", { fontSize: "1rem", color: colors.textDim, lineHeight: "1.65", maxWidth: "680px", "& code": { fontFamily: mono, fontSize: "0.875em", backgroundColor: colors.bgSecondary, padding: "1px 5px", borderRadius: "4px", color: colors.text } }),
  // "Separate package" callout for examples that need more than nuclo.
  installNote: css("pages-examples-styles-installNote", { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 10px", marginTop: "16px", padding: "10px 14px", borderRadius: "10px", border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.primaryAlpha08, fontSize: "0.875rem", color: colors.textDim, lineHeight: "1.5", "& strong": { color: colors.text }, "& code": { fontFamily: mono, fontSize: "0.8125em", padding: "2px 6px", borderRadius: "5px", backgroundColor: colors.bgCode, border: `1px solid ${colors.border}`, color: colors.text, whiteSpace: "nowrap" } }),
  detailDocs: css("pages-examples-styles-detailDocs", { display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "14px", fontSize: "0.875rem", fontWeight: "500", color: colors.primaryInk, hover: { textDecoration: "underline" } }),
  // Side by side only from 1200px: narrower than that the code pane would wrap its lines.
  panes: css("pages-examples-styles-panes", { display: "grid", flex: "1", gridTemplateColumns: "minmax(0, 1fr)", borderTop: `1px solid ${colors.border}`, "@media (min-width: 1200px)": { gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.35fr)" } }),
  paneLabel: css("pages-examples-styles-paneLabel", { display: "flex", alignItems: "center", height: "40px", padding: "0 20px", borderBottom: `1px solid ${colors.border}`, fontFamily: mono, fontSize: "0.75rem", color: colors.textMuted, medium: { padding: "0 32px" } }),
  previewPane: css("pages-examples-styles-previewPane", { display: "flex", flexDirection: "column", minWidth: "0", backgroundColor: colors.bgCard, borderBottom: `1px solid ${colors.border}`, "@media (min-width: 1200px)": { position: "sticky", top: "0", alignSelf: "start", borderBottom: "none", borderRight: `1px solid ${colors.border}` } }),
  previewBody: css("pages-examples-styles-previewBody", { display: "flex", flexDirection: "column", alignItems: "center", flex: "1", minHeight: "300px", padding: "28px 20px", "&::before": { content: "''", flex: "1" }, "&::after": { content: "''", flex: "1" }, medium: { padding: "32px", minHeight: "340px" } }),
  // The code block fills its pane flush, so its own frame (border, radius) is dropped.
  // Sources are formatted to fit; long lines wrap rather than scroll sideways.
  codePane: css("pages-examples-styles-codePane", { display: "flex", flexDirection: "column", minWidth: "0", "& > div": { flex: "1", display: "flex", flexDirection: "column", border: "none", borderRadius: "0" }, "& > div > *:last-child": { flex: "1" }, "& pre": { whiteSpace: "pre-wrap", overflowWrap: "anywhere", minWidth: "0" } }),

  // ── The "app" layout (Example.layout): a compact head, then tabs: the preview fills the rest, each file is a tab ──
  appFill: css("pages-examples-styles-appFill", { height: "100%" }),
  app: css("pages-examples-styles-app", { display: "flex", flexDirection: "column", height: "100%" }),
  appHead: css("pages-examples-styles-appHead", { display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "2px 16px", padding: "16px 20px 10px", medium: { padding: "18px 32px 10px" } }),
  appTitle: css("pages-examples-styles-appTitle", { fontSize: "1.25rem", fontWeight: "700", letterSpacing: "-0.01em", lineHeight: "1.3", outline: "none" }),
  appDesc: css("pages-examples-styles-appDesc", { flex: "1 1 360px", fontSize: "0.875rem", color: colors.textDim, lineHeight: "1.55", "& code": { fontFamily: mono, fontSize: "0.875em", backgroundColor: colors.bgSecondary, padding: "1px 5px", borderRadius: "4px", color: colors.text } }),
  appDocs: css("pages-examples-styles-appDocs", { fontSize: "0.8125rem", fontWeight: "500", color: colors.primaryInk, whiteSpace: "nowrap", hover: { textDecoration: "underline" } }),
  appTabs: css("pages-examples-styles-appTabs", { display: "flex", flexShrink: 0, height: "40px", padding: "0 12px", borderBottom: `1px solid ${colors.border}`, overflowX: "auto", raw: { "scrollbar-width": "none" }, medium: { padding: "0 24px" } }),
  appTab: css("pages-examples-styles-appTab", { display: "flex", alignItems: "center", flexShrink: 0, padding: "0 12px", marginBottom: "-1px", borderBottom: "2px solid transparent", fontFamily: mono, fontSize: "0.75rem", color: colors.textMuted, whiteSpace: "nowrap", hover: { color: colors.text } }),
  appTabActive: css("pages-examples-styles-appTabActive", { color: colors.text, borderBottomColor: colors.primary }),
  // The panes are all built once and only shown or hidden, so the running app keeps its state while the reader reads its source.
  appPane: css("pages-examples-styles-appPane", { display: "none", flexDirection: "column", flex: "1", minHeight: "0" }),
  appPaneShow: css("pages-examples-styles-appPaneShow", { display: "flex" }),
  appPreview: css("pages-examples-styles-appPreview", { padding: "16px 20px 20px", backgroundColor: colors.bgCard, overflow: "auto", medium: { padding: "20px 32px 24px" } }),
  appCode: css("pages-examples-styles-appCode", { overflow: "auto", "& > div": { flex: "1 0 auto", border: "none", borderRadius: "0" }, "& pre": { whiteSpace: "pre-wrap", overflowWrap: "anywhere", minWidth: "0" } }),

  // ── An embedded standalone app (demo-frame.ts): a browser-like chrome over an iframe ──
  demo: css("pages-examples-styles-demo", { display: "flex", flexDirection: "column", width: "100%", maxWidth: "560px", border: `1px solid ${colors.border}`, borderRadius: "12px", overflow: "hidden", backgroundColor: colors.bg }),
  demoBar: css("pages-examples-styles-demoBar", { display: "flex", alignItems: "center", gap: "4px", height: "38px", padding: "0 8px", borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.bgSecondary }),
  demoBtn: css("pages-examples-styles-demoBtn", { display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "7px", color: colors.textDim, hover: { color: colors.text, backgroundColor: colors.bgLight } }),
  demoUrl: css("pages-examples-styles-demoUrl", { flex: "1", minWidth: "0", height: "26px", lineHeight: "26px", margin: "0 6px", padding: "0 10px", borderRadius: "7px", backgroundColor: colors.bg, border: `1px solid ${colors.border}`, fontFamily: mono, fontSize: "0.75rem", color: colors.textDim, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }),
  demoOpen: css("pages-examples-styles-demoOpen", { flexShrink: 0, padding: "0 6px", fontSize: "0.75rem", fontWeight: "600", color: colors.primaryInk, whiteSpace: "nowrap", hover: { textDecoration: "underline" } }),
  demoFrame: css("pages-examples-styles-demoFrame", { display: "block", width: "100%", height: "380px", border: "0", backgroundColor: colors.bgCard }),

  notFound: css("pages-examples-styles-notFound", { padding: "72px 24px", textAlign: "center", color: colors.textDim, "& a": { color: colors.primaryInk, fontWeight: "500" } }),

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
