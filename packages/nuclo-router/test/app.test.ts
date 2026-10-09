/**
 * `render(App, container)`: the app reads the router it imports and carries
 * nothing of the router's. The pages mount themselves beside it — in the
 * browser on the document root, on the server inside the render, on a host
 * nothing serializes — and reach their regions through their own into().
 */
import { describe, it, expect, vi } from "vitest";
import "nuclo";
import { renderToString } from "nuclo/ssr";
import { createRouter, type PageComponent, type Route } from "../src/index";
import { flush, mount, useRouterEnv } from "./helpers";

const routes = useRouterEnv();

const Home: PageComponent = () => into("main", div({ id: "home" }, h1("Home")));
const About: PageComponent = () => into("main", div({ id: "about" }, h1("About")));
const Modal: PageComponent = (_ctx, { layer }) =>
  into("main", div({ id: "modal" }, button({ id: "close", onClick: () => layer.close() }, "close")));
const Plain: PageComponent = () => div({ id: "plain" }, "not a view");

const table = { "/": () => Home, "/about": () => About, "/modal": () => Modal, "/plain": () => Plain };

let router = createRouter(table, { preload: false });

/** Reads the module-level router, as an app does; the region is "latest" on purpose. */
const App = () =>
  div(
    { id: "shell" },
    header({ id: "nav" }, a({ href: router.href("/") }, "home"), span({ id: "path" }, () => router.path)),
    main({ id: "outlet" }, region({ id: "main", empty: p({ id: "none" }, "Nothing open.") })),
  );

async function start(url: string, fresh = true): Promise<Route> {
  if (fresh) router = createRouter(table, { preload: false });
  window.history.replaceState(null, "", url);
  const route = await router.start();
  routes.push(route);
  return route;
}

function outlet(container: HTMLElement): string[] {
  return [...container.querySelector("#outlet")!.children].map((c) => c.id);
}

/** The router's rows on the document root: comments after </body>. */
function rootMount(): string[] {
  return [...document.documentElement.childNodes]
    .filter((n) => n.nodeType === 8)
    .map((n) => n.textContent!.replace(/-\d+.*/, ""));
}

describe("render(App) in the browser", () => {
  it("renders the page into the region with nothing of the router's in the app tree", async () => {
    await start("/");
    const container = mount();
    render(App, container);

    expect(outlet(container)).toEqual(["home"]);
    expect(container.querySelector("#none")).toBeNull();
    expect([...container.querySelector("#shell")!.childNodes].map((n) => (n as Element).id)).toEqual(["nav", "outlet"]);
    expect(rootMount()).toEqual(["list-start", "view", "list-end"]);
  });

  it("navigates through the router, keeping the shell", async () => {
    await start("/");
    const container = mount();
    render(App, container);
    const nav = container.querySelector("#nav")!;

    await router.go("/about");

    expect(outlet(container)).toEqual(["about"]);
    expect(container.querySelector("#path")!.textContent).toBe("/about");
    expect(container.querySelector("#nav")).toBe(nav);
  });

  it("opens a layer over the page in a latest region and brings the page back on close", async () => {
    await start("/");
    const container = mount();
    render(App, container);

    const pending = router.push("/modal");
    await flush();
    expect(outlet(container)).toEqual(["modal"]);
    expect(router.depth).toBe(2);

    container.querySelector<HTMLButtonElement>("#close")!.click();
    await pending;
    expect(outlet(container)).toEqual(["home"]);
  });

  it("reads the Route start() returned", async () => {
    const route = await start("/about?q=1#top");

    expect(router.path).toBe(route.path);
    expect(router.pattern).toBe("/about");
    expect(router.search.get("q")).toBe("1");
    expect(router.url).toBe(route.url);
  });

  it("throws a clear error before start()", () => {
    const fresh = createRouter(table);
    expect(() => fresh.path).toThrow(/await router\.start\(\) first/);
    // stop() is idempotent, so it never throws.
    expect(() => fresh.stop()).not.toThrow();
  });

  it("keeps reading the last match after stop(), with go() doing nothing", async () => {
    await start("/about");
    router.stop();
    router.stop();

    await router.go("/");
    expect(router.path).toBe("/about");
  });

  it("unmounts the pages on stop()", async () => {
    await start("/");
    const container = mount();
    render(App, container);
    expect(outlet(container)).toEqual(["home"]);

    router.stop();

    expect(outlet(container)).toEqual(["none"]);
    expect(rootMount()).toEqual([]);
  });

  it("retires the previous Route and its mount when a second start() runs", async () => {
    await start("/");
    render(App, mount());

    await start("/about", false);
    render(App, mount());

    expect(rootMount()).toEqual(["list-start", "view", "list-end"]);
    expect(document.querySelectorAll("#home").length).toBe(0);
    expect(document.querySelectorAll("#about").length).toBe(1);
  });

  it("mounts once, however often the app is re-run by forceUpdate()", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await start("/");
    const container = mount();
    render(App, container);
    const home = container.querySelector("#home")!;

    forceUpdate();
    forceUpdate();
    await flush();

    expect(outlet(container)).toEqual(["home"]);
    expect(container.querySelector("#home")).toBe(home);
    expect(rootMount()).toEqual(["list-start", "view", "list-end"]);
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns once about a page that is not a view", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await start("/plain");
    render(App, mount());

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/"\/plain" returned content without an into\(\)/);

    await router.go("/");
    await router.go("/plain");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("warns once, after the render, about a view whose region is not in the tree", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    router = createRouter({ "/": () => Home, "/typo": () => () => into("mian", div({ id: "typo" })) }, { preload: false });
    await start("/typo", false);
    const container = mount();
    render(App, container);
    await flush();

    expect(container.querySelector("#typo")).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/"\/typo" returned an into\(\) whose region is not in the tree/);

    await router.go("/");
    await router.go("/typo");
    await flush();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("stays quiet when the same update builds the region after the page", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    router = createRouter(
      { "/": () => Home, "/wide": () => () => into("wide", div({ id: "wide-page" })) },
      { preload: false },
    );
    await start("/", false);
    const container = mount();
    // The "wide" region only exists in the layout /wide switches to.
    render(() => div(region({ id: "main" }), when(() => router.path === "/wide", section(region({ id: "wide" })))), container);

    await router.go("/wide");
    await flush();

    expect(container.querySelector("#wide-page")).not.toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it("renders nothing, and says nothing, for a page that returns nothing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const Nothing: PageComponent = () => null as unknown as ListRenderResult;
    router = createRouter({ "/": () => Nothing }, { preload: false });
    await start("/", false);
    const container = mount();
    render(App, container);

    expect(outlet(container)).toEqual(["none"]);
    expect(warn).not.toHaveBeenCalled();
    expect(rootMount()).toEqual(["list-start", "list-end"]);
  });

  it("leaves one page and one mount after many navigations", async () => {
    await start("/");
    const container = mount();
    render(App, container);

    for (let i = 0; i < 40; i++) await router.go(i % 2 ? "/" : "/about");

    expect(outlet(container)).toEqual(["home"]);
    expect(document.querySelectorAll("#home, #about").length).toBe(1);
    expect(rootMount()).toEqual(["list-start", "view", "list-end"]);
  });

  it("accumulates nothing when a layer is opened and closed many times", async () => {
    await start("/");
    const container = mount();
    render(App, container);

    for (let i = 0; i < 20; i++) {
      const pending = router.push("/modal");
      await flush();
      container.querySelector<HTMLButtonElement>("#close")!.click();
      await pending;
    }

    expect(outlet(container)).toEqual(["home"]);
    expect(document.querySelectorAll("#modal").length).toBe(0);
    expect(rootMount()).toEqual(["list-start", "view", "list-end"]);
    expect(router.depth).toBe(1);
  });

  it("leaves a browser render inside run() to the browser mount", async () => {
    const route = await start("/");
    const container = route.run(() => {
      const target = mount();
      render(App, target);
      return target;
    });

    expect(outlet(container)).toEqual(["home"]);
    expect(rootMount()).toEqual(["list-start", "view", "list-end"]);
  });
});

describe("route.run() on the server, then hydrate(App)", () => {
  async function ssr(url: string): Promise<string> {
    router = createRouter(table);
    const route = await router.start(url);
    try {
      return route.run(() => renderToString(App));
    } finally {
      route.stop();
    }
  }

  it("emits the page inside the region and nothing else of the router's", async () => {
    const html = await ssr("/about");

    expect(html).toMatch(/<main id="outlet"><!--region-start-\d+-v1--><div id="about">.*<!--region-end--><\/main>/);
    expect(html).not.toContain("list-start");
    expect(html).not.toContain("<!--view-");
    expect(html).not.toContain("Nothing open.");
  });

  it("claims the server's page in place", async () => {
    const html = await ssr("/about");
    await start("/about");
    const container = mount();
    container.innerHTML = html;
    const ssrPage = container.querySelector("#about")!;
    const ssrNav = container.querySelector("#nav")!;

    hydrate(App, container);

    expect(container.querySelector("#about")).toBe(ssrPage);
    expect(container.querySelector("#nav")).toBe(ssrNav);
    expect(container.querySelectorAll("#about").length).toBe(1);

    await router.go("/");
    expect(outlet(container)).toEqual(["home"]);
    expect(container.querySelector("#nav")).toBe(ssrNav);
  });
});
