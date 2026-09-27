// @vitest-environment node
import "nuclo/polyfill";
import "nuclo";
import * as devalue from "devalue";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Middleware, RequestEvent } from "../../types/index";
import { Page, error, redirect } from "../../src/index";
import { __serverFn, getRequestEvent } from "../../src/server/index";
import { createApp, readPage } from "../helpers";

afterEach(() => vi.restoreAllMocks());

describe("API routes", () => {
  it("dispatches by method and passes params", async () => {
    const { request } = createApp({
      "api/users/[id].ts": {
        GET: ({ params }: RequestEvent) => Response.json({ id: params.id }),
        POST: async ({ request, params }: RequestEvent) => Response.json({ id: params.id, body: await request.json() }, { status: 201 }),
      },
    });
    expect(await (await request("/api/users/7")).json()).toEqual({ id: "7" });
    const created = await request("/api/users/7", { method: "POST", body: JSON.stringify({ a: 1 }) });
    expect(created.status).toBe(201);
    expect(await created.json()).toEqual({ id: "7", body: { a: 1 } });
  });

  it("answers HEAD from GET, without a body", async () => {
    const get = vi.fn(() => new Response("hello", { headers: { "x-etag": "1" } }));
    const { request } = createApp({ "api/text.ts": { GET: get } });
    const head = await request("/api/text", { method: "HEAD" });
    expect(head.status).toBe(200);
    expect(head.headers.get("x-etag")).toBe("1");
    expect(await head.text()).toBe("");
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("prefers an explicit HEAD handler", async () => {
    const { request } = createApp({ "api/x.ts": { GET: () => new Response("get"), HEAD: () => new Response(null, { status: 204 }) } });
    expect((await request("/api/x", { method: "HEAD" })).status).toBe(204);
  });

  it("answers 405 listing the methods it has", async () => {
    const { request } = createApp({ "api/x.ts": { GET: () => new Response(), POST: () => new Response() } });
    const response = await request("/api/x", { method: "DELETE" });
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET, POST");
  });

  it("turns thrown redirects and HttpErrors into responses", async () => {
    const { request } = createApp({
      "api/x.ts": { GET: () => redirect("/login", 303), POST: () => error(422, "Invalid email") },
    });
    const get = await request("/api/x");
    expect(get.status).toBe(303);
    expect(get.headers.get("location")).toBe("/login");
    const post = await request("/api/x", { method: "POST" });
    expect(post.status).toBe(422);
    expect(await post.text()).toBe("Invalid email");
  });

  it("answers 500 for unexpected errors and non-Response results", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { request } = createApp({
      "api/throws.ts": { GET: () => { throw new Error("hidden"); } },
      "api/object.ts": { GET: () => ({ not: "a response" }) },
    });
    const thrown = await request("/api/throws");
    expect(thrown.status).toBe(500);
    expect(await thrown.text()).toBe("Internal Error");
    expect((await request("/api/object")).status).toBe(500);
    expect(log).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("must return a Response") }));
  });

  it("coexists with pages, and is never rendered as one", async () => {
    const { request, scan } = createApp({
      "index.ts": Page({ render: () => p("home") }),
      "api/data.ts": { GET: () => Response.json([1]) },
    });
    expect(await (await request("/api/data")).json()).toEqual([1]);
    expect((await readPage(await request("/"))).text).toBe("<div><p>home</p></div>");
    expect(scan.modules.find((m) => m.file.endsWith("api/data.ts"))?.server).toBe(true);
  });
});

describe("middleware", () => {
  it("runs before pages, API routes and server functions, sharing locals", async () => {
    const seen: string[] = [];
    const middleware: Middleware = (event, next) => {
      seen.push(event.url.pathname);
      (event.locals as { user?: string }).user = "ana";
      return next();
    };
    const whoami = __serverFn("mw-whoami", () => (getRequestEvent().locals as { user?: string }).user);
    const { request } = createApp(
      {
        "index.ts": Page({ load: () => (getRequestEvent().locals as { user: string }).user, render: ({ data }) => p(data) }),
        "api/me.ts": { GET: ({ locals }: RequestEvent) => Response.json(locals) },
      },
      { middleware },
    );
    expect((await readPage(await request("/"))).text).toBe("<div><p>ana</p></div>");
    expect(await (await request("/api/me")).json()).toEqual({ user: "ana" });
    const rpc = await request("/_server/mw-whoami", { method: "POST", headers: { "x-nuclo-rpc": "1" }, body: devalue.stringify([]) });
    expect(devalue.parse(await rpc.text())).toBe("ana");
    expect(seen).toEqual(["/", "/api/me", "/_server/mw-whoami"]);
    expect(whoami).toBeTypeOf("function");
  });

  it("can answer without calling next", async () => {
    const page = vi.fn(() => p("secret"));
    const { request } = createApp({ "index.ts": Page({ render: page }) }, { middleware: () => new Response("blocked", { status: 401 }) });
    const response = await request("/");
    expect(response.status).toBe(401);
    expect(await response.text()).toBe("blocked");
    expect(page).not.toHaveBeenCalled();
  });

  it("can wrap and change the response, including error pages", async () => {
    const middleware: Middleware = async (_event, next) => {
      const response = await next();
      const copy = new Response(response.body, response);
      copy.headers.set("x-status-seen", String(response.status));
      return copy;
    };
    const { request } = createApp({ "index.ts": Page({ render: () => p("x") }) }, { middleware });
    expect((await request("/")).headers.get("x-status-seen")).toBe("200");
    expect((await request("/missing")).headers.get("x-status-seen")).toBe("404");
  });

  it("turns thrown redirects and errors into responses", async () => {
    const files = { "index.ts": Page({ render: () => p("x") }) };
    const redirected = await createApp(files, { middleware: () => redirect("/login") }).request("/");
    expect(redirected.status).toBe(302);
    expect(redirected.headers.get("location")).toBe("/login");
    const denied = await createApp(files, { middleware: () => error(403, "Nope") }).request("/");
    expect(denied.status).toBe(403);
    expect(await denied.text()).toBe("Nope");
  });
});

describe("response headers and cookies", () => {
  it("merges setHeaders and cookies from middleware, loads and API routes", async () => {
    const middleware: Middleware = (event, next) => {
      event.setHeaders({ "x-from": "middleware" });
      event.cookies.set("visited", "1");
      return next();
    };
    const { request } = createApp(
      {
        "index.ts": Page({
          load: () => {
            const event = getRequestEvent();
            event.setHeaders({ "cache-control": "max-age=60" });
            event.cookies.set("theme", "dark", { httpOnly: false });
            return null;
          },
          render: () => p("x"),
        }),
        "api/x.ts": { GET: ({ cookies }: RequestEvent) => (cookies.set("api", "yes"), new Response("ok")) },
      },
      { middleware },
    );
    const page = await request("/");
    expect(page.headers.get("x-from")).toBe("middleware");
    expect(page.headers.get("cache-control")).toBe("max-age=60");
    expect(page.headers.getSetCookie()).toEqual(["visited=1; Path=/; HttpOnly; SameSite=Lax", "theme=dark; Path=/; SameSite=Lax"]);
    const api = await request("/api/x");
    expect(api.headers.getSetCookie()).toEqual(["visited=1; Path=/; HttpOnly; SameSite=Lax", "api=yes; Path=/; HttpOnly; SameSite=Lax"]);
  });

  it("works on responses with immutable headers", async () => {
    const { request } = createApp(
      { "api/go.ts": { GET: () => Response.redirect("http://localhost/elsewhere", 307) } },
      { middleware: (event, next) => (event.setHeaders({ "x-a": "1" }), next()) },
    );
    const response = await request("/api/go");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/elsewhere");
    expect(response.headers.get("x-a")).toBe("1");
  });

  it("merges headers set by redirecting loads", async () => {
    const { request } = createApp({
      "index.ts": Page({ load: () => (getRequestEvent().cookies.set("flash", "saved"), redirect("/done")), render: () => p("x") }),
    });
    const response = await request("/");
    expect(response.status).toBe(302);
    expect(response.headers.getSetCookie()).toEqual(["flash=saved; Path=/; HttpOnly; SameSite=Lax"]);
  });
});
