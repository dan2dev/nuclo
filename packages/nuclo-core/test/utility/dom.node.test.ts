/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { appendChildren, createMarkerPair, isNodeConnected } from "../../src/utility/dom";

describe("dom utilities (node/SSR)", () => {
  it("throws when creating marker pair without browser APIs", () => {
    expect(() => createMarkerPair("pair", 0)).toThrow(
      "Failed to create comment: document not available"
    );
  });

  it("treats unknown nodes as disconnected", () => {
    expect(isNodeConnected({} as any)).toBe(false);
  });

  it("does not attempt to create text nodes in non-browser environments", () => {
    const parent = {};
    expect(appendChildren(parent as any, "text")).toBe(parent);
  });
});
