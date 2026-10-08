// One themed styling instance shared by the whole showcase. Same shape as the
// `styling` example — see that one for a tour of the styling system itself.
import "nuclo";

export const ui = createCss({
  colors: {
    primary: "#6366f1",
    primaryHover: "#4f46e5",
    accent: "#14b8a6",
    danger: "#ef4444",
    warning: "#f59e0b",
    success: "#10b981",
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
    glow: "0 0 0 1px rgba(99, 102, 241, 0.45)",
  },
  radii: { sm: "6px", md: "10px", lg: "18px", pill: "999px" },
  screens: {
    sm: "(min-width: 480px)",
    md: "(min-width: 860px)",
    lg: "(min-width: 1180px)",
  },
});

export const { css, cx, variants, keyframes, globalStyle } = ui;
