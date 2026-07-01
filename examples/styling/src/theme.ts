// A single themed styling instance shared across every section of the showcase.
//
// createCss() takes a typed theme; its keys become autocompleted, checked
// values inside css()/variants() (colors, fonts, shadows, radii) and typed
// responsive variant keys (screens). Import "nuclo" once to register the
// global builders (div, span, …) and the styling globals (css, cx, …).
import "nuclo";

export const ui = createCss({
  colors: {
    // Brand + state
    primary: "#6366f1",
    primaryHover: "#4f46e5",
    accent: "#14b8a6",
    danger: "#ef4444",
    dangerHover: "#dc2626",
    warning: "#f59e0b",
    success: "#10b981",
    // Surfaces + text (dark theme)
    bg: "#0b1020",
    surface: "#141a2e",
    surfaceMuted: "#1c2440",
    border: "#2a3355",
    text: "#e5e9f5",
    textDim: "#aab2cf",
    textMuted: "#7b84a8",
  },
  fonts: {
    body: "system-ui, -apple-system, Segoe UI, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
  },
  shadows: {
    card: "0 10px 30px rgba(0, 0, 0, 0.35)",
    glow: "0 0 0 1px rgba(99, 102, 241, 0.4), 0 8px 30px rgba(99, 102, 241, 0.25)",
  },
  radii: {
    sm: "6px",
    md: "10px",
    lg: "18px",
    pill: "999px",
  },
  screens: {
    // Declaration order = cascade order.
    sm: "(min-width: 480px)",
    md: "(min-width: 768px)",
    lg: "(min-width: 1024px)",
    dark: "(prefers-color-scheme: dark)",
  },
});

// Pull the helpers off the instance so sections can `import { css } from "../theme"`.
export const { css, cx, variants, keyframes, globalStyle } = ui;
