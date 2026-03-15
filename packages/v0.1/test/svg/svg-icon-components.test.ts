/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

// Simulate the pattern used in examples/basic/src/icons.ts
import "../../src/index";

/**
 * Test that icon factory functions work when defined in a separate module
 * This simulates the real-world usage pattern in the example app
 */

const PlusIcon = () => svgSvg(
  {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    className: "icon"
  },
  lineSvg({
    x1: "12",
    y1: "5",
    x2: "12",
    y2: "19",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round"
  }),
  lineSvg({
    x1: "5",
    y1: "12",
    x2: "19",
    y2: "12",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round"
  })
);

const TrashIcon = () => svgSvg(
  {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    className: "icon"
  },
  pathSvg({
    d: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  })
);

describe("SVG Icon Components", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should create icon factory functions that work when called", () => {
    const plusIcon = PlusIcon();
    const icon = plusIcon();

    expect(icon).toBeTruthy();
    expect(icon.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(icon.tagName).toBe("svg");
    expect(icon.getAttribute("viewBox")).toBe("0 0 24 24");
  });

  it("should render icon with correct SVG children", () => {
    const plusIcon = PlusIcon();
    const icon = plusIcon();

    const lines = icon.querySelectorAll("line");
    expect(lines.length).toBe(2);
    expect(lines[0].namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(lines[0].getAttribute("stroke")).toBe("currentColor");
  });

  it("should support complex icons with paths", () => {
    const trashIcon = TrashIcon();
    const icon = trashIcon();

    expect(icon.namespaceURI).toBe("http://www.w3.org/2000/svg");

    const paths = icon.querySelectorAll("path");
    expect(paths.length).toBe(1);
    expect(paths[0].namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(paths[0].getAttribute("stroke")).toBe("currentColor");
  });

  it("should allow icons to be reused multiple times", () => {
    const icon1 = PlusIcon()();
    const icon2 = PlusIcon()();

    expect(icon1).not.toBe(icon2); // Different instances
    expect(icon1.namespaceURI).toBe(icon2.namespaceURI);
    expect(icon1.getAttribute("viewBox")).toBe(icon2.getAttribute("viewBox"));
  });

  it("should render icons in the DOM", () => {
    const container = div(
      PlusIcon(),
      TrashIcon()
    )();

    document.body.appendChild(container);

    const svgElements = container.querySelectorAll("svg");
    expect(svgElements.length).toBe(2);
    expect(svgElements[0].getAttribute("className")).toBe("icon");
  });
});
