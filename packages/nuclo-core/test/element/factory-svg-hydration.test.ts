/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Targets uncovered lines in src/element/factory.ts (createSvgElementFactory
 * hydration path): claiming an existing SVG element during hydration and
 * cleaning up its unclaimed SSR children (lines 108-113).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { hydrate } from "../../src/render";
import { renderToString } from "../../src/ssr/render-to-string";
import "../../src";

describe("SVG factory hydration", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("claims the existing SVG root and nested SVG children", () => {
    const component = () =>
      svgSvg(
        { viewBox: "0 0 24 24" },
        circleSvg({ cx: 12, cy: 12, r: 10 }),
      );

    container.innerHTML = renderToString(component() as unknown as NodeModFn<ElementTagName>);
    const existingSvg = container.firstElementChild!;
    const existingCircle = existingSvg.querySelector("circle")!;
    expect(existingSvg.tagName.toLowerCase()).toBe("svg");

    const el = hydrate(
      component() as unknown as NodeModFn<ElementTagName>,
      container,
    ) as unknown as SVGSVGElement;

    // Same DOM nodes — claimed, not recreated.
    expect(el).toBe(existingSvg);
    expect(el.querySelector("circle")).toBe(existingCircle);
    expect(container.children.length).toBe(1);
  });

  it("removes unclaimed SSR children from a claimed SVG element", () => {
    // Server rendered two circles, client renders only one.
    container.innerHTML =
      '<svg viewBox="0 0 24 24"><circle cx="12"></circle><circle cx="99"></circle></svg>';

    const el = hydrate(
      svgSvg(
        { viewBox: "0 0 24 24" },
        circleSvg({ cx: 12 }),
      ) as unknown as NodeModFn<ElementTagName>,
      container,
    ) as unknown as SVGSVGElement;

    expect(el.querySelectorAll("circle").length).toBe(1);
    expect(el.querySelector("circle")!.getAttribute("cx")).toBe("12");
  });
});
