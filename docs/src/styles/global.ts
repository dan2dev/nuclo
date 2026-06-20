import 'nuclo';
import { animations } from './animations.ts';

let registered = false;

export function registerGlobalStyles() {
  if (registered) return;
  registered = true;
  globalStyle("[data-theme=\"dark\"]", { raw: {"--c-primary": "#14b8a6", "--c-primary-hover": "#2dd4bf", "--c-primary-text": "#ffffff", "--c-primary-dark": "#0f766e", "--c-primary-glow": "rgba(20,184,166,0.26)", "--c-primary-alpha-08": "rgba(20,184,166,0.11)", "--c-primary-alpha-13": "rgba(20,184,166,0.17)", "--c-primary-alpha-19": "rgba(20,184,166,0.24)", "--c-bg": "#09100f", "--c-bg-card": "#101817", "--c-bg-secondary": "#162221", "--c-bg-light": "#1e2d2b", "--c-bg-code": "#0b1211", "--c-bg-icon": "#162221", "--c-bg-nav": "#09100f", "--c-bg-footer": "#0d1413", "--c-text": "#eef7f3", "--c-text-dim": "#9db6ad", "--c-text-muted": "#607970", "--c-text-subtitle": "#9db6ad", "--c-border": "rgba(137,187,172,0.11)", "--c-border-light": "rgba(154,211,194,0.19)", "--c-border-glow": "rgba(20,184,166,0.31)", "--c-border-primary": "rgba(20,184,166,0.34)", "--c-accent-secondary": "#f59e0b", "--c-accent-warm": "#fb7185", "--c-accent-cool": "#38bdf8", "--c-shadow": "0 8px 40px rgba(0,0,0,0.5)", "--c-selection-bg": "rgba(20,184,166,0.28)", "--c-tok-keyword": "#7dd3fc", "--c-tok-string": "#86efac", "--c-tok-fn": "#fbbf24", "--c-tok-comment": "#607970", "--c-tok-number": "#fb7185", "--c-tok-type": "#5eead4", "--c-tok-punct": "#8aa39a", "--c-tok-prop": "#c4b5fd", "--c-header-bg": "rgba(9,16,15,0.90)", "--c-mobile-menu-bg": "rgba(9,16,15,0.98)", "--docs-progress": "0%", "--glow-a": "rgba(20,184,166,0.17)", "--glow-b": "rgba(56,189,248,0.10)", "--glow-c": "rgba(245,158,11,0.06)", "--grid-dot": "rgba(148,212,198,0.28)", "--sheen": "rgba(255,255,255,0.05)", "--card-glow": "0 30px 80px -24px rgba(0,0,0,0.6), 0 0 70px -22px rgba(20,184,166,0.4)", "--grad-line": "linear-gradient(90deg, transparent, rgba(45,212,191,0.55), rgba(56,189,248,0.4), transparent)", "--logo-filter": "brightness(0) invert(1)"} });
  globalStyle("[data-theme=\"light\"]", { raw: {"--c-primary": "#0f766e", "--c-primary-hover": "#0d9488", "--c-primary-text": "#ffffff", "--c-primary-dark": "#115e59", "--c-primary-glow": "rgba(15,118,110,0.16)", "--c-primary-alpha-08": "rgba(15,118,110,0.08)", "--c-primary-alpha-13": "rgba(15,118,110,0.13)", "--c-primary-alpha-19": "rgba(15,118,110,0.19)", "--c-bg": "#f5f7f3", "--c-bg-card": "#ffffff", "--c-bg-secondary": "#eaf0ea", "--c-bg-light": "#dfe8e2", "--c-bg-code": "#eef3ef", "--c-bg-icon": "#eaf0ea", "--c-bg-nav": "#f5f7f3", "--c-bg-footer": "#edf3ee", "--c-text": "#101817", "--c-text-dim": "#405750", "--c-text-muted": "#81948c", "--c-text-subtitle": "#405750", "--c-border": "rgba(24,73,61,0.10)", "--c-border-light": "rgba(24,73,61,0.18)", "--c-border-glow": "rgba(15,118,110,0.22)", "--c-border-primary": "rgba(15,118,110,0.25)", "--c-accent-secondary": "#b45309", "--c-accent-warm": "#be123c", "--c-accent-cool": "#0369a1", "--c-shadow": "0 8px 40px rgba(22,60,50,0.10)", "--c-selection-bg": "rgba(15,118,110,0.17)", "--c-tok-keyword": "#0369a1", "--c-tok-string": "#15803d", "--c-tok-fn": "#b45309", "--c-tok-comment": "#8da19a", "--c-tok-number": "#be123c", "--c-tok-type": "#0f766e", "--c-tok-punct": "#71857e", "--c-tok-prop": "#7e22ce", "--c-header-bg": "rgba(245,247,243,0.88)", "--c-mobile-menu-bg": "rgba(245,247,243,0.98)", "--docs-progress": "0%", "--glow-a": "rgba(15,118,110,0.11)", "--glow-b": "rgba(3,105,161,0.07)", "--glow-c": "rgba(180,83,9,0.05)", "--grid-dot": "rgba(15,90,80,0.20)", "--sheen": "rgba(255,255,255,0.65)", "--card-glow": "0 30px 70px -28px rgba(22,60,50,0.35), 0 0 60px -26px rgba(15,118,110,0.30)", "--grad-line": "linear-gradient(90deg, transparent, rgba(15,118,110,0.45), rgba(3,105,161,0.35), transparent)", "--logo-filter": "none"} });
  globalStyle("*", { raw: {"box-sizing": "border-box", "margin": "0", "padding": "0"} });
  globalStyle("*::before", { raw: {"box-sizing": "border-box", "margin": "0", "padding": "0"} });
  globalStyle("*::after", { raw: {"box-sizing": "border-box", "margin": "0", "padding": "0"} });
  globalStyle("html", { raw: {"font-size": "16px", "scroll-behavior": "smooth"} });
  globalStyle("body", { raw: {"font-family": "'Space Grotesk', system-ui, sans-serif", "background": "linear-gradient(180deg, var(--c-bg) 0%, var(--c-bg-footer) 100%)", "color": "var(--c-text)", "line-height": "1.65", "-webkit-font-smoothing": "antialiased", "transition": "background 0.24s ease, color 0.24s ease"} });
  globalStyle("a", { raw: {"color": "inherit", "text-decoration": "none"} });
  globalStyle("button", { raw: {"font-family": "inherit", "cursor": "pointer", "border": "none", "background": "none"} });
  globalStyle("img", { raw: {"display": "block"} });
  globalStyle("svg", { raw: {"display": "block"} });
  globalStyle("[data-theme=\"dark\"] .brand-logo", { raw: {"filter": "brightness(0) invert(1)"} });
  globalStyle("::selection", { raw: {"background": "var(--c-selection-bg)", "color": "var(--c-text)"} });
  globalStyle("html[data-anim] .rv", { raw: {"opacity": "0"} });
  globalStyle("html[data-anim] .rv.rv-in", { raw: {"animation": `${animations.riseIn} 0.7s cubic-bezier(0.22, 1, 0.36, 1) both`} });
  globalStyle("html[data-anim] .rv-in.rv-d1", { raw: {"animation-delay": "0.08s"} });
  globalStyle("html[data-anim] .rv-in.rv-d2", { raw: {"animation-delay": "0.16s"} });
  globalStyle("html[data-anim] .rv-in.rv-d3", { raw: {"animation-delay": "0.24s"} });
  globalStyle("html[data-anim] .rv-in.rv-d4", { raw: {"animation-delay": "0.32s"} });
}
