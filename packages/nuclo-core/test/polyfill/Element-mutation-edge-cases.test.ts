/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
/**
 * Edge cases of the SSR polyfill element's DOM mutation and classList methods:
 * fragments without a children array, reference/old nodes that are not
 * children, bare node-like objects without a parentNode property, and
 * attribute reads on an element that never set one.
 */
import { describe, it, expect } from "vitest";
import { NucloElement } from "../../src/polyfill/Element";

describe("NucloElement classList", () => {
  it("remove() with no tokens leaves the classes intact", () => {
    const el = new NucloElement("div");
    el.classList.add("keep");
    el.classList.remove();
    expect(el.className).toBe("keep");
  });

  it("ignores empty and duplicate tokens and extra whitespace", () => {
    const el = new NucloElement("div");
    el.className = " a  b ";
    el.classList.add("", "a", "c");
    expect(el.className).toBe("a b c");
    expect(el.classList.contains("")).toBe(false);
    expect(el.classList.length).toBe(3);
    expect([...el.classList]).toEqual(["a", "b", "c"]);
    expect([...el.classList.entries()]).toEqual([[0, "a"], [1, "b"], [2, "c"]]);
    expect([...el.classList.keys()]).toEqual([0, 1, 2]);
    expect(el.classList.item(5)).toBeNull();
  });
});

describe("NucloElement style/classList assignment", () => {
  it("accepts replacement style and classList objects", () => {
    const el = new NucloElement("div");
    const style = { color: "red" } as unknown as CSSStyleDeclaration;
    const classList = { value: "x" } as unknown as DOMTokenList;
    el.style = style;
    el.classList = classList;
    expect(el.style).toBe(style);
    expect(el.classList).toBe(classList);
  });
});

describe("NucloElement attribute misses", () => {
  it("hasAttribute/getAttribute/removeAttribute on an element with no attributes", () => {
    const el = new NucloElement("div");
    expect(el.hasAttribute("x")).toBe(false);
    expect(el.getAttribute("x")).toBeNull();
    expect(() => el.removeAttribute("x")).not.toThrow();
  });
});

describe("NucloElement DOM mutation misses", () => {
  it("appendChild/insertBefore accept fragments without a children array", () => {
    const el = new NucloElement("div");
    const kid = new NucloElement("span");
    el.appendChild({ nodeType: 11, childNodes: [kid] } as unknown as Node);
    expect(el.children).toEqual([kid]);

    const el2 = new NucloElement("div");
    const ref = new NucloElement("b");
    el2.appendChild(ref as unknown as Node);
    const kid2 = new NucloElement("i");
    el2.insertBefore({ nodeType: 11, childNodes: [kid2] } as unknown as Node, ref as unknown as Node);
    expect(el2.children).toEqual([kid2, ref]);
  });

  it("insertBefore with a reference node that is not a child is a no-op", () => {
    const el = new NucloElement("div");
    el.insertBefore(new NucloElement("i") as unknown as Node, new NucloElement("b") as unknown as Node);
    expect(el.children.length).toBe(0);
  });

  it("insertBefore accepts plain objects without a parentNode property", () => {
    const el = new NucloElement("div");
    const ref = new NucloElement("b");
    el.appendChild(ref as unknown as Node);
    const bareNode = { nodeType: 3, textContent: "x" } as unknown as Node;
    el.insertBefore(bareNode, ref as unknown as Node);
    expect(el.children[0]).toBe(bareNode);
  });

  it("removeChild misses: not a child, and bare nodes without parentNode", () => {
    const el = new NucloElement("div");
    expect(() => el.removeChild(new NucloElement("b") as unknown as Node)).not.toThrow();

    const bare = { nodeType: 3, textContent: "x" } as unknown as Node;
    el.appendChild(bare);
    el.removeChild(bare);
    expect(el.children.length).toBe(0);
  });

  it("replaceChild misses: oldChild absent, and bare nodes without parentNode", () => {
    const el = new NucloElement("div");
    expect(() =>
      el.replaceChild(new NucloElement("i") as unknown as Node, new NucloElement("b") as unknown as Node),
    ).not.toThrow();
    expect(el.children.length).toBe(0);

    const bareOld = { nodeType: 3, textContent: "old" } as unknown as Node;
    const bareNew = { nodeType: 3, textContent: "new" } as unknown as Node;
    el.appendChild(bareOld);
    el.replaceChild(bareNew, bareOld);
    expect(el.children).toEqual([bareNew]);
  });
});
