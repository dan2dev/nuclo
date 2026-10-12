/// <reference path="../../types/index.d.ts" />
import "../../src";

// Type test: `style` on SVG builders takes what it takes on HTML builders,
// a style object or a function returning one, and nothing else.

let on = true;

export const accepted = [
  circleSvg({ r: 4, style: { cursor: "grab" } }),
  svgSvg({
    viewBox: "0 0 10 10",
    style: { touchAction: "none", background: "#fafafa" },
    onPointerDown: (e) => e.currentTarget.setPointerCapture(e.pointerId),
  }),
  gSvg({ style: () => ({ transform: "rotate(10deg)", transformOrigin: "5px 5px" }) }),
  rectSvg({ style: () => (on ? { opacity: "1" } : { opacity: 0.5 }) }),
  pathSvg({ d: "M0,0 L1,1", style: { transition: "d 0.4s" } }, { fill: "none" }),
  // Other attributes keep their own types next to it.
  circleSvg({ style: { cursor: "grab" }, "data-id": "a", "aria-label": () => "dot", onClick: () => { on = !on; } }),
];

// @ts-expect-error not a style property
circleSvg({ style: { notAStyle: 1 } });
// @ts-expect-error not a style property, next to a real one
circleSvg({ style: { cursor: "grab", notAStyle: 1 } });
// @ts-expect-error a style is not a number
circleSvg({ style: 5 });
// @ts-expect-error a style is not a CSS string
circleSvg({ style: "cursor: grab" });
// @ts-expect-error a style function returns a style object
circleSvg({ style: () => 5 });
// @ts-expect-error other attributes keep their own types
circleSvg({ fill: 1 });
// @ts-expect-error an unknown attribute still takes no arbitrary object
circleSvg({ "data-id": { a: 1 } });
