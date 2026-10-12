// One themed styling instance, shared by the server and the browser. Every
// module-level css() call records into nuclo's single atomic stylesheet, which
// the server serializes with getCssText() — see src/server.ts.
import "nuclo";

export const ui = createCss({
  colors: {
    primary: "#6366f1",
    accent: "#14b8a6",
    danger: "#ef4444",
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
  shadows: { card: "0 10px 30px rgba(0,0,0,0.35)" },
  radii: { sm: "6px", md: "10px", lg: "16px", pill: "999px" },
  screens: { md: "(min-width: 820px)" },
});

export const { css, cx, globalStyle } = ui;
