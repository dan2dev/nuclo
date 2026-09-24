/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Targets uncovered branches in src/style/css.ts:
 *  - line 190: cx() with a className object holding non-engine classes
 *    (conflictKeyOf returns undefined → the class name itself is the key)
 *  - lines 296-317 (flatDecls): null values, nested objects, unknown `true`
 *    flags and composite `true` flags inside keyframes()
 *  - line 411 (variants): a default pointing at a nonexistent variant value
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createCss, cx } from "../../src/style";
import { getCssText, resetStyles } from "../../src/style/engine";
import type { StyleResult } from "../../src/style";

beforeEach(() => {
  resetStyles();
});

describe("cx() with external className objects", () => {
  it("keeps classes the engine did not generate (no conflict key)", () => {
    const external = { className: "manual-a manual-b" } as StyleResult;
    const result = cx(external);
    expect(result.className).toBe("manual-a manual-b");
  });

  it("ignores empty tokens produced by consecutive spaces", () => {
    const result = cx("manual-a  manual-b", { className: "x  y" } as StyleResult);
    expect(result.className).toBe("manual-a manual-b x y");
  });
});

describe("css() with unknown boolean flags", () => {
  it("silently drops a `true` value whose key has no composite expansion", () => {
    const { css } = createCss();
    const result = css({ unknownFlag: true } as never);
    expect(result.className).toBe("");
  });
});

describe("keyframes() flatDecls edge branches", () => {
  it("skips null values, nested non-raw objects and unknown boolean flags", () => {
    const { keyframes } = createCss();
    const name = keyframes({
      from: {
        opacity: 0,
        color: null,
        hover: { color: "red" },
        mystery: true,
      } as never,
      to: {
        opacity: 1,
        raw: { "--x": 4 },
      } as never,
    });

    const cssText = getCssText();
    expect(cssText).toContain(`@keyframes ${name}`);
    expect(cssText).toContain("opacity:0");
    expect(cssText).toContain("--x:4px");
    // Nested objects and null values never serialize into the frame.
    expect(cssText).not.toContain("color:red");
    expect(cssText).not.toContain("null");
    expect(cssText).not.toContain("mystery");
  });

  it("expands composite boolean flags inside keyframes", () => {
    const { keyframes } = createCss();
    const name = keyframes({
      from: { row: true } as never,
      to: { opacity: 1 } as never,
    });

    const cssText = getCssText();
    expect(cssText).toContain(`@keyframes ${name}`);
    expect(cssText).toContain("display:flex");
    expect(cssText).toContain("flex-direction:row");
  });
});

describe("variants() with a dangling default", () => {
  it("ignores a defaultVariants value that has no compiled style", () => {
    const { variants } = createCss();
    const recipe = variants({
      base: { p: 4 },
      variants: {
        size: { sm: { px: 8 } },
      },
      defaultVariants: { size: "xl" as never },
    });

    // "xl" resolves to no compiled entry — line 411 skips the push.
    const result = recipe();
    expect(result.className).toBeTruthy();
    // The base still applies.
    expect(getCssText()).toContain("padding:4px");
  });
});

describe("themeless default-instance helpers", () => {
  it("variants() and globalStyle() work without createCss()", async () => {
    const { variants, globalStyle } = await import("../../src/style");
    const button = variants({
      base: { p: 4 },
      variants: { tone: { loud: { weight: 700 } } },
    });
    expect(button({ tone: "loud" }).className).toBeTruthy();
    globalStyle("body", { m: 0, bg: "white", raw: { "scroll-behavior": "smooth" }, hover: { color: "red" } });
    const text = getCssText();
    expect(text).toContain("font-weight:700");
    // Flat top-level declarations only: nested blocks are ignored by globalStyle().
    expect(text).toContain("body{margin:0;background:white;scroll-behavior:smooth}");
  });

  it("keyframes() serializes aliases, composites and raw declarations per stop", async () => {
    const { keyframes } = await import("../../src/style");
    const name = keyframes({ from: { opacity: 0, px: 2, row: true }, to: { opacity: 1, raw: { "animation-timing-function": "ease-in" } } });
    expect(getCssText()).toContain(
      `@keyframes ${name}{from{opacity:0;padding-left:2px;padding-right:2px;display:flex;flex-direction:row}to{opacity:1;animation-timing-function:ease-in}}`,
    );
  });
});
