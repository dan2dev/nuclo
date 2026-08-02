/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Targets uncovered lines in src/style/engine.ts:
 *  - line 59: createGroup catch — unsupported at-rule in this environment
 *  - line 96: ensureSheet returns null when the style element has no sheet
 *  - line 126: record() returns early when no sheet is available
 *  - line 189: getCssText() memoized cache hit
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { atomBlock, getCssText, resetStyles } from "../../src/style/engine";

beforeEach(() => {
  resetStyles();
});

afterEach(() => {
  resetStyles();
});

describe("getCssText memoization", () => {
  it("returns the cached string until a new rule is recorded", () => {
    atomBlock(undefined, "", [["color", "red"]]);
    const first = getCssText();
    const second = getCssText();
    expect(second).toBe(first);

    atomBlock(undefined, "", [["color", "blue"]]);
    const third = getCssText();
    expect(third).not.toBe(first);
    expect(third).toContain("color:blue");
  });
});

describe("unsupported at-rules", () => {
  it("keeps the rule in the registry even when CSSOM rejects the at-rule", () => {
    const className = atomBlock("@unsupported-at-rule (garbage", "", [["color", "green"]]);
    // CSSOM insertion failed silently; getCssText still serializes the rule.
    expect(getCssText()).toContain("@unsupported-at-rule (garbage");
    expect(getCssText()).toContain(className);
  });
});

describe("style element without a sheet", () => {
  it("accumulates rules in the registry only", () => {
    // Pre-create the #nuclo-styles element with a null sheet so ensureSheet
    // finds it but cannot bind a CSSOM sheet.
    const el = document.createElement("style");
    el.id = "nuclo-styles";
    Object.defineProperty(el, "sheet", { value: null });
    document.head.appendChild(el);

    const className = atomBlock(undefined, "", [["color", "teal"]]);

    expect(getCssText()).toContain(`.${className}{color:teal}`);
  });
});
