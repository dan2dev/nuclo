/**
 * Pages that place themselves, with the stack placed in the tree by the app
 * (`route.pages()`). The router only decides what to load: a page returns
 * `view("main", …)` and lands in the layout's `region({ id: "main" })`,
 * wherever `route.pages()` happens to sit — before or after the layout, at any
 * depth. The router never knows a region id. The layout is never rebuilt, so
 * its own controls keep their state while the page inside changes, and the
 * server's page node is claimed in place on hydration.
 */
import { describe, it, expect } from "vitest";
import "nuclo";
import { renderToString } from "nuclo/ssr";
import { createRouter, type PageComponent, type Route } from "../src/index";
import { flush, mount, useRouterEnv } from "./helpers";

const routes = useRouterEnv();

const Home: PageComponent = () => view("main", div({ id: "home" }, h1("Home")));
const About: PageComponent = () => view("main", div({ id: "about" }, h1("About")));
const Modal: PageComponent = (_ctx, { layer }) =>
  view("main", div({ id: "modal" }, button({ id: "close", onClick: () => layer.close() }, "close")));
/** Fills two regions at once. */
const Docs: PageComponent = () => view({ main: div({ id: "docs" }), side: div({ id: "docs-links" }) });
/** A parent that keeps its child inside its own content. */
const Records: PageComponent = (_ctx, { outlet }) =>
  view("main", div({ id: "records" }, input({ id: "notes" }), main({ id: "child" }, outlet())));
const Preview: PageComponent = () => div({ id: "preview" });

const table = {
  "/": () => Home,
  "/about": () => About,
  "/modal": () => Modal,
  "/docs": () => Docs,
  "/records": { "/": () => Records, "./preview": () => Preview },
};

/** A layout that never sees the Route. */
const Layout = () =>
  div(
    { id: "layout" },
    aside({ id: "side-host" }, input({ id: "filter" }), region({ id: "side" })),
    main({ id: "outlet" }, region({ id: "main", type: "stack", empty: p({ id: "none" }, "Nothing open.") })),
  );

const App = (route: Route) => () => div({ id: "shell" }, Layout(), route.pages());
const AppPagesFirst = (route: Route) => () => div({ id: "shell" }, route.pages(), Layout());

async function start(url: string, app = App) {
  const router = createRouter(table, { preload: false });
  window.history.replaceState(null, "", url);
  const route = await router.start();
  routes.push(route);
  return { route, container: mount(), app: app(route) };
}

/** Element ids directly inside the outlet, in order. */
function outlet(container: HTMLElement): string[] {
  return [...container.querySelector("#outlet")!.children].map((c) => c.id);
}

describe("pages that return a view()", () => {
  it("land in the region, with pages() after the layout", async () => {
    const { container, app } = await start("/");
    render(app, container);
    expect(outlet(container)).toEqual(["home"]);
    expect(container.querySelector("#none")).toBeNull();
  });

  it("land in the region, with pages() before the layout", async () => {
    const { container, app } = await start("/", AppPagesFirst);
    render(app, container);
    expect(outlet(container)).toEqual(["home"]);
  });

  it("leave only an anchor where pages() sits", async () => {
    const { container, app } = await start("/");
    render(app, container);
    const shell = container.querySelector("#shell")!;
    // The layout, then the router's list markers around one view anchor.
    expect([...shell.childNodes].map((n) => (n.nodeType === 8 ? n.textContent!.replace(/-\d+.*/, "") : (n as Element).id)))
      .toEqual(["layout", "list-start", "view", "list-end"]);
  });

  it("swap the page in the region without rebuilding the layout", async () => {
    const { route, container, app } = await start("/");
    render(app, container);
    const layout = container.querySelector("#layout")!;
    const filter = container.querySelector<HTMLInputElement>("#filter")!;
    filter.value = "typed";
    filter.focus();

    await route.go("/about");

    expect(outlet(container)).toEqual(["about"]);
    expect(container.querySelector("#layout")).toBe(layout);
    expect(filter.value).toBe("typed");
    expect(document.activeElement).toBe(filter);
  });

  it("stack a pushed layer over the page, inside the region", async () => {
    const { route, container, app } = await start("/");
    render(app, container);
    const home = container.querySelector("#home")!;

    const pending = route.push("/modal");
    await flush();
    expect(outlet(container)).toEqual(["home", "modal"]);
    expect(container.querySelector("#home")).toBe(home);

    container.querySelector<HTMLButtonElement>("#close")!.click();
    await pending;
    expect(outlet(container)).toEqual(["home"]);
  });

  it("fill several regions from one page, and clear them all on leaving", async () => {
    const { route, container, app } = await start("/docs");
    render(app, container);
    expect(outlet(container)).toEqual(["docs"]);
    expect(container.querySelector("#side-host #docs-links")).not.toBeNull();

    await route.go("/");

    expect(outlet(container)).toEqual(["home"]);
    expect(container.querySelector("#docs-links")).toBeNull();
  });

  it("keep a parent's view while its child changes inside it", async () => {
    const { route, container, app } = await start("/records");
    render(app, container);
    const records = container.querySelector("#records")!;
    const notes = container.querySelector<HTMLInputElement>("#notes")!;
    notes.value = "draft";

    await route.go("/records/preview");

    expect(container.querySelector("#records")).toBe(records);
    expect(notes.value).toBe("draft");
    expect(container.querySelector("#child #preview")).not.toBeNull();
    expect(outlet(container)).toEqual(["records"]);
  });

  it("show the region's `empty` content after stop()", async () => {
    const { route, container, app } = await start("/");
    render(app, container);
    expect(outlet(container)).toEqual(["home"]);

    // Retiring the Route is not a navigation; the page stays until the
    // tree holding pages() goes.
    route.stop();
    expect(outlet(container)).toEqual(["home"]);
  });

  describe("server-rendered", () => {
    async function ssr(url: string, app: (route: Route) => () => NodeModFn): Promise<string> {
      const router = createRouter(table);
      const route = await router.start(url);
      try {
        return renderToString(app(route));
      } finally {
        route.stop();
      }
    }

    it("emits the page between the region's markers and an anchor where pages() sits", async () => {
      const html = await ssr("/about", App);
      expect(html).toMatch(/<main id="outlet"><!--region-start-\d+-v1--><div id="about">.*<!--region-end--><\/main>/);
      expect(html).toMatch(/<!--list-start-\d+--><!--view-\d+--><!--list-end--><\/div>$/);
      expect(html).not.toContain("Nothing open.");
    });

    for (const [name, app] of [["pages() after the layout", App], ["pages() before the layout", AppPagesFirst]] as const) {
      it(`claims the server's page in place — ${name}`, async () => {
        const html = await ssr("/about", app);
        const { route, container } = await start("/about", app);
        container.innerHTML = html;
        const ssrPage = container.querySelector("#about")!;
        const ssrFilter = container.querySelector("#filter")!;

        hydrate(app(route), container);

        expect(container.querySelector("#about")).toBe(ssrPage);
        expect(container.querySelector("#filter")).toBe(ssrFilter);
        expect(container.querySelectorAll("#about").length).toBe(1);

        await route.go("/");
        expect(outlet(container)).toEqual(["home"]);
        expect(container.querySelector("#filter")).toBe(ssrFilter);
      });
    }

    it("claims a parent view with its child inside it", async () => {
      const html = await ssr("/records/preview", App);
      const { route, container } = await start("/records/preview", App);
      container.innerHTML = html;
      const ssrRecords = container.querySelector("#records")!;
      const ssrPreview = container.querySelector("#preview")!;

      hydrate(App(route), container);

      expect(container.querySelector("#records")).toBe(ssrRecords);
      expect(container.querySelector("#preview")).toBe(ssrPreview);
      expect(container.querySelectorAll("#preview").length).toBe(1);
    });
  });
});
