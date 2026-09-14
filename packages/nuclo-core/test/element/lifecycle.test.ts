/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../../src/index";
import { render, hydrate } from "../../src/render";
import { renderToString } from "../../src/ssr/render-to-string";
import { update } from "../../src/update/update";
import { list } from "../../src/list";
import { when } from "../../src/when";
import { on } from "../../src/element/events";
import {
  registerMount,
  registerDestroy,
  flushMountQueue,
  disposeElementLifecycle,
} from "../../src/element/lifecycle";
import { updateConditionalElements } from "../../src/update/conditional";
import { analyzeFactory } from "../../src/list/template";
import { createHtmlConditionalElement } from "../helpers/conditionalTestHelpers";

describe("lifecycle: on(\"mount\"/\"destroy\") and { onMount / onDestroy }", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  // ── Mount timing ────────────────────────────────────────────────────────

  it("does not fire while the tree is still being built", () => {
    let fired = false;
    // Building the factory (calling div(...)) must not itself invoke onMount —
    // only actually rendering it should.
    const factory = div(on("mount", () => { fired = true; }));
    expect(fired).toBe(false);
    void factory;
  });

  it("fires after render(), with the element already connected", () => {
    let connectedAtCallTime: boolean | null = null;
    const el = render(
      div(on("mount", (e) => { connectedAtCallTime = e.isConnected; })),
      container,
    );
    expect(connectedAtCallTime).toBe(true);
    expect(el.isConnected).toBe(true);
  });

  it("{ onMount } attribute behaves the same as on(\"mount\")", () => {
    const mount = vi.fn();
    render(div({ onMount: mount }), container);
    expect(mount).toHaveBeenCalledTimes(1);
    expect((mount.mock.calls[0][0] as HTMLElement).isConnected).toBe(true);
  });

  it("fires every registration on the same element, in registration order", () => {
    const calls: number[] = [];
    render(
      div(
        { onMount: () => calls.push(1) },
        on("mount", () => calls.push(2)),
        on("mount", () => calls.push(3)),
      ),
      container,
    );
    expect(calls).toEqual([1, 2, 3]);
  });

  it("fires once per element for a nested tree, deepest-registered included", () => {
    const mounted: string[] = [];
    render(
      div(
        { onMount: () => mounted.push("outer") },
        span({ onMount: () => mounted.push("inner") }, "x"),
      ),
      container,
    );
    expect(mounted.sort()).toEqual(["inner", "outer"]);
  });

  it("fires after hydrate(), for claimed SSR nodes, with the element connected", () => {
    const mount = vi.fn();
    const component = () => div(span({ onMount: mount }, "x"));
    container.innerHTML = renderToString(component());
    expect(mount).not.toHaveBeenCalled();

    hydrate(component(), container);
    expect(mount).toHaveBeenCalledTimes(1);
    expect((mount.mock.calls[0][0] as HTMLElement).isConnected).toBe(true);
  });

  it("fires for a new list() row inserted by update(), not for untouched rows", () => {
    const mounted: number[] = [];
    let items = [1, 2];
    render(
      div(list(() => items, (n) => span({ onMount: () => mounted.push(n) }, String(n)))),
      container,
    );
    expect(mounted.sort()).toEqual([1, 2]);

    mounted.length = 0;
    items = [1, 2, 3];
    update();
    // Rows for 1 and 2 are reused (list() diffs by item identity) — only the
    // new row for 3 mounts.
    expect(mounted).toEqual([3]);
  });

  it("fires for a when() branch that becomes active on update()", () => {
    const mount = vi.fn();
    let show = false;
    render(div(when(() => show, span({ onMount: mount }, "shown")).else(span("hidden"))), container);
    expect(mount).not.toHaveBeenCalled();

    show = true;
    update();
    expect(mount).toHaveBeenCalledTimes(1);
    expect((mount.mock.calls[0][0] as HTMLElement).isConnected).toBe(true);
  });

  // ── Destroy timing ──────────────────────────────────────────────────────

  it("fires onDestroy when list() removes a row (eager safeRemoveChild path)", () => {
    const destroy = vi.fn();
    let items = [1, 2, 3];
    render(div(list(() => items, (n) => span({ onDestroy: destroy }, String(n)))), container);

    items = [1, 3];
    update();
    expect(destroy).toHaveBeenCalledTimes(1);
    expect((destroy.mock.calls[0][0] as HTMLElement).textContent).toBe("2");
  });

  it("fires onDestroy when when() swaps its branch away", () => {
    const destroy = vi.fn();
    let show = true;
    render(div(when(() => show, span({ onDestroy: destroy }, "shown")).else(span("hidden"))), container);

    show = false;
    update();
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it("a mount-returned cleanup fires exactly like an explicit onDestroy", () => {
    const cleanup = vi.fn();
    let items = [1];
    render(div(list(() => items, (n) => span(on("mount", () => cleanup), String(n)))), container);

    items = [];
    update();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("fires both an onMount-returned cleanup and an explicit onDestroy", () => {
    const returnedCleanup = vi.fn();
    const explicitDestroy = vi.fn();
    let items = [1];
    render(
      div(list(() => items, () => span(
        { onMount: () => returnedCleanup, onDestroy: explicitDestroy },
        "x",
      ))),
      container,
    );

    items = [];
    update();
    expect(returnedCleanup).toHaveBeenCalledTimes(1);
    expect(explicitDestroy).toHaveBeenCalledTimes(1);
  });

  it("does not fire onDestroy for rows that are merely reordered (same element reused)", () => {
    const destroy = vi.fn();
    let items = [1, 2, 3];
    const el = render(
      div(list(() => items, (n) => span({ onDestroy: destroy }, String(n)))),
      container,
    );
    const rowsBefore = Array.from((el as unknown as HTMLElement).querySelectorAll("span"));

    items = [3, 1, 2];
    update();

    expect(destroy).not.toHaveBeenCalled();
    const rowsAfter = Array.from((el as unknown as HTMLElement).querySelectorAll("span"));
    // Same 3 DOM nodes, just reordered — list() reuses rows by item identity.
    expect(new Set(rowsAfter)).toEqual(new Set(rowsBefore));
  });

  // ── Fast-path removal gaps (list() bulk clear, legacy conditional swap) ──

  it("fires onDestroy for every row when a full list clear takes the whole-parent bulk-clear fast path", () => {
    const destroyed: string[] = [];
    let items = ["a", "b", "c"];
    // The list is the *only* content of `host` — this is exactly the shape
    // bulkClearRecords() fast-paths with a single `textContent = ""`.
    render(
      div(list(() => items, (item) => span({ onDestroy: () => destroyed.push(item) }, item))),
      container,
    );

    items = [];
    update();
    expect(destroyed.sort()).toEqual(["a", "b", "c"]);
  });

  it("fires onDestroy for every row when a list full-replaces to entirely different items", () => {
    const destroyed: string[] = [];
    let items = ["a", "b"];
    render(
      div(list(() => items, (item) => span({ onDestroy: () => destroyed.push(item) }, item))),
      container,
    );

    items = ["x", "y", "z"];
    update();
    expect(destroyed.sort()).toEqual(["a", "b"]);
  });

  it("fires onDestroy for every row via the non-whole-parent bulk-clear branch", () => {
    const destroyed: string[] = [];
    let items = ["a", "b"];
    render(
      div(
        span("header"),
        list(() => items, (item) => span({ onDestroy: () => destroyed.push(item) }, item)),
      ),
      container,
    );

    items = [];
    update();
    expect(destroyed.sort()).toEqual(["a", "b"]);
  });

  it("fires onDestroy when the legacy single-element conditional hides its element", () => {
    const destroy = vi.fn();
    let show = true;
    const node = createHtmlConditionalElement("div", () => show, [{ onDestroy: destroy }]);
    container.appendChild(node as unknown as Node);
    // This low-level helper builds the element directly (bypassing
    // render()/hydrate()), so nothing has flushed its queued registration
    // into the Mounted state yet — do that explicitly, the way update()
    // normally would as part of a full pass.
    flushMountQueue();

    show = false;
    updateConditionalElements();
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  // ── Error isolation ─────────────────────────────────────────────────────

  it("a throwing mount callback does not stop later callbacks or sibling elements from mounting", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const good1 = vi.fn();
    const good2 = vi.fn();
    render(
      div(
        span(on("mount", () => { throw new Error("boom"); }), on("mount", good1)),
        span(on("mount", good2)),
      ),
      container,
    );
    expect(good1).toHaveBeenCalledTimes(1);
    expect(good2).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("a throwing destroy callback does not stop other destroy callbacks from running", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const good = vi.fn();
    let items = [1];
    render(
      div(list(() => items, () => span(
        on("destroy", () => { throw new Error("boom"); }),
        on("destroy", good),
      ))),
      container,
    );

    items = [];
    update();
    expect(good).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  // ── SSR ──────────────────────────────────────────────────────────────────

  it("renderToString() never fires onMount, even under jsdom", () => {
    const mount = vi.fn();
    renderToString(div({ onMount: mount }));
    expect(mount).not.toHaveBeenCalled();
  });

  it("renderToString() never fires on(\"mount\", ...)", () => {
    const mount = vi.fn();
    renderToString(div(on("mount", mount)));
    expect(mount).not.toHaveBeenCalled();
  });

  // ── list() row-template fast path bails when lifecycle hooks are used ────

  it("analyzeFactory bails the row-template fast path for { onMount } / { onDestroy }", () => {
    expect(analyzeFactory("span", [{ onMount: () => undefined }])).toBeNull();
    expect(analyzeFactory("span", [{ onDestroy: () => undefined }])).toBeNull();
  });

  it("analyzeFactory bails the row-template fast path for on(\"mount\"/\"destroy\")", () => {
    expect(analyzeFactory("span", [on("mount", () => undefined)])).toBeNull();
    expect(analyzeFactory("span", [on("destroy", () => undefined)])).toBeNull();
  });

  it("a list using per-row onMount/onDestroy still renders and reacts correctly (normal, non-template path)", () => {
    const mounted: string[] = [];
    const destroyed: string[] = [];
    let items = ["a", "b"];
    const el = render(
      div(list(() => items, (item) => span(
        { onMount: () => mounted.push(item), onDestroy: () => destroyed.push(item) },
        item,
      ))),
      container,
    );
    expect((el as unknown as HTMLElement).textContent).toBe("ab");
    expect(mounted.sort()).toEqual(["a", "b"]);

    items = ["a", "b", "c"];
    update();
    expect((el as unknown as HTMLElement).textContent).toBe("abc");
    expect(mounted.sort()).toEqual(["a", "b", "c"]);

    items = ["a"];
    update();
    expect((el as unknown as HTMLElement).textContent).toBe("a");
    expect(destroyed.sort()).toEqual(["b", "c"]);
  });

  // ── Internal state machine (direct unit tests) ────────────────────────────

  describe("internal state machine", () => {
    it("cancels a still-pending mount silently when disposed before it flushes", () => {
      const mount = vi.fn();
      const destroy = vi.fn();
      const el = document.createElement("div");

      registerMount(el, mount);
      registerDestroy(el, destroy);
      // Disposed before any flushMountQueue() call — as if the element was
      // built and discarded within the same render/update pass.
      disposeElementLifecycle(el);
      flushMountQueue();

      expect(mount).not.toHaveBeenCalled();
      expect(destroy).not.toHaveBeenCalled();
    });

    it("is idempotent — disposing an already-disposed element is a no-op", () => {
      const destroy = vi.fn();
      const el = document.createElement("div");

      registerMount(el, () => {});
      flushMountQueue();
      registerDestroy(el, destroy);

      disposeElementLifecycle(el);
      disposeElementLifecycle(el);
      disposeElementLifecycle(el);

      expect(destroy).toHaveBeenCalledTimes(1);
    });

    it("registering on() after disposal is dropped, not retained", () => {
      const el = document.createElement("div");
      registerMount(el, () => {});
      flushMountQueue();
      disposeElementLifecycle(el);

      const lateMount = vi.fn();
      const lateDestroy = vi.fn();
      registerMount(el, lateMount);
      registerDestroy(el, lateDestroy);
      flushMountQueue();
      disposeElementLifecycle(el); // idempotent no-op; would fire lateDestroy if it had been stored

      expect(lateMount).not.toHaveBeenCalled();
      expect(lateDestroy).not.toHaveBeenCalled();
    });

    it("disposing an element with no lifecycle registration is a safe no-op", () => {
      expect(() => disposeElementLifecycle(document.createElement("div"))).not.toThrow();
    });
  });
});
