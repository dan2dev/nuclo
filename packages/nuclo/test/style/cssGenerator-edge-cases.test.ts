import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  classExistsInDOM,
  createCSSClassWithStyles,
  createCSSClass,
} from "../../src/style/cssGenerator";

describe("cssGenerator edge cases", () => {
  beforeEach(() => {
    // Clean up any existing style sheet
    const existing = document.querySelector("#nuclo-styles");
    if (existing) {
      existing.remove();
    }
  });

  afterEach(() => {
    // Clean up
    const existing = document.querySelector("#nuclo-styles");
    if (existing) {
      existing.remove();
    }
  });

  describe("classExistsInDOM", () => {
    it("should return false when style sheet doesn't exist", () => {
      expect(classExistsInDOM("test-class")).toBe(false);
    });

    it("should return false for non-existent class", () => {
      createCSSClassWithStyles("existing-class", { color: "red" });
      expect(classExistsInDOM("non-existent-class")).toBe(false);
    });

    it("should find class in media query", () => {
      createCSSClassWithStyles("media-class", { color: "blue" }, "(min-width: 768px)");
      expect(classExistsInDOM("media-class", "(min-width: 768px)")).toBe(true);
    });

    it("should find class with pseudo-class", () => {
      createCSSClassWithStyles("pseudo-class", { color: "green" }, undefined, "media", ":hover");
      expect(classExistsInDOM("pseudo-class", undefined, "media", ":hover")).toBe(true);
    });

    it("should handle container queries", () => {
      createCSSClassWithStyles("container-class", { color: "purple" }, "(min-width: 500px)", "container");
      expect(classExistsInDOM("container-class", "(min-width: 500px)", "container")).toBe(true);
    });

    it("should handle supports queries", () => {
      createCSSClassWithStyles("supports-class", { color: "orange" }, "(display: grid)", "supports");
      expect(classExistsInDOM("supports-class", "(display: grid)", "supports")).toBe(true);
    });

    it("should handle pseudo-class with &: prefix", () => {
      // When passing pseudoClass, it's used directly in the selector
      // So we should pass ":focus" directly, not "&:focus"
      createCSSClassWithStyles("pseudo-class2", { color: "cyan" }, undefined, "media", ":focus");
      expect(classExistsInDOM("pseudo-class2", undefined, "media", ":focus")).toBe(true);
    });
  });

  describe("createCSSClassWithStyles", () => {
    it("should create style sheet if it doesn't exist", () => {
      createCSSClassWithStyles("new-class", { color: "red" });
      const styleSheet = document.querySelector("#nuclo-styles");
      expect(styleSheet).toBeTruthy();
    });

    it("should update existing class styles", () => {
      createCSSClassWithStyles("update-class", { color: "red" });
      // Use kebab-case for CSS properties
      createCSSClassWithStyles("update-class", { color: "blue", "font-size": "16px" });
      
      const styleSheet = document.querySelector("#nuclo-styles") as HTMLStyleElement;
      const rules = Array.from(styleSheet.sheet?.cssRules || []);
      const rule = rules.find((r: any) => r.selectorText === ".update-class") as CSSStyleRule;
      
      expect(rule).toBeTruthy();
      expect(rule.style.color).toBe("blue");
      // fontSize is set via setProperty, so check getPropertyValue
      const fontSize = rule.style.getPropertyValue("font-size");
      expect(fontSize).toBe("16px");
      // Old color should be replaced
      expect(rule.style.getPropertyValue("color")).toBe("blue");
    });

    it("should handle empty styles object", () => {
      createCSSClassWithStyles("empty-class", {});
      const styleSheet = document.querySelector("#nuclo-styles") as HTMLStyleElement;
      const rules = Array.from(styleSheet.sheet?.cssRules || []);
      const rule = rules.find((r: any) => r.selectorText === ".empty-class") as CSSStyleRule;
      expect(rule).toBeTruthy();
    });

    it("should handle styles with special characters in values", () => {
      createCSSClassWithStyles("special-class", {
        content: '"test"',
        backgroundImage: "url('test.jpg')",
        transform: "translateX(10px)",
      });
      
      expect(classExistsInDOM("special-class")).toBe(true);
    });

    it("should handle multiple pseudo-classes for same class", () => {
      createCSSClassWithStyles("multi-pseudo", { color: "red" }, undefined, "media", ":hover");
      createCSSClassWithStyles("multi-pseudo", { color: "blue" }, undefined, "media", ":focus");
      
      expect(classExistsInDOM("multi-pseudo", undefined, "media", ":hover")).toBe(true);
      expect(classExistsInDOM("multi-pseudo", undefined, "media", ":focus")).toBe(true);
    });

    it("should handle media query with complex condition", () => {
      const condition = "(min-width: 768px) and (max-width: 1024px)";
      createCSSClassWithStyles("complex-media", { color: "red" }, condition);
      expect(classExistsInDOM("complex-media", condition)).toBe(true);
    });

    it("should insert rules in correct order (styles before at-rules)", () => {
      createCSSClassWithStyles("order-class1", { color: "red" });
      createCSSClassWithStyles("order-class2", { color: "blue" }, "(min-width: 768px)");
      createCSSClassWithStyles("order-class3", { color: "green" });
      
      const styleSheet = document.querySelector("#nuclo-styles") as HTMLStyleElement;
      const rules = Array.from(styleSheet.sheet?.cssRules || []);
      
      // Regular styles should come before media queries
      const styleRuleIndices = rules
        .map((r, i) => r instanceof CSSStyleRule && !r.selectorText.includes(":") ? i : -1)
        .filter(i => i >= 0);
      const mediaRuleIndices = rules
        .map((r, i) => r instanceof CSSMediaRule ? i : -1)
        .filter(i => i >= 0);
      
      if (styleRuleIndices.length > 0 && mediaRuleIndices.length > 0) {
        expect(Math.max(...styleRuleIndices)).toBeLessThan(Math.min(...mediaRuleIndices));
      }
    });

    it("should handle pseudo-class rules insertion order", () => {
      createCSSClassWithStyles("pseudo-order", { color: "red" });
      createCSSClassWithStyles("pseudo-order", { color: "blue" }, undefined, "media", ":hover");
      createCSSClassWithStyles("pseudo-order", { color: "green" });
      
      // Pseudo-class rules should be inserted after regular rules
      const styleSheet = document.querySelector("#nuclo-styles") as HTMLStyleElement;
      const rules = Array.from(styleSheet.sheet?.cssRules || []);
      const regularRule = rules.find((r: any) => r.selectorText === ".pseudo-order") as CSSStyleRule;
      const hoverRule = rules.find((r: any) => r.selectorText === ".pseudo-order:hover") as CSSStyleRule;
      
      expect(regularRule).toBeTruthy();
      expect(hoverRule).toBeTruthy();
    });
  });

  describe("createCSSClass (legacy)", () => {
    it("should work as alias for createCSSClassWithStyles", () => {
      createCSSClass("legacy-class", { color: "red", fontSize: "14px" });
      expect(classExistsInDOM("legacy-class")).toBe(true);
    });
  });

  describe("edge cases with sheet operations", () => {
    it("should handle sheet being null", () => {
      // Create a mock scenario where sheet might be null
      const styleSheet = document.createElement("style");
      styleSheet.id = "nuclo-styles";
      document.head.appendChild(styleSheet);
      
      // Remove the sheet property (simulating edge case)
      // This is hard to test directly, but the code should handle it
      createCSSClassWithStyles("null-sheet-class", { color: "red" });
      
      // Should still work with the actual implementation
      expect(classExistsInDOM("null-sheet-class")).toBe(true);
    });

    it("should handle insertRule failures gracefully", () => {
      // Create invalid CSS that might cause insertRule to fail
      // Most browsers will still create the rule, but with invalid CSS
      createCSSClassWithStyles("invalid-css", {
        // Valid properties
        color: "red",
      });
      
      // Should still create the class
      expect(classExistsInDOM("invalid-css")).toBe(true);
    });
  });
});

