/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render } from "../../src/render";
import { update } from "../../src/update/update";
import "../../src";

/**
 * Real GC test for the region registry.
 *
 * Regions are addressed by a string id, and a plain `Map<string, runtime>`
 * would be a permanent leak: the runtime holds its host element and every
 * view's content, so a layout that is rendered and thrown away (a route
 * change, an island re-mounting, HMR) would stay in memory for the life of the
 * page — with nothing to notice, because the id is reused and the next region
 * answers to it just fine.
 *
 * The id map therefore holds only a WeakRef to the start marker, which the DOM
 * holds strongly while the region is in the tree.
 *
 * See gc-collectability.test.ts for the querySelector() retention gotcha: node
 * references here are walked off render()'s return value, never queried, and
 * are taken inside a helper whose frame has popped before the collection runs.
 */
const hasGc = typeof globalThis.gc === "function";
const itGc = hasGc ? it : it.skip;

async function collectGarbage(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    globalThis.gc!();
    // Yield a macrotask so FinalizationRegistry callbacks can run too.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

describe("real GC — region registry", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  /** Renders a region with a view in it, then drops the whole tree. */
  function mountAndRemove(): WeakRef<Node>[] {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const root = render(
      div(
        div({ id: "host" }, region({ id: "main", type: "stack", empty: p("empty") })),
        view("main", section({ id: "page" }, "content")),
      ),
      container,
    );

    const host = (root as unknown as Element).children[0];
    // The view's content, which region() inserted between the host's markers.
    const refs = [new WeakRef(host), new WeakRef(host.children[0])];

    container.remove();
    document.body.innerHTML = "";
    return refs;
  }

  itGc("collects a region's host and view content once the tree is dropped", async () => {
    const refs = mountAndRemove();
    await collectGarbage();

    expect(refs.map((r) => r.deref())).toEqual([undefined, undefined]);
  });

  itGc("re-registers the same id on a later tree without retaining the earlier one", async () => {
    const first = mountAndRemove();
    mountAndRemove();
    await collectGarbage();

    expect(first.map((r) => r.deref())).toEqual([undefined, undefined]);
  });

  /** Renders a view whose region never comes, then drops the whole tree. */
  function mountWaitingAndRemove(): WeakRef<Node>[] {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const root = render(div(div({ id: "from" }, view("nowhere", section({ id: "page" }, "content")))), container);
    const from = (root as unknown as Element).children[0];
    // The view's anchor, and the element it was written in.
    const refs = [new WeakRef(from), new WeakRef(from.firstChild!)];

    container.remove();
    document.body.innerHTML = "";
    return refs;
  }

  itGc("collects a waiting view once its tree is dropped", async () => {
    const refs = mountWaitingAndRemove();
    await collectGarbage();

    expect(refs.map((r) => r.deref())).toEqual([undefined, undefined]);

    // And the region that finally arrives does not show the dead view.
    const container = document.createElement("div");
    document.body.appendChild(container);
    render(div({ id: "host" }, region({ id: "nowhere", empty: p({ id: "none" }, "empty") })), container);
    expect(container.querySelector("#page")).toBeNull();
    expect(container.querySelector("#none")).not.toBeNull();
  });

  /** A region inside a when() that is switched off, its view left waiting. */
  function mountRegionAndClose(): { refs: WeakRef<Node>[]; reopen: () => void } {
    const container = document.createElement("div");
    document.body.appendChild(container);
    let show = true;

    const root = render(
      div(
        when(() => show, div({ id: "host" }, region({ id: "main", type: "stack" }))),
        view("main", section({ id: "page" }, "content")),
      ),
      container,
    );
    const host = (root as unknown as Element).children[0];
    const refs = [new WeakRef(host), new WeakRef(host.children[0])];

    show = false;
    update();
    return {
      refs,
      reopen: () => {
        show = true;
        update();
      },
    };
  }

  itGc("collects a region removed by when(), while its view keeps waiting", async () => {
    const { refs, reopen } = mountRegionAndClose();
    await collectGarbage();

    expect(refs.map((r) => r.deref())).toEqual([undefined, undefined]);

    reopen();
    expect(document.querySelectorAll("#page").length).toBe(1);
  });

  /** A layout wiped behind nuclo's back while the view's own tree lives on. */
  function wipeLayoutUnderLiveView(): WeakRef<Node>[] {
    const layoutRoot = document.createElement("div");
    const pageRoot = document.createElement("div");
    document.body.append(layoutRoot, pageRoot);

    const layout = render(div({ id: "host" }, region({ id: "main" })), layoutRoot);
    render(div(view("main", section({ id: "page" }, "content"))), pageRoot);
    const host = layout as unknown as Element;
    const refs = [new WeakRef(host), new WeakRef(host.children[0])];

    layoutRoot.innerHTML = "";
    // The view still stands in pageRoot; update() is where nuclo notices the
    // region left the document and lets go of it.
    update();
    return refs;
  }

  itGc("lets go of a wiped layout on update() while the view that filled it lives on", async () => {
    const refs = wipeLayoutUnderLiveView();
    await collectGarbage();

    expect(refs.map((r) => r.deref())).toEqual([undefined, undefined]);
  });

  /** A waiting view opened and closed repeatedly: every anchor it leaves behind. */
  function churnWaitingView(): WeakRef<Node>[] {
    const container = document.createElement("div");
    document.body.appendChild(container);
    let open = false;
    const root = render(div(when(() => open, view("nowhere", span("x")))), container) as unknown as Element;
    const refs: WeakRef<Node>[] = [];
    for (let i = 0; i < 5; i++) {
      open = true;
      update();
      refs.push(new WeakRef(root.childNodes[1]));
      open = false;
      update();
    }
    return refs;
  }

  itGc("collects the anchors of a waiting view that was opened and closed", async () => {
    const refs = churnWaitingView();
    await collectGarbage();

    expect(refs.map((r) => r.deref())).toEqual([undefined, undefined, undefined, undefined, undefined]);
  });

  /** A simple region: B replaces A, then B leaves and A comes back rebuilt. */
  function replaceAndRestore(): { refs: WeakRef<Node>[]; close: () => void } {
    const container = document.createElement("div");
    document.body.appendChild(container);
    let open = true;
    const root = render(
      div(
        div({ id: "host" }, region({ id: "main" })),
        view("main", section({ id: "a" }, "a")),
        when(() => open, view("main", section({ id: "b" }, "b"))),
      ),
      container,
    ) as unknown as Element;
    const host = root.children[0];
    // B is shown; A's DOM is gone already and must stay collectible.
    const refs = [new WeakRef(host.children[0])];
    return {
      refs,
      close: () => {
        open = false;
        update();
      },
    };
  }

  itGc("releases the DOM of a view a simple region replaced, and of the one that replaced it", async () => {
    const { refs, close } = replaceAndRestore();
    close();
    await collectGarbage();

    // B's node, dropped when B left; A is on screen again as a fresh node.
    expect(refs.map((r) => r.deref())).toEqual([undefined]);
    expect(document.querySelectorAll("#a").length).toBe(1);
    expect(document.querySelectorAll("#b").length).toBe(0);
  });
});
