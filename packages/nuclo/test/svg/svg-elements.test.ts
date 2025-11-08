// @vitest-environment jsdom
import "../../src/index";
import { beforeEach, describe, expect, it } from "vitest";

describe("SVG Element Creation", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should create SVG elements with correct namespace", () => {
    const svgEl = svg()();
    expect(svgEl.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(svgEl.tagName).toBe("svg");
  });

  it("should create circle element with correct namespace", () => {
    const circleEl = circle()();
    expect(circleEl.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(circleEl.tagName).toBe("circle");
  });

  it("should create path element with correct namespace", () => {
    const pathEl = path()();
    expect(pathEl.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(pathEl.tagName).toBe("path");
  });

  it("should create rect element with correct namespace", () => {
    const rectEl = rect()();
    expect(rectEl.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(rectEl.tagName).toBe("rect");
  });

  it("should create g (group) element with correct namespace", () => {
    const gEl = g()();
    expect(gEl.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(gEl.tagName).toBe("g");
  });

  it("should apply attributes to SVG elements", () => {
    const circleEl = circle({ cx: "50", cy: "50", r: "40" })();
    expect(circleEl.getAttribute("cx")).toBe("50");
    expect(circleEl.getAttribute("cy")).toBe("50");
    expect(circleEl.getAttribute("r")).toBe("40");
  });

  it("should create nested SVG elements", () => {
    const svgEl = svg(
      { width: "100", height: "100" },
      circle({ cx: "50", cy: "50", r: "40", fill: "red" })
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
    const pathEl = path({ d: "M10 10 L90 90", stroke: "black" })();
    expect(pathEl.getAttribute("d")).toBe("M10 10 L90 90");
    expect(pathEl.getAttribute("stroke")).toBe("black");
  });

  it("should support polygon with points", () => {
    const polygonEl = polygon({ points: "10,10 50,90 90,10" })();
    expect(polygonEl.getAttribute("points")).toBe("10,10 50,90 90,10");
  });

  it("should support viewBox on svg element", () => {
    const svgEl = svg({ viewBox: "0 0 100 100" })();
    expect(svgEl.getAttribute("viewBox")).toBe("0 0 100 100");
  });

  it("should render SVG to DOM", () => {
    const container = div(
      svg(
        { width: "24", height: "24", viewBox: "0 0 24 24" },
        path({ d: "M12 2L2 7v10l10 5 10-5V7z", fill: "currentColor" })
      )
    )();

    const svgEl = container.querySelector("svg");
    expect(svgEl).toBeTruthy();
    expect(svgEl?.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(svgEl?.getAttribute("viewBox")).toBe("0 0 24 24");

    const pathEl = svgEl?.querySelector("path");
    expect(pathEl).toBeTruthy();
    expect(pathEl?.namespaceURI).toBe("http://www.w3.org/2000/svg");
  });

  it("should support gradients and stop elements", () => {
    // First test that stop elements can be created (note: use stop_ to avoid DOM global conflict)
    const stopEl = stop_({ offset: "50%", "stop-color": "red" })();
    expect(stopEl.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(stopEl.tagName).toBe("stop");
    expect(stopEl.getAttribute("offset")).toBe("50%");

    // Now test gradient with stops
    const svgEl = svg(
      defs(
        linearGradient(
          { id: "grad1" },
          stop_({ offset: "0%", "stop-color": "rgb(255,255,0)" }),
          stop_({ offset: "100%", "stop-color": "rgb(255,0,0)" })
        )
      ),
      rect({ fill: "url(#grad1)", width: "100", height: "100" })
    )();

    const gradient = svgEl.querySelector("linearGradient");
    expect(gradient).toBeTruthy();
    expect(gradient?.namespaceURI).toBe("http://www.w3.org/2000/svg");

    const stops = svgEl.querySelectorAll("stop");
    expect(stops.length).toBe(2);
    expect(stops[0].getAttribute("offset")).toBe("0%");
  });

  it("should support text elements", () => {
    const textEl = text_svg(
      { x: "10", y: "20", fill: "black" },
      "Hello SVG"
    )();

    expect(textEl.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(textEl.textContent).toBe("Hello SVG");
    expect(textEl.getAttribute("x")).toBe("10");
  });

  it("should support use element with href", () => {
    const useEl = use({ href: "#icon" })();
    expect(useEl.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(useEl.getAttribute("href")).toBe("#icon");
  });

  it("should use _svg suffix for conflicting tags", () => {
    // Test that a_svg exists for SVG anchor
    const anchorSVG = a_svg({ href: "#target" })();
    expect(anchorSVG.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(anchorSVG.tagName).toBe("a");

    // Test that text_svg exists for SVG text
    const textSVG = text_svg({ x: "10", y: "20" }, "SVG Text")();
    expect(textSVG.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(textSVG.tagName).toBe("text");
  });
});

describe("SVG Icon Examples", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should create a home icon", () => {
    const homeIcon = svg(
      { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none" },
      path({
        d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }),
      polyline({
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
    const checkIcon = svg(
      { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none" },
      polyline({
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
    const starIcon = svg(
      { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none" },
      polygon({
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
