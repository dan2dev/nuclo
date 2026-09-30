/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
import "../../src/polyfill";
import { describe, expect, it } from "vitest";
import { renderToString } from "../../src/ssr/render-to-string";
import "../../src";

describe("SVG className — SSR", () => {
  it("serializes className and css() as a class attribute, like the browser", () => {
    const pad = css({ p: 8 });
    const html = renderToString(svgSvg({ className: "a" }, pad, pathSvg({ className: "p", d: "M0 0" })));
    expect(html).toBe(`<svg class="a ${pad.className}"><path class="p" d="M0 0"></path></svg>`);
  });
});
