import "nuclo";

export const { css, cx, globalStyle } = createCss({
  colors: {
    bg: "#f6f7f9",
    ink: "#1b1f24",
    muted: "#57606a",
    faint: "#8b949e",
    border: "#c4c9d0",
    danger: "#d1242f",
    success: "#1a7f37",
  },
  fonts: { body: "system-ui, sans-serif" },
  radii: { md: "6px" },
});

globalStyle("*", { boxSizing: "border-box" });
globalStyle("body", { m: 0, font: "body", bg: "bg", color: "ink", lineHeight: 1.5 });

const note = css({ display: "block", minHeight: 20, text: 13 });

export const s = {
  page: css({ maxW: 420, mx: "auto", my: 48, px: 16 }),
  hint: css({ color: "muted", text: 14 }),
  field: css({ my: 16 }),
  label: css({ col: true, gap: 4, weight: 600 }),
  input: css({ font: "inherit", text: "inherit", py: 8, px: 10, border: "1px solid", borderColor: "border", rounded: "md" }),
  invalid: css({ borderColor: "danger" }),
  error: cx(note, css({ color: "danger" })),
  runs: cx(note, css({ color: "faint", raw: { "font-variant-numeric": "tabular-nums" } })),
  success: css({ color: "success", weight: 600 }),
  button: css({ font: "inherit", text: "inherit", py: 8, px: 14, border: "none", rounded: "md", bg: "ink", color: "#fff", cursor: "pointer" }),
};
