// @vitest-environment node
/**
 * The real server environment: no window, no document beyond nuclo's
 * polyfill. Every browser-only branch of the Route must be inert here —
 * no listeners, no preloading, no onNavigate, no history.
 */
import { describe, it, expect, vi } from "vitest";
import "nuclo/polyfill";
import "nuclo";
import { renderToString } from "nuclo/ssr";
import { createRouter, Redirect, type PageComponent, type Route } from "../src/index";

const Home: PageComponent = () => div({ id: "home" }, "home");
const Post: PageComponent = (ctx) => div({ id: "post" }, ctx.params.slug);

const App = (route: Route) => () => div({ id: "shell" }, main(route.pages()));

const table = {
  "/": () => Home,
  "/blog/:slug": () => Promise.resolve({ default: Post }),
  "*": () => Home,
};

describe("a Route with no window", () => {
  it("has no browser globals to work with", () => {
    expect(typeof window).toBe("undefined");
  });

  it("renders the matched page", async () => {
    const router = createRouter(table);
    const route = await router.start("/blog/node-side");

    expect(route.path).toBe("/blog/node-side");
    expect(route.params.slug).toBe("node-side");
    expect(renderToString(App(route))).toContain("node-side");
  });

  it("defaults to '/' when no URL is given", async () => {
    const router = createRouter(table);
    const route = await router.start();
    expect(route.path).toBe("/");
  });

  it("never calls onNavigate", async () => {
    const onNavigate = vi.fn();
    const router = createRouter(table, { onNavigate });
    const route = await router.start("/");
    renderToString(App(route));
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("makes go() a no-op instead of touching history", async () => {
    const router = createRouter(table);
    const route = await router.start("/");

    await expect(route.go("/blog/x")).resolves.toBeUndefined();
    expect(route.path).toBe("/");
  });

  it("reports the context it was resolved with", async () => {
    const router = createRouter(table);
    const route = await router.start("https://nuclo.dev/blog/x?a=1#h");

    // route.url is the canonical app-relative href; ctx.url keeps the
    // original string the request came in as.
    expect(route.url).toBe("/blog/x?a=1#h");
    expect(route.hash).toBe("#h");
    expect(route.search.get("a")).toBe("1");
  });

  it("match() works with no window, and defaults to '/'", () => {
    const router = createRouter(table);
    // No location to read, so the default is the root.
    expect(router.match()!.path).toBe("/");
    expect(router.match("/blog/x")!.params.slug).toBe("x");
    expect(router.match("https://nuclo.dev/blog/y")!.params.slug).toBe("y");
  });

  it("match() lets a server 404 before importing any chunk", () => {
    let imports = 0;
    const router = createRouter({
      "/": () => {
        imports++;
        return Home;
      },
    });

    expect(router.match("/nope")).toBeNull();
    expect(router.match("/")).not.toBeNull();
    // Deciding the status code cost no module loads at all.
    expect(imports).toBe(0);
  });

  it("hands pages a depth-0 layer whose close() is inert", async () => {
    let seen: { depth: number; close: (r?: unknown) => void } | undefined;
    const router = createRouter({
      "/": () => ((_ctx, { layer }) => {
        seen = layer;
        return div("home");
      }) as PageComponent,
    });
    const route = await router.start("/");
    renderToString(App(route));

    // A server-rendered page is always the base layer, and there is no
    // history to walk back through.
    expect(seen?.depth).toBe(0);
    expect(() => seen?.close("ignored")).not.toThrow();
    expect(route.depth).toBe(1);
  });

  it("makes push() a no-op instead of opening a layer", async () => {
    const router = createRouter(table);
    const route = await router.start("/");
    await expect(route.push("/blog/x")).resolves.toBeUndefined();
    expect(route.depth).toBe(1);
    expect(route.path).toBe("/");
  });

  it("makes stop() harmless", async () => {
    const router = createRouter(table);
    const route = await router.start("/");
    expect(() => route.stop()).not.toThrow();
    expect(() => route.stop()).not.toThrow();
  });

  it("does not preload — no idle callbacks exist on a server", async () => {
    let preloaded = false;
    const router = createRouter({
      "/": () => Home,
      "/other": () => {
        preloaded = true;
        return Home;
      },
    });
    await router.start("/");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(preloaded).toBe(false);
  });

  it("resolves each request independently", async () => {
    const router = createRouter(table);
    const [a, b] = await Promise.all([router.start("/blog/a"), router.start("/blog/b")]);

    expect(renderToString(App(a))).toContain(">a<");
    expect(renderToString(App(b))).toContain(">b<");
  });
});

describe("a Redirect on the server", () => {
  const to = (href: string) => () => ({
    default: Home,
    load: () => {
      throw new Redirect(href);
    },
  });
  const redirectOf = (router: { start(url: string): Promise<Route> }, url: string) =>
    router.start(url).then(
      () => null,
      (error: unknown) => error,
    );

  it("rejects start() with it, for the app to answer with a 3xx", async () => {
    const router = createRouter({ "/admin": to("/login"), "/login": () => Home });
    const error = await redirectOf(router, "https://site.example/admin");

    expect(error).toBeInstanceOf(Redirect);
    expect((error as Redirect).href).toBe("/login");
  });

  it("resolves a relative href against the request, base included", async () => {
    const router = createRouter({ "/a/:id": to("./edit") }, { base: "/app" });
    const error = (await redirectOf(router, "/app/a/7")) as Redirect;

    expect(error.href).toBe("/app/a/7/edit");
  });

  it("passes another origin through untouched", async () => {
    const router = createRouter({ "/sso": to("https://auth.example.com/login") });
    const error = (await redirectOf(router, "/sso")) as Redirect;

    expect(error.href).toBe("https://auth.example.com/login");
  });

  it("does not follow it, even to a route the table has", async () => {
    const onNavigate = vi.fn();
    const router = createRouter({ "/admin": to("/login"), "/login": () => Home }, { onNavigate });
    await redirectOf(router, "/admin");

    expect(onNavigate).not.toHaveBeenCalled();
  });
});

describe("request URLs on the server", () => {
  it("match from any origin — there is no document origin to compare", () => {
    const router = createRouter(table);
    expect(router.match("https://site.example/blog/x")?.params.slug).toBe("x");
  });
});
