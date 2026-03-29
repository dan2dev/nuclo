/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, vi } from "vitest";
import { logError } from "../../src/utility/errorHandler";

describe("errorHandler (no console present)", () => {
  it("does not throw when console is undefined", () => {
    const originalConsole = globalThis.console;
    vi.stubGlobal("console", undefined as any);
    try {
      expect(() => logError("test", new Error("boom"))).not.toThrow();
    } finally {
      vi.unstubAllGlobals();
      if (globalThis.console !== originalConsole) {
        globalThis.console = originalConsole;
      }
    }
  });
});
