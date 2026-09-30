/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import "../../src";
import { beforeEach, describe, expect, it } from "vitest";

// SVG's className is a read-only SVGAnimatedString: classes must land on the
// real `class` attribute, never a literal `className="..."` attribute.
describe("SVG className", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("maps a static className to the class attribute", () => {
    const el = svgSvg({ className: "a" })();
    expect(el.getAttribute("class")).toBe("a");
    expect(el.hasAttribute("className")).toBe(false);
    expect(el.classList.contains("a")).toBe(true);
  });

  it("merges className with css(), cx() and variants() results", () => {
    const pad = css({ p: 8 });
    const tone = variants({ base: { color: "red" }, variants: { size: { sm: { m: 2 } } } });
    const el = svgSvg({ className: "a" }, pad, cx("b"), tone({ size: "sm" }))();

    expect(el.hasAttribute("className")).toBe(false);
    const classes = el.getAttribute("class")!.split(" ");
    expect(classes).toContain("a");
    expect(classes).toContain("b");
    expect(classes).toContain(pad.className);
    expect(classes).toContain(tone({ size: "sm" }).className);
  });

  it("applies className on child SVG elements", () => {
    const el = svgSvg(pathSvg({ className: "p", d: "M0 0" }, css({ m: 4 })))();
    const path = el.querySelector("path")!;
    expect(path.getAttribute("class")).toBe(`p ${css({ m: 4 }).className}`);
  });

  it("keeps static classes when a reactive className updates", () => {
    let active = false;
    const el = circleSvg({ className: "dot" }, { className: () => (active ? "on" : "") })();
    document.body.appendChild(el);
    expect(el.getAttribute("class")).toBe("dot");

    active = true;
    update();
    expect(el.getAttribute("class")).toBe("dot on");

    active = false;
    update();
    expect(el.getAttribute("class")).toBe("dot");
    expect(el.hasAttribute("className")).toBe(false);
  });

  it("supports reactive css() results", () => {
    let big = false;
    const small = css({ p: 2 });
    const large = css({ p: 20 });
    const el = rectSvg({ className: "r" }, () => (big ? large : small))();
    document.body.appendChild(el);
    expect(el.getAttribute("class")).toBe(`r ${small.className}`);

    big = true;
    update();
    expect(el.getAttribute("class")).toBe(`r ${large.className}`);
  });

  it("renders the same class attribute through render()", () => {
    const root = document.createElement("div");
    render(svgSvg({ className: "a" }, css({ p: 8 })), root);
    expect(root.innerHTML).toBe(`<svg class="a ${css({ p: 8 }).className}"></svg>`);
  });
});
