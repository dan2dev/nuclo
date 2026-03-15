/// <reference path="../../types/index.d.ts" />
import "../../src/index";
import { list } from "../../src/list";

// Type test - should compile without errors
const columns = 3;
const rows = 20;

// Test 1: Basic SVG list with proper typing
const chart = (data: {
  items: () => { label: string; value: number; }[];
}, ...mods: SVGElementModifier<"svg">[]) => {
  const width = columns * 20;
  const height = rows * 20;
  return svgSvg(
    {
      width: width.toString(),
      height: height.toString(),
      viewBox: `0 0 ${width} ${height}`,
      fill: "none",
      className: "chart"
    },
    // This should NOT cause a type error anymore
    list(data.items, (item, index) => {
      const barHeight = (item.value / rows) * height;
      return rectSvg({
        x: (index * 20 + 5).toString(),
        y: (height - barHeight).toString(),
        width: "10",
        height: barHeight.toString(),
        fill: "steelblue"
      });
    }),
    ...mods
  );
};

// Test 2: Type inference with reactive attributes
const reactiveChart = () => {
  let color = "blue";
  
  return svgSvg(
    { width: "100", height: "100" },
    list(
      () => [1, 2, 3],
      (item: number, index: number) => {
        return circleSvg({
          cx: (index * 30).toString(),
          cy: "50",
          r: "10",
          fill: () => color, // Should accept function returning string
        });
      }
    )
  );
};

// Test 3: Nested lists with proper typing
const nestedChart = () => {
  type Group = { name: string; values: number[] };
  
  return svgSvg(
    { viewBox: "0 0 200 200" },
    list(
      (): readonly Group[] => [
        { name: "A", values: [1, 2, 3] },
        { name: "B", values: [4, 5, 6] },
      ],
      (group: Group, groupIndex: number) => {
        return gSvg(
          { transform: `translate(${groupIndex * 100}, 0)` },
          list(
            (): readonly number[] => group.values,
            (value: number, valueIndex: number) => {
              return rectSvg({
                x: "10",
                y: (valueIndex * 20).toString(),
                width: "15",
                height: "15",
                fill: "red",
              });
            }
          )
        );
      }
    )
  );
};

// Test 4: Type inference with different SVG elements
const mixedElements = () => {
  type Shape = { type: "circle" | "rect"; x: number; y: number };
  
  return svgSvg(
    { viewBox: "0 0 100 100" },
    list(
      (): readonly Shape[] => [
        { type: "circle", x: 10, y: 10 },
        { type: "rect", x: 30, y: 30 },
      ],
      (shape: Shape) => {
        if (shape.type === "circle") {
          return circleSvg({
            cx: shape.x.toString(),
            cy: shape.y.toString(),
            r: "5",
            fill: "blue",
          });
        } else {
          return rectSvg({
            x: shape.x.toString(),
            y: shape.y.toString(),
            width: "10",
            height: "10",
            fill: "green",
          });
        }
      }
    )
  );
};

// Test 5: Ensure readonly arrays work
const readonlyArrayTest = () => {
  const data: readonly number[] = [1, 2, 3];
  
  return svgSvg(
    { width: "100", height: "100" },
    list(
      () => data,
      (item: number) => {
        return circleSvg({
          cx: (item * 20).toString(),
          cy: "50",
          r: "5",
        });
      }
    )
  );
};

// Test 6: HTML list should still work
const htmlListTest = () => {
  return div(
    list(
      () => [1, 2, 3],
      (item: number) => {
        return div(`Item ${item}`);
      }
    )
  );
};

// Test 7: Complex reactive attributes
const complexReactiveTest = () => {
  let width = 100;
  let height = 100;
  
  return svgSvg(
    {
      width: () => width.toString(),
      height: () => height.toString(),
      viewBox: () => `0 0 ${width} ${height}`,
    },
    list(
      () => [1, 2, 3],
      (item: number) => {
        return rectSvg({
          x: (item * 20).toString(),
          y: "10",
          width: "15",
          height: "15",
          fill: "blue",
          opacity: () => (item / 3).toString(),
        });
      }
    )
  );
};

// Export to verify it compiles
export { 
  chart, 
  reactiveChart, 
  nestedChart, 
  mixedElements, 
  readonlyArrayTest,
  htmlListTest,
  complexReactiveTest,
};
