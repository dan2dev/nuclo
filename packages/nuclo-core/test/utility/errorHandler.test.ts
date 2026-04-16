/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { logError } from "../../src/utility/errorHandler";

describe("errorHandler utility", () => {
  let originalConsoleError: any;
  let errorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalConsoleError = console.error;
    errorSpy = vi.fn();
    console.error = errorSpy as any;
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe("logError", () => {
    it("logs message and error object to console.error", () => {
      const err = new Error("boom");
      logError("Something happened", err);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      const [msg, passedErr] = errorSpy.mock.calls[0];
      expect(msg).toContain("nuclo: Something happened");
      expect(passedErr).toBe(err);
    });

    it("logs message without error", () => {
      logError("Something happened");
      expect(errorSpy).toHaveBeenCalledTimes(1);
      const [msg] = errorSpy.mock.calls[0];
      expect(msg).toContain("nuclo: Something happened");
    });
  });
});
