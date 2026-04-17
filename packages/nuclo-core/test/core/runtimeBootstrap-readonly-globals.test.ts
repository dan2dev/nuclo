/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, vi } from "vitest";

describe("runtimeBootstrap readonly globals", () => {
  it("skips style exports that cannot be assigned", async () => {
    const key = "display";
    const g = globalThis as any;

    const originalDesc = Object.getOwnPropertyDescriptor(g, key);
    const sentinel = g[key] ?? "sentinel";

    Object.defineProperty(g, key, {
      value: sentinel,
      writable: false,
      configurable: true,
    });

    try {
      vi.resetModules();
      await import("../../src/core/runtimeBootstrap");
      expect(g[key]).toBe(sentinel);
    } finally {
      if (originalDesc) {
        Object.defineProperty(g, key, originalDesc);
      } else {
        delete g[key];
      }
    }
  });
});

