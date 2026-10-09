/**
 * Route data loaders: `export async function load(ctx)` on a page module.
 *
 * The load-bearing distinction is that the MODULE is cached and the DATA is
 * not. A route's chunk is fetched once; its loader runs on every navigation,
 * so two URLs through the same route can never see each other's data.
 */
import { describe, it, expect, vi } from "vitest";
import "nuclo";
import { renderToString } from "nuclo/ssr";
import {
  createRouter,
  type DataLoader,
  type Layer,
  type PageComponent,
  type PageProps,
  type Route,
  type RouteContext,
} from "../src/index";
import { App, deferred, flush, mount, useRouterEnv } from "./helpers";

const routes = useRouterEnv();

async function start(router: { start(url?: string): Promise<Route> }, url?: string): Promise<Route> {
  const route = await router.start(url);
  routes.push(route);
  return route;
}

interface Post {
  slug: string;
  title: string;
}

/** A typical page module: a typed loader beside a typed page. */
const postModule = {
  load: (async (ctx: RouteContext) => ({
    slug: ctx.params.slug,
    title: `Post ${ctx.params.slug}`,
  })) satisfies DataLoader<Post>,
  default: ((_ctx: RouteContext, { data: post }: PageProps<Post>) =>
    into("main", div({ id: "post" }, post.title))) satisfies PageComponent<Post>,
};

describe("load()", () => {
  it("runs before the page is built and hands it the data", async () => {
    const router = createRouter({ "/blog/:slug": () => postModule }, { preload: false });
    const route = await start(router, "/blog/hello");
    const container = mount();
    render(App, container);

    expect(container.querySelector("#post")!.textContent).toBe("Post hello");
  });

  it("receives the matched context", async () => {
    let seen: RouteContext | undefined;
    const router = createRouter(
      {
        "/blog/:slug": () => ({
          load: (ctx) => {
            seen = ctx;
            return ctx.params.slug.toUpperCase();
          },
          default: ((_c, { data }) => into("main", div({ id: "p" }, data))) as PageComponent<string>,
        }),
      },
      { preload: false },
    );
    const route = await start(router, "/blog/hi?draft=1#top");
    render(App, mount());

    expect(seen).toMatchObject({ path: "/blog/hi", pattern: "/blog/:slug" });
    expect(seen!.params.slug).toBe("hi");
    expect(seen!.search.get("draft")).toBe("1");
    expect(seen!.hash).toBe("#top");
  });

  it("runs again on every navigation, while the module is fetched once", async () => {
    let imports = 0;
    let loads = 0;
    const router = createRouter(
      {
        "/blog/:slug": () => {
          imports++;
          return Promise.resolve({
            load: (ctx: RouteContext) => {
              loads++;
              return ctx.params.slug;
            },
            default: ((_c, { data: slug }) => into("main", div({ id: "post" }, slug))) as PageComponent<string>,
          });
        },
      },
      { preload: false },
    );
    const route = await start(router, "/blog/a");
    const container = mount();
    render(App, container);
    expect(container.querySelector("#post")!.textContent).toBe("a");

    await route.go("/blog/b");
    expect(container.querySelector("#post")!.textContent).toBe("b");
    await route.go("/blog/c");
    expect(container.querySelector("#post")!.textContent).toBe("c");

    // One import, three loads — the data can never be stale for the URL.
    expect(imports).toBe(1);
    expect(loads).toBe(3);
  });

  it("rebuilds the row even when the URL is unchanged, because the data is new", async () => {
    let n = 0;
    const router = createRouter(
      {
        "/": () => ({
          load: () => ++n,
          default: ((_c, { data: value }) => into("main", div({ id: "n" }, String(value)))) as PageComponent<number>,
        }),
      },
      { preload: false },
    );
    const route = await start(router, "/");
    const container = mount();
    render(App, container);
    expect(container.querySelector("#n")!.textContent).toBe("1");

    // The revalidate idiom: navigate to where you already are, without a
    // history entry. The loader runs again and the row is rebuilt.
    await route.go("/", { replace: true });
    expect(container.querySelector("#n")!.textContent).toBe("2");
  });

  it("still reuses the row for a route with no loader", async () => {
    const Plain: PageComponent = () => into("main", div({ id: "plain" }));
    const route = await start(createRouter({ "/": () => Plain }, { preload: false }), "/");
    const container = mount();
    render(App, container);
    const node = container.querySelector("#plain");
    expect(node).not.toBeNull();

    await route.go("/");
    // undefined === undefined, so the fast path still skips the rebuild.
    expect(container.querySelector("#plain")).toBe(node);
  });

  it("accepts a synchronous loader and commits in the same task", async () => {
    const Sync = {
      load: () => "sync",
      default: ((_c, { data }) => into("main", div({ id: "s" }, data))) as PageComponent<string>,
    };
    const router = createRouter({ "/": () => Sync, "/other": () => Sync }, { preload: false });
    const route = await start(router, "/");
    render(App, mount());

    const promise = route.go("/other");
    // No await: a sync module plus a sync loader never flips pending.
    expect(route.path).toBe("/other");
    expect(route.pending).toBe(false);
    await promise;
  });

  it("reports pending while the data is in flight, keeping the old page up", async () => {
    const gate = deferred<string>();
    const Slow = {
      load: () => gate.promise,
      default: ((_c, { data }) => into("main", div({ id: "slow" }, data))) as PageComponent<string>,
    };
    const router = createRouter(
      { "/": () => (() => into("main", div({ id: "home" }))) as PageComponent, "/slow": () => Slow },
      { preload: false },
    );
    const route = await start(router, "/");
    const container = mount();
    render(App, container);

    const navigation = route.go("/slow");
    await flush();
    expect(route.pending).toBe(true);
    expect(container.querySelector("#home")).not.toBeNull();
    expect(container.querySelector("#slow")).toBeNull();

    gate.resolve("arrived");
    await navigation;
    expect(route.pending).toBe(false);
    expect(container.querySelector("#slow")!.textContent).toBe("arrived");
  });
});

describe("load() failures", () => {
  it("surfaces a rejected loader on route.error, keeping the page you were on", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const router = createRouter(
      {
        "/": () => (() => into("main", div({ id: "home" }))) as PageComponent,
        "/bad": () => ({ load: () => Promise.reject(new Error("fetch failed")), default: (() => into("main", div())) as PageComponent }),
      },
      { preload: false },
    );
    const route = await start(router, "/");
    const container = mount();
    render(App, container);

    await expect(route.go("/bad")).resolves.toBeUndefined();
    expect(route.error?.message).toBe("fetch failed");
    expect(route.pending).toBe(false);
    expect(route.path).toBe("/");
    expect(container.querySelector("#home")).not.toBeNull();
  });

  it("surfaces a loader that throws synchronously the same way", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const router = createRouter(
      {
        "/": () => (() => into("main", div({ id: "home" }))) as PageComponent,
        "/bad": () => ({
          load: () => {
            throw new Error("sync fetch failed");
          },
          default: (() => into("main", div())) as PageComponent,
        }),
      },
      { preload: false },
    );
    const route = await start(router, "/");

    await expect(route.go("/bad")).resolves.toBeUndefined();
    expect(route.error?.message).toBe("sync fetch failed");
    expect(route.path).toBe("/");
  });

  it("retries after a failed loader, because data is never cached", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let attempt = 0;
    const router = createRouter(
      {
        "/": () => (() => into("main", div({ id: "home" }))) as PageComponent,
        "/flaky": () => ({
          load: () => {
            if (++attempt === 1) throw new Error("flaky");
            return "ok";
          },
          default: ((_c, { data }) => into("main", div({ id: "flaky" }, data))) as PageComponent<string>,
        }),
      },
      { preload: false },
    );
    const route = await start(router, "/");

    await route.go("/flaky");
    expect(route.error).not.toBeNull();
    await route.go("/flaky");
    expect(route.error).toBeNull();
    expect(route.path).toBe("/flaky");
    expect(attempt).toBe(2);
  });

  it("rejects start() when the initial route's loader fails", async () => {
    const router = createRouter({ "/": () => ({ load: () => Promise.reject(new Error("boot data")), default: (() => into("main", div())) as PageComponent }) });
    await expect(router.start("/")).rejects.toThrow("boot data");
  });

  it("drops a loader whose navigation was overtaken", async () => {
    const slow = deferred<string>();
    const router = createRouter(
      {
        "/": () => (() => into("main", div({ id: "home" }))) as PageComponent,
        "/slow": () => ({ load: () => slow.promise, default: ((_c, { data: d }) => into("main", div({ id: "slow" }, d))) as PageComponent<string> }),
        "/fast": () => (() => into("main", div({ id: "fast" }))) as PageComponent,
      },
      { preload: false },
    );
    const route = await start(router, "/");
    const container = mount();
    render(App, container);

    const first = route.go("/slow");
    await flush();
    await route.go("/fast");
    slow.resolve("too late");
    await first;

    expect(route.path).toBe("/fast");
    expect(container.querySelector("#slow")).toBeNull();
  });
});

describe("load() with layers and SSR", () => {
  it("runs for a pushed layer, which gets its own data", async () => {
    let captured: Layer | undefined;
    const router = createRouter(
      {
        "/invoices/:id": () => (() => into("main", div({ id: "invoice" }))) as PageComponent,
        "/invoices/:id/preview": () => ({
          load: (ctx: RouteContext) => `preview of ${ctx.params.id}`,
          default: ((_c, { layer, data }) => {
            captured = layer;
            return into("main", div({ id: "preview" }, data));
          }) as PageComponent<string>,
        }),
      },
      { preload: false },
    );
    const route = await start(router, "/invoices/42");
    const container = mount();
    render(App, container);

    const pending = route.push("./preview");
    await flush();
    expect(container.querySelector("#preview")!.textContent).toBe("preview of 42");
    expect(container.querySelector("#invoice")).not.toBeNull();

    captured!.close();
    await pending;
  });

  it("exposes the active data on the Route, for a server to serialize", async () => {
    const router = createRouter({ "/blog/:slug": () => postModule, "/plain": () => (() => into("main", div())) as PageComponent });
    const route = await start(router, "/blog/x");

    expect(route.data).toEqual({ slug: "x", title: "Post x" });
    // undefined for a route with no loader.
    await route.go("/plain");
    expect(route.data).toBeUndefined();
  });

  it("reports the top layer's data while one is open", async () => {
    let captured: Layer | undefined;
    const router = createRouter(
      {
        "/": () => ({ load: () => "base", default: ((_c, { data: d }) => into("main", div(d))) as PageComponent<string> }),
        "/over": () => ({
          load: () => "layer",
          default: ((_c, { layer, data: d }) => {
            captured = layer;
            return into("main", div(d));
          }) as PageComponent<string>,
        }),
      },
      { preload: false },
    );
    const route = await start(router, "/");
    render(App, mount());
    expect(route.data).toBe("base");

    const pending = route.push("/over");
    await flush();
    expect(route.data).toBe("layer");

    captured!.close();
    await pending;
    expect(route.data).toBe("base");
  });

  it("puts the data in the server's HTML, so there is nothing to fetch on arrival", async () => {
    const router = createRouter({ "/blog/:slug": () => postModule });
    const route = await start(router, "/blog/ssr");
    const html = route.run(() => renderToString(App));

    expect(html).toContain("Post ssr");
  });

  it("is not run by the idle preloader — only the module is warmed", async () => {
    vi.useFakeTimers();
    let imports = 0;
    let loads = 0;
    const router = createRouter({
      "/": () => (() => into("main", div({ id: "home" }))) as PageComponent,
      "/later": () => {
        imports++;
        return Promise.resolve({
          load: () => {
            loads++;
            return "x";
          },
          default: (() => into("main", div())) as PageComponent,
        });
      },
    });
    routes.push(await router.start("/"));

    await vi.advanceTimersByTimeAsync(2000);
    // The chunk is warmed so navigation is instant, but no data was fetched
    // for a route the user may never open.
    expect(imports).toBe(1);
    expect(loads).toBe(0);
    vi.useRealTimers();
  });
});
