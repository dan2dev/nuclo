/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, hydrate } from "../../src/render";
import { renderToString } from "../../src/ssr/render-to-string";
import { update } from "../../src/update/update";
import { when } from "../../src/when";
import { list } from "../../src/list";
import "../../src";

/**
 * Real garbage-collection leak tests.
 *
 * The simulated-WeakRef GC tests verify the cleanup *branches*, but cannot
 * detect actual retention: a stubbed WeakRef "dies" even while a registry
 * still strongly references its target. These tests remove a subtree from
 * the DOM, drop all strong references, force real GC (--expose-gc), and
 * assert the nodes are collected — proving no global registry (list/when
 * runtimes, reactive text/attribute maps, scope roots) pins removed DOM.
 *
 * Crucially, update() is NOT called between removal and the GC assertion:
 * cleanup must not depend on another update pass running. (It doesn't have
 * to: "active (still-mounted) runtimes keep working..." below and the
 * update()-then-remove tests further down cover update() being called both
 * before and after a row/branch is dropped, and neither retains anything.)
 *
 * GOTCHA — do not capture the node-under-test via querySelector():
 * `element.querySelector()`/`document.querySelector()` in jsdom (backed by
 * @asamuzakjp/dom-selector) caches its matched node(s) in a per-Document
 * `Finder` instance (`Document#domSelector`, never cleared automatically).
 * That cache is a normal strong reference reachable from `window.document`
 * — a real GC root for the lifetime of the test file — so a node ever
 * returned by querySelector() stays alive until a *later* querySelector()
 * call overwrites that cache entry, regardless of anything nuclo-core does.
 * This produces a completely convincing false-positive "leak" that looks
 * exactly like a retained list()/when() row: multiple hours were once lost
 * bisecting src/list/runtime.ts and src/when/runtime.ts over exactly this,
 * because every failing repro happened to use `el.querySelector(...)` to
 * grab "the last row" while every passing one (this file) walks
 * `childNodes`/`children` instead. Verified with a real V8 heap snapshot
 * (`node --expose-gc`, `v8.writeHeapSnapshot()`): the retaining path is
 * `(GC roots) → Window → Document → #domSelector → #finder → #nodes[i] →
 * <the element>` — nothing in nuclo-core's registries appears in it at
 * all. Grab node references from `render()`'s return value, `childNodes`,
 * `children`, or the row/element you already have a variable for — never
 * from querySelector() — anywhere GC-collectability is being asserted.
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

describe("real GC — removed subtrees are collectible", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  function mountAndRemove(build: () => NodeModFn<"div">): WeakRef<Node>[] {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const el = render(build(), container) as unknown as HTMLElement;
    const refs: WeakRef<Node>[] = [new WeakRef(el)];
    for (let i = 0; i < el.childNodes.length; i++) {
      refs.push(new WeakRef(el.childNodes[i]));
    }
    container.remove();
    return refs;
  }

  itGc("list() runtime does not retain its removed subtree", async () => {
    const refs: WeakRef<Node>[] = mountAndRemove(() => {
      const items = ["a", "b", "c"];
      return div(list(() => items, (item) => span(item)));
    });

    await collectGarbage();

    for (const ref of refs) {
      expect(ref.deref()).toBeUndefined();
    }
  });

  itGc("when() runtime does not retain its removed subtree", async () => {
    const refs: WeakRef<Node>[] = mountAndRemove(() => {
      const show = true;
      return div(when(() => show, span("visible")).else(p("hidden")));
    });

    await collectGarbage();

    for (const ref of refs) {
      expect(ref.deref()).toBeUndefined();
    }
  });

  itGc("reactive attributes do not retain their removed element", async () => {
    const refs: WeakRef<Node>[] = mountAndRemove(() => {
      const active = false;
      return div(
        span({ className: () => (active ? "on" : "off") }, "styled"),
        button({ disabled: () => !active }, "toggle"),
      );
    });

    await collectGarbage();

    for (const ref of refs) {
      expect(ref.deref()).toBeUndefined();
    }
  });

  itGc("reactive text nodes do not retain their removed subtree", async () => {
    const refs: WeakRef<Node>[] = mountAndRemove(() => {
      const count = 0;
      return div(span(() => `count: ${count}`));
    });

    await collectGarbage();

    for (const ref of refs) {
      expect(ref.deref()).toBeUndefined();
    }
  });

  itGc("hydrated tree is collectible after removal", async () => {
    const refs: WeakRef<Node>[] = (() => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      const items = ["x", "y"];
      const show = true;
      const component = () =>
        div(
          when(() => show, span("on")).else(span("off")),
          list(() => items, (item) => p(item)),
          span(() => `n=${items.length}`),
        );
      container.innerHTML = renderToString(component());
      const el = hydrate(component(), container) as unknown as HTMLElement;
      const collected: WeakRef<Node>[] = [new WeakRef(el as Node)];
      for (let i = 0; i < el.childNodes.length; i++) {
        collected.push(new WeakRef(el.childNodes[i]));
      }
      container.remove();
      return collected;
    })();

    await collectGarbage();

    for (const ref of refs) {
      expect(ref.deref()).toBeUndefined();
    }
  });

  itGc("active (still-mounted) runtimes keep working while removed ones are collected", async () => {
    // One list stays mounted, one is removed — the removed one must be
    // collected, the mounted one must keep reacting to update().
    const keepItems = ["k1"];
    const keepContainer = document.createElement("div");
    document.body.appendChild(keepContainer);
    const kept = render(div(list(() => keepItems, (item) => span(item))), keepContainer);

    const removedRef: WeakRef<Node> = (() => {
      const dropContainer = document.createElement("div");
      document.body.appendChild(dropContainer);
      const dropped = render(div(list(() => ["d1", "d2"], (item) => span(item))), dropContainer);
      dropContainer.remove();
      return new WeakRef(dropped as unknown as Node);
    })();

    await collectGarbage();
    expect(removedRef.deref()).toBeUndefined();

    keepItems.push("k2");
    update();
    expect((kept as unknown as HTMLElement).textContent).toBe("k1k2");
  });

  // These two cover a gap the tests above don't: update() removing a
  // row/branch while the list/when is still CONNECTED (a real diff through
  // sync()/renderWhenContent()), with the container only disconnected
  // afterwards. See the GOTCHA note in the file header — an earlier
  // investigation into what looked like exactly this leak turned out to be
  // the querySelector() cache, not either runtime; these are the real
  // regression tests for the scenario, using childNodes/children (not
  // querySelector()) to capture the removed node.
  itGc("list() row removed by update() while still connected is collectible after later disconnect", async () => {
    const rowRef: WeakRef<Node> = (() => {
      let items = ["a", "b", "c"];
      const container = document.createElement("div");
      document.body.appendChild(container);
      const el = render(div(list(() => items, (item) => span(item))), container) as unknown as HTMLElement;
      const lastRow = el.children[el.children.length - 1];
      const ref = new WeakRef(lastRow);
      items = ["a", "b"];
      update(); // removes the "c" row through list()'s normal diff, container still connected
      container.remove();
      return ref;
    })();

    await collectGarbage();
    expect(rowRef.deref()).toBeUndefined();
  });

  itGc("when() branch swapped by update() while still connected is collectible after later disconnect", async () => {
    const branchRef: WeakRef<Node> = (() => {
      let show = true;
      const container = document.createElement("div");
      document.body.appendChild(container);
      const el = render(div(when(() => show, span("visible")).else(p("hidden"))), container) as unknown as HTMLElement;
      const active = el.children[0];
      const ref = new WeakRef(active);
      show = false;
      update(); // swaps to the else-branch through when()'s normal diff, container still connected
      container.remove();
      return ref;
    })();

    await collectGarbage();
    expect(branchRef.deref()).toBeUndefined();
  });
});
