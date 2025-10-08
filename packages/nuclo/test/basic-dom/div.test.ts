// @vitest-environment jsdom
import "../../src/index";
import { describe, it, expect } from "vitest";

describe("div NodeBuilder", () => {
  it("should create a div element", () => {
    // Create a dummy parent element
    const parent = document.createElement("div");
    // Use the div NodeBuilder
    const nodeBuilder = div();
    const element = nodeBuilder(parent, 0);
    expect(element).toBeInstanceOf(HTMLDivElement);
    expect(element?.tagName.toLowerCase()).toBe("div");
  });

  it("should append children and text nodes", () => {
    const parent = document.createElement("div");
    const nodeBuilder = div("Hello, ", document.createElement("span"), () => "World!");
    const element = nodeBuilder(parent, 0);
    expect(element.childNodes!.length).toBe(5); // 2 text nodes with comments + 1 span = 2*2 + 1
    expect(element.childNodes![1].textContent).toBe("Hello, ");
    expect(element.childNodes![2]).toBeInstanceOf(HTMLSpanElement);
    expect(element.childNodes![4].textContent).toBe("World!");
  });

  it("should set attributes and properties", () => {
    const parent = document.createElement("div");
    const nodeBuilder = div({ id: "test-div", className: "my-class" }, "Content");
    const element = nodeBuilder(parent, 0);
    expect(element.id).toBe("test-div");
    expect(element.className).toBe("my-class");
    expect(element.textContent).toBe("Content");
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
    expect(element.childNodes!.length).toBe(2); // 1 comment + 1 text node
    expect(element.childNodes![1].textContent).toBe("Valid Text");
  });

  it("should handle nested divs", () => {
    const parent = document.createElement("div");
    const nodeBuilder = div(div("Nested Content"));
    const element = nodeBuilder(parent, 0);
    expect(element.childNodes!.length).toBe(1);
    expect((element.childNodes![0] as any).tagName.toLowerCase()).toBe("div");
    expect(element.childNodes![0].textContent).toBe("Nested Content");
  });

});
