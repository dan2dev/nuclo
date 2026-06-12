import { css, colors } from "../../styles.ts";

export const hs = {
  heroSection: css({ padding: "52px 0 64px", borderBottom: `1px solid ${colors.border}`, large: { padding: "68px 0 96px" } }),

  heroInner: css({ position: "relative", display: "grid", gridTemplateColumns: "1fr", gap: "48px", alignItems: "center", large: { gridTemplateColumns: "minmax(0, 0.94fr) minmax(420px, 1.06fr)", gap: "64px" } }),

  heroRule: css({ width: "56px", height: "3px", backgroundImage: "linear-gradient(90deg, var(--c-primary), var(--c-accent-cool))", borderRadius: "2px", marginBottom: "28px" }),

  heroTitle: css({ fontSize: "2.6rem", fontWeight: "700", letterSpacing: "-0.02em", lineHeight: "1.06", marginBottom: "24px", medium: { fontSize: "3.45rem" }, large: { fontSize: "3.8rem" } }),

  heroDesc: css({ fontSize: "1.05rem", color: colors.textDim, lineHeight: "1.75", marginBottom: "28px", maxWidth: "500px" }),

  heroInstall: css({ marginBottom: "28px" }),

  heroCopyBtn: css({ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", borderRadius: "6px", color: colors.textMuted, border: "1px solid transparent", transition: "all 0.18s ease", flexShrink: 0, hover: { color: colors.primary, borderColor: colors.borderPrimary, backgroundColor: colors.primaryAlpha08 } }),

  heroActions: css({ display: "flex", gap: "12px", flexWrap: "wrap" }),

  // Stats — divider-separated row (divider rule lives in global CSS: .stat-item + .stat-item)
  statsRow: css({ display: "flex", flexWrap: "wrap", rowGap: "20px", padding: "32px 0 0", borderTop: `1px solid ${colors.border}`, marginTop: "36px" }),

  statNum: css({ fontSize: "1.75rem", fontWeight: "700", color: colors.text, lineHeight: "1", marginBottom: "6px", fontVariantNumeric: "tabular-nums" }),

  statLabel: css({ fontSize: "0.78rem", color: colors.textMuted, lineHeight: "1.4" }),

  heroDemoArea: css({ position: "relative", borderRadius: "14px", overflow: "hidden" }),

  // Demo card (macOS chrome overlay)
  demoChrome: css({ display: "flex", alignItems: "center", gap: "6px", padding: "12px 14px", backgroundColor: colors.bgSecondary, borderBottom: `1px solid ${colors.border}` }),

  heroDot: css({ width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0 }),

  heroDemoFilename: css({ flex: "1", textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", color: colors.textMuted }),

  liveTag: css({ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.64rem", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: colors.primary }),

  demoTabBar: css({ display: "flex", borderBottom: `1px solid ${colors.border}`, padding: "0 16px" }),

  demoTabBtn: css({ fontSize: "0.8rem", fontWeight: "500", color: colors.textMuted, padding: "10px 14px", borderBottom: "2px solid transparent", transition: "all 0.18s ease", cursor: "pointer", backgroundColor: "transparent", border: "none", fontFamily: "'Space Grotesk', system-ui, sans-serif", hover: { color: colors.textDim } }),

  demoTabBtnActive: css({ color: colors.primary, hover: { color: colors.primary } }),

  demoPreviewPane: css({ padding: "36px 24px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "270px" }),

  demoCodePane: css({ padding: "20px 22px", backgroundColor: colors.bgCode, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", lineHeight: "1.7", overflowX: "auto", minHeight: "270px" }),

  demoMeta: css({ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", color: colors.textMuted, marginTop: "22px" }),

  // Philosophy section
  philosophySection: css({ position: "relative", overflow: "hidden", padding: "64px 0", borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.bgFooter, medium: { padding: "96px 0" } }),

  philosophyInner: css({ display: "grid", gridTemplateColumns: "1fr", gap: "42px", alignItems: "center", large: { gridTemplateColumns: "0.9fr 1.1fr", gap: "80px" } }),

  philosophyQuote: css({ position: "relative", fontSize: "1.55rem", fontWeight: "700", lineHeight: "1.32", letterSpacing: "-0.01em", marginBottom: "32px", medium: { fontSize: "2rem" } }),

  philosophyMark: css({ display: "block", fontFamily: "Georgia, serif", fontSize: "4.6rem", lineHeight: "0.6", color: colors.primary, opacity: "0.35", marginBottom: "18px" }),

  philosophyPoints: css({ display: "flex", flexDirection: "column", gap: "10px" }),

  philosophyPoint: css({ display: "flex", gap: "16px", alignItems: "flex-start", padding: "16px 18px", borderRadius: "10px", border: "1px solid transparent", transition: "all 0.2s ease", hover: { borderColor: colors.border, backgroundColor: colors.bgCard, transform: "translateX(4px)" } }),

  philosophyPointIcon: css({ width: "38px", height: "38px", borderRadius: "10px", backgroundColor: colors.primaryAlpha08, border: `1px solid ${colors.borderPrimary}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem", fontWeight: "700", color: colors.primary, flexShrink: 0 }),

  philosophyPointTitle: css({ fontSize: "0.97rem", fontWeight: "600", marginBottom: "4px" }),

  philosophyPointDesc: css({ fontSize: "0.875rem", color: colors.textDim, lineHeight: "1.65" }),

  // Pipeline section
  pipelineSection: css({ padding: "64px 0", borderBottom: `1px solid ${colors.border}`, medium: { padding: "96px 0" } }),

  // Features section
  featuresSection: css({ padding: "64px 0", medium: { padding: "96px 0" } }),

  featureIcon: css({ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: colors.primaryAlpha08, border: `1px solid ${colors.borderPrimary}`, color: colors.primary, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }),

  // Comparison section
  comparisonSection: css({ position: "relative", overflow: "hidden", padding: "64px 0", borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.bgFooter, medium: { padding: "96px 0" } }),

  cmpBadge: css({ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.64rem", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: colors.primary, padding: "3px 10px", borderRadius: "999px", backgroundColor: colors.primaryAlpha08, border: `1px solid ${colors.borderPrimary}` }),

  // Quick start section
  quickStartSection: css({ padding: "64px 0", medium: { padding: "96px 0" } }),

  quickStartStep: css({ display: "flex", flexDirection: "column", backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "12px", overflow: "hidden", transition: "all 0.22s ease", hover: { borderColor: colors.borderLight, transform: "translateY(-3px)", boxShadow: "0 18px 44px -18px rgba(0,0,0,0.3)" } }),

  stepHeader: css({ padding: "24px 24px 16px", flex: "1" }),

  // Examples teaser section
  examplesTeaserSection: css({ padding: "64px 0", medium: { padding: "96px 0" } }),

  examplesTeaserGrid: css({ display: "grid", gridTemplateColumns: "1fr", gap: "20px", marginTop: "32px", medium: { gridTemplateColumns: "1fr 1fr", marginTop: "48px" } }),

  teaserCard: css({ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "12px", overflow: "hidden", transition: "all 0.22s ease", hover: { borderColor: colors.borderGlow, transform: "translateY(-3px)", boxShadow: "0 22px 52px -22px rgba(0,0,0,0.4)" } }),

  teaserDemoPane: css({ padding: "32px 24px", minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.bgCode }),

  teaserCodePane: css({ padding: "16px 20px", backgroundColor: colors.bgCode, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem", lineHeight: "1.7", overflowX: "auto" }),

  // CTA section
  ctaSection: css({ padding: "72px 0 88px", textAlign: "center", medium: { padding: "104px 0 120px" } }),

  ctaActions: css({ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "34px" }),

  ctaInstall: css({ display: "flex", justifyContent: "center", marginTop: "26px" }),
};
