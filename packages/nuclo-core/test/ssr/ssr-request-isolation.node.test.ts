/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
/**
 * renderToString() inside server route handlers.
 *
 * A server renders many requests from one long-lived process. Every request
 * must get exactly its own data, nothing from a previous or concurrent
 * request may bleed into it, and nothing built for a request may stay
 * registered anywhere afterwards. Exercised in the two handler shapes real
 * frameworks use: Fetch API `(Request) => Response` (Hono, Bun.serve,
 * Cloudflare Workers, Deno) and Express-style `(req, res)`.
 */
import "../../src/polyfill";
import "../../src";
import { describe, it, expect } from "vitest";
import { renderToString, renderManyToString, renderToStringWithContainer } from "../../src/ssr/render-to-string";
import { getCssText, css } from "../../src/style";
import { isSerializing } from "../../src/shared/serializing";
import { reactiveTextNodes, reactiveElements } from "../../src/update/registry";
import { getScopeRoots } from "../../src/update/scope";
import { hasActiveLifecycleRegistrations, flushMountQueue } from "../../src/element/lifecycle";

interface User { id: number; name: string; roles: string[]; admin: boolean }

let lifecycleCalls = 0;

// One shared component definition (module scope, like a real app) rendered
// with request-scoped data — the closure captures `user`, never module state.
function Page(user: User) {
  return div(
    { id: `user-${user.id}`, className: () => (user.admin ? "admin" : "member") },
    scope(`user-${user.id}`),
    h1(() => `Hello ${user.name}`),
    ul(list(() => user.roles, (role) => li({ "data-role": role }, role))),
    when(() => user.admin, p("admin tools")).else(p("member area")),
    button({ onMount: () => { lifecycleCalls++; }, onDestroy: () => { lifecycleCalls++; } }, "save",
      on("mount", () => { lifecycleCalls++; }),
      on("click", () => { lifecycleCalls++; }),
    ),
  );
}

const users: User[] = [
  { id: 1, name: "Ada <Lovelace>", roles: ["owner", "billing"], admin: true },
  { id: 2, name: "Grace & Hopper", roles: ["viewer"], admin: false },
  { id: 3, name: "Linus", roles: [], admin: false },
];

// Fetch-API handler, the shape Hono's `c.html(...)`, Bun.serve and Workers use.
function fetchHandler(req: Request): Response {
  const id = Number(new URL(req.url).searchParams.get("id"));
  const user = users.find((u) => u.id === id)!;
  return new Response(`<!doctype html><body>${renderToString(Page(user))}</body>`, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

// Express-style handler with a minimal `res` double.
function expressHandler(req: { query: { id: string } }, res: { send(body: string): void }): void {
  const user = users.find((u) => u.id === Number(req.query.id))!;
  res.send(renderToString(Page(user)));
}

function expectOnly(html: string, user: User): void {
  expect(html).toContain(`id="user-${user.id}"`);
  // Text is escaped, so match the escaped form.
  expect(html).toContain(user.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
  for (const role of user.roles) expect(html).toContain(`data-role="${role}"`);
  expect(html).toContain(user.admin ? "admin tools" : "member area");
  expect(html).toContain(user.admin ? 'class="admin"' : 'class="member"');
  for (const other of users) {
    if (other === user) continue;
    expect(html).not.toContain(`id="user-${other.id}"`);
    expect(html).not.toContain(other.name.split(" ")[0]);
    for (const role of other.roles) if (!user.roles.includes(role)) expect(html).not.toContain(`data-role="${role}"`);
  }
  // Hydratable output: list/when markers and text markers present.
  expect(html).toContain("<!--list-start-");
  expect(html).toContain("<!--when-start-");
  expect(html).toContain("<!-- text-");
}

describe("renderToString in route handlers — request isolation", () => {
  it("Fetch-API handler: sequential requests each see only their own data", async () => {
    for (const user of [...users, ...users.slice().reverse()]) {
      const res = fetchHandler(new Request(`http://localhost/?id=${user.id}`));
      expectOnly(await res.text(), user);
    }
  });

  it("Express-style handler: sequential requests each see only their own data", () => {
    for (const user of users) {
      let body = "";
      expressHandler({ query: { id: String(user.id) } }, { send: (b) => { body = b; } });
      expectOnly(body, user);
    }
  });

  it("interleaved async handlers (concurrent requests) never mix output", async () => {
    // Each handler awaits a "database" with a different latency before
    // rendering, so renders from different requests interleave on the event
    // loop exactly as they would under load.
    const N = 60;
    const results = await Promise.all(
      Array.from({ length: N }, async (_, i) => {
        const user = users[i % users.length];
        await new Promise((r) => setTimeout(r, (N - i) % 5));
        const html = renderToString(Page(user));
        await new Promise((r) => setTimeout(r, i % 3));
        return { user, html };
      }),
    );
    for (const { user, html } of results) expectOnly(html, user);
    // Identical requests produce byte-identical HTML (deterministic markers).
    const byUser = new Map<number, string>();
    for (const { user, html } of results) {
      const seen = byUser.get(user.id);
      if (seen) expect(html).toBe(seen);
      else byUser.set(user.id, html);
    }
  });

  it("the same component tree renders identically on every request (stable hydration markers)", () => {
    const first = renderToString(Page(users[0]));
    for (let i = 0; i < 20; i++) {
      renderToString(Page(users[1 + (i % 2)]));
      expect(renderToString(Page(users[0]))).toBe(first);
    }
  });

  it("leaves nothing behind: registries stay empty and lifecycle hooks never run", () => {
    for (let i = 0; i < 50; i++) renderToString(Page(users[i % users.length]));
    flushMountQueue();
    expect(lifecycleCalls).toBe(0);
    expect(reactiveTextNodes.size).toBe(0);
    expect(reactiveElements.size).toBe(0);
    expect(getScopeRoots(["user-1", "user-2", "user-3"])).toEqual([]);
    expect(hasActiveLifecycleRegistrations()).toBe(false);
    // renderToString never mounts into the shared polyfill document.
    expect(document.body.childNodes.length).toBe(0);
    expect(document.head.childNodes.length).toBe(0);
    expect(isSerializing()).toBe(false);
  });

  it("a component that throws poisons neither the serializing flag nor the next request", () => {
    const Broken = () => div(h1("ok"), span(() => { throw new Error("boom"); }), p((() => { throw new Error("boom"); }) as unknown as string));
    // A throwing NodeModFn (not a text resolver) aborts this render only.
    const Fatal = div(((_p: unknown) => { throw new Error("fatal"); }) as unknown as NodeModFn<"div">);

    expect(renderToString(Fatal)).toBe("");
    expect(isSerializing()).toBe(false);

    // Throwing text resolvers degrade to empty text, the rest still renders.
    const html = renderToString(Broken());
    expect(html).toContain("<h1><!-- text-0 -->ok</h1>");
    expect(isSerializing()).toBe(false);

    // Next request is untouched and fully hydratable.
    expectOnly(renderToString(Page(users[1])), users[1]);
  });

  it("nested renderToString inside a component restores the outer serialization state", () => {
    const Inner = () => span("inner");
    let innerHtml = "";
    const Outer = div(
      () => {
        innerHtml = renderToString(Inner());
        return `embedded:${innerHtml.length}`;
      },
      p("after"),
    );
    const html = renderToString(Outer);
    expect(innerHtml).toBe("<span><!-- text-0 -->inner</span>");
    expect(html).toBe(`<div><!-- text-0 -->embedded:${innerHtml.length}<p><!-- text-1 -->after</p></div>`);
    expect(isSerializing()).toBe(false);
  });

  it("accepts a component function (renderToString(App)) like render()/hydrate() do", () => {
    const App = () => main({ id: "app" }, h1("Title"), p("Body"));
    const expected = renderToString(App());
    expect(expected).toBe('<main id="app"><h1><!-- text-0 -->Title</h1><p><!-- text-1 -->Body</p></main>');
    expect(renderToString(App)).toBe(expected);
    expect(renderManyToString([App, App(), null])).toEqual([expected, expected, ""]);
    expect(renderToStringWithContainer(App, "section", { id: "root" })).toBe(`<section id="root">${expected}</section>`);
  });

  it("raw-text escaping keeps working across many elements and requests (shared /g pattern)", () => {
    const Doc = () => div(
      script(`if (a </script> b) {}`),
      script(`x = "</SCRIPT><script>alert(1)</script>"`),
      style(`.a::after { content: "</style>" }`),
      p("text </script> is escaped"),
    );
    const expected =
      '<div><script>if (a <\\/script> b) {}</script>' +
      '<script>x = "<\\/SCRIPT><script>alert(1)<\\/script>"</script>' +
      '<style>.a::after { content: "<\\/style>" }</style>' +
      '<p><!-- text-3 -->text &lt;/script&gt; is escaped</p></div>';
    for (let i = 0; i < 3; i++) expect(renderToString(Doc())).toBe(expected);
  });

  it("getCssText() is process-wide by design: deterministic classes shared across requests", () => {
    // Styles are a design-token vocabulary, not request data: a class minted
    // while serving request A is (deliberately) part of request B's sheet, and
    // the class name is content-addressed so client hydration matches.
    const a = renderToString(div(css({ color: "rebeccapurple" }), "a"));
    const sheetA = getCssText();
    const b = renderToString(div(css({ color: "rebeccapurple" }), "b"));
    const cls = /class="([^"]+)"/.exec(a)![1];
    expect(/class="([^"]+)"/.exec(b)![1]).toBe(cls);
    expect(sheetA).toContain(`.${cls}{color:rebeccapurple}`);
    expect(getCssText()).toBe(sheetA);
  });
});
