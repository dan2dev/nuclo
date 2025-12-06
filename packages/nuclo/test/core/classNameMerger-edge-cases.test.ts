/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach } from "vitest";
import {
  initReactiveClassName,
  hasReactiveClassName,
  addStaticClasses,
  mergeReactiveClassName,
  mergeStaticClassName,
} from "../../src/core/classNameMerger";

describe("classNameMerger edge cases", () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement("div");
  });

  describe("initReactiveClassName", () => {
    it("should handle element with existing className", () => {
      element.className = "existing class1 class2";
      initReactiveClassName(element);
      expect(hasReactiveClassName(element)).toBe(true);
      expect(element.className).toBe("existing class1 class2");
    });

    it("should handle element with empty className", () => {
      element.className = "";
      initReactiveClassName(element);
      expect(hasReactiveClassName(element)).toBe(true);
      expect(element.className).toBe("");
    });

    it("should handle element with whitespace-only className", () => {
      element.className = "   ";
      initReactiveClassName(element);
      expect(hasReactiveClassName(element)).toBe(true);
    });

    it("should preserve static classes when called multiple times", () => {
      element.className = "static1 static2";
      initReactiveClassName(element);
      const firstStatic = (element as any).__nuclo_static_className__;
      
      element.className = "static1 static2 static3";
      initReactiveClassName(element);
      const secondStatic = (element as any).__nuclo_static_className__;
      
      // Should preserve original static classes
      expect(firstStatic).toEqual(secondStatic);
    });
  });

  describe("addStaticClasses", () => {
    it("should handle empty string", () => {
      addStaticClasses(element, "");
      expect((element as any).__nuclo_static_className__).toBeUndefined();
    });

    it("should handle whitespace-only string", () => {
      addStaticClasses(element, "   ");
      const staticClasses = (element as any).__nuclo_static_className__;
      expect(staticClasses).toBeDefined();
      expect(staticClasses.size).toBe(0);
    });

    it("should handle multiple spaces between classes", () => {
      addStaticClasses(element, "class1  class2   class3");
      const staticClasses = (element as any).__nuclo_static_className__;
      expect(staticClasses.has("class1")).toBe(true);
      expect(staticClasses.has("class2")).toBe(true);
      expect(staticClasses.has("class3")).toBe(true);
    });

    it("should add classes incrementally", () => {
      addStaticClasses(element, "class1");
      addStaticClasses(element, "class2");
      const staticClasses = (element as any).__nuclo_static_className__;
      expect(staticClasses.has("class1")).toBe(true);
      expect(staticClasses.has("class2")).toBe(true);
    });

    it("should not add duplicate classes", () => {
      addStaticClasses(element, "class1");
      addStaticClasses(element, "class1");
      const staticClasses = (element as any).__nuclo_static_className__;
      expect(staticClasses.size).toBe(1);
    });
  });

  describe("mergeReactiveClassName", () => {
    it("should handle element with no static classes and no reactive className", () => {
      initReactiveClassName(element);
      mergeReactiveClassName(element, "");
      expect(element.className).toBe("");
    });

    it("should handle element with static classes but no reactive className", () => {
      element.className = "static1 static2";
      initReactiveClassName(element);
      mergeReactiveClassName(element, "");
      expect(element.className).toBe("static1 static2");
    });

    it("should handle element with reactive className but no static classes", () => {
      initReactiveClassName(element);
      mergeReactiveClassName(element, "reactive1 reactive2");
      expect(element.className).toBe("reactive1 reactive2");
    });

    it("should merge static and reactive classes correctly", () => {
      element.className = "static1 static2";
      initReactiveClassName(element);
      mergeReactiveClassName(element, "reactive1 reactive2");
      const classes = element.className.split(" ").filter(Boolean);
      expect(classes).toContain("static1");
      expect(classes).toContain("static2");
      expect(classes).toContain("reactive1");
      expect(classes).toContain("reactive2");
    });

    it("should handle overlapping classes (reactive overrides)", () => {
      element.className = "static1 static2";
      initReactiveClassName(element);
      mergeReactiveClassName(element, "static1 reactive1");
      const classes = element.className.split(" ").filter(Boolean);
      expect(classes).toContain("static1");
      expect(classes).toContain("static2");
      expect(classes).toContain("reactive1");
      // Should not have duplicates
      expect(classes.filter(c => c === "static1").length).toBe(1);
    });

    it("should handle whitespace in reactive className", () => {
      element.className = "static1";
      initReactiveClassName(element);
      mergeReactiveClassName(element, "  reactive1  reactive2  ");
      const classes = element.className.split(" ").filter(Boolean);
      expect(classes).toContain("static1");
      expect(classes).toContain("reactive1");
      expect(classes).toContain("reactive2");
    });

    it("should handle empty reactive className after having one", () => {
      element.className = "static1";
      initReactiveClassName(element);
      mergeReactiveClassName(element, "reactive1");
      mergeReactiveClassName(element, "");
      expect(element.className).toBe("static1");
    });
  });

  describe("mergeStaticClassName", () => {
    it("should handle empty string", () => {
      element.className = "existing";
      mergeStaticClassName(element, "");
      expect(element.className).toBe("existing");
    });

    it("should handle element with no existing className", () => {
      element.className = "";
      mergeStaticClassName(element, "new1 new2");
      expect(element.className).toBe("new1 new2");
    });

    it("should merge with existing className", () => {
      element.className = "existing1 existing2";
      mergeStaticClassName(element, "new1 new2");
      const classes = element.className.split(" ").filter(Boolean);
      expect(classes).toContain("existing1");
      expect(classes).toContain("existing2");
      expect(classes).toContain("new1");
      expect(classes).toContain("new2");
    });

    it("should not add duplicate classes", () => {
      element.className = "existing1";
      mergeStaticClassName(element, "existing1 new1");
      const classes = element.className.split(" ").filter(Boolean);
      expect(classes.filter(c => c === "existing1").length).toBe(1);
      expect(classes).toContain("new1");
    });

    it("should handle same className (no change)", () => {
      element.className = "existing1";
      mergeStaticClassName(element, "existing1");
      expect(element.className).toBe("existing1");
    });

    it("should handle whitespace in new className", () => {
      element.className = "existing1";
      mergeStaticClassName(element, "  new1  new2  ");
      const classes = element.className.split(" ").filter(Boolean);
      expect(classes).toContain("existing1");
      expect(classes).toContain("new1");
      expect(classes).toContain("new2");
    });
  });
});

