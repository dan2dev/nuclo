import 'nuclo';
import { animations } from './animations.ts';

let registered = false;

export function registerGlobalStyles() {
  if (registered) return;
  registered = true;
  globalStyle("[data-theme=\"dark\"]", { raw: {"--c-primary": "#ff4a17", "--c-primary-hover": "#ff6b2b", "--c-primary-text": "#ffffff", "--c-primary-dark": "#cf2500", "--c-primary-glow": "rgba(255,74,23,0.30)", "--c-primary-alpha-08": "rgba(255,74,23,0.10)", "--c-primary-alpha-13": "rgba(255,74,23,0.16)", "--c-primary-alpha-19": "rgba(255,74,23,0.24)", "--c-bg": "#080808", "--c-bg-card": "#121212", "--c-bg-secondary": "#1a1a1a", "--c-bg-light": "#242424", "--c-bg-code": "#101010", "--c-bg-icon": "#1d1d1d", "--c-bg-nav": "rgba(8,8,8,0.82)", "--c-bg-footer": "#0d0d0d", "--c-text": "#fff8f2", "--c-text-dim": "#c9c1b8", "--c-text-muted": "#837a72", "--c-text-subtitle": "#c9c1b8", "--c-border": "rgba(255,248,242,0.10)", "--c-border-light": "rgba(255,248,242,0.18)", "--c-border-glow": "rgba(255,74,23,0.38)", "--c-border-primary": "rgba(255,74,23,0.38)", "--c-accent-secondary": "#ff9a00", "--c-accent-warm": "#ff2300", "--c-accent-cool": "#79c7ff", "--c-shadow": "0 22px 70px rgba(0,0,0,0.46)", "--c-selection-bg": "rgba(255,74,23,0.30)", "--c-tok-keyword": "#79c7ff", "--c-tok-string": "#a7f3d0", "--c-tok-fn": "#ffb545", "--c-tok-comment": "#7b746d", "--c-tok-number": "#ff8a63", "--c-tok-type": "#ffd166", "--c-tok-punct": "#a59d95", "--c-tok-prop": "#f0a7ff", "--c-header-bg": "rgba(8,8,8,0.78)", "--c-mobile-menu-bg": "rgba(10,10,10,0.98)", "--docs-progress": "0%", "--grid-dot": "rgba(255,248,242,0.10)", "--sheen": "rgba(255,255,255,0.12)", "--card-glow": "0 24px 70px -30px rgba(0,0,0,0.75), 0 0 70px -34px rgba(255,74,23,0.72)", "--grad-line": "linear-gradient(90deg, transparent, rgba(255,35,0,0.56), rgba(255,154,0,0.44), transparent)", "--terminal-bg": "#0b0e14", "--terminal-bar": "#f8f6f2", "--terminal-text": "#f4f4f5"} });
  globalStyle("[data-theme=\"light\"]", { raw: {"--c-primary": "#ff3f00", "--c-primary-hover": "#ff5f00", "--c-primary-text": "#ffffff", "--c-primary-dark": "#d92d00", "--c-primary-glow": "rgba(255,63,0,0.18)", "--c-primary-alpha-08": "rgba(255,63,0,0.08)", "--c-primary-alpha-13": "rgba(255,63,0,0.13)", "--c-primary-alpha-19": "rgba(255,63,0,0.19)", "--c-bg": "#ffffff", "--c-bg-card": "#ffffff", "--c-bg-secondary": "#f7f7f8", "--c-bg-light": "#eceef1", "--c-bg-code": "#f4f5f7", "--c-bg-icon": "#fff0e8", "--c-bg-nav": "rgba(255,255,255,0.84)", "--c-bg-footer": "#f6f7f8", "--c-text": "#0b0d12", "--c-text-dim": "#5e6673", "--c-text-muted": "#8b929d", "--c-text-subtitle": "#5e6673", "--c-border": "rgba(16,18,24,0.10)", "--c-border-light": "rgba(16,18,24,0.16)", "--c-border-glow": "rgba(255,63,0,0.24)", "--c-border-primary": "rgba(255,63,0,0.30)", "--c-accent-secondary": "#ff8a00", "--c-accent-warm": "#ff2300", "--c-accent-cool": "#2563eb", "--c-shadow": "0 22px 64px rgba(15,23,42,0.10)", "--c-selection-bg": "rgba(255,63,0,0.18)", "--c-tok-keyword": "#2563eb", "--c-tok-string": "#15803d", "--c-tok-fn": "#c2410c", "--c-tok-comment": "#97908a", "--c-tok-number": "#be123c", "--c-tok-type": "#b45309", "--c-tok-punct": "#6b7280", "--c-tok-prop": "#7e22ce", "--c-header-bg": "rgba(255,255,255,0.82)", "--c-mobile-menu-bg": "rgba(255,255,255,0.98)", "--docs-progress": "0%", "--grid-dot": "rgba(17,24,39,0.12)", "--sheen": "rgba(255,255,255,0.72)", "--card-glow": "0 28px 70px -34px rgba(15,23,42,0.28), 0 0 64px -34px rgba(255,63,0,0.34)", "--grad-line": "linear-gradient(90deg, transparent, rgba(255,35,0,0.42), rgba(255,138,0,0.34), transparent)", "--terminal-bg": "#0d1117", "--terminal-bar": "#ffffff", "--terminal-text": "#f8fafc"} });
  globalStyle("*", { raw: {"box-sizing": "border-box", "margin": "0", "padding": "0"} });
  globalStyle("*::before", { raw: {"box-sizing": "border-box", "margin": "0", "padding": "0"} });
  globalStyle("*::after", { raw: {"box-sizing": "border-box", "margin": "0", "padding": "0"} });
  globalStyle("html", { raw: {"font-size": "16px", "scroll-behavior": "smooth"} });
  globalStyle("body", { raw: {"font-family": "'Space Grotesk', system-ui, sans-serif", "background": "linear-gradient(180deg, var(--c-bg) 0%, var(--c-bg) 62%, var(--c-bg-footer) 100%)", "color": "var(--c-text)", "line-height": "1.65", "-webkit-font-smoothing": "antialiased", "transition": "background 0.24s ease, color 0.24s ease"} });
  globalStyle("a", { raw: {"color": "inherit", "text-decoration": "none"} });
  globalStyle("button", { raw: {"font-family": "inherit", "cursor": "pointer", "border": "none", "background": "none"} });
  globalStyle("img", { raw: {"display": "block"} });
  globalStyle("svg", { raw: {"display": "block"} });
  globalStyle(".nuclo-logo-dark", { raw: {"display": "none"} });
  globalStyle("[data-theme=\"dark\"] .nuclo-logo-light", { raw: {"display": "none"} });
  globalStyle("[data-theme=\"dark\"] .nuclo-logo-dark", { raw: {"display": "block"} });
  globalStyle("::selection", { raw: {"background": "var(--c-selection-bg)", "color": "var(--c-text)"} });
  globalStyle("html[data-anim] .rv", { raw: {"opacity": "0"} });
  globalStyle("html[data-anim] .rv.rv-in", { raw: {"animation": `${animations.riseIn} 0.7s cubic-bezier(0.22, 1, 0.36, 1) both`} });
  globalStyle("html[data-anim] .rv-in.rv-d1", { raw: {"animation-delay": "0.08s"} });
  globalStyle("html[data-anim] .rv-in.rv-d2", { raw: {"animation-delay": "0.16s"} });
  globalStyle("html[data-anim] .rv-in.rv-d3", { raw: {"animation-delay": "0.24s"} });
  globalStyle("html[data-anim] .rv-in.rv-d4", { raw: {"animation-delay": "0.32s"} });
}
