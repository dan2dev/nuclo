/**
 * Routing examples. nuclo-router is a separate package, and only one router can
 * be started per document, so the demo app (src/demos/router) runs in an iframe
 * on its own route. The sources shown are that app's real files, generated
 * into router-demo-sources.ts. Pattern matching runs on an unstarted router,
 * since match() attaches nothing.
 */
import { createRouter, type RouteTable } from "nuclo-router";
import { css, colors } from "../../styles.ts";
import { es } from "./styles.ts";
import { DemoFrame } from "./demo-frame.ts";
import { ROUTER_DEMO_SOURCES } from "../../generated/router-demo-sources.ts";
import type { CodeFile } from "../../components/CodeBlock.ts";

export interface RouterExample {
  id: string;
  docs: string;
  install: string;
  title: string;
  desc: string;
  code: string;
  files?: CodeFile[];
  preview: () => NodeModLike<"div">;
}

const mono = "ui-monospace, monospace";

const rs = {
  wrap: css("pages-examples-router-demos-wrap", { display: "flex", flexDirection: "column", gap: "14px", width: "100%", maxWidth: "420px" }),
  kv: css("pages-examples-router-demos-kv", { display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 14px", fontSize: "0.8125rem", fontFamily: mono, "& span:nth-child(odd)": { color: colors.textMuted } }),
  hint: css("pages-examples-router-demos-hint", { fontSize: "0.8125rem", color: colors.textDim, lineHeight: "1.55" }),
  row: css("pages-examples-router-demos-row", { display: "flex", flexWrap: "wrap", gap: "8px" }),
  chip: css("pages-examples-router-demos-chip", { border: `1px solid ${colors.border}`, borderRadius: "8px", fontFamily: mono }),
};

/** The demo app's files, in the order given: one tab each, and all of them as `code` for anything that wants a single string. */
function sources(...names: string[]) {
  const files = names.map((name) => ({ name, code: ROUTER_DEMO_SOURCES[name] }));
  return { files, code: files.map((f) => `// ─── ${f.name} ${"─".repeat(Math.max(0, 60 - f.name.length))}\n${f.code}`).join("\n\n") };
}

// ── Pattern matching: type a path ────────────────────────────────────────

const page = () => ({ default: () => div() }); // a stand-in page module: nothing here is rendered

function MatchPreview() {
  const section: RouteTable = { "/": page, "./preview": page, "./preview/raw": page };
  const demo = createRouter({
    "/": page,
    "/blog/new": page,
    "/blog/:slug": page,
    "/invoices/:id": section,
    "/customers/:id": section,
    "/files/*rest": page,
    "*": page,
  });
  let path = "/invoices/42/preview";
  const result = () => demo.match(path);

  return div(
    rs.wrap,
    input(es.input, { value: () => path, placeholder: "/blog/hello", "aria-label": "Path", style: { fontFamily: mono } }, { onInput: (e) => { path = (e.target as HTMLInputElement).value; update(); } }),
    div(
      rs.kv,
      span("pattern"), span(() => result()?.pattern ?? "no match"),
      span("params"), span(() => (result() ? JSON.stringify(result()!.params) : "—")),
      span("path"), span(() => result()?.path ?? "—"),
    ),
    div(
      rs.row,
      ...["/blog/new", "/blog/hello", "/customers/7/preview/raw", "/files/a/b.txt", "/x/y"].map((p) =>
        button(es.filter, rs.chip, p, { onClick: () => { path = p; update(); } }),
      ),
    ),
    p(rs.hint, "Static patterns win over dynamic ones, so /blog/new is not a slug. The section table is mounted under two parents with no path written twice."),
  );
}

const MATCH_CODE = `// npm install nuclo nuclo-router
import { createRouter, type RouteTable } from 'nuclo-router'

// A reusable section: "./" patterns are relative to the parent.
const recordSection: RouteTable = {
  '/':             () => import('./Record.ts'),  // the parent path itself
  './preview':     () => import('./Preview.ts'),
  './preview/raw': () => import('./Raw.ts'),
}

const router = createRouter({
  '/':              () => import('./pages/Home.ts'),
  '/blog/new':      () => import('./pages/NewPost.ts'),
  '/blog/:slug':    () => import('./pages/Post.ts'),
  '/invoices/:id':  recordSection,
  '/customers/:id': recordSection,
  '/files/*rest':   () => import('./pages/File.ts'),
  '*':              () => import('./pages/NotFound.ts'),
})

// match() resolves a URL and loads nothing: no import, no history.
router.match('/blog/new')
// { pattern: '/blog/new', params: {} }           static wins
router.match('/blog/hello')
// { pattern: '/blog/:slug', params: { slug: 'hello' } }
router.match('/customers/7/preview/raw')
// { pattern: '/customers/:id/preview/raw', params: { id: '7' } }
router.match('/files/a/b.txt')
// { pattern: '/files/*rest', params: { rest: 'a/b.txt' } }

// On a server, a 404 before importing a single chunk:
if (!router.match(request.url)) {
  return new Response(null, { status: 404 })
}`;

const install = "nuclo-router";

export const ROUTER_EXAMPLES: RouterExample[] = [
  {
    id: "router-app", docs: "router-overview", install, title: "A Routed App",
    desc: "A real app with its own router, running in the frame: a route table, one outlet(), plain links, a pending state and a 404. Click around, then use Back.",
    ...sources("routes.ts", "app.ts", "main.ts", "pages/Home.ts", "pages/NotFound.ts"),
    preview: () => DemoFrame("/", "A routed app"),
  },
  {
    id: "router-nested", docs: "router-patterns", install, title: "Nested Routes",
    desc: "Docs is a layout with child routes. A topic renders in its outlet() and ./topic links resolve against the layout's route. Type in the notes, then switch topics: the layout is never rebuilt.",
    ...sources("pages/Docs.ts", "pages/Topic.ts", "routes.ts"),
    preview: () => DemoFrame("/docs/intro", "Nested routes"),
  },
  {
    id: "router-loader", docs: "router-loaders", install, title: "Route Loaders",
    desc: "The post page exports a load() that runs before the page is built. Watch router.pending while it waits, and the error state with Retry when it throws on the broken post.",
    ...sources("pages/Post.ts", "app.ts"),
    preview: () => DemoFrame("/blog/hello-world", "Route loaders"),
  },
  {
    id: "router-layers", docs: "router-layers", install, title: "Layers",
    desc: "The order form pushes the customer page as a layer and awaits its result. The form is not re-rendered, so its notes survive. Save resolves the push, Cancel or Back dismisses it.",
    ...sources("pages/Order.ts", "pages/NewCustomer.ts"),
    preview: () => DemoFrame("/orders/new", "Layers"),
  },
  {
    id: "router-match", docs: "router-patterns", install, title: "Pattern Matching",
    desc: "Static, :param and *rest patterns, and a section table mounted under two parents. Type a path and watch match(), which resolves without loading anything.",
    code: MATCH_CODE,
    preview: MatchPreview,
  },
];
