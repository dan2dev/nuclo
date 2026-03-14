import "nuclo";

// All colors use CSS custom properties — switch themes by toggling [data-theme] on <html>
export const colors = {
  // Primary accent — text/links: bright in dark (#D5FF40), dark-olive in light (#4A7A00)
  primary: "var(--c-primary)",
  // Button backgrounds always stay bright #D5FF40 regardless of theme
  primaryBg: "#D5FF40",
  // Text that sits on top of a primary-bg button
  primaryText: "#0e0e0e",

  // Backgrounds
  bg: "var(--c-bg)",
  bgCard: "var(--c-bg-card)",
  bgSecondary: "var(--c-bg-secondary)",   // code blocks, install bar fill
  bgIcon: "var(--c-bg-icon)",             // icon container backgrounds
  bgNav: "var(--c-bg-nav)",
  bgFooter: "var(--c-bg-footer)",

  // Text
  text: "var(--c-text)",
  textMuted: "var(--c-text-muted)",
  textSubtitle: "var(--c-text-subtitle)", // hero subtitle color

  // Borders
  border: "var(--c-border)",
  borderLight: "var(--c-border-light)",   // slightly lighter border
  borderPrimary: "var(--c-border-primary)",

  // Semi-transparent primary tints
  primaryAlpha08: "var(--c-primary-alpha-08)",
  primaryAlpha13: "var(--c-primary-alpha-13)",
  primaryAlpha19: "var(--c-primary-alpha-19)",
};

export function injectGlobalStyles() {
  const style = document.createElement("style");
  style.textContent = `
    /* ── Google Fonts ────────────────────────────────────────────────────── */
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;800&display=swap');

    /* ── CSS Custom Properties ───────────────────────────────────────────── */
    :root, [data-theme="dark"] {
      --c-primary:          #D5FF40;
      --c-primary-alpha-08: rgba(213,255,64,0.08);
      --c-primary-alpha-13: rgba(213,255,64,0.13);
      --c-primary-alpha-19: rgba(213,255,64,0.19);

      --c-bg:           #0e0e0e;
      --c-bg-card:      #1a1a1a;
      --c-bg-secondary: #141414;
      --c-bg-icon:      #222222;
      --c-bg-nav:       rgba(14,14,14,0.85);
      --c-bg-footer:    #161616;

      --c-text:          #FFFFFF;
      --c-text-muted:    #808080;
      --c-text-subtitle: #C0C2B8;

      --c-border:         #2a2a2a;
      --c-border-light:   #333333;
      --c-border-primary: rgba(213,255,64,0.19);

      /* Syntax highlighting */
      --c-tok-accent:  #D5FF40;
      --c-tok-default: #FFFFFF;
      --c-tok-comment: #666666;
      --c-tok-muted:   #808080;
      --c-tok-number:  #D97706;
      --c-tok-fn:      #82aaff;
      --c-tok-type:    #c792ea;

      --c-header-bg:      rgba(14,14,14,0.85);
      --c-mobile-menu-bg: rgba(14,14,14,0.98);
    }

    [data-theme="light"] {
      --c-primary:          #4A7A00;
      --c-primary-alpha-08: rgba(74,122,0,0.08);
      --c-primary-alpha-13: rgba(74,122,0,0.13);
      --c-primary-alpha-19: rgba(74,122,0,0.25);

      --c-bg:           #F5F5F0;
      --c-bg-card:      #FFFFFF;
      --c-bg-secondary: #EEEEEA;
      --c-bg-icon:      #E5E5E0;
      --c-bg-nav:       rgba(245,245,240,0.90);
      --c-bg-footer:    #E5E5E0;

      --c-text:          #111111;
      --c-text-muted:    #888888;
      --c-text-subtitle: #666666;

      --c-border:         #D0D0CC;
      --c-border-light:   #B8B8B4;
      --c-border-primary: rgba(74,122,0,0.25);

      /* Syntax highlighting */
      --c-tok-accent:  #4A7A00;
      --c-tok-default: #111111;
      --c-tok-comment: #888888;
      --c-tok-muted:   #888888;
      --c-tok-number:  #D97706;
      --c-tok-fn:      #1d4ed8;
      --c-tok-type:    #7c3aed;

      --c-header-bg:      rgba(245,245,240,0.90);
      --c-mobile-menu-bg: rgba(245,245,240,0.99);
    }

    /* ── Syntax token classes ────────────────────────────────────────────── */
    .tok-kw      { color: var(--c-tok-accent); }
    .tok-str     { color: var(--c-tok-accent); }
    .tok-fn      { color: var(--c-tok-fn); }
    .tok-num     { color: var(--c-tok-number); }
    .tok-comment { color: var(--c-tok-comment); }
    .tok-type    { color: var(--c-tok-type); }

    /* ── Reset ───────────────────────────────────────────────────────────── */
    * { margin: 0; padding: 0; box-sizing: border-box; min-width: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
    ::selection { background: rgba(213,255,64,0.2); color: var(--c-text); }

    /* ── Page transition ─────────────────────────────────────────────────── */
    #page-container { animation: pageFadeIn 0.15s ease; }
    @keyframes pageFadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

export const cn = createStyleQueries({
  small:  "@media (min-width: 341px)",
  medium: "@media (min-width: 601px)",
  large:  "@media (min-width: 1025px)",
});

export const s = {
  // ── Code blocks ──────────────────────────────────────────────────────────
  codeBlock: cn(
    backgroundColor(colors.bgSecondary)
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
    padding("88px 20px 80px").maxWidth("900px").margin("0 auto").width("100%").boxSizing("border-box"),
    { medium: padding("104px 48px 96px") }
  ),

  pageTitle: cn(
    fontSize("32px").fontWeight("700").marginBottom("16px").color(colors.text).letterSpacing("-0.02em"),
    { medium: fontSize("40px"), large: fontSize("44px") }
  ),

  pageSubtitle: cn(
    fontSize("17px").color(colors.textMuted).marginBottom("0").lineHeight("1.75").maxWidth("640px")
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
