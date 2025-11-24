import "nuclo";

// Color palette - inspired by the modern dark theme with green accents
export const colors = {
  // Primary - Lime/Green
  primary: "#84cc16",
  primaryHover: "#a3e635",
  primaryDark: "#65a30d",
  primaryGlow: "rgba(132, 204, 22, 0.3)",

  // Background - Deep dark blue-gray
  bg: "#0a0f1a",
  bgLight: "#111827",
  bgCard: "#1a2332",
  bgCardHover: "#1f2937",
  bgCode: "#0d1117",

  // Text
  text: "#f8fafc",
  textMuted: "#94a3b8",
  textDim: "#64748b",

  // Accent
  accent: "#84cc16",
  accentSecondary: "#22d3ee",

  // Border
  border: "#1e293b",
  borderLight: "#334155",
  borderGlow: "rgba(132, 204, 22, 0.2)",

  // Code syntax
  codeKeyword: "#c792ea",
  codeString: "#c3e88d",
  codeFunction: "#82aaff",
  codeComment: "#676e95",
  codeNumber: "#f78c6c",
};

// Base styles injected into document
export function injectGlobalStyles() {
  const style = document.createElement("style");
  style.textContent = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${colors.bg};
      color: ${colors.text};
      line-height: 1.6;
      min-height: 100vh;
    }

    a {
      text-decoration: none;
    }
  
  `;
  document.head.appendChild(style);
}

export const cn = createStyleQueries({
  small: "@media (min-width: 341px)",
  medium: "@media (min-width: 601px)",
  large: "@media (min-width: 1025px)",
});

// Style definitions using cn()
export const s = {
  // Layout
  container: cn(padding("0 16px").maxWidth("1200px").margin("0 auto").width("100%").boxSizing("border-box"), {
    medium: padding("0 24px")
  }),

  // Header
  header: cn(display("flex")
  .backgroundColor("#FF0000")
    .alignItems("center")
    .justifyContent("space-between")
    .padding("20px 24px")
    .backgroundColor("transparent")
    .containerType("inline-size")
    .position("fixed")
    .top("0")
    .left("0")
    .right("0")
    .zIndex(100)
    .borderBottom(`1px solid ${colors.border}`), {
    medium: padding("20px 48px")
  }),

  headerStyle: {
    backdropFilter: "blur(12px)",
    background: "rgba(10, 15, 26, 0.85)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  },

  logo: cn(display("flex")
    .alignItems("center")
    .gap("12px")
    .fontSize("20px")
    .fontWeight("700")
    .color(colors.primary)
    .transition("opacity 0.2s"), {
    medium: fontSize("24px")
  }),

  nav: cn(display("flex")
    .alignItems("center")
    .gap("8px")
    .width("100%").height("200px")),

  navLink: cn(color(colors.textMuted)
    .fontSize("14px")
    .fontWeight("500")
    .transition("all 0.2s"), {
    medium: fontSize("15px"),
    hover: color("red")
  }),

  navLinkActive: cn(color(colors.text)),

  // Hero
  hero: cn(padding("60px 24px 80px")
    .textAlign("center")
    .maxWidth("1000px")
    .margin("0 auto")
    .position("relative"), {
    medium: padding("100px 48px 120px")
  }),

  heroTitle: cn(fontSize("40px")
    .fontWeight("700")
    .lineHeight("1.1")
    .marginBottom("24px")
    .color(colors.text)
    .letterSpacing("-0.02em"), {
    medium: fontSize("56px"),
    large: fontSize("64px")
  }),

  heroTitleAccent: cn(color(colors.primary)),
  heroTitleAccentStyle: { fontStyle: "italic" as const },

  heroSubtitle: cn(fontSize("16px")
    .color(colors.textMuted)
    .maxWidth("600px")
    .margin("0 auto 48px")
    .lineHeight("1.7"), {
    medium: fontSize("18px"),
    large: fontSize("20px")
  }),

  heroButtons: cn(display("flex")
    .gap("16px")
    .justifyContent("center")
    .flexWrap("wrap")),

  // Buttons
  btnPrimary: cn(padding("14px 32px")
    .backgroundColor(colors.primary)
    .color(colors.bg)
    .borderRadius("8px")
    .fontWeight("600")
    .fontSize("15px")
    .border("none")
    .transition("all 0.2s")),

  btnPrimaryStyle: { boxShadow: `0 0 20px ${colors.primaryGlow}` },

  btnSecondary: cn(padding("14px 32px")
    .backgroundColor("transparent")
    .color(colors.text)
    .borderRadius("8px")
    .fontWeight("600")
    .fontSize("15px")
    .border(`1px solid ${colors.borderLight}`)
    .transition("all 0.2s")),

  // Features
  features: cn(display("grid")
    .gap("24px")
    .padding("60px 24px")
    .maxWidth("1200px")
    .margin("0 auto"), {
    medium: padding("80px 48px")
  }),

  featuresStyle: { gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" },

  featureCard: cn(padding("32px")
    .backgroundColor(colors.bgCard)
    .borderRadius("16px")
    .border(`1px solid ${colors.border}`)
    .transition("all 0.3s")
    .position("relative")
    .overflow("hidden")),

  featureIcon: cn(width("56px")
    .height("56px")
    .borderRadius("12px")
    .display("flex")
    .alignItems("center")
    .justifyContent("center")
    .marginBottom("20px")
    .fontSize("28px")),

  featureIconStyle: {
    background: `linear-gradient(135deg, ${colors.bgLight} 0%, ${colors.bgCard} 100%)`,
    border: `1px solid ${colors.border}`,
  },

  featureTitle: cn(fontSize("20px")
    .fontWeight("600")
    .marginBottom("12px")
    .color(colors.text)),

  featureDesc: cn(fontSize("15px")
    .color(colors.textMuted)
    .lineHeight("1.7")),

  // Code blocks
  codeBlock: cn(backgroundColor(colors.bgCode)
    .borderRadius("12px")
    .padding("16px")
    .overflow("auto")
    .maxWidth("100%")
    .boxSizing("border-box")
    .border(`1px solid ${colors.border}`)
    .fontSize("14px")
    .lineHeight("1.7"), {
    medium: padding("24px")
  }),

  codeInline: cn(backgroundColor(colors.bgLight)
    .padding("3px 8px")
    .borderRadius("6px")
    .fontSize("14px")
    .color(colors.primary)
    .border(`1px solid ${colors.border}`)),

  // Sections
  section: cn(padding("60px 24px")
    .maxWidth("1200px")
    .margin("0 auto"), {
    medium: padding("100px 48px")
  }),

  sectionTitle: cn(fontSize("28px")
    .fontWeight("700")
    .marginBottom("16px")
    .color(colors.text)
    .letterSpacing("-0.02em"), {
    medium: fontSize("36px"),
    large: fontSize("40px")
  }),

  sectionSubtitle: cn(fontSize("18px")
    .color(colors.textMuted)
    .marginBottom("56px")
    .maxWidth("600px")
    .lineHeight("1.7")),

  // Demo
  demoContainer: cn(
    display("grid")
      .gap("16px")
      .gridTemplateColumns("1fr")
      .width("100%")
      .boxSizing("border-box"),
    {
      medium: gap("24px").gridTemplateColumns("1fr 1fr")
    }
  ),
  demoContainerSingle: cn(display("flex").flexDirection("column").gap("16px").width("100%").boxSizing("border-box"), {
    medium: gap("24px")
  }),

  demoPanel: cn(backgroundColor(colors.bgCard)
    .borderRadius("16px")
    .border(`1px solid ${colors.border}`)
    .overflow("hidden")
    .maxWidth("100%")
    .boxSizing("border-box")),

  demoPanelHeader: cn(padding("14px 20px")
    .backgroundColor(colors.bgLight)
    .borderBottom(`1px solid ${colors.border}`)
    .fontSize("13px")
    .fontWeight("600")
    .color(colors.textMuted)
    .textTransform("uppercase")
    .letterSpacing("0.05em")),

  demoPanelContent: cn(padding("16px"), {
    medium: padding("24px")
  }),

  // Footer
  footer: cn(padding("48px")
    .borderTop(`1px solid ${colors.border}`)
    .marginTop("auto")
    .textAlign("center")
    .backgroundColor(colors.bgLight)),

  footerText: cn(fontSize("14px").color(colors.textDim)),

  footerLink: cn(color(colors.textMuted).transition("color 0.2s")),

  // Page content
  pageContent: cn(padding("24px 16px 80px")
    .maxWidth("900px")
    .margin("0 auto")
    .width("100%")
    .boxSizing("border-box"), {
    medium: padding("48px 48px 80px")
  }),

  pageTitle: cn(fontSize("32px")
    .fontWeight("700")
    .marginBottom("24px")
    .color(colors.text)
    .letterSpacing("-0.02em"), {
    medium: fontSize("40px"),
    large: fontSize("48px")
  }),

  pageSubtitle: cn(fontSize("20px")
    .color(colors.textMuted)
    .marginBottom("56px")
    .lineHeight("1.7")),

  // Content typography
  h2: cn(fontSize("32px")
    .fontWeight("600")
    .marginTop("64px")
    .marginBottom("20px")
    .color(colors.text)
    .letterSpacing("-0.01em")),

  h3: cn(fontSize("22px")
    .fontWeight("600")
    .marginTop("40px")
    .marginBottom("16px")
    .color(colors.text)),

  p: cn(fontSize("16px")
    .color(colors.textMuted)
    .marginBottom("20px")
    .lineHeight("1.8")),

  ul: cn(paddingLeft("24px").marginBottom("20px")),

  li: cn(fontSize("16px")
    .color(colors.textMuted)
    .marginBottom("12px")
    .lineHeight("1.7")),

  // Utility
  flex: cn(display("flex")),
  flexCenter: cn(display("flex").alignItems("center").justifyContent("center")),
  flexBetween: cn(display("flex").alignItems("center").justifyContent("space-between")),
  flexCol: cn(display("flex").flexDirection("column")),
  gap8: cn(gap("8px")),
  gap16: cn(gap("16px")),
  gap24: cn(gap("24px")),
  gap32: cn(gap("32px")),
  mt16: cn(marginTop("16px")),
  mt24: cn(marginTop("24px")),
  mt32: cn(marginTop("32px")),
  mb16: cn(marginBottom("16px")),
  mb24: cn(marginBottom("24px")),

  // Table
  table: cn(width("100%")
    .borderCollapse("collapse")
    .marginBottom("24px")
    .fontSize("14px")),

  th: cn(padding("14px 16px")
    .textAlign("left")
    .borderBottom(`2px solid ${colors.border}`)
    .fontWeight("600")
    .color(colors.text)
    .backgroundColor(colors.bgLight)),

  td: cn(padding("14px 16px")
    .borderBottom(`1px solid ${colors.border}`)
    .color(colors.textMuted)),

  // Glow effect style object
  glowBoxStyle: {
    boxShadow: `0 0 60px ${colors.primaryGlow}, inset 0 0 60px rgba(132, 204, 22, 0.05)`,
  },
};
