// Themed styles: css() classes are rendered on the server and reused on hydration.
export const { css, globalStyle } = createCss({
  colors: {
    text: "#1a1a1a",
    muted: "#6b6b6b",
    background: "#ffffff",
    surface: "#fff5f2",
    border: "#ffd5c8",
    primary: "#FF3F00",
    danger: "#dc2626",
  },
  fonts: { body: "system-ui, -apple-system, sans-serif" },
});

globalStyle("body", { m: 0, font: "body", color: "text", bg: "background", leading: 1.6 });
globalStyle("a", { color: "primary" });

export const styles = {
  page: css({ maxW: "44rem", mx: "auto", px: "1.5rem", py: "1.5rem" }),
  header: css({ row: true, items: "center", gap: "1.25rem", pb: "1rem", mb: "2rem", borderBottom: "1px solid #ffd5c8" }),
  brand: css({ weight: 700, text: "1.1rem", color: "text", textDecoration: "none" }),
  nav: css({ row: true, gap: "1rem", flex: 1 }),
  navLink: css({ color: "muted", textDecoration: "none", "&[aria-current=page]": { color: "primary", weight: 600 } }),
  pending: css({ color: "muted", text: "0.85rem" }),
  footer: css({ mt: "3rem", pt: "1rem", borderTop: "1px solid #ffd5c8", color: "muted", text: "0.85rem" }),
  muted: css({ color: "muted" }),
  card: css({ bg: "surface", border: "1px solid #ffd5c8", rounded: 8, p: "1rem", my: "1rem" }),
  form: css({ row: true, gap: "0.5rem", my: "1rem" }),
  input: css({ flex: 1, p: "0.5rem 0.75rem", border: "1px solid #ffd5c8", rounded: 6, text: "1rem" }),
  button: css({ border: "none", rounded: 6, px: "1rem", py: "0.5rem", bg: "primary", color: "#ffffff", weight: 600, cursor: "pointer" }),
  ghost: css({ border: "none", bg: "transparent", color: "muted", cursor: "pointer", text: "1.1rem", hover: { color: "danger" } }),
  list: css({ listStyle: "none", p: 0 }),
  todo: css({ row: true, items: "center", gap: "0.5rem", py: "0.35rem", borderBottom: "1px solid #ffd5c8" }),
  done: css({ textDecoration: "line-through", color: "muted" }),
  error: css({ color: "danger" }),
};
