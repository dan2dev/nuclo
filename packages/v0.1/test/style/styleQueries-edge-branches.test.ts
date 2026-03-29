/// <reference path="../../types/index.d.ts" />
import { describe, it, expect } from "vitest";
import { createStyleQueries } from "../../src/style/styleQueries";
import { bg } from "../../src/style/styleBuilder";

describe("styleQueries edge branches", () => {
  it("parses pseudo-class and @style queries and supports empty invocation", () => {
    const cn = createStyleQueries(
      [
        ["hover", "&:hover"],
        ["focus", ":focus"],
        ["style", "@style color"],
      ] as const
    );

    expect(cn().className).toBe("");
  });

  it("returns empty className when styles contain no recognized keys", () => {
    const cn = createStyleQueries({});
    expect((cn as any)({ notAQuery: bg("red") }).className).toBe("");
  });

  it("generates CSS for built-in pseudo-classes", () => {
    const cn = createStyleQueries({});
    const result = cn({ hover: bg("red") } as any);
    expect(result.className).toMatch(/^n[0-9a-f]{8}$/);
  });

  it("treats empty string className as undefined (line 205)", () => {
    const cn = createStyleQueries({ md: "@media (min-width: 768px)" });
    // Passing empty string — trimmedClassName is '' which is falsy, so namedClassName = undefined
    const result = cn("");
    expect(result.className).toBe("");
  });

  it("treats whitespace-only className as undefined (line 205)", () => {
    const cn = createStyleQueries({ md: "@media (min-width: 768px)" });
    const result = cn("   ");
    expect(result.className).toBe("");
  });

  it("empty string className with query styles generates hash-only class", () => {
    const cn = createStyleQueries({ md: "@media (min-width: 768px)" });
    const result = cn("", { md: bg("blue") });
    // namedClassName is undefined so class is hash-based, not prefixed
    expect(result.className).toMatch(/^n[0-9a-f]{8}$/);
  });

  it("pseudo-class in queryStyles that is also a registered query name uses query definition", () => {
    const cn = createStyleQueries({ hover: "&:hover" });
    const result = cn({ hover: bg("red") });
    // hover is in queriesArray AND isPseudoClass — should be processed as query, not pseudo
    expect(result.className.length).toBeGreaterThan(0);
  });
});
