/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
// No polyfill import: globalThis.document stays undefined.
import { describe, it, expect, vi } from "vitest";
import { renderToString } from "../../src/ssr/render-to-string";
import "../../src";

describe("renderToString without a document", () => {
  it("logs a 'load the polyfill' error and returns an empty string", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(renderToString(div("x"))).toBe("");
    expect(spy).toHaveBeenCalledWith(
      "Error rendering component to string:",
      expect.objectContaining({ message: expect.stringContaining("polyfills") }),
    );
    spy.mockRestore();
  });
});
