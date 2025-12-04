// @vitest-environment jsdom
import "../../src/index";
import "../../types";
import { beforeEach, describe, expect, it } from "vitest";

describe("SVG Element Creation", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should create SVG elements with correct namespace", () => {
    const svgEl = svgSvg()();
    expect(svgEl.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(svgEl.tagName).toBe("svg");
  });

  it("should create circle element with correct namespace", () => {
    const circleEl = circleSvg()();
    expect(circleEl.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(circleEl.tagName).toBe("circle");
  });

  it("should create path element with correct namespace", () => {
    const pathEl = pathSvg()();
    expect(pathEl.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(pathEl.tagName).toBe("path");
  });

  it("should create rect element with correct namespace", () => {
    const rectEl = rectSvg()();
    expect(rectEl.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(rectEl.tagName).toBe("rect");
  });

  it("should create g (group) element with correct namespace", () => {
    const gEl = gSvg()();
    expect(gEl.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(gEl.tagName).toBe("g");
  });

  it("should apply attributes to SVG elements", () => {
    const circleEl = circleSvg({ cx: "50", cy: "50", r: "40" })();
    expect(circleEl.getAttribute("cx")).toBe("50");
    expect(circleEl.getAttribute("cy")).toBe("50");
    expect(circleEl.getAttribute("r")).toBe("40");
  });

  it("should create nested SVG elements", () => {
    const svgEl = svgSvg(
      { width: "100", height: "100" },
      circleSvg({ cx: "50", cy: "50", r: "40", fill: "red" })
    )();

    expect(svgEl.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(svgEl.getAttribute("width")).toBe("100");
    expect(svgEl.getAttribute("height")).toBe("100");

    const circles = svgEl.querySelectorAll("circle");
    expect(circles.length).toBe(1);
    expect(circles[0].namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(circles[0].getAttribute("fill")).toBe("red");
  });

  it("should support path with d attribute", () => {
    const pathEl = pathSvg({ d: "M10 10 L90 90", stroke: "black" })();
    expect(pathEl.getAttribute("d")).toBe("M10 10 L90 90");
    expect(pathEl.getAttribute("stroke")).toBe("black");
  });

  it("should support polygon with points", () => {
    const polygonEl = polygonSvg({ points: "10,10 50,90 90,10" })();
    expect(polygonEl.getAttribute("points")).toBe("10,10 50,90 90,10");
  });

  it("should support viewBox on svg element", () => {
    const svgEl = svgSvg({ viewBox: "0 0 100 100" })();
    expect(svgEl.getAttribute("viewBox")).toBe("0 0 100 100");
  });

  it("should render SVG to DOM", () => {
    const container = div(
      svgSvg(
        { width: "24", height: "24", viewBox: "0 0 24 24" },
        pathSvg({ d: "M12 2L2 7v10l10 5 10-5V7z", fill: "currentColor" })
      )
    )();

    const svgEl = container.querySelector?.("svg");
    expect(svgEl).toBeTruthy();
    expect(svgEl?.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(svgEl?.getAttribute("viewBox")).toBe("0 0 24 24");

    const pathEl = svgEl?.querySelector("path");
    expect(pathEl).toBeTruthy();
    expect(pathEl?.namespaceURI).toBe("http://www.w3.org/2000/svg");
  });

  it("should support gradients and stop elements", () => {
    // First test that stop elements can be created
    const stopEl = stopSvg({ offset: "50%", "stop-color": "red" })();
    expect(stopEl.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(stopEl.tagName).toBe("stop");
    expect(stopEl.getAttribute("offset")).toBe("50%");

    // Now test gradient with stops
    const svgEl = svgSvg(
      defsSvg(
        linearGradientSvg(
          { id: "grad1" },
          stopSvg({ offset: "0%", "stop-color": "rgb(255,255,0)" }),
          stopSvg({ offset: "100%", "stop-color": "rgb(255,0,0)" })
        )
      ),
      rectSvg({ fill: "url(#grad1)", width: "100", height: "100" })
    )();

    const gradient = svgEl.querySelector("linearGradient");
    expect(gradient).toBeTruthy();
    expect(gradient?.namespaceURI).toBe("http://www.w3.org/2000/svg");

    const stops = svgEl.querySelectorAll("stop");
    expect(stops.length).toBe(2);
    expect(stops[0].getAttribute("offset")).toBe("0%");
  });

  it("should support text elements", () => {
    const textEl = textSvg(
      { x: "10", y: "20", fill: "black" },
      "Hello SVG"
    )();

    expect(textEl.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(textEl.textContent).toBe("Hello SVG");
    expect(textEl.getAttribute("x")).toBe("10");
  });

  it("should support use element with href", () => {
    const useEl = useSvg({ href: "#icon" })();
    expect(useEl.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(useEl.getAttribute("href")).toBe("#icon");
  });

  it("should use Svg suffix for all SVG tags", () => {
    // Test that aSvg exists for SVG anchor
    const anchorSVG = aSvg({ href: "#target" })();
    expect(anchorSVG.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(anchorSVG.tagName).toBe("a");

    // Test that textSvg exists for SVG text
    const textSVG = textSvg({ x: "10", y: "20" }, "SVG Text")();
    expect(textSVG.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(textSVG.tagName).toBe("text");
  });
});

describe("SVG Icon Examples", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should create a home icon", () => {
    const homeIcon = svgSvg(
      { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none" },
      pathSvg({
        d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }),
      polylineSvg({
        points: "9 22 9 12 15 12 15 22",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      })
    )();

    expect(homeIcon.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(homeIcon.querySelectorAll("path").length).toBe(1);
    expect(homeIcon.querySelectorAll("polyline").length).toBe(1);
  });

  it("should create a check icon", () => {
    const checkIcon = svgSvg(
      { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none" },
      polylineSvg({
        points: "20 6 9 17 4 12",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      })
    )();

    expect(checkIcon.namespaceURI).toBe("http://www.w3.org/2000/svg");
    const polylineEl = checkIcon.querySelector("polyline");
    expect(polylineEl?.getAttribute("points")).toBe("20 6 9 17 4 12");
  });

  it("should create a star icon", () => {
    const starIcon = svgSvg(
      { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none" },
      polygonSvg({
        points: "12,2 15,8.5 22,9.3 17,14 18.5,21 12,17.3 5.5,21 7,14 2,9.3 9,8.5",
        fill: "gold",
        stroke: "orange",
        "stroke-width": "1"
      })
    )();

    expect(starIcon.namespaceURI).toBe("http://www.w3.org/2000/svg");
    const polygonEl = starIcon.querySelector("polygon");
    expect(polygonEl?.getAttribute("fill")).toBe("gold");
  });
});
