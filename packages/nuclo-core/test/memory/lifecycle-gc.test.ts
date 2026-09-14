/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom

import { describe, it, expect } from "vitest";
import { render } from "../../src/render";
import { list } from "../../src/list";
import "../../src";

/**
 * Real garbage-collection leak tests for onMount/onDestroy — the lifecycle
 * counterpart to test/memory/gc-collectability.test.ts. Same method: build,
 * detach, drop strong references, force real GC (--expose-gc), assert the
 * nodes are collected. See that file for why simulated WeakRefs can't stand
 * in for this, and why every build-and-detach step below runs inside its own
 * function that *returns* a WeakRef before `await collectGarbage()` (a
 * suspended async test function keeps its own locals reachable through its
 * paused call frame for the rest of the function — returning from a nested
 * call, not merely "not using the variable again", is what discards it).
 *
 * Like test/memory/gc-collectability.test.ts's own tests, these never call
 * update() between detaching a subtree and the GC assertion — a probe run
 * while developing this feature found that calling update() on a list()/
 * when() while the surrounding tree *stays connected* (then detaching and
 * asserting GC afterwards) does not collect either, with no lifecycle hooks
 * involved and no code from this feature anywhere on the call path — an
 * existing, orthogonal characteristic of list()/when()'s own update() path,
 * not something onMount/onDestroy introduces or is responsible for fixing
 * here. onDestroy actually *firing* on every removal path (including that
 * same update()-while-connected case) is verified separately, by call count
 * rather than GC, in test/element/lifecycle.test.ts.
 */

const hasGc = typeof globalThis.gc === "function";
const itGc = hasGc ? it : it.skip;

async function collectGarbage(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    globalThis.gc!();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

describe("real GC — elements with onMount/onDestroy are collectible", () => {
  itGc("a subtree using on(\"mount\"/\"destroy\") and { onMount / onDestroy } is collectible once detached", async () => {
    const refs: WeakRef<Node>[] = (() => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      // The callbacks close over a value, same as a real subscription/timer
      // handle would — proving the closure itself doesn't outlive the element.
      const heavy = { payload: new Array(1000).fill("x") };
      const items = ["a", "b", "c"];
      const el = render(
        div(
          { onMount: () => { void heavy; } },
          list(() => items, (item) => span(
            {
              onMount: () => { void heavy; },
              onDestroy: () => { void heavy; },
            },
            item,
          )),
        ),
        container,
      ) as unknown as HTMLElement;

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

  itGc(
    "an element removed via a raw DOM call (bypassing nuclo entirely, no update() afterwards) " +
      "is still collectible even though onDestroy never got the chance to fire",
    async () => {
      const ref: WeakRef<Node> = (() => {
        const container = document.createElement("div");
        document.body.appendChild(container);
        const el = render(
          div({ onMount: () => {}, onDestroy: () => {} }),
          container,
        ) as unknown as Node;

        const weak = new WeakRef(el);
        // Raw removal — not through list()/when()/safeRemoveChild() — exactly
        // the scenario documented in element/lifecycle.ts as one where
        // onDestroy will not run. It must still not leak: the lifecycle
        // registry is WeakMap-keyed by the element, same as every other
        // nuclo registry.
        container.remove();
        return weak;
      })();

      await collectGarbage();
      expect(ref.deref()).toBeUndefined();
    },
  );

  itGc("a mount-returned cleanup closure does not outlive its element", async () => {
    const ref: WeakRef<Node> = (() => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      const heavy = { payload: new Array(1000).fill("y") };
      const el = render(
        div(on("mount", () => () => { void heavy; })),
        container,
      ) as unknown as Node;

      const weak = new WeakRef(el);
      container.remove();
      return weak;
    })();

    await collectGarbage();
    expect(ref.deref()).toBeUndefined();
  });
});
