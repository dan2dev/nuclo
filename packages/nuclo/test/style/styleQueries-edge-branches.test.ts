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
});
