/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
import "../../src/polyfill";
import { describe, it, expect } from "vitest";
import { renderToString } from "../../src/ssr/render-to-string";

describe("SSR renderToString missing branches", () => {
  it("serializes NamedNodeMap-like attributes (including boolean true/false)", () => {
    const element = {
      nodeType: 1,
      tagName: "div",
      attributes: [
        { name: "data-ok", value: "x" },
        { name: "hidden", value: true },
        { name: "data-skip", value: false },
        null,
      ],
      childNodes: [],
    } as any;

    expect(renderToString(element)).toBe('<div data-ok="x" hidden></div>');
  });

  it("uses className when Map attributes omit class", () => {
    const element = {
      nodeType: 1,
      tagName: "div",
      attributes: new Map<string, unknown>(),
      className: "from-prop",
      children: [{ nodeType: 3, textContent: "Child" }],
    } as any;

    expect(renderToString(element)).toBe('<div class="from-prop">Child</div>');
  });

  it("falls back to empty child list when no children are available", () => {
    const fragment = { nodeType: 11 } as any;
    expect(renderToString(fragment)).toBe("");
  });

  it("returns empty string for unknown node types", () => {
    const unknownNode = { nodeType: 999 } as any;
    expect(renderToString(unknownNode)).toBe("");
  });

  it("returns empty string for non-node objects", () => {
    expect(renderToString({} as any)).toBe("");
  });

});

