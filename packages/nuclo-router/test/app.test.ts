/**
 * `render(App, container)`: the app reads the router it imports and places the
 * pages with `router.outlet()`.
 */
import { describe, it, expect } from "vitest";
import "nuclo";
import { renderToString } from "nuclo/ssr";
import { createRouter, type PageComponent, type Route } from "../src/index";
import { flush, mount, useRouterEnv } from "./helpers";

const routes = useRouterEnv();

const Home: PageComponent = () => div({ id: "home" }, h1("Home"));
const About: PageComponent = () => div({ id: "about" }, h1("About"));
const Modal: PageComponent = (_ctx, { layer }) =>
  div({ id: "modal" }, button({ id: "close", onClick: () => layer.close() }, "close"));

const table = { "/": () => Home, "/about": () => About, "/modal": () => Modal };

let router = createRouter(table, { preload: false });

/** Reads the module-level router, as an app does. */
const App = () =>
  div(
    { id: "shell" },
    header({ id: "nav" }, a({ href: router.href("/") }, "home"), span({ id: "path" }, () => router.path)),
    main({ id: "outlet" }, router.outlet()),
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

describe("render(App) in the browser", () => {
  it("renders the page in the outlet", async () => {
    await start("/");
    const container = mount();
    render(App, container);

    expect(outlet(container)).toEqual(["home"]);
    expect([...container.querySelector("#shell")!.childNodes].map((n) => (n as Element).id)).toEqual(["nav", "outlet"]);
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

  it("stacks a layer over the page and drops it on close", async () => {
    await start("/");
    const container = mount();
    render(App, container);
    const home = container.querySelector("#home")!;

    const pending = router.push("/modal");
    await flush();
    expect(outlet(container)).toEqual(["home", "modal"]);
    expect(router.depth).toBe(2);
    expect(container.querySelector("#home")).toBe(home);

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

  it("empties the outlet on stop()", async () => {
    await start("/");
    const container = mount();
    render(App, container);
    expect(outlet(container)).toEqual(["home"]);

    router.stop();

    expect(outlet(container)).toEqual([]);
  });

  it("retires the previous Route when a second start() runs", async () => {
    await start("/");
    const container = mount();
    render(App, container);

    await start("/about", false);

    expect(outlet(container)).toEqual(["about"]);
    expect(document.querySelectorAll("#home").length).toBe(0);
  });

  it("keeps one page, however often the app is re-run by forceUpdate()", async () => {
    await start("/");
    const container = mount();
    render(App, container);
    const home = container.querySelector("#home")!;

    forceUpdate();
    forceUpdate();
    await flush();

    expect(outlet(container)).toEqual(["home"]);
    expect(container.querySelector("#home")).toBe(home);
  });

  it("renders nothing for a page that returns nothing", async () => {
    const Nothing: PageComponent = () => null as unknown as ListRenderResult;
    router = createRouter({ "/": () => Nothing }, { preload: false });
    await start("/", false);
    const container = mount();
    render(App, container);

    expect(outlet(container)).toEqual([]);
  });

  it("leaves one page after many navigations", async () => {
    await start("/");
    const container = mount();
    render(App, container);

    for (let i = 0; i < 40; i++) await router.go(i % 2 ? "/" : "/about");

    expect(outlet(container)).toEqual(["home"]);
    expect(document.querySelectorAll("#home, #about").length).toBe(1);
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
    expect(router.depth).toBe(1);
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

  it("emits the page inside the outlet", async () => {
    const html = await ssr("/about");

    expect(html).toMatch(/<main id="outlet"><!--list-start[^>]*--><div id="about">.*<!--list-end[^>]*--><\/main>/);
    expect(html).not.toContain("<!--view-");
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
