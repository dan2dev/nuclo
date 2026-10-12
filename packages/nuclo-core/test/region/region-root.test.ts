/**
 * @vitest-environment jsdom
 */

/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, hydrate } from "../../src/render";
import { renderToString } from "../../src/ssr/render-to-string";
import "../../src";

/**
 * A marker-pair block (region, list, when) as the root of render()/hydrate().
 *
 * The block attaches both markers itself and returns the start marker. A root
 * that re-appended that node moved it after the end marker, and the region's
 * next placement crashed reading `endMarker.previousSibling`.
 */
describe("marker blocks as the render()/hydrate() root", () => {
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

  const markers = () =>
    [...container.childNodes].filter((n) => n.nodeType === 8).map((n) => n.textContent!.replace(/-\d+.*/, ""));

  it("keeps a root region's markers in order across view placements", () => {
    render(() => region({ id: "main" }), container);
    expect(markers()).toEqual(["region-start", "region-end"]);

    let pages = ["a"];
    const rows = document.createElement("div");
    document.body.appendChild(rows);
    render(list(() => pages, (name) => into("main", div({ id: name }, name))), rows);
    expect(container.querySelector("#a")).not.toBeNull();

    pages = ["b"];
    expect(() => update()).not.toThrow();
    expect(container.querySelector("#a")).toBeNull();
    expect(container.querySelector("#b")).not.toBeNull();
    expect(markers()).toEqual(["region-start", "region-end"]);
  });

  it("keeps root list() and when() markers in order", () => {
    render(list(() => [1], (n) => span(String(n))), container);
    expect(markers()).toEqual(["list-start", "list-end"]);

    container.innerHTML = "";
    render(when(() => true, span("x")), container);
    expect(markers()).toEqual(["when-start", "when-end"]);
  });

  it("hydrates a root region in place", () => {
    const App = () => region({ id: "main", empty: span("empty") });
    container.innerHTML = renderToString(App());
    hydrate(App, container);
    expect(markers()).toEqual(["region-start", "region-end"]);

    render(into("main", div({ id: "page" }, "page")), document.createElement("div"));
    expect(container.querySelector("#page")).not.toBeNull();
    expect(markers()).toEqual(["region-start", "region-end"]);
  });
});
