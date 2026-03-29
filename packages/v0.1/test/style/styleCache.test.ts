/// <reference path="../../types/index.d.ts" />
import { describe, it, expect } from "vitest";
import {
  generateStyleKey,
  getCachedClassName,
  setCachedClassName,
} from "../../src/style/styleCache";

describe("styleCache", () => {
  it("tracks cached class names", () => {
    const key = generateStyleKey({ b: "2", a: "1" });
    expect(getCachedClassName(key)).toBeUndefined();

    setCachedClassName(key, "c123");
    expect(getCachedClassName(key)).toBe("c123");
  });
});
