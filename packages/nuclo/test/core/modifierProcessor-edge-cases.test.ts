/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, vi } from "vitest";
import { applyNodeModifier } from "../../src/core/modifierProcessor";

describe("modifierProcessor edge cases", () => {
  let parent: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    parent = document.createElement("div");
    document.body.appendChild(parent);
  });

  describe("className object handling", () => {
    it("should handle className object from cn() function", () => {
      const cnResult = { className: "test-class" };
      const modifier = () => cnResult;
      
      const result = applyNodeModifier(parent, modifier, 0);
      expect(result).toBeNull(); // Should return null for className objects
      expect(parent.className).toBe("test-class");
    });

    it("should handle className object with multiple classes", () => {
      const cnResult = { className: "class1 class2 class3" };
      const modifier = () => cnResult;
      
      applyNodeModifier(parent, modifier, 0);
      expect(parent.className).toBe("class1 class2 class3");
    });

    it("should not treat objects with className and other properties as className objects", () => {
      const obj = { className: "test", id: "test-id" };
      // Use a non-zero-arity function so it's treated as NodeModFn, not reactive
      const modifier = (parent: HTMLElement) => obj;
      
      // Should be treated as regular attribute object
      const result = applyNodeModifier(parent, modifier, 0);
      expect(result).toBeNull();
      // Both properties should be applied
      expect(parent.id).toBe("test-id");
      expect(parent.className).toBe("test");
    });

    it("should handle className object that throws on subsequent calls", () => {
      // Test error handling when className resolver throws during update
      // The className is applied via registerAttributeResolver which applies it immediately
      // but we need to ensure the element is in the DOM for reactive attributes to work properly
      const modifier = () => ({ className: "initial" });
      
      // First call - className should be applied
      applyNodeModifier(parent, modifier, 0);
      // className is applied immediately via registerAttributeResolver
      // If it's not applied, it might be because the element needs to be in DOM
      // or the resolver needs to be called
      expect(parent.className || parent.getAttribute("class")).toBeTruthy();
      
      // Test that error handling works when resolver throws
      let shouldThrow = false;
      const modifier2 = () => {
        if (shouldThrow) {
          throw new Error("subsequent error");
        }
        return { className: "updated" };
      };
      
      applyNodeModifier(parent, modifier2, 1);
      
      // Now trigger update when it should throw
      shouldThrow = true;
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      parent.dispatchEvent(new Event("update"));
      // Error is caught and logged
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("should handle className object with empty string", () => {
      const cnResult = { className: "" };
      const modifier = () => cnResult;
      
      applyNodeModifier(parent, modifier, 0);
      expect(parent.className).toBe("");
    });
  });

  describe("NodeModFn edge cases", () => {
    it("should handle NodeModFn that returns null", () => {
      const modifier = () => null;
      const result = applyNodeModifier(parent, modifier, 0);
      expect(result).toBeNull();
    });

    it("should handle NodeModFn that returns undefined", () => {
      const modifier = () => undefined;
      const result = applyNodeModifier(parent, modifier, 0);
      expect(result).toBeNull();
    });

    it("should handle NodeModFn that returns a primitive", () => {
      const modifier = () => "text content";
      const result = applyNodeModifier(parent, modifier, 0);
      expect(result).toBeInstanceOf(DocumentFragment);
      expect(result?.textContent).toBe("text content");
    });

    it("should handle NodeModFn that returns a Node", () => {
      const span = document.createElement("span");
      const modifier = (parent: HTMLElement) => span;
      const result = applyNodeModifier(parent, modifier, 0);
      expect(result).toBe(span);
    });

    it("should handle NodeModFn that returns an object (attributes)", () => {
      const modifier = (parent: HTMLElement) => ({ id: "test", className: "my-class" });
      const result = applyNodeModifier(parent, modifier, 0);
      expect(result).toBeNull();
      expect(parent.id).toBe("test");
      expect(parent.className).toBe("my-class");
    });

    it("should ignore NodeModFn that returns a function", () => {
      const modifier = (_parent: HTMLElement) => (() => "not-a-node") as any;
      const result = applyNodeModifier(parent, modifier as any, 0);
      expect(result).toBeNull();
    });

    it("should handle NodeModFn that throws", () => {
      const modifier = (parent: HTMLElement) => {
        throw new Error("modifier error");
      };
      
      // NodeModFn that throws will propagate the error
      expect(() => {
        applyNodeModifier(parent, modifier, 0);
      }).toThrow("modifier error");
    });
  });

  describe("non-function modifier edge cases", () => {
    it("should handle null modifier", () => {
      const result = applyNodeModifier(parent, null, 0);
      expect(result).toBeNull();
    });

    it("should handle undefined modifier", () => {
      const result = applyNodeModifier(parent, undefined, 0);
      expect(result).toBeNull();
    });

    it("should handle primitive modifier (string)", () => {
      const result = applyNodeModifier(parent, "text", 0);
      expect(result).toBeInstanceOf(DocumentFragment);
      expect(result?.textContent).toBe("text");
    });

    it("should handle primitive modifier (number)", () => {
      const result = applyNodeModifier(parent, 42, 0);
      expect(result).toBeInstanceOf(DocumentFragment);
      expect(result?.textContent).toBe("42");
    });

    it("should handle primitive modifier (boolean)", () => {
      const result = applyNodeModifier(parent, true, 0);
      expect(result).toBeInstanceOf(DocumentFragment);
      expect(result?.textContent).toBe("true");
    });

    it("should handle Node modifier", () => {
      const span = document.createElement("span");
      const result = applyNodeModifier(parent, span, 0);
      expect(result).toBe(span);
    });

    it("should handle object modifier (attributes)", () => {
      const result = applyNodeModifier(parent, { id: "test" }, 0);
      expect(result).toBeNull();
      expect(parent.id).toBe("test");
    });
  });

  describe("reactive text fragment creation", () => {
    it("should create fragment with comment and text node", () => {
      const modifier = () => "reactive text";
      const result = applyNodeModifier(parent, modifier, 0);
      
      expect(result).toBeInstanceOf(DocumentFragment);
      expect(result?.childNodes.length).toBe(2); // comment + text
      expect(result?.firstChild?.nodeType).toBe(Node.COMMENT_NODE);
      expect(result?.lastChild?.nodeType).toBe(Node.TEXT_NODE);
    });

    it("should use correct index in comment", () => {
      const modifier = () => "text";
      const result = applyNodeModifier(parent, modifier, 5);
      
      const comment = result?.firstChild as Comment;
      expect(comment?.textContent).toContain("text-5");
    });

    it("should handle pre-evaluated value in reactive text", () => {
      const modifier = () => "value";
      const result = applyNodeModifier(parent, modifier, 0);
      
      // The pre-evaluated value should be used
      expect(result?.textContent).toBe("value");
    });
  });

  describe("static text fragment creation", () => {
    it("should create fragment with comment and text node for static text", () => {
      const modifier = () => "static";
      const result = applyNodeModifier(parent, modifier, 0);
      
      expect(result).toBeInstanceOf(DocumentFragment);
      expect(result?.childNodes.length).toBe(2);
    });

    it("should handle different primitive types in static fragments", () => {
      const numberMod = () => 42;
      const boolMod = () => true;
      
      const numResult = applyNodeModifier(parent, numberMod, 0);
      const boolResult = applyNodeModifier(parent, boolMod, 1);
      
      expect(numResult?.textContent).toBe("42");
      expect(boolResult?.textContent).toBe("true");
    });
  });
});
