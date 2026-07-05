/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Targets uncovered lines 105-106 in src/element/factory.ts: the SVG element
 * factory throws when createElementNS returns null (document unavailable).
 */
import { describe, it, expect, vi } from "vitest";
import { createSvgTagBuilder } from "../../src/element/factory";

vi.mock("../../src/shared/dom", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../src/shared/dom")>();
  return {
    ...original,
    createElementNS: () => null,
  };
});

describe("createSvgElementFactory with unavailable document", () => {
  it("throws a descriptive error when the SVG element cannot be created", () => {
    const builder = createSvgTagBuilder("circle");
    const factory = builder();
    expect(() => factory(undefined, 0)).toThrow(
      "Failed to create SVG element: circle",
    );
  });
});
