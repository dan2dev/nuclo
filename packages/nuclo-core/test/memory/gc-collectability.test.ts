/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, hydrate } from "../../src/utility/render";
import { renderToString } from "../../src/ssr/renderToString";
import { update } from "../../src/core/updateController";
import { when } from "../../src/when";
import { list } from "../../src/list";
import "../../src/index";

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
 * cleanup must not depend on another update pass running.
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
});
