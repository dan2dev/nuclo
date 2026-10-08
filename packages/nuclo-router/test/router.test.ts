import { describe, it, expect, vi } from "vitest";
import "nuclo";
import { createRouter, type PageComponent, type Route, type RouteContext } from "../src/index";
import { deferred, flush, mount, stubAssign, useRouterEnv } from "./helpers";

const routes = useRouterEnv();

/** Tracks every started Route so afterEach can detach its listeners. */
async function start(router: { start(url?: string): Promise<Route> }, url?: string): Promise<Route> {
  const route = await router.start(url);
  routes.push(route);
  return route;
}

const Home: PageComponent = () => div({ id: "home" }, "home");
const About: PageComponent = () => div({ id: "about" }, "about");

describe("start()", () => {
  it("resolves the matching page and exposes the match", async () => {
    const router = createRouter({ "/": () => Home, "/about": () => About });
    const route = await start(router, "/about");

    expect(route.path).toBe("/about");
    expect(route.pattern).toBe("/about");
    expect(route.params).toEqual({});
    expect(route.pending).toBe(false);
    expect(route.error).toBeNull();
    // While live, url/hash track the location — url as an app-relative href,
    // the same shape whichever history mode is in use.
    expect(route.url).toBe(window.location.pathname + window.location.search + window.location.hash);
    expect(route.hash).toBe(window.location.hash);
  });

  it("defaults to the current location in the browser", async () => {
    window.history.replaceState(null, "", "/about?q=1#frag");
    const router = createRouter({ "/": () => Home, "/about": () => About });
    const route = await start(router);

    expect(route.path).toBe("/about");
    expect(route.search.get("q")).toBe("1");
    expect(route.hash).toBe("#frag");
  });

  it("awaits an async loader before returning", async () => {
    const gate = deferred<{ default: PageComponent }>();
    const router = createRouter({ "/": () => gate.promise });
    let settled = false;
    const pending = start(router, "/").then((route) => {
      settled = true;
      return route;
    });

    await flush();
    expect(settled).toBe(false);

    gate.resolve({ default: Home });
    const route = await pending;
    expect(settled).toBe(true);
    expect(route.path).toBe("/");
  });

  it("hands the page its route context", async () => {
    let seen: RouteContext | undefined;
    const Post: PageComponent = (ctx) => {
      seen = ctx;
      return div("post");
    };
    const router = createRouter({ "/blog/:slug": () => Post });
    const route = await start(router, "/blog/hello?page=2#top");
    render(route.view(), mount());

    expect(seen).toMatchObject({
      path: "/blog/hello",
      pattern: "/blog/:slug",
      hash: "#top",
      url: "/blog/hello?page=2#top",
    });
    expect(seen!.params.slug).toBe("hello");
    expect(seen!.search.get("page")).toBe("2");
  });

  it("throws when nothing matches and there is no catch-all", async () => {
    const router = createRouter({ "/": () => Home });
    await expect(router.start("/nope")).rejects.toThrow(/no route matches/);
  });

  it("falls back to a '*' route instead of throwing", async () => {
    const NotFound: PageComponent = () => div("404");
    const router = createRouter({ "/": () => Home, "*": () => NotFound });
    const route = await start(router, "/nope");
    expect(route.pattern).toBe("*");
  });

  it("accepts a module namespace, a named pick, and a bare component", async () => {
    const router = createRouter({
      "/a": () => ({ default: Home }),
      "/b": () => Promise.resolve({ default: About }),
      "/c": () => Home,
    });
    expect((await start(router, "/a")).path).toBe("/a");
    expect((await start(router, "/b")).path).toBe("/b");
    expect((await start(router, "/c")).path).toBe("/c");
  });

  it("explains a module with no default export", async () => {
    const router = createRouter({
      "/": () => Promise.resolve({ notDefault: Home } as unknown as { default: PageComponent }),
    });
    await expect(router.start("/")).rejects.toThrow(/no default export/);
  });

  it("rejects when the loader itself throws", async () => {
    const router = createRouter({
      "/": () => {
        throw new Error("boom");
      },
    });
    await expect(router.start("/")).rejects.toThrow("boom");
  });
});

describe("base", () => {
  it("strips the base before matching", async () => {
    const router = createRouter(
      { "/": () => Home, "/intro": () => About },
      { base: "/docs" },
    );
    expect((await start(router, "/docs")).path).toBe("/");
    expect((await start(router, "/docs/intro")).path).toBe("/intro");
  });

  it("refuses URLs outside the base", async () => {
    const router = createRouter({ "*": () => Home }, { base: "/docs" });
    await expect(router.start("/elsewhere")).rejects.toThrow(/no route matches/);
  });

  it("href() prefixes the base", async () => {
    const router = createRouter({ "*": () => Home }, { base: "/docs" });
    const route = await start(router, "/docs");
    expect(route.href("/")).toBe("/docs");
    expect(route.href("/intro")).toBe("/docs/intro");
    expect(route.href("intro/")).toBe("/docs/intro");
  });

  it("href() is an identity-ish normalizer without a base", async () => {
    const router = createRouter({ "*": () => Home });
    const route = await start(router, "/");
    expect(route.href("/")).toBe("/");
    expect(route.href("/a/b/")).toBe("/a/b");
  });
});

describe("view()", () => {
  it("warns once when it is called more than once", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const router = createRouter({ "/": () => Home }, { preload: false });
    const route = await start(router, "/");
    const container = mount();

    // Two outlets render the stack twice — duplicate ids, duplicate form
    // controls, the component invoked twice — and hydration claims both
    // copies, so a warning is the only signal there is.
    render(div(div({ id: "a" }, route.view()), div({ id: "b" }, route.view())), container);

    expect(container.querySelectorAll("#home").length).toBe(2);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/called more than once/);

    // Still once after a third call: one warning per Route, not per call.
    route.view();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("does not warn for the normal single outlet", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const route = await start(createRouter({ "/": () => Home }, { preload: false }), "/");
    render(route.view(), mount());
    expect(warn).not.toHaveBeenCalled();
  });

  it("renders the active page", async () => {
    const router = createRouter({ "/": () => Home, "/about": () => About });
    const route = await start(router, "/");
    const container = mount();
    render(route.view(), container);

    expect(container.querySelector("#home")).not.toBeNull();
  });

  it("swaps the page on navigation", async () => {
    const router = createRouter({ "/": () => Home, "/about": () => About });
    const route = await start(router, "/");
    const container = mount();
    render(route.view(), container);

    await route.go("/about");
    expect(container.querySelector("#home")).toBeNull();
    expect(container.querySelector("#about")).not.toBeNull();
  });

  it("keeps the existing DOM when the same URL is re-navigated", async () => {
    const router = createRouter({ "/": () => Home, "/about": () => About });
    const route = await start(router, "/about");
    const container = mount();
    render(route.view(), container);
    const before = container.querySelector("#about");

    await route.go("/about");
    expect(container.querySelector("#about")).toBe(before);
  });

  it("rebuilds when only the params change", async () => {
    const Post: PageComponent = (ctx) => div({ id: `post-${ctx.params.slug}` }, ctx.params.slug);
    const router = createRouter({ "/blog/:slug": () => Post });
    const route = await start(router, "/blog/a");
    const container = mount();
    render(route.view(), container);
    expect(container.querySelector("#post-a")).not.toBeNull();

    await route.go("/blog/b");
    expect(container.querySelector("#post-a")).toBeNull();
    expect(container.querySelector("#post-b")).not.toBeNull();
  });

  it("rebuilds when only the query changes", async () => {
    let builds = 0;
    const Page: PageComponent = () => {
      builds++;
      return div("page");
    };
    const router = createRouter({ "/": () => Page });
    const route = await start(router, "/?a=1");
    render(route.view(), mount());
    expect(builds).toBe(1);

    await route.go("/?a=2");
    expect(builds).toBe(2);
  });
});

describe("go()", () => {
  it("pushes history and updates the route", async () => {
    const router = createRouter({ "/": () => Home, "/about": () => About });
    const route = await start(router, "/");
    const depth = window.history.length;

    await route.go("/about?x=1#y");
    expect(window.location.pathname).toBe("/about");
    expect(route.path).toBe("/about");
    expect(route.search.get("x")).toBe("1");
    expect(route.hash).toBe("#y");
    expect(window.history.length).toBeGreaterThan(depth - 1);
  });

  it("replaces history when asked", async () => {
    const router = createRouter({ "/": () => Home, "/about": () => About });
    const route = await start(router, "/");
    const depth = window.history.length;

    await route.go("/about", { replace: true });
    expect(window.location.pathname).toBe("/about");
    expect(window.history.length).toBe(depth);
  });

  it("commits a cached route synchronously — pending never flips", async () => {
    const router = createRouter({ "/": () => Home, "/about": () => About });
    const route = await start(router, "/");

    const promise = route.go("/about");
    // Resolved before a single microtask: no spinner frame for a loaded route.
    expect(route.path).toBe("/about");
    expect(route.pending).toBe(false);
    await promise;
  });

  it("reports pending while an uncached module loads", async () => {
    const gate = deferred<{ default: PageComponent }>();
    const router = createRouter({ "/": () => Home, "/about": () => gate.promise });
    const route = await start(router, "/");

    const promise = route.go("/about");
    expect(route.pending).toBe(true);
    expect(route.path).toBe("/");

    gate.resolve({ default: About });
    await promise;
    expect(route.pending).toBe(false);
    expect(route.path).toBe("/about");
  });

  it("surfaces a failed load as route.error without rejecting", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const gate = deferred<{ default: PageComponent }>();
    const router = createRouter({ "/": () => Home, "/about": () => gate.promise });
    const route = await start(router, "/");

    const promise = route.go("/about");
    gate.reject(new Error("chunk failed"));
    await expect(promise).resolves.toBeUndefined();

    expect(route.error?.message).toBe("chunk failed");
    expect(route.pending).toBe(false);
    // The old page is still on screen and the URL reflects the attempt.
    expect(route.path).toBe("/");
    expect(window.location.pathname).toBe("/about");
    expect(error).toHaveBeenCalled();
  });

  it("wraps a non-Error rejection", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const gate = deferred<{ default: PageComponent }>();
    const router = createRouter({ "/": () => Home, "/about": () => gate.promise });
    const route = await start(router, "/");

    const promise = route.go("/about");
    gate.reject("nope");
    await promise;
    expect(route.error?.message).toBe("nope");
  });

  it("retries a route whose chunk failed once", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let attempt = 0;
    const router = createRouter({
      "/": () => Home,
      "/about": () => {
        attempt++;
        return attempt === 1 ? Promise.reject(new Error("flaky")) : Promise.resolve({ default: About });
      },
    });
    const route = await start(router, "/");

    await route.go("/about");
    expect(route.error).not.toBeNull();

    await route.go("/about");
    expect(route.error).toBeNull();
    expect(route.path).toBe("/about");
    expect(attempt).toBe(2);
  });

  it("clears a previous error on the next successful navigation", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const router = createRouter({
      "/": () => Home,
      "/bad": () => Promise.reject(new Error("x")),
      "/about": () => About,
    });
    const route = await start(router, "/");

    await route.go("/bad");
    expect(route.error).not.toBeNull();
    await route.go("/about");
    expect(route.error).toBeNull();
  });

  it("surfaces a loader that throws synchronously, without rejecting", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const router = createRouter({
      "/": () => Home,
      "/boom": () => {
        throw new Error("sync boom");
      },
    });
    const route = await start(router, "/");

    // A synchronous throw must take the same path as a rejected promise:
    // go() resolves, the failure lands on route.error, and nothing escapes
    // into the delegated click handler as an unhandled error.
    await expect(route.go("/boom")).resolves.toBeUndefined();
    expect(route.error?.message).toBe("sync boom");
    expect(route.pending).toBe(false);
    expect(route.path).toBe("/");
    expect(logged).toHaveBeenCalled();
  });

  it("can retry a route whose loader threw synchronously", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let attempt = 0;
    const router = createRouter({
      "/": () => Home,
      "/boom": () => {
        attempt++;
        if (attempt === 1) throw new Error("sync boom");
        return About;
      },
    });
    const route = await start(router, "/");

    await route.go("/boom");
    expect(route.error).not.toBeNull();

    await route.go("/boom");
    expect(route.error).toBeNull();
    expect(route.path).toBe("/boom");
  });

  it("leaves the SPA for a path no route owns", async () => {
    const router = createRouter({ "/": () => Home });
    const route = await start(router, "/");
    const location = stubAssign();
    try {
      await route.go("/not-ours");
    } finally {
      location.restore();
    }

    expect(location.calls).toEqual(["/not-ours"]);
    expect(route.path).toBe("/");
  });

  it("hands an unparseable target to the browser", async () => {
    const router = createRouter({ "/": () => Home });
    const route = await start(router, "/");
    const location = stubAssign();
    try {
      // Reaches parse()'s own URL guard, not just the click handler's.
      await route.go("http://[");
    } finally {
      location.restore();
    }

    expect(location.calls).toEqual(["http://["]);
    expect(route.path).toBe("/");
  });

  it("drops a slow navigation that a later one overtook", async () => {
    const slow = deferred<{ default: PageComponent }>();
    const Third: PageComponent = () => div({ id: "third" }, "third");
    const router = createRouter({
      "/": () => Home,
      "/slow": () => slow.promise,
      "/third": () => Third,
    });
    const route = await start(router, "/");
    const container = mount();
    render(route.view(), container);

    const first = route.go("/slow");
    const second = route.go("/third");
    await second;
    expect(route.path).toBe("/third");

    slow.resolve({ default: About });
    await first;
    // The overtaken navigation must not replace the page that won.
    expect(route.path).toBe("/third");
    expect(container.querySelector("#third")).not.toBeNull();
    expect(route.pending).toBe(false);
  });
});

describe("scrolling", () => {
  it("preserves the current scroll position on a pushed navigation", async () => {
    const router = createRouter({ "/": () => Home, "/about": () => About });
    const route = await start(router, "/");
    (window.scrollTo as unknown as ReturnType<typeof vi.fn>).mockClear();

    await route.go("/about");
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("scrolls a hash target into view when the new page has one", async () => {
    const Anchored: PageComponent = () => div(div({ id: "section" }, "s"));
    const router = createRouter({ "/": () => Home, "/about": () => Anchored });
    const route = await start(router, "/");
    render(route.view(), mount());

    await route.go("/about#section");
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(window.scrollTo).not.toHaveBeenCalledWith(0, 0);
  });

  it("preserves the current scroll position when the hash target is missing", async () => {
    const router = createRouter({ "/": () => Home, "/about": () => About });
    const route = await start(router, "/");
    (window.scrollTo as unknown as ReturnType<typeof vi.fn>).mockClear();

    await route.go("/about#nowhere");
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});

describe("onNavigate", () => {
  it("fires for the initial route and every navigation", async () => {
    const seen: string[] = [];
    const router = createRouter(
      { "/": () => Home, "/about": () => About },
      { onNavigate: (ctx) => seen.push(ctx.path) },
    );
    const route = await start(router, "/");
    await route.go("/about");

    expect(seen).toEqual(["/", "/about"]);
  });

  it("does not fire for a failed navigation", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const seen: string[] = [];
    const router = createRouter(
      { "/": () => Home, "/bad": () => Promise.reject(new Error("x")) },
      { onNavigate: (ctx) => seen.push(ctx.path) },
    );
    const route = await start(router, "/");
    await route.go("/bad");

    expect(seen).toEqual(["/"]);
  });
});
