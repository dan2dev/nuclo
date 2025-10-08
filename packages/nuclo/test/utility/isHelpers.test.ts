// @vitest-environment jsdom
import { isNode, isObject, isTagLike, isBoolean, isFunction } from "../../src/utility/typeGuards.js";
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

  it("isTagLike returns true for objects with tagName", () => {
    expect(isTagLike({ tagName: "div" })).toBe(true);
    expect(isTagLike({})).toBe(false);
    expect(isTagLike(null)).toBe(false);
  });

  it("isBoolean properly identifies booleans", () => {
    expect(isBoolean(false)).toBe(true);
    expect(isBoolean(true)).toBe(true);
    expect(isBoolean(0)).toBe(false);
    expect(isBoolean("true")).toBe(false);
  });

  it("isFunction detects functions", () => {
    expect(isFunction(() => 1)).toBe(true);
    expect(isFunction(function () {})).toBe(true);
    expect(isFunction("fn")).toBe(false);
    expect(isFunction(1)).toBe(false);
  });
});
