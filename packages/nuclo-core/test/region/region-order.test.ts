/**
 * @vitest-environment jsdom
 */

/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render } from "../../src/render";
import "../../src";

/**
 * A into() and its region() can be written, and built, in any order.
 *
 * A view whose region does not exist yet waits — for as long as the view's
 * own anchor is in the tree — and shows the moment a region with that id is
 * built, in the order the views arrived. A region that goes away (its when()
 * closes) hands its views back to waiting, so a region that returns under the
 * same id shows them again.
 */
describe("region() / into() — order independence", () => {
  let container: HTMLDivElement;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
    document.body.innerHTML = "";
  });

  /** The region's content, markers excluded. */
  function contentOf(id = "main", root: ParentNode = document): string {
    const host = root.querySelector(`#${id}-host`);
    if (!host) return "(no host)";
    return [...host.childNodes]
      .filter((n) => n.nodeType !== 8)
      .map((n) => (n as Element).outerHTML ?? n.textContent)
      .join("");
  }

  it("renders a view written before its region, in the same tree", () => {
    render(
      div(
        div({ id: "elsewhere" }, into("main", span({ id: "page" }, "hello"))),
        div({ id: "main-host" }, region({ id: "main" })),
      ),
      container,
    );

    expect(contentOf()).toBe('<span id="page">hello</span>');
    expect(container.querySelector("#elsewhere")!.children.length).toBe(0);
    expect(warn).not.toHaveBeenCalled();
  });

  it("pulls an existing view into a region created later, deep down the tree", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    let ready = false;
    render(
      div(
        into("main", span({ id: "page" }, "page")),
        section(article(when(() => ready, div({ id: "main-host" }, region({ id: "main" }))))),
      ),
      container,
    );
    // No region yet: the view just waits. No warning, no error, no throw.
    expect(container.querySelector("#page")).toBeNull();
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();

    // The region is built in an ordinary update() and takes the view itself.
    ready = true;
    update();

    expect(contentOf()).toBe('<span id="page">page</span>');
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it("fills a region rendered into a different root, later", () => {
    const pageRoot = document.createElement("div");
    const layoutRoot = document.createElement("div");
    document.body.append(pageRoot, layoutRoot);

    render(div(into("main", span({ id: "page" }, "page"))), pageRoot);
    expect(document.querySelector("#page")).toBeNull();

    render(div({ id: "main-host" }, region({ id: "main" })), layoutRoot);

    expect(contentOf("main", layoutRoot)).toBe('<span id="page">page</span>');
    expect(pageRoot.querySelector("#page")).toBeNull();
  });

  it("keeps arrival order for several waiting views in a stack", () => {
    render(
      div(
        into("main", span({ id: "first" }, "one")),
        into("main", span({ id: "second" }, "two")),
        div({ id: "main-host" }, region({ id: "main", type: "stack" })),
      ),
      container,
    );

    expect(contentOf()).toBe('<span id="first">one</span><span id="second">two</span>');
  });

  it("keeps only the newest waiting view in a latest region", () => {
    render(
      div(
        into("main", span({ id: "first" }, "one")),
        into("main", span({ id: "second" }, "two")),
        div({ id: "main-host" }, region({ id: "main" })),
      ),
      container,
    );

    expect(contentOf()).toBe('<span id="second">two</span>');
  });

  it("replaces `empty` with the view that was already waiting", () => {
    render(
      div(
        into("main", span({ id: "page" }, "page")),
        div({ id: "main-host" }, region({ id: "main", empty: p({ id: "none" }, "nothing") })),
      ),
      container,
    );

    expect(contentOf()).toBe('<span id="page">page</span>');
    expect(container.querySelector("#none")).toBeNull();
  });

  it("never renders a waiting view that was removed before its region arrived", () => {
    let show = true;
    let layout = false;
    render(
      div(
        when(() => show, into("main", span({ id: "page" }, "page"))),
        when(() => layout, div({ id: "main-host" }, region({ id: "main", empty: p({ id: "none" }, "nothing") }))),
      ),
      container,
    );

    show = false;
    update();
    layout = true;
    update();

    expect(contentOf()).toBe('<p id="none">nothing</p>');
  });

  it("fills the regions of one into({ … }) as each of them arrives", () => {
    let aside = false;
    render(
      div(
        into({ main: span({ id: "page" }, "page"), aside: span({ id: "links" }, "links") }),
        div({ id: "main-host" }, region({ id: "main" })),
        when(() => aside, div({ id: "aside-host" }, region({ id: "aside" }))),
      ),
      container,
    );

    expect(contentOf()).toBe('<span id="page">page</span>');
    expect(container.querySelector("#links")).toBeNull();

    aside = true;
    update();

    expect(contentOf("aside")).toBe('<span id="links">links</span>');
    expect(contentOf()).toBe('<span id="page">page</span>');
  });

  it("routes an into() nested in waiting content once that content renders", () => {
    let aside = false;
    render(
      div(
        into("main", div({ id: "page" }, "page", into("aside", span({ id: "links" }, "links")))),
        div({ id: "main-host" }, region({ id: "main" })),
        when(() => aside, div({ id: "aside-host" }, region({ id: "aside" }))),
      ),
      container,
    );

    expect(container.querySelector("#page")).not.toBeNull();
    expect(container.querySelector("#links")).toBeNull();

    aside = true;
    update();

    expect(contentOf("aside")).toBe('<span id="links">links</span>');
  });

  it("shows a waiting view again when its region comes back", () => {
    let layout = true;
    render(
      div(
        when(() => layout, div({ id: "main-host" }, region({ id: "main" }))),
        into("main", input({ id: "field" })),
      ),
      container,
    );
    expect(container.querySelector("#field")).not.toBeNull();

    layout = false;
    update();
    expect(container.querySelector("#field")).toBeNull();

    layout = true;
    update();
    expect(container.querySelectorAll("#field").length).toBe(1);
    expect(contentOf()).toBe('<input id="field">');
  });

  it("keeps showing the views of a stack when the layout switches", () => {
    let variant: "a" | "b" = "a";
    render(
      div(
        when(() => variant === "a", div({ id: "a-host" }, region({ id: "main", type: "stack" })))
          .else(div({ id: "b-host" }, region({ id: "main", type: "stack" }))),
        into("main", span({ id: "base" }, "base")),
        into("main", span({ id: "layer" }, "layer")),
      ),
      container,
    );
    expect(contentOf("a")).toBe('<span id="base">base</span><span id="layer">layer</span>');

    variant = "b";
    update();

    expect(container.querySelector("#a-host")).toBeNull();
    expect(contentOf("b")).toBe('<span id="base">base</span><span id="layer">layer</span>');
    // The old region was gone before the new one registered: no id clash.
    expect(warn).not.toHaveBeenCalled();
  });

  it("adds a waiting view once, however many update() passes follow", () => {
    let layout = false;
    render(
      div(
        into("main", span({ id: "page" }, "page")),
        when(() => layout, div({ id: "main-host" }, region({ id: "main", type: "stack" }))),
      ),
      container,
    );

    layout = true;
    update();
    update();
    update();

    expect(container.querySelectorAll("#page").length).toBe(1);
  });

  it("lets a list() row's view wait for a region built after the list", () => {
    const items = ["a", "b"];
    render(
      div(
        ul(list(() => items, (item) => li(into("main", span({ id: item }, item))))),
        div({ id: "main-host" }, region({ id: "main", type: "stack" })),
      ),
      container,
    );

    expect(contentOf()).toBe('<span id="a">a</span><span id="b">b</span>');
  });

  it("fires onMount for content placed when the region arrives in an update()", () => {
    const mounted = vi.fn();
    let layout = false;
    render(
      div(
        into("main", span({ id: "page", onMount: mounted }, "page")),
        when(() => layout, div({ id: "main-host" }, region({ id: "main" }))),
      ),
      container,
    );
    expect(mounted).not.toHaveBeenCalled();

    layout = true;
    update();

    expect(mounted).toHaveBeenCalledTimes(1);
    expect(mounted.mock.calls[0][0]).toBe(container.querySelector("#page"));
  });

  it("renders a view written inside the region's own host, between the markers", () => {
    render(
      div(
        { id: "main-host" },
        region({ id: "main" }),
        section({ id: "after" }, article(into("main", span({ id: "page" }, "page")))),
      ),
      container,
    );

    const host = container.querySelector("#main-host")!;
    expect([...host.children].map((c) => c.id)).toEqual(["page", "after"]);
    expect(container.querySelector("#after span")).toBeNull();
  });

  it("renders a view written in an ancestor of the region's host", () => {
    render(
      div(
        into("main", span({ id: "page" }, "page")),
        section(article(div({ id: "main-host" }, region({ id: "main" })))),
      ),
      container,
    );

    expect(contentOf()).toBe('<span id="page">page</span>');
  });

  it("accepts an into() as the whole rendered tree", () => {
    render(into("main", span({ id: "page" }, "page")), container);
    expect(container.childNodes.length).toBe(1);
    expect(container.firstChild!.nodeType).toBe(8);

    render(div({ id: "main-host" }, region({ id: "main" })), container);

    expect(contentOf()).toBe('<span id="page">page</span>');
  });

  it("fills regions that list() rows create later, each from its own waiting view", () => {
    const rows: string[] = [];
    render(
      div(
        into("row-a", span({ id: "for-a" }, "A")),
        into("row-b", span({ id: "for-b" }, "B")),
        ul(list(() => rows, (row) => li({ id: `${row}-host` }, region({ id: row })))),
      ),
      container,
    );

    rows.push("row-b");
    update();
    expect(contentOf("row-b")).toBe('<span id="for-b">B</span>');
    expect(container.querySelector("#for-a")).toBeNull();

    rows.unshift("row-a");
    update();
    expect(contentOf("row-a")).toBe('<span id="for-a">A</span>');
    expect(contentOf("row-b")).toBe('<span id="for-b">B</span>');
  });

  it("brings a region nested in a view's content back with the view", () => {
    let open = true;
    render(
      div(
        div({ id: "main-host" }, region({ id: "main" })),
        when(() => open, into("main", div({ id: "inner-host" }, region({ id: "inner" })))),
        into("inner", span({ id: "deep" }, "deep")),
      ),
      container,
    );
    expect(contentOf("inner")).toBe('<span id="deep">deep</span>');

    open = false;
    update();
    expect(container.querySelector("#deep")).toBeNull();

    open = true;
    update();
    expect(contentOf("inner")).toBe('<span id="deep">deep</span>');
    expect(container.querySelectorAll("#deep").length).toBe(1);
  });

  it("takes the views nested in a latest region's old content out with it", () => {
    render(
      div(
        div({ id: "main-host" }, region({ id: "main" })),
        div({ id: "aside-host" }, region({ id: "aside" })),
        into("main", div({ id: "first" }, into("aside", span({ id: "links" }, "links")))),
      ),
      container,
    );
    expect(contentOf("aside")).toBe('<span id="links">links</span>');

    render(into("main", div({ id: "second" }, "second")), container);

    expect(contentOf()).toBe('<div id="second">second</div>');
    expect(contentOf("aside")).toBe("");
  });

  describe("a view placed from inside another view's content, into the same region", () => {
    it("stacks after the content that placed it", () => {
      render(
        div(
          div({ id: "main-host" }, region({ id: "main", type: "stack" })),
          into("main", div({ id: "outer" }, "outer", into("main", div({ id: "inner" }, "inner")))),
        ),
        container,
      );

      const host = container.querySelector("#main-host")!;
      expect([...host.children].map((c) => c.id)).toEqual(["outer", "inner"]);
      expect(host.firstChild!.textContent).toBe("region-start-0-v2");
    });

    it("replaces the content that placed it in a latest region", () => {
      render(
        div(
          div({ id: "main-host" }, region({ id: "main" })),
          into("main", div({ id: "outer" }, "outer", into("main", div({ id: "inner" }, "inner")))),
        ),
        container,
      );

      const host = container.querySelector("#main-host")!;
      expect([...host.children].map((c) => c.id)).toEqual(["inner"]);
      expect(warn).not.toHaveBeenCalled();
    });

    it("goes when the content that placed it goes", () => {
      let open = true;
      render(
        div(
          div({ id: "main-host" }, region({ id: "main", type: "stack" })),
          into("main", div({ id: "base" }, "base")),
          when(() => open, into("main", div({ id: "outer" }, into("main", div({ id: "inner" }))))),
        ),
        container,
      );
      const host = container.querySelector("#main-host")!;
      expect([...host.children].map((c) => c.id)).toEqual(["base", "outer", "inner"]);

      open = false;
      update();

      expect([...host.children].map((c) => c.id)).toEqual(["base"]);
    });
  });
});
