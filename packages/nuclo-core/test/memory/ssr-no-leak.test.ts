/// <reference path="../../types/index.d.ts" />
/**
 * @vitest-environment node
 *
 * SSR memory-leak guard.
 *
 * Server-side rendering is stateless: every request builds a throwaway tree and
 * serializes it. The reactive registries (reactive text/attribute maps, list &
 * when runtimes, scope roots, conditional nodes) must therefore stay empty —
 * their registration is gated on `isBrowser`, which is false under the Node
 * polyfill loaded here.
 *
 * Those registries are all WeakRef/WeakMap-keyed, so a *weak* reference could
 * never be detected by checking collectability. What this test catches is a
 * *strong* reference regression — e.g. someone dropping an `isBrowser` guard and
 * pushing the tree onto a module-level array. We render reactive content, drop
 * every reference, force real GC, and assert the whole subtree is collected,
 * even though update() is never called.
 *
 * Runs under `--expose-gc` (vitest config sets execArgv); skipped otherwise.
 */
import { describe, it, expect } from "vitest";
import "../../src/polyfill";
import "../../src/index";
import { when } from "../../src/when";
import { list } from "../../src/list";
import { renderToString } from "../../src/ssr/renderToString";
import { createElement } from "../../src/utility/dom";

// Tag builders are installed on globalThis by importing ../../src/index.
declare const div: ExpandedElementBuilder<"div">;
declare const ul: ExpandedElementBuilder<"ul">;
declare const li: ExpandedElementBuilder<"li">;
declare const span: ExpandedElementBuilder<"span">;
declare const p: ExpandedElementBuilder<"p">;
declare const button: ExpandedElementBuilder<"button">;

const hasGc = typeof (globalThis as { gc?: () => void }).gc === "function";
const itGc = hasGc ? it : it.skip;

async function collectGarbage(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    (globalThis as { gc: () => void }).gc();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

// Builds a tree exercising every globally-registerable path: reactive text,
// reactive attributes, a keyed list, and a when()/else conditional.
function buildReactiveTree(): { root: object; html: string } {
  const items = ["a", "b", "c"];
  let active = true;
  const factory = div(
    { className: () => (active ? "on" : "off") },
    span(() => `count: ${items.length}`),
    ul(list(() => items, (item) => li({ "data-key": item }, item))),
    when(() => active, button("toggle")).else(p("hidden")),
  );
  const container = createElement("div") as unknown as ExpandedElement<"div">;
  const root = factory(container, 0) as unknown as object;
  const html = renderToString(root as Parameters<typeof renderToString>[0]);
  // Touch `active` so the closures genuinely capture mutable state.
  active = false;
  return { root, html };
}

describe("SSR renders are not retained by global registries", () => {
  it("renders reactive content correctly (sanity)", () => {
    const { html } = buildReactiveTree();
    expect(html).toContain("count: 3");
    expect(html).toContain('data-key="a"');
    expect(html).toContain('data-key="c"');
    // when() picked the active branch (button), not the else branch (hidden).
    // Text carries a `<!-- text-N -->` hydration marker, so match on substrings.
    expect(html).toContain("<button>");
    expect(html).toContain("toggle");
    expect(html).not.toContain("hidden");
  });

  itGc("a reactive tree is collectible after render + drop (no strong refs)", async () => {
    let built: { root: object; html: string } | null = buildReactiveTree();
    const ref = new WeakRef(built.root);
    // eslint-disable-next-line no-useless-assignment -- drop strong ref for GC
    built = null;

    await collectGarbage();

    expect(ref.deref()).toBeUndefined();
  });

  itGc("repeated renders do not accumulate retained trees", async () => {
    const N = 200;
    const refs: WeakRef<object>[] = [];
    for (let i = 0; i < N; i++) {
      const { root } = buildReactiveTree();
      refs.push(new WeakRef(root));
    }

    await collectGarbage();

    // A module-level strong reference (the leak we guard against) would pin
    // every one of the N trees. GC is non-deterministic, so a handful of the
    // most-recent allocations may legitimately remain uncollected — the
    // generous bound cleanly separates "nothing retained" (~0) from a real
    // leak (all N retained).
    const survivors = refs.filter((r) => r.deref() !== undefined).length;
    expect(survivors).toBeLessThan(N / 4);
  });
});
