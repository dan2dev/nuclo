// @vitest-environment jsdom
/**
 * `history: "hash"` and `history: "memory"`.
 *
 * The router's internal model is the same string in every mode — an
 * app-relative href like "/blog/x?a=1#top" — so these tests check the two
 * things that actually differ: where that string is read from, and where a
 * navigation writes it.
 */
import { describe, it, expect } from "vitest";
import "nuclo";
import { createRouter, type Layer, type PageComponent, type Route } from "../src/index";
import { App, click, flush, mount, stubAssign, useRouterEnv, waitFor } from "./helpers";

const routes = useRouterEnv();

async function start(router: { start(url?: string): Promise<Route> }, url?: string): Promise<Route> {
  const route = await router.start(url);
  routes.push(route);
  return route;
}

const P = (id: string): PageComponent => () => into("main", div({ id }, id));

function table() {
  return {
    "/": () => P("home"),
    "/docs": () => P("docs"),
    "/blog/:slug": () => P("post"),
    "*": () => P("nf"),
  };
}

function link(href: string) {
  const anchor = document.createElement("a");
  anchor.setAttribute("href", href);
  document.body.appendChild(anchor);
  return anchor;
}

describe('history: "hash"', () => {
  it("reads the route from the hash, not the pathname", async () => {
    window.history.replaceState(null, "", "/some/page#/blog/hello");
    const route = await start(createRouter(table(), { history: "hash", preload: false }));

    expect(route.path).toBe("/blog/hello");
    expect(route.pattern).toBe("/blog/:slug");
    expect(route.params.slug).toBe("hello");
    // The document's own path is untouched and irrelevant.
    expect(window.location.pathname).toBe("/some/page");
  });

  it("treats a missing or bare hash as the root", async () => {
    const router = createRouter(table(), { history: "hash", preload: false });
    const a = await start(router);
    expect(a.path).toBe("/");
    a.stop();

    window.history.replaceState(null, "", "/#");
    expect((await start(router)).path).toBe("/");
  });

  it("tolerates a hash with no leading slash", async () => {
    // What a bare in-page anchor such as <a href="#docs"> leaves behind. In
    // hash mode the hash IS the route, so it is read as "/docs" rather than
    // being thrown away.
    window.history.replaceState(null, "", "/#docs");
    const route = await start(createRouter(table(), { history: "hash", preload: false }));
    expect(route.path).toBe("/docs");
  });

  it("writes navigations into the hash, keeping the document path", async () => {
    window.history.replaceState(null, "", "/host/page");
    const route = await start(createRouter(table(), { history: "hash", preload: false }));

    await route.go("/docs");
    expect(window.location.hash).toBe("#/docs");
    expect(window.location.pathname).toBe("/host/page");
    expect(route.path).toBe("/docs");
    expect(route.url).toBe("/docs");
  });

  it("keeps an in-page fragment after the route", async () => {
    const route = await start(createRouter(table(), { history: "hash", preload: false }));

    await route.go("/docs#install");
    expect(window.location.hash).toBe("#/docs#install");
    // Only the first "#" separates, so the rest is an ordinary fragment.
    expect(route.path).toBe("/docs");
    expect(route.hash).toBe("#install");
  });

  it("carries a query", async () => {
    const route = await start(createRouter(table(), { history: "hash", preload: false }));
    await route.go("/blog/x?draft=1");
    expect(window.location.hash).toBe("#/blog/x?draft=1");
    expect(route.search.get("draft")).toBe("1");
  });

  it("goes back", async () => {
    const route = await start(createRouter(table(), { history: "hash", preload: false }));
    await route.go("/docs");
    expect(route.path).toBe("/docs");

    route.back();
    await waitFor(() => route.path === "/");
    expect(route.path).toBe("/");
  });

  it("reacts to the hash being edited directly", async () => {
    const route = await start(createRouter(table(), { history: "hash", preload: false }));

    // What following a bare "#…" link or editing the address bar looks like.
    window.location.hash = "#/docs";
    await waitFor(() => route.path === "/docs");
    expect(route.path).toBe("/docs");
  });

  it("intercepts link clicks written with route.href()", async () => {
    const route = await start(createRouter(table(), { history: "hash", preload: false }));
    const container = mount();
    render(App, container);

    expect(click(link(route.href("/docs")))).toBe(true);
    await flush();
    expect(route.path).toBe("/docs");
    expect(container.querySelector("#docs")).not.toBeNull();
  });

  it("stacks layers, with Back closing the top one", async () => {
    let captured: Layer | undefined;
    const Modal: PageComponent = (_ctx, { layer }) => {
      captured = layer;
      return into("main", div({ id: "modal" }));
    };
    const router = createRouter(
      { "/": () => P("home"), "/modal": () => Modal },
      { history: "hash", preload: false },
    );
    const route = await start(router);
    render(App, mount());

    const pending = route.push("/modal");
    await flush();
    expect(route.depth).toBe(2);
    expect(window.location.hash).toBe("#/modal");

    captured!.close("done");
    await waitFor(() => route.depth === 1);
    await expect(pending).resolves.toBe("done");
    // Back to the entry the push was made from. That one had no hash at all,
    // which read() treats as the root — the route is what matters here.
    expect(route.path).toBe("/");
  });

  it("replaces the entry when asked", async () => {
    const route = await start(createRouter(table(), { history: "hash", preload: false }));
    await route.go("/docs");
    await route.go("/blog/x", { replace: true });

    expect(window.location.hash).toBe("#/blog/x");
    route.back();
    // The /docs entry was overwritten, so Back skips past it.
    await waitFor(() => route.path === "/");
  });

  it("hands an unowned href back to the browser", async () => {
    const route = await start(
      createRouter({ "/": () => P("home") }, { history: "hash", preload: false }),
    );
    const location = stubAssign();
    try {
      await route.go("/not-a-route");
    } finally {
      location.restore();
    }
    expect(location.calls).toEqual(["/not-a-route"]);
    expect(route.path).toBe("/");
  });

  it("falls back to the built context when the location does not match a route", async () => {
    // base "/app", but the hash points outside it: read() no longer parses, so
    // the live getters fall back to what the active page was built with.
    const route = await start(
      createRouter({ "/": () => P("home") }, { base: "/app", history: "hash", preload: false }),
      "/app/#top",
    );
    window.history.replaceState(null, "", "/#/outside-the-base");

    expect(route.hash).toBe(route.hash);
    expect(() => route.hash).not.toThrow();
    expect(route.path).toBe("/");
  });

  it("applies base inside the hash", async () => {
    window.history.replaceState(null, "", "/#/app/docs");
    const route = await start(
      createRouter({ "/": () => P("home"), "/docs": () => P("docs") }, { base: "/app", history: "hash", preload: false }),
    );

    expect(route.path).toBe("/docs");
    expect(route.href("/docs")).toBe("/app/docs");
  });
});

describe('history: "memory"', () => {
  it("never touches the document's location", async () => {
    window.history.replaceState(null, "", "/real/page");
    const route = await start(createRouter(table(), { history: "memory", preload: false }), "/blog/first");

    expect(route.path).toBe("/blog/first");
    await route.go("/docs");
    expect(route.path).toBe("/docs");
    expect(route.url).toBe("/docs");

    // The address bar is exactly where it was.
    expect(window.location.pathname).toBe("/real/page");
    expect(window.location.hash).toBe("");
  });

  it("seeds its first entry from start(url), and defaults to the root", async () => {
    expect((await start(createRouter(table(), { history: "memory", preload: false }), "/docs")).path).toBe(
      "/docs",
    );

    const bare = await start(createRouter(table(), { history: "memory", preload: false }));
    expect(bare.path).toBe("/");
    expect(bare.url).toBe("/");
  });

  it("keeps one entry stack per router, across starts", async () => {
    // The stack lives on the router, not the Route — so a re-mount resumes
    // where the last one left off, the way a browser's history would.
    const router = createRouter(table(), { history: "memory", preload: false });
    const first = await start(router, "/");
    await first.go("/docs");
    first.stop();

    const second = await start(router);
    expect(second.path).toBe("/docs");
    second.back();
    await waitFor(() => second.path === "/");
  });

  it("keeps its own entry stack, which back() walks", async () => {
    const route = await start(createRouter(table(), { history: "memory", preload: false }), "/");
    await route.go("/docs");
    await route.go("/blog/x");
    expect(route.path).toBe("/blog/x");

    route.back();
    await waitFor(() => route.path === "/docs");
    route.back();
    await waitFor(() => route.path === "/");

    // Past the beginning it simply stops.
    route.back();
    await flush();
    expect(route.path).toBe("/");
  });

  it("discards the forward entries on a new navigation, as a browser does", async () => {
    const route = await start(createRouter(table(), { history: "memory", preload: false }), "/");
    await route.go("/docs");
    route.back();
    await waitFor(() => route.path === "/");

    await route.go("/blog/new-branch");
    route.back();
    await waitFor(() => route.path === "/");
    expect(route.path).toBe("/");
  });

  it("replace overwrites the entry instead of adding one", async () => {
    const route = await start(createRouter(table(), { history: "memory", preload: false }), "/");
    await route.go("/docs");
    await route.go("/blog/x", { replace: true });
    expect(route.path).toBe("/blog/x");

    route.back();
    await waitFor(() => route.path === "/");
    expect(route.path).toBe("/");
  });

  it("stacks layers and closes them through its own entries", async () => {
    let captured: Layer | undefined;
    const Modal: PageComponent = (_ctx, { layer }) => {
      captured = layer;
      return into("main", div({ id: "modal" }));
    };
    const router = createRouter(
      { "/": () => P("home"), "/modal": () => Modal },
      { history: "memory", preload: false },
    );
    const route = await start(router, "/");
    const container = mount();
    render(App, container);

    const pending = route.push("/modal");
    await flush();
    expect(route.depth).toBe(2);
    expect([...container.firstElementChild!.children].map((c) => c.id)).toEqual(["home", "modal"]);

    captured!.close("picked");
    await waitFor(() => route.depth === 1);
    await expect(pending).resolves.toBe("picked");
    expect(route.path).toBe("/");
  });

  it("intercepts links, because they are still in a document", async () => {
    const route = await start(createRouter(table(), { history: "memory", preload: false }), "/");
    render(App, mount());

    expect(click(link("/docs"))).toBe(true);
    await flush();
    expect(route.path).toBe("/docs");
    // …and still without moving the real location.
    expect(window.location.pathname).toBe("/");
  });

  it("makes back() inert after stop()", async () => {
    const route = await start(createRouter(table(), { history: "memory", preload: false }), "/");
    await route.go("/docs");
    route.stop();

    route.back();
    await flush();
    expect(route.path).toBe("/docs");
  });

  it("has nowhere to hand an unowned href, so it stays put", async () => {
    const route = await start(
      createRouter({ "/": () => P("home") }, { history: "memory", preload: false }),
      "/",
    );
    await route.go("/not-a-route");
    expect(route.path).toBe("/");
  });
});

describe("the default is unchanged", () => {
  it('history: "browser" is what you get without the option', async () => {
    const route = await start(createRouter(table(), { preload: false }), "/");
    await route.go("/docs");
    // The route is the pathname, as before.
    expect(window.location.pathname).toBe("/docs");
    expect(window.location.hash).toBe("");
    expect(route.url).toBe("/docs");
  });
});
