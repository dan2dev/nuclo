import { EXAMPLE_THEME } from "../../generated/example-theme.ts";
import { openProject, withRouter } from "../../stackblitz.ts";
import type { Example } from "./registry.ts";

// "Open in StackBlitz" for an example of the examples page: the code shown there, as a project that runs.
//  - a snippet:         src/example.ts is the snippet; src/main.ts renders what it exports
//  - an app:            its files as they are, plus a main.ts that renders the component app.ts exports
//  - a routing example: the router demo app, whole
// Styles stay out of main.ts: src/styles/theme.ts is the docs' global theme (its CSS variables and base
// rules), src/styles/example.ts holds the styles of the page the example sits in.

const exportsOf = (code: string) => [...code.matchAll(/^export (?:default )?(?:function|const|class) (\w+)/gm)].map((m) => m[1]);

// A snippet is bare markup, so its page gives it the docs' look: a card on the docs' dotted canvas, bordered
// controls, and the theme's colors. The snippets keep plain hex colors in their source, so the card maps the few
// they use to the theme (a CSS rule beats an SVG attribute), and the example reads well in both themes.
const snippetStyles = `import { css } from "nuclo";

export const page = css({
  display: "grid", placeItems: "center", minHeight: "100vh", padding: "24px",
  raw: { "background-image": "radial-gradient(var(--c-border) 1px, transparent 1.4px)", "background-size": "20px 20px", "background-position": "center" },
});
export const card = css({
  display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "12px", minWidth: "300px", maxWidth: "min(640px, 100%)",
  padding: "28px", borderRadius: "16px", backgroundColor: "var(--c-bg-card)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow)",
  "& h1, & h2, & h3, & p": { margin: "0" },
  "& h1, & h2, & h3": { fontSize: "1.125rem", lineHeight: "1.3" },
  "& small, & label, & dt": { color: "var(--c-text-dim)" },
  "& label": { display: "block" },
  "& div > span + span": { marginLeft: "0.6em" },
  "& ul, & ol": { listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" },
  "& li": { display: "flex", alignItems: "center", gap: "8px" },
  "& button": { height: "36px", minWidth: "36px", padding: "0 14px", border: "1px solid var(--c-border-light)", borderRadius: "8px", font: "inherit", fontSize: "0.875rem", fontWeight: "600", color: "var(--c-text)", cursor: "pointer", "&:hover": { backgroundColor: "var(--c-bg-secondary)" }, "&:disabled": { opacity: "0.45", cursor: "not-allowed" } },
  "& input:not([type=checkbox]):not([type=radio]):not([type=range]), & select": { height: "36px", padding: "0 12px", border: "1px solid var(--c-border-light)", borderRadius: "8px", font: "inherit", fontSize: "0.875rem", color: "var(--c-text)", backgroundColor: "var(--c-bg)" },
  "& input[type=checkbox], & input[type=radio], & input[type=range]": { accentColor: "var(--c-primary)" },
  "& .invalid, & [aria-invalid=true]": { borderColor: "var(--c-accent-warm)" },
  "& [role=alert]": { fontSize: "0.8125rem", color: "var(--c-accent-warm)" },
  "& svg": { maxWidth: "100%", height: "auto", raw: { fill: "currentColor" } }, // text and shapes without a fill follow the theme
  "& [style*='#fafafa'], & [style*='250, 250, 250']": { raw: { background: "var(--c-bg-secondary) !important" } },
  "& [fill='#fff']": { raw: { fill: "var(--c-bg-card)" } },
  "& [fill='#222'], & [fill='#000']": { raw: { fill: "var(--c-text)" } },
  "& [stroke='#222'], & [stroke='#000']": { raw: { stroke: "var(--c-text)" } },
  "& [fill='#eee'], & [fill='#ddd'], & [fill='#ccc']": { raw: { fill: "var(--c-bg-light)" } },
  "& [stroke='#eee'], & [stroke='#ddd'], & [stroke='#ccc']": { raw: { stroke: "var(--c-border-light)" } },
  "& [fill='#fafafa']": { raw: { fill: "var(--c-bg-secondary)" } },
  "& [fill='#ff3f00']": { raw: { fill: "var(--c-primary)" } },
  "& [stroke='#ff3f00']": { raw: { stroke: "var(--c-primary)" } },
});`;

// The same frame the docs give an app on its own page
const appStyles = `import { css } from "nuclo";

export const page = css({
  position: "fixed", inset: "0", width: "100vw", height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden",
  "& > *": { width: "100%", maxWidth: "none", minHeight: "0", flex: "1" },
  "& > .os-app": { borderRadius: "0" },
});`;

type Project = { files: Record<string, string>; open: string; deps?: object; devDeps?: object };

async function projectOf(ex: Example): Promise<Project | null> {
  const theme = { "src/styles/theme.ts": EXAMPLE_THEME };

  if (ex.install && ex.files) { // routing: every route table, page and the sidebar
    const { ROUTER_PROJECT } = await import("../../generated/example-projects.ts"); // only a routing example needs them
    const files = Object.fromEntries(Object.entries(ROUTER_PROJECT).map(([path, code]) => [`src/${path}`, code]));
    return { files, open: `src/${ex.files[0].name}`, deps: withRouter };
  }

  if (ex.layout === "app" && ex.files) {
    const entry = exportsOf(ex.files.find((f) => f.name === "app.ts")?.code ?? "")[0];
    if (!entry) return null;
    const files = Object.fromEntries(ex.files.map((f) => [`src/${f.name}`, f.code]));
    const main = `import { render } from "nuclo";
import "./styles/theme.ts";
import { page } from "./styles/example.ts";
import { ${entry} } from "./app.ts";

render(() => div(page, ${entry}()), document.getElementById("app")!);
`;
    return { files: { ...theme, "src/styles/example.ts": appStyles, ...files, "src/main.ts": main }, open: "src/app.ts", devDeps: ex.id === "three" ? { "@types/three": "^0.170.0" } : {} };
  }

  if (ex.files) return null;
  // A snippet. A few are fragments without an import or an export: give them both, if they declare a component
  let code = /^import /m.test(ex.code) ? ex.code : `import "nuclo";\n\n${ex.code}`;
  if (!exportsOf(code).length) {
    if (!/^(?:function|const) [A-Z]/m.test(code)) return null;
    code = code.replace(/^(function|const) ([A-Z])/m, "export $1 $2");
  }
  const names = exportsOf(code); // a snippet names its own component(s): import and render them by name
  const main = `import { render } from "nuclo";
import "./styles/theme.ts";
import { card, page } from "./styles/example.ts";
import { ${names.join(", ")} } from "./example.ts";

render(() => div(page, div(card, ${names.map((n) => `${n}()`).join(", ")})), document.getElementById("app")!);
`;
  return { files: { ...theme, "src/styles/example.ts": snippetStyles, "src/example.ts": code, "src/main.ts": main }, open: "src/example.ts" };
}

export async function openExampleInStackBlitz(ex: Example) {
  const p = await projectOf(ex);
  if (p) openProject(ex.title, p.files, p.open, p.deps, p.devDeps);
}
