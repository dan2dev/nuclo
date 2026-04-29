import { cn, colors } from "../../styles.ts";

export const hs = {
  heroSection: cn(
    padding("34px 0 88px")
  ),

  heroInner: cn(
    display("grid").gridTemplateColumns("1fr 1fr")
      .gap("64px").alignItems("center"),
    { medium: gridTemplateColumns("1fr 1fr") }
  ),

  heroRule: cn(
    width("40px").height("3px")
      .backgroundColor(colors.primary)
      .borderRadius("2px").marginBottom("28px")
  ),

  heroTitle: cn(
    fontSize("clamp(2.4rem, 4.5vw, 3.8rem)")
      .fontWeight("700").letterSpacing("-0.02em")
      .lineHeight("1.1").marginBottom("22px")
  ),

  heroDesc: cn(
    fontSize("1.05rem").color(colors.textDim)
      .lineHeight("1.75").marginBottom("28px")
      .maxWidth("480px")
  ),

  heroInstall: cn(marginBottom("28px")),

  heroActions: cn(display("flex").gap("12px").flexWrap("wrap")),

  heroDemoArea: cn(position("relative")),

  // Demo card (macOS chrome overlay)
  demoChrome: cn(
    display("flex").alignItems("center").gap("6px")
      .padding("11px 14px").backgroundColor(colors.bgSecondary)
      .borderBottom(`1px solid ${colors.border}`)
  ),

  heroDot: cn(
    width("10px").height("10px").borderRadius("50%").flexShrink("0")
  ),

  heroDemoFilename: cn(
    flex("1").textAlign("center")
      .fontFamily("'JetBrains Mono', monospace")
      .fontSize("0.75rem").color(colors.textMuted)
  ),

  demoTabBar: cn(
    display("flex").borderBottom(`1px solid ${colors.border}`)
      .padding("0 16px")
  ),

  demoTabBtn: cn(
    fontSize("0.8rem").fontWeight("500").color(colors.textMuted)
      .padding("10px 14px").borderBottom("2px solid transparent")
      .transition("all 0.18s ease").cursor("pointer")
      .backgroundColor("transparent").border("none")
      .fontFamily("'Space Grotesk', system-ui, sans-serif"),
    {
      hover: color(colors.textDim),
    }
  ),

  demoTabBtnActive: cn(
    color(colors.primary),
    { hover: color(colors.primary) }
  ),

  demoPreviewPane: cn(
    padding("32px 24px").display("flex")
      .alignItems("center").justifyContent("center")
      .minHeight("240px")
  ),

  demoCodePane: cn(
    padding("20px 22px").backgroundColor(colors.bgCode)
      .fontFamily("'JetBrains Mono', monospace")
      .fontSize("0.8rem").lineHeight("1.7")
      .overflowX("auto").minHeight("240px")
  ),

  // Philosophy section
  philosophySection: cn(
    padding("88px 0")
      .borderTop(`1px solid ${colors.border}`)
      .borderBottom(`1px solid ${colors.border}`)
      .backgroundColor(colors.bgCard)
  ),

  philosophyInner: cn(
    display("grid").gridTemplateColumns("1fr 1fr")
      .gap("80px").alignItems("center")
  ),

  philosophyQuote: cn(
    fontSize("clamp(1.6rem, 2.8vw, 2.2rem)")
      .fontWeight("700").lineHeight("1.3")
      .letterSpacing("-0.015em").marginBottom("32px")
  ),

  philosophyPoints: cn(display("flex").flexDirection("column").gap("22px")),

  philosophyPoint: cn(display("flex").gap("14px").alignItems("flex-start")),

  philosophyPointIcon: cn(
    width("36px").height("36px").borderRadius("8px")
      .backgroundColor(colors.primaryAlpha08)
      .border(`1px solid rgba(56,105,236,0.2)`)
      .display("flex").alignItems("center").justifyContent("center")
      .fontFamily("'JetBrains Mono', monospace")
      .fontSize("0.78rem").fontWeight("500")
      .color(colors.primary).flexShrink("0")
  ),

  philosophyPointTitle: cn(
    fontSize("0.95rem").fontWeight("600").marginBottom("4px")
  ),

  philosophyPointDesc: cn(
    fontSize("0.875rem").color(colors.textDim).lineHeight("1.65")
  ),

  // Features section
  featuresSection: cn(
    padding("88px 0")
  ),

  // Quick start section
  quickStartSection: cn(padding("88px 0")),

  quickStartStep: cn(
    backgroundColor(colors.bgCard)
      .border(`1px solid ${colors.border}`)
      .borderRadius("12px").overflow("hidden")
      .transition("border-color 0.18s ease"),
    { hover: borderColor(colors.borderLight).backgroundColor(colors.bgSecondary) }
  ),

  stepHeader: cn(padding("22px 24px 16px")),

  // Examples teaser section
  examplesTeaserSection: cn(padding("88px 0")),

  examplesTeaserGrid: cn(
    display("grid").gridTemplateColumns("1fr 1fr")
      .gap("20px").marginTop("48px")
  ),

  teaserCard: cn(
    backgroundColor(colors.bgCard)
      .border(`1px solid ${colors.border}`)
      .borderRadius("16px").overflow("hidden")
  ),

  teaserDemoPane: cn(
    padding("32px 24px").minHeight("180px")
      .display("flex").alignItems("center")
      .justifyContent("center").backgroundColor(colors.bgCode)
  ),

  teaserCodePane: cn(
    padding("16px 20px").backgroundColor(colors.bgCode)
      .fontFamily("'JetBrains Mono', monospace")
      .fontSize("0.78rem").lineHeight("1.7").overflowX("auto")
  ),

  // CTA section
  ctaSection: cn(
    padding("96px 0").textAlign("center")
  ),

  ctaActions: cn(
    display("flex").gap("12px").justifyContent("center")
      .flexWrap("wrap").marginTop("32px")
  ),
};
