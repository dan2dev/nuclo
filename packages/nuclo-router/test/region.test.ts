/**
 * Pages are plain content in the router's outlet. A page may still fill the
 * layout's other regions with into(); that content leaves with the page.
 */
import { describe, it, expect } from "vitest";
import "nuclo";
import { renderToString } from "nuclo/ssr";
import { createRouter, type PageComponent, type Router } from "../src/index";
import { flush, mount, useRouterEnv } from "./helpers";

const routes = useRouterEnv();

const Home: PageComponent = () => div({ id: "home" }, h1("Home"));
const About: PageComponent = () => div({ id: "about" }, h1("About"));
const Modal: PageComponent = (_ctx, { layer }) =>
  div({ id: "modal" }, button({ id: "close", onClick: () => layer.close() }, "close"));
/** Fills the layout's side region as well. */
const Docs: PageComponent = () => div({ id: "docs" }, into("side", div({ id: "docs-links" })));
/** A parent that keeps its child inside its own content. */
const Records: PageComponent = (_ctx, { outlet }) =>
  div({ id: "records" }, input({ id: "notes" }), main({ id: "child" }, outlet()));
const Preview: PageComponent = () => div({ id: "preview" });

const table = {
  "/": () => Home,
  "/about": () => About,
  "/modal": () => Modal,
  "/docs": () => Docs,
  "/records": { "/": () => Records, "./preview": () => Preview },
};

const Layout = (router: Router) =>
  div(
    { id: "layout" },
    aside({ id: "side-host" }, input({ id: "filter" }), region({ id: "side" })),
    main({ id: "outlet" }, router.outlet()),
  );

const App = (router: Router) => () => div({ id: "shell" }, Layout(router));

async function boot(url: string) {
  const router = createRouter(table, { preload: false });
  window.history.replaceState(null, "", url);
  const route = await router.start();
  routes.push(route);
  return { router, route, container: mount() };
}

/** Element ids directly inside the outlet, in order. */
function outlet(container: HTMLElement): string[] {
  return [...container.querySelector("#outlet")!.children].map((c) => c.id);
}

describe("pages in the outlet", () => {
  it("swap without rebuilding the layout", async () => {
    const { router, route, container } = await boot("/");
    render(App(router), container);
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

  it("stack a pushed layer over the page", async () => {
    const { router, route, container } = await boot("/");
    render(App(router), container);
    const home = container.querySelector("#home")!;

    const pending = route.push("/modal");
    await flush();
    expect(outlet(container)).toEqual(["home", "modal"]);
    expect(container.querySelector("#home")).toBe(home);

    container.querySelector<HTMLButtonElement>("#close")!.click();
    await pending;
    expect(outlet(container)).toEqual(["home"]);
  });

  it("fill another region from a page, and clear it on leaving", async () => {
    const { router, route, container } = await boot("/docs");
    render(App(router), container);
    expect(outlet(container)).toEqual(["docs"]);
    expect(container.querySelector("#side-host #docs-links")).not.toBeNull();

    await route.go("/");

    expect(outlet(container)).toEqual(["home"]);
    expect(container.querySelector("#docs-links")).toBeNull();
  });

  it("keep a parent while its child changes inside it", async () => {
    const { router, route, container } = await boot("/records");
    render(App(router), container);
    const records = container.querySelector("#records")!;
    const notes = container.querySelector<HTMLInputElement>("#notes")!;
    notes.value = "draft";

    await route.go("/records/preview");

    expect(container.querySelector("#records")).toBe(records);
    expect(notes.value).toBe("draft");
    expect(container.querySelector("#child #preview")).not.toBeNull();
    expect(outlet(container)).toEqual(["records"]);
  });

  it("leave the outlet empty after stop()", async () => {
    const { router, route, container } = await boot("/");
    render(App(router), container);
    expect(outlet(container)).toEqual(["home"]);

    route.stop();
    expect(outlet(container)).toEqual([]);
  });

  describe("server-rendered", () => {
    async function ssr(url: string): Promise<string> {
      const router = createRouter(table);
      const route = await router.start(url);
      try {
        return route.run(() => renderToString(App(router)));
      } finally {
        route.stop();
      }
    }

    it("emits the page inside the outlet and the side content inside its region", async () => {
      const html = await ssr("/docs");
      expect(html).toMatch(/<main id="outlet"><!--list-start[^>]*--><div id="docs">/);
      expect(html).toMatch(/<!--region-start[^>]*-->.*<div id="docs-links">/);
    });

    it("claims the server's page in place", async () => {
      const html = await ssr("/about");
      const { router, route, container } = await boot("/about");
      container.innerHTML = html;
      const ssrPage = container.querySelector("#about")!;
      const ssrFilter = container.querySelector("#filter")!;

      hydrate(App(router), container);

      expect(container.querySelector("#about")).toBe(ssrPage);
      expect(container.querySelector("#filter")).toBe(ssrFilter);
      expect(container.querySelectorAll("#about").length).toBe(1);

      await route.go("/");
      expect(outlet(container)).toEqual(["home"]);
      expect(container.querySelector("#filter")).toBe(ssrFilter);
    });

    it("claims a parent with its child inside it", async () => {
      const html = await ssr("/records/preview");
      const { router, container } = await boot("/records/preview");
      container.innerHTML = html;
      const ssrRecords = container.querySelector("#records")!;
      const ssrPreview = container.querySelector("#preview")!;

      hydrate(App(router), container);

      expect(container.querySelector("#records")).toBe(ssrRecords);
      expect(container.querySelector("#preview")).toBe(ssrPreview);
      expect(container.querySelectorAll("#preview").length).toBe(1);
    });
  });
});
