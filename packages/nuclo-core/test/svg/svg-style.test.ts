/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import "../../src";
import { beforeEach, describe, expect, it } from "vitest";

// SVG elements have an inline style like HTML ones: `style` takes an object or
// a function returning one, never a literal `style="[object Object]"`.
describe("SVG style", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("applies a static style object", () => {
    const el = circleSvg({ r: 4, style: { cursor: "grab", touchAction: "none" } })();
    expect(el.style.cursor).toBe("grab");
    expect(el.style.touchAction).toBe("none");
  });

  it("re-applies a style function on update()", () => {
    let angle = 0;
    const svg = render(svgSvg(gSvg({ style: () => ({ transform: `rotate(${angle}deg)` }) })), document.body);
    const g = svg.querySelector("g")!;
    expect(g.style.transform).toBe("rotate(0deg)");

    angle = 45;
    update();
    expect(g.style.transform).toBe("rotate(45deg)");
  });
});
