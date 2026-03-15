/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, vi } from "vitest";
import { logError, safeExecute } from "../../src/utility/errorHandler";

describe("errorHandler (no console present)", () => {
  it("does not throw when console is undefined", () => {
    const originalConsole = globalThis.console;
    vi.stubGlobal("console", undefined as any);
    try {
      expect(() => logError("test", new Error("boom"))).not.toThrow();
      expect(() => safeExecute(() => { throw new Error("fail"); }, 123)).not.toThrow();
    } finally {
      vi.unstubAllGlobals();
      if (globalThis.console !== originalConsole) {
        globalThis.console = originalConsole;
      }
    }
  });
});
