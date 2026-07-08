import "nuclo";

// Themed styling instance — tokens autocomplete inside css() calls.
export const { css, globalStyle } = createCss({
  colors: {
    text: "#1a1a1a",
    textMuted: "#737373",
    background: "#ffffff",
    surface: "#fff5f2",
    border: "#ffd5c8",
    primary: "#FF3F00",
    primaryHover: "#cc3200",
    success: "#10b981",
    danger: "#dc2626",
    code: "#fff0eb",
  },
  fonts: {
    body: "system-ui, -apple-system, sans-serif",
  },
});

globalStyle("body", {
  m: 0,
  font: "body",
  color: "text",
  bg: "background",
});

export const styles = {
  app: css({
    maxW: "28rem",
    mx: "auto",
    my: "4rem",
    px: "1.5rem",
    align: "center",
	}),

  heading: css({
		fontSize: "2rem",
		flexDirection: "row",
		flexWrap: "nowrap",
		fontWeight: 700,
    lineHeight: 1.2,
    color: "text",
  }),

  logo: css({
    display: "block",
    mx: "auto",
    mb: "1.5rem",
  }),

  button: css({
    border: "none",
    rounded: 8,
    py: "0.6rem",
    px: "1.2rem",
    text: "1rem",
    weight: 600,
    color: "#ffffff",
    bg: "primary",
    cursor: "pointer",
    hover: { bg: "primaryHover" },
  }),

  code: css({
    bg: "code",
    rounded: 4,
    py: "0.1rem",
    px: "0.35rem",
  }),

  links: css({
    row: true,
    center: true,
    gap: "1rem",
    mt: "2rem",
  }),

  link: css({
    color: "textMuted",
    textDecoration: "none",
    hover: { color: "primary" },
  }),
};
