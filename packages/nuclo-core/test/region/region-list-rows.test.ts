/**
 * @vitest-environment jsdom
 */

/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, hydrate } from "../../src/render";
import { renderToString } from "../../src/ssr/render-to-string";
import "../../src";

/**
 * A list() row that is a view().
 *
 * This is how a page places itself: a router's list() renders the page, the
 * page returns `view("main", …)`, and the view's anchor is the row. The row
 * standing in the list is what keeps the content in the region; the row
 * leaving the list is what takes it out.
 */
describe("list() rows that are views", () => {
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

  function idsIn(hostId = "main-host"): string[] {
    return [...container.querySelector(`#${hostId}`)!.children].map((c) => c.id);
  }

  const Page = (name: string) => view("main", div({ id: name }, name));

  it("places the content in the region and keeps it across update() passes", () => {
    const pages = ["a"];
    render(
      div(
        div({ id: "main-host" }, region({ id: "main", type: "stack" })),
        ul({ id: "rows" }, list(() => pages, (name) => Page(name))),
      ),
      container,
    );
    expect(idsIn()).toEqual(["a"]);
    const a = container.querySelector("#a")!;

    update();
    update();

    expect(idsIn()).toEqual(["a"]);
    expect(container.querySelector("#a")).toBe(a);
    // The row is the view's anchor, between the list's markers.
    const rows = container.querySelector("#rows")!;
    expect([...rows.childNodes].map((n) => n.textContent!.replace(/-\d+.*/, ""))).toEqual(["list-start", "view", "list-end"]);
  });

  it("takes the content out when the row goes, and swaps it when the item changes", () => {
    let pages = ["a", "b"];
    render(
      div(
        div({ id: "main-host" }, region({ id: "main", type: "stack" })),
        ul(list(() => pages, (name) => Page(name))),
      ),
      container,
    );
    expect(idsIn()).toEqual(["a", "b"]);
    const a = container.querySelector("#a")!;

    pages = ["a"];
    update();
    expect(idsIn()).toEqual(["a"]);
    expect(container.querySelector("#a")).toBe(a);

    pages = ["c"];
    update();
    expect(idsIn()).toEqual(["c"]);
  });

  it("replaces the page in a simple region as the single item changes", () => {
    let current = "first";
    render(
      div(
        div({ id: "main-host" }, region({ id: "main", empty: p({ id: "none" }, "none") })),
        list(() => [current], (name) => Page(name)),
      ),
      container,
    );
    expect(idsIn()).toEqual(["first"]);

    current = "second";
    update();
    expect(idsIn()).toEqual(["second"]);
    expect(container.querySelectorAll("#first").length).toBe(0);
  });

  it("falls back to `empty` when the list is cleared in bulk", () => {
    let pages = ["a", "b", "c"];
    render(
      div(
        div({ id: "main-host" }, region({ id: "main", type: "stack", empty: p({ id: "none" }, "none") })),
        ul(list(() => pages, (name) => Page(name))),
      ),
      container,
    );
    expect(idsIn()).toEqual(["a", "b", "c"]);

    pages = [];
    update();

    expect(idsIn()).toEqual(["none"]);
  });

  it("waits for a region built after the list, then shows every row in order", () => {
    let layout = false;
    render(
      div(
        ul(list(() => ["a", "b"], (name) => Page(name))),
        when(() => layout, div({ id: "main-host" }, region({ id: "main", type: "stack" }))),
      ),
      container,
    );

    layout = true;
    update();

    expect(idsIn()).toEqual(["a", "b"]);
  });

  it("hydrates: the anchor row and the content in the region are both claimed", () => {
    const pages = ["a", "b"];
    const app = () =>
      div(
        div({ id: "main-host" }, region({ id: "main", type: "stack" })),
        ul({ id: "rows" }, list(() => pages, (name) => Page(name))),
      );
    container.innerHTML = renderToString(app());
    const a = container.querySelector("#a")!;
    const b = container.querySelector("#b")!;
    const anchors = [...container.querySelector("#rows")!.childNodes].filter((n) => n.textContent!.startsWith("view-"));
    expect(anchors.length).toBe(2);

    hydrate(app, container);

    expect(container.querySelector("#a")).toBe(a);
    expect(container.querySelector("#b")).toBe(b);
    expect(idsIn()).toEqual(["a", "b"]);
    const after = [...container.querySelector("#rows")!.childNodes].filter((n) => n.textContent!.startsWith("view-"));
    expect(after).toEqual(anchors);
  });

  it("hydrates a client that renders fewer rows than the server", () => {
    const app = (pages: string[]) => () =>
      div(
        div({ id: "main-host" }, region({ id: "main", type: "stack" })),
        ul(list(() => pages, (name) => Page(name))),
      );
    container.innerHTML = renderToString(app(["a", "b"])());
    const a = container.querySelector("#a")!;

    hydrate(app(["a"]), container);

    expect(container.querySelector("#a")).toBe(a);
    expect(idsIn()).toEqual(["a"]);
  });

  it("leaves other comment results out, as before", () => {
    // A when() handed back as a row result inserts its own markers into the
    // host; it is not a row and must not be treated as one.
    render(
      div(
        div({ id: "main-host" }, region({ id: "main" })),
        ul({ id: "rows" }, list(() => [1], () => when(() => true, li({ id: "x" })) as unknown as ListRenderResult)),
      ),
      container,
    );
    expect(container.querySelector("#x")).not.toBeNull();
    expect(idsIn()).toEqual([]);
  });
});
