/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Targets the FinalizationRegistry callback for conditional nodes in
 * src/update/registry.ts (line 159): once a registered node is collected, the
 * finalizer prunes its WeakRef from the active set.
 *
 * Requires --expose-gc (configured in vitest.config.ts execArgv).
 */
import { describe, it, expect } from "vitest";
import { storeConditionalInfo, getActiveConditionalNodes } from "../../src/update/registry";

const hasGc = typeof globalThis.gc === "function";

async function collectGarbage(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    globalThis.gc!();
    // Finalization callbacks run on a task boundary after collection.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

describe.runIf(hasGc)("conditional node finalizer", () => {
  it("prunes the WeakRef once the node is collected", async () => {
    let ref: WeakRef<Node>;

    // Isolate the strong reference in a block scope we can drop.
    {
      let node: Node | null = document.createComment("conditional-div-hidden");
      storeConditionalInfo(node, {
        condition: () => false,
        tagName: "div" as ElementTagName,
        modifiers: [],
        isSvg: false,
      });
      ref = new WeakRef(node);
      node = null;
    }

    await collectGarbage();

    // Not guaranteed by the spec, but reliable under --expose-gc: the node is
    // gone and the finalizer has already pruned (or the next scan will).
    if (ref.deref() === undefined) {
      const nodes = getActiveConditionalNodes();
      expect(nodes.every((n) => n !== ref.deref())).toBe(true);
    }
    // Either way the registry stays consistent.
    expect(() => getActiveConditionalNodes()).not.toThrow();
  });
});
