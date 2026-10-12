// theme.ts: the design system. createCss() names the tokens, variants() turns
// them into components. A token is resolved to its value when a class is
// compiled, so a token holding "#d92d00" would stay that color whatever the
// theme object says later. Here every token holds a CSS variable instead: each
// class is compiled once, and restyling is left to the browser, which re-reads
// the variables whenever variables() below produces new ones.
import "nuclo";

export const FONTS = {
  "System sans": 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  Serif: 'ui-serif, Georgia, Cambria, "Times New Roman", serif',
  Mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  Rounded: 'ui-rounded, "SF Pro Rounded", Nunito, "Varela Round", system-ui, sans-serif',
};

export interface Theme {
  primary: string; onPrimary: string; accent: string; background: string; surface: string;
  text: string; muted: string; border: string; danger: string; success: string;
  radius: number; // px
  density: number; // multiplies every padding, gap and control height
  shadow: number; // % of black in the card shadow
  font: keyof typeof FONTS;
}

export const PRESETS = {
  Nuclo: { primary: "#d92d00", onPrimary: "#ffffff", accent: "#2563eb", background: "#f6f6f7", surface: "#ffffff", text: "#0b0d12", muted: "#5e6673", border: "#e3e5e8", danger: "#c81e1e", success: "#15803d", radius: 10, density: 1, shadow: 12, font: "System sans" },
  Ocean: { primary: "#0b6bcb", onPrimary: "#ffffff", accent: "#0e9f8e", background: "#eef5fa", surface: "#ffffff", text: "#0c2235", muted: "#4f6577", border: "#d2e1ec", danger: "#d03b3b", success: "#0f8a5f", radius: 16, density: 1.1, shadow: 15, font: "Rounded" },
  Forest: { primary: "#2e6b3f", onPrimary: "#f5f1e6", accent: "#b7791f", background: "#f3efe4", surface: "#fbf8f1", text: "#1e2a20", muted: "#5a6657", border: "#ddd6c3", danger: "#b3261e", success: "#2e6b3f", radius: 4, density: 1, shadow: 8, font: "Serif" },
  "Grape dark": { primary: "#a78bfa", onPrimary: "#1a1033", accent: "#f472b6", background: "#110c1d", surface: "#1b142d", text: "#ede9fe", muted: "#a197bd", border: "#31284a", danger: "#f87171", success: "#4ade80", radius: 12, density: 1, shadow: 45, font: "System sans" },
  Mono: { primary: "#111111", onPrimary: "#ffffff", accent: "#555555", background: "#ffffff", surface: "#ffffff", text: "#111111", muted: "#5c5c5c", border: "#bdbdbd", danger: "#b91c1c", success: "#166534", radius: 0, density: 0.9, shadow: 0, font: "Mono" },
} satisfies Record<string, Theme>;
export type Preset = keyof typeof PRESETS;

// The values the editor changes. Plain data: a preset is copied in with Object.assign().
export const theme: Theme = { ...PRESETS.Nuclo };

// The theme as CSS: the only output that changes when a control moves. The
// preview holds it in a <style> element; Export shows the same text under :root.
export const variables = (selector: string) => `${selector} {
  --te-primary: ${theme.primary};
  --te-on-primary: ${theme.onPrimary};
  --te-accent: ${theme.accent};
  --te-background: ${theme.background};
  --te-surface: ${theme.surface};
  --te-text: ${theme.text};
  --te-muted: ${theme.muted};
  --te-border: ${theme.border};
  --te-danger: ${theme.danger};
  --te-success: ${theme.success};
  --te-radius: ${theme.radius}px;
  --te-density: ${theme.density};
  --te-shadow: 0 1px 2px rgb(0 0 0 / ${theme.shadow / 2}%), 0 12px 32px -12px rgb(0 0 0 / ${theme.shadow}%);
  --te-font: ${FONTS[theme.font]};
}`;

export const ui = createCss({
  colors: {
    primary: "var(--te-primary)", onPrimary: "var(--te-on-primary)", accent: "var(--te-accent)",
    background: "var(--te-background)", surface: "var(--te-surface)", text: "var(--te-text)",
    muted: "var(--te-muted)", border: "var(--te-border)", danger: "var(--te-danger)", success: "var(--te-success)",
  },
  radii: { ui: "var(--te-radius)", card: "calc(var(--te-radius) * 1.5)", pill: "999px" },
  shadows: { card: "var(--te-shadow)", ring: "0 0 0 3px color-mix(in srgb, var(--te-primary) 35%, transparent)" },
  fonts: { ui: "var(--te-font)" },
});

/** A length that follows the density slider. */
export const sp = (px: number) => `calc(${px}px * var(--te-density))`;

// A tone's soft background, readable text and border, mixed from the same
// variables: derived shades follow their base color with no variable of their own.
const tint = (tone: "primary" | "accent" | "success" | "danger" | "muted") => ({
  bg: `color-mix(in srgb, var(--te-${tone}) 14%, transparent)`,
  color: `color-mix(in srgb, var(--te-${tone}) 75%, var(--te-text))`,
  borderColor: `color-mix(in srgb, var(--te-${tone}) 35%, transparent)`,
});

// The component library. A selection compiles on its first call and is a
// cache lookup after that. The gallery calls these; the editor never does.
export const kit = {
  button: ui.variants({
    base: { display: "inline-flex", items: "center", justify: "center", border: "1px solid transparent", rounded: "ui", font: "ui", weight: 600, whiteSpace: "nowrap", transition: "filter 0.15s, background-color 0.15s", focusVisible: { outline: "none", shadow: "ring" }, disabled: { opacity: 0.5, cursor: "not-allowed" } },
    variants: {
      intent: {
        primary: { bg: "primary", color: "onPrimary", hover: { filter: "brightness(1.1)" } },
        secondary: { bg: "surface", color: "text", borderColor: "border", hover: { bg: "background" } },
        ghost: { bg: "transparent", color: "primary", hover: { bg: tint("primary").bg } },
        danger: { bg: "danger", color: "#fff", hover: { filter: "brightness(1.1)" } },
      },
      size: {
        sm: { h: sp(28), px: sp(10), text: 12 },
        md: { h: sp(36), px: sp(14), text: 14 },
        lg: { h: sp(44), px: sp(20), text: 16 },
      },
      block: { true: { w: "100%" } },
    },
    defaultVariants: { intent: "secondary", size: "md" },
    // Only the large primary button, a page's main call to action, is lifted.
    compoundVariants: [{ intent: "primary", size: "lg", css: { shadow: "card" } }],
  }),
  badge: ui.variants({
    base: { display: "inline-flex", items: "center", h: sp(22), px: sp(8), rounded: "pill", text: 12, weight: 600, whiteSpace: "nowrap" },
    variants: { tone: { neutral: tint("muted"), primary: tint("primary"), accent: tint("accent"), success: tint("success"), danger: tint("danger") } },
    defaultVariants: { tone: "neutral" },
  }),
  card: ui.variants({
    base: { col: true, gap: sp(12), p: sp(20), bg: "surface", color: "text", border: "1px solid", borderColor: "border", rounded: "card", shadow: "card" },
    variants: { featured: { true: { borderColor: "primary", shadow: "0 0 0 1px var(--te-primary), var(--te-shadow)" } } },
  }),
  input: ui.variants({
    base: { w: "100%", h: sp(36), px: sp(10), bg: "background", color: "text", border: "1px solid", borderColor: "border", rounded: "ui", font: "ui", text: 14, outline: "none", focus: { borderColor: "primary", shadow: "ring" } },
    variants: { invalid: { true: { borderColor: "danger", focus: { borderColor: "danger", shadow: `0 0 0 3px ${tint("danger").borderColor}` } } } },
  }),
  alert: ui.variants({
    base: { p: sp(12), border: "1px solid", rounded: "ui", text: 13, leading: 1.5 },
    variants: { tone: { info: tint("primary"), success: tint("success"), danger: tint("danger") } },
    defaultVariants: { tone: "info" },
  }),
  switch: ui.variants({
    base: {
      position: "relative", flexShrink: 0, w: 40, h: 22, rounded: "pill", bg: "border", transition: "background-color 0.15s", focusVisible: { outline: "none", shadow: "ring" },
      after: { content: '""', position: "absolute", top: 3, left: 3, size: 16, rounded: "pill", bg: "#fff", shadow: "0 1px 2px rgb(0 0 0 / 30%)", transition: "transform 0.15s" },
    },
    variants: { on: { true: { bg: "primary", after: { transform: "translateX(18px)" } } } },
  }),
};
