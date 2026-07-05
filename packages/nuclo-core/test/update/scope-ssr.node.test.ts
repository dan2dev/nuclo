/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
/**
 * Targets uncovered line 91 in src/update/scope.ts: the scope() modifier is a
 * no-op outside the browser (SSR) — no roots are ever registered.
 */
import { describe, it, expect } from "vitest";
import { scope, getScopeRoots } from "../../src/update/scope";

describe("scope() in a non-browser environment", () => {
  it("does not register any scope roots", () => {
    const modifier = scope("ssr-scope");
    const fakeParent = { tagName: "DIV" } as unknown as ExpandedElement;

    expect(() => modifier(fakeParent, 0)).not.toThrow();
    expect(getScopeRoots(["ssr-scope"])).toEqual([]);
  });
});
