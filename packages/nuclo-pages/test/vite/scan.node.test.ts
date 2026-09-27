// @vitest-environment node
import { describe, expect, it } from "vitest";
import { matchRoute } from "../../src/shared/routes";
import { exportsOf, scanPages, type PagesScan } from "../../src/vite/scan";

const DIR = "/app/src/pages";
const PAGE = "export default function Page() { return div(); }";
const LAYOUT = "export default ({ children }) => div(children);";

const scan = (files: Record<string, string>) => scanPages(DIR, (file) => files[file.slice(DIR.length + 1)], Object.keys(files));
const rel = (s: PagesScan, module: number) => (module < 0 ? null : s.modules[module].file.slice(DIR.length + 1));
const route = (s: PagesScan, id: string) => {
  const found = s.routes.find((r) => r.id === id);
  if (!found) throw new Error(`no route ${id} in ${s.routes.map((r) => r.id).join(", ")}`);
  return found;
};
/** A route's layout chain and error table, by file name. */
const shape = (s: PagesScan, id: string) => {
  const r = route(s, id);
  return {
    layouts: r.layouts.map(([module, params]) => [rel(s, module), params]),
    errors: r.errors.map(([module, keep]) => [rel(s, module), keep]),
  };
};

describe("file → URL", () => {
  it("maps files, index files, params, catch-alls and groups", () => {
    const s = scan({
      "index.ts": PAGE,
      "about.ts": PAGE,
      "blog/index.ts": PAGE,
      "blog/[slug].ts": PAGE,
      "blog/[slug]/comments/[id].tsx": PAGE,
      "docs/[...path].js": PAGE,
      "(marketing)/pricing.jsx": PAGE,
      "(marketing)/(deep)/features.mts": PAGE,
      "legal/terms.mjs": PAGE,
    });
    expect(s.routes.map((r) => r.id).sort()).toEqual([
      "/",
      "/about",
      "/blog",
      "/blog/[slug]",
      "/blog/[slug]/comments/[id]",
      "/docs/[...path]",
      "/features",
      "/legal/terms",
      "/pricing",
    ]);
    expect(route(s, "/blog/[slug]/comments/[id]").path).toEqual(["blog", "[slug]", "comments", "[id]"]);
    expect(route(s, "/pricing").file).toBe(`${DIR}/(marketing)/pricing.jsx`);
  });

  it("ignores private, hidden, test, declaration and non-code files", () => {
    const s = scan({
      "index.ts": PAGE,
      "_helper.ts": "export const x = 1;",
      "_components/button.ts": "export default 1",
      "blog/_parts/card.ts": "export default 1",
      ".hidden.ts": PAGE,
      ".dir/page.ts": PAGE,
      "page.test.ts": "test()",
      "page.spec.tsx": "test()",
      "types.d.ts": "declare const x: 1;",
      "readme.md": "# hi",
      "style.css": "a{}",
    });
    expect(s.routes.map((r) => r.id)).toEqual(["/"]);
    expect(s.modules.map((m) => m.file.slice(DIR.length + 1))).toEqual(["index.ts"]);
  });

  it("orders routes so the most specific one matches", () => {
    const s = scan({
      "index.ts": PAGE,
      "about.ts": PAGE,
      "[...all].ts": PAGE,
      "[page].ts": PAGE,
      "blog/new.ts": PAGE,
      "blog/[slug].ts": PAGE,
      "blog/[...rest].ts": PAGE,
      "[a]/b.ts": PAGE,
      "x/[y].ts": PAGE,
    });
    const id = (pathname: string) => matchRoute(s.routes, pathname)?.route.id;
    expect(id("/")).toBe("/");
    expect(id("/about")).toBe("/about");
    expect(id("/contact")).toBe("/[page]");
    expect(id("/a/b/c")).toBe("/[...all]");
    expect(id("/blog/new")).toBe("/blog/new");
    expect(id("/blog/post")).toBe("/blog/[slug]");
    expect(id("/blog/2024/post")).toBe("/blog/[...rest]");
    expect(id("/x/b")).toBe("/x/[y]"); // static first segment beats a param
    expect(id("/q/b")).toBe("/[a]/b");
    // Deterministic regardless of the order files are listed in.
    const reversed = scanPages(DIR, () => PAGE, ["x/[y].ts", "[a]/b.ts", "blog/[...rest].ts", "blog/[slug].ts", "blog/new.ts", "[page].ts", "[...all].ts", "about.ts", "index.ts"]);
    expect(reversed.routes.map((r) => r.id)).toEqual(s.routes.map((r) => r.id));
  });

  it("handles a missing or empty pages folder", () => {
    for (const s of [scanPages("/definitely/not/here"), scan({})]) {
      expect(s).toEqual({ modules: [], routes: [], root: { layout: -1, error: -1 } });
    }
  });
});

describe("layouts and error boundaries", () => {
  const app = scan({
    "_layout.ts": LAYOUT,
    "_error.ts": PAGE,
    "index.ts": PAGE,
    "blog/_layout.ts": LAYOUT,
    "blog/_error.ts": PAGE,
    "blog/[slug].ts": PAGE,
    "blog/drafts/_layout.ts": LAYOUT,
    "blog/drafts/[id].ts": PAGE,
    "shop/_layout.ts": LAYOUT,
    "shop/index.ts": PAGE,
    "[org]/_layout.ts": LAYOUT,
    "[org]/(settings)/_layout.ts": LAYOUT,
    "[org]/(settings)/billing.ts": PAGE,
    "[org]/[project]/index.ts": PAGE,
  });

  it("builds root-first layout chains with the params each layout consumes", () => {
    expect(shape(app, "/blog/drafts/[id]").layouts).toEqual([
      ["_layout.ts", []],
      ["blog/_layout.ts", []],
      ["blog/drafts/_layout.ts", []],
    ]);
    expect(shape(app, "/[org]/billing").layouts).toEqual([
      ["_layout.ts", []],
      ["[org]/_layout.ts", ["org"]],
      ["[org]/(settings)/_layout.ts", ["org"]],
    ]);
    expect(shape(app, "/[org]/[project]").layouts).toEqual([
      ["_layout.ts", []],
      ["[org]/_layout.ts", ["org"]],
    ]);
    expect(app.root).toEqual({ layout: app.modules.findIndex((m) => m.file.endsWith("/pages/_layout.ts")), error: app.modules.findIndex((m) => m.file.endsWith("/pages/_error.ts")) });
  });

  it("renders page errors with the nearest _error, inside the layouts that wrap it", () => {
    expect(shape(app, "/blog/[slug]").errors).toEqual([
      ["_error.ts", 0], // root layout failed: no layout left
      ["_error.ts", 1], // blog layout failed: a folder above it
      ["blog/_error.ts", 2], // the page failed
    ]);
    expect(shape(app, "/blog/drafts/[id]").errors).toEqual([
      ["_error.ts", 0],
      ["_error.ts", 1],
      ["blog/_error.ts", 2], // drafts layout failed: nearest _error above it is blog's
      ["blog/_error.ts", 2],
    ]);
    expect(shape(app, "/shop").errors).toEqual([
      ["_error.ts", 0],
      ["_error.ts", 1],
      ["_error.ts", 1],
    ]);
  });

  it("uses the built-in layout and error view when there are none", () => {
    const s = scan({ "index.ts": PAGE, "a/b.ts": PAGE });
    expect(shape(s, "/a/b")).toEqual({ layouts: [[null, []]], errors: [[null, 0], [null, 1]] });
    expect(s.root).toEqual({ layout: -1, error: -1 });
  });
});

describe("API routes", () => {
  it("detects method exports without a default export", () => {
    const s = scan({
      "api/users.ts": "export async function GET() {}\nexport const POST = () => {};",
      "api/alias.ts": "const handler = () => {};\nexport { handler as GET, handler as DELETE };",
      "both.ts": "export default () => div();\nexport const GET = () => {};",
    });
    expect(route(s, "/api/users")).toMatchObject({ api: 1, layouts: [], errors: [], prerender: false });
    expect(route(s, "/api/alias").api).toBe(1);
    expect(route(s, "/both").api).toBeUndefined();
    expect(s.modules.filter((m) => m.server).map((m) => m.file.slice(DIR.length + 1)).sort()).toEqual(["api/alias.ts", "api/users.ts"]);
  });

  it("rejects route files that are neither a page nor an API route", () => {
    expect(() => scan({ "broken.ts": "export const helper = 1;\nexport type GET = string;" })).toThrow(
      "src/pages/broken.ts: a page needs a default export",
    );
  });
});

describe("prerender", () => {
  it("reads a literal flag on the page, else the nearest layout's", () => {
    const s = scan({
      "_layout.ts": `${LAYOUT}\nexport const prerender = true;`,
      "index.ts": PAGE,
      "dynamic.ts": `${PAGE}\nexport const prerender = false;`,
      "blog/_layout.ts": `${LAYOUT}\nexport const prerender = false;`,
      "blog/[slug].ts": PAGE,
      "blog/featured.ts": `${PAGE}\nexport const prerender = true;`,
      "computed.ts": `${PAGE}\nconst on = true;\nexport const prerender = on;`,
    });
    const flag = (id: string) => route(s, id).prerender;
    expect(flag("/")).toBe(true);
    expect(flag("/dynamic")).toBe(false);
    expect(flag("/blog/[slug]")).toBe(false);
    expect(flag("/blog/featured")).toBe(true);
    expect(flag("/computed")).toBe(true); // non-literal: inherited from the root layout
  });

  it("defaults to off", () => {
    expect(route(scan({ "index.ts": PAGE }), "/").prerender).toBe(false);
  });
});

describe("validation", () => {
  const fails = (files: Record<string, string>, message: string | RegExp) => expect(() => scan(files)).toThrow(message);

  it("rejects two files for the same URL", () => {
    fails({ "about.ts": PAGE, "about/index.ts": PAGE }, "src/pages/about/index.ts: resolves to the same URL as src/pages/about.ts");
    fails({ "(a)/x.ts": PAGE, "(b)/x.ts": PAGE }, "same URL");
    fails({ "[a].ts": PAGE, "[b].ts": PAGE }, "same URL");
    fails({ "api/x.ts": "export const GET = 1", "api/x/index.ts": PAGE }, "same URL");
  });

  it("rejects catch-alls that aren't last", () => {
    fails({ "[...rest]/x.ts": PAGE }, "the catch-all [...rest] must be the last segment");
    fails({ "docs/[...path]/[id].ts": PAGE }, "the catch-all [...path] must be the last segment");
    // A layout (or index page) inside a catch-all folder is fine.
    expect(route(scan({ "docs/[...path]/_layout.ts": LAYOUT, "docs/[...path]/index.ts": PAGE }), "/docs/[...path]").layouts).toHaveLength(2);
  });

  it("rejects malformed segments and repeated params", () => {
    fails({ "[a-b].ts": PAGE }, 'invalid segment "[a-b]"');
    fails({ "[].ts": PAGE }, 'invalid segment "[]"');
    fails({ "foo[bar].ts": PAGE }, 'invalid segment "foo[bar]"');
    fails({ "[id]/[id].ts": PAGE }, 'duplicate param "id"');
  });

  it("treats files that don't parse as pages (Vite reports the syntax error)", () => {
    expect(route(scan({ "index.ts": "export default (" }), "/").api).toBeUndefined();
  });
});

describe("exportsOf", () => {
  it("finds default, named and re-exported values, skipping types", () => {
    expect(exportsOf("export default 1", "a.ts")).toEqual({ default: true, methods: [], prerender: undefined });
    expect(exportsOf("const a = 1; export { a as default };", "a.ts").default).toBe(true);
    expect(exportsOf('export { GET } from "./x";', "a.ts").methods).toEqual(["GET"]);
    expect(exportsOf("export class POST {}\nexport function PUT() {}", "a.ts").methods).toEqual(["POST", "PUT"]);
    expect(exportsOf("export type GET = 1;\nexport interface POST {}\nexport { type PATCH } from './x';", "a.ts").methods).toEqual([]);
    expect(exportsOf("export const prerender = false;", "a.js").prerender).toBe(false);
  });
});
