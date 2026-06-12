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
  --c-primary:          #14b8a6;
  --c-primary-hover:    #2dd4bf;
  --c-primary-text:     #ffffff;
  --c-primary-dark:     #0f766e;
  --c-primary-glow:     rgba(20,184,166,0.26);
  --c-primary-alpha-08: rgba(20,184,166,0.11);
  --c-primary-alpha-13: rgba(20,184,166,0.17);
  --c-primary-alpha-19: rgba(20,184,166,0.24);

  --c-bg:           #09100f;
  --c-bg-card:      #101817;
  --c-bg-secondary: #162221;
  --c-bg-light:     #1e2d2b;
  --c-bg-code:      #0b1211;
  --c-bg-icon:      #162221;
  --c-bg-nav:       #09100f;
  --c-bg-footer:    #0d1413;

  --c-text:          #eef7f3;
  --c-text-dim:      #9db6ad;
  --c-text-muted:    #607970;
  --c-text-subtitle: #9db6ad;

  --c-border:         rgba(137,187,172,0.11);
  --c-border-light:   rgba(154,211,194,0.19);
  --c-border-glow:    rgba(20,184,166,0.31);
  --c-border-primary: rgba(20,184,166,0.34);

  --c-accent-secondary: #f59e0b;
  --c-accent-warm:      #fb7185;
  --c-accent-cool:      #38bdf8;
  --c-shadow:           0 8px 40px rgba(0,0,0,0.5);
  --c-selection-bg:     rgba(20,184,166,0.28);

  --c-tok-keyword: #7dd3fc;
  --c-tok-string:  #86efac;
  --c-tok-fn:      #fbbf24;
  --c-tok-comment: #607970;
  --c-tok-number:  #fb7185;
  --c-tok-type:    #5eead4;
  --c-tok-punct:   #8aa39a;
  --c-tok-prop:    #c4b5fd;

  --c-header-bg:       rgba(9,16,15,0.90);
  --c-mobile-menu-bg:  rgba(9,16,15,0.98);
  --docs-progress:     0%;

  --glow-a:     rgba(20,184,166,0.17);
  --glow-b:     rgba(56,189,248,0.10);
  --glow-c:     rgba(245,158,11,0.06);
  --grid-dot:   rgba(148,212,198,0.28);
  --sheen:      rgba(255,255,255,0.05);
  --card-glow:  0 30px 80px -24px rgba(0,0,0,0.6), 0 0 70px -22px rgba(20,184,166,0.4);
  --grad-line:  linear-gradient(90deg, transparent, rgba(45,212,191,0.55), rgba(56,189,248,0.4), transparent);
}

[data-theme="light"] {
  --c-primary:          #0f766e;
  --c-primary-hover:    #0d9488;
  --c-primary-text:     #ffffff;
  --c-primary-dark:     #115e59;
  --c-primary-glow:     rgba(15,118,110,0.16);
  --c-primary-alpha-08: rgba(15,118,110,0.08);
  --c-primary-alpha-13: rgba(15,118,110,0.13);
  --c-primary-alpha-19: rgba(15,118,110,0.19);

  --c-bg:           #f5f7f3;
  --c-bg-card:      #ffffff;
  --c-bg-secondary: #eaf0ea;
  --c-bg-light:     #dfe8e2;
  --c-bg-code:      #eef3ef;
  --c-bg-icon:      #eaf0ea;
  --c-bg-nav:       #f5f7f3;
  --c-bg-footer:    #edf3ee;

  --c-text:          #101817;
  --c-text-dim:      #405750;
  --c-text-muted:    #81948c;
  --c-text-subtitle: #405750;

  --c-border:         rgba(24,73,61,0.10);
  --c-border-light:   rgba(24,73,61,0.18);
  --c-border-glow:    rgba(15,118,110,0.22);
  --c-border-primary: rgba(15,118,110,0.25);

  --c-accent-secondary: #b45309;
  --c-accent-warm:      #be123c;
  --c-accent-cool:      #0369a1;
  --c-shadow:           0 8px 40px rgba(22,60,50,0.10);
  --c-selection-bg:     rgba(15,118,110,0.17);

  --c-tok-keyword: #0369a1;
  --c-tok-string:  #15803d;
  --c-tok-fn:      #b45309;
  --c-tok-comment: #8da19a;
  --c-tok-number:  #be123c;
  --c-tok-type:    #0f766e;
  --c-tok-punct:   #71857e;
  --c-tok-prop:    #7e22ce;

  --c-header-bg:       rgba(245,247,243,0.88);
  --c-mobile-menu-bg:  rgba(245,247,243,0.98);
  --docs-progress:     0%;

  --glow-a:     rgba(15,118,110,0.11);
  --glow-b:     rgba(3,105,161,0.07);
  --glow-c:     rgba(180,83,9,0.05);
  --grid-dot:   rgba(15,90,80,0.20);
  --sheen:      rgba(255,255,255,0.65);
  --card-glow:  0 30px 70px -28px rgba(22,60,50,0.35), 0 0 60px -26px rgba(15,118,110,0.30);
  --grad-line:  linear-gradient(90deg, transparent, rgba(15,118,110,0.45), rgba(3,105,161,0.35), transparent);
}

/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; scroll-behavior: smooth; }
body {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  background: linear-gradient(180deg, var(--c-bg) 0%, var(--c-bg-footer) 100%);
  color: var(--c-text);
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  transition: background 0.24s ease, color 0.24s ease;
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

/* ── Motion ── */
#page-container { animation: pageFadeIn 0.28s ease both; }
@keyframes pageFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes riseIn {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes softPulse {
  0%, 100% { box-shadow: 0 0 0 rgba(20,184,166,0); }
  50% { box-shadow: 0 0 28px var(--c-primary-glow); }
}
@keyframes progressSweep {
  0% { background-position: 0% 50%; }
  100% { background-position: 220% 50%; }
}

.examples-hero,
.examples-grid,
.docs-hero,
.docs-section {
  animation: riseIn 0.58s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.docs-section:nth-of-type(2) { animation-delay: 0.04s; }
.docs-section:nth-of-type(3) { animation-delay: 0.08s; }
.docs-section:nth-of-type(4) { animation-delay: 0.12s; }
.docs-section:nth-of-type(5) { animation-delay: 0.16s; }

/* ── Premium motion vocabulary ── */
@keyframes shimmerSweep {
  0%   { transform: translateX(-160%) skewX(-18deg); }
  100% { transform: translateX(420%) skewX(-18deg); }
}
@keyframes dotPing {
  0%   { box-shadow: 0 0 0 0 var(--c-primary-glow); }
  70%  { box-shadow: 0 0 0 7px rgba(20,184,166,0); }
  100% { box-shadow: 0 0 0 0 rgba(20,184,166,0); }
}
@keyframes caretBlink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
@keyframes orbDrift {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50%      { transform: translate3d(0, -16px, 0) scale(1.05); }
}
@keyframes connectorRun {
  0%   { background-position: -80% 0; }
  100% { background-position: 180% 0; }
}
@keyframes connectorRunY {
  0%   { background-position: 0 -80%; }
  100% { background-position: 0 180%; }
}

/* ── Hero entrance (CSS-only, runs on first paint) ── */
.he { animation: riseIn 0.62s cubic-bezier(0.22, 1, 0.36, 1) both; }
.he-1 { animation-delay: 0.04s; }
.he-2 { animation-delay: 0.10s; }
.he-3 { animation-delay: 0.17s; }
.he-4 { animation-delay: 0.24s; }
.he-5 { animation-delay: 0.31s; }
.he-6 { animation-delay: 0.38s; }
.he-7 { animation-delay: 0.46s; }

/* ── Scroll reveal — gated on html[data-anim], set only when JS + IO available ── */
html[data-anim] .rv { opacity: 0; }
html[data-anim] .rv.rv-in { animation: riseIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
html[data-anim] .rv-in.rv-d1 { animation-delay: 0.08s; }
html[data-anim] .rv-in.rv-d2 { animation-delay: 0.16s; }
html[data-anim] .rv-in.rv-d3 { animation-delay: 0.24s; }
html[data-anim] .rv-in.rv-d4 { animation-delay: 0.32s; }

/* ── Ambient ornaments ── */
.hero-wrap { position: relative; overflow: hidden; }
.hero-bg { position: absolute; inset: 0; pointer-events: none; }
.hero-bg::before {
  content: '';
  position: absolute;
  top: -240px; left: -180px;
  width: 720px; height: 720px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--glow-a), transparent 62%);
  animation: orbDrift 9s ease-in-out infinite;
}
.hero-bg::after {
  content: '';
  position: absolute;
  bottom: -300px; right: -160px;
  width: 700px; height: 700px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--glow-b), transparent 64%);
  animation: orbDrift 11s ease-in-out 1.2s infinite;
}
.hero-orb-c {
  position: absolute;
  pointer-events: none;
  top: 30%; right: 24%;
  width: 360px; height: 360px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--glow-c), transparent 60%);
  animation: orbDrift 13s ease-in-out 0.6s infinite;
}
.dot-grid {
  position: absolute; inset: 0;
  pointer-events: none;
  background-image: radial-gradient(var(--grid-dot) 1px, transparent 1.4px);
  background-size: 26px 26px;
  -webkit-mask-image: radial-gradient(ellipse 88% 72% at 64% 4%, rgba(0,0,0,0.55), transparent 72%);
          mask-image: radial-gradient(ellipse 88% 72% at 64% 4%, rgba(0,0,0,0.55), transparent 72%);
}

/* ── Gradient hairline ── */
.hairline { height: 1px; border: none; background: var(--grad-line); }

/* ── Gradient text ── */
.grad-text {
  background: linear-gradient(94deg, var(--c-primary-hover) 4%, var(--c-accent-cool) 96%);
  -webkit-background-clip: text;
          background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}

/* ── Shimmer sheen (badge, install bar) ── */
.shimmer { position: relative; overflow: hidden; }
.shimmer::after {
  content: '';
  position: absolute;
  top: 0; bottom: 0; left: 0;
  width: 38%;
  background: linear-gradient(105deg, transparent, var(--sheen), transparent);
  animation: shimmerSweep 4.2s ease-in-out 1s infinite;
  pointer-events: none;
}

/* ── Live badge dot ── */
.badge-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--c-primary);
  animation: dotPing 2.6s ease-out infinite;
  flex-shrink: 0;
}

/* ── Gradient border card ── */
.gborder {
  border: 1px solid transparent;
  background-image:
    linear-gradient(var(--c-bg-card), var(--c-bg-card)),
    linear-gradient(155deg, rgba(45,212,191,0.5) 0%, var(--c-border) 32%, var(--c-border) 68%, rgba(56,189,248,0.42) 100%);
  background-origin: border-box;
  background-clip: padding-box, border-box;
}
.demo-elevated { box-shadow: var(--card-glow); }

/* ── Hero stat dividers ── */
.stat-item { padding-right: 26px; margin-right: 26px; border-right: 1px solid var(--c-border); }
.stat-item:last-child { padding-right: 0; margin-right: 0; border-right: none; }

/* ── Terminal caret ── */
.tcaret {
  display: inline-block;
  width: 8px; height: 1.05em;
  margin-left: 6px;
  vertical-align: text-bottom;
  background: var(--c-primary);
  animation: caretBlink 1.1s steps(1) infinite;
}

/* ── Pipeline ("How update() works") ── */
.pipe {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  margin-top: 46px;
}
.pipe-node {
  position: relative;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 26px 26px 24px;
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}
.pipe-node:hover {
  transform: translateY(-3px);
  border-color: var(--c-border-glow);
  box-shadow: 0 18px 44px -16px rgba(0,0,0,0.35), 0 0 40px -18px var(--c-primary-glow);
}
.pipe-link { position: relative; min-height: 44px; }
.pipe-link::before {
  content: '';
  position: absolute;
  left: 50%; top: 6px; bottom: 6px;
  width: 2px;
  transform: translateX(-50%);
  background: repeating-linear-gradient(180deg, var(--c-primary-alpha-19) 0 5px, transparent 5px 11px);
}
.pipe-link::after {
  content: '';
  position: absolute;
  left: 50%; top: 6px; bottom: 6px;
  width: 2px;
  transform: translateX(-50%);
  background-image: linear-gradient(180deg, transparent, var(--c-primary), transparent);
  background-size: 100% 55%;
  background-repeat: no-repeat;
  animation: connectorRunY 2.3s ease-in-out infinite;
}
@media (min-width: 901px) {
  .pipe { grid-template-columns: 1fr 54px 1fr 54px 1fr; align-items: stretch; }
  .pipe-link { min-height: 0; }
  .pipe-link::before {
    left: 5px; right: 5px; top: 50%; bottom: auto;
    width: auto; height: 2px;
    transform: translateY(-50%);
    background: repeating-linear-gradient(90deg, var(--c-primary-alpha-19) 0 5px, transparent 5px 11px);
  }
  .pipe-link::after {
    left: 5px; right: 5px; top: 50%; bottom: auto;
    width: auto; height: 2px;
    transform: translateY(-50%);
    background-image: linear-gradient(90deg, transparent, var(--c-primary), transparent);
    background-size: 55% 100%;
    background-repeat: no-repeat;
    animation: connectorRun 2.3s ease-in-out infinite;
  }
}
.pipe-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--c-primary);
  margin-bottom: 14px;
}
.pipe-title { font-size: 1.02rem; font-weight: 700; margin-bottom: 8px; }
.pipe-desc { font-size: 0.875rem; color: var(--c-text-dim); line-height: 1.65; margin-bottom: 16px; }
.pipe-code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  line-height: 1.6;
  background: var(--c-bg-code);
  border: 1px solid var(--c-border);
  border-radius: 8px;
  padding: 12px 14px;
  overflow-x: auto;
  white-space: pre;
}

/* ── Comparison ── */
.cmp-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-top: 46px;
}
@media (min-width: 901px) {
  .cmp-grid { grid-template-columns: 1fr 1fr 1fr; gap: 18px; }
}
.cmp-col {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 28px 26px;
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}
.cmp-col:hover { transform: translateY(-3px); border-color: var(--c-border-light); }
.cmp-col.featured {
  border-color: transparent;
  background-image:
    linear-gradient(var(--c-bg-card), var(--c-bg-card)),
    linear-gradient(160deg, rgba(45,212,191,0.55), rgba(56,189,248,0.36));
  background-origin: border-box;
  background-clip: padding-box, border-box;
  box-shadow: 0 26px 64px -28px var(--c-primary-glow);
}
.cmp-col.featured:hover { box-shadow: 0 30px 72px -26px var(--c-primary-glow); }
.cmp-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
.cmp-name { font-size: 1.02rem; font-weight: 700; }
.cmp-sub {
  font-size: 0.8rem;
  color: var(--c-text-muted);
  margin-bottom: 20px;
  font-family: 'JetBrains Mono', monospace;
}
.cmp-li {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 0.875rem;
  color: var(--c-text-dim);
  line-height: 1.6;
  padding: 7px 0;
}
.cmp-li svg { flex-shrink: 0; margin-top: 4px; }
.cmp-li.dim  svg { color: var(--c-text-muted); }
.cmp-li.good svg { color: var(--c-primary); }
.cmp-li.good { color: var(--c-text); }

/* ── CTA panel ── */
.cta-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 18px;
  background-image:
    linear-gradient(var(--c-bg-card), var(--c-bg-card)),
    linear-gradient(165deg, rgba(45,212,191,0.45), var(--c-border) 35%, var(--c-border) 65%, rgba(56,189,248,0.4));
  background-origin: border-box;
  background-clip: padding-box, border-box;
  padding: 68px 24px;
  text-align: center;
}
@media (min-width: 601px) { .cta-panel { padding: 84px 48px; } }
.cta-panel::before {
  content: '';
  position: absolute;
  top: -55%; left: 50%;
  width: 560px; height: 560px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(circle, var(--glow-a), transparent 62%);
  pointer-events: none;
}
.cta-panel > * { position: relative; }

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
  grid-template-columns: 220px minmax(0, 820px) 174px;
  gap: 32px;
  max-width: 1304px;
  margin: 0 auto;
  padding: 0 28px;
  min-height: 100vh;
  align-items: start;
}
.docs-progress {
  position: fixed;
  top: 80px;
  left: 0;
  right: 0;
  z-index: 190;
  height: 2px;
  pointer-events: none;
  background: transparent;
}
.docs-progress-fill {
  width: var(--docs-progress);
  height: 100%;
  background: linear-gradient(90deg, var(--c-accent-secondary), var(--c-primary), var(--c-accent-cool), var(--c-primary));
  background-size: 220% 100%;
  animation: progressSweep 3s linear infinite;
  transition: width 0.08s linear;
}
.docs-sidebar {
  padding: 8px 0 44px;
  position: sticky;
  top: 96px;
  height: calc(100vh - 112px);
  overflow-y: auto;
  align-self: start;
}
.docs-sidebar::-webkit-scrollbar { width: 4px; }
.docs-sidebar::-webkit-scrollbar-track { background: transparent; }
.docs-sidebar::-webkit-scrollbar-thumb { background: var(--c-border-light); border-radius: 2px; }
.docs-sidebar-head {
  margin: 0 0 22px;
  padding: 0 0 18px;
  border-bottom: 1px solid var(--c-border);
}
.docs-sidebar-kicker {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--c-primary);
  margin-bottom: 4px;
}
.docs-sidebar-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--c-text);
}
.sidebar-group { margin-bottom: 26px; }
.sidebar-group-title {
  font-size: 0.7rem; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--c-text-muted); margin-bottom: 8px;
}
.sidebar-link {
  display: block; font-size: 0.86rem;
  color: var(--c-text-dim); padding: 7px 10px 7px 12px;
  border-left: 2px solid transparent;
  border-radius: 0 6px 6px 0; transition: all 0.18s ease;
  cursor: pointer;
}
.sidebar-link:hover { color: var(--c-text); background: var(--c-bg-secondary); }
.sidebar-link.active {
  color: var(--c-primary);
  background: var(--c-primary-alpha-08);
  border-left-color: var(--c-primary);
}
.docs-content {
  padding: 0 0 76px;
  max-width: 820px;
  width: 100%;
  min-width: 0;
  overflow-x: hidden;
}
.docs-hero {
  padding: 6px 0 38px;
  margin-bottom: 2px;
  border-bottom: 1px solid var(--c-border);
}
.docs-eyebrow,
.docs-section-kicker {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--c-accent-secondary);
}
.docs-eyebrow { margin-bottom: 12px; }
.docs-content h1 {
  font-size: 2.7rem;
  font-weight: 700;
  margin-bottom: 14px;
  line-height: 1.08;
}
.docs-lead {
  font-size: 1.05rem;
  color: var(--c-text-dim);
  line-height: 1.75;
  max-width: 720px;
  margin-bottom: 0;
}
.docs-quickstart {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 24px;
  padding: 12px 14px 12px 16px;
  background: color-mix(in srgb, var(--c-bg-card) 82%, transparent);
  border: 1px solid var(--c-border);
  border-radius: 8px;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.docs-quickstart:hover {
  transform: translateY(-2px);
  border-color: var(--c-border-primary);
  box-shadow: 0 16px 36px rgba(0,0,0,0.14);
}
.docs-quickstart-copy {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.docs-quickstart-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--c-text-muted);
  flex-shrink: 0;
}
.docs-quickstart code {
  font-size: 0.82rem;
  background: var(--c-bg-code);
  color: var(--c-text);
  border: 1px solid var(--c-border);
}
.docs-quickstart-link {
  flex-shrink: 0;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--c-primary);
  padding: 7px 10px;
  border-radius: 6px;
  transition: background 0.18s ease, color 0.18s ease;
}
.docs-quickstart-link:hover {
  color: var(--c-primary-hover);
  background: var(--c-primary-alpha-08);
}
.docs-meta-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 26px;
}
.docs-meta-card {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 8px;
  padding: 14px 16px;
  min-width: 0;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.docs-meta-card:hover {
  transform: translateY(-2px);
  border-color: var(--c-border-light);
  box-shadow: 0 14px 32px rgba(0,0,0,0.16);
}
.docs-meta-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--c-text);
  line-height: 1.2;
  margin-bottom: 4px;
}
.docs-meta-label {
  font-size: 0.76rem;
  color: var(--c-text-muted);
}
.docs-mobile-toc { display: none; }
.docs-section {
  padding-top: 46px;
  margin-top: 46px;
  border-top: 1px solid var(--c-border);
  scroll-margin-top: 104px;
}
.docs-section-head {
  margin-bottom: 14px;
}
.docs-section-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.docs-section-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 22px;
  border-radius: 5px;
  background: var(--c-primary-alpha-08);
  color: var(--c-primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  font-weight: 700;
}
.docs-section-kicker { display: inline-flex; }
.docs-section-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.docs-content h2 {
  font-size: 1.55rem; font-weight: 700;
  margin: 0;
  line-height: 1.24;
}
.docs-section-anchor {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  color: var(--c-text-muted);
  border: 1px solid transparent;
  opacity: 0;
  transition: all 0.18s ease;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.86rem;
}
.docs-section:hover .docs-section-anchor,
.docs-section-anchor:focus-visible {
  opacity: 1;
}
.docs-section-anchor:hover {
  color: var(--c-primary);
  background: var(--c-primary-alpha-08);
  border-color: var(--c-border-primary);
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
.docs-content li::marker { color: var(--c-primary); }
.docs-content code {
  font-family: 'JetBrains Mono', monospace; font-size: 0.82em;
  background: var(--c-bg-secondary); padding: 2px 6px;
  border-radius: 4px; color: var(--c-primary-hover);
}
.docs-content .code-block-frame {
  margin: 22px 0;
  background: var(--c-bg-code);
  border: 1px solid var(--c-border);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
}
.docs-content .code-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 38px;
  padding: 9px 16px;
  background: var(--c-bg-secondary);
  border-bottom: 1px solid var(--c-border);
}
.docs-content .code-block-filename {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: var(--c-text-muted);
}
.docs-content .code-block-body {
  padding: 18px 20px 20px;
  overflow-x: auto;
  color: var(--c-text);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  line-height: 1.7;
  scrollbar-width: thin;
}
.docs-content .code-block-body pre {
  margin: 0;
  white-space: pre;
  min-width: max-content;
}
.docs-callout {
  background: var(--c-primary-alpha-08);
  border: 1px solid var(--c-border-primary);
  border-left: 3px solid var(--c-primary);
  border-radius: 8px; padding: 16px 18px; margin: 20px 0;
  font-size: 0.9rem; color: var(--c-text-dim);
  animation: softPulse 4.2s ease-in-out infinite;
}
.docs-callout strong { color: var(--c-primary); }
.api-heading-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0 10px;
}
.api-label {
  font-size: 0.75rem;
  color: var(--c-text-muted);
}
.api-sig {
  font-family: 'JetBrains Mono', monospace; font-size: 0.82rem;
  background: var(--c-bg-code); border: 1px solid var(--c-border);
  border-left: 3px solid var(--c-accent-secondary);
  border-radius: 8px; padding: 14px 18px;
  margin: 16px 0 20px; color: var(--c-text); overflow-x: auto;
  line-height: 1.7;
  scrollbar-width: thin;
}
.api-sig .fn { color: var(--c-tok-fn); font-style: normal; }
.api-sig .ty { color: var(--c-tok-type); font-style: normal; }
.api-sig .pt { color: var(--c-tok-punct); font-style: normal; }
.api-sig .kw { color: var(--c-tok-keyword); font-style: normal; }
.api-tag {
  display: inline-block; font-size: 0.7rem; font-weight: 600;
  letter-spacing: 0.06em; text-transform: uppercase;
  padding: 2px 8px; border-radius: 4px;
  vertical-align: middle;
}
.fn-tag { background: rgba(232,200,122,0.15); color: var(--c-tok-fn); }
.type-tag { background: rgba(125,214,232,0.12); color: var(--c-tok-type); }
.docs-rail {
  position: sticky;
  top: 96px;
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.docs-rail-card {
  border: 1px solid var(--c-border);
  background: color-mix(in srgb, var(--c-bg-card) 86%, transparent);
  border-radius: 8px;
  padding: 14px;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.docs-rail-card:hover {
  transform: translateY(-2px);
  border-color: var(--c-border-light);
  box-shadow: 0 14px 30px rgba(0,0,0,0.14);
}
.docs-rail-kicker {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--c-text-muted);
  margin-bottom: 8px;
}
.docs-rail-title {
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--c-text);
}
.docs-rail-group {
  margin-top: 4px;
  font-size: 0.76rem;
  color: var(--c-accent-secondary);
}
.docs-rail-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.docs-rail-link {
  display: block;
  border-radius: 6px;
  padding: 7px 8px;
  color: var(--c-text-dim);
  font-size: 0.8rem;
  line-height: 1.35;
  transition: color 0.18s ease, background 0.18s ease;
}
.docs-rail-link:hover {
  color: var(--c-text);
  background: var(--c-bg-secondary);
}
.docs-rail-link.active {
  color: var(--c-primary);
  background: var(--c-primary-alpha-08);
}

/* ── Examples page ── */
.examples-hero {
  padding: 60px 0 38px;
  border-bottom: 1px solid var(--c-border);
}
.examples-hero-inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 42px;
  align-items: end;
}
.examples-kicker {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--c-accent-secondary);
  margin-bottom: 12px;
}
.examples-hero h1 {
  max-width: 660px;
  font-size: 3rem;
  font-weight: 700;
  line-height: 1.08;
  margin-bottom: 16px;
}
.examples-lead {
  max-width: 620px;
  font-size: 1.05rem;
  color: var(--c-text-dim);
  line-height: 1.75;
}
.examples-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.examples-fact {
  min-width: 0;
  padding: 14px 13px;
  border: 1px solid var(--c-border);
  border-radius: 8px;
  background: var(--c-bg-card);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.examples-fact:hover {
  transform: translateY(-2px);
  border-color: var(--c-border-light);
  box-shadow: 0 14px 28px rgba(0,0,0,0.12);
}
.examples-fact-value {
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--c-text);
  margin-bottom: 4px;
}
.examples-fact-label {
  font-size: 0.74rem;
  line-height: 1.35;
  color: var(--c-text-muted);
}
.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 18px;
  padding: 38px 0 64px;
}
.ecard {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
  animation: riseIn 0.56s cubic-bezier(0.22, 1, 0.36, 1) both;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}
.ecard:nth-child(2) { animation-delay: 0.04s; }
.ecard:nth-child(3) { animation-delay: 0.08s; }
.ecard:nth-child(4) { animation-delay: 0.12s; }
.ecard:nth-child(5) { animation-delay: 0.16s; }
.ecard:hover {
  transform: translateY(-3px);
  border-color: var(--c-border-light);
  background: color-mix(in srgb, var(--c-bg-card) 84%, var(--c-bg-secondary));
  box-shadow: 0 18px 42px rgba(0,0,0,0.18);
}
.ecard-top { padding: 20px 20px 0; }
.ecard-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.ecard-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 0.7rem; font-weight: 600; letter-spacing: 0.06em;
  text-transform: uppercase; padding: 3px 9px;
  border-radius: 999px; background: var(--c-primary-alpha-08);
  color: var(--c-primary); border: 1px solid var(--c-border-primary);
}
.ecard-number {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--c-text-muted);
}
.ecard-title { font-size: 1.08rem; font-weight: 700; margin-bottom: 5px; }
.ecard-desc { font-size: 0.86rem; color: var(--c-text-dim); line-height: 1.58; min-height: 2.75em; }
.etabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--c-border);
  padding: 14px 20px 0;
  margin-top: 16px;
}
.etab {
  font-size: 0.8rem; font-weight: 500; color: var(--c-text-muted);
  padding: 8px 12px; border-bottom: 2px solid transparent;
  border-radius: 6px 6px 0 0;
  transition: all 0.18s ease; cursor: pointer;
  background: none; border-top: none; border-left: none; border-right: none;
  font-family: 'Space Grotesk', system-ui, sans-serif;
}
.etab:hover { color: var(--c-text-dim); background: var(--c-bg-secondary); }
.etab.on { color: var(--c-primary); border-bottom-color: var(--c-primary); background: var(--c-primary-alpha-08); }
.epane { display: none; }
.epane.on { display: block; }
.epreview {
  padding: 30px 24px;
  min-height: 238px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--c-bg-code);
  border-top: 1px solid rgba(255,255,255,0.02);
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
.ex-filter.active { background: var(--c-primary-alpha-08); color: var(--c-primary); border-color: var(--c-border-primary); }
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

.ex-style-demo { width: 100%; max-width: 400px; }
.ex-style-hint {
  font-size: 0.82rem; color: var(--c-text-muted); margin-bottom: 14px; line-height: 1.5;
}
.ex-style-hint code {
  font-family: 'JetBrains Mono', monospace; font-size: 0.78rem;
  background: var(--c-bg-secondary); padding: 1px 5px; border-radius: 3px;
}
.ex-style-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.ex-style-result { font-size: 0.82rem; color: var(--c-text-muted); min-height: 1.2em; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.001ms !important;
  }
}

/* ── Responsive ── */
@media (max-width: 1180px) {
  .docs-layout {
    grid-template-columns: 224px minmax(0, 1fr);
    max-width: 1080px;
    gap: 42px;
  }
  .docs-rail { display: none; }
  .docs-content { max-width: 100%; }
}
@media (max-width: 900px) {
  .examples-hero-inner {
    grid-template-columns: 1fr;
    align-items: start;
    gap: 28px;
  }
  .examples-facts {
    max-width: 520px;
  }
  .docs-layout {
    display: block;
    padding: 0 24px;
  }
  .docs-sidebar { display: none; }
  .docs-content { padding: 0 0 60px; max-width: 100%; }
  .docs-mobile-toc {
    display: flex;
    gap: 8px;
    position: sticky;
    top: 80px;
    z-index: 40;
    overflow-x: auto;
    padding: 12px 0;
    margin: 28px 0 0;
    background: var(--c-bg);
    border-bottom: 1px solid var(--c-border);
    scrollbar-width: none;
  }
  .docs-mobile-toc::-webkit-scrollbar { display: none; }
  .docs-mobile-link {
    flex: 0 0 auto;
    font-size: 0.82rem;
    color: var(--c-text-dim);
    border: 1px solid var(--c-border);
    border-radius: 999px;
    padding: 6px 11px;
    background: var(--c-bg-card);
  }
  .docs-mobile-link.active {
    color: var(--c-primary);
    border-color: var(--c-border-primary);
    background: var(--c-primary-alpha-08);
  }
  .examples-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .ecode { font-size: 0.75rem; }
  .examples-hero { padding: 42px 0 30px; }
  .examples-hero h1 { font-size: 2.15rem; }
  .examples-facts { grid-template-columns: 1fr; }
  .examples-grid { padding: 28px 0 52px; }
  .ecard-top { padding: 18px 16px 0; }
  .etabs { padding: 12px 16px 0; }
  .epreview { min-height: 220px; padding: 24px 16px; }
  .docs-layout { padding: 0 18px; }
  .docs-content h1 { font-size: 2rem; }
  .docs-content h2 { font-size: 1.28rem; }
  .docs-hero { padding-bottom: 28px; }
  .docs-quickstart {
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
  }
  .docs-quickstart-copy {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
  .docs-quickstart-link {
    text-align: center;
    background: var(--c-primary-alpha-08);
  }
  .docs-meta-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .docs-section { padding-top: 34px; margin-top: 34px; }
  .docs-section-title-row { align-items: flex-start; }
  .docs-section-anchor { opacity: 1; width: 26px; height: 26px; flex-shrink: 0; }
  .docs-content pre, .docs-content .api-sig, .docs-content .code-block-frame { max-width: 100%; overflow-x: auto; }
  .ecode { padding: 14px 16px; }
}
`;

export function injectGlobalStyles() {
  if (document.getElementById('nuclo-global')) return;
  const style = document.createElement('style');
  style.id = 'nuclo-global';
  style.textContent = globalCss;
  document.head.appendChild(style);
}

export const { css, cx } = createCss({
  screens: {
    small:  "(min-width: 341px)",
    medium: "(min-width: 601px)",
    large:  "(min-width: 1025px)",
  },
});

// ── Shared style helpers ──────────────────────────────────────────────────────
export const s = {
  container: css({ maxWidth: "1180px", margin: "0 auto", padding: "0 24px", medium: { padding: "0 28px" } }),

  section: css({ padding: "96px 0" }),

  sectionLabel: css({ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", fontWeight: "500", color: colors.primary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "14px" }),

  sectionTitle: css({ fontSize: "1.9rem", fontWeight: "700", lineHeight: "1.2", marginBottom: "16px", medium: { fontSize: "2.35rem" } }),

  sectionSub: css({ fontSize: "1.05rem", color: colors.textDim, maxWidth: "540px", lineHeight: "1.7" }),

  divider: css({ height: "1px", backgroundColor: colors.border, margin: "0" }),

  // ── Buttons ──────────────────────────────────────────────────────────────
  btn: css({ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "7px", minHeight: "40px", padding: "0 20px", borderRadius: "6px", fontSize: "0.875rem", fontWeight: "700", transition: "all 0.18s ease", whiteSpace: "nowrap" }),

  btnPrimary: css({ backgroundColor: colors.primary, backgroundImage: "linear-gradient(115deg, var(--c-primary-hover) -20%, var(--c-primary) 46%, var(--c-accent-cool) 175%)", color: "#fff", boxShadow: `0 0 0 0 ${colors.primaryGlow}`, hover: { boxShadow: `0 6px 26px ${colors.primaryGlow}`, transform: "translateY(-1px)", filter: "brightness(1.08)" } }),

  btnSecondary: css({ backgroundColor: "transparent", border: `1px solid ${colors.borderLight}`, color: colors.textDim, hover: { color: colors.text, borderColor: colors.textMuted } }),

  // ── Install command ───────────────────────────────────────────────────────
  installCmd: css({ display: "inline-flex", alignItems: "center", gap: "10px", backgroundColor: colors.bgSecondary, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "11px 18px", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.875rem", color: colors.text }),

  // ── Code block ───────────────────────────────────────────────────────────
  codeBlockFrame: css({ backgroundColor: colors.bgCode, border: `1px solid ${colors.border}`, borderRadius: "8px", overflow: "hidden" }),

  codeBlockHeader: css({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.bgSecondary }),

  codeBlockFilename: css({ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", color: colors.textMuted }),

  codeBlockBody: css({ padding: "20px 22px", overflow: "auto", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8125rem", lineHeight: "1.7" }),

  // ── Demo card (macOS chrome) ──────────────────────────────────────────────
  demoCard: css({ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "8px", overflow: "hidden", boxShadow: `0 28px 60px rgba(0,0,20,0.35), 0 0 0 1px ${colors.border}` }),

  demoCardBar: css({ display: "flex", alignItems: "center", gap: "10px", padding: "11px 16px", backgroundColor: colors.bgSecondary, borderBottom: `1px solid ${colors.border}` }),

  demoDots: css({ display: "flex", gap: "6px" }),

  demoTabs: css({ display: "flex", borderBottom: `1px solid ${colors.border}`, padding: "0 16px", backgroundColor: colors.bgCard }),

  demoTab: css({ fontSize: "0.8rem", fontWeight: "500", color: colors.textMuted, padding: "10px 14px", borderBottom: "2px solid transparent", transition: "all 0.18s ease", cursor: "pointer" }),

  demoTabActive: css({ color: colors.primary, borderBottomColor: colors.primary }),

  // ── Feature grid ─────────────────────────────────────────────────────────
  featureGrid: css({ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1px", backgroundColor: colors.border, border: `1px solid ${colors.border}`, borderRadius: "8px", overflow: "hidden" }),

  featureCard: css({ backgroundColor: colors.bgCard, padding: "32px 28px", transition: `background 0.18s ease`, hover: { backgroundColor: colors.bgSecondary } }),

  featureNum: css({ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", fontWeight: "500", color: colors.primary, letterSpacing: "0.05em", marginBottom: "18px" }),

  featureTitle: css({ fontSize: "1.05rem", fontWeight: "600", marginBottom: "10px" }),

  featureDesc: css({ fontSize: "0.9rem", color: colors.textDim, lineHeight: "1.65" }),

  // ── Steps ─────────────────────────────────────────────────────────────────
  stepsGrid: css({ display: "grid", gridTemplateColumns: "1fr", gap: "16px", medium: { gridTemplateColumns: "repeat(3,1fr)", gap: "24px" } }),

  stepNum: css({ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", fontWeight: "500", color: colors.primary, letterSpacing: "0.06em", marginBottom: "12px" }),

  stepTitle: css({ fontSize: "1rem", fontWeight: "600", marginBottom: "8px" }),

  stepDesc: css({ fontSize: "0.875rem", color: colors.textDim, marginBottom: "16px" }),

  // ── Badge ─────────────────────────────────────────────────────────────────
  badge: css({ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", fontWeight: "600", letterSpacing: "0.07em", textTransform: "uppercase", color: colors.primary, padding: "4px 11px", borderRadius: "999px", backgroundColor: colors.primaryAlpha08, border: `1px solid ${colors.borderPrimary}` }),

  // ── Stats row ─────────────────────────────────────────────────────────────
  statsRow: css({ display: "flex", gap: "40px", flexWrap: "wrap", padding: "40px 0", borderTop: `1px solid ${colors.border}`, marginTop: "24px" }),

  statNum: css({ fontSize: "1.8rem", fontWeight: "700", color: colors.text, lineHeight: "1", marginBottom: "4px" }),

  statLabel: css({ fontSize: "0.8rem", color: colors.textMuted }),

  // ── Code inline ───────────────────────────────────────────────────────────
  codeInline: css({ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82em", backgroundColor: colors.bgLight, padding: "1px 5px", borderRadius: "3px", color: colors.primaryHover }),
};
