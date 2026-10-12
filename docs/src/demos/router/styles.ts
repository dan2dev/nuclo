import "nuclo";

// The demo's own small theme: it runs in its own document.
globalStyle("[data-theme='light']", { raw: { "--bg": "#ffffff", "--bg2": "#f4f5f7", "--text": "#0b0d12", "--dim": "#5e6673", "--line": "rgba(16,18,24,0.12)", "--primary": "#ff3f00" } });
globalStyle("[data-theme='dark']", { raw: { "--bg": "#121212", "--bg2": "#1c1c1c", "--text": "#fff8f2", "--dim": "#c9c1b8", "--line": "rgba(255,248,242,0.14)", "--primary": "#ff6a3d" } });
globalStyle("*", { raw: { "box-sizing": "border-box", margin: "0", padding: "0" } });
globalStyle("body", { raw: { "font-family": "system-ui, sans-serif", "font-size": "14px", "line-height": "1.55", background: "var(--bg)", color: "var(--text)" } });
globalStyle("a", { raw: { color: "var(--primary)", "text-decoration": "none" } });
globalStyle("a:hover", { raw: { "text-decoration": "underline" } });
globalStyle("h1, h2", { raw: { "font-size": "18px", "line-height": "1.3", margin: "0 0 8px" } });
globalStyle("p", { raw: { margin: "0 0 10px", color: "var(--dim)" } });
globalStyle("input", { raw: { width: "100%", height: "34px", padding: "0 10px", border: "1px solid var(--line)", "border-radius": "8px", background: "var(--bg)", color: "var(--text)", font: "inherit", margin: "0 0 10px" } });
globalStyle("button", { raw: { height: "32px", padding: "0 12px", border: "1px solid var(--line)", "border-radius": "8px", background: "var(--bg2)", color: "var(--text)", font: "inherit", "font-weight": "600", cursor: "pointer", "margin-right": "6px" } });

export const s = {
  app: css({ minHeight: "100vh", display: "flex", flexDirection: "column" }),
  nav: css({ display: "flex", flexWrap: "wrap", gap: "4px 14px", padding: "10px 14px", borderBottom: "1px solid var(--line)", backgroundColor: "var(--bg2)", "& a[aria-current='page']": { color: "var(--text)", fontWeight: "600" } }),
  main: css({ flex: "1", padding: "16px 14px" }),
  status: css({ fontSize: "12px", color: "var(--dim)", padding: "4px 14px", borderTop: "1px solid var(--line)", fontFamily: "ui-monospace, monospace" }),
  error: css({ padding: "10px 12px", border: "1px solid var(--primary)", borderRadius: "8px", marginBottom: "12px" }),
  docs: css({ display: "grid", gridTemplateColumns: "150px 1fr", gap: "16px" }),
  side: css({ display: "flex", flexDirection: "column", gap: "6px", borderRight: "1px solid var(--line)", paddingRight: "12px" }),
  layer: css({ padding: "14px", border: "1px solid var(--primary)", borderRadius: "10px", backgroundColor: "var(--bg2)" }),
  muted: css({ color: "var(--dim)", fontSize: "12px" }),
};
