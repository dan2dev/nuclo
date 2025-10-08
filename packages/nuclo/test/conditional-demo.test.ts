/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest";
import { update } from "../src";

// Access global tag builders
declare const div: any;

describe("Conditional Element Demo - Your Exact Use Case", () => {
  let container: HTMLDivElement;
  let data: { color: string };

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    data = { color: "green" };
  });

  it("should work with your exact example syntax", () => {
    // Your exact example:
    const element = div(
      () => Boolean(data.color === "green"), 
      "this will show only when data.color === green", 
      { className: "green" }
    )(container);

    container.appendChild(element as Node);

    // When condition is true, element should be visible
    const greenDiv = container.querySelector(".green");
    expect(greenDiv).toBeTruthy();
    expect(greenDiv?.textContent).toBe("this will show only when data.color === green");
    expect(greenDiv?.className).toBe("green");

    // Change data to make condition false
    data.color = "red";
    update();

    // Element should now be hidden (replaced with comment placeholder)
    const greenDivAfter = container.querySelector(".green");
    expect(greenDivAfter).toBeFalsy();

    // Should have comment placeholder instead
    const comments = Array.from(container.childNodes).filter(
      node => node.nodeType === Node.COMMENT_NODE
    );
    expect(comments.length).toBeGreaterThan(0);

    // Change back to green
    data.color = "green";
    update();

    // Element should be visible again
    const greenDivRestored = container.querySelector(".green");
    expect(greenDivRestored).toBeTruthy();
    expect(greenDivRestored?.textContent).toBe("this will show only when data.color === green");
    expect(greenDivRestored?.className).toBe("green");
  });

  it("should work without Boolean() wrapper", () => {
    // Also works without explicit Boolean() call:
    const element = div(
      () => data.color === "blue", 
      "Blue content", 
      { className: "blue" }
    )(container);

    container.appendChild(element as Node);

    // Initially false - should be hidden
    expect(container.querySelector(".blue")).toBeFalsy();

    // Make condition true
    data.color = "blue";
    update();

    // Should now be visible
    const blueDiv = container.querySelector(".blue");
    expect(blueDiv).toBeTruthy();
    expect(blueDiv?.textContent).toBe("Blue content");
    expect(blueDiv?.className).toBe("blue");
  });

  it("should maintain comment placeholder when condition is false", () => {
    const element = div(
      () => data.color === "purple", 
      "Purple content", 
      { className: "purple" }
    )(container);

    container.appendChild(element as Node);

    // Condition is false, so we should have a comment placeholder
    expect(container.querySelector(".purple")).toBeFalsy();
    
    // Check that we have a comment node (the placeholder)
    const hasComment = Array.from(container.childNodes).some(
      node => node.nodeType === Node.COMMENT_NODE && 
               node.nodeValue?.includes("conditional-div")
    );
    expect(hasComment).toBeTruthy();
  });

  it("should work with complex nested content", () => {
    const element = div(
      () => data.color === "green",
      "Main content",
      div("Nested div"),
      { className: "complex" }
    )(container);

    container.appendChild(element as Node);

    // Should be visible with nested content
    const complexDiv = container.querySelector(".complex");
    expect(complexDiv).toBeTruthy();
    
    const nestedDiv = complexDiv?.querySelector("div");
    expect(nestedDiv).toBeTruthy();
    expect(nestedDiv?.textContent).toBe("Nested div");
    
    // Hide it
    data.color = "other";
    update();
    
    // Should be hidden
    expect(container.querySelector(".complex")).toBeFalsy();
    
    // Show it again
    data.color = "green";
    update();
    
    // Should be back with all nested content
    const restoredDiv = container.querySelector(".complex");
    expect(restoredDiv).toBeTruthy();
    expect(restoredDiv?.querySelector("div")?.textContent).toBe("Nested div");
  });
});