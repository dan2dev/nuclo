/**
 * route.app(): the pages mounted beside the app, so the app's own tree carries
 * nothing of the router's. In the browser the mount is on the document root;
 * on the server it is inside the render, on a host nothing serializes. Pages
 * reach their regions through their own view().
 */
import { describe, it, expect, vi } from "vitest";
import "nuclo";
import { renderToString } from "nuclo/ssr";
import { createRouter, type PageComponent, type Route, type Router } from "../src/index";
import { flush, mount, useRouterEnv } from "./helpers";

const routes = useRouterEnv();

const Home: PageComponent = () => view("main", div({ id: "home" }, h1("Home")));
const About: PageComponent = () => view("main", div({ id: "about" }, h1("About")));
const Modal: PageComponent = (_ctx, layer) =>
  view("main", div({ id: "modal" }, button({ id: "close", onClick: () => layer.close() }, "close")));
const Plain: PageComponent = () => div({ id: "plain" }, "not a view");

const table = { "/": () => Home, "/about": () => About, "/modal": () => Modal, "/plain": () => Plain };

/** A layout that never sees the Route; the region is "simple" on purpose. */
const App = (route: Route) => () =>
  div(
    { id: "shell" },
    header({ id: "nav" }, a({ href: route.href("/") }, "home")),
    main({ id: "outlet" }, region({ id: "main", empty: p({ id: "none" }, "Nothing open.") })),
  );

async function start(url: string, router: Router = createRouter(table, { preload: false })): Promise<Route> {
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

describe("route.app() in the browser", () => {
  it("renders the page into the region with nothing of the router's in the app tree", async () => {
    const route = await start("/");
    const container = mount();
    render(route.app(App), container);

    expect(outlet(container)).toEqual(["home"]);
    expect(container.querySelector("#none")).toBeNull();
    // The shell holds only what the app wrote.
    expect([...container.querySelector("#shell")!.childNodes].map((n) => (n as Element).id)).toEqual(["nav", "outlet"]);
    // The pages' anchors live on the document root.
    expect(rootMount()).toEqual(["list-start", "view", "list-end"]);
  });

  it("swaps the page in the region on navigation", async () => {
    const route = await start("/");
    const container = mount();
    render(route.app(App), container);
    const nav = container.querySelector("#nav")!;

    await route.go("/about");

    expect(outlet(container)).toEqual(["about"]);
    expect(container.querySelector("#nav")).toBe(nav);
  });

  it("opens a layer over the page in a simple region and brings the page back on close", async () => {
    const route = await start("/");
    const container = mount();
    render(route.app(App), container);

    const pending = route.push("/modal");
    await flush();
    expect(outlet(container)).toEqual(["modal"]);

    container.querySelector<HTMLButtonElement>("#close")!.click();
    await pending;
    expect(outlet(container)).toEqual(["home"]);
  });

  it("unmounts the pages on stop()", async () => {
    const route = await start("/");
    const container = mount();
    render(route.app(App), container);
    expect(outlet(container)).toEqual(["home"]);

    route.stop();

    expect(outlet(container)).toEqual(["none"]);
    expect(rootMount()).toEqual([]);
  });

  it("retires the previous Route's mount when a second start() runs", async () => {
    const router = createRouter(table, { preload: false });
    const first = await start("/", router);
    const container = mount();
    render(first.app(App), container);

    const second = await start("/about", router);
    render(second.app(App), mount());

    expect(rootMount()).toEqual(["list-start", "view", "list-end"]);
    expect(document.querySelectorAll("#home").length).toBe(0);
    expect(document.querySelectorAll("#about").length).toBe(1);
  });

  it("mounts once, however often the app is re-run by forceUpdate()", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const route = await start("/");
    const container = mount();
    render(route.app(App), container);
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
    const route = await start("/plain");
    render(route.app(App), mount());

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/"\/plain" returned content without a view\(\)/);

    await route.go("/");
    await route.go("/plain");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("mounts nothing of its own when the app placed pages() itself", async () => {
    const route = await start("/plain");
    const container = mount();
    render(div(main({ id: "outlet" }, route.pages())), container);

    render(route.app(App), mount());

    expect(outlet(container)).toEqual(["plain"]);
    expect(rootMount()).toEqual([]);
  });

  it("warns when pages() is placed after app() mounted the pages", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const route = await start("/");
    render(route.app(App), mount());

    render(div(route.pages()), mount());

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/placed after route\.app\(\)/);
  });

  it("renders nothing, and says nothing, for a page that returns nothing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const Nothing: PageComponent = () => null as unknown as ListRenderResult;
    const router = createRouter({ "/": () => Nothing }, { preload: false });
    const route = await start("/", router);
    const container = mount();
    render(route.app(App), container);

    expect(outlet(container)).toEqual(["none"]);
    expect(warn).not.toHaveBeenCalled();
    expect(rootMount()).toEqual(["list-start", "list-end"]);
  });

  it("leaves one page and one mount after many navigations", async () => {
    const route = await start("/");
    const container = mount();
    render(route.app(App), container);

    for (let i = 0; i < 40; i++) await route.go(i % 2 ? "/" : "/about");

    expect(outlet(container)).toEqual(["home"]);
    expect(document.querySelectorAll("#home, #about").length).toBe(1);
    expect(rootMount()).toEqual(["list-start", "view", "list-end"]);
    expect(container.querySelector("#outlet")!.firstChild!.textContent).toMatch(/-v1$/);
  });

  it("accumulates nothing when a layer is opened and closed many times", async () => {
    const route = await start("/");
    const container = mount();
    render(route.app(App), container);

    for (let i = 0; i < 20; i++) {
      const pending = route.push("/modal");
      await flush();
      container.querySelector<HTMLButtonElement>("#close")!.click();
      await pending;
    }

    expect(outlet(container)).toEqual(["home"]);
    expect(document.querySelectorAll("#modal").length).toBe(0);
    expect(rootMount()).toEqual(["list-start", "view", "list-end"]);
    expect(route.depth).toBe(1);
  });

  it("accepts an app written as a plain tree builder", async () => {
    const route = await start("/");
    const container = mount();
    render(route.app((r) => div({ id: "shell" }, main({ id: "outlet" }, region({ id: "main" })), a({ href: r.href("/") }))), container);

    expect(outlet(container)).toEqual(["home"]);
  });
});

describe("route.app() on the server, then hydrated", () => {
  async function ssr(url: string): Promise<string> {
    const router = createRouter(table);
    const route = await router.start(url);
    try {
      return renderToString(route.app(App));
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
    const route = await start("/about");
    const container = mount();
    container.innerHTML = html;
    const ssrPage = container.querySelector("#about")!;
    const ssrNav = container.querySelector("#nav")!;

    hydrate(route.app(App), container);

    expect(container.querySelector("#about")).toBe(ssrPage);
    expect(container.querySelector("#nav")).toBe(ssrNav);
    expect(container.querySelectorAll("#about").length).toBe(1);

    await route.go("/");
    expect(outlet(container)).toEqual(["home"]);
    expect(container.querySelector("#nav")).toBe(ssrNav);
  });
});
