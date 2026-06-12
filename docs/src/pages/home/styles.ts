import { css, colors } from "../../styles.ts";

export const hs = {
  heroSection: css({ padding: "42px 0 60px", borderBottom: `1px solid ${colors.border}`, large: { padding: "42px 0 88px" } }),

  heroInner: css({ display: "grid", gridTemplateColumns: "1fr", gap: "44px", alignItems: "center", large: { gridTemplateColumns: "minmax(0, 0.92fr) minmax(420px, 1.08fr)", gap: "64px" } }),

  heroRule: css({ width: "40px", height: "3px", backgroundColor: colors.primary, borderRadius: "2px", marginBottom: "28px" }),

  heroTitle: css({ fontSize: "2.35rem", fontWeight: "700", letterSpacing: "0", lineHeight: "1.1", marginBottom: "22px", medium: { fontSize: "3.35rem" } }),

  heroDesc: css({ fontSize: "1.05rem", color: colors.textDim, lineHeight: "1.75", marginBottom: "28px", maxWidth: "480px" }),

  heroInstall: css({ marginBottom: "28px" }),

  heroActions: css({ display: "flex", gap: "12px", flexWrap: "wrap" }),

  heroDemoArea: css({ position: "relative" }),

  // Demo card (macOS chrome overlay)
  demoChrome: css({ display: "flex", alignItems: "center", gap: "6px", padding: "11px 14px", backgroundColor: colors.bgSecondary, borderBottom: `1px solid ${colors.border}` }),

  heroDot: css({ width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0 }),

  heroDemoFilename: css({ flex: "1", textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", color: colors.textMuted }),

  demoTabBar: css({ display: "flex", borderBottom: `1px solid ${colors.border}`, padding: "0 16px" }),

  demoTabBtn: css({ fontSize: "0.8rem", fontWeight: "500", color: colors.textMuted, padding: "10px 14px", borderBottom: "2px solid transparent", transition: "all 0.18s ease", cursor: "pointer", backgroundColor: "transparent", border: "none", fontFamily: "'Space Grotesk', system-ui, sans-serif", hover: { color: colors.textDim } }),

  demoTabBtnActive: css({ color: colors.primary, hover: { color: colors.primary } }),

  demoPreviewPane: css({ padding: "32px 24px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "240px" }),

  demoCodePane: css({ padding: "20px 22px", backgroundColor: colors.bgCode, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", lineHeight: "1.7", overflowX: "auto", minHeight: "240px" }),

  // Philosophy section
  philosophySection: css({ padding: "56px 0", borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.bgFooter, medium: { padding: "88px 0" } }),

  philosophyInner: css({ display: "grid", gridTemplateColumns: "1fr", gap: "42px", alignItems: "center", large: { gridTemplateColumns: "0.9fr 1.1fr", gap: "80px" } }),

  philosophyQuote: css({ fontSize: "1.55rem", fontWeight: "700", lineHeight: "1.3", letterSpacing: "0", marginBottom: "32px", medium: { fontSize: "2.05rem" } }),

  philosophyPoints: css({ display: "flex", flexDirection: "column", gap: "22px" }),

  philosophyPoint: css({ display: "flex", gap: "14px", alignItems: "flex-start" }),

  philosophyPointIcon: css({ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: colors.primaryAlpha08, border: `1px solid ${colors.borderPrimary}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem", fontWeight: "500", color: colors.primary, flexShrink: 0 }),

  philosophyPointTitle: css({ fontSize: "0.95rem", fontWeight: "600", marginBottom: "4px" }),

  philosophyPointDesc: css({ fontSize: "0.875rem", color: colors.textDim, lineHeight: "1.65" }),

  // Features section
  featuresSection: css({ padding: "56px 0", medium: { padding: "88px 0" } }),

  // Quick start section
  quickStartSection: css({ padding: "56px 0", medium: { padding: "88px 0" } }),

  quickStartStep: css({ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "8px", overflow: "hidden", transition: "border-color 0.18s ease, background 0.18s ease", hover: { borderColor: colors.borderLight, backgroundColor: colors.bgSecondary } }),

  stepHeader: css({ padding: "22px 24px 16px" }),

  // Examples teaser section
  examplesTeaserSection: css({ padding: "56px 0", medium: { padding: "88px 0" } }),

  examplesTeaserGrid: css({ display: "grid", gridTemplateColumns: "1fr", gap: "20px", marginTop: "32px", medium: { gridTemplateColumns: "1fr 1fr", marginTop: "48px" } }),

  teaserCard: css({ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "8px", overflow: "hidden" }),

  teaserDemoPane: css({ padding: "32px 24px", minHeight: "180px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.bgCode }),

  teaserCodePane: css({ padding: "16px 20px", backgroundColor: colors.bgCode, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem", lineHeight: "1.7", overflowX: "auto" }),

  // CTA section
  ctaSection: css({ padding: "60px 0", textAlign: "center", medium: { padding: "96px 0" } }),

  ctaActions: css({ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "32px" }),
};
