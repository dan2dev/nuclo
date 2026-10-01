/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, hydrate, forceUpdate } from "../../src/render";
import { update } from "../../src/update/update";
import { renderToString } from "../../src/ssr/render-to-string";
import "../../src";

/**
 * SVG elements keep their tag-name case in the DOM (`linearGradient`,
 * `clipPath`, `foreignObject`…) while HTML elements report upper case. The
 * hydration claim must match both, or every camelCase SVG element is rebuilt
 * instead of reused — losing node identity on hydrate() and on every
 * forceUpdate().
 */
describe("hydration — camelCase SVG tags are claimed, not rebuilt", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  const CAMEL_TAGS = ["linearGradient", "radialGradient", "clipPath", "foreignObject", "textPath", "feGaussianBlur", "animateTransform"] as const;

  function allElements(root: Element): Element[] {
    const out: Element[] = [];
    const walk = (el: Element): void => {
      out.push(el);
      for (let c = el.firstElementChild; c; c = c.nextElementSibling) walk(c);
    };
    walk(root);
    return out;
  }

  it("hydrate() reuses every server-rendered camelCase element", () => {
    const App = () =>
      svgSvg(
        { viewBox: "0 0 10 10" },
        defsSvg(
          linearGradientSvg({ id: "lg" }, stopSvg({ offset: "0" })),
          radialGradientSvg({ id: "rg" }),
          clipPathSvg({ id: "cp" }, rectSvg({ width: "1" })),
          filterSvg({ id: "f" }, feGaussianBlurSvg({ stdDeviation: "2" })),
        ),
        foreignObjectSvg({ width: "5" }),
        textSvg(textPathSvg({ href: "#p" }, "label")),
        circleSvg({ r: "1" }, animateTransformSvg({ attributeName: "transform" })),
      );

    container.innerHTML = renderToString(App);
    const before = allElements(container);
    for (const tag of CAMEL_TAGS) {
      expect(before.some((el) => el.localName === tag), `parser produced <${tag}>`).toBe(true);
    }

    hydrate(App, container);

    const after = allElements(container);
    expect(after.length).toBe(before.length);
    for (let i = 0; i < before.length; i++) expect(after[i]).toBe(before[i]);
  });

  it("forceUpdate() reuses camelCase elements and patches their attributes", () => {
    let offset = "0";
    const App = () => svgSvg(defsSvg(linearGradientSvg({ id: "lg" }, stopSvg({ offset }))), clipPathSvg({ id: "cp" }));

    render(App, container);
    const before = allElements(container);

    offset = "0.5";
    forceUpdate();

    const after = allElements(container);
    expect(after.length).toBe(before.length);
    for (let i = 0; i < before.length; i++) expect(after[i]).toBe(before[i]);
    expect(after.find((el) => el.localName === "stop")!.getAttribute("offset")).toBe("0.5");
  });

  it("lifecycle hooks on a camelCase element do not re-fire on forceUpdate()", () => {
    let mounts = 0;
    let destroys = 0;
    const App = () =>
      svgSvg(clipPathSvg(on("mount", () => { mounts++; }), on("destroy", () => { destroys++; })));

    render(App, container);
    expect(mounts).toBe(1);

    forceUpdate();
    forceUpdate();

    expect(mounts).toBe(1);
    expect(destroys).toBe(0);
  });

  it("reactive attributes and when() inside a hydrated camelCase element stay live", () => {
    let radius = "1";
    let show = true;
    const App = () =>
      svgSvg(clipPathSvg({ id: "cp" }, circleSvg({ r: () => radius }), when(() => show, rectSvg({ width: "2" }))));

    container.innerHTML = renderToString(App);
    const clip = allElements(container).find((el) => el.localName === "clipPath")!;
    hydrate(App, container);

    radius = "4";
    show = false;
    update();

    const clipAfter = allElements(container).find((el) => el.localName === "clipPath")!;
    expect(clipAfter).toBe(clip);
    expect(clip.firstElementChild!.getAttribute("r")).toBe("4");
    expect(clip.getElementsByTagName("rect").length).toBe(0);
  });

  it("an HTML factory still claims its upper-case DOM tag", () => {
    const App = () => div(span("x"));
    container.innerHTML = "<div><span><!-- text-0 -->x</span></div>";
    const ssrSpan = container.firstElementChild!.firstElementChild;
    hydrate(App, container);
    expect(container.firstElementChild!.firstElementChild).toBe(ssrSpan);
  });
});
