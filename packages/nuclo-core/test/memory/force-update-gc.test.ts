/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, forceUpdate } from "../../src/render";
import "../../src";

/**
 * Real GC tests for forceUpdate()'s component-root registry.
 *
 * The registry entry strongly holds the component closure while its root is
 * alive — that is the app. These tests prove the entry does not outlive the
 * root: once the rendered root is removed and collected, the root nodes AND
 * the component closure (with everything it captured) must be collectible,
 * even if forceUpdate() is never called again (FinalizationRegistry path).
 *
 * See gc-collectability.test.ts for the querySelector() retention gotcha —
 * node references here come from render()'s return value only.
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

describe("real GC — forceUpdate registry", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  // Mount helpers live in their own stack frames: a live test-function frame
  // can pin block-scoped locals (see gc-collectability.test.ts).
  function mountComponentAndRemove(): WeakRef<Node>[] {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const el = render(() => div(p("a"), span(() => "b")), container) as unknown as HTMLElement;
    const refs: WeakRef<Node>[] = [new WeakRef(el)];
    for (let i = 0; i < el.childNodes.length; i++) {
      refs.push(new WeakRef(el.childNodes[i]));
    }
    container.remove();
    return refs;
  }

  itGc("a removed component-registered root is collectible", async () => {
    const refs = mountComponentAndRemove();

    await collectGarbage();

    for (const ref of refs) {
      expect(ref.deref()).toBeUndefined();
    }
  });

  function mountPayloadAndRemove(): WeakRef<object> {
    const container = document.createElement("div");
    document.body.appendChild(container);
    // The payload is reachable ONLY through the component closure the
    // registry holds. If the registry entry survived its root, this would
    // stay alive forever.
    const payload = { label: "big data captured by the app" };
    render(() => div(p(payload.label)), container);
    container.remove();
    return new WeakRef(payload);
  }

  itGc("the component closure is released once its root is collected — without another forceUpdate()", async () => {
    const payloadRef = mountPayloadAndRemove();

    await collectGarbage();

    expect(payloadRef.deref()).toBeUndefined();
  });

  itGc("bare forceUpdate() after the root was collected neither throws nor resurrects", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    render(() => div(p("gone")), container);
    container.remove();

    await collectGarbage();

    expect(() => forceUpdate()).not.toThrow();
    expect(document.body.childNodes.length).toBe(0);
  });

  itGc("live roots survive repeated forceUpdate() passes with no per-pass retention", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    let n = 0;
    const el = render(() => div(p(() => `n:${n}`), span("static")), container) as unknown as HTMLElement;

    // Track the text nodes replaced across passes: reused in place, so no
    // graveyard of superseded nodes may accumulate.
    const before = el.childNodes.length;
    for (let i = 0; i < 10; i++) {
      n++;
      forceUpdate();
    }
    expect(el.childNodes.length).toBe(before);
    expect(el.isConnected).toBe(true);

    container.remove();
    await collectGarbage();
    // el is intentionally still strongly held by this frame — this test only
    // asserts a follow-up pass tolerates the removed root; collectibility of
    // removed roots is covered above.
    expect(() => forceUpdate()).not.toThrow();
  });
});
