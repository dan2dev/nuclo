/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { updateConditionalElements } from "../../src/core/conditionalUpdater";
import { createHtmlConditionalElement, createSvgConditionalElement } from "../helpers/conditionalTestHelpers";
import * as conditionalInfo from "../../src/utility/conditionalInfo";

describe("conditionalUpdater missing branches", () => {
  let container: HTMLDivElement;
  let originalConsoleError: any;
  let consoleSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
    originalConsoleError = console.error;
    consoleSpy = vi.fn();
    console.error = consoleSpy as any;
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it("recreates SVG elements from comments", () => {
    let visible = false;
    const node = createSvgConditionalElement("svg", () => visible, []) as unknown as Node;
    expect(node.nodeType).toBe(Node.COMMENT_NODE);
    container.appendChild(node);

    visible = true;
    updateConditionalElements();

    const first = container.firstChild as Element | null;
    expect(first?.nodeType).toBe(Node.ELEMENT_NODE);
    expect(first?.namespaceURI).toBe("http://www.w3.org/2000/svg");
  });

  it("falls back to bare SVG element when modifiers throw", () => {
    let visible = false;
    const throwingModifier = (_parent: any) => {
      throw new Error("boom");
    };
    const node = createSvgConditionalElement("svg", () => visible, [throwingModifier]) as unknown as Node;
    container.appendChild(node);

    visible = true;
    updateConditionalElements();

    const messages = consoleSpy.mock.calls.map((call) => String(call[0]));
    expect(messages.some((m) => m.includes("Error applying modifiers in conditional element"))).toBe(true);
    expect(container.firstChild?.nodeType).toBe(Node.ELEMENT_NODE);
  });

  it("skips nodes missing conditional info", () => {
    const visible = true;
    const node = createHtmlConditionalElement("div", () => visible, ["X"]) as unknown as Node;
    container.appendChild(node);

    delete (node as any)._conditionalInfo;
    expect(() => updateConditionalElements()).not.toThrow();
    expect(container.firstChild).toBe(node);
  });

  it("respects provided update scope", () => {
    let visible = false;
    const node = createHtmlConditionalElement("div", () => visible, ["X"]) as unknown as Node;
    container.appendChild(node);

    visible = true;
    updateConditionalElements({ roots: [], contains: () => false } as any);
    expect(container.firstChild?.nodeType).toBe(Node.COMMENT_NODE);
  });

  it("does nothing if conditional comment cannot be created", () => {
    let visible = true;
    const node = createHtmlConditionalElement("div", () => visible, ["X"]) as unknown as Node;
    container.appendChild(node);
    expect(node.nodeType).toBe(Node.ELEMENT_NODE);

    const originalCreateComment = document.createComment.bind(document);
    (document as any).createComment = () => {
      throw new Error("nope");
    };

    try {
      visible = false;
      updateConditionalElements();
      // Comment creation failed, so the element should remain.
      expect(container.firstChild?.nodeType).toBe(Node.ELEMENT_NODE);
      expect(consoleSpy).toHaveBeenCalled();
    } finally {
      (document as any).createComment = originalCreateComment;
    }
  });

  it("catches unexpected errors during update loop", () => {
    const spy = vi
      .spyOn(conditionalInfo, "getActiveConditionalNodes")
      .mockImplementation(() => {
        throw new Error("unexpected");
      });

    expect(() => updateConditionalElements()).not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();

    spy.mockRestore();
  });
});
