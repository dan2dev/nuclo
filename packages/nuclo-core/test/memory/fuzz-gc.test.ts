/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { update } from "../../src/update/update";
import { forceUpdate } from "../../src/render";
import { reactiveElements, reactiveTextNodes } from "../../src/update/registry";
import { runSeed, type Mode, type RunOptions } from "../integration/fuzz-harness";
import "../../src";

/**
 * Real-GC leak check over randomly generated apps.
 *
 * Each app is rendered (or server-rendered and hydrated), driven through
 * update() / forceUpdate() rounds that add, move and remove rows and branches,
 * then removed from the document. Afterwards nothing nuclo keeps — list and
 * when runtimes, reactive text/attribute registries, scope roots, lifecycle
 * records, listener maps, hydration cursors, forceUpdate roots — may hold on
 * to any of its elements: every one must be collected by a real GC pass
 * (--expose-gc, see vitest.config.ts), without update() being called again.
 *
 * The harness never uses querySelector (jsdom caches selector matches on the
 * document and would pin the nodes — see gc-collectability.test.ts).
 */
const hasGc = typeof globalThis.gc === "function";
const itGc = hasGc ? it : it.skip;

async function collectGarbage(): Promise<void> {
  for (let i = 0; i < 6; i++) {
    globalThis.gc!();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

const MODES: Array<[Mode, RunOptions["ssr"]]> = [
  ["client", "dom"],
  ["hydrate", "polyfill"],
  ["hydrate-mismatch", "polyfill"],
  ["hydrate", "dom"],
];

describe("real GC — randomly generated apps leave nothing behind", () => {
  for (const [mode, ssr] of MODES) {
    itGc(`${mode} (SSR on ${ssr}): every element of 80 removed apps is collected`, async () => {
      const refs: WeakRef<Element>[] = [];
      let elementCount = 0;

      for (let seed = 9_000; seed < 9_080; seed++) {
        runSeed(seed, mode, {
          lifecycle: false,
          ssr,
          maxListSize: 12,
          onTeardown: (container) => {
            // Track the root, and every element under it.
            const walk = (el: Element): void => {
              for (let child = el.firstElementChild; child; child = child.nextElementSibling) {
                refs.push(new WeakRef(child));
                elementCount++;
                walk(child);
              }
            };
            walk(container);
            refs.push(new WeakRef(container));
          },
        });
        // WeakRef targets are kept alive until the current job ends.
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      expect(elementCount).toBeGreaterThan(400);

      await collectGarbage();

      const alive = refs.filter((ref) => ref.deref() !== undefined).length;
      expect(alive, `${alive} of ${refs.length} elements were still reachable after removal`).toBe(0);
    }, 60_000);
  }

  itGc("the reactive registries drain once the apps are gone", async () => {
    for (let seed = 9_100; seed < 9_130; seed++) {
      runSeed(seed, "client", { lifecycle: false, maxListSize: 12 });
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    await collectGarbage();

    // One pass sweeps the WeakRef husks of everything collected above.
    update();
    forceUpdate();

    expect(reactiveTextNodes.size).toBe(0);
    expect(reactiveElements.size).toBe(0);
  }, 60_000);

  itGc("a long-lived app does not grow its registries across 300 update rounds", async () => {
    let peakText = 0;
    let peakElements = 0;
    const baselineText = reactiveTextNodes.size;
    const baselineElements = reactiveElements.size;

    // One app, many rounds: rows and branches churn constantly, so anything
    // that registers without unregistering shows up as monotonic growth.
    runSeed(77, "client", {
      lifecycle: false,
      rounds: 150,
      maxListSize: 10,
      onTeardown: () => {
        peakText = reactiveTextNodes.size - baselineText;
        peakElements = reactiveElements.size - baselineElements;
      },
    });
    await collectGarbage();
    update();

    // Bounded by what was on screen at the end plus not-yet-swept husks from
    // the last few rounds — far below "one entry per node ever created".
    expect(peakText).toBeLessThan(5_000);
    expect(peakElements).toBeLessThan(5_000);
    expect(reactiveTextNodes.size - baselineText).toBeLessThanOrEqual(0);
    expect(reactiveElements.size - baselineElements).toBeLessThanOrEqual(0);
  }, 60_000);
});
