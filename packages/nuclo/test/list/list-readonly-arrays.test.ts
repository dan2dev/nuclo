/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import "../../src/index";
import { describe, it, expect } from "vitest";
import { list } from "../../src/list";

describe("list with readonly arrays", () => {
  it("should work with readonly arrays", () => {
    const items: readonly number[] = [1, 2, 3];
    
    const container = div(
      list(
        () => items,
        (item) => div(`Item ${item}`)
      )
    );

    const element = container();
    expect(element).toBeDefined();
    expect(element.tagName).toBe("DIV");
    
    const children = Array.from(element.querySelectorAll("div"));
    expect(children).toHaveLength(3);
    expect(children[0].textContent).toBe("Item 1");
    expect(children[1].textContent).toBe("Item 2");
    expect(children[2].textContent).toBe("Item 3");
  });

  it("should work with const assertions", () => {
    const data = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ] as const;
    
    const container = div(
      list(
        () => data,
        (item) => div(`${item.id}: ${item.name}`)
      )
    );

    const element = container();
    const children = Array.from(element.querySelectorAll("div"));
    
    expect(children).toHaveLength(2);
    expect(children[0].textContent).toBe("1: Alice");
    expect(children[1].textContent).toBe("2: Bob");
  });

  it("should work with ReadonlyArray type", () => {
    const createList = (items: ReadonlyArray<string>) => {
      return div(
        list(
          () => items,
          (item) => span(item)
        )
      );
    };

    const element = createList(["a", "b", "c"])();
    const spans = Array.from(element.querySelectorAll("span"));
    
    expect(spans).toHaveLength(3);
    expect(spans[0].textContent).toBe("a");
    expect(spans[1].textContent).toBe("b");
    expect(spans[2].textContent).toBe("c");
  });

  it("should work with readonly tuples", () => {
    const tuple: readonly [string, string, string] = ["x", "y", "z"];
    
    const container = ul(
      list(
        () => tuple,
        (item) => li(item)
      )
    );

    const element = container();
    const items = Array.from(element.querySelectorAll("li"));
    
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toBe("x");
    expect(items[1].textContent).toBe("y");
    expect(items[2].textContent).toBe("z");
  });

  it("should preserve readonly constraint in provider function", () => {
    // This test verifies type safety - it should compile
    const makeList = () => {
      const data: readonly { value: number }[] = [
        { value: 10 },
        { value: 20 },
      ];
      
      // Provider returns readonly array - should be accepted
      return div(
        list(
          (): readonly { value: number }[] => data,
          (item) => div(item.value.toString())
        )
      );
    };

    const element = makeList()();
    const divs = Array.from(element.querySelectorAll("div"));
    
    expect(divs).toHaveLength(2);
    expect(divs[0].textContent).toBe("10");
    expect(divs[1].textContent).toBe("20");
  });

  it("should work with readonly arrays in SVG context", () => {
    const points: readonly { x: number; y: number }[] = [
      { x: 10, y: 10 },
      { x: 20, y: 20 },
      { x: 30, y: 30 },
    ];

    const svg = svgSvg(
      { viewBox: "0 0 100 100" },
      list(
        () => points,
        (point) => circleSvg({
          cx: point.x.toString(),
          cy: point.y.toString(),
          r: "5",
          fill: "blue",
        })
      )
    );

    const element = svg();
    const circles = Array.from(element.querySelectorAll("circle"));
    
    expect(circles).toHaveLength(3);
    expect(circles[0].getAttribute("cx")).toBe("10");
    expect(circles[1].getAttribute("cx")).toBe("20");
    expect(circles[2].getAttribute("cx")).toBe("30");
  });
});
