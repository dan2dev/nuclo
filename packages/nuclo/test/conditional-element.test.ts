/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest";
import { update } from "../src";

// Access global tag builders
declare const div: any;
declare const span: any;

describe("Conditional Element Rendering", () => {
  let container: HTMLDivElement;
  let data: { color: string; visible: boolean };

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    data = { color: "green", visible: true };
  });

  it("should render element when condition is true", () => {
    const element = div(
      () => data.color === "green",
      "This shows when green",
      { className: "green-element" }
    )(container);

    container.appendChild(element as Node);

    // Should have the actual div element
    const divElement = container.querySelector("div");
    expect(divElement).toBeTruthy();
    expect(divElement?.textContent).toBe("This shows when green");
    expect(divElement?.className).toBe("green-element");
  });

  it("should hide element with comment placeholder when condition is false", () => {
    const element = div(
      () => data.color === "red",
      "This shows when red",
      { className: "red-element" }
    )(container);

    container.appendChild(element as Node);

    // Should have a comment placeholder, not a div
    const divElement = container.querySelector("div");
    expect(divElement).toBeFalsy();

    // Should have a comment node
    const comments = Array.from(container.childNodes).filter(
      node => node.nodeType === Node.COMMENT_NODE
    );
    expect(comments.length).toBeGreaterThan(0);
  });

  it("should toggle element visibility when condition changes", () => {
    const element = div(
      () => data.visible,
      "Toggle me",
      { className: "toggle-element" }
    )(container);

    container.appendChild(element as Node);

    // Initially visible
    let divElement = container.querySelector("div");
    expect(divElement).toBeTruthy();
    expect(divElement?.textContent).toBe("Toggle me");

    // Hide it
    data.visible = false;
    update();

    // Should be hidden now
    divElement = container.querySelector("div");
    expect(divElement).toBeFalsy();

    // Show it again
    data.visible = true;
    update();

    // Should be visible again
    divElement = container.querySelector("div");
    expect(divElement).toBeTruthy();
    expect(divElement?.textContent).toBe("Toggle me");
    expect(divElement?.className).toBe("toggle-element");
  });

  it("should work with nested elements", () => {
    const element = div(
      () => data.color === "green",
      span("Nested content"),
      { className: "outer" }
    )(container);

    container.appendChild(element as Node);

    const divElement = container.querySelector("div");
    expect(divElement).toBeTruthy();
    
    const spanElement = divElement?.querySelector("span");
    expect(spanElement).toBeTruthy();
    expect(spanElement?.textContent).toBe("Nested content");
  });

  it("should work with multiple conditional elements", () => {
    const element1 = div(
      () => data.color === "green",
      "Green div",
      { className: "green" }
    )(container);

    const element2 = div(
      () => data.color === "blue",
      "Blue div",
      { className: "blue" }
    )(container);

    container.appendChild(element1 as Node);
    container.appendChild(element2 as Node);

    // Only green should be visible
    const greenDiv = container.querySelector(".green");
    const blueDiv = container.querySelector(".blue");
    
    expect(greenDiv).toBeTruthy();
    expect(blueDiv).toBeFalsy();

    // Change condition
    data.color = "blue";
    update();

    // Now only blue should be visible
    const greenDivAfter = container.querySelector(".green");
    const blueDivAfter = container.querySelector(".blue");
    
    expect(greenDivAfter).toBeFalsy();
    expect(blueDivAfter).toBeTruthy();
  });

  it("should handle boolean true/false directly", () => {
    const alwaysVisible = div(
      () => true,
      "Always visible",
      { className: "always" }
    )(container);

    const neverVisible = div(
      () => false,
      "Never visible",
      { className: "never" }
    )(container);

    container.appendChild(alwaysVisible as Node);
    container.appendChild(neverVisible as Node);

    const visibleDiv = container.querySelector("div");
    expect(visibleDiv).toBeTruthy();
    expect(visibleDiv?.textContent).toBe("Always visible");
    expect(visibleDiv?.className).toBe("always");

    // Should only have one div element
    const allDivs = container.querySelectorAll("div");
    expect(allDivs.length).toBe(1);
  });

  it("should preserve element when condition remains true across updates", () => {
    const element = div(
      () => data.visible,
      "Persistent element",
      { id: "persistent" }
    )(container);

    container.appendChild(element as Node);

    const originalDiv = container.querySelector("#persistent");
    expect(originalDiv).toBeTruthy();

    // Update but keep condition true
    data.color = "changed";
    update();

    const divAfterUpdate = container.querySelector("#persistent");
    expect(divAfterUpdate).toBe(originalDiv); // Should be the same element reference
  });
});