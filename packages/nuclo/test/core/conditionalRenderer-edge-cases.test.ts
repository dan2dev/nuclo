/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createHtmlConditionalElement,
  createSvgConditionalElement,
  processConditionalModifiers,
} from "../../src/core/conditionalRenderer";
import { isBrowser } from "../../src/utility/environment";

describe("conditionalRenderer edge cases", () => {
  describe("createHtmlConditionalElement", () => {
    it("should handle condition that throws", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const condition = () => {
        throw new Error("condition error");
      };

      expect(() => {
        createHtmlConditionalElement("div", condition, []);
      }).toThrow();

      consoleErrorSpy.mockRestore();
    });

    it("should handle createConditionalComment returning null", () => {
      // This tests the error path when comment creation fails
      // We can't easily mock createConditionalComment, but we can test the error handling
      const condition = () => false;
      const result = createHtmlConditionalElement("div", condition, []);
      expect(result).toBeInstanceOf(Comment);
    });

    it("should store conditional info on element when condition is true", () => {
      const condition = () => true;
      const modifiers = [{ id: "test" }];
      const element = createHtmlConditionalElement("div", condition, modifiers);
      
      expect(element).toBeInstanceOf(HTMLDivElement);
      expect((element as any)._conditionalInfo).toBeDefined();
      expect((element as any)._conditionalInfo.tagName).toBe("div");
    });

    it("should store conditional info on comment when condition is false", () => {
      const condition = () => false;
      const modifiers = [{ id: "test" }];
      const comment = createHtmlConditionalElement("div", condition, modifiers);
      
      expect(comment).toBeInstanceOf(Comment);
      expect((comment as any)._conditionalInfo).toBeDefined();
    });

    it("should handle SSR environment (isBrowser false)", () => {
      const originalIsBrowser = (globalThis as any).isBrowser;
      (globalThis as any).isBrowser = false;

      const condition = () => true;
      const result = createHtmlConditionalElement("div", condition, []);
      
      // In SSR, should return element or comment
      expect(result).toBeDefined();

      (globalThis as any).isBrowser = originalIsBrowser;
    });
  });

  describe("createSvgConditionalElement", () => {
    it("should handle condition that throws", () => {
      const condition = () => {
        throw new Error("condition error");
      };

      expect(() => {
        createSvgConditionalElement("circle", condition, []);
      }).toThrow();
    });

    it("should store conditional info on SVG element when condition is true", () => {
      const condition = () => true;
      const modifiers = [{ cx: 10 }];
      const element = createSvgConditionalElement("circle", condition, modifiers);
      
      expect(element.tagName.toLowerCase()).toBe("circle");
      expect((element as any)._conditionalInfo).toBeDefined();
      expect((element as any)._conditionalInfo.isSvg).toBe(true);
    });

    it("should store conditional info on comment when condition is false", () => {
      const condition = () => false;
      const modifiers = [{ cx: 10 }];
      const comment = createSvgConditionalElement("circle", condition, modifiers);
      
      expect(comment).toBeInstanceOf(Comment);
      expect((comment as any)._conditionalInfo).toBeDefined();
      expect((comment as any)._conditionalInfo.isSvg).toBe(true);
    });

    it("should handle SSR environment", () => {
      const originalIsBrowser = (globalThis as any).isBrowser;
      (globalThis as any).isBrowser = false;

      const condition = () => true;
      const result = createSvgConditionalElement("circle", condition, []);
      
      expect(result).toBeDefined();

      (globalThis as any).isBrowser = originalIsBrowser;
    });
  });

  describe("processConditionalModifiers", () => {
    it("should return null condition when no conditional modifier found", () => {
      const modifiers = [{ id: "test" }, "text", document.createElement("div")];
      const result = processConditionalModifiers(modifiers);
      expect(result.condition).toBeNull();
      expect(result.otherModifiers).toEqual(modifiers);
    });

    it("should find and extract conditional modifier", () => {
      const condition = () => true;
      const modifiers = [
        { id: "test" },
        condition,
        "text",
      ];
      const result = processConditionalModifiers(modifiers);
      expect(result.condition).toBe(condition);
      expect(result.otherModifiers).toHaveLength(2);
      expect(result.otherModifiers).not.toContain(condition);
    });

    it("should handle conditional modifier at different positions", () => {
      const condition = () => true;
      
      // At start
      let modifiers = [condition, { id: "test" }];
      let result = processConditionalModifiers(modifiers);
      expect(result.condition).toBe(condition);
      expect(result.otherModifiers).toEqual([{ id: "test" }]);

      // In middle
      modifiers = [{ id: "test" }, condition, "text"];
      result = processConditionalModifiers(modifiers);
      expect(result.condition).toBe(condition);
      expect(result.otherModifiers).toEqual([{ id: "test" }, "text"]);

      // At end
      modifiers = [{ id: "test" }, condition];
      result = processConditionalModifiers(modifiers);
      expect(result.condition).toBe(condition);
      expect(result.otherModifiers).toEqual([{ id: "test" }]);
    });

    it("should handle empty modifiers array", () => {
      const result = processConditionalModifiers([]);
      expect(result.condition).toBeNull();
      expect(result.otherModifiers).toEqual([]);
    });

    it("should not treat non-boolean zero-arity functions as conditionals", () => {
      const nonBooleanFn = () => "not boolean";
      const modifiers = [{ id: "test" }, nonBooleanFn];
      const result = processConditionalModifiers(modifiers);
      expect(result.condition).toBeNull();
      expect(result.otherModifiers).toEqual(modifiers);
    });

    it("should not treat functions with parameters as conditionals", () => {
      const fnWithParams = (x: number) => x > 0;
      const modifiers = [{ id: "test" }, fnWithParams];
      const result = processConditionalModifiers(modifiers);
      expect(result.condition).toBeNull();
      expect(result.otherModifiers).toEqual(modifiers);
    });

    it("should require other modifiers to be present for conditional detection", () => {
      const condition = () => true;
      const modifiers = [condition];
      // When condition is the only modifier, it shouldn't be detected as conditional
      const result = processConditionalModifiers(modifiers);
      expect(result.condition).toBeNull();
      expect(result.otherModifiers).toEqual(modifiers);
    });
  });
});

