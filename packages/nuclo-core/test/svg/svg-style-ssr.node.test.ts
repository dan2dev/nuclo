/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
import "../../src/polyfill";
import { describe, expect, it } from "vitest";
import { renderToString } from "../../src/ssr/render-to-string";
import "../../src";

describe("SVG style — SSR", () => {
  it("serializes static and function styles as a style attribute, like the browser", () => {
    const html = renderToString(
      svgSvg({ style: { touchAction: "none" } }, gSvg({ style: () => ({ transform: "rotate(45deg)" }) })),
    );
    expect(html).toBe(`<svg style="touch-action: none;"><g style="transform: rotate(45deg);"></g></svg>`);
  });
});
