import { describe, it, expect } from "vitest";
import { isPrimitive } from "../../src/utility/typeGuards.js";

describe("isPrimitive", () => {
  it("returns true for string", () => {
    expect(isPrimitive("hello")).toBe(true);
  });
  it("returns true for number", () => {
    expect(isPrimitive(123)).toBe(true);
    expect(isPrimitive(NaN)).toBe(true);
    expect(isPrimitive(Infinity)).toBe(true);
  });
  it("returns true for boolean", () => {
    expect(isPrimitive(true)).toBe(true);
    expect(isPrimitive(false)).toBe(true);
  });
  it("returns true for symbol", () => {
    expect(isPrimitive(Symbol("foo"))).toBe(true);
  });
  it("returns true for bigint", () => {
    expect(isPrimitive(BigInt(10))).toBe(true);
  });
  it("returns true for undefined", () => {
    expect(isPrimitive(undefined)).toBe(true);
  });
  it("returns true for null", () => {
    expect(isPrimitive(null)).toBe(true);
  });
  it("returns false for object", () => {
    expect(isPrimitive({})).toBe(false);
    expect(isPrimitive([])).toBe(false);
    expect(isPrimitive(new Date())).toBe(false);
  });
  it("returns false for function", () => {
    expect(isPrimitive(() => {})).toBe(false);
    expect(isPrimitive(function() {})).toBe(false);
  });
  it("returns false for class instance", () => {
    class A {}
    expect(isPrimitive(new A())).toBe(false);
  });
});
