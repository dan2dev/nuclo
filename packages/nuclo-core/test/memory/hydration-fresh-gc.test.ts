/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, hydrate, forceUpdate } from "../../src/render";
import { when } from "../../src/when";
import { list } from "../../src/list";
import "../../src";

/**
 * Real GC tests for nodes hydrate()/forceUpdate() build fresh or drop in the
 * middle of a pass. Fresh placement pins the per-parent claim cursor and the
 * marker-less when()/list() fallback temporarily overrides the host's
 * appendChild — neither may keep a node alive once the pass is over:
 *  - a removed app is collectible without another hydration pass running,
 *  - stale nodes a pass removes are collectible while the app stays mounted
 *    (the cursor was pinned to exactly those nodes).
 *
 * See gc-collectability.test.ts for the querySelector() retention gotcha —
 * node references here come from return values and childNodes only.
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

function refsOf(root: Node): WeakRef<Node>[] {
  const refs: WeakRef<Node>[] = [new WeakRef(root)];
  for (let i = 0; i < root.childNodes.length; i++) refs.push(...refsOf(root.childNodes[i]));
  return refs;
}

function expectCollected(refs: WeakRef<Node>[]): void {
  expect(refs.length).toBeGreaterThan(0);
  for (const ref of refs) expect(ref.deref()).toBeUndefined();
}

describe("real GC — fresh nodes built during hydration", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  const freshTree = () => {
    const items = ["x", "y"];
    return div(
      a("one"),
      a(() => "two"),
      when(() => true, a("w")),
      list(() => items, (item) => a(item)),
      section(p("a"), p("b")),
    );
  };

  // Mount helpers live in their own stack frames: a live test-function frame
  // can pin block-scoped locals (see gc-collectability.test.ts).
  function hydrateAndRemove(ssr: string): WeakRef<Node>[] {
    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = ssr;
    const refs = refsOf(hydrate(freshTree(), container) as unknown as Node);
    refs.push(new WeakRef(container));
    container.remove();
    return refs;
  }

  itGc("a tree hydrated into an empty container is collectible once removed", async () => {
    const refs = hydrateAndRemove('');

    await collectGarbage();

    expectCollected(refs);
  });

  itGc("a claimed root filled with fresh children is collectible once removed", async () => {
    const refs = hydrateAndRemove('<div></div>');

    await collectGarbage();

    expectCollected(refs);
  });

  function hydrateOverStale(): { root: Element; stale: WeakRef<Node>[] } {
    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = '<div><span>stale <b>one</b></span><i>stale two</i></div>';
    const stale = [
      ...refsOf(container.firstChild!.childNodes[0]),
      ...refsOf(container.firstChild!.childNodes[1]),
    ];
    const root = hydrate(freshTree(), container) as unknown as Element;
    return { root, stale };
  }

  itGc("stale SSR nodes removed by the pass are collectible while the app stays mounted", async () => {
    const { root, stale } = hydrateOverStale();

    await collectGarbage();

    expectCollected(stale);
    // The app itself is untouched.
    expect(root.isConnected).toBe(true);
    expect(root.textContent).toBe('onetwowxyab');
  });

  function forceUpdateDropping(): { root: Element; dropped: WeakRef<Node>[] } {
    const container = document.createElement("div");
    document.body.appendChild(container);
    let labels = ["a", "b", "c"];
    const App = () => div(...labels.map((label) => p(label)));
    const root = render(App(), container) as unknown as Element;
    const dropped = [...refsOf(root.childNodes[1]), ...refsOf(root.childNodes[2])];
    labels = ["a"];
    forceUpdate(App(), container);
    return { root, dropped };
  }

  itGc("nodes dropped by forceUpdate() are collectible while the app stays mounted", async () => {
    const { root, dropped } = forceUpdateDropping();

    await collectGarbage();

    expectCollected(dropped);
    expect(root.textContent).toBe('a');
  });

  function forceUpdateGainingAndRemove(): WeakRef<Node>[] {
    const container = document.createElement("div");
    document.body.appendChild(container);
    let grown = false;
    const items = ["x", "y"];
    const App = () => div(
      grown ? when(() => true, a("w")) : null,
      span("keep"),
      grown ? list(() => items, (item) => a(item)) : null,
      grown ? a("tail") : null,
    );
    const root = render(App(), container) as unknown as Element;
    grown = true;
    forceUpdate(App(), container);
    const refs = refsOf(root);
    refs.push(new WeakRef(container));
    container.remove();
    return refs;
  }

  itGc("nodes and blocks gained through forceUpdate() are collectible once removed", async () => {
    const refs = forceUpdateGainingAndRemove();

    await collectGarbage();

    expectCollected(refs);
  });

  function hydrateThenDropSibling(): { container: Element; sibling: WeakRef<Node> } {
    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = '<div></div><aside>sibling</aside>';
    hydrate(div(a("one"), a("two")), container);
    const sibling = new WeakRef<Node>(container.childNodes[1]);
    container.removeChild(container.childNodes[1]);
    return { container, sibling };
  }

  itGc("a sibling of the root removed after the pass is not pinned by the claim cursor", async () => {
    const { container, sibling } = hydrateThenDropSibling();

    await collectGarbage();

    expect(sibling.deref()).toBeUndefined();
    expect(container.isConnected).toBe(true);
  });
});
