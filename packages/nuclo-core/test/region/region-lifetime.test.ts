/**
 * @vitest-environment jsdom
 */

/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, forceUpdate } from "../../src/render";
import { pendingViewCount } from "../../src/region/runtime";
import "../../src";

/**
 * A view's content lives exactly as long as the view does.
 *
 * The view leaves an anchor comment where it was written; when nuclo removes
 * that anchor — the when() around the view closes, its list() row goes, the
 * tree it is in is replaced — the content leaves the region with it. Without
 * this a stack region would grow a copy of a layer every time it was opened,
 * and a closed modal would stay on screen.
 */
describe("region() / view() — content lifetime", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  /** Element ids inside the region's host, in order. */
  function idsIn(hostId = "main-host"): string[] {
    return [...container.querySelector(`#${hostId}`)!.children].map((c) => c.id);
  }

  it("takes the content out when the when() holding the view closes", () => {
    let open = true;
    render(
      div(
        div({ id: "main-host" }, region({ id: "main", type: "stack" })),
        view("main", div({ id: "base" }, input({ id: "field" }))),
        when(() => open, view("main", div({ id: "layer" }, "on top"))),
      ),
      container,
    );
    const base = container.querySelector("#base")!;
    expect(idsIn()).toEqual(["base", "layer"]);

    open = false;
    update();

    expect(idsIn()).toEqual(["base"]);
    expect(container.querySelector("#base")).toBe(base);
  });

  it("adds exactly one copy when a closed view opens again", () => {
    let open = false;
    render(
      div(
        div({ id: "main-host" }, region({ id: "main", type: "stack" })),
        when(() => open, view("main", div({ id: "layer" }, "on top"))),
      ),
      container,
    );

    for (let i = 0; i < 3; i++) {
      open = true;
      update();
      open = false;
      update();
    }
    open = true;
    update();

    expect(container.querySelectorAll("#layer").length).toBe(1);
  });

  it("falls back to `empty` when a simple region's only view goes", () => {
    let open = true;
    render(
      div(
        div({ id: "main-host" }, region({ id: "main", empty: p({ id: "none" }, "nothing") })),
        when(() => open, view("main", div({ id: "page" }, "page"))),
      ),
      container,
    );
    expect(idsIn()).toEqual(["page"]);

    open = false;
    update();

    expect(idsIn()).toEqual(["none"]);
  });

  it("leaves a stack's neighbours untouched when a middle view goes", () => {
    let middle = true;
    render(
      div(
        div({ id: "main-host" }, region({ id: "main", type: "stack" })),
        view("main", div({ id: "a" })),
        when(() => middle, view("main", div({ id: "b" }))),
        view("main", div({ id: "c" })),
      ),
      container,
    );
    const a = container.querySelector("#a")!;
    const c = container.querySelector("#c")!;
    expect(idsIn()).toEqual(["a", "b", "c"]);

    middle = false;
    update();

    expect(idsIn()).toEqual(["a", "c"]);
    expect(container.querySelector("#a")).toBe(a);
    expect(container.querySelector("#c")).toBe(c);

    middle = true;
    update();
    // Re-opened: it arrives last now, as any new view does.
    expect(idsIn()).toEqual(["a", "c", "b"]);
  });

  it("takes a list() row's view with the row", () => {
    const items = ["a", "b", "c"];
    render(
      div(
        div({ id: "main-host" }, region({ id: "main", type: "stack" })),
        ul(list(() => items, (item) => li({ id: `row-${item}` }, view("main", span({ id: item }, item))))),
      ),
      container,
    );
    const a = container.querySelector("#a")!;
    expect(idsIn()).toEqual(["a", "b", "c"]);

    items.splice(1, 1);
    update();

    expect(idsIn()).toEqual(["a", "c"]);
    expect(container.querySelector("#a")).toBe(a);
  });

  it("drops every row's view when a list() is cleared in bulk", () => {
    let items = ["a", "b", "c"];
    render(
      div(
        div({ id: "main-host" }, region({ id: "main", type: "stack", empty: p({ id: "none" }, "nothing") })),
        // The list spans its whole parent: list()'s single-write clear path.
        ul(list(() => items, (item) => li(view("main", span({ id: item }, item))))),
      ),
      container,
    );
    expect(idsIn()).toEqual(["a", "b", "c"]);

    items = [];
    update();

    expect(idsIn()).toEqual(["none"]);
  });

  it("keeps the content of a view whose content is a list() in sync", () => {
    const items = ["a"];
    render(
      div(
        div({ id: "main-host" }, region({ id: "main" })),
        view("main", list(() => items, (item) => span({ id: item }, item))),
      ),
      container,
    );
    expect(idsIn()).toEqual(["a"]);

    items.push("b");
    update();

    expect(idsIn()).toEqual(["a", "b"]);
  });

  it("removes a view whose content is a list() along with its rows", () => {
    const items = ["a", "b"];
    let open = true;
    render(
      div(
        div({ id: "main-host" }, region({ id: "main", type: "stack" })),
        view("main", div({ id: "base" })),
        when(() => open, view("main", list(() => items, (item) => span({ id: item }, item)))),
      ),
      container,
    );
    expect(idsIn()).toEqual(["base", "a", "b"]);

    open = false;
    update();

    expect(idsIn()).toEqual(["base"]);
    const host = container.querySelector("#main-host")!;
    // The list's own markers went too: only the region's pair is left.
    expect([...host.childNodes].filter((n) => n.nodeType === 8).length).toBe(2);
  });

  it("fires onDestroy for content a closing view takes out", () => {
    const destroyed = vi.fn();
    let open = true;
    render(
      div(
        div({ id: "main-host" }, region({ id: "main" })),
        when(() => open, view("main", div({ id: "page", onDestroy: destroyed }, "page"))),
      ),
      container,
    );
    expect(destroyed).not.toHaveBeenCalled();

    open = false;
    update();

    expect(destroyed).toHaveBeenCalledTimes(1);
  });

  it("does not leave a discarded tree's view in a live region", () => {
    render(div({ id: "main-host" }, region({ id: "main" })), container);
    const boom = ((_host: unknown, _index: number): Node => {
      throw new Error("boom");
    }) as NodeModFn;

    const other = document.createElement("div");
    document.body.appendChild(other);
    expect(() => render(div(view("main", div({ id: "page" }, "page")), boom), other)).toThrow("boom");

    // The view ran and placed its content before the build failed; the
    // discarded tree takes it back out.
    expect(container.querySelector("#page")).toBeNull();
  });

  it("keeps a view's content when the view's host is removed by hand", () => {
    // Raw removal is invisible to nuclo (see lifecycle.ts): the content stays,
    // like a listener on a hand-removed node keeps its registration.
    render(
      div(
        div({ id: "main-host" }, region({ id: "main" })),
        div({ id: "elsewhere" }, view("main", div({ id: "page" }, "page"))),
      ),
      container,
    );

    container.querySelector("#elsewhere")!.remove();

    expect(container.querySelector("#page")).not.toBeNull();
  });

  describe("bookkeeping", () => {
    it("keeps one waiting entry per view, however often its when() toggles", () => {
      let open = false;
      render(div(when(() => open, view("toggled", span("x")))), container);

      for (let i = 0; i < 20; i++) {
        open = true;
        update();
        open = false;
        update();
      }
      expect(pendingViewCount("toggled")).toBe(0);

      open = true;
      update();
      expect(pendingViewCount("toggled")).toBe(1);
    });

    it("forgets a waiting view whose tree was wiped behind nuclo's back, on the next update()", () => {
      render(div(view("wiped", span("x"))), container);
      expect(pendingViewCount("wiped")).toBe(1);

      container.innerHTML = "";
      update();

      expect(pendingViewCount("wiped")).toBe(0);
    });

    it("keeps one waiting entry per view across forceUpdate() passes", () => {
      const App = () => div(view("forced", span("x")));
      render(App, container);

      forceUpdate();
      forceUpdate();

      expect(pendingViewCount("forced")).toBe(1);
    });

    it("drops a waiting entry with the tree that is discarded on a failed render", () => {
      const boom = ((_host: unknown, _index: number): Node => {
        throw new Error("boom");
      }) as NodeModFn;
      expect(() => render(div(view("failed", span("x")), boom), container)).toThrow("boom");

      expect(pendingViewCount("failed")).toBe(0);
    });

    it("lets go of a layout wiped behind nuclo's back on the next update(), handing its views on", () => {
      const layoutRoot = document.createElement("div");
      document.body.appendChild(layoutRoot);
      render(div({ id: "main-host" }, region({ id: "main" })), layoutRoot);
      render(div(view("main", span({ id: "page" }, "page"))), container);
      expect(layoutRoot.querySelector("#page")).not.toBeNull();

      layoutRoot.innerHTML = "";
      update();
      expect(pendingViewCount("main")).toBe(1);

      const other = document.createElement("div");
      document.body.appendChild(other);
      render(div({ id: "main-host" }, region({ id: "main" })), other);

      expect(other.querySelector("#page")).not.toBeNull();
      expect(pendingViewCount("main")).toBe(0);
    });

    it("takes a wiped view's content out of a live region on the next update()", () => {
      const pageRoot = document.createElement("div");
      document.body.appendChild(pageRoot);
      render(div({ id: "main-host" }, region({ id: "main", empty: p({ id: "none" }, "nothing") })), container);
      render(div(view("main", span({ id: "page" }, "page"))), pageRoot);
      expect(idsIn()).toEqual(["page"]);

      pageRoot.innerHTML = "";
      update();

      expect(idsIn()).toEqual(["none"]);
    });
  });

  describe("a simple region with a view over another", () => {
    it("shows the view underneath again when the one on top leaves", () => {
      let open = false;
      render(
        div(
          div({ id: "main-host" }, region({ id: "main", empty: p({ id: "none" }, "nothing") })),
          view("main", div({ id: "page" }, "page")),
          when(() => open, view("main", div({ id: "layer" }, "layer"))),
        ),
        container,
      );
      expect(idsIn()).toEqual(["page"]);

      open = true;
      update();
      expect(idsIn()).toEqual(["layer"]);

      open = false;
      update();
      // Rebuilt, not kept: a simple region holds one view's DOM at a time.
      expect(idsIn()).toEqual(["page"]);
      expect(container.querySelector("#main-host")!.firstChild!.textContent).toBe("region-start-0-v1");
    });

    it("walks back down a stack of replaced views", () => {
      let depth = 0;
      render(
        div(
          div({ id: "main-host" }, region({ id: "main" })),
          view("main", div({ id: "base" })),
          when(() => depth >= 1, view("main", div({ id: "one" }))),
          when(() => depth >= 2, view("main", div({ id: "two" }))),
        ),
        container,
      );
      depth = 2;
      update();
      expect(idsIn()).toEqual(["two"]);

      depth = 1;
      update();
      expect(idsIn()).toEqual(["one"]);

      depth = 0;
      update();
      expect(idsIn()).toEqual(["base"]);
    });

    it("drops a replaced view whose own when() closes while it is underneath", () => {
      let base = true;
      let layer = true;
      render(
        div(
          div({ id: "main-host" }, region({ id: "main", empty: p({ id: "none" }, "nothing") })),
          when(() => base, view("main", div({ id: "base" }))),
          when(() => layer, view("main", div({ id: "layer" }))),
        ),
        container,
      );
      expect(idsIn()).toEqual(["layer"]);

      base = false;
      update();
      expect(idsIn()).toEqual(["layer"]);

      layer = false;
      update();
      expect(idsIn()).toEqual(["none"]);
    });

    it("hands replaced views back to waiting when the region goes, in order", () => {
      let layout = true;
      render(
        div(
          when(() => layout, div({ id: "main-host" }, region({ id: "main", type: "stack" }))),
          view("main", div({ id: "base" })),
          view("main", div({ id: "layer" })),
        ),
        container,
      );
      // Switch the region to the same id again: both views return, in order.
      layout = false;
      update();
      layout = true;
      update();
      expect(idsIn()).toEqual(["base", "layer"]);
    });
  });
});
