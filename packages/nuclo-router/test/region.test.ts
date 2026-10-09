/**
 * Pages that place themselves. The router only decides what to load: a page
 * returns `into("main", …)` and lands in the layout's `region({ id: "main" })`,
 * at any depth. The router never knows a region id. The layout is never
 * rebuilt, so its own controls keep their state while the page inside
 * changes, and the server's page node is claimed in place on hydration.
 */
import { describe, it, expect } from "vitest";
import "nuclo";
import { renderToString } from "nuclo/ssr";
import { createRouter, type PageComponent } from "../src/index";
import { flush, mount, useRouterEnv } from "./helpers";

const routes = useRouterEnv();

const Home: PageComponent = () => into("main", div({ id: "home" }, h1("Home")));
const About: PageComponent = () => into("main", div({ id: "about" }, h1("About")));
const Modal: PageComponent = (_ctx, { layer }) =>
  into("main", div({ id: "modal" }, button({ id: "close", onClick: () => layer.close() }, "close")));
/** Fills two regions at once. */
const Docs: PageComponent = () => into({ main: div({ id: "docs" }), side: div({ id: "docs-links" }) });
/** A parent that keeps its child inside its own content. */
const Records: PageComponent = (_ctx, { outlet }) =>
  into("main", div({ id: "records" }, input({ id: "notes" }), main({ id: "child" }, outlet())));
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

const App = () => div({ id: "shell" }, Layout());

async function start(url: string) {
  const router = createRouter(table, { preload: false });
  window.history.replaceState(null, "", url);
  const route = await router.start();
  routes.push(route);
  return { route, container: mount() };
}

/** Element ids directly inside the outlet, in order. */
function outlet(container: HTMLElement): string[] {
  return [...container.querySelector("#outlet")!.children].map((c) => c.id);
}

describe("pages that return an into()", () => {
  it("land in the region, with nothing of the router's in the app tree", async () => {
    const { container } = await start("/");
    render(App, container);
    expect(outlet(container)).toEqual(["home"]);
    expect(container.querySelector("#none")).toBeNull();
    expect([...container.querySelector("#shell")!.childNodes].map((n) => (n as Element).id)).toEqual(["layout"]);
  });

  it("swap the page in the region without rebuilding the layout", async () => {
    const { route, container } = await start("/");
    render(App, container);
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
    const { route, container } = await start("/");
    render(App, container);
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
    const { route, container } = await start("/docs");
    render(App, container);
    expect(outlet(container)).toEqual(["docs"]);
    expect(container.querySelector("#side-host #docs-links")).not.toBeNull();

    await route.go("/");

    expect(outlet(container)).toEqual(["home"]);
    expect(container.querySelector("#docs-links")).toBeNull();
  });

  it("keep a parent's view while its child changes inside it", async () => {
    const { route, container } = await start("/records");
    render(App, container);
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
    const { route, container } = await start("/");
    render(App, container);
    expect(outlet(container)).toEqual(["home"]);

    route.stop();
    expect(outlet(container)).toEqual(["none"]);
  });

  describe("server-rendered", () => {
    async function ssr(url: string): Promise<string> {
      const router = createRouter(table);
      const route = await router.start(url);
      try {
        return route.run(() => renderToString(App));
      } finally {
        route.stop();
      }
    }

    it("emits the page between the region's markers and nothing else of the router's", async () => {
      const html = await ssr("/about");
      expect(html).toMatch(/<main id="outlet"><!--region-start-\d+-v1--><div id="about">.*<!--region-end--><\/main>/);
      expect(html).not.toContain("list-start");
      expect(html).not.toContain("<!--view-");
      expect(html).not.toContain("Nothing open.");
    });

    it("claims the server's page in place", async () => {
      const html = await ssr("/about");
      const { route, container } = await start("/about");
      container.innerHTML = html;
      const ssrPage = container.querySelector("#about")!;
      const ssrFilter = container.querySelector("#filter")!;

      hydrate(App, container);

      expect(container.querySelector("#about")).toBe(ssrPage);
      expect(container.querySelector("#filter")).toBe(ssrFilter);
      expect(container.querySelectorAll("#about").length).toBe(1);

      await route.go("/");
      expect(outlet(container)).toEqual(["home"]);
      expect(container.querySelector("#filter")).toBe(ssrFilter);
    });

    it("claims a parent view with its child inside it", async () => {
      const html = await ssr("/records/preview");
      const { container } = await start("/records/preview");
      container.innerHTML = html;
      const ssrRecords = container.querySelector("#records")!;
      const ssrPreview = container.querySelector("#preview")!;

      hydrate(App, container);

      expect(container.querySelector("#records")).toBe(ssrRecords);
      expect(container.querySelector("#preview")).toBe(ssrPreview);
      expect(container.querySelectorAll("#preview").length).toBe(1);
    });
  });
});
