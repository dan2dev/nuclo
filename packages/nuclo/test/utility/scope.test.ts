/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach } from "vitest";
import { scope, getScopeRoots } from "../../src/utility/scope";

describe("scope utilities", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("cleans up disconnected scope roots", () => {
    const root = document.createElement("div");
    document.body.appendChild(root);

    scope("demo")(root as any, 0);
    expect(getScopeRoots(["demo"])).toEqual([root]);

    document.body.removeChild(root);
    expect(getScopeRoots(["demo"])).toEqual([]);
    expect(getScopeRoots(["demo"])).toEqual([]);
  });

  it("normalizes scope ids and ignores non-elements", () => {
    expect(getScopeRoots([123 as any, " ", "\n"] as any)).toEqual([]);

    // Non-element parent should be ignored
    expect(() => scope("x")({} as any, 0)).not.toThrow();

    const root = document.createElement("div");
    document.body.appendChild(root);
    scope(" x ", "x", "")(root as any, 0);
    expect(getScopeRoots(["x", "x"])).toEqual([root]);
  });
});
