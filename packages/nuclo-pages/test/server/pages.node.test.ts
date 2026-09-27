// @vitest-environment node
import "nuclo/polyfill";
import "nuclo";
import { css } from "nuclo";
import { afterEach, describe, expect, it, vi } from "vitest";
import { error, notFound, redirect, route } from "../../src/index";
import { createHandler } from "../../src/server/index";
import type { RouteModule } from "../../src/shared/types";
import { ASSETS, createApp, deferred, readPage, TEMPLATE } from "../helpers";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const layout = (id?: string): RouteModule => ({ default: ({ children }) => div(id ? { id } : {}, children) });

afterEach(() => vi.restoreAllMocks());

describe("pages", () => {
  it("renders a page inside the built-in root layout", async () => {
    const { request } = createApp({ "index.ts": { default: () => h1("Home") } });
    const response = await request("/");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
    const { html, text, payload } = await readPage(response);
    expect(text).toBe("<div><h1>Home</h1></div>");
    expect(payload).toEqual({ r: 0, p: {}, d: [undefined, undefined] });
    expect(html).toMatch(/^<!doctype html><html><head><title>Default<\/title>/);
    expect(html).toContain('<script type="module" src="/entry.js"></script></body></html>');
  });

  it("nests layouts, giving each load its own data and only the params it consumes", async () => {
    const events: Record<string, unknown> = {};
    const { request } = createApp({
      "_layout.ts": {
        default: ({ children, data }) => div({ id: "root" }, span(data.user), children),
        load: (event) => ((events.root = event), { user: "ana" }),
      },
      "orgs/[org]/_layout.ts": {
        default: ({ children, data, params }) => section(`${params.org}:${data.plan}`, children),
        load: (event) => ((events.org = event), { plan: "pro" }),
      },
      "orgs/[org]/projects/[id].ts": {
        default: ({ data, params, url }) => article(`${params.org}/${params.id} ${data.name} ${url.search}`),
        load: (event: { params: object; url: URL }) => ((events.page = { params: event.params, search: event.url.search }), { name: "P" }),
      },
    });
    const { text, payload } = await readPage(await request("/orgs/acme/projects/7?x=1"));
    expect(text).toBe('<div id="root"><span>ana</span><section>acme:pro<article>acme/7 P ?x=1</article></section></div>');
    expect(events).toEqual({
      root: { params: {} },
      org: { params: { org: "acme" } },
      page: { params: { org: "acme", id: "7" }, search: "?x=1" },
    });
    expect(payload).toEqual({ r: 0, p: { org: "acme", id: "7" }, d: [{ user: "ana" }, { plan: "pro" }, { name: "P" }] });
  });

  it("runs the loads of every level in parallel", async () => {
    const pageStarted = deferred();
    const { request } = createApp({
      // Would deadlock if the page's load only started after the layout's finished.
      "_layout.ts": { ...layout(), load: async () => (await pageStarted.promise, "layout") },
      "index.ts": { default: ({ data }) => p(data), load: () => (pageStarted.resolve(), "page") },
    });
    expect((await readPage(await request("/"))).text).toBe("<div><p>page</p></div>");
  });

  it("escapes view text", async () => {
    const { request } = createApp({ "index.ts": { default: () => p("<script>alert(1)</script>") } });
    const { app } = await readPage(await request("/"));
    expect(app).not.toContain("<script>");
    expect(app).toContain("&lt;script&gt;");
  });

  it("gives views the request's route state, even for concurrent requests", async () => {
    const { request } = createApp({
      "items/[id].ts": {
        default: ({ data }) => p(() => `${route.params.id} ${route.url.pathname} ${data}`),
        // `route` inside a load after an await still sees this request.
        load: async ({ params }: { params: { id: string } }) => {
          await sleep(params.id === "slow" ? 25 : 1);
          return route.params.id;
        },
      },
    });
    const [slow, fast] = await Promise.all([request("/items/slow"), request("/items/fast")].map(async (r) => readPage(await r)));
    expect(slow.text).toBe("<div><p>slow /items/slow slow</p></div>");
    expect(fast.text).toBe("<div><p>fast /items/fast fast</p></div>");
  });

  it("inlines the css() rules the page uses", async () => {
    const styled = css({ color: "#123456" });
    const { request } = createApp({ "index.ts": { default: () => p(styled, "styled") } });
    const { html } = await readPage(await request("/"));
    expect(html).toMatch(/<style id="nuclo-styles">[^<]*#123456/);
    expect(html).toContain(`class="${styled.className}"`);
  });

  it("answers HEAD with headers only", async () => {
    const { request } = createApp({ "index.ts": { default: () => p("x") } });
    const response = await request("/", { method: "HEAD" });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(await response.text()).toBe("");
  });

  it("rejects other methods: 405 on pages, 404 on unknown URLs", async () => {
    const { request } = createApp({ "index.ts": { default: () => p("x") } });
    const post = await request("/", { method: "POST", body: "x" });
    expect(post.status).toBe(405);
    expect(post.headers.get("allow")).toBe("GET, HEAD");
    expect((await request("/nope", { method: "DELETE" })).status).toBe(404);
  });
});

describe("head", () => {
  it("merges layout and page heads, replacing the template title", async () => {
    const { request } = createApp({
      "_layout.ts": { ...layout(), head: () => ({ title: "Site", meta: { description: "site", author: "me" } }) },
      "blog/[slug].ts": {
        default: () => p("post"),
        load: ({ params }: { params: { slug: string } }) => ({ title: params.slug }),
        head: ({ data, params, url }: { data: { title: string }; params: { slug: string }; url: URL }) => ({
          title: `Post ${data.title}`,
          meta: { description: url.pathname },
          link: [{ rel: "canonical", href: `https://x.dev/blog/${params.slug}` }],
        }),
      },
    });
    const { html } = await readPage(await request("/blog/hi"));
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html).toContain("<title>Post hi</title>");
    expect(html).toContain('<meta name="description" content="/blog/hi" data-nuclo-head>');
    expect(html).toContain('<meta name="author" content="me" data-nuclo-head>');
    expect(html).toContain('<link rel="canonical" href="https://x.dev/blog/hi" data-nuclo-head>');
  });

  it("keeps the template title when no head sets one", async () => {
    const { request } = createApp({ "index.ts": { default: () => p("x"), head: () => ({ meta: { a: "b" } }) } });
    const { html } = await readPage(await request("/"));
    expect(html).toContain("<title>Default</title>");
    expect(html.match(/<title>/g)).toHaveLength(1);
  });
});

describe("payload", () => {
  it("can't be broken out of by data", async () => {
    const evil = "</script><script>alert(1)</script><!--";
    const { request } = createApp({ "index.ts": { default: () => p("x"), load: () => ({ evil }) } });
    const { html, payload } = await readPage(await request("/"));
    const script = /id="nuclo-data">([\s\S]*?)<\/script>/.exec(html)![1];
    expect(script).not.toContain("<");
    expect(payload!.d).toEqual([undefined, { evil }]);
  });

  it("round-trips rich data: Date, Map, Set, BigInt, undefined, repeated references", async () => {
    const shared = { n: 1 };
    const data = { date: new Date(0), map: new Map([["k", 1]]), set: new Set(["a"]), big: 10n, none: undefined, a: shared, b: shared, re: /x/g };
    const { request } = createApp({ "index.ts": { default: () => p("x"), load: () => data } });
    const { payload } = await readPage(await request("/"));
    const got = (payload!.d as [unknown, typeof data])[1];
    expect(got).toEqual(data);
    expect(got.date).toBeInstanceOf(Date);
    expect(got.a).toBe(got.b);
  });

  it("fails with a 500 when load data can't be serialized", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const files = { "index.ts": { default: () => p("x"), load: () => ({ fn: () => 1 }) } };
    const prod = await createApp(files).request("/");
    expect(prod.status).toBe(500);
    expect(await prod.text()).toBe("Internal Error");
    const dev = await createApp(files, { dev: true }).request("/");
    expect(dev.status).toBe(500);
    expect(await dev.text()).toMatch(/Cannot stringify a function/);
  });
});

describe("errors and redirects", () => {
  const withErrors = (extra: Record<string, RouteModule>) =>
    createApp({
      "_layout.ts": { default: ({ children, data }) => div({ id: "root" }, data ?? "", children), load: () => "root-data" },
      "_error.ts": { default: ({ status, message }) => h1(`root ${status} ${message}`), head: ({ status }) => ({ title: `Error ${status}` }) },
      "index.ts": { default: () => p("home") },
      ...extra,
    });

  it("renders unmatched URLs as a 404 inside the root layout", async () => {
    const { request, scan } = withErrors({});
    const response = await request("/missing/page");
    expect(response.status).toBe(404);
    const { html, text, payload } = await readPage(response);
    expect(text).toBe('<div id="root">root-data<h1>root 404 Not Found</h1></div>');
    expect(html).toContain("<title>Error 404</title>");
    expect(payload).toEqual({ r: -1, p: {}, d: ["root-data"], e: { s: 404, m: "Not Found", b: [scan.root.error, 1] } });
  });

  it("falls back to the built-in error view and layout", async () => {
    const { request } = createApp({ "index.ts": { default: () => p("home") } });
    const response = await request("/missing");
    expect(response.status).toBe(404);
    expect((await readPage(response)).text).toBe("<div><div><h1>404</h1><p>Not Found</p></div></div>");
  });

  it("renders notFound() with the nearest _error, inside its layouts", async () => {
    const { request, scan } = withErrors({
      "blog/_layout.ts": { default: ({ children }) => section({ class: "blog" }, children) },
      "blog/_error.ts": { default: ({ status, message }) => h2(`blog ${status} ${message}`) },
      "blog/[slug].ts": { default: () => p("post"), load: () => notFound("No such post") },
    });
    const response = await request("/blog/nope");
    expect(response.status).toBe(404);
    const { text, payload } = await readPage(response);
    expect(text).toBe('<div id="root">root-data<section class="blog"><h2>blog 404 No such post</h2></section></div>');
    const blogError = scan.modules.findIndex((m) => m.file.endsWith("blog/_error.ts"));
    expect(payload).toMatchObject({ d: ["root-data", undefined], e: { s: 404, m: "No such post", b: [blogError, 2] } });
  });

  it("shows HttpError messages, even in production", async () => {
    const { request } = withErrors({ "admin.ts": { default: () => p("x"), load: () => error(403, "Admins only") } });
    const response = await request("/admin");
    expect(response.status).toBe(403);
    expect((await readPage(response)).text).toContain("root 403 Admins only");
  });

  it("hides unexpected error messages in production and logs them", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const files = { "broken.ts": { default: () => p("x"), load: () => { throw new Error("secret detail"); } } };
    const prod = await withErrors(files).request("/broken");
    expect(prod.status).toBe(500);
    const prodPage = await readPage(prod);
    expect(prodPage.text).toContain("root 500 Internal Error");
    expect(prodPage.html).not.toContain("secret detail");
    expect(log).toHaveBeenCalledWith(expect.objectContaining({ message: "secret detail" }));

    const dev = createApp({ "_error.ts": { default: ({ message }) => p(message) }, ...files }, { dev: true });
    expect((await readPage(await dev.request("/broken"))).text).toContain("secret detail");
  });

  it("renders a failing layout with the error view of a folder above it", async () => {
    const { request } = withErrors({
      "admin/_layout.ts": { ...layout("admin"), load: () => error(401, "Log in first") },
      "admin/_error.ts": { default: () => h2("admin error (must not be used)") },
      "admin/index.ts": { default: () => p("dashboard") },
    });
    const response = await request("/admin");
    expect(response.status).toBe(401);
    const { text, payload } = await readPage(response);
    expect(text).toBe('<div id="root">root-data<h1>root 401 Log in first</h1></div>');
    expect(payload!.d).toEqual(["root-data"]);
  });

  it("renders a failing root layout's error without any layout", async () => {
    const { request } = createApp({
      "_layout.ts": { ...layout("root"), load: () => error(503, "Maintenance") },
      "_error.ts": { default: ({ status, message }) => h1(`${status} ${message}`) },
      "index.ts": { default: () => p("home") },
    });
    const response = await request("/");
    expect(response.status).toBe(503);
    const { text, payload } = await readPage(response);
    expect(text).toBe("<h1>503 Maintenance</h1>");
    expect(payload).toMatchObject({ d: [], e: { s: 503, b: [expect.any(Number), 0] } });
    // Also for unmatched URLs.
    expect((await readPage(await request("/nope"))).text).toBe("<h1>503 Maintenance</h1>");
  });

  it("prefers the shallowest error", async () => {
    const { request } = withErrors({
      "shop/_layout.ts": { ...layout(), load: () => error(402, "Pay first") },
      "shop/index.ts": { default: () => p("x"), load: () => error(500, "later") },
    });
    const response = await request("/shop");
    expect(response.status).toBe(402);
  });

  it("redirects from a load, 302 by default", async () => {
    const { request } = withErrors({
      "old.ts": { default: () => p("x"), load: () => redirect("/new") },
      "moved.ts": { default: () => p("x"), load: () => redirect("https://example.com/", 301) },
    });
    const response = await request("/old");
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/new");
    expect(await response.text()).toBe("");
    const moved = await request("/moved");
    expect(moved.status).toBe(301);
    expect(moved.headers.get("location")).toBe("https://example.com/");
  });

  it("lets a redirect win over errors at shallower levels", async () => {
    const { request } = withErrors({
      "login/_layout.ts": { ...layout(), load: () => error(500, "x") },
      "login/index.ts": { default: () => p("x"), load: () => redirect("/elsewhere") },
    });
    expect((await request("/login")).headers.get("location")).toBe("/elsewhere");
  });

  it("answers 500 when a view throws while rendering", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const files = { "index.ts": { default: () => { throw new Error("view bug"); } } };
    const prod = await createApp(files).request("/");
    expect(prod.status).toBe(500);
    expect(await prod.text()).toBe("Internal Error");
    expect(await (await createApp(files, { dev: true }).request("/")).text()).toContain("view bug");
  });
});

describe("assets and template", () => {
  it("links the entry and the assets of every rendered module, once", async () => {
    // Modules: 0 _layout.ts, then pages in order: 1 about.ts, 2 index.ts.
    const assets = {
      entry: { js: "/assets/entry.js", css: ["/assets/app.css"], preload: ["/assets/nuclo.js"] },
      modules: [
        { js: "/assets/layout.js", css: ["/assets/layout.css"], preload: ["/assets/nuclo.js"] },
        { js: "/assets/about.js", css: ["/assets/about.css"], preload: [] },
        { js: "/assets/index.js", css: [], preload: ["/assets/shared.js"] },
      ],
    };
    const { request, scan } = createApp({ "_layout.ts": layout(), "about.ts": { default: () => p("a") }, "index.ts": { default: () => p("i") } }, { assets });
    expect(scan.modules.map((m) => m.file.split("/").pop())).toEqual(["_layout.ts", "about.ts", "index.ts"]);
    const { html } = await readPage(await request("/"));
    const head = html.slice(0, html.indexOf("</head>"));
    expect(head.match(/<link rel="stylesheet" href="[^"]+">/g)).toEqual([
      '<link rel="stylesheet" href="/assets/app.css">',
      '<link rel="stylesheet" href="/assets/layout.css">',
    ]);
    expect(head.match(/<link rel="modulepreload" href="[^"]+">/g)).toEqual([
      '<link rel="modulepreload" href="/assets/nuclo.js">',
      '<link rel="modulepreload" href="/assets/layout.js">',
      '<link rel="modulepreload" href="/assets/index.js">',
      '<link rel="modulepreload" href="/assets/shared.js">',
    ]);
    expect(html).toContain('<script type="module" src="/assets/entry.js"></script>');
    expect(html).not.toContain("about");
  });

  it("requires both placeholders in the template", () => {
    const options = { modules: [], routes: [], root: { layout: -1, error: -1 }, serverFns: {}, assets: ASSETS };
    expect(() => createHandler({ ...options, template: "<html><head></head><body><!--nuclo:body--></body></html>" })).toThrow("<!--nuclo:head-->");
    expect(() => createHandler({ ...options, template: "<html><head><!--nuclo:head--></head><body></body></html>" })).toThrow("<!--nuclo:body-->");
    expect(() => createHandler({ ...options, template: TEMPLATE })).not.toThrow();
  });
});
