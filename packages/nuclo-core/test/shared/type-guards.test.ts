/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { isNode, isObject, isFunction } from "../../src/shared/type-guards";
import { describe, it, expect } from "vitest";

describe("utility is helpers", () => {
  it("isNode returns true for Nodes", () => {
    const div = document.createElement("div");
    expect(isNode(div)).toBe(true);
    expect(isNode(null)).toBe(false);
    expect(isNode({})).toBe(false);
  });

  it("isObject returns true for plain objects", () => {
    expect(isObject({})).toBe(true);
    expect(isObject([])).toBe(true);
    expect(isObject(null)).toBe(false);
    expect(isObject(42)).toBe(false);
  });

  it("isFunction detects functions", () => {
    expect(isFunction(() => 1)).toBe(true);
    expect(isFunction(function () {})).toBe(true);
    expect(isFunction("fn")).toBe(false);
    expect(isFunction(1)).toBe(false);
  });
});
