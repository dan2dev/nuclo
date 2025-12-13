/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { appendChildren, createMarkerComment, createMarkerPair, isNodeConnected } from "../../src/utility/dom";

describe("dom utilities (node/SSR)", () => {
  it("throws when creating marker comments without browser APIs", () => {
    expect(() => createMarkerComment("test")).toThrow(
      "Cannot create comment in non-browser environment"
    );
    expect(() => createMarkerPair("pair")).toThrow("Failed to create end comment");
  });

  it("treats unknown nodes as disconnected", () => {
    expect(isNodeConnected({} as any)).toBe(false);
  });

  it("does not attempt to create text nodes in non-browser environments", () => {
    const parent = {};
    expect(appendChildren(parent as any, "text")).toBe(parent);
  });
});
