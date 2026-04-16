/**
 * @vitest-environment jsdom
 *
 * Targets uncovered lines in src/core/reactiveAttributes.ts:
 *
 *  Lines 156-157 – notifyReactiveElements: WeakRef.deref() returns undefined (GC path)
 *
 * Also exercises the isCacheableValue / object-value path where style objects
 * are not cached (always re-applied even if structurally equal).
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  registerAttributeResolver,
  notifyReactiveElements,
} from "../../src/core/reactiveAttributes";
import { reactiveElements } from "../../src/core/reactiveCleanup";

// ── helpers ───────────────────────────────────────────────────────────────────

/** Fake dead WeakRef that simulates a GC-collected element. */
function deadElementRef(): WeakRef<Element> {
  const fake = Object.create(WeakRef.prototype) as WeakRef<Element>;
  Object.defineProperty(fake, "deref", {
    value: () => undefined,
    configurable: true,
  });
  return fake;
}

// ── Unit: notifyReactiveElements ──────────────────────────────────────────────
describe("notifyReactiveElements", () => {
  describe("Happy path", () => {
    it("applies attribute resolvers for connected elements", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);

      let value = "initial";
      registerAttributeResolver(
        el as unknown as ExpandedElement<"div">,
        "data-x",
        () => value,
        (v) => {
          el.setAttribute("data-x", String(v));
        },
      );

      expect(el.getAttribute("data-x")).toBe("initial");

      value = "updated";
      notifyReactiveElements();
      expect(el.getAttribute("data-x")).toBe("updated");

      el.remove();
    });

    it("skips update when value has not changed (primitive cache)", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      let applyCount = 0;
      let value = "same";

      registerAttributeResolver(
        el as unknown as ExpandedElement<"div">,
        "data-y",
        () => value,
        (_v) => {
          applyCount++;
        },
      );
      const afterRegister = applyCount;

      notifyReactiveElements(); // Same value → no re-apply
      expect(applyCount).toBe(afterRegister); // No extra call

      el.remove();
    });

    it("always re-applies when value is an object (non-cacheable)", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      let applyCount = 0;
      const styleObj = { color: "red" };

      registerAttributeResolver(
        el as unknown as ExpandedElement<"div">,
        "style",
        () => styleObj,
        (_v) => {
          applyCount++;
        },
      );
      const afterRegister = applyCount;

      notifyReactiveElements(); // Object → always re-applies
      expect(applyCount).toBeGreaterThan(afterRegister);

      el.remove();
    });
  });

  describe("Validation – invalid parameters", () => {
    it("ignores call with non-Element first argument", () => {
      expect(() => {
        registerAttributeResolver(
          {} as unknown as ExpandedElement<"div">,
          "class",
          () => "x",
          () => {},
        );
      }).not.toThrow();
    });

    it("ignores call with empty key", () => {
      const el = document.createElement("div");
      expect(() => {
        registerAttributeResolver(
          el as unknown as ExpandedElement<"div">,
          "",
          () => "x",
          () => {},
        );
      }).not.toThrow();
    });

    it("ignores call when resolver is not a function", () => {
      const el = document.createElement("div");
      expect(() => {
        registerAttributeResolver(
          el as unknown as ExpandedElement<"div">,
          "class",
          "not-a-function" as unknown as () => unknown,
          () => {},
        );
      }).not.toThrow();
    });
  });

  describe("GC path – dead WeakRef (lines 156-157)", () => {
    it("silently removes GC-collected element refs and does not throw", () => {
      // Inject a fake dead WeakRef directly into the shared Map
      const dead = deadElementRef();
      const fakeInfo = { attributeResolvers: new Map() };
      (reactiveElements as Map<WeakRef<Element>, typeof fakeInfo>).set(
        dead,
        fakeInfo,
      );

      expect(() => notifyReactiveElements()).not.toThrow();

      // Dead ref should be cleaned up
      expect(
        (reactiveElements as Map<WeakRef<Element>, unknown>).has(dead),
      ).toBe(false);
    });

    it("handles multiple dead refs in a single pass", () => {
      const dead1 = deadElementRef();
      const dead2 = deadElementRef();
      const fakeInfo = { attributeResolvers: new Map() };
      (reactiveElements as Map<WeakRef<Element>, typeof fakeInfo>).set(
        dead1,
        fakeInfo,
      );
      (reactiveElements as Map<WeakRef<Element>, typeof fakeInfo>).set(
        dead2,
        fakeInfo,
      );

      expect(() => notifyReactiveElements()).not.toThrow();
      expect(
        (reactiveElements as Map<WeakRef<Element>, unknown>).has(dead1),
      ).toBe(false);
      expect(
        (reactiveElements as Map<WeakRef<Element>, unknown>).has(dead2),
      ).toBe(false);
    });
  });

  describe("Disconnected element cleanup", () => {
    it("removes disconnected elements during notify pass", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);

      registerAttributeResolver(
        el as unknown as ExpandedElement<"div">,
        "data-z",
        () => "v",
        (v) => {
          el.setAttribute("data-z", String(v));
        },
      );

      // Disconnect element from DOM
      el.remove();

      // Should not throw; disconnected element should be cleaned up
      expect(() => notifyReactiveElements()).not.toThrow();
    });
  });

  describe("Scope filtering", () => {
    it("skips elements outside given scope", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      let applyCount = 0;
      let value = "a";

      registerAttributeResolver(
        el as unknown as ExpandedElement<"div">,
        "data-scope",
        () => value,
        () => {
          applyCount++;
        },
      );
      const afterRegister = applyCount;

      value = "b";
      const excludeAll = { roots: [], contains: (_n: Node) => false };
      notifyReactiveElements(excludeAll);

      expect(applyCount).toBe(afterRegister); // No update applied

      el.remove();
    });
  });

  describe("Resolver error handling", () => {
    it("continues if a resolver throws", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);

      registerAttributeResolver(
        el as unknown as ExpandedElement<"div">,
        "data-err",
        () => {
          throw new Error("resolver boom");
        },
        (_v) => {},
      );

      expect(() => notifyReactiveElements()).not.toThrow();

      el.remove();
    });

    it("continues if applyValue throws", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      let applyCount = 0;

      registerAttributeResolver(
        el as unknown as ExpandedElement<"div">,
        "data-apply-err",
        () => applyCount++,
        (_v) => {
          throw new Error("apply boom");
        },
      );

      expect(() => notifyReactiveElements()).not.toThrow();

      el.remove();
    });
  });
});
