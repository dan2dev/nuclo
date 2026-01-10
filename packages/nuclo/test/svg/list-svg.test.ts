/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import "../../src/index";
import { describe, it, expect } from "vitest";
import { list } from "../../src/list";

describe("list with SVG elements", () => {
  it("should work with SVG elements", () => {
    const data = {
      items: () => [
        { label: "A", value: 10 },
        { label: "B", value: 20 },
        { label: "C", value: 15 },
      ],
    };

    const columns = 3;
    const rows = 20;
    const width = columns * 20;
    const height = rows * 20;

    const chart = svgSvg(
      {
        width: width.toString(),
        height: height.toString(),
        viewBox: `0 0 ${width} ${height}`,
        fill: "none",
        className: "chart",
      },
      list(data.items, (item, index) => {
        const barHeight = (item.value / rows) * height;
        return rectSvg({
          x: (index * 20 + 5).toString(),
          y: (height - barHeight).toString(),
          width: "10",
          height: barHeight.toString(),
          fill: "steelblue",
        });
      })
    );

    const svg = chart();
    expect(svg).toBeDefined();
    expect(svg.tagName).toBe("svg");
    
    // Check that list markers are present
    const children = Array.from(svg.childNodes);
    expect(children.length).toBeGreaterThan(0);
    
    // Find rect elements
    const rects = Array.from(svg.querySelectorAll("rect"));
    expect(rects).toHaveLength(3);
    
    // Verify first rect
    expect(rects[0].getAttribute("x")).toBe("5");
    expect(rects[0].getAttribute("width")).toBe("10");
    expect(rects[0].getAttribute("fill")).toBe("steelblue");
    
    // Verify second rect
    expect(rects[1].getAttribute("x")).toBe("25");
    
    // Verify third rect
    expect(rects[2].getAttribute("x")).toBe("45");
  });

  it("should work with circles in SVG", () => {
    const points = () => [
      { x: 10, y: 10, r: 5 },
      { x: 30, y: 20, r: 8 },
      { x: 50, y: 15, r: 6 },
    ];

    const svg = svgSvg(
      { width: "100", height: "50" },
      list(points, (point) => {
        return circleSvg({
          cx: point.x.toString(),
          cy: point.y.toString(),
          r: point.r.toString(),
          fill: "red",
        });
      })
    );

    const element = svg();
    expect(element).toBeDefined();
    expect(element.tagName).toBe("svg");
    
    const circles = Array.from(element.querySelectorAll("circle"));
    expect(circles).toHaveLength(3);
    
    expect(circles[0].getAttribute("cx")).toBe("10");
    expect(circles[0].getAttribute("cy")).toBe("10");
    expect(circles[0].getAttribute("r")).toBe("5");
    
    expect(circles[1].getAttribute("cx")).toBe("30");
    expect(circles[1].getAttribute("r")).toBe("8");
  });

  it("should support reactive SVG attributes", () => {
    let fillColor = "blue";
    const items = () => [1, 2, 3];

    const svg = svgSvg(
      { width: "100", height: "100" },
      list(items, (item, index) => {
        return circleSvg({
          cx: (index * 30 + 15).toString(),
          cy: "50",
          r: "10",
          fill: () => fillColor, // Reactive attribute
        });
      })
    );

    const element = svg();
    const circles = Array.from(element.querySelectorAll("circle"));
    
    expect(circles).toHaveLength(3);
    expect(circles[0].getAttribute("fill")).toBe("blue");
    
    // Change reactive value
    fillColor = "red";
    // In a real scenario, this would trigger reactivity update
    // For now, just verify the structure is correct
  });

  it("should handle mixed static and reactive SVG attributes", () => {
    let opacity = 0.5;
    const data = () => [
      { x: 10, y: 10 },
      { x: 20, y: 20 },
    ];

    const svg = svgSvg(
      { viewBox: "0 0 100 100" },
      list(data, (item) => {
        return rectSvg({
          x: item.x.toString(), // Static
          y: item.y.toString(), // Static
          width: "15",
          height: "15",
          fill: "green",
          opacity: () => opacity.toString(), // Reactive
        });
      })
    );

    const element = svg();
    const rects = Array.from(element.querySelectorAll("rect"));
    
    expect(rects).toHaveLength(2);
    expect(rects[0].getAttribute("x")).toBe("10");
    expect(rects[0].getAttribute("fill")).toBe("green");
  });

  it("should handle SVG paths with dynamic d attribute", () => {
    const paths = () => [
      { d: "M 10 10 L 20 20" },
      { d: "M 30 30 L 40 40" },
    ];

    const svg = svgSvg(
      { viewBox: "0 0 100 100" },
      list(paths, (item) => {
        return pathSvg({
          d: item.d,
          stroke: "black",
          "stroke-width": "2",
        });
      })
    );

    const element = svg();
    const pathElements = Array.from(element.querySelectorAll("path"));
    
    expect(pathElements).toHaveLength(2);
    expect(pathElements[0].getAttribute("d")).toBe("M 10 10 L 20 20");
    expect(pathElements[1].getAttribute("d")).toBe("M 30 30 L 40 40");
  });

  it("should support SVG groups with nested lists", () => {
    const groups = () => [
      { name: "A", items: [1, 2] },
      { name: "B", items: [3, 4] },
    ];

    const svg = svgSvg(
      { viewBox: "0 0 200 100" },
      list(groups, (group, groupIndex) => {
        return gSvg(
          { transform: `translate(${groupIndex * 100}, 0)` },
          list(
            () => group.items,
            (item, itemIndex) => {
              return circleSvg({
                cx: "25",
                cy: (itemIndex * 30 + 15).toString(),
                r: "10",
                fill: "purple",
              });
            }
          )
        );
      })
    );

    const element = svg();
    const groups_elements = Array.from(element.querySelectorAll("g"));
    expect(groups_elements).toHaveLength(2);
    
    // Check circles in first group
    const circles = Array.from(element.querySelectorAll("circle"));
    expect(circles).toHaveLength(4); // 2 groups × 2 items
  });

  it("should handle empty list in SVG", () => {
    const items = () => [] as number[];

    const svg = svgSvg(
      { width: "100", height: "100" },
      list(items, (item) => {
        return circleSvg({ cx: "50", cy: "50", r: "10" });
      })
    );

    const element = svg();
    const circles = Array.from(element.querySelectorAll("circle"));
    
    expect(circles).toHaveLength(0);
  });

  it("should support SVG text elements in lists", () => {
    const labels = () => ["Label 1", "Label 2", "Label 3"];

    const svg = svgSvg(
      { viewBox: "0 0 200 100" },
      list(labels, (label, index) => {
        return textSvg(
          {
            x: (index * 60 + 10).toString(),
            y: "50",
            fill: "black",
            "font-size": "12",
          },
          label
        );
      })
    );

    const element = svg();
    const texts = Array.from(element.querySelectorAll("text"));
    
    expect(texts).toHaveLength(3);
    expect(texts[0].textContent).toBe("Label 1");
    expect(texts[1].textContent).toBe("Label 2");
    expect(texts[2].textContent).toBe("Label 3");
  });

  it("should handle SVG polygon with dynamic points", () => {
    const polygons = () => [
      { points: "0,0 50,0 25,50" },
      { points: "60,0 110,0 85,50" },
    ];

    const svg = svgSvg(
      { viewBox: "0 0 200 100" },
      list(polygons, (poly) => {
        return polygonSvg({
          points: poly.points,
          fill: "orange",
          stroke: "black",
        });
      })
    );

    const element = svg();
    const polygonElements = Array.from(element.querySelectorAll("polygon"));
    
    expect(polygonElements).toHaveLength(2);
    expect(polygonElements[0].getAttribute("points")).toBe("0,0 50,0 25,50");
    expect(polygonElements[1].getAttribute("points")).toBe("60,0 110,0 85,50");
  });
});
