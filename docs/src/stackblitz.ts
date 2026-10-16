// "Open in StackBlitz": a small TypeScript project of a docs example, posted to StackBlitz as a form.
// Callers import this module when the button is clicked. openProject() is the shared part; the hero's and the examples page's own files come from callers.

const NUCLO_VERSION = "0.3.29";
const ROUTER_VERSION = "0.1.5";

/** The files every project shares: package.json, tsconfig.json and index.html. */
function scaffold(deps: Record<string, string>, devDeps: Record<string, string>): Record<string, string> {
  return {
    "package.json": JSON.stringify({
      name: "nuclo-example", private: true, type: "module",
      scripts: { dev: "vite", build: "tsc && vite build" },
      dependencies: { nuclo: NUCLO_VERSION, ...deps },
      devDependencies: { typescript: "^5.9.0", vite: "^6.0.0", ...devDeps },
    }, null, 2),
    "tsconfig.json": JSON.stringify({
      compilerOptions: {
        target: "ES2022", module: "ESNext", lib: ["ES2022", "DOM", "DOM.Iterable"], moduleResolution: "bundler",
        allowImportingTsExtensions: true, verbatimModuleSyntax: true, noEmit: true, strict: true, skipLibCheck: true,
        types: ["vite/client", "nuclo/types"],
      },
      include: ["src"],
    }, null, 2),
    "vite.config.ts": `import { defineConfig } from "vite";\n\nexport default defineConfig({ build: { target: "esnext" } }); // top-level await in some examples\n`,
    "index.html": `<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Nuclo example</title></head>
  <body><div id="app"></div><script type="module" src="/src/main.ts"></script></body>
</html>
`,
  };
}

export const withRouter = { "nuclo-router": ROUTER_VERSION };

/** Opens a project (path → source) on StackBlitz, in a new tab, with `open` as the file shown first. */
export function openProject(title: string, files: Record<string, string>, open = "src/main.ts", deps = {}, devDeps = {}) {
  const all = { ...scaffold(deps, devDeps), ...files };
  const form = document.createElement("form");
  form.method = "POST";
  form.target = "_blank";
  form.action = `https://stackblitz.com/run?file=${open}`;
  const fields: Record<string, string> = { "project[title]": `Nuclo: ${title}`, "project[template]": "node" };
  for (const [path, code] of Object.entries(all)) fields[`project[files][${path}]`] = code;
  for (const [k, v] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden"; input.name = k; input.value = v;
    form.append(input);
  }
  document.body.append(form);
  form.submit();
  form.remove();
}

/** A hero example, as the hero runs it: its own src/example.ts, the helpers and styles it shares, and a main.ts that mounts it. */
export async function openHeroExample(name: string, title: string) {
  const [{ HERO_EXAMPLES, HERO_SHARED }, { EXAMPLE_THEME }] = await Promise.all([import("./generated/hero-projects.ts"), import("./generated/example-theme.ts")]); // loaded on the click, not with the page
  const { "src/logo.ts": logo, ...shared } = HERO_SHARED;
  const main = `import { render } from "nuclo";
import "./styles/theme.ts";
import { ex, frame, page } from "./styles/example.ts";
import { ${name} } from "./example.ts";

document.documentElement.setAttribute("data-anim", ""); // the docs set this unless reduced motion is on

const { preview, root = [] } = ${name}.build();

render(() => div(page, div(frame, ex.pane, ...root, ...preview)), document.getElementById("app")!);
`;
  openProject(title, { ...shared, ...(name === "Draw" ? { "src/logo.ts": logo } : {}), "src/styles/theme.ts": EXAMPLE_THEME, "src/example.ts": HERO_EXAMPLES[name], "src/main.ts": main }, "src/example.ts");
}
