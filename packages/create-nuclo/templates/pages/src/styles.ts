export const { css, globalStyle } = createCss({
  colors: { text: "#1a1a1a", muted: "#737373", background: "#ffffff", border: "#ffd5c8", primary: "#FF3F00" },
  fonts: { body: "system-ui, -apple-system, sans-serif" },
});

globalStyle("body", { m: 0, font: "body", color: "text", bg: "background", leading: 1.6 });
globalStyle("a", { color: "primary" });

export const styles = {
  page: css({ maxW: "40rem", mx: "auto", px: "1.5rem", py: "1.5rem" }),
  nav: css({ row: true, items: "center", gap: "1rem", pb: "1rem", mb: "2rem", borderBottom: "1px solid #ffd5c8" }),
  link: css({ color: "muted", textDecoration: "none", "&[aria-current=page]": { color: "primary", weight: 600 } }),
  button: css({ border: "none", rounded: 8, py: "0.6rem", px: "1.2rem", text: "1rem", weight: 600, color: "#ffffff", bg: "primary", cursor: "pointer" }),
  muted: css({ color: "muted" }),
};
