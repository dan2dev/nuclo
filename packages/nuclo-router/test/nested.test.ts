// @vitest-environment jsdom
/**
 * Nested routes: a parent page stays mounted while its children change.
 *
 * The assertion that matters throughout is **node identity**. A parent that is
 * "not recreated" means literally the same DOM node, with the same focus, the
 * same scroll position and the same closure state it had before.
 */
import { describe, it, expect, vi } from "vitest";
import "nuclo";
import { renderToString } from "nuclo/ssr";
import {
  createRouter, type Router,
  type Layer,
  type PageComponent,
  type PageProps,
  type Route,
  type RouteContext,
  type RouteTable,
} from "../src/index";
import { App, click, flush, mount, useRouterEnv, waitFor } from "./helpers";

const routes = useRouterEnv();

let router: Router;

async function start(r: Router, url?: string): Promise<Route> {
  router = r;
  const route = await r.start(url);
  routes.push(route);
  return route;
}

/** Counts how many times each page function was invoked. */
let builds: Record<string, number> = {};
function page(id: string): PageComponent {
  return () => {
    builds[id] = (builds[id] ?? 0) + 1;
    return div({ id }, id);
  };
}

/** A layout: renders its own chrome plus whatever child route is active. */
function layout(id: string): PageComponent {
  return (_ctx: RouteContext, { outlet }: PageProps) => {
    builds[id] = (builds[id] ?? 0) + 1;
    return div({ id }, input({ id: `${id}-field` }), div({ id: `${id}-outlet` }, outlet()));
  };
}

function table(): RouteTable {
  return {
    "/": () => page("home"),
    "/docs": {
      "/": () => layout("docs"),
      "./intro": () => page("intro"),
      "./:topic": () => page("topic"),
    },
    "*": () => page("nf"),
  };
}

describe("a parent is not destroyed by its children", () => {
  it("keeps the parent's node, focus and typed state across a child navigation", async () => {
    builds = {};
    const route = await start(createRouter(table(), { preload: false }), "/docs");
    const container = mount();
    render(App(router), container);

    const shell = container.querySelector("#docs")!;
    const field = container.querySelector<HTMLInputElement>("#docs-field")!;
    field.value = "typed by the user";
    field.focus();
    expect(builds).toEqual({ docs: 1 });

    await route.go("/docs/intro");

    // The very same node, still holding its value, still focused.
    expect(container.querySelector("#docs")).toBe(shell);
    expect(container.querySelector<HTMLInputElement>("#docs-field")!.value).toBe("typed by the user");
    expect(document.activeElement).toBe(field);
    // And the child rendered inside its outlet.
    expect(container.querySelector("#docs-outlet > #intro")).not.toBeNull();
    // The parent's page function never ran again.
    expect(builds).toEqual({ docs: 1, intro: 1 });
  });

  it("swaps only the child when moving between siblings", async () => {
    builds = {};
    const route = await start(createRouter(table(), { preload: false }), "/docs/intro");
    const container = mount();
    render(App(router), container);
    const shell = container.querySelector("#docs")!;

    await route.go("/docs/hydration");
    expect(container.querySelector("#docs")).toBe(shell);
    expect(container.querySelector("#intro")).toBeNull();
    expect(container.querySelector("#docs-outlet > #topic")).not.toBeNull();
    expect(builds.docs).toBe(1);
  });

  it("renders the parent for a cold deep link", async () => {
    builds = {};
    const route = await start(createRouter(table(), { preload: false }), "/docs/intro");
    const container = mount();
    render(App(router), container);

    expect(container.querySelector("#docs-outlet > #intro")).not.toBeNull();
    // The static child wins over the sibling ":topic", nesting or not.
    expect(route.pattern).toBe("/docs/intro");
    expect(builds).toEqual({ docs: 1, intro: 1 });
    void route;
  });

  it("rebuilds everything when the parent itself changes", async () => {
    builds = {};
    const router = createRouter(
      {
        "/a": { "/": () => layout("a"), "./x": () => page("ax") },
        "/b": { "/": () => layout("b"), "./x": () => page("bx") },
      },
      { preload: false },
    );
    const route = await start(router, "/a/x");
    const container = mount();
    render(App(router), container);
    const first = container.querySelector("#a")!;

    await route.go("/b/x");
    expect(container.querySelector("#a")).toBeNull();
    expect(container.querySelector("#b")).not.toBeNull();
    expect(container.querySelector("#b")).not.toBe(first);
    expect(container.querySelector("#b-outlet > #bx")).not.toBeNull();
  });

  it("keeps the parent when only a param of the child changes", async () => {
    builds = {};
    const route = await start(createRouter(table(), { preload: false }), "/docs/one");
    const container = mount();
    render(App(router), container);
    const shell = container.querySelector("#docs")!;

    await route.go("/docs/two");
    expect(container.querySelector("#docs")).toBe(shell);
    expect(builds.docs).toBe(1);
    // The child did rebuild — its params are different.
    expect(builds.topic).toBe(2);
  });

  it("navigating from a child up to the parent shows the parent's own page", async () => {
    builds = {};
    const route = await start(createRouter(table(), { preload: false }), "/docs/intro");
    const container = mount();
    render(App(router), container);

    await route.go("/docs");
    expect(container.querySelector("#intro")).toBeNull();
    expect(container.querySelector("#docs")).not.toBeNull();
    // The outlet is empty now, so a layout may call it unconditionally.
    expect(container.querySelector("#docs-outlet")!.children.length).toBe(0);
  });

  it("nests more than one level deep, keeping every ancestor", async () => {
    builds = {};
    const router = createRouter(
      {
        "/a": {
          "/": () => layout("a"),
          "./b": { "/": () => layout("b"), "./c": () => page("c"), "./d": () => page("d") },
        },
      },
      { preload: false },
    );
    const route = await start(router, "/a/b/c");
    const container = mount();
    render(App(router), container);

    expect(container.querySelector("#a-outlet > #b")).not.toBeNull();
    expect(container.querySelector("#b-outlet > #c")).not.toBeNull();
    const outer = container.querySelector("#a")!;
    const inner = container.querySelector("#b")!;

    await route.go("/a/b/d");
    expect(container.querySelector("#a")).toBe(outer);
    expect(container.querySelector("#b")).toBe(inner);
    expect(container.querySelector("#b-outlet > #d")).not.toBeNull();
    expect(builds).toEqual({ a: 1, b: 1, c: 1, d: 1 });
  });

  it("gives each level its own pattern and its own slice of the path", async () => {
    const seen: Array<{ pattern: string; path: string; id?: string }> = [];
    const record = (): PageComponent => (ctx, { outlet }) => {
      seen.push({ pattern: ctx.pattern, path: ctx.path, id: ctx.params.id });
      return div(outlet());
    };
    const router = createRouter(
      // A loader returns the component; `record()` IS the component.
      { "/u/:id": { "/": () => record(), "./posts": { "/": () => record(), "./:post": () => record() } } },
      { preload: false },
    );
    const route = await start(router, "/u/7/posts/42");
    render(App(router), mount());

    expect(seen).toEqual([
      { pattern: "/u/:id", path: "/u/7", id: "7" },
      { pattern: "/u/:id/posts", path: "/u/7/posts", id: "7" },
      { pattern: "/u/:id/posts/:post", path: "/u/7/posts/42", id: "7" },
    ]);
    // route.* always reports the matched page.
    expect(route.pattern).toBe("/u/:id/posts/:post");
    expect(route.params.post).toBe("42");
  });

  it("navigates by link click without rebuilding the parent", async () => {
    builds = {};
    const route = await start(createRouter(table(), { preload: false }), "/docs");
    const container = mount();
    render(App(router), container);
    const shell = container.querySelector("#docs")!;

    const anchor = document.createElement("a");
    anchor.setAttribute("href", "/docs/intro");
    container.querySelector("#docs-outlet")!.appendChild(anchor);
    expect(click(anchor)).toBe(true);
    await flush();

    expect(container.querySelector("#docs")).toBe(shell);
    expect(builds.docs).toBe(1);
  });
});

describe("loaders and nesting", () => {
  it("does not re-run a kept parent's loader", async () => {
    let parentLoads = 0;
    let childLoads = 0;
    const router = createRouter(
      {
        "/shop": {
          "/": () => ({
            load: () => {
              parentLoads++;
              return "shop";
            },
            default: ((_c, { data, outlet }) =>
              div({ id: "shop" }, data, div({ id: "shop-outlet" }, outlet()))) as PageComponent<string>,
          }),
          "./:sku": () => ({
            load: (ctx: RouteContext) => {
              childLoads++;
              return ctx.params.sku;
            },
            default: ((_c, { data }) => div({ id: "item" }, data)) as PageComponent<string>,
          }),
        },
      },
      { preload: false },
    );
    const route = await start(router, "/shop/a");
    const container = mount();
    render(App(router), container);
    expect(parentLoads).toBe(1);
    expect(childLoads).toBe(1);

    await route.go("/shop/b");
    // The parent is still mounted, so its data was never refetched.
    expect(parentLoads).toBe(1);
    expect(childLoads).toBe(2);
    expect(container.querySelector("#item")!.textContent).toBe("b");
  });

  it("runs every level's loader for a cold deep link", async () => {
    const order: string[] = [];
    const router = createRouter({
      "/a": {
        "/": () => ({
          load: () => void order.push("a"),
          default: ((_c, { outlet }) => div({ id: "a" }, outlet())) as PageComponent,
        }),
        "./b": () => ({
          load: () => void order.push("b"),
          default: (() => div({ id: "b" })) as PageComponent,
        }),
      },
    });
    const route = await start(router, "/a/b");
    render(App(router), mount());
    expect(order.sort()).toEqual(["a", "b"]);
    void route;
  });
});

describe("SSR and hydration", () => {
  it("renders the whole chain on the server and claims it on the client", async () => {
    const serverRouter = createRouter(table(), { preload: false });
    const server = await start(serverRouter, "/docs/intro");
    const html = server.run(() => renderToString(App(serverRouter)));
    server.stop();

    expect(html).toContain('id="docs"');
    expect(html).toContain('id="intro"');

    const container = mount();
    container.innerHTML = html;
    const ssrShell = container.querySelector("#outlet")!.firstElementChild;
    const ssrOutlet = container.querySelector("#docs-outlet")!;
    const ssrChild = ssrOutlet.firstElementChild;

    window.history.replaceState(null, "", "/docs/intro");
    const route = await start(createRouter(table(), { preload: false }));
    hydrate(App(router), container);

    // Nested outlets hydrate like any other list(): same nodes, not replaced.
    expect(container.querySelector("#outlet")!.firstElementChild).toBe(ssrShell);
    expect(container.querySelector("#docs-outlet")!.firstElementChild).toBe(ssrChild);
    expect(container.querySelectorAll("#docs").length).toBe(1);
    expect(container.querySelectorAll("#intro").length).toBe(1);
  });
});

describe("layers and nesting", () => {
  it("a pushed layer renders the page alone, since its parent is already mounted", async () => {
    let captured: Layer | undefined;
    const Modal: PageComponent = (_ctx, { layer }) => {
      captured = layer;
      return div({ id: "modal" });
    };
    const router = createRouter(
      { "/docs": { "/": () => layout("docs"), "./modal": () => Modal } },
      { preload: false },
    );
    const route = await start(router, "/docs");
    const container = mount();
    render(App(router), container);
    const shell = container.querySelector("#docs")!;

    const pending = route.push("./modal");
    await flush();

    // Two views in the region: the record page and the layer. The layout is NOT repeated.
    const host = container.firstElementChild!;
    expect(host.children.length).toBe(2);
    expect(host.children[0]).toBe(shell);
    expect(host.children[1].id).toBe("modal");
    expect(container.querySelectorAll("#docs").length).toBe(1);
    expect(container.querySelector("#docs")).toBe(shell);

    captured!.close();
    await waitFor(() => route.depth === 1);
    await pending;
    expect(container.querySelector("#docs")).toBe(shell);
  });
});
