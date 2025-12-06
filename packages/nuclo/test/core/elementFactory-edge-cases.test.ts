/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createHtmlTagBuilder, createSvgTagBuilder } from "../../src/core/elementFactory";

describe("elementFactory edge cases", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe("createHtmlTagBuilder", () => {
    it("should create element with no modifiers", () => {
      const div = createHtmlTagBuilder("div");
      const element = div()(container, 0);
      expect(element).toBeInstanceOf(HTMLDivElement);
      expect(element.tagName).toBe("DIV");
    });

    it("should create element with attributes modifier", () => {
      const div = createHtmlTagBuilder("div");
      const element = div({ id: "test", className: "my-class" })(container, 0);
      expect(element.id).toBe("test");
      expect(element.className).toBe("my-class");
    });

    it("should handle conditional modifier", () => {
      const div = createHtmlTagBuilder("div");
      const condition = () => true;
      const element = div(condition, { id: "test" })(container, 0);
      expect(element).toBeInstanceOf(HTMLDivElement);
      expect(element.id).toBe("test");
    });

    it("should handle conditional modifier that returns false", () => {
      const div = createHtmlTagBuilder("div");
      const condition = () => false;
      const result = div(condition, { id: "test" })(container, 0);
      expect(result).toBeInstanceOf(Comment);
    });

    it("should handle multiple modifiers", () => {
      const div = createHtmlTagBuilder("div");
      const element = div(
        { id: "test" },
        { className: "class1" },
        "text content"
      )(container, 0);
      expect(element.id).toBe("test");
      expect(element.className).toBe("class1");
      // Text content is appended to the element, not container
      expect(element.textContent).toContain("text content");
    });

    it("should handle function modifiers", () => {
      const div = createHtmlTagBuilder("div");
      const fnModifier = (parent: HTMLElement) => {
        const span = document.createElement("span");
        span.textContent = "from function";
        return span;
      };
      const element = div(fnModifier)(container, 0);
      expect(element).toBeInstanceOf(HTMLDivElement);
      // The span is appended to the element, not container
      expect(element.querySelector("span")).toBeTruthy();
    });

    it("should handle null/undefined modifiers", () => {
      const div = createHtmlTagBuilder("div");
      const element = div(null, undefined, { id: "test" })(container, 0);
      expect(element.id).toBe("test");
    });

    it("should work with different HTML tag names", () => {
      const button = createHtmlTagBuilder("button");
      const input = createHtmlTagBuilder("input");
      const span = createHtmlTagBuilder("span");

      expect(button()(container, 0).tagName).toBe("BUTTON");
      expect(input()(container, 0).tagName).toBe("INPUT");
      expect(span()(container, 0).tagName).toBe("SPAN");
    });
  });

  describe("createSvgTagBuilder", () => {
    it("should create SVG element with no modifiers", () => {
      const circle = createSvgTagBuilder("circle");
      const element = circle()(container, 0);
      expect(element.tagName.toLowerCase()).toBe("circle");
      expect(element.namespaceURI).toBe("http://www.w3.org/2000/svg");
    });

    it("should create SVG element with attributes", () => {
      const circle = createSvgTagBuilder("circle");
      const element = circle({ cx: 10, cy: 20, r: 5 })(container, 0);
      expect(element.getAttribute("cx")).toBe("10");
      expect(element.getAttribute("cy")).toBe("20");
      expect(element.getAttribute("r")).toBe("5");
    });

    it("should handle conditional modifier", () => {
      const circle = createSvgTagBuilder("circle");
      const condition = () => true;
      const element = circle(condition, { cx: 10 })(container, 0);
      expect(element.tagName.toLowerCase()).toBe("circle");
      expect(element.getAttribute("cx")).toBe("10");
    });

    it("should handle conditional modifier that returns false", () => {
      const circle = createSvgTagBuilder("circle");
      const condition = () => false;
      const result = circle(condition, { cx: 10 })(container, 0);
      expect(result).toBeInstanceOf(Comment);
    });

    it("should handle multiple SVG elements", () => {
      const circle = createSvgTagBuilder("circle");
      const rect = createSvgTagBuilder("rect");
      const path = createSvgTagBuilder("path");

      expect(circle()(container, 0).tagName).toBe("circle");
      expect(rect()(container, 0).tagName).toBe("rect");
      expect(path()(container, 0).tagName).toBe("path");
    });

    it("should handle function modifiers in SVG", () => {
      const circle = createSvgTagBuilder("circle");
      const fnModifier = (parent: HTMLElement) => {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        return rect;
      };
      const element = circle(fnModifier)(container, 0);
      expect(element.tagName.toLowerCase()).toBe("circle");
    });

    it("should handle non-zero-arity function as non-conditional", () => {
      const circle = createSvgTagBuilder("circle");
      const fnWithParams = (x: number) => x > 0;
      // This should not be treated as a conditional
      const element = circle(fnWithParams, { cx: 10 })(container, 0);
      expect(element.tagName.toLowerCase()).toBe("circle");
    });
  });
});

