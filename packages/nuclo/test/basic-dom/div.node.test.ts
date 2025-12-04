// @vitest-environment node
import '../../src/polyfill';
import "../../src/index";
import { describe, it, expect } from "vitest";

describe("div NodeBuilder (Node.js)", () => {
  it("should create a div element", () => {
    // Create a dummy parent element
    const parent = document.createElement("div");
    // Use the div NodeBuilder
    const nodeBuilder = div();
    const element = nodeBuilder(parent, 0);
    expect(element.tagName.toLowerCase()).toBe("div");
  });

  it("should append children and text nodes", () => {
    const parent = document.createElement("div");
    const nodeBuilder = div("Hello, ", document.createElement("span"), () => "World!");
    const element = nodeBuilder(parent, 0);
    
    // In Node polyfill, children array contains elements, not all nodes
    expect(element.children.length).toBeGreaterThan(0);
    
    // Check that span was added
    const spanChild = Array.from(element.children).find((child: any) => child.tagName === 'span');
    expect(spanChild).toBeTruthy();
  });

  it("should set attributes and properties", () => {
    const parent = document.createElement("div");
    const nodeBuilder = div({ id: "test-div", className: "my-class" }, "Content");
    const element = nodeBuilder(parent, 0);
    expect(element.id).toBe("test-div");
    expect(element.className).toBe("my-class");
  });

  it("should handle null and undefined children gracefully", () => {
    const parent = document.createElement("div");
    const nodeBuilder = div(
      null,
      undefined,
      "Valid Text",
      () => null,
      () => undefined,
    );
    const element = nodeBuilder(parent, 0);
    // Should create element without errors
    expect(element.tagName.toLowerCase()).toBe("div");
  });

  it("should handle nested divs", () => {
    const parent = document.createElement("div");
    const nodeBuilder = div(div("Nested Content"));
    const element = nodeBuilder(parent, 0);
    expect(element.children.length).toBe(1);
    expect(element.children[0].tagName.toLowerCase()).toBe("div");
  });
});

