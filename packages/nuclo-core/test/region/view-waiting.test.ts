/**
 * @vitest-environment jsdom
 */

/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render } from "../../src/render";
import { viewWaiting } from "../../src";
import "../../src";

/**
 * viewWaiting(): whether the view() behind an anchor has nowhere to show.
 * The anchor is whatever the view's NodeModFn returned, captured here.
 */
describe("viewWaiting()", () => {
  let container: HTMLDivElement;
  let anchor: Node;

  /** Runs `fn` where it is placed and keeps the node it returns. */
  const capture =
    (fn: NodeModFn): NodeModFn =>
    (host, index) =>
      (anchor = fn(host, index) as Node);

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("is false for anything that is not a view's anchor", () => {
    expect(viewWaiting(document.createElement("div"))).toBe(false);
    expect(viewWaiting(document.createTextNode("x"))).toBe(false);
    expect(viewWaiting(document.createComment("view-1"))).toBe(false);
  });

  it("is true for a view whose region is not in the tree", () => {
    render(div(capture(view("mian", p("typo")))), container);
    expect(viewWaiting(anchor)).toBe(true);
  });

  it("is false once the view is placed, whichever was written first", () => {
    render(div(capture(view("main", p("page"))), region({ id: "main" })), container);
    expect(viewWaiting(anchor)).toBe(false);
  });

  it("turns false when a region with the id is built later", () => {
    let open = false;
    render(div(capture(view("side", p("x"))), when(() => open, region({ id: "side" }))), container);
    expect(viewWaiting(anchor)).toBe(true);

    open = true;
    update();
    expect(viewWaiting(anchor)).toBe(false);
  });

  it("turns true again when its region goes away", () => {
    let open = true;
    render(div(when(() => open, region({ id: "side" })), capture(view("side", p("x")))), container);
    expect(viewWaiting(anchor)).toBe(false);

    open = false;
    update();
    expect(viewWaiting(anchor)).toBe(true);
  });

  it("is false for a multi-region view when any one of its regions exists", () => {
    render(div(region({ id: "main" }), capture(view({ main: p("a"), nowhere: p("b") }))), container);
    expect(viewWaiting(anchor)).toBe(false);
  });

  it("is true for a multi-region view when none of its regions exists", () => {
    render(div(capture(view({ one: p("a"), two: p("b") }))), container);
    expect(viewWaiting(anchor)).toBe(true);
  });

  it("is false for a view that names no region", () => {
    render(div(capture(view({}))), container);
    expect(viewWaiting(anchor)).toBe(false);
  });

  it("is false for a view hidden under a newer one — it has a place, just not on top", () => {
    let first: Node | undefined;
    render(
      div(
        region({ id: "main" }),
        (host: ExpandedElement, index: number) => (first = view("main", p("under"))(host, index) as Node),
        view("main", p("over")),
      ),
      container,
    );
    expect(viewWaiting(first!)).toBe(false);
  });

  it("is false once the view itself is gone", () => {
    let open = true;
    render(div(when(() => open, capture(view("nowhere", p("x"))))), container);
    expect(viewWaiting(anchor)).toBe(true);

    open = false;
    update();
    expect(viewWaiting(anchor)).toBe(false);
  });
});
