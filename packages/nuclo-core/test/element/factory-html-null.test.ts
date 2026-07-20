/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Mirrors factory-svg-null.test.ts: the HTML element factory (and
 * createHtmlElementWithModifiers) must throw a descriptive error when
 * createElement returns null (document unavailable), instead of silently
 * returning null or crashing later inside applyModifiers with a cryptic
 * "Cannot use 'in' operator" TypeError.
 */
import { describe, it, expect, vi } from "vitest";
import { createHtmlTagBuilder, createHtmlElementWithModifiers } from "../../src/element/factory";

vi.mock("../../src/shared/dom", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../src/shared/dom")>();
  return {
    ...original,
    createElement: () => null,
  };
});

describe("createHtmlElementFactory with unavailable document", () => {
  it("throws a descriptive error when the element cannot be created", () => {
    const builder = createHtmlTagBuilder("div");
    const factory = builder({ id: "test" });
    expect(() => factory(undefined, 0)).toThrow("Failed to create element: div");
  });

  it("throws even with no modifiers, instead of silently returning null", () => {
    const builder = createHtmlTagBuilder("span");
    const factory = builder();
    expect(() => factory(undefined, 0)).toThrow("Failed to create element: span");
  });
});

describe("createHtmlElementWithModifiers with unavailable document", () => {
  it("throws a descriptive error when the element cannot be created", () => {
    expect(() => createHtmlElementWithModifiers("div", [])).toThrow(
      "Failed to create element: div",
    );
  });
});
