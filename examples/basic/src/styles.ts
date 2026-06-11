import "nuclo";

// Themed styling instance — tokens autocomplete inside css() calls.
export const { css, cx } = createCss({
  colors: {
    primary: "#6366f1",
    primaryHover: "#4f46e5",
    danger: "#ef4444",
    dangerHover: "#dc2626",
    text: "#1f2937",
    textLight: "#6b7280",
    surface: "#ffffff",
    surfaceMuted: "#f9fafb",
    border: "#e2e8f0",
  },
  fonts: {
    body: "system-ui, -apple-system, sans-serif",
  },
  shadows: {
    card: "0 10px 25px rgba(0, 0, 0, 0.1)",
  },
  radii: {
    sm: "6px",
    md: "8px",
    lg: "16px",
  },
  screens: {
    sm: "(min-width: 640px)",
    md: "(min-width: 768px)",
  },
});

// Shared fragment: composed into both buttons below, compiled once.
const buttonBase = {
  border: "none",
  rounded: "md",
  weight: 600,
  cursor: "pointer",
  transition: "background-color 0.2s",
  color: "surface",
} satisfies Parameters<typeof css>[0];

const todoText = css({
  flex: 1,
  text: 16,
  color: "text",
});

// Global styles
export const globalStyles = {
  body: css({
    bg: "linear-gradient(135deg, #f0f4ff, #e0e7ff)",
    m: 0,
    p: 20,
    minH: "100vh",
    font: "body",
    text: 16,
    color: "text",
    boxSizing: "border-box",
  }),

  container: css({
    bg: "surface",
    p: 30,
    rounded: "lg",
    shadow: "card",
    w: "100%",
    maxW: 500,
    mx: "auto",
  }),

  header: css({
    text: 28,
    weight: 700,
    color: "primary",
    mb: 24,
    align: "center",
  }),

  inputContainer: css({
    row: true,
    gap: 12,
    mb: 24,
  }),

  input: css({
    flex: 1,
    py: 12,
    px: 16,
    text: 16,
    border: "2px solid",
    borderColor: "border",
    rounded: "md",
    outline: "none",
    transition: "border-color 0.2s",
    focus: { borderColor: "primary" },
  }),

  addButton: css({
    ...buttonBase,
    py: 12,
    px: 24,
    text: 16,
    bg: "primary",
    hover: { bg: "primaryHover" },
  }),

  todoList: css({
    col: true,
    gap: 12,
  }),

  todoItem: css({
    row: true,
    items: "center",
    gap: 12,
    p: 16,
    bg: "surfaceMuted",
    rounded: "md",
    transition: "background-color 0.2s",
    hover: { bg: "#f3f4f6" },
  }),

  checkbox: css({
    size: 20,
    cursor: "pointer",
    accentColor: "#6366f1",
  }),

  todoText,

  // Same base + the completed diff; cx drops the overridden color atom.
  todoTextCompleted: cx(
    todoText,
    css({
      color: "textLight",
      textDecoration: "line-through",
    })
  ),

  deleteButton: css({
    ...buttonBase,
    py: 8,
    px: 12,
    text: 14,
    rounded: "sm",
    bg: "danger",
    hover: { bg: "dangerHover" },
  }),
};
