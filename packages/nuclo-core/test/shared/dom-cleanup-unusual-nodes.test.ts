/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Targets the remaining uncovered branch of src/shared/dom.ts cleanupNodeTree:
 * a child whose nodeType is neither element, text nor comment (e.g. a
 * processing instruction) passes through the type dispatch untouched.
 */
import { describe, it, expect } from "vitest";
import { safeRemoveChild } from "../../src/shared/dom";

describe("safeRemoveChild with unusual node types", () => {
  it("removes a subtree containing a processing instruction without cleanup errors", () => {
    const parent = document.createElement("div");
    const pi = document.createProcessingInstruction("xml-stylesheet", 'href="x.css"');
    parent.appendChild(pi);
    parent.appendChild(document.createTextNode("text"));
    document.body.appendChild(parent);

    expect(safeRemoveChild(parent)).toBe(true);
    expect(parent.isConnected).toBe(false);
  });
});
