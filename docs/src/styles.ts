
import 'nuclo';
// All colors use CSS custom properties — switch themes by toggling [data-theme] on <html>
export const colors = {
  // Primary accent — text/links: bright in dark (#6B9EFF), blue in light (#3869EC)
  primary: "var(--c-primary)",
  primaryBg: "var(--c-primary-bg)",
  primaryText: "var(--c-primary-text)",
  primaryHover: "var(--c-primary-hover)",
  primaryDark: "var(--c-primary-dark)",
  primaryGlow: "var(--c-primary-glow)",

  // Backgrounds
  bg: "var(--c-bg)",
  bgCard: "var(--c-bg-card)",
  bgSecondary: "var(--c-bg-secondary)",   // code blocks, install bar fill
  bgLight: "var(--c-bg-light)",           // panel headers, neutral controls
  bgCode: "var(--c-bg-code)",
  bgIcon: "var(--c-bg-icon)",             // icon container backgrounds
  bgNav: "var(--c-bg-nav)",
  bgFooter: "var(--c-bg-footer)",

  // Text
  text: "var(--c-text)",
  textDim: "var(--c-text-dim)",
  textMuted: "var(--c-text-muted)",
  textSubtitle: "var(--c-text-subtitle)", // hero subtitle color

  // Borders
  border: "var(--c-border)",
  borderLight: "var(--c-border-light)",   // slightly lighter border
  borderGlow: "var(--c-border-glow)",
  borderPrimary: "var(--c-border-primary)",

  accentSecondary: "var(--c-accent-secondary)",

  // Semi-transparent primary tints
  primaryAlpha08: "var(--c-primary-alpha-08)",
  primaryAlpha13: "var(--c-primary-alpha-13)",
  primaryAlpha19: "var(--c-primary-alpha-19)",
};

export const globalCss = `
    /* ── JetBrains Mono fallback — metric-matched Courier New ───────────── */
    /* Eliminates CLS when the web font swaps in by keeping line metrics      */
    /* identical between the local fallback and the downloaded font.          */
    @font-face {
      font-family: 'JetBrains Mono';
      font-style: normal;
      font-weight: 100 900;
      font-display: optional;
      size-adjust: 107%;
      ascent-override: 78%;
      descent-override: 19%;
      line-gap-override: 0%;
      src: local('Courier New'), local('CourierNew'), local('monospace');
    }

    /* ── CSS Custom Properties ───────────────────────────────────────────── */
    :root, [data-theme=”dark”] {
      --c-primary:          #6B9EFF;
      --c-primary-bg:       #6B9EFF;
      --c-primary-text:     #0a1020;
      --c-primary-hover:    #7AABFF;
      --c-primary-dark:     #5A87F0;
      --c-primary-glow:     rgba(107,158,255,0.25);
      --c-primary-alpha-08: rgba(107,158,255,0.08);
      --c-primary-alpha-13: rgba(107,158,255,0.13);
      --c-primary-alpha-19: rgba(107,158,255,0.20);

      --c-bg:           #2840BD;
      --c-bg-card:      #0F1A4E;
      --c-bg-secondary: #0A1440;
      --c-bg-light:     #111E55;
      --c-bg-code:      #091038;
      --c-bg-icon:      #152060;
      --c-bg-nav:       rgba(40,64,189,0.85);
      --c-bg-footer:    #2840BD;

      --c-text:          #FFFFFF;
      --c-text-dim:      #8899CC;
      --c-text-muted:    #7080AA;
      --c-text-subtitle: #B0BBDD;

      --c-border:         rgba(255,255,255,0.10);
      --c-border-light:   rgba(255,255,255,0.14);
      --c-border-glow:    rgba(107,158,255,0.30);
      --c-border-primary: rgba(107,158,255,0.30);

      --c-accent-secondary: #22d3ee;
      --c-hero-badge-bg:    rgba(255,255,255,0.08);
      --c-live-badge-bg:    rgba(255,255,255,0.10);
      --c-ready-pill-bg:    rgba(107,158,255,0.12);
      --c-ready-pill-border:rgba(107,158,255,0.30);
      --c-selection-bg:     rgba(107,158,255,0.25);

      /* Syntax highlighting (blue-dark theme) */
      --c-tok-accent-primary: #6B9EFF;
      --c-tok-accent-strong:  #5A87F0;
      --c-tok-keyword:        #c792ea;
      --c-tok-string:         #c3e88d;
      --c-tok-default:        #e2e8f0;
      --c-tok-comment:        #637777;
      --c-tok-muted:          #8892a0;
      --c-tok-number:         #f78c6c;
      --c-tok-fn:             #82aaff;
      --c-tok-type:           #ffcb6b;

      --c-header-bg:      rgba(40,64,189,0.90);
      --c-mobile-menu-bg: rgba(40,64,189,0.98);
    }

    [data-theme="light"] {
      --c-primary:          #3869EC;
      --c-primary-bg:       #3869EC;
      --c-primary-text:     #FFFFFF;
      --c-primary-hover:    #2C58D4;
      --c-primary-dark:     #2C58D4;
      --c-primary-glow:     rgba(56,105,236,0.15);
      --c-primary-alpha-08: rgba(56,105,236,0.08);
      --c-primary-alpha-13: rgba(56,105,236,0.10);
      --c-primary-alpha-19: rgba(56,105,236,0.14);

      --c-bg:           #F5F5F0;
      --c-bg-card:      #FFFFFF;
      --c-bg-secondary: #EEEEEA;
      --c-bg-light:     #E5E5E0;
      --c-bg-code:      #e8edf4;
      --c-bg-icon:      #E5E5E0;
      --c-bg-nav:       rgba(245,245,240,0.80);
      --c-bg-footer:    #E5E5E0;

      --c-text:          #111111;
      --c-text-dim:      #616161;
      --c-text-muted:    #616161;
      --c-text-subtitle: #666666;

      --c-border:         #D0D0CC;
      --c-border-light:   #D0D0CC;
      --c-border-glow:    rgba(56,105,236,0.14);
      --c-border-primary: rgba(56,105,236,0.14);

      --c-accent-secondary: #0f766e;
      --c-hero-badge-bg:    #E5E5E0;
      --c-live-badge-bg:    #E5E5E0;
      --c-ready-pill-bg:    rgba(56,105,236,0.07);
      --c-ready-pill-border:rgba(56,105,236,0.14);
      --c-selection-bg:     rgba(56,105,236,0.16);

      /* Syntax highlighting (light — keywords ≠ strings, fundo legível) */
      --c-tok-accent-primary: #3869EC;
      --c-tok-accent-strong:  #2C58D4;
      --c-tok-keyword:        #4338ca;
      --c-tok-string:         #92400E;
      --c-tok-default:        #0f172a;
      --c-tok-comment:        #475569;
      --c-tok-muted:          #475569;
      --c-tok-number:         #c2410c;
      --c-tok-fn:             #1d4ed8;
      --c-tok-type:           #6d28d9;

      --c-header-bg:      rgba(245,245,240,0.80);
      --c-mobile-menu-bg: rgba(245,245,240,0.96);
    }

    /* ── Syntax token classes ────────────────────────────────────────────── */
    .tok-kw      { color: var(--c-tok-keyword); }
    .tok-str     { color: var(--c-tok-string); }
    .tok-fn      { color: var(--c-tok-fn); }
    .tok-num     { color: var(--c-tok-number); }
    .tok-comment { color: var(--c-tok-comment); }
    .tok-type    { color: var(--c-tok-type); }

    /* ── Brand logo: white on dark/blue header ──────────────────────────── */
    [data-theme="dark"] .brand-logo { filter: brightness(0) invert(1); }

    /* ── Reset ───────────────────────────────────────────────────────────── */
    * { margin: 0; padding: 0; box-sizing: border-box; min-width: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'Futura', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--c-bg);
      color: var(--c-text);
      line-height: 1.6;
      min-height: 100vh;
      transition: background 0.2s ease, color 0.2s ease;
    }
    a { text-decoration: none; }

    /* ── Pitfall card responsive grid ───────────────────────────────────── */
    .pitfall-grid { display: grid; grid-template-columns: 1fr; }
    .pitfall-problem { padding: 20px 24px; border-bottom: 1px solid var(--c-border); }
    @media (min-width: 601px) {
      .pitfall-grid { grid-template-columns: 1fr 1fr; }
      .pitfall-problem { border-bottom: none; border-right: 1px solid var(--c-border); }
    }

    /* ── Scrollbar ───────────────────────────────────────────────────────── */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: var(--c-bg); }
    ::-webkit-scrollbar-thumb { background: var(--c-border); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--c-border-light); }

    /* ── Selection ───────────────────────────────────────────────────────── */
    ::selection { background: var(--c-selection-bg); color: var(--c-text); }

    /* ── Page transition ─────────────────────────────────────────────────── */
    #page-container { animation: pageFadeIn 0.15s ease; }
    @keyframes pageFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
`;

export function injectGlobalStyles() {
  if (document.getElementById('nuclo-global')) return;
  const style = document.createElement("style");
  style.id = 'nuclo-global';
  style.textContent = globalCss;
  document.head.appendChild(style);
}

export const cn = createStyleQueries({
  small:  "@media (min-width: 341px)",
  medium: "@media (min-width: 601px)",
  large:  "@media (min-width: 1025px)",
});

export const s = {
  // ── Code blocks ──────────────────────────────────────────────────────────
  /** Bloco de código padrão do site (tema claro/escuro). */
  codeBlock: cn(
    backgroundColor(colors.bgCode)
      .borderRadius("12px")
      .padding("20px 24px")
      .overflow("auto")
      .maxWidth("100%")
      .boxSizing("border-box")
      .border(`1px solid ${colors.border}`)
      .fontSize("13px")
      .lineHeight("1.7")
      .fontFamily("'JetBrains Mono', 'Courier New', monospace")
  ),

  /** Mesmo visual do codeBlock, padding menor (ex.: docs). */
  codeBlockCompact: cn(
    backgroundColor(colors.bgCode)
      .borderRadius("8px")
      .padding("12px 14px")
      .overflow("auto")
      .maxWidth("100%")
      .boxSizing("border-box")
      .border(`1px solid ${colors.border}`)
      .fontSize("12px")
      .lineHeight("1.65")
      .fontFamily("'JetBrains Mono', 'Courier New', monospace")
  ),

  /** Container com header (label + copy) — mesma borda/fundo que codeBlock. */
  codeBlockFrame: cn(
    width("100%")
      .maxWidth("100%")
      .boxSizing("border-box")
      .overflow("hidden")
      .backgroundColor(colors.bgCode)
      .border(`1px solid ${colors.border}`)
      .borderRadius("12px")
  ),

  codeBlockFrameCompact: cn(
    width("100%")
      .maxWidth("100%")
      .boxSizing("border-box")
      .overflow("hidden")
      .backgroundColor(colors.bgCode)
      .border(`1px solid ${colors.border}`)
      .borderRadius("8px")
  ),

  codeBlockHeader: cn(
    display("flex")
      .alignItems("center")
      .justifyContent("space-between")
      .gap("12px")
      .padding("10px 16px")
      .borderBottom(`1px solid ${colors.border}`)
  ),

  codeBlockHeaderCompact: cn(
    display("flex")
      .alignItems("center")
      .justifyContent("space-between")
      .gap("12px")
      .padding("8px 12px")
      .borderBottom(`1px solid ${colors.border}`)
  ),

  codeBlockBody: cn(
    backgroundColor(colors.bgCode)
      .padding("16px 20px")
      .overflow("auto")
      .maxWidth("100%")
      .boxSizing("border-box")
      .fontSize("13px")
      .lineHeight("1.75")
      .fontFamily("'JetBrains Mono', 'Courier New', monospace")
  ),

  codeBlockBodyCompact: cn(
    backgroundColor(colors.bgCode)
      .padding("12px 14px")
      .overflow("auto")
      .maxWidth("100%")
      .boxSizing("border-box")
      .fontSize("12px")
      .lineHeight("1.65")
      .fontFamily("'JetBrains Mono', 'Courier New', monospace")
  ),

  codeInline: cn(
    backgroundColor(colors.bgSecondary)
      .padding("2px 7px")
      .borderRadius("5px")
      .fontSize("13px")
      .color(colors.primary)
      .border(`1px solid ${colors.border}`)
      .fontFamily("'JetBrains Mono', 'Courier New', monospace")
  ),

  // ── Sections ─────────────────────────────────────────────────────────────
  section: cn(
    padding("56px 24px")
      .maxWidth("1200px")
      .margin("0 auto"),
    { medium: padding("80px 48px") }
  ),

  sectionTitle: cn(
    fontSize("28px")
      .fontWeight("800")
      .marginBottom("12px")
      .color(colors.text)
      .letterSpacing("-0.03em"),
    { medium: fontSize("34px"), large: fontSize("38px") }
  ),

  sectionSubtitle: cn(
    fontSize("17px")
      .color(colors.textMuted)
      .marginBottom("48px")
      .maxWidth("600px")
      .lineHeight("1.7")
  ),

  // ── Demo panels ──────────────────────────────────────────────────────────
  demoContainer: cn(
    display("grid").gap("16px").gridTemplateColumns("1fr").width("100%").boxSizing("border-box"),
    { medium: gap("24px").gridTemplateColumns("1fr 1fr") }
  ),
  demoContainerSingle: cn(
    display("flex").flexDirection("column").gap("16px").width("100%").boxSizing("border-box"),
    { medium: gap("24px") }
  ),
  demoPanel: cn(
    backgroundColor(colors.bgCard)
      .borderRadius("16px")
      .border(`1px solid ${colors.border}`)
      .overflow("hidden")
      .maxWidth("100%")
      .boxSizing("border-box")
  ),
  demoPanelHeader: cn(
    padding("14px 20px")
      .backgroundColor(colors.bgSecondary)
      .borderBottom(`1px solid ${colors.border}`)
      .fontSize("13px")
      .fontWeight("600")
      .color(colors.textMuted)
      .textTransform("uppercase")
      .letterSpacing("0.05em")
  ),
  demoPanelContent: cn(padding("16px"), { medium: padding("24px") }),

  // ── Page content ─────────────────────────────────────────────────────────
  pageContent: cn(
    padding("112px 20px 80px").maxWidth("900px").margin("0 auto").width("100%").boxSizing("border-box"),
    { medium: padding("128px 48px 96px") }
  ),

  pageTitle: cn(
    fontSize("32px").fontWeight("700").marginBottom("16px").color(colors.text).letterSpacing("-0.02em"),
    { medium: fontSize("40px"), large: fontSize("44px") }
  ),

  pageSubtitle: cn(
    fontSize("17px").color(colors.textMuted).marginBottom("0").lineHeight("1.75").maxWidth("640px")
  ),

  // ── Shared interactive elements ──────────────────────────────────────────
  navLink: cn(
    display("flex")
      .alignItems("center")
      .padding("8px 12px")
      .borderRadius("8px")
      .fontSize("14px")
      .fontWeight("500")
      .color(colors.textMuted)
      .cursor("pointer")
      .transition("all 0.2s"),
    { hover: color(colors.primary).backgroundColor(colors.primaryAlpha08) }
  ),

  btnPrimary: cn(
    display("inline-flex")
      .alignItems("center")
      .justifyContent("center")
      .padding("12px 20px")
      .border("none")
      .borderRadius("10px")
      .backgroundColor(colors.primary)
      .color(colors.primaryText)
      .fontWeight("700")
      .cursor("pointer")
      .transition("all 0.2s"),
    {
      hover: backgroundColor(colors.primaryHover)
        .transform("translateY(-1px)")
        .boxShadow(`0 0 24px ${colors.primaryGlow}`)
    }
  ),

  btnSecondary: cn(
    display("inline-flex")
      .alignItems("center")
      .justifyContent("center")
      .padding("12px 20px")
      .border(`1px solid ${colors.border}`)
      .borderRadius("10px")
      .backgroundColor(colors.bgLight)
      .color(colors.text)
      .fontWeight("600")
      .cursor("pointer")
      .transition("all 0.2s"),
    {
      hover: color(colors.primary)
        .borderColor(colors.borderPrimary)
        .backgroundColor(colors.primaryAlpha08)
    }
  ),

  // ── Content typography ────────────────────────────────────────────────────
  h2: cn(fontSize("24px").fontWeight("700").marginTop("56px").marginBottom("20px").color(colors.text).letterSpacing("-0.01em")),
  h3: cn(fontSize("18px").fontWeight("600").marginTop("36px").marginBottom("14px").color(colors.text)),
  p:  cn(fontSize("15px").color(colors.textMuted).marginBottom("20px").lineHeight("1.8")),
  ul: cn(paddingLeft("24px").marginBottom("20px")),
  li: cn(fontSize("16px").color(colors.textMuted).marginBottom("12px").lineHeight("1.7")),

  // ── Table ─────────────────────────────────────────────────────────────────
  table: cn(width("100%").borderCollapse("collapse").marginBottom("24px").fontSize("14px")),
  th: cn(padding("14px 16px").textAlign("left").borderBottom(`2px solid ${colors.border}`).fontWeight("600").color(colors.text).backgroundColor(colors.bgSecondary)),
  td: cn(padding("14px 16px").borderBottom(`1px solid ${colors.border}`).color(colors.textMuted)),

  // ── Utility ───────────────────────────────────────────────────────────────
  flex:        cn(display("flex")),
  flexCenter:  cn(display("flex").alignItems("center").justifyContent("center")),
  flexBetween: cn(display("flex").alignItems("center").justifyContent("space-between")),
  flexCol:     cn(display("flex").flexDirection("column")),
  gap8:  cn(gap("8px")),
  gap16: cn(gap("16px")),
  gap24: cn(gap("24px")),
  mt16:  cn(marginTop("16px")),
  mt24:  cn(marginTop("24px")),
  mt32:  cn(marginTop("32px")),
  mb16:  cn(marginBottom("16px")),
  mb24:  cn(marginBottom("24px")),
};
