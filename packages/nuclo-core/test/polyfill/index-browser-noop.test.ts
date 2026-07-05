/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Targets the uncovered false path of the environment guard in
 * src/polyfill/index.ts (line 32): with a window present (browser/jsdom) the
 * polyfill must not touch any global.
 */
import { describe, it, expect } from "vitest";

describe("polyfill index in a browser environment", () => {
  it("leaves the browser globals untouched", async () => {
    const originalDocument = globalThis.document;
    const originalEvent = globalThis.Event;
    const originalElement = globalThis.Element;

    const polyfill = await import("../../src/polyfill");

    expect(globalThis.document).toBe(originalDocument);
    expect(globalThis.Event).toBe(originalEvent);
    expect(globalThis.Element).toBe(originalElement);
    // The module still exposes its own implementations for direct use.
    expect(polyfill.NucloDocument).toBeDefined();
    expect(polyfill.NucloElement).toBeDefined();
  });
});
