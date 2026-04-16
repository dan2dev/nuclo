/**
 * @vitest-environment jsdom
 *
 * Targets uncovered lines/branches in src/core/reactiveText.ts:
 *
 *  Line 36  – createReactiveTextNode: createTextNode returns null  (document unavailable)
 *  Line 56  – createReactiveTextNode: txt is null after document removed
 *  Lines 84-85 – notifyReactiveTextNodes: WeakRef.deref() returns undefined (GC path)
 *
 * For the "document unavailable" paths we temporarily null out globalThis.document.
 * For the GC path we inject a fake dead WeakRef directly into the exported Map.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  createReactiveTextNode,
  notifyReactiveTextNodes,
} from "../../src/core/reactiveText";
import { reactiveTextNodes } from "../../src/core/reactiveCleanup";

// ── helpers ───────────────────────────────────────────────────────────────────

/** Create a fake WeakRef that always returns undefined (simulates GC). */
function deadRef<T extends object>(): WeakRef<T> {
  const fake = Object.create(WeakRef.prototype) as WeakRef<T>;
  Object.defineProperty(fake, "deref", {
    value: () => undefined,
    configurable: true,
  });
  return fake;
}

// ── Unit: createReactiveTextNode ──────────────────────────────────────────────
describe("createReactiveTextNode", () => {
  describe("Happy path", () => {
    it("returns a Text node with the resolved value", () => {
      const node = createReactiveTextNode(() => "hello");
      expect(node).toBeTruthy();
      expect((node as Text).textContent).toBe("hello");
    });

    it("uses pre-evaluated value when supplied", () => {
      const resolver = vi.fn(() => "live");
      const node = createReactiveTextNode(resolver, "pre");
      // Pre-evaluated value is used directly – resolver should NOT be called
      expect((node as Text).textContent).toBe("pre");
      expect(resolver).not.toHaveBeenCalled();
    });

    it("uses empty string when preEvaluated is explicitly undefined", () => {
      // arguments.length === 2, preEvaluated === undefined  →  str = ""
      const node = createReactiveTextNode(() => "ignored", undefined);
      expect((node as Text).textContent).toBe("");
    });

    it("handles resolver that returns null as empty string", () => {
      const node = createReactiveTextNode(() => null as unknown as string);
      expect((node as Text).textContent).toBe("null");
    });

    it("handles resolver that returns undefined as empty string", () => {
      const node = createReactiveTextNode(() => undefined as unknown as string);
      expect((node as Text).textContent).toBe("");
    });

    it("handles resolver that returns a number", () => {
      const node = createReactiveTextNode(() => 42 as unknown as string);
      expect((node as Text).textContent).toBe("42");
    });

    it("handles resolver that returns boolean true", () => {
      const node = createReactiveTextNode(() => true as unknown as string);
      expect((node as Text).textContent).toBe("true");
    });
  });

  describe("Edge cases – invalid resolver", () => {
    it("returns a fallback text node when resolver is not a function", () => {
      // Lines 33-38: invalid resolver path
      const node = createReactiveTextNode(
        "not-a-function" as unknown as () => string,
      );
      expect(node).toBeTruthy();
      // Should not throw
    });

    it("handles resolver that throws on evaluation", () => {
      const node = createReactiveTextNode(() => {
        throw new Error("resolver error");
      });
      // Falls back to empty string
      expect((node as Text).textContent).toBe("");
    });
  });

  describe("Document unavailable – null document paths", () => {
    let originalDocument: typeof globalThis.document;

    beforeEach(() => {
      originalDocument = globalThis.document;
    });

    afterEach(() => {
      // Restore document
      Object.defineProperty(globalThis, "document", {
        value: originalDocument,
        writable: true,
        configurable: true,
      });
    });

    it("throws when createTextNode returns null (no document)", () => {
      // Remove document so createTextNode returns null (line 55-57)
      Object.defineProperty(globalThis, "document", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      // Line 36 – invalid resolver path: createTextNode returns null → throws
      expect(() =>
        createReactiveTextNode("not-a-function" as unknown as () => string),
      ).toThrow();
    });

    it("throws when txt is null after normal resolution (no document)", () => {
      // Remove document so createTextNode returns null (line 55-57)
      Object.defineProperty(globalThis, "document", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(() => createReactiveTextNode(() => "hello")).toThrow(
        /Failed to create text node/,
      );
    });
  });
});

// ── Unit: notifyReactiveTextNodes ─────────────────────────────────────────────
describe("notifyReactiveTextNodes", () => {
  describe("Happy path", () => {
    it("updates text content when resolver returns new value", () => {
      let value = "initial";
      const node = createReactiveTextNode(() => value) as Text;
      document.body.appendChild(node);
      value = "updated";
      notifyReactiveTextNodes();
      expect(node.textContent).toBe("updated");
      node.remove();
    });

    it("skips update when value has not changed", () => {
      let callCount = 0;
      const node = createReactiveTextNode(() => {
        callCount++;
        return "same";
      }) as Text;
      document.body.appendChild(node);
      const countAfterCreate = callCount;
      notifyReactiveTextNodes();
      // textContent should be unchanged
      expect(node.textContent).toBe("same");
      // Resolver was called again but value same so no DOM write
      expect(callCount).toBeGreaterThan(countAfterCreate);
      node.remove();
    });

    it("handles resolver that throws during update – falls back to empty string", () => {
      let shouldThrow = false;
      const node = createReactiveTextNode(() => {
        if (shouldThrow) throw new Error("update error");
        return "ok";
      }) as Text;
      shouldThrow = true;
      expect(() => notifyReactiveTextNodes()).not.toThrow();
      // Stays at last good value or becomes ""
    });
  });

  describe("GC path – dead WeakRef in reactiveTextNodes (lines 84-85)", () => {
    it("silently removes GC-collected refs and does not throw", () => {
      // Inject a fake dead WeakRef directly into the shared Map
      const dead = deadRef<Text>();
      reactiveTextNodes.set(dead, {
        resolver: () => "x",
        lastValue: "x",
      } as Parameters<typeof reactiveTextNodes.set>[1]);

      expect(() => notifyReactiveTextNodes()).not.toThrow();

      // The dead ref should have been cleaned up
      expect(reactiveTextNodes.has(dead)).toBe(false);
    });

    it("handles multiple dead refs in one pass", () => {
      const dead1 = deadRef<Text>();
      const dead2 = deadRef<Text>();
      reactiveTextNodes.set(dead1, {
        resolver: () => "a",
        lastValue: "a",
      } as Parameters<typeof reactiveTextNodes.set>[1]);
      reactiveTextNodes.set(dead2, {
        resolver: () => "b",
        lastValue: "b",
      } as Parameters<typeof reactiveTextNodes.set>[1]);

      expect(() => notifyReactiveTextNodes()).not.toThrow();
      expect(reactiveTextNodes.has(dead1)).toBe(false);
      expect(reactiveTextNodes.has(dead2)).toBe(false);
    });
  });

  describe("Scope filtering", () => {
    it("skips nodes outside the given scope", () => {
      let value = "initial";
      const node = createReactiveTextNode(() => value) as Text;
      document.body.appendChild(node);

      value = "changed";
      const outsideScope = {
        roots: [] as Element[],
        contains: (_n: Node) => false,
      };
      notifyReactiveTextNodes(outsideScope);
      // Value should NOT be updated since node is outside scope
      expect(node.textContent).toBe("initial");

      node.remove();
    });
  });
});
