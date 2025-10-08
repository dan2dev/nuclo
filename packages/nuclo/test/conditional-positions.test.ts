/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest";
import { update } from "../src";

// Access global tag builders
declare const div: any;
declare const span: any;

describe("Conditional Rendering - Boolean in Any Position", () => {
  let container: HTMLDivElement;
  let data: { color: string; visible: boolean; size: string };

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    data = { color: "green", visible: true, size: "large" };
  });

  it("should work with boolean function as first modifier", () => {
    const element = div(
      () => data.visible,
      "First position",
      { className: "test-first" }
    )(container);

    container.appendChild(element as Node);

    // Should be visible initially
    expect(container.querySelector(".test-first")).toBeTruthy();

    // Hide it
    data.visible = false;
    update();
    expect(container.querySelector(".test-first")).toBeFalsy();

    // Show it again
    data.visible = true;
    update();
    expect(container.querySelector(".test-first")).toBeTruthy();
  });

  it("should work with boolean function as second modifier", () => {
    const element = div(
      "Second position content",
      () => data.visible,
      { className: "test-second" }
    )(container);

    container.appendChild(element as Node);

    // Should be visible initially
    expect(container.querySelector(".test-second")).toBeTruthy();
    expect(container.querySelector(".test-second")?.textContent).toBe("Second position content");

    // Hide it
    data.visible = false;
    update();
    expect(container.querySelector(".test-second")).toBeFalsy();

    // Show it again
    data.visible = true;
    update();
    const restoredElement = container.querySelector(".test-second");
    expect(restoredElement).toBeTruthy();
    expect(restoredElement?.textContent).toBe("Second position content");
  });

  it("should work with boolean function as third modifier", () => {
    const element = div(
      "Third position content",
      { className: "test-third" },
      () => data.visible
    )(container);

    container.appendChild(element as Node);

    // Should be visible initially
    expect(container.querySelector(".test-third")).toBeTruthy();
    expect(container.querySelector(".test-third")?.textContent).toBe("Third position content");

    // Hide it
    data.visible = false;
    update();
    expect(container.querySelector(".test-third")).toBeFalsy();

    // Show it again
    data.visible = true;
    update();
    const restoredElement = container.querySelector(".test-third");
    expect(restoredElement).toBeTruthy();
    expect(restoredElement?.textContent).toBe("Third position content");
  });

  it("should work with boolean function in middle of multiple modifiers", () => {
    const element = div(
      "Before condition",
      { id: "middle-test" },
      () => data.color === "green",
      span("Nested content"),
      { className: "test-middle" }
    )(container);

    container.appendChild(element as Node);

    // Should be visible initially with all content
    const divElement = container.querySelector("#middle-test");
    expect(divElement).toBeTruthy();
    expect(divElement?.textContent).toContain("Before condition");
    expect(divElement?.textContent).toContain("Nested content");
    expect(divElement?.className).toBe("test-middle");

    // Hide it
    data.color = "red";
    update();
    expect(container.querySelector("#middle-test")).toBeFalsy();

    // Show it again
    data.color = "green";
    update();
    const restoredElement = container.querySelector("#middle-test");
    expect(restoredElement).toBeTruthy();
    expect(restoredElement?.textContent).toContain("Before condition");
    expect(restoredElement?.textContent).toContain("Nested content");
    expect(restoredElement?.className).toBe("test-middle");
  });

  it("should work with complex boolean expressions in any position", () => {
    const element = div(
      { style: { color: "blue" } },
      "Complex condition test",
      () => data.visible && data.color === "green" && data.size === "large",
      { className: "complex-test" }
    )(container);

    container.appendChild(element as Node);

    // Should be visible initially (all conditions true)
    expect(container.querySelector(".complex-test")).toBeTruthy();

    // Make one condition false
    data.size = "small";
    update();
    expect(container.querySelector(".complex-test")).toBeFalsy();

    // Make all conditions true again
    data.size = "large";
    update();
    expect(container.querySelector(".complex-test")).toBeTruthy();
  });

  it("should not treat boolean functions as conditional when only primitives present", () => {
    // This should be treated as reactive text, not conditional rendering
    const element = div(
      "Boolean value: ",
      () => data.visible,
      " - End"
    )(container);

    container.appendChild(element as Node);

    // Should render the boolean value as text
    expect(container.textContent).toContain("Boolean value: true - End");

    // Update the boolean
    data.visible = false;
    update();

    // Should update the text content, not hide the element
    expect(container.textContent).toContain("Boolean value: false - End");
    expect(container.querySelector("div")).toBeTruthy(); // Element should still exist
  });

  it("should handle multiple potential conditional functions correctly", () => {
    // Only the first boolean function with non-primitive context should be treated as conditional
    const element = div(
      () => data.visible, // This should be conditional (has attributes below)
      "Content here",
      () => data.color === "green", // This should be treated as reactive text
      { className: "multi-bool-test" }
    )(container);

    container.appendChild(element as Node);

    // Should be visible initially
    expect(container.querySelector(".multi-bool-test")).toBeTruthy();

    // Hide using the first condition
    data.visible = false;
    update();
    expect(container.querySelector(".multi-bool-test")).toBeFalsy();

    // Show again
    data.visible = true;
    update();
    expect(container.querySelector(".multi-bool-test")).toBeTruthy();
  });

  it("should preserve all non-conditional modifiers when toggling", () => {
    const nestedElement = span("Nested span content");
    const element = div(
      "Text before",
      { id: "preserve-test", style: { fontSize: "16px" } },
      nestedElement,
      () => data.visible,
      "Text after",
      { className: "preserve-class", "data-test": "preserve-attr" }
    )(container);

    container.appendChild(element as Node);

    // Verify initial state
    const initialElement = container.querySelector("#preserve-test");
    expect(initialElement).toBeTruthy();
    expect(initialElement?.className).toBe("preserve-class");
    expect(initialElement?.getAttribute("data-test")).toBe("preserve-attr");
    expect((initialElement as HTMLElement)?.style.fontSize).toBe("16px");
    expect(initialElement?.textContent).toContain("Text before");
    expect(initialElement?.textContent).toContain("Text after");
    expect(initialElement?.textContent).toContain("Nested span content");

    // Hide and show
    data.visible = false;
    update();
    expect(container.querySelector("#preserve-test")).toBeFalsy();

    data.visible = true;
    update();

    // Verify all properties are preserved
    const restoredElement = container.querySelector("#preserve-test");
    expect(restoredElement).toBeTruthy();
    expect(restoredElement?.className).toBe("preserve-class");
    expect(restoredElement?.getAttribute("data-test")).toBe("preserve-attr");
    expect((restoredElement as HTMLElement)?.style.fontSize).toBe("16px");
    expect(restoredElement?.textContent).toContain("Text before");
    expect(restoredElement?.textContent).toContain("Text after");
    expect(restoredElement?.textContent).toContain("Nested span content");
  });

  it("should work with Boolean() wrapper in any position", () => {
    const element = div(
      { className: "wrapper-test" },
      "Content with Boolean wrapper",
      () => Boolean(data.color === "green")
    )(container);

    container.appendChild(element as Node);

    // Should be visible initially
    expect(container.querySelector(".wrapper-test")).toBeTruthy();

    // Hide it
    data.color = "red";
    update();
    expect(container.querySelector(".wrapper-test")).toBeFalsy();

    // Show it again
    data.color = "green";
    update();
    expect(container.querySelector(".wrapper-test")).toBeTruthy();
  });
});