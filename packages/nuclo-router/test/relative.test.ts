/**
 * Route-relative hrefs ("./x", "../x") and mount().
 *
 * These two exist for one purpose: a fragment like `"./preview"` should mean
 * the same thing wherever it is mounted, and navigating to it should not
 * depend on where the current URL happens to put its slashes.
 */
import { describe, it, expect } from "vitest";
import "nuclo";
import { createRouter, type Router, type Layer, type PageComponent, type Route, type RouteTable } from "../src/index";
import { App, click, flush, mount as mountEl, useRouterEnv, waitFor } from "./helpers";

const routes = useRouterEnv();

let router: Router;

async function start(r: Router, url?: string): Promise<Route> {
  router = r;
  const route = await r.start(url);
  routes.push(route);
  return route;
}

// No page here calls outlet(), so every one that renders is the root of its match.
const P = (id: string): PageComponent => () => div({ id }, id);

/** A section: it has no idea where it will live. */
const recordSection: RouteTable = {
  "/": () => P("record"),
  "./preview": () => P("preview"),
  "./preview/raw": () => P("preview-raw"),
};

function table(): RouteTable {
  return {
    "/": () => P("home"),
    "/invoices": () => P("invoices"),
    // The same object under both parents — that is the whole reuse story.
    "/invoices/:id": recordSection,
    "/customers/:id": recordSection,
    "*": () => P("nf"),
  };
}

describe("nested tables", () => {
  it("joins a child's key onto its parent", async () => {
    const seen: string[] = [];
    const router = createRouter(
      {
        "/a": {
          "/": () => P("a"),
          "./x": () => P("x"),
          "/y": () => P("y"),
          z: () => P("z"),
        },
      },
      { preload: false },
    );
    // "./x", "/x" and "x" all mean the same thing inside a child table, and
    // "/" means the parent path itself.
    for (const path of ["/a", "/a/x", "/a/y", "/a/z"]) {
      seen.push(router.match(path)?.pattern ?? "(none)");
    }
    expect(seen).toEqual(["/a", "/a/x", "/a/y", "/a/z"]);
  });

  it("nests as deep as you like", () => {
    const router = createRouter({ "/a": { "/b": { "./c": () => P("c") } } });
    expect(router.match("/a/b/c")?.pattern).toBe("/a/b/c");
  });

  it("lets a child keep its own catch-all and params", () => {
    const router = createRouter({
      "/docs": { "/": () => P("i"), "./:topic": () => P("t"), "*rest": () => P("r") },
    });
    expect(router.match("/docs")?.pattern).toBe("/docs");
    expect(router.match("/docs/intro")?.params.topic).toBe("intro");
    expect(router.match("/docs/a/b/c")?.params.rest).toBe("a/b/c");
  });

  it("mounts the same section under several parents, sharing its module cache", async () => {
    let loads = 0;
    const shared: RouteTable = {
      "./preview": () => {
        loads++;
        return Promise.resolve({ default: P("preview") });
      },
    };
    const router = createRouter(
      { "/a/:id": { "/": () => P("a"), ...shared }, "/b/:id": { "/": () => P("b"), ...shared } },
      { preload: false },
    );
    const route = await start(router, "/a/1");

    await route.go("/a/1/preview");
    expect(route.pattern).toBe("/a/:id/preview");
    await route.go("/b/9/preview");
    expect(route.pattern).toBe("/b/:id/preview");
    expect(route.params.id).toBe("9");

    // One import() for both parents: the loader object is the same.
    expect(loads).toBe(1);
  });

  it("treats a nested \"/\" as the parent path itself, even at the root", () => {
    // prefix becomes "" here, so the child is "/x" rather than "//x".
    const router = createRouter({ "/": { "/": () => P("home"), "./x": () => P("x") } });
    expect(router.match("/")?.pattern).toBe("/");
    expect(router.match("/x")?.pattern).toBe("/x");
  });

  it("normalizes a sloppy parent key", () => {
    const router = createRouter({ "invoices/": { "./x": () => P("x") } });
    expect(router.match("/invoices/x")?.pattern).toBe("/invoices/x");
  });

  it("rejects a relative key with no parent to resolve against", () => {
    expect(() => createRouter({ "./orphan": () => P("o") })).toThrow(
      /a route pattern is absolute/,
    );
  });

  it("rejects a child under a catch-all, because one must end its pattern", () => {
    expect(() => createRouter({ "/files/*rest": { "./x": () => P("x") } })).toThrow(/last segment/);
  });
});

describe("relative navigation", () => {
  it('resolves "./x" against the active ROUTE, not the URL directory', async () => {
    const route = await start(createRouter(table(), { preload: false }), "/invoices/42");

    // A browser would make this /invoices/preview. The router makes it a child.
    await route.go("./preview");
    expect(route.path).toBe("/invoices/42/preview");
    expect(route.pattern).toBe("/invoices/:id/preview");
    expect(route.params.id).toBe("42");
  });

  it("does not care whether the current URL has a trailing slash", async () => {
    const router = createRouter(table(), { preload: false });
    const a = await start(router, "/invoices/42");
    expect(a.href("./preview")).toBe("/invoices/42/preview");
    a.stop();

    const b = await start(router, "/invoices/42/");
    expect(b.href("./preview")).toBe("/invoices/42/preview");
  });

  it('walks up with "../"', async () => {
    const route = await start(createRouter(table(), { preload: false }), "/invoices/42/preview/raw");

    expect(route.href("../")).toBe("/invoices/42/preview");
    expect(route.href("..")).toBe("/invoices/42/preview");
    expect(route.href("../../")).toBe("/invoices/42");
    expect(route.href("../../../")).toBe("/invoices");
    // Past the root it stops at the root rather than going negative.
    expect(route.href("../../../../../../")).toBe("/");
  });

  it('resolves "." to the current route', async () => {
    const route = await start(createRouter(table(), { preload: false }), "/invoices/42");
    expect(route.href(".")).toBe("/invoices/42");
    expect(route.href("./")).toBe("/invoices/42");
  });

  it("keeps a query and hash on a relative href", async () => {
    const route = await start(createRouter(table(), { preload: false }), "/invoices/42");
    expect(route.href("./preview?mode=raw#top")).toBe("/invoices/42/preview?mode=raw#top");

    await route.go("./preview?mode=raw#top");
    expect(route.path).toBe("/invoices/42/preview");
    expect(route.search.get("mode")).toBe("raw");
    expect(route.hash).toBe("#top");
  });

  it("resolves inside a base", async () => {
    const router = createRouter(
      { "/": () => P("home"), "/invoices/:id": recordSection },
      { base: "/app", preload: false },
    );
    const route = await start(router, "/app/invoices/42");

    expect(route.path).toBe("/invoices/42");
    // base is re-added, exactly once.
    expect(route.href("./preview")).toBe("/app/invoices/42/preview");

    await route.go("./preview");
    expect(route.path).toBe("/invoices/42/preview");
    expect(window.location.pathname).toBe("/app/invoices/42/preview");
  });

  it("writes the resolved absolute URL into history", async () => {
    // The browser really is on this URL, so Back has somewhere to return to.
    window.history.replaceState(null, "", "/invoices/42");
    const route = await start(createRouter(table(), { preload: false }));
    await route.go("./preview");
    expect(window.location.pathname).toBe("/invoices/42/preview");

    // So Back lands where the user expects.
    window.history.back();
    await waitFor(() => route.path === "/invoices/42");
    expect(route.path).toBe("/invoices/42");
  });

  it("leaves the SPA when a relative href resolves outside the app", async () => {
    const router = createRouter({ "/invoices/:id": () => P("invoice") }, { preload: false });
    const route = await start(router, "/invoices/42");

    // "../../nope" resolves to /nope, which no route owns.
    expect(route.href("../../nope")).toBe("/nope");
    expect(router.match("/nope")).toBeNull();
  });

  it("navigates a relative <a href> clicked in the page", async () => {
    const route = await start(createRouter(table(), { preload: false }), "/invoices/42");
    const anchor = document.createElement("a");
    anchor.setAttribute("href", "./preview");
    document.body.appendChild(anchor);

    expect(click(anchor)).toBe(true);
    await flush();
    expect(route.path).toBe("/invoices/42/preview");
  });

  it("pushes a relative layer, which is the usual shape of one", async () => {
    const container = mountEl();
    let captured: Layer | undefined;
    const Preview: PageComponent = (_ctx, { layer }) => {
      captured = layer;
      return div({ id: "preview" });
    };
    const router = createRouter(
      {
        // One section object, declared under both parents.
        "/invoices/:id": { "/": () => P("invoice"), "./preview": () => Preview },
        "/customers/:id": { "/": () => P("customer"), "./preview": () => Preview },
      },
      { preload: false },
    );
    const route = await start(router, "/invoices/42");
    render(App(router), container);
    const pages = container.firstElementChild!;

    const pending = route.push("./preview");
    await flush();
    expect(route.depth).toBe(2);
    expect(route.path).toBe("/invoices/42/preview");
    expect([...pages.children].map((c) => c.id)).toEqual(["invoice", "preview"]);

    captured!.close("done");
    await flush();
    await expect(pending).resolves.toBe("done");

    // The very same fragment, pushed from a different parent.
    await route.go("/customers/7");
    const second = route.push("./preview");
    await flush();
    expect(route.path).toBe("/customers/7/preview");
    expect([...pages.children].map((c) => c.id)).toEqual(["customer", "preview"]);
    captured!.close();
    await second;
  });

  it("rejects a relative push that resolves to nothing", async () => {
    const route = await start(createRouter({ "/invoices/:id": () => P("invoice") }, { preload: false }), "/invoices/42");
    // The message quotes what the caller wrote, not the resolved path.
    await expect(route.push("./nope")).rejects.toThrow(/push\("\.\/nope"\)/);
  });

  it("rebuilds a layer's row at depth 0 when a navigation lands on its own URL", async () => {
    // Otherwise the page keeps a Layer handle for a depth that no longer
    // exists, and its close()/Cancel silently does nothing.
    let seen: Layer | undefined;
    const Modal: PageComponent = (_ctx, { layer }) => {
      seen = layer;
      return div({ id: "modal" });
    };
    const router = createRouter({ "/": () => P("home"), "/modal": () => Modal }, { preload: false });
    const route = await start(router, "/");
    render(App(router), mountEl());

    const pushed = route.push("/modal");
    await flush();
    expect(seen!.depth).toBe(1);

    // A plain navigation to the URL the layer is already showing.
    await route.go("/modal");
    await flush();
    await expect(pushed).resolves.toBeUndefined();

    // The row was rebuilt as the base page, so its handle agrees with reality.
    expect(route.depth).toBe(1);
    expect(seen!.depth).toBe(0);
    expect(() => seen!.close("x")).not.toThrow();
    expect(route.depth).toBe(1);
  });

  it("leaves non-relative hrefs to ordinary URL rules", async () => {
    window.history.replaceState(null, "", "/invoices/42");
    const route = await start(createRouter(table(), { preload: false }));
    // Absolute: untouched.
    expect(route.href("/invoices")).toBe("/invoices");
    // A bare relative segment is NOT route-relative — only "./" and "../" are.
    const anchor = document.createElement("a");
    anchor.setAttribute("href", "preview");
    document.body.appendChild(anchor);
    click(anchor);
    await flush();
    // Browser rules: /invoices/42 -> /invoices/preview, which nothing owns, so
    // it falls through to "*".
    expect(route.path).toBe("/invoices/preview");
  });
});
