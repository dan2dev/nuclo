/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
/**
 * Targets uncovered lines 79 and 82 in src/style/engine.ts:
 *  - line 79: no document at all → registry-only mode
 *  - line 82: nuclo polyfill document (no getElementById) → registry-only mode
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { atom, getCssText, resetStyles } from "../../src/style/engine";
import { NucloDocument } from "../../src/polyfill/Document";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("style engine without a browser document", () => {
  it("records rules with no document available", () => {
    expect(typeof document).toBe("undefined");
    const className = atom(undefined, "", "color", "red");
    expect(getCssText()).toContain(`.${className}{color:red}`);
  });

  it("records rules with the SSR polyfill document (no getElementById)", () => {
    vi.stubGlobal("document", new NucloDocument());
    const className = atom(undefined, "", "color", "green");
    expect(getCssText()).toContain(`.${className}{color:green}`);
  });

  it("resetStyles clears the registry without a DOM to clean", () => {
    atom(undefined, "", "color", "purple");
    expect(getCssText()).not.toBe("");
    expect(() => resetStyles()).not.toThrow();
    expect(getCssText()).toBe("");
  });
});
