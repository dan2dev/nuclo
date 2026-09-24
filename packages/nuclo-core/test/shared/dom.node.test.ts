/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { createMarkerPair } from "../../src/shared/dom";

describe("dom utilities (node/SSR)", () => {
  it("throws when creating a marker pair without a document (polyfill required)", () => {
    expect(() => createMarkerPair("pair", 0)).toThrow();
  });
});
