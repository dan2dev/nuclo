import { css, colors } from "../../styles.ts";

// Deep enough that white hero text passes AA.
export const HERO_BG = "#d43c0c";

export const hs = {
  paneHidden: css("pages-home-styles-paneHidden", { display: "none" }),
  preWrap: css("pages-home-styles-preWrap", { margin: "0", whiteSpace: "pre-wrap" }),
  demoTabBtnActive: css("pages-home-styles-demoTabBtnActive", { color: colors.primary, borderBottom: `2px solid ${colors.primary}` }),
  // One panel, three steps split by 1px dividers; a chevron on each divider shows the direction.
  pipe: css("pages-home-styles-pipe", { display: "grid", gridTemplateColumns: "1fr", marginTop: "46px", padding: "0", listStyle: "none", backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "16px", "& > li + li": { raw: { "border-top": "1px solid var(--c-border)" } }, "@media (min-width: 901px)": { gridTemplateColumns: "repeat(3, minmax(0, 1fr))", "& > li + li": { raw: { "border-top": "none", "border-left": "1px solid var(--c-border)" } } } }),
  // Step cells; the features panel reuses pipeNode/pipeStep/pipeNum/pipeTitle.
  pipeNode: css("pages-home-styles-pipeNode", { position: "relative", display: "flex", flexDirection: "column", minWidth: "0", padding: "28px 24px", medium: { padding: "32px 28px" } }),
  pipeArrow: css("pages-home-styles-pipeArrow", { position: "absolute", top: "-13px", left: "24px", display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "50%", backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, color: colors.textMuted, "& svg": { raw: { transform: "rotate(90deg)" } }, medium: { left: "28px" }, "@media (min-width: 901px)": { top: "34px", left: "-13px", "& svg": { raw: { transform: "none" } } } }),
  pipeStep: css("pages-home-styles-pipeStep", { display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "14px", fontSize: "0.8125rem", fontWeight: "500", color: colors.textMuted }),
  pipeNum: css("pages-home-styles-pipeNum", { fontFamily: "ui-monospace, monospace", color: colors.primaryInk }),
  pipeTitle: css("pages-home-styles-pipeTitle", { fontSize: "1.125rem", fontWeight: "600", marginBottom: "8px" }),
  pipeDesc: css("pages-home-styles-pipeDesc", { fontSize: "0.9375rem", color: colors.textDim, lineHeight: "1.65", marginBottom: "20px" }),
  pipeCode: css("pages-home-styles-pipeCode", { marginTop: "auto", fontFamily: "ui-monospace, monospace", fontSize: "0.8rem", lineHeight: "1.6", backgroundColor: colors.bgCode, border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "12px 14px", overflowX: "auto", whiteSpace: "pre" }),
  cmpGrid: css("pages-home-styles-cmpGrid", { display: "grid", gridTemplateColumns: "1fr", gap: "16px", marginTop: "46px", "@media (min-width: 901px)": { gridTemplateColumns: "1fr 1fr 1fr", gap: "18px" } }),
  cmpCol: css("pages-home-styles-cmpCol", { backgroundColor: colors.bgCard, borderRadius: "16px", padding: "28px 26px", transition: "transform 0.22s ease", hover: { transform: "translateY(-3px)" } }),
  cmpColFeatured: css("pages-home-styles-cmpColFeatured", { backgroundColor: colors.bgSecondary, boxShadow: "0 26px 64px -32px var(--c-primary-glow)", hover: { boxShadow: "0 30px 72px -30px var(--c-primary-glow)" } }),
  cmpHead: css("pages-home-styles-cmpHead", { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "6px" }),
  cmpName: css("pages-home-styles-cmpName", { fontSize: "1.02rem", fontWeight: "700" }),
  cmpSub: css("pages-home-styles-cmpSub", { fontSize: "0.8rem", color: colors.textMuted, marginBottom: "20px", fontFamily: "ui-monospace, monospace" }),
  cmpLi: css("pages-home-styles-cmpLi", { display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "0.875rem", color: colors.textDim, lineHeight: "1.6", padding: "7px 0", "& svg": { flexShrink: 0, marginTop: "4px" } }),
  cmpLiGood: css("pages-home-styles-cmpLiGood", { color: colors.text, "& svg": { color: colors.primary } }),
  cmpLiDim: css("pages-home-styles-cmpLiDim", { "& svg": { color: colors.textMuted } }),
  // Cancels <main>'s 20px top gap so the card sits as far below the header as from the side edges (heroShell: 8 / 14 / 20px).
  heroSection: css("pages-home-styles-heroSection", { marginTop: "-20px", padding: "8px 0 0", medium: { padding: "14px 0 24px" }, large: { padding: "20px 0 32px" } }),

  heroShell: css("pages-home-styles-heroShell", { width: "calc(100% - 16px)", maxWidth: "1560px", margin: "0 auto", medium: { width: "calc(100% - 28px)" }, large: { width: "calc(100% - 40px)" } }),

  heroFrame: css("pages-home-styles-heroFrame", { position: "relative", isolation: "isolate", overflow: "hidden", borderRadius: "24px", backgroundColor: HERO_BG, minHeight: "540px", padding: "28px 22px", medium: { padding: "52px 42px" }, large: { padding: "50px 64px" } }),

  heroInner: css("pages-home-styles-heroInner", { position: "relative", zIndex: 2, display: "grid", width: "100%", maxWidth: "1180px", margin: "0 auto", gridTemplateColumns: "1fr", gap: "48px", alignItems: "center", large: { gridTemplateColumns: "minmax(0, 0.96fr) minmax(420px, 1.04fr)", gap: "76px" } }),

  heroBadge: css("pages-home-styles-heroBadge", { fontSize: "0.875rem", fontWeight: "600", color: "rgba(255,255,255,0.88)" }),

  heroTitle: css("pages-home-styles-heroTitle", { fontSize: "2.65rem", fontWeight: "700", letterSpacing: "-0.03em", lineHeight: "1.02", marginBottom: "18px", color: colors.primaryText, medium: { fontSize: "3.55rem", marginBottom: "24px" }, large: { fontSize: "4.15rem" } }),

  heroDesc: css("pages-home-styles-heroDesc", { fontSize: "1rem", color: colors.primaryText, lineHeight: "1.68", marginBottom: "20px", maxWidth: "520px", medium: { marginBottom: "28px" } }),

  heroInstall: css("pages-home-styles-heroInstall", { marginBottom: "20px", medium: { marginBottom: "28px" } }),

  heroCopyBtn: css("pages-home-styles-heroCopyBtn", { display: "inline-flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", borderRadius: "6px", color: colors.textMuted, flexShrink: 0, hover: { color: colors.text, backgroundColor: colors.bgLight } }),

  heroActions: css("pages-home-styles-heroActions", { display: "flex", gap: "12px", flexWrap: "wrap" }),

  // Hero buttons/install bar sit on the orange, so their colours don't follow the theme.
  heroBtn: css("pages-home-styles-heroBtn", { display: "inline-flex", alignItems: "center", justifyContent: "center", height: "44px", padding: "0 20px", borderRadius: "8px", fontSize: "0.9375rem", fontWeight: "600", whiteSpace: "nowrap" }),

  heroPrimaryBtn: css("pages-home-styles-heroPrimaryBtn", { backgroundColor: "#fff", color: "#b52500", hover: { backgroundColor: "rgba(255,255,255,0.9)" } }),

  heroSecondaryBtn: css("pages-home-styles-heroSecondaryBtn", { backgroundColor: "#141414", color: "#fff", hover: { backgroundColor: "#000" } }),

  heroInstallCmd: css("pages-home-styles-heroInstallCmd", { boxShadow: "none", backgroundColor: "#141414", color: "#fff8f2", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", "& > span:first-child": { color: "rgba(255,255,255,0.5)" }, "& > button": { color: "rgba(255,255,255,0.6)" }, "& > button:hover": { color: "#fff", backgroundColor: "rgba(255,255,255,0.08)" } }),

  // Stats - fixed 3-column grid so items never drop to a new row; labels wrap within their own column instead.
  statsRow: css("pages-home-styles-statsRow", { display: "none", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", columnGap: "20px", rowGap: "12px", padding: "28px 0 0", borderTop: "1px solid rgba(255,255,255,0.25)", marginTop: "32px", medium: { display: "grid" } }),

  statNum: css("pages-home-styles-statNum", { fontSize: "1.75rem", fontWeight: "700", color: colors.primaryText, lineHeight: "1", marginBottom: "6px", fontVariantNumeric: "tabular-nums" }),

  statLabel: css("pages-home-styles-statLabel", { fontSize: "0.8125rem", color: "rgba(255,255,255,0.82)", lineHeight: "1.4" }),

  heroVisual: css("pages-home-styles-heroVisual", { position: "relative", minHeight: "360px", display: "none", alignItems: "center", justifyContent: "center", large: { display: "flex" } }),

  heroBrandMark: css("pages-home-styles-heroBrandMark", { position: "absolute", width: "260px", height: "260px", right: "-18px", top: "10px", opacity: "0.96", filter: "drop-shadow(0 36px 46px rgba(0,0,0,0.25))", transform: "rotate(8deg)", large: { width: "330px", height: "330px", right: "-48px", top: "-22px" } }),

  heroDemoArea: css("pages-home-styles-heroDemoArea", { position: "relative", width: "100%", borderRadius: "16px", overflow: "hidden", zIndex: 1, border: "1px solid rgba(0,0,0,0.2)" }),

  // Demo card (macOS chrome overlay)
  demoChrome: css("pages-home-styles-demoChrome", { display: "flex", alignItems: "center", gap: "6px", padding: "13px 16px", backgroundColor: "var(--terminal-bar)", borderBottom: `1px solid ${colors.border}` }),

  heroDot: css("pages-home-styles-heroDot", { width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0 }),

  heroDemoFilename: css("pages-home-styles-heroDemoFilename", { flex: "1", textAlign: "center", fontFamily: "ui-monospace, monospace", fontSize: "0.75rem", color: colors.textMuted }),

  demoTabBar: css("pages-home-styles-demoTabBar", { display: "flex", borderBottom: `1px solid ${colors.border}`, padding: "0 16px", backgroundColor: colors.bgCard }),

  demoTabBtn: css("pages-home-styles-demoTabBtn", { fontSize: "0.8rem", fontWeight: "700", color: colors.textMuted, padding: "10px 14px", borderBottom: "2px solid transparent", cursor: "pointer", backgroundColor: "transparent", border: "none", fontFamily: "system-ui, sans-serif", hover: { color: colors.textDim } }),


  demoPreviewPane: css("pages-home-styles-demoPreviewPane", { padding: "36px 24px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "250px", backgroundColor: colors.bgCard }),

  demoCodePane: css("pages-home-styles-demoCodePane", { padding: "20px 22px", backgroundColor: "var(--terminal-bg)", color: "var(--terminal-text)", fontFamily: "ui-monospace, monospace", fontSize: "0.8rem", lineHeight: "1.7", overflowX: "auto", minHeight: "250px" }),

  // Philosophy section
  philosophySection: css("pages-home-styles-philosophySection", { position: "relative", overflow: "hidden", padding: "64px 0", borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.bgFooter, medium: { padding: "96px 0" } }),

  philosophyInner: css("pages-home-styles-philosophyInner", { display: "grid", gridTemplateColumns: "1fr", gap: "36px", alignItems: "start", large: { gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)", gap: "72px" } }),

  philosophyQuote: css("pages-home-styles-philosophyQuote", { fontSize: "1.5rem", fontWeight: "700", lineHeight: "1.3", letterSpacing: "-0.01em", raw: { "text-wrap": "balance" }, "& code": { raw: { "font-family": "ui-monospace, monospace", "font-size": "0.9em", color: "var(--c-primary-ink)" } }, medium: { fontSize: "2rem" } }),

  // Same bordered panel as Pipeline/Features; the <ol> carries the order, the visible number is decorative.
  philosophyPoints: css("pages-home-styles-philosophyPoints", { listStyle: "none", margin: "0", padding: "0", backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "16px", "& > li + li": { borderTop: `1px solid ${colors.border}` } }),

  philosophyPoint: css("pages-home-styles-philosophyPoint", { display: "grid", gridTemplateColumns: "28px minmax(0, 1fr)", gap: "14px", padding: "24px", medium: { padding: "28px" } }),

  philosophyPointNum: css("pages-home-styles-philosophyPointNum", { paddingTop: "3px", fontFamily: "ui-monospace, monospace", fontSize: "0.8125rem", color: colors.primaryInk }),

  philosophyPointTitle: css("pages-home-styles-philosophyPointTitle", { fontSize: "1.0625rem", fontWeight: "600", marginBottom: "6px" }),

  philosophyPointDesc: css("pages-home-styles-philosophyPointDesc", { fontSize: "0.9375rem", color: colors.textDim, lineHeight: "1.65", "& code": { raw: { "font-family": "ui-monospace, monospace", "font-size": "0.875em", padding: "1px 5px", "border-radius": "4px", "background-color": "var(--c-bg-secondary)", color: "var(--c-text)" } } }),

  // Pipeline section. content-visibility skips layout/paint while off-screen;
  // contain-intrinsic-size is only a placeholder until it has rendered once.
  pipelineSection: css("pages-home-styles-pipelineSection", { padding: "56px 0 64px", borderBottom: `1px solid ${colors.border}`, medium: { padding: "96px 0" }, raw: { "content-visibility": "auto", "contain-intrinsic-size": "auto 560px" } }),

  // Features section: one panel, stacked then 2x2 from 601px, cells split by 1px dividers.
  featuresSection: css("pages-home-styles-featuresSection", { padding: "64px 0", borderBottom: `1px solid ${colors.border}`, medium: { padding: "96px 0" } }),

  features: css("pages-home-styles-features", { display: "grid", gridTemplateColumns: "1fr", marginTop: "46px", listStyle: "none", backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "16px", "& > li + li": { borderTop: `1px solid ${colors.border}` }, medium: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", "& > li:nth-child(2)": { borderTop: "none" }, "& > li:nth-child(even)": { borderLeft: `1px solid ${colors.border}` } } }),

  featureDesc: css("pages-home-styles-featureDesc", { fontSize: "0.9375rem", color: colors.textDim, lineHeight: "1.65", "& code": { raw: { "font-family": "ui-monospace, monospace", "font-size": "0.875em", padding: "1px 5px", "border-radius": "4px", "background-color": "var(--c-bg-secondary)", color: "var(--c-text)" } } }),

  featureKicker: css("pages-home-styles-featureKicker", { fontFamily: "ui-monospace, monospace", fontSize: "0.68rem", fontWeight: "800", letterSpacing: "0", textTransform: "uppercase", color: colors.textMuted, marginBottom: "6px" }),

  // Comparison section
  comparisonSection: css("pages-home-styles-comparisonSection", { position: "relative", overflow: "hidden", padding: "64px 0", borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.bgFooter, medium: { padding: "96px 0" } }),

  cmpBadge: css("pages-home-styles-cmpBadge", { display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.64rem", fontWeight: "800", letterSpacing: "0", textTransform: "uppercase", color: colors.primary, padding: "3px 10px", borderRadius: "999px", backgroundColor: colors.primaryAlpha08 }),

  // Benchmark section: one panel (caption row, ranked bars, footnote) split by 1px dividers.
  benchSection: css("pages-home-styles-benchSection", { padding: "64px 0", borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.bgFooter, medium: { padding: "96px 0" } }),

  benchPanel: css("pages-home-styles-benchPanel", { marginTop: "46px", backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "16px" }),

  benchHead: css("pages-home-styles-benchHead", { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "4px 16px", flexWrap: "wrap", padding: "16px 20px", borderBottom: `1px solid ${colors.border}`, fontSize: "0.8125rem", color: colors.textDim, medium: { padding: "18px 28px" } }),

  benchCaption: css("pages-home-styles-benchCaption", { fontSize: "0.9375rem", fontWeight: "600", color: colors.text }),

  benchRows: css("pages-home-styles-benchRows", { display: "flex", flexDirection: "column", gap: "16px", padding: "24px 20px", listStyle: "none", medium: { gap: "14px", padding: "28px" } }),

  // Name + score on one line with the bar below; a single line from 601px.
  benchRow: css("pages-home-styles-benchRow", { display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gridTemplateAreas: '"name value" "bar bar"', alignItems: "center", gap: "6px 12px", medium: { gridTemplateColumns: "168px minmax(0, 1fr) 40px", gridTemplateAreas: '"name bar value"', gap: "18px" } }),

  benchName: css("pages-home-styles-benchName", { gridArea: "name", fontSize: "0.875rem", fontWeight: "500", color: colors.textDim, whiteSpace: "nowrap" }),

  benchNameFeatured: css("pages-home-styles-benchNameFeatured", { color: colors.primaryInk, fontWeight: "600" }),

  benchVersion: css("pages-home-styles-benchVersion", { fontFamily: "ui-monospace, monospace", fontSize: "0.75rem", fontWeight: "400", color: colors.textMuted, marginLeft: "8px" }),

  benchBar: css("pages-home-styles-benchBar", { gridArea: "bar", height: "8px", borderRadius: "2px", backgroundColor: colors.borderLight }),

  benchBarFeatured: css("pages-home-styles-benchBarFeatured", { backgroundColor: colors.primary }),

  benchValue: css("pages-home-styles-benchValue", { gridArea: "value", textAlign: "right", fontFamily: "ui-monospace, monospace", fontSize: "0.8125rem", color: colors.textDim, fontVariantNumeric: "tabular-nums" }),

  benchValueFeatured: css("pages-home-styles-benchValueFeatured", { color: colors.primaryInk, fontWeight: "600" }),

  benchFoot: css("pages-home-styles-benchFoot", { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px 24px", flexWrap: "wrap", padding: "16px 20px", borderTop: `1px solid ${colors.border}`, fontSize: "0.8125rem", color: colors.textDim, lineHeight: "1.6", medium: { padding: "18px 28px" } }),

  benchSourceLink: css("pages-home-styles-benchSourceLink", { whiteSpace: "nowrap", color: colors.text, fontWeight: "500", borderBottom: `1px solid ${colors.borderLight}`, hover: { borderColor: colors.text } }),

  // Quick start section
  quickStartSection: css("pages-home-styles-quickStartSection", { padding: "64px 0", medium: { padding: "96px 0" } }),

  quickStartStep: css("pages-home-styles-quickStartStep", { display: "flex", flexDirection: "column", backgroundColor: colors.bgCard, borderRadius: "16px", overflow: "hidden", transition: "transform 0.22s ease", hover: { transform: "translateY(-3px)", boxShadow: "0 18px 44px -24px rgba(0,0,0,0.3)" } }),

  stepHeader: css("pages-home-styles-stepHeader", { padding: "24px 24px 16px", flex: "1" }),

  // Examples teaser section
  examplesTeaserSection: css("pages-home-styles-examplesTeaserSection", { padding: "64px 0", medium: { padding: "96px 0" } }),

  examplesTeaserGrid: css("pages-home-styles-examplesTeaserGrid", { display: "grid", gridTemplateColumns: "1fr", gap: "20px", marginTop: "32px", medium: { gridTemplateColumns: "1fr 1fr", marginTop: "48px" } }),

  teaserCard: css("pages-home-styles-teaserCard", { backgroundColor: colors.bgCard, borderRadius: "16px", overflow: "hidden", transition: "transform 0.22s ease", hover: { transform: "translateY(-3px)", boxShadow: "0 22px 52px -28px var(--c-primary-glow)" } }),

  teaserDemoPane: css("pages-home-styles-teaserDemoPane", { padding: "32px 24px", minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.bgCode }),

  teaserCodePane: css("pages-home-styles-teaserCodePane", { padding: "16px 20px", backgroundColor: colors.bgCode, fontFamily: "ui-monospace, monospace", fontSize: "0.78rem", lineHeight: "1.7", overflowX: "auto" }),

  // CTA section
  // Closing CTA: one bordered panel; copy left, install + actions right from 901px.
  ctaSection: css("pages-home-styles-ctaSection", { padding: "64px 0 80px", medium: { padding: "96px 0 112px" } }),

  ctaPanel: css("pages-home-styles-ctaPanel", { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "28px", padding: "28px 20px", backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "16px", medium: { padding: "40px" }, "@media (min-width: 901px)": { gridTemplateColumns: "minmax(0, 1fr) minmax(320px, auto)", alignItems: "center", gap: "48px", padding: "48px" } }),

  ctaTitle: css("pages-home-styles-ctaTitle", { fontSize: "1.75rem", fontWeight: "700", lineHeight: "1.15", letterSpacing: "-0.02em", marginBottom: "10px", medium: { fontSize: "2.25rem" } }),

  ctaSub: css("pages-home-styles-ctaSub", { maxWidth: "480px", fontSize: "1rem", lineHeight: "1.65", color: colors.textDim }),

  ctaSide: css("pages-home-styles-ctaSide", { display: "flex", flexDirection: "column", gap: "12px" }),

  // Overrides the shared install bar (hero keeps its own look).
  ctaInstallCmd: css("pages-home-styles-ctaInstallCmd", { display: "flex", width: "100%", boxSizing: "border-box", whiteSpace: "nowrap", fontSize: "0.8125rem", boxShadow: "none", border: `1px solid ${colors.border}`, borderRadius: "10px", backgroundColor: colors.bgCode, "& > button": { marginLeft: "auto" } }),

  ctaActions: css("pages-home-styles-ctaActions", { display: "flex", flexWrap: "wrap", gap: "10px", "& > a": { flex: "1 1 auto" } }),

  ctaBtn: css("pages-home-styles-ctaBtn", { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "44px", padding: "0 18px", borderRadius: "8px", fontSize: "0.9375rem", fontWeight: "600", whiteSpace: "nowrap" }),

  ctaBtnPrimary: css("pages-home-styles-ctaBtnPrimary", { backgroundColor: colors.primaryDark, color: "#fff", hover: { filter: "brightness(0.92)" } }),

  ctaBtnSecondary: css("pages-home-styles-ctaBtnSecondary", { border: `1px solid ${colors.borderLight}`, color: colors.text, hover: { backgroundColor: colors.bgSecondary } }),
};
