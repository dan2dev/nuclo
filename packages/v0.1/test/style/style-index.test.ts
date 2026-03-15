/// <reference path="../../types/index.d.ts" />
import { describe, it, expect } from "vitest";
import * as styleExports from "../../src/style";

describe("style module exports", () => {
  it("should export StyleBuilder", () => {
    expect(typeof styleExports.StyleBuilder).toBe("function");
  });

  it("should export createStyleQueries", () => {
    expect(typeof styleExports.createStyleQueries).toBe("function");
  });

  it("should export createBreakpoints", () => {
    expect(typeof styleExports.createBreakpoints).toBe("function");
  });

  it("should export createCSSClass", () => {
    expect(typeof styleExports.createCSSClass).toBe("function");
  });

  it("should export style utility functions", () => {
    // Test a sample of exported functions
    expect(typeof styleExports.display).toBe("function");
    expect(typeof styleExports.flex).toBe("function");
    expect(typeof styleExports.grid).toBe("function");
    expect(typeof styleExports.bg).toBe("function");
    expect(typeof styleExports.color).toBe("function");
    expect(typeof styleExports.fontSize).toBe("function");
    expect(typeof styleExports.padding).toBe("function");
    expect(typeof styleExports.margin).toBe("function");
    expect(typeof styleExports.width).toBe("function");
    expect(typeof styleExports.height).toBe("function");
    expect(typeof styleExports.border).toBe("function");
    expect(typeof styleExports.borderRadius).toBe("function");
  });

  it("should export CSSPseudoClass type", () => {
    // Type exports can't be tested at runtime, but we can verify the module loads
    expect(styleExports).toBeDefined();
  });
});

