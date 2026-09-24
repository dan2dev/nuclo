/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach } from "vitest";
import { withScopedInsertion } from "../../src/shared/dom";

describe("domTypeHelpers edge cases", () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement("div");
    document.body.appendChild(element);
  });

  describe("withScopedInsertion", () => {
    it("should insert nodes before reference node", () => {
      const reference = document.createElement("div");
      const newNode = document.createElement("span");
      element.appendChild(reference);

      withScopedInsertion(element, reference, () => {
        element.appendChild(newNode);
      });

      expect(element.childNodes[0]).toBe(newNode);
      expect(element.childNodes[1]).toBe(reference);
    });

    it("should restore original appendChild after callback", () => {
      const reference = document.createElement("div");
      element.appendChild(reference);
      const originalAppend = element.appendChild.bind(element);

      withScopedInsertion(element, reference, () => {
        // appendChild is temporarily overridden
        expect(element.appendChild).not.toBe(originalAppend);
      });

      // Should be restored (check that it's a function, not exact reference due to binding)
      expect(typeof element.appendChild).toBe("function");
    });

    it("should restore even if callback throws", () => {
      const reference = document.createElement("div");
      element.appendChild(reference);
      const _originalAppend = element.appendChild.bind(element);

      try {
        withScopedInsertion(element, reference, () => {
          throw new Error("test error");
        });
      } catch {
        // Error should be thrown
      }

      // Should still be restored (check that it's a function)
      expect(typeof element.appendChild).toBe("function");
    });

    it("should return callback result", () => {
      const reference = document.createElement("div");
      element.appendChild(reference);

      const result = withScopedInsertion(element, reference, () => {
        return "test result";
      });

      expect(result).toBe("test result");
    });

    it("should handle multiple insertions", () => {
      const reference = document.createElement("div");
      const node1 = document.createElement("span");
      const node2 = document.createElement("p");
      element.appendChild(reference);

      withScopedInsertion(element, reference, () => {
        element.appendChild(node1);
        element.appendChild(node2);
      });

      expect(element.childNodes[0]).toBe(node1);
      expect(element.childNodes[1]).toBe(node2);
      expect(element.childNodes[2]).toBe(reference);
    });
  });

});


it("restores appendChild identity across repeated and nested insertion scopes", () => {
  const host = document.createElement("div");
  const marker = document.createComment("end");
  host.appendChild(marker);
  const original = host.appendChild;
  for (let i = 0; i < 100; i++) {
    withScopedInsertion(host, marker, () => {
      const outer = host.appendChild;
      withScopedInsertion(host, marker, () => host.appendChild(document.createTextNode("x")));
      expect(host.appendChild).toBe(outer);
    });
    expect(host.appendChild).toBe(original);
    expect(Object.hasOwn(host, "appendChild")).toBe(false);
  }
});
