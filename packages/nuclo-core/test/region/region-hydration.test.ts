/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { hydrate, render, forceUpdate } from "../../src/render";
import { update } from "../../src/update/update";
import { renderToString } from "../../src/ssr/render-to-string";
import "../../src";

/**
 * A region's content is built by an into() somewhere else in the tree, so the
 * hydration cursor cannot simply walk it: the region parks a claim cursor of
 * its own between its markers and each into() claims from there in turn.
 *
 * These tests round-trip through renderToString and then assert on *node
 * identity* — hydration that rebuilds the server's DOM looks identical in
 * every other way.
 */
describe("region() hydration", () => {
  let container: HTMLDivElement;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    container.id = "app";
    document.body.appendChild(container);
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => warn.mockRestore());

  const stacked = (layers: readonly string[]) => () =>
    div(
      div({ id: "main-host" }, region({ id: "main", type: "stack", empty: p({ id: "none" }, "empty") })),
      ...layers.map((name) => into("main", section({ id: name }, name))),
    );

  it("claims the server's nodes instead of rebuilding them", () => {
    container.innerHTML = renderToString(stacked(["page"])());
    const server = container.querySelector("#page")!;

    hydrate(stacked(["page"]), container);

    expect(container.querySelector("#page")).toBe(server);
    expect(container.querySelectorAll("#page").length).toBe(1);
  });

  it("claims a whole stack of views in order", () => {
    container.innerHTML = renderToString(stacked(["base", "layer"])());
    const base = container.querySelector("#base")!;
    const layer = container.querySelector("#layer")!;

    hydrate(stacked(["base", "layer"]), container);

    expect(container.querySelector("#base")).toBe(base);
    expect(container.querySelector("#layer")).toBe(layer);
    const host = container.querySelector("#main-host")!;
    expect([...host.children].map((c) => c.id)).toEqual(["base", "layer"]);
  });

  it("drops server views the client no longer renders", () => {
    container.innerHTML = renderToString(stacked(["base", "layer"])());
    const base = container.querySelector("#base")!;

    // A reload lands on the base page alone: the pushed layer is not reopened.
    hydrate(stacked(["base"]), container);

    expect(container.querySelector("#base")).toBe(base);
    expect(container.querySelector("#layer")).toBeNull();
  });

  it("falls back to `empty` when the client renders no views at all", () => {
    container.innerHTML = renderToString(stacked(["page"])());

    hydrate(stacked([]), container);

    expect(container.querySelector("#page")).toBeNull();
    expect(container.querySelector("#none")!.textContent).toBe("empty");
  });

  it("claims the server's `empty` content when neither side has a view", () => {
    container.innerHTML = renderToString(stacked([])());
    const none = container.querySelector("#none")!;

    hydrate(stacked([]), container);

    expect(container.querySelector("#none")).toBe(none);
    expect(container.querySelectorAll("#none").length).toBe(1);
  });

  it("replaces the server's `empty` content with a view the client has", () => {
    container.innerHTML = renderToString(stacked([])());

    hydrate(stacked(["page"]), container);

    expect(container.querySelector("#none")).toBeNull();
    expect(container.querySelector("#page")!.textContent).toBe("page");
  });

  it("leaves the host's own children after the region alone", () => {
    const app = () => () =>
      div(
        div({ id: "main-host" }, region({ id: "main" }), span({ id: "after" }, "sibling")),
        into("main", section({ id: "page" }, "page")),
      );
    container.innerHTML = renderToString(app()());
    const after = container.querySelector("#after")!;
    const page = container.querySelector("#page")!;

    hydrate(app(), container);

    expect(container.querySelector("#after")).toBe(after);
    expect(container.querySelector("#page")).toBe(page);
    const host = container.querySelector("#main-host")!;
    expect([...host.children].map((c) => c.id)).toEqual(["page", "after"]);
  });

  it("builds the region fresh when the markup has no region markers", () => {
    container.innerHTML = "<div><div id='main-host'></div></div>";

    hydrate(stacked(["page"]), container);

    expect(container.querySelector("#page")!.textContent).toBe("page");
    expect(warn).not.toHaveBeenCalled();
  });

  it("claims the view's anchor where the view was written", () => {
    const app = () => () =>
      div(
        div({ id: "main-host" }, region({ id: "main" })),
        div({ id: "elsewhere" }, into("main", section({ id: "page" }, "page"))),
      );
    container.innerHTML = renderToString(app()());
    const elsewhere = container.querySelector("#elsewhere")!;
    const anchor = elsewhere.firstChild!;
    expect(anchor.nodeType).toBe(8);

    hydrate(app(), container);

    expect(elsewhere.childNodes.length).toBe(1);
    expect(elsewhere.firstChild).toBe(anchor);
  });

  it("claims the server's nodes for a view written before its region", () => {
    const app = () => () =>
      div(
        into("main", section({ id: "page" }, "page")),
        div({ id: "main-host" }, region({ id: "main", empty: p({ id: "none" }, "empty") })),
      );
    container.innerHTML = renderToString(app()());
    const page = container.querySelector("#page")!;

    hydrate(app(), container);

    expect(container.querySelector("#page")).toBe(page);
    expect(container.querySelectorAll("#page").length).toBe(1);
    expect(container.querySelector("#none")).toBeNull();
  });

  it("puts a client-only view inside the region, ahead of the markup it has not claimed yet", () => {
    let flag = false;
    const app = () => () =>
      div(
        div({ id: "main-host" }, region({ id: "main", type: "stack" })),
        // On the server this branch is off; on the client it is on, so the
        // view inside is built fresh while the region still holds a's markup.
        when(() => flag, into("main", section({ id: "b" }, "b"))),
        into("main", section({ id: "a" }, "a")),
      );
    container.innerHTML = renderToString(app()());
    const a = container.querySelector("#a")!;

    flag = true;
    hydrate(app(), container);

    const host = container.querySelector("#main-host")!;
    expect([...host.children].map((c) => c.id)).toEqual(["b", "a"]);
    expect(container.querySelector("#a")).toBe(a);
    // Both sit between the region's markers.
    const kinds = [...host.childNodes].map((n) => (n.nodeType === 8 ? n.textContent!.split("-")[0] : (n as Element).id));
    expect(kinds).toEqual(["region", "b", "a", "region"]);
  });

  it("claims a region nested in a view's content, and the view that fills it", () => {
    const app = () => () =>
      div(
        div({ id: "main-host" }, region({ id: "main" })),
        into("main", div({ id: "inner-host" }, region({ id: "inner" }))),
        into("inner", span({ id: "deep" }, "deep")),
      );
    container.innerHTML = renderToString(app()());
    const deep = container.querySelector("#deep")!;
    const innerHost = container.querySelector("#inner-host")!;

    hydrate(app(), container);

    expect(container.querySelector("#inner-host")).toBe(innerHost);
    expect(container.querySelector("#deep")).toBe(deep);
    expect(container.querySelectorAll("#deep").length).toBe(1);
  });

  it("claims region markers that sit directly inside another region's markers", () => {
    // Both pairs share one host, so the outer pair's end is found by depth.
    const app = () => () =>
      div(
        div({ id: "main-host" }, region({ id: "main" })),
        into("main", region({ id: "inner" })),
        into("inner", span({ id: "deep" }, "deep")),
      );
    container.innerHTML = renderToString(app()());
    const deep = container.querySelector("#deep")!;

    hydrate(app(), container);

    expect(container.querySelector("#deep")).toBe(deep);
    const host = container.querySelector("#main-host")!;
    expect([...host.childNodes].filter((n) => n.nodeType === 8).map((n) => n.textContent)).toEqual([
      "region-start-0-v1",
      "region-start-0-v1",
      "region-end",
      "region-end",
    ]);
  });

  it("claims text and reactive text inside a view, and keeps the text live", () => {
    let count = 1;
    const app = () => () =>
      div(
        div({ id: "main-host" }, region({ id: "main" })),
        into("main", "plain ", () => `count ${count}`),
      );
    container.innerHTML = renderToString(app()());
    const host = container.querySelector("#main-host")!;
    const texts = [...host.childNodes].filter((n) => n.nodeType === 3);
    expect(texts.map((t) => t.textContent)).toEqual(["plain ", "count 1"]);

    hydrate(app(), container);

    const after = [...host.childNodes].filter((n) => n.nodeType === 3);
    expect(after[0]).toBe(texts[0]);
    expect(after[1]).toBe(texts[1]);

    count = 2;
    update();
    expect(host.textContent).toBe("plain count 2");
  });

  it("steps over a formatter's whitespace inside the region", () => {
    const html = renderToString(stacked(["page"])());
    container.innerHTML = html
      .replace("<!--region-start-0-v1-->", "<!--region-start-0-v1-->\n    ")
      .replace("<!--region-end-->", "\n  <!--region-end-->");
    const page = container.querySelector("#page")!;

    hydrate(stacked(["page"]), container);

    expect(container.querySelector("#page")).toBe(page);
    expect(container.querySelectorAll("#page").length).toBe(1);
  });

  it("renders fresh a client view the server did not have, after the claimed ones", () => {
    container.innerHTML = renderToString(stacked(["base"])());
    const base = container.querySelector("#base")!;

    hydrate(stacked(["base", "layer"]), container);

    expect(container.querySelector("#base")).toBe(base);
    const host = container.querySelector("#main-host")!;
    expect([...host.children].map((c) => c.id)).toEqual(["base", "layer"]);
    expect(host.lastChild!.textContent).toBe("region-end");
  });

  it("hydrates twice over the same tree without duplicating anything", () => {
    const app = () =>
      div(
        div({ id: "main-host" }, region({ id: "main", type: "stack" })),
        into("main", section({ id: "page" }, input({ id: "field" }))),
      );
    container.innerHTML = renderToString(app());

    hydrate(app, container);
    const page = container.querySelector("#page")!;
    hydrate(app, container);

    expect(container.querySelectorAll("#page").length).toBe(1);
    expect(container.querySelector("#page")).toBe(page);
  });

  it("claims a view written inside the region's own host", () => {
    const app = () => () =>
      div(
        { id: "main-host" },
        region({ id: "main" }),
        section({ id: "after" }, article(into("main", span({ id: "page" }, "page")))),
      );
    container.innerHTML = renderToString(app()());
    const page = container.querySelector("#page")!;
    const after = container.querySelector("#after")!;

    hydrate(app(), container);

    expect(container.querySelector("#page")).toBe(page);
    expect(container.querySelector("#after")).toBe(after);
    expect([...container.querySelector("#main-host")!.children].map((c) => c.id)).toEqual(["page", "after"]);
  });

  it("claims two regions in one host, filled through each other", () => {
    const app = () => () =>
      div(
        main({ id: "main-host" }, region({ id: "a" }), region({ id: "b" })),
        into("a", div({ id: "in-a" }, into("b", span({ id: "in-b" }, "b")))),
      );
    container.innerHTML = renderToString(app()());
    const inA = container.querySelector("#in-a")!;
    const inB = container.querySelector("#in-b")!;

    hydrate(app(), container);

    expect(container.querySelector("#in-a")).toBe(inA);
    expect(container.querySelector("#in-b")).toBe(inB);
    const host = container.querySelector("#main-host")!;
    expect([...host.childNodes].map((n) => (n.nodeType === 8 ? n.textContent : (n as Element).id))).toEqual([
      "region-start-0-v1",
      "in-a",
      "region-end",
      "region-start-1-v1",
      "in-b",
      "region-end",
    ]);
  });

  it("claims a view placed from inside another view's content into the same region", () => {
    const app = () => () =>
      div(
        div({ id: "main-host" }, region({ id: "main", type: "stack" })),
        into("main", div({ id: "outer" }, "outer", into("main", div({ id: "inner" }, "inner")))),
      );
    container.innerHTML = renderToString(app()());
    const outer = container.querySelector("#outer")!;
    const inner = container.querySelector("#inner")!;

    hydrate(app(), container);

    expect(container.querySelector("#outer")).toBe(outer);
    expect(container.querySelector("#inner")).toBe(inner);
    const host = container.querySelector("#main-host")!;
    expect([...host.children].map((c) => c.id)).toEqual(["outer", "inner"]);
  });

  it("steps over a formatter's whitespace around the view's anchor", () => {
    const app = () => () =>
      div(div({ id: "main-host" }, region({ id: "main" })), div({ id: "from" }, into("main", span({ id: "page" }, "page"))));
    container.innerHTML = renderToString(app()()).replace(
      /<div id="from">(<!--view-\d+-->)<\/div>/,
      '<div id="from">\n  $1\n</div>',
    );
    const page = container.querySelector("#page")!;
    const from = container.querySelector("#from")!;
    const anchor = [...from.childNodes].find((n) => n.nodeType === 8)!;

    hydrate(app(), container);

    expect(container.querySelector("#page")).toBe(page);
    expect([...from.childNodes].filter((n) => n.nodeType === 8)).toEqual([anchor]);
  });

  it("claims an empty into()", () => {
    const app = () => () =>
      div(div({ id: "main-host" }, region({ id: "main", empty: p({ id: "none" }, "nothing") })), into("main"));
    container.innerHTML = renderToString(app()());
    expect(container.querySelector("#none")).toBeNull();

    hydrate(app(), container);

    expect(container.querySelector("#none")).toBeNull();
    expect(container.querySelector("#main-host")!.firstChild!.textContent).toBe("region-start-0-v1");
  });

  describe("forceUpdate()", () => {
    it("reclaims a view's content in place, keeping its state", () => {
      const App = () =>
        div(
          div({ id: "main-host" }, region({ id: "main", type: "stack" })),
          into("main", section({ id: "page" }, input({ id: "field" }))),
        );
      render(App, container);
      const field = container.querySelector<HTMLInputElement>("#field")!;
      field.value = "typed";

      forceUpdate();

      expect(container.querySelector("#field")).toBe(field);
      expect(field.value).toBe("typed");
      expect(container.querySelectorAll("#page").length).toBe(1);
    });

    it("reclaims a view written before its region", () => {
      const App = () =>
        div(
          into("main", section({ id: "page" }, input({ id: "field" }))),
          div({ id: "main-host" }, region({ id: "main", type: "stack" })),
        );
      render(App, container);
      const field = container.querySelector<HTMLInputElement>("#field")!;
      field.value = "typed";

      forceUpdate();

      expect(container.querySelector("#field")).toBe(field);
      expect(field.value).toBe("typed");
      expect(container.querySelectorAll("#page").length).toBe(1);
    });

    it("re-evaluates static values inside a view", () => {
      let label = "before";
      const App = () => div(div({ id: "main-host" }, region({ id: "main" })), into("main", p({ id: "text" }, label)));
      render(App, container);
      const text = container.querySelector("#text")!;

      label = "after";
      forceUpdate();

      expect(container.querySelector("#text")).toBe(text);
      expect(text.textContent).toBe("after");
    });

    it("takes a view out when its when() is now off", () => {
      let open = true;
      const App = () =>
        div(
          div({ id: "main-host" }, region({ id: "main", type: "stack" })),
          into("main", section({ id: "base" }, "base")),
          when(() => open, into("main", section({ id: "layer" }, "layer"))),
        );
      render(App, container);
      const base = container.querySelector("#base")!;

      open = false;
      forceUpdate();

      const host = container.querySelector("#main-host")!;
      expect([...host.children].map((c) => c.id)).toEqual(["base"]);
      expect(container.querySelector("#base")).toBe(base);
    });

    it("adds a view whose when() just turned on", () => {
      let open = false;
      const App = () =>
        div(
          div({ id: "main-host" }, region({ id: "main", type: "stack" })),
          into("main", section({ id: "base" }, "base")),
          when(() => open, into("main", section({ id: "layer" }, "layer"))),
        );
      render(App, container);
      const base = container.querySelector("#base")!;

      open = true;
      forceUpdate();

      const host = container.querySelector("#main-host")!;
      expect([...host.children].map((c) => c.id)).toEqual(["base", "layer"]);
      expect(container.querySelector("#base")).toBe(base);
    });

    it("re-claims the `empty` content in place", () => {
      let label = "nothing";
      const App = () => div(div({ id: "main-host" }, region({ id: "main", empty: p({ id: "none" }, label) })));
      render(App, container);
      const none = container.querySelector("#none")!;

      label = "still nothing";
      forceUpdate();

      expect(container.querySelector("#none")).toBe(none);
      expect(none.textContent).toBe("still nothing");
      expect(container.querySelectorAll("#none").length).toBe(1);
    });

    it("replaces a view's content that changed shape, leaving nothing behind", () => {
      let wide = true;
      const App = () =>
        div(
          div({ id: "main-host" }, region({ id: "main", type: "stack" })),
          into("main", wide ? div({ id: "wide" }, span("w"), span("w")) : span({ id: "narrow" }, "n")),
          into("main", section({ id: "after" }, "after")),
        );
      render(App, container);
      const after = container.querySelector("#after")!;

      wide = false;
      forceUpdate();

      const host = container.querySelector("#main-host")!;
      expect([...host.children].map((c) => c.id)).toEqual(["narrow", "after"]);
      expect(container.querySelector("#after")).toBe(after);
    });

    it("keeps a view in a root that is not re-run when another root is", () => {
      // The view's root was rendered from a built tree, so forceUpdate()
      // cannot re-run it; the region's root can. The view must survive.
      const layoutRoot = document.createElement("div");
      document.body.appendChild(layoutRoot);
      render(div(into("main", section({ id: "page" }, "page"))), container);
      const Layout = () => div(div({ id: "main-host" }, region({ id: "main", type: "stack" })));
      render(Layout, layoutRoot);
      const page = layoutRoot.querySelector("#page")!;

      forceUpdate();

      expect(layoutRoot.querySelector("#page")).toBe(page);
      expect(layoutRoot.querySelectorAll("#page").length).toBe(1);
    });
  });
});
