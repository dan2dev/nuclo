/// <reference path="../../types/index.d.ts" />
import { describe, it, expect } from "vitest";
import {
  generateStyleKey,
  getCachedClassName,
  hasCachedClassName,
  setCachedClassName,
} from "../../src/style/styleCache";

describe("styleCache", () => {
  it("tracks cached class names", () => {
    const key = generateStyleKey({ b: "2", a: "1" });
    expect(hasCachedClassName(key)).toBe(false);

    setCachedClassName(key, "c123");
    expect(hasCachedClassName(key)).toBe(true);
    expect(getCachedClassName(key)).toBe("c123");
  });
});

