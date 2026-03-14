import "nuclo";
import { cn, colors } from "../../styles.ts";

export const HOME_CARD_PADDING = "28px";
export const homeCodeToneColors = {
  accent: "var(--c-primary)",
  comment: "var(--c-text-muted)",
  default: "var(--c-text)",
  muted: "var(--c-text-muted)",
  number: "#D97706",
} as const;

export const hs = {
  section: cn(
    padding("0 24px 80px").maxWidth("1440px").margin("0 auto"),
    { medium: padding("0 48px 80px") },
  ),

  heroSection: cn(
    display("flex").flexDirection("column").alignItems("center")
      .justifyContent("center").textAlign("center")
      .padding("120px 24px 100px"),
    { medium: padding("120px 48px 100px") },
  ),

  heroBadge: cn(
    display("inline-flex").alignItems("center").gap("8px")
      .padding("6px 16px").marginBottom("32px")
      .borderRadius("99px").border(`1px solid ${colors.border}`)
      .backgroundColor(colors.primaryAlpha08),
  ),

  heroBadgeText: cn(
    fontSize("12px").fontWeight("600").color(colors.primary).letterSpacing("0.04em"),
  ),

  heroTitleGroup: cn(
    display("flex").flexDirection("column").alignItems("center").marginBottom("24px"),
  ),

  heroTitle: cn(
    fontSize("48px").fontWeight("800").lineHeight("1.05")
      .letterSpacing("-0.03em").display("block").color(colors.text),
    { medium: fontSize("60px"), large: fontSize("72px") },
  ),

  heroTitleAccent: cn(
    fontSize("48px").fontWeight("800").lineHeight("1.05")
      .letterSpacing("-0.03em").display("block")
      .fontStyle("italic").color(colors.primary),
    { medium: fontSize("60px"), large: fontSize("72px") },
  ),

  heroSubtitle: cn(
    fontSize("16px").color(colors.textSubtitle).lineHeight("1.7")
      .marginBottom("40px").maxWidth("640px"),
    { medium: fontSize("18px") },
  ),

  actionRow: cn(
    display("flex").alignItems("center").justifyContent("center").gap("12px").flexWrap("wrap"),
  ),

  buttonBase: cn(
    display("inline-flex").alignItems("center").justifyContent("center")
      .gap("8px").borderRadius("10px").cursor("pointer")
      .transition("all 0.15s"),
  ),

  buttonRegular: cn(padding("16px 32px").fontSize("15px")),
  buttonCompact: cn(padding("14px 28px").fontSize("15px")),

  buttonPrimary: cn(
    border("none").backgroundColor(colors.primaryBg).color(colors.primaryText)
      .fontWeight("700"),
    { hover: opacity("0.9").transform("translateY(-2px)") },
  ),

  buttonOutlineAccent: cn(
    backgroundColor("transparent").border(`1px solid ${colors.border}`)
      .color(colors.primary).fontWeight("600"),
    { hover: borderColor(colors.borderPrimary).transform("translateY(-2px)") },
  ),

  buttonOutlineNeutral: cn(
    backgroundColor("transparent").border(`1px solid ${colors.border}`)
      .color(colors.text).fontWeight("600"),
    { hover: borderColor(colors.borderPrimary).color(colors.primary) },
  ),

  sectionIntro: cn(
    display("flex").flexDirection("column").gap("12px").marginBottom("48px"),
  ),

  sectionTitle: cn(
    fontSize("28px").fontWeight("800").color(colors.text).letterSpacing("-0.03em"),
    { medium: fontSize("34px"), large: fontSize("38px") },
  ),

  sectionSubtitle: cn(
    fontSize("17px").color(colors.textMuted).lineHeight("1.7"),
  ),

  leadGrid: cn(
    display("grid").gap("20px").alignItems("stretch").marginBottom("20px")
      .gridTemplateColumns("1fr"),
    { medium: gridTemplateColumns("2fr 1fr") },
  ),

  stackedCards: cn(
    display("flex").flexDirection("column").gap("20px"),
  ),

  threeColumnGrid: cn(
    display("grid").gap("20px").gridTemplateColumns("1fr"),
    { medium: gridTemplateColumns("repeat(3, minmax(0, 1fr))") },
  ),

  quickStartStack: cn(
    display("flex").flexDirection("column").gap("20px"),
  ),

  quickStartWideGrid: cn(
    display("grid").gap("20px").gridTemplateColumns("1fr").minHeight("320px"),
    { medium: gridTemplateColumns("420px minmax(0, 1fr)") },
  ),

  quickStartCompactGrid: cn(
    display("grid").gap("20px").gridTemplateColumns("1fr").minHeight("300px"),
    { medium: gridTemplateColumns("minmax(0, 1fr) 380px") },
  ),

  examplesGrid: cn(
    display("grid").gap("20px").gridTemplateColumns("1fr"),
    { medium: gridTemplateColumns("repeat(3, minmax(0, 1fr))") },
  ),

  sectionFooter: cn(
    textAlign("center").marginTop("40px"),
  ),

  card: cn(
    backgroundColor(colors.bgCard).borderRadius("20px")
      .border(`1px solid ${colors.border}`).overflow("hidden")
      .transition("border-color 0.2s, background 0.2s"),
  ),

  cardInteractive: cn(
    cursor("pointer").transition("all 0.2s"),
    {
      hover: border(`1px solid ${colors.borderPrimary}`)
        .transform("translateY(-2px)")
        .boxShadow("0 8px 32px rgba(0,0,0,0.15)"),
    },
  ),

  cardBody: cn(
    padding(HOME_CARD_PADDING).display("flex").flexDirection("column").gap("12px"),
  ),

  cardBodyLarge: cn(
    padding("32px").display("flex").flexDirection("column")
      .justifyContent("space-between").gap("20px"),
  ),

  centeredCard: cn(
    display("flex").flexDirection("column").alignItems("center")
      .justifyContent("center").gap("20px").padding("32px")
      .textAlign("center"),
  ),

  splitCard: cn(
    display("flex").flexDirection("column").overflow("hidden"),
    { medium: flexDirection("row") },
  ),

  splitInfoPane: cn(
    display("flex").flexDirection("column").gap("16px").padding("32px"),
  ),

  splitCodePane: cn(
    display("none"),
    { medium: display("flex").flex("1").overflow("hidden").minWidth("200px") },
  ),

  highlightedCard: cn(borderColor(colors.borderPrimary)),

  heroCodeCard: cn(
    display("flex").flexDirection("column").overflow("hidden").minHeight("420px"),
  ),

  heroCodeScroller: cn(
    flex("1").overflow("auto"),
  ),

  panelHeader: cn(
    display("flex").alignItems("center").justifyContent("space-between")
      .padding("0 20px").height("46px")
      .backgroundColor(colors.bgSecondary)
      .borderBottom(`1px solid ${colors.border}`),
  ),

  terminalHeader: cn(
    display("flex").alignItems("center").gap("8px")
      .padding("0 20px").height("48px")
      .backgroundColor(colors.bgSecondary)
      .borderBottom(`1px solid ${colors.border}`),
  ),

  terminalFileName: cn(
    marginLeft("auto").fontSize("12px").fontWeight("500").color(colors.textMuted),
  ),

  windowDot: cn(
    borderRadius("50%").flexShrink("0"),
  ),

  windowDotRed: cn(
    width("11px").height("11px").backgroundColor("#ff5f57"),
  ),

  windowDotAmber: cn(
    width("11px").height("11px").backgroundColor("#febc2e"),
  ),

  windowDotGreen: cn(
    width("11px").height("11px").backgroundColor("#28c840"),
  ),

  panelEyebrow: cn(
    fontSize("11px").fontWeight("700").color(colors.textMuted).letterSpacing("0.12em"),
  ),

  statusBadge: cn(
    display("inline-flex").alignItems("center").gap("5px")
      .padding("4px 10px").borderRadius("99px")
      .fontSize("11px").fontWeight("600").color(colors.primary)
      .backgroundColor(colors.primaryAlpha08),
  ),

  counterStatusBadge: cn(
    display("inline-flex").alignItems("center").gap("5px")
      .padding("4px 10px").borderRadius("99px")
      .fontSize("11px").fontWeight("700").color(colors.primary)
      .backgroundColor(colors.primaryAlpha13)
      .textTransform("uppercase").letterSpacing("0.07em"),
  ),

  statusDotLarge: cn(
    width("6px").height("6px").borderRadius("50%")
      .backgroundColor(colors.primary).flexShrink("0"),
  ),

  statusDotSmall: cn(
    width("5px").height("5px").borderRadius("50%")
      .backgroundColor(colors.primary).flexShrink("0"),
  ),

  demoBody: cn(
    display("flex").flexDirection("column").gap("16px").padding("20px 24px"),
  ),

  demoMetricRow: cn(
    display("flex").alignItems("center").gap("12px"),
  ),

  demoMetricValue: cn(
    fontSize("56px").fontWeight("800").lineHeight("1")
      .color(colors.text).fontFamily("'JetBrains Mono', monospace"),
  ),

  demoLabel: cn(
    fontSize("10px").fontWeight("700").color(colors.textMuted).letterSpacing("0.15em"),
  ),

  demoActions: cn(
    display("flex").gap("8px").flexWrap("wrap"),
  ),

  demoIconButton: cn(
    display("flex").alignItems("center").justifyContent("center")
      .width("40px").height("40px").borderRadius("8px")
      .backgroundColor(colors.bgSecondary).color(colors.text)
      .border(`1px solid ${colors.border}`)
      .fontSize("18px").fontWeight("700").cursor("pointer")
      .transition("all 0.15s"),
    { hover: borderColor(colors.borderPrimary) },
  ),

  demoPrimaryButton: cn(
    display("flex").alignItems("center").justifyContent("center")
      .width("40px").height("40px").borderRadius("8px")
      .border("none").backgroundColor(colors.primaryBg)
      .color(colors.primaryText).fontSize("18px")
      .fontWeight("700").cursor("pointer").transition("all 0.15s"),
    { hover: opacity("0.85").transform("scale(1.05)") },
  ),

  demoResetButton: cn(
    display("flex").alignItems("center").justifyContent("center")
      .padding("0 14px").height("40px").borderRadius("8px")
      .backgroundColor(colors.bgSecondary).color(colors.textMuted)
      .border(`1px solid ${colors.border}`)
      .fontSize("13px").cursor("pointer").transition("all 0.15s"),
    { hover: color(colors.text).borderColor(colors.borderLight) },
  ),

  codeLinesLarge: cn(
    display("flex").flexDirection("column").gap("8px").padding("24px 28px"),
  ),

  codeLinesCompact: cn(
    display("flex").flexDirection("column").gap("4px").padding("24px 28px")
      .backgroundColor(colors.bgSecondary).overflow("auto"),
  ),

  codeLine: cn(
    fontSize("14px").lineHeight("1.4").fontFamily("'JetBrains Mono', monospace")
      .whiteSpace("pre"),
  ),

  codeLineCompact: cn(
    fontSize("13px").lineHeight("1.5").fontFamily("'JetBrains Mono', monospace")
      .whiteSpace("pre"),
  ),

  metricRow: cn(
    display("flex").alignItems("baseline").gap("6px"),
  ),

  metricValue: cn(
    fontSize("64px").fontWeight("800").lineHeight("1")
      .color(colors.primary).fontFamily("'JetBrains Mono', monospace"),
  ),

  metricSuffix: cn(
    fontSize("20px").fontWeight("600").color(colors.textMuted)
      .fontFamily("'JetBrains Mono', monospace"),
  ),

  metricValueAlt: cn(
    fontSize("56px").fontWeight("800").lineHeight("1")
      .color(colors.primary).fontFamily("'JetBrains Mono', monospace"),
  ),

  metricSuffixAlt: cn(
    fontSize("28px").fontWeight("800").color(colors.primary)
      .fontFamily("'JetBrains Mono', monospace"),
  ),

  title: cn(
    fontSize("17px").fontWeight("600").color(colors.text),
  ),

  titleLarge: cn(
    fontSize("22px").fontWeight("700").color(colors.text),
  ),

  bodyText: cn(
    fontSize("13px").color(colors.textMuted).lineHeight("1.6"),
  ),

  bodyTextRelaxed: cn(
    fontSize("14px").color(colors.textMuted).lineHeight("1.6"),
  ),

  bodyTextWide: cn(
    fontSize("13px").color(colors.textMuted).lineHeight("1.7").flex("1"),
  ),

  bodyTextNarrow: cn(
    fontSize("14px").color(colors.textMuted).lineHeight("1.6").maxWidth("240px"),
  ),

  centeredBodyText: cn(
    fontSize("14px").color(colors.textSubtitle).lineHeight("1.7").maxWidth("260px"),
  ),

  iconBadge: cn(
    display("flex").alignItems("center").justifyContent("center")
      .width("40px").height("40px").borderRadius("10px")
      .backgroundColor(colors.bgIcon).border(`1px solid ${colors.border}`)
      .flexShrink("0"),
  ),

  iconBadgeLarge: cn(
    display("flex").alignItems("center").justifyContent("center")
      .width("64px").height("64px").borderRadius("16px")
      .backgroundColor(colors.bgIcon).border(`1px solid ${colors.border}`)
      .flexShrink("0"),
  ),

  iconText: cn(fontSize("18px")),
  iconTextLarge: cn(fontSize("28px")),
  iconTextFeature: cn(fontSize("22px")),

  stepInfo: cn(
    display("flex").flexDirection("column").gap("16px"),
  ),

  stepInfoCompact: cn(
    display("flex").flexDirection("column").gap("14px"),
  ),

  stepLabel: cn(
    fontSize("11px").fontWeight("700").color(colors.primary).letterSpacing("0.15em"),
  ),

  stepTitle: cn(
    fontSize("24px").fontWeight("700").color(colors.text),
  ),

  commandRow: cn(
    display("flex").alignItems("center").gap("8px").padding("16px 20px")
      .borderRadius("12px").backgroundColor(colors.bgSecondary)
      .border(`1px solid ${colors.border}`),
  ),

  commandPrompt: cn(
    fontSize("14px").color(colors.textMuted).fontFamily("'JetBrains Mono', monospace"),
  ),

  commandText: cn(
    fontSize("14px").fontWeight("600").color(colors.primary)
      .fontFamily("'JetBrains Mono', monospace"),
  ),

  installBar: cn(
    display("flex").alignItems("center").justifyContent("space-between")
      .flexWrap("wrap").gap("20px")
      .borderRadius("20px").border(`1px solid ${colors.border}`)
      .padding("32px 40px").backgroundColor(colors.bgSecondary)
      .boxShadow("0 8px 40px rgba(0,0,0,0.3)"),
  ),

  installInfo: cn(
    display("flex").flexDirection("column").gap("8px"),
  ),

  installEyebrow: cn(
    fontSize("11px").fontWeight("700").color(colors.textMuted).letterSpacing("0.12em"),
  ),

  installCommand: cn(
    fontSize("24px").fontWeight("600").color(colors.primary)
      .fontFamily("'JetBrains Mono', monospace"),
  ),

  exampleTopRow: cn(
    display("flex").alignItems("center").justifyContent("space-between"),
  ),

  exampleIcon: cn(fontSize("28px")),

  exampleLink: cn(
    fontSize("13px").fontWeight("600").color(colors.primary),
  ),

  readyPill: cn(
    display("inline-flex").alignItems("center").gap("8px")
      .padding("8px 20px").borderRadius("99px")
      .backgroundColor(colors.bgIcon).border(`1px solid ${colors.border}`)
      .fontSize("12px").fontWeight("600").color(colors.primary),
  ),
};
