import { css, colors } from "../../styles.ts";
import { animations } from "../../styles/animations.ts";

export const hs = {
  heroWrap: css({ position: "relative", overflow: "hidden" }),
  heroBg: css({ position: "absolute", inset: "0", pointerEvents: "none", backgroundImage: "linear-gradient(180deg, transparent 0%, var(--c-bg-secondary) 100%)", opacity: "0.28" }),
  dotGrid: css({ position: "absolute", inset: "0", pointerEvents: "none", backgroundImage: "radial-gradient(var(--grid-dot) 1px, transparent 1.4px)", backgroundSize: "28px 28px", raw: { "-webkit-mask-image": "linear-gradient(180deg, rgba(0,0,0,0.45), transparent 68%)", "mask-image": "linear-gradient(180deg, rgba(0,0,0,0.45), transparent 68%)" } }),
  paneHidden: css({ display: "none" }),
  preWrap: css({ margin: "0", whiteSpace: "pre-wrap" }),
  demoTabBtnActive: css({ color: colors.primary, borderBottom: `2px solid ${colors.primary}` }),
  statItem: css({ paddingRight: "26px", marginRight: "26px", borderRight: `1px solid ${colors.border}`, "&:last-child": { paddingRight: "0", marginRight: "0", borderRight: "none" } }),
  pipe: css({ display: "grid", gridTemplateColumns: "1fr", gap: "0", marginTop: "46px", "@media (min-width: 901px)": { gridTemplateColumns: "1fr 54px 1fr 54px 1fr", alignItems: "stretch" } }),
  pipeNode: css({ position: "relative", backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "26px 26px 24px", transition: "transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease", hover: { transform: "translateY(-3px)", borderColor: colors.borderGlow, boxShadow: "0 18px 44px -24px var(--c-primary-glow)" } }),
  pipeLink: css({ position: "relative", minHeight: "44px", "&::before": { content: "''", position: "absolute", left: "50%", top: "6px", bottom: "6px", width: "2px", transform: "translateX(-50%)", backgroundImage: "repeating-linear-gradient(180deg, var(--c-primary-alpha-19) 0 5px, transparent 5px 11px)" }, "&::after": { content: "''", position: "absolute", left: "50%", top: "6px", bottom: "6px", width: "2px", transform: "translateX(-50%)", backgroundImage: "linear-gradient(180deg, transparent, var(--c-primary), transparent)", backgroundSize: "100% 55%", backgroundRepeat: "no-repeat", animation: `${animations.connectorRunY} 2.3s ease-in-out infinite` }, "@media (min-width: 901px)": { minHeight: "0", "&::before": { left: "5px", right: "5px", top: "50%", bottom: "auto", width: "auto", height: "2px", transform: "translateY(-50%)", backgroundImage: "repeating-linear-gradient(90deg, var(--c-primary-alpha-19) 0 5px, transparent 5px 11px)" }, "&::after": { left: "5px", right: "5px", top: "50%", bottom: "auto", width: "auto", height: "2px", transform: "translateY(-50%)", backgroundImage: "linear-gradient(90deg, transparent, var(--c-primary), transparent)", backgroundSize: "55% 100%", backgroundRepeat: "no-repeat", animation: `${animations.connectorRun} 2.3s ease-in-out infinite` } } }),
  pipeKicker: css({ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", fontWeight: "800", letterSpacing: "0", textTransform: "uppercase", color: colors.primary, marginBottom: "14px" }),
  pipeTitle: css({ fontSize: "1.02rem", fontWeight: "700", marginBottom: "8px" }),
  pipeDesc: css({ fontSize: "0.875rem", color: colors.textDim, lineHeight: "1.65", marginBottom: "16px" }),
  pipeCode: css({ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem", lineHeight: "1.6", backgroundColor: colors.bgCode, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "12px 14px", overflowX: "auto", whiteSpace: "pre" }),
  cmpGrid: css({ display: "grid", gridTemplateColumns: "1fr", gap: "16px", marginTop: "46px", "@media (min-width: 901px)": { gridTemplateColumns: "1fr 1fr 1fr", gap: "18px" } }),
  cmpCol: css({ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "28px 26px", transition: "transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease", hover: { transform: "translateY(-3px)", borderColor: colors.borderLight } }),
  cmpColFeatured: css({ borderColor: "transparent", backgroundImage: "linear-gradient(var(--c-bg-card), var(--c-bg-card)), linear-gradient(160deg, rgba(255,35,0,0.55), rgba(255,154,0,0.36))", raw: { "background-origin": "border-box", "background-clip": "padding-box, border-box" }, boxShadow: "0 26px 64px -32px var(--c-primary-glow)", hover: { boxShadow: "0 30px 72px -30px var(--c-primary-glow)" } }),
  cmpHead: css({ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "6px" }),
  cmpName: css({ fontSize: "1.02rem", fontWeight: "700" }),
  cmpSub: css({ fontSize: "0.8rem", color: colors.textMuted, marginBottom: "20px", fontFamily: "'JetBrains Mono', monospace" }),
  cmpLi: css({ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "0.875rem", color: colors.textDim, lineHeight: "1.6", padding: "7px 0", "& svg": { flexShrink: 0, marginTop: "4px" } }),
  cmpLiGood: css({ color: colors.text, "& svg": { color: colors.primary } }),
  cmpLiDim: css({ "& svg": { color: colors.textMuted } }),
  ctaPanel: css({ position: "relative", overflow: "hidden", border: "1px solid transparent", borderRadius: "8px", backgroundImage: "linear-gradient(var(--c-bg-card), var(--c-bg-card)), linear-gradient(165deg, rgba(255,35,0,0.46), var(--c-border) 38%, var(--c-border) 64%, rgba(255,154,0,0.42))", raw: { "background-origin": "border-box", "background-clip": "padding-box, border-box" }, padding: "68px 24px", textAlign: "center", "&::before": { content: "''", position: "absolute", top: "-80px", right: "-68px", width: "220px", height: "220px", borderRadius: "42px", backgroundImage: "linear-gradient(135deg, var(--c-accent-warm), var(--c-primary), var(--c-accent-secondary))", opacity: "0.14", transform: "rotate(14deg)", pointerEvents: "none" }, "& > *": { position: "relative" }, medium: { padding: "84px 48px" } }),
  heroSection: css({ padding: "48px 0 64px", borderBottom: `1px solid ${colors.border}`, large: { padding: "70px 0 102px" } }),

  heroInner: css({ position: "relative", display: "grid", gridTemplateColumns: "1fr", gap: "48px", alignItems: "center", large: { gridTemplateColumns: "minmax(0, 0.92fr) minmax(420px, 1.08fr)", gap: "70px" } }),

  heroRule: css({ width: "64px", height: "4px", backgroundImage: "linear-gradient(90deg, var(--c-accent-warm), var(--c-primary), var(--c-accent-secondary))", borderRadius: "2px", marginBottom: "28px" }),

  heroTitle: css({ fontSize: "2.7rem", fontWeight: "800", letterSpacing: "0", lineHeight: "1.04", marginBottom: "24px", medium: { fontSize: "3.55rem" }, large: { fontSize: "4.05rem" } }),

  heroDesc: css({ fontSize: "1.05rem", color: colors.textDim, lineHeight: "1.75", marginBottom: "28px", maxWidth: "500px" }),

  heroInstall: css({ marginBottom: "28px" }),

  heroCopyBtn: css({ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", borderRadius: "6px", color: colors.textMuted, border: "1px solid transparent", transition: "all 0.18s ease", flexShrink: 0, hover: { color: colors.primary, borderColor: colors.borderPrimary, backgroundColor: colors.primaryAlpha08 } }),

  heroActions: css({ display: "flex", gap: "12px", flexWrap: "wrap" }),

  // Stats — divider-separated row (divider rule lives in global CSS: .stat-item + .stat-item)
  statsRow: css({ display: "flex", flexWrap: "wrap", rowGap: "20px", padding: "32px 0 0", borderTop: `1px solid ${colors.border}`, marginTop: "36px" }),

  statNum: css({ fontSize: "1.75rem", fontWeight: "700", color: colors.text, lineHeight: "1", marginBottom: "6px", fontVariantNumeric: "tabular-nums" }),

  statLabel: css({ fontSize: "0.78rem", color: colors.textMuted, lineHeight: "1.4" }),

  heroVisual: css({ position: "relative", minHeight: "360px", display: "flex", alignItems: "center", justifyContent: "center" }),

  heroBrandMark: css({ position: "absolute", width: "260px", height: "260px", right: "-18px", top: "10px", opacity: "0.96", filter: "drop-shadow(0 36px 46px rgba(255,63,0,0.26))", transform: "rotate(8deg)", large: { width: "330px", height: "330px", right: "-48px", top: "-22px" } }),

  heroDemoArea: css({ position: "relative", width: "100%", borderRadius: "8px", overflow: "hidden", zIndex: 1 }),

  // Demo card (macOS chrome overlay)
  demoChrome: css({ display: "flex", alignItems: "center", gap: "6px", padding: "13px 16px", backgroundColor: "var(--terminal-bar)", borderBottom: `1px solid ${colors.border}` }),

  heroDot: css({ width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0 }),

  heroDemoFilename: css({ flex: "1", textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", color: colors.textMuted }),

  liveTag: css({ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.64rem", fontWeight: "800", letterSpacing: "0", textTransform: "uppercase", color: colors.primary }),

  demoTabBar: css({ display: "flex", borderBottom: `1px solid ${colors.border}`, padding: "0 16px", backgroundColor: colors.bgCard }),

  demoTabBtn: css({ fontSize: "0.8rem", fontWeight: "700", color: colors.textMuted, padding: "10px 14px", borderBottom: "2px solid transparent", transition: "all 0.18s ease", cursor: "pointer", backgroundColor: "transparent", border: "none", fontFamily: "'Space Grotesk', system-ui, sans-serif", hover: { color: colors.textDim } }),


  demoPreviewPane: css({ padding: "36px 24px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "270px" }),

  demoCodePane: css({ padding: "20px 22px", backgroundColor: "var(--terminal-bg)", color: "var(--terminal-text)", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", lineHeight: "1.7", overflowX: "auto", minHeight: "270px" }),

  demoMeta: css({ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", color: colors.textMuted, marginTop: "22px" }),

  // Philosophy section
  philosophySection: css({ position: "relative", overflow: "hidden", padding: "64px 0", borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.bgFooter, medium: { padding: "96px 0" } }),

  philosophyInner: css({ display: "grid", gridTemplateColumns: "1fr", gap: "42px", alignItems: "center", large: { gridTemplateColumns: "0.9fr 1.1fr", gap: "80px" } }),

  philosophyQuote: css({ position: "relative", fontSize: "1.55rem", fontWeight: "800", lineHeight: "1.32", letterSpacing: "0", marginBottom: "32px", medium: { fontSize: "2rem" } }),

  philosophyMark: css({ display: "block", fontFamily: "Georgia, serif", fontSize: "4.6rem", lineHeight: "0.6", color: colors.primary, opacity: "0.35", marginBottom: "18px" }),

  philosophyPoints: css({ display: "flex", flexDirection: "column", gap: "10px" }),

  philosophyPoint: css({ display: "flex", gap: "16px", alignItems: "flex-start", padding: "16px 18px", borderRadius: "8px", border: "1px solid transparent", transition: "all 0.2s ease", hover: { borderColor: colors.border, backgroundColor: colors.bgCard, transform: "translateX(4px)" } }),

  philosophyPointIcon: css({ width: "38px", height: "38px", borderRadius: "8px", backgroundColor: colors.primaryAlpha08, border: `1px solid ${colors.borderPrimary}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem", fontWeight: "800", color: colors.primary, flexShrink: 0 }),

  philosophyPointTitle: css({ fontSize: "0.97rem", fontWeight: "600", marginBottom: "4px" }),

  philosophyPointDesc: css({ fontSize: "0.875rem", color: colors.textDim, lineHeight: "1.65" }),

  // Pipeline section
  pipelineSection: css({ padding: "64px 0", borderBottom: `1px solid ${colors.border}`, medium: { padding: "96px 0" } }),

  // Features section
  featuresSection: css({ padding: "64px 0", medium: { padding: "96px 0" } }),

  featureIcon: css({ width: "42px", height: "42px", borderRadius: "8px", backgroundImage: "linear-gradient(135deg, var(--c-accent-warm), var(--c-primary))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", boxShadow: "0 14px 28px -20px var(--c-primary-glow)" }),

  // Comparison section
  comparisonSection: css({ position: "relative", overflow: "hidden", padding: "64px 0", borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.bgFooter, medium: { padding: "96px 0" } }),

  cmpBadge: css({ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.64rem", fontWeight: "800", letterSpacing: "0", textTransform: "uppercase", color: colors.primary, padding: "3px 10px", borderRadius: "999px", backgroundColor: colors.primaryAlpha08, border: `1px solid ${colors.borderPrimary}` }),

  // Benchmark section
  benchSection: css({ padding: "64px 0", medium: { padding: "96px 0" } }),

  benchPanel: css({ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "26px 20px", marginTop: "46px", medium: { padding: "38px 42px" } }),

  benchHead: css({ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "26px" }),

  benchKicker: css({ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", fontWeight: "800", letterSpacing: "0", textTransform: "uppercase", color: colors.primary }),

  benchHint: css({ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", color: colors.textMuted }),

  benchRows: css({ display: "flex", flexDirection: "column", gap: "14px" }),

  benchRow: css({ display: "grid", gridTemplateColumns: "1fr", gap: "6px", alignItems: "center", medium: { gridTemplateColumns: "168px 1fr", gap: "18px" } }),

  benchName: css({ fontSize: "0.875rem", fontWeight: "600", color: colors.textDim, whiteSpace: "nowrap" }),

  benchNameFeatured: css({ color: colors.text, fontWeight: "700" }),

  benchVersion: css({ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", fontWeight: "400", color: colors.textMuted, marginLeft: "7px" }),

  benchTrack: css({ position: "relative", height: "32px" }),

  benchFill: css({ position: "relative", height: "32px", minWidth: "54px", borderRadius: "999px", overflow: "hidden", backgroundColor: colors.bgLight, transition: "width 1.1s cubic-bezier(0.22, 1, 0.36, 1)" }),

  benchFillFeatured: css({ backgroundColor: colors.primary, backgroundImage: "linear-gradient(90deg, var(--c-accent-warm) 0%, var(--c-primary) 55%, var(--c-accent-secondary) 130%)", boxShadow: "0 14px 30px -16px var(--c-primary-glow)" }),

  benchValue: css({ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", fontWeight: "700", color: colors.textDim, fontVariantNumeric: "tabular-nums" }),

  benchValueFeatured: css({ color: "#fff" }),

  benchFoot: css({ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "10px 24px", flexWrap: "wrap", marginTop: "28px", paddingTop: "18px", borderTop: `1px solid ${colors.border}`, fontSize: "0.78rem", color: colors.textMuted, lineHeight: "1.6" }),

  benchSourceLink: css({ whiteSpace: "nowrap", color: colors.textDim, fontWeight: "600", borderBottom: `1px solid ${colors.borderLight}`, transition: "color 0.18s ease, border-color 0.18s ease", hover: { color: colors.primary, borderColor: colors.borderPrimary } }),

  // Quick start section
  quickStartSection: css({ padding: "64px 0", medium: { padding: "96px 0" } }),

  quickStartStep: css({ display: "flex", flexDirection: "column", backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "8px", overflow: "hidden", transition: "all 0.22s ease", hover: { borderColor: colors.borderLight, transform: "translateY(-3px)", boxShadow: "0 18px 44px -24px rgba(0,0,0,0.3)" } }),

  stepHeader: css({ padding: "24px 24px 16px", flex: "1" }),

  // Examples teaser section
  examplesTeaserSection: css({ padding: "64px 0", medium: { padding: "96px 0" } }),

  examplesTeaserGrid: css({ display: "grid", gridTemplateColumns: "1fr", gap: "20px", marginTop: "32px", medium: { gridTemplateColumns: "1fr 1fr", marginTop: "48px" } }),

  teaserCard: css({ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "8px", overflow: "hidden", transition: "all 0.22s ease", hover: { borderColor: colors.borderGlow, transform: "translateY(-3px)", boxShadow: "0 22px 52px -28px var(--c-primary-glow)" } }),

  teaserDemoPane: css({ padding: "32px 24px", minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.bgCode }),

  teaserCodePane: css({ padding: "16px 20px", backgroundColor: colors.bgCode, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem", lineHeight: "1.7", overflowX: "auto" }),

  // CTA section
  ctaSection: css({ padding: "72px 0 88px", textAlign: "center", medium: { padding: "104px 0 120px" } }),

  ctaActions: css({ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "34px" }),

  ctaInstall: css({ display: "flex", justifyContent: "center", marginTop: "26px" }),
};

// Benchmark bars start collapsed and grow when the panel scrolls into view:
// the head script sets html[data-anim] when animation is possible, and
// reveal.ts adds .rv-in to the panel — releasing each bar to its css() width.
globalStyle("html[data-anim] .rv:not(.rv-in) .nb-fill", { width: "0%" });
