/**
 * @vitest-environment jsdom
 *
 * Targets uncovered branches in src/style/styleQueries.ts (lines 255, 299):
 *
 *  Line 255 – createStyleQueries cn() overload: className-only string argument
 *  Line 299 – createStyleQueries cn() overload: className string + queryStyles arg
 *
 * Also provides broader combinatorial coverage for createStyleQueries /
 * createBreakpoints query resolution paths.
 */

import { describe, it, expect } from "vitest";
import {
  createStyleQueries,
  createBreakpoints,
} from "../../src/style/styleQueries";
import { StyleBuilder } from "../../src/style/styleBuilder";

// ── helpers ───────────────────────────────────────────────────────────────────

function makeBuilder(color: string) {
  return new StyleBuilder().add("color", color);
}

// ── Unit: createStyleQueries – Record-based definitions ──────────────────────
describe("createStyleQueries – Record definitions", () => {
  it("creates a cn() function that returns { className: string }", () => {
    const sq = createStyleQueries({ md: "@media (min-width: 768px)" });
    const result = sq(makeBuilder("red"));
    expect(result).toHaveProperty("className");
    expect(typeof result.className).toBe("string");
  });

  it("applies default styles only", () => {
    const sq = createStyleQueries({ lg: "@media (min-width: 1024px)" });
    const result = sq(makeBuilder("blue"));
    expect(result.className.length).toBeGreaterThan(0);
  });

  it("applies query styles for the named breakpoint", () => {
    const sq = createStyleQueries({ sm: "@media (max-width: 639px)" });
    const result = sq(makeBuilder("black"), {
      sm: makeBuilder("white"),
    });
    expect(result.className.length).toBeGreaterThan(0);
  });

  it("applies pseudo-class styles", () => {
    const sq = createStyleQueries({ md: "@media (min-width: 768px)" });
    const result = sq(makeBuilder("gray"), {
      hover: makeBuilder("darkgray"),
    });
    expect(result.className.length).toBeGreaterThan(0);
  });

  it("returns same class for same styles (cache hit)", () => {
    const sq = createStyleQueries({ md: "@media (min-width: 768px)" });
    const r1 = sq(makeBuilder("orange"));
    const r2 = sq(makeBuilder("orange"));
    expect(r1.className).toBe(r2.className);
  });
});

// ── Unit: createStyleQueries – cn() overloads ─────────────────────────────────
describe("createStyleQueries – cn() overloads (lines 255, 299)", () => {
  it("accepts className string as sole argument (line 255)", () => {
    const sq = createStyleQueries({ md: "@media (min-width: 768px)" });
    // Overload: cn(className: string) → { className }
    const result = sq("my-class");
    expect(result).toHaveProperty("className");
    expect(result.className).toBe("my-class");
  });

  it("accepts className string + queryStyles (line 299)", () => {
    const sq = createStyleQueries({ md: "@media (min-width: 768px)" });
    // Overload: cn(className, queryStyles) → { className }
    // When styles are provided the class name gets a hash suffix: "named-class_<hash>"
    const result = sq("named-class", {
      hover: makeBuilder("red"),
    });
    expect(result).toHaveProperty("className");
    expect(result.className).toContain("named-class");
    expect(result.className.length).toBeGreaterThan("named-class".length);
  });

  it("accepts className string + default styles + queryStyles", () => {
    const sq = createStyleQueries({ md: "@media (min-width: 768px)" });
    // Named class with styles gets suffix: "custom-name_<hash>"
    const result = sq("custom-name", makeBuilder("green"), {
      md: makeBuilder("lime"),
    });
    expect(result.className).toContain("custom-name");
  });

  it("called with no arguments returns empty className or object", () => {
    const sq = createStyleQueries({});
    // Should not throw
    const result = sq();
    expect(result).toHaveProperty("className");
  });
});

// ── Unit: createBreakpoints – tuple-based definitions ─────────────────────────
describe("createBreakpoints – tuple definitions", () => {
  it("creates a cn() function from tuple array", () => {
    const bp = createBreakpoints([
      ["sm", "@media (max-width: 639px)"],
      ["md", "@media (min-width: 640px)"],
    ] as const);
    const result = bp(makeBuilder("teal"));
    expect(result.className.length).toBeGreaterThan(0);
  });

  it("applies tuple-defined query styles", () => {
    const bp = createBreakpoints([
      ["xl", "@media (min-width: 1280px)"],
    ] as const);
    const result = bp(makeBuilder("cyan"), { xl: makeBuilder("navy") });
    expect(result.className.length).toBeGreaterThan(0);
  });
});

// ── Integration: container queries ───────────────────────────────────────────
describe("createStyleQueries – container query definitions", () => {
  it("resolves @container at-rules", () => {
    const sq = createStyleQueries({
      sidebar: "@container sidebar (min-width: 200px)",
    });
    const result = sq(makeBuilder("pink"), {
      sidebar: makeBuilder("magenta"),
    });
    expect(result.className.length).toBeGreaterThan(0);
  });
});

// ── Integration: @supports queries ───────────────────────────────────────────
describe("createStyleQueries – @supports queries", () => {
  it("resolves @supports rules", () => {
    const sq = createStyleQueries({
      grid: "@supports (display: grid)",
    });
    const result = sq(makeBuilder("brown"), {
      grid: makeBuilder("chocolate"),
    });
    expect(result.className.length).toBeGreaterThan(0);
  });
});

// ── Type validation ──────────────────────────────────────────────────────────
describe("Type validation", () => {
  it("createStyleQueries accepts const record type", () => {
    const definitions = { sm: "@media (max-width: 639px)" } as const;
    const sq = createStyleQueries(definitions);
    expect(typeof sq).toBe("function");
  });

  it("createStyleQueries accepts empty definitions", () => {
    const sq = createStyleQueries({});
    expect(typeof sq).toBe("function");
  });
});
