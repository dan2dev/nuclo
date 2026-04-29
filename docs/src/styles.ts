import 'nuclo';

// ── Color tokens — CSS custom properties toggled by [data-theme] on <html> ──
export const colors = {
  primary:         "var(--c-primary)",
  primaryHover:    "var(--c-primary-hover)",
  primaryText:     "var(--c-primary-text)",
  primaryGlow:     "var(--c-primary-glow)",
  primaryAlpha08:  "var(--c-primary-alpha-08)",
  primaryAlpha13:  "var(--c-primary-alpha-13)",
  primaryAlpha19:  "var(--c-primary-alpha-19)",
  primaryDark:     "var(--c-primary-dark)",

  bg:           "var(--c-bg)",
  bgCard:       "var(--c-bg-card)",
  bgSecondary:  "var(--c-bg-secondary)",
  bgLight:      "var(--c-bg-light)",
  bgCode:       "var(--c-bg-code)",
  bgNav:        "var(--c-bg-nav)",
  bgIcon:       "var(--c-bg-icon)",
  bgFooter:     "var(--c-bg-footer)",

  text:          "var(--c-text)",
  textDim:       "var(--c-text-dim)",
  textMuted:     "var(--c-text-muted)",
  textSubtitle:  "var(--c-text-subtitle)",

  border:         "var(--c-border)",
  borderLight:    "var(--c-border-light)",
  borderGlow:     "var(--c-border-glow)",
  borderPrimary:  "var(--c-border-primary)",

  accentSecondary: "var(--c-accent-secondary)",
};

export const globalCss = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:ital,wght@0,400;0,500;1,400&display=swap');

/* ── Custom properties — dark theme (default) ── */
:root, [data-theme="dark"] {
  --c-primary:          #3869ec;
  --c-primary-hover:    #4d7cf0;
  --c-primary-text:     #ffffff;
  --c-primary-dark:     #2c58d4;
  --c-primary-glow:     rgba(56,105,236,0.25);
  --c-primary-alpha-08: rgba(56,105,236,0.12);
  --c-primary-alpha-13: rgba(56,105,236,0.20);
  --c-primary-alpha-19: rgba(56,105,236,0.25);

  --c-bg:           #07070d;
  --c-bg-card:      #0e0e1c;
  --c-bg-secondary: #141426;
  --c-bg-light:     #1a1a30;
  --c-bg-code:      #0c0c1a;
  --c-bg-icon:      #141426;
  --c-bg-nav:       rgba(7,7,13,0.82);
  --c-bg-footer:    #0e0e1c;

  --c-text:          #ecedfa;
  --c-text-dim:      #8888ac;
  --c-text-muted:    #4e4e72;
  --c-text-subtitle: #8888ac;

  --c-border:         rgba(140,140,230,0.09);
  --c-border-light:   rgba(140,140,230,0.16);
  --c-border-glow:    rgba(56,105,236,0.30);
  --c-border-primary: rgba(56,105,236,0.30);

  --c-accent-secondary: #22d3ee;
  --c-shadow:           0 8px 40px rgba(0,0,0,0.5);
  --c-selection-bg:     rgba(56,105,236,0.25);

  --c-tok-keyword: #7ba8f0;
  --c-tok-string:  #7ec99e;
  --c-tok-fn:      #e8c87a;
  --c-tok-comment: #4e4e72;
  --c-tok-number:  #e8a870;
  --c-tok-type:    #7dd8e8;
  --c-tok-punct:   #7070a0;
  --c-tok-prop:    #c89cf0;

  --c-header-bg:       rgba(7,7,13,0.90);
  --c-mobile-menu-bg:  rgba(7,7,13,0.98);
}

[data-theme="light"] {
  --c-primary:          #3869ec;
  --c-primary-hover:    #2c58d4;
  --c-primary-text:     #ffffff;
  --c-primary-dark:     #2c58d4;
  --c-primary-glow:     rgba(56,105,236,0.15);
  --c-primary-alpha-08: rgba(56,105,236,0.08);
  --c-primary-alpha-13: rgba(56,105,236,0.12);
  --c-primary-alpha-19: rgba(56,105,236,0.16);

  --c-bg:           #f7f7fe;
  --c-bg-card:      #eeeef8;
  --c-bg-secondary: #e5e5f2;
  --c-bg-light:     #dddded;
  --c-bg-code:      #ebebf8;
  --c-bg-icon:      #e5e5f2;
  --c-bg-nav:       rgba(247,247,254,0.88);
  --c-bg-footer:    #eeeef8;

  --c-text:          #07070d;
  --c-text-dim:      #4a4a6a;
  --c-text-muted:    #9090b8;
  --c-text-subtitle: #4a4a6a;

  --c-border:         rgba(0,0,80,0.09);
  --c-border-light:   rgba(0,0,80,0.16);
  --c-border-glow:    rgba(56,105,236,0.20);
  --c-border-primary: rgba(56,105,236,0.20);

  --c-accent-secondary: #0f766e;
  --c-shadow:           0 8px 40px rgba(0,0,60,0.10);
  --c-selection-bg:     rgba(56,105,236,0.16);

  --c-tok-keyword: #2655cc;
  --c-tok-string:  #1a7a40;
  --c-tok-fn:      #8a6000;
  --c-tok-comment: #9898b8;
  --c-tok-number:  #c04400;
  --c-tok-type:    #0077aa;
  --c-tok-punct:   #7070a0;
  --c-tok-prop:    #7700cc;

  --c-header-bg:       rgba(247,247,254,0.88);
  --c-mobile-menu-bg:  rgba(247,247,254,0.98);
}

/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; scroll-behavior: smooth; }
body {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  background: var(--c-bg);
  color: var(--c-text);
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  transition: background 0.18s ease, color 0.18s ease;
}
a { color: inherit; text-decoration: none; }
button { font-family: inherit; cursor: pointer; border: none; background: none; }
img, svg { display: block; }

/* ── Logo: invert to white in dark mode ── */
[data-theme="dark"] .brand-logo { filter: brightness(0) invert(1); }

/* ── Syntax highlighting classes ── */
.kw { color: var(--c-tok-keyword); }
.st { color: var(--c-tok-string); }
.fn { color: var(--c-tok-fn); }
.cm { color: var(--c-tok-comment); font-style: italic; }
.nm { color: var(--c-tok-number); }
.ty { color: var(--c-tok-type); }
.pt { color: var(--c-tok-punct); }
.pr { color: var(--c-tok-prop); }

/* ── Page transition ── */
#page-container { animation: pageFadeIn 0.15s ease; }
@keyframes pageFadeIn { from { opacity: 0; } to { opacity: 1; } }

/* ── Spinner (used by app.ts) ── */
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Selection ── */
::selection { background: var(--c-selection-bg); color: var(--c-text); }

/* ── Scrollbar ── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--c-border-light); border-radius: 3px; }

/* ── Docs layout ── */
.docs-layout {
  display: grid;
  grid-template-columns: 228px 1fr;
  min-height: 100vh;
}
.docs-sidebar {
  border-right: 1px solid var(--c-border);
  padding: 36px 0;
  position: sticky;
  top: 80px;
  height: calc(100vh - 80px);
  overflow-y: auto;
  align-self: start;
}
.docs-sidebar::-webkit-scrollbar { width: 4px; }
.docs-sidebar::-webkit-scrollbar-track { background: transparent; }
.docs-sidebar::-webkit-scrollbar-thumb { background: var(--c-border-light); border-radius: 2px; }
.sidebar-group { margin-bottom: 28px; padding: 0 20px; }
.sidebar-group-title {
  font-size: 0.7rem; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--c-text-muted); margin-bottom: 8px;
}
.sidebar-link {
  display: block; font-size: 0.875rem;
  color: var(--c-text-dim); padding: 5px 10px;
  border-radius: 6px; transition: all 0.18s ease;
  cursor: pointer;
}
.sidebar-link:hover { color: var(--c-text); background: var(--c-bg-secondary); }
.sidebar-link.active { color: var(--c-primary); background: var(--c-primary-alpha-08); }
.docs-content {
  padding: 56px 60px;
  max-width: 780px;
}
.docs-content h1 { font-size: 2.2rem; font-weight: 700; margin-bottom: 16px; line-height: 1.2; }
.docs-content h2 {
  font-size: 1.4rem; font-weight: 600;
  margin-top: 56px; margin-bottom: 14px;
  padding-top: 56px; border-top: 1px solid var(--c-border);
  scroll-margin-top: 80px;
}
.docs-content h3 {
  font-size: 1.05rem; font-weight: 600;
  margin-top: 32px; margin-bottom: 10px;
  scroll-margin-top: 80px;
}
.docs-content p { font-size: 0.9375rem; color: var(--c-text-dim); line-height: 1.75; margin-bottom: 18px; }
.docs-content ul, .docs-content ol {
  margin: 0 0 18px 0; padding-left: 20px;
  color: var(--c-text-dim); font-size: 0.9375rem;
}
.docs-content li { margin-bottom: 6px; line-height: 1.7; }
.docs-content code {
  font-family: 'JetBrains Mono', monospace; font-size: 0.82em;
  background: var(--c-bg-secondary); padding: 2px 6px;
  border-radius: 4px; color: var(--c-primary-hover);
}
.docs-content .code-block-frame { margin: 20px 0; }
.docs-callout {
  background: var(--c-primary-alpha-08);
  border: 1px solid rgba(56,105,236,0.2);
  border-radius: 10px; padding: 16px 20px; margin: 20px 0;
  font-size: 0.9rem; color: var(--c-text-dim);
}
.docs-callout strong { color: var(--c-primary); }
.api-sig {
  font-family: 'JetBrains Mono', monospace; font-size: 0.85rem;
  background: var(--c-bg-secondary); border: 1px solid var(--c-border);
  border-radius: 10px; padding: 14px 18px;
  margin: 16px 0; color: var(--c-text); overflow-x: auto;
}
.api-sig .fn { color: var(--c-tok-fn); font-style: normal; }
.api-sig .ty { color: var(--c-tok-type); font-style: normal; }
.api-sig .pt { color: var(--c-tok-punct); font-style: normal; }
.api-sig .kw { color: var(--c-tok-keyword); font-style: normal; }
.api-tag {
  display: inline-block; font-size: 0.7rem; font-weight: 600;
  letter-spacing: 0.06em; text-transform: uppercase;
  padding: 2px 8px; border-radius: 4px; margin-right: 6px;
  vertical-align: middle;
}
.fn-tag { background: rgba(232,200,122,0.15); color: var(--c-tok-fn); }
.type-tag { background: rgba(125,214,232,0.12); color: var(--c-tok-type); }

/* ── Examples page ── */
.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 24px;
  padding: 48px 0;
}
.ecard {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  overflow: hidden;
  transition: border-color 0.18s ease;
}
.ecard:hover { border-color: var(--c-border-light); }
.ecard-top { padding: 22px 24px 0; }
.ecard-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 0.7rem; font-weight: 600; letter-spacing: 0.06em;
  text-transform: uppercase; padding: 3px 9px;
  border-radius: 999px; background: rgba(40,200,64,0.12);
  color: #28c840; border: 1px solid rgba(40,200,64,0.2);
  margin-bottom: 10px;
}
.ecard-title { font-size: 1.05rem; font-weight: 600; margin-bottom: 4px; }
.ecard-desc { font-size: 0.85rem; color: var(--c-text-dim); line-height: 1.55; }
.etabs {
  display: flex; border-bottom: 1px solid var(--c-border);
  padding: 0 22px; margin-top: 16px;
}
.etab {
  font-size: 0.8rem; font-weight: 500; color: var(--c-text-muted);
  padding: 9px 14px; border-bottom: 2px solid transparent;
  transition: all 0.18s ease; cursor: pointer;
  background: none; border-top: none; border-left: none; border-right: none;
  font-family: 'Space Grotesk', system-ui, sans-serif;
}
.etab:hover { color: var(--c-text-dim); }
.etab.on { color: var(--c-primary); border-bottom-color: var(--c-primary); }
.epane { display: none; }
.epane.on { display: block; }
.epreview {
  padding: 32px 24px; min-height: 200px;
  display: flex; align-items: flex-start; justify-content: center;
}
.ecode {
  padding: 20px 22px; background: var(--c-bg-code);
  font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; line-height: 1.72;
  overflow-x: auto; max-height: 420px; overflow-y: auto;
}

/* ── Example demo UI ── */
.ex-counter { text-align: center; width: 100%; }
.ex-count-val {
  font-size: 5rem; font-weight: 700; line-height: 1;
  color: var(--c-text); margin-bottom: 6px;
  font-variant-numeric: tabular-nums; transition: transform 0.1s ease;
}
.ex-count-label { font-size: 0.78rem; color: var(--c-text-muted); letter-spacing: 0.05em; margin-bottom: 24px; }
.ex-btns { display: flex; gap: 10px; justify-content: center; }
.ex-btn {
  padding: 9px 22px; border-radius: 6px;
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  border: 1px solid var(--c-border-light); color: var(--c-text-dim);
  background: var(--c-bg-secondary); transition: all 0.18s ease;
  font-family: 'Space Grotesk', system-ui, sans-serif;
}
.ex-btn:hover { color: var(--c-text); border-color: var(--c-primary); }
.ex-btn.primary { background: var(--c-primary); color: #fff; border-color: transparent; }
.ex-btn.primary:hover { background: var(--c-primary-hover); }
.ex-btn.danger:hover { color: #ff6b6b; border-color: #ff6b6b; }

.ex-todo { width: 100%; max-width: 340px; }
.ex-row { display: flex; gap: 8px; margin-bottom: 14px; }
.ex-input {
  flex: 1; padding: 9px 13px; border-radius: 6px;
  border: 1px solid var(--c-border-light);
  background: var(--c-bg-secondary); color: var(--c-text);
  font-family: 'Space Grotesk', system-ui, sans-serif; font-size: 0.875rem;
  outline: none; transition: border-color 0.18s ease;
}
.ex-input:focus { border-color: var(--c-primary); }
.ex-list { display: flex; flex-direction: column; gap: 6px; }
.ex-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; border-radius: 6px;
  border: 1px solid var(--c-border);
  background: var(--c-bg-secondary); font-size: 0.875rem;
}
.ex-item.done .ex-item-text { text-decoration: line-through; color: var(--c-text-muted); }
.ex-item-text { flex: 1; }
.ex-item-del {
  color: var(--c-text-muted); background: none; border: none;
  font-size: 1rem; cursor: pointer; padding: 0 4px;
  transition: color 0.18s ease; font-family: inherit;
}
.ex-item-del:hover { color: #ff6b6b; }
.ex-empty { font-size: 0.85rem; color: var(--c-text-muted); text-align: center; padding: 20px 0; }

.ex-filters { display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }
.ex-filter {
  padding: 4px 12px; border-radius: 999px;
  font-size: 0.78rem; font-weight: 500; cursor: pointer;
  border: 1px solid var(--c-border-light); color: var(--c-text-muted);
  background: none; transition: all 0.18s ease; font-family: inherit;
}
.ex-filter:hover { color: var(--c-text-dim); }
.ex-filter.active { background: var(--c-primary-alpha-08); color: var(--c-primary); border-color: rgba(56,105,236,0.3); }
.ex-count-summary { font-size: 0.8rem; color: var(--c-text-muted); margin-top: 10px; text-align: center; }

.ex-search { width: 100%; max-width: 360px; }
.ex-search-input { width: 100%; margin-bottom: 14px; }
.ex-user-card {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 6px;
  border: 1px solid var(--c-border);
  background: var(--c-bg-secondary); margin-bottom: 6px;
}
.ex-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--c-primary-alpha-08);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 700; color: var(--c-primary); flex-shrink: 0;
}
.ex-user-name { font-size: 0.875rem; font-weight: 500; }
.ex-user-email { font-size: 0.78rem; color: var(--c-text-muted); }
.ex-no-results { font-size: 0.85rem; color: var(--c-text-muted); text-align: center; padding: 20px 0; }

.ex-async { width: 100%; max-width: 380px; }
.ex-status-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-radius: 6px;
  border: 1px solid var(--c-border); background: var(--c-bg-secondary);
  font-size: 0.82rem; color: var(--c-text-dim); margin-bottom: 12px;
}
.ex-status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.ex-status-dot.idle    { background: var(--c-text-muted); }
.ex-status-dot.loading { background: #febc2e; animation: pulse 1s infinite; }
.ex-status-dot.success { background: #28c840; }
.ex-status-dot.error   { background: #ff5f57; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
.ex-product-card {
  padding: 10px 12px; border-radius: 6px;
  border: 1px solid var(--c-border); background: var(--c-bg-secondary); margin-bottom: 6px;
}
.ex-product-title { font-size: 0.875rem; font-weight: 600; margin-bottom: 2px; }
.ex-product-cat { font-size: 0.78rem; color: var(--c-text-muted); }
.ex-error-msg {
  padding: 10px 12px; border-radius: 6px;
  border: 1px solid rgba(255,95,87,0.3); background: rgba(255,95,87,0.08);
  font-size: 0.85rem; color: #ff8080;
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .docs-layout { grid-template-columns: 1fr; }
  .docs-sidebar { display: none; }
  .docs-content { padding: 36px 24px; }
  .examples-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .ecode { font-size: 0.75rem; }
}
`;

export function injectGlobalStyles() {
  if (document.getElementById('nuclo-global')) return;
  const style = document.createElement('style');
  style.id = 'nuclo-global';
  style.textContent = globalCss;
  document.head.appendChild(style);
}

export const cn = createStyleQueries({
  small:  "@media (min-width: 341px)",
  medium: "@media (min-width: 601px)",
  large:  "@media (min-width: 1025px)",
});

// ── Shared style helpers ──────────────────────────────────────────────────────
export const s = {
  container: cn(
    maxWidth("1140px").margin("0 auto").padding("0 28px")
  ),

  section: cn(
    padding("96px 0")
  ),

  sectionLabel: cn(
    fontFamily("'JetBrains Mono', monospace")
      .fontSize("0.72rem").fontWeight("500")
      .color(colors.primary).letterSpacing("0.08em")
      .textTransform("uppercase").marginBottom("14px")
  ),

  sectionTitle: cn(
    fontSize("clamp(1.8rem, 3vw, 2.5rem)")
      .fontWeight("700").lineHeight("1.2")
      .marginBottom("16px")
  ),

  sectionSub: cn(
    fontSize("1.05rem").color(colors.textDim)
      .maxWidth("540px").lineHeight("1.7")
  ),

  divider: cn(
    height("1px").backgroundColor(colors.border).margin("0")
  ),

  // ── Buttons ──────────────────────────────────────────────────────────────
  btn: cn(
    display("inline-flex").alignItems("center").gap("7px")
      .padding("10px 22px").borderRadius("6px")
      .fontSize("0.875rem").fontWeight("600")
      .transition("all 0.18s ease").whiteSpace("nowrap")
  ),

  btnPrimary: cn(
    backgroundColor(colors.primary).color("#fff")
      .boxShadow(`0 0 0 0 ${colors.primaryGlow}`),
    {
      hover: backgroundColor(colors.primaryHover)
        .boxShadow(`0 4px 20px ${colors.primaryGlow}`)
        .transform("translateY(-1px)")
    }
  ),

  btnSecondary: cn(
    backgroundColor("transparent")
      .border(`1px solid ${colors.borderLight}`)
      .color(colors.textDim),
    { hover: color(colors.text).borderColor(colors.textMuted) }
  ),

  // ── Install command ───────────────────────────────────────────────────────
  installCmd: cn(
    display("inline-flex").alignItems("center").gap("10px")
      .backgroundColor(colors.bgSecondary)
      .border(`1px solid ${colors.border}`)
      .borderRadius("10px").padding("11px 18px")
      .fontFamily("'JetBrains Mono', monospace")
      .fontSize("0.875rem").color(colors.text)
  ),

  // ── Code block ───────────────────────────────────────────────────────────
  codeBlockFrame: cn(
    backgroundColor(colors.bgCode)
      .border(`1px solid ${colors.border}`)
      .borderRadius("10px").overflow("hidden")
  ),

  codeBlockHeader: cn(
    display("flex").alignItems("center").justifyContent("space-between")
      .padding("10px 16px")
      .borderBottom(`1px solid ${colors.border}`)
      .backgroundColor(colors.bgSecondary)
  ),

  codeBlockFilename: cn(
    fontFamily("'JetBrains Mono', monospace")
      .fontSize("0.75rem").color(colors.textMuted)
  ),

  codeBlockBody: cn(
    padding("20px 22px").overflow("auto")
      .fontFamily("'JetBrains Mono', monospace")
      .fontSize("0.8125rem").lineHeight("1.7")
  ),

  // ── Demo card (macOS chrome) ──────────────────────────────────────────────
  demoCard: cn(
    backgroundColor(colors.bgCard)
      .border(`1px solid ${colors.border}`)
      .borderRadius("16px").overflow("hidden")
      .boxShadow(`0 32px 80px rgba(0,0,20,0.5), 0 0 0 1px ${colors.border}`)
  ),

  demoCardBar: cn(
    display("flex").alignItems("center").gap("10px")
      .padding("11px 16px").backgroundColor(colors.bgSecondary)
      .borderBottom(`1px solid ${colors.border}`)
  ),

  demoDots: cn(display("flex").gap("6px")),

  demoTabs: cn(
    display("flex").borderBottom(`1px solid ${colors.border}`)
      .padding("0 16px").backgroundColor(colors.bgCard)
  ),

  demoTab: cn(
    fontSize("0.8rem").fontWeight("500").color(colors.textMuted)
      .padding("10px 14px").borderBottom("2px solid transparent")
      .transition("all 0.18s ease").cursor("pointer")
  ),

  demoTabActive: cn(
    color(colors.primary).borderBottomColor(colors.primary)
  ),

  // ── Feature grid ─────────────────────────────────────────────────────────
  featureGrid: cn(
    display("grid")
      .gridTemplateColumns("repeat(auto-fit, minmax(240px, 1fr))")
      .gap("1px").backgroundColor(colors.border)
      .border(`1px solid ${colors.border}`)
      .borderRadius("16px").overflow("hidden")
  ),

  featureCard: cn(
    backgroundColor(colors.bgCard).padding("32px 28px")
      .transition(`background 0.18s ease`),
    { hover: backgroundColor(colors.bgSecondary) }
  ),

  featureNum: cn(
    fontFamily("'JetBrains Mono', monospace")
      .fontSize("0.72rem").fontWeight("500")
      .color(colors.primary).letterSpacing("0.05em")
      .marginBottom("18px")
  ),

  featureTitle: cn(
    fontSize("1.05rem").fontWeight("600").marginBottom("10px")
  ),

  featureDesc: cn(
    fontSize("0.9rem").color(colors.textDim).lineHeight("1.65")
  ),

  // ── Steps ─────────────────────────────────────────────────────────────────
  stepsGrid: cn(
    display("grid").gridTemplateColumns("repeat(3,1fr)").gap("24px"),
    { medium: gridTemplateColumns("repeat(3,1fr)") }
  ),

  stepNum: cn(
    fontFamily("'JetBrains Mono', monospace")
      .fontSize("0.72rem").fontWeight("500")
      .color(colors.primary).letterSpacing("0.06em")
      .marginBottom("12px")
  ),

  stepTitle: cn(fontSize("1rem").fontWeight("600").marginBottom("8px")),

  stepDesc: cn(fontSize("0.875rem").color(colors.textDim).marginBottom("16px")),

  // ── Badge ─────────────────────────────────────────────────────────────────
  badge: cn(
    display("inline-flex").alignItems("center").gap("6px")
      .fontSize("0.72rem").fontWeight("600")
      .letterSpacing("0.07em").textTransform("uppercase")
      .color(colors.primary).padding("4px 11px")
      .borderRadius("999px")
      .backgroundColor(colors.primaryAlpha08)
      .border("1px solid rgba(56,105,236,0.2)")
  ),

  // ── Stats row ─────────────────────────────────────────────────────────────
  statsRow: cn(
    display("flex").gap("40px").flexWrap("wrap")
      .padding("40px 0").borderTop(`1px solid ${colors.border}`)
      .marginTop("24px")
  ),

  statNum: cn(
    fontSize("1.8rem").fontWeight("700").color(colors.text)
      .lineHeight("1").marginBottom("4px")
  ),

  statLabel: cn(fontSize("0.8rem").color(colors.textMuted)),

  // ── Code inline ───────────────────────────────────────────────────────────
  codeInline: cn(
    fontFamily("'JetBrains Mono', monospace").fontSize("0.82em")
      .backgroundColor(colors.bgLight).padding("1px 5px")
      .borderRadius("3px").color(colors.primaryHover)
  ),
};
