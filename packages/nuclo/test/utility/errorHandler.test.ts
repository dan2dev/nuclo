import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logError, safeExecute, handleDOMError } from "../../src/utility/errorHandler";

describe('errorHandler utility', () => {
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

  describe('logError', () => {
    it('logs message and error object to console.error', () => {
      const err = new Error('boom');
      logError('Something happened', err);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      const [msg, passedErr] = errorSpy.mock.calls[0];
      expect(msg).toContain('nuclo: Something happened');
      expect(passedErr).toBe(err);
    });
  });

  describe('safeExecute', () => {
    it('returns value when function succeeds', () => {
      const fn = () => 42;
      const result = safeExecute(fn);
      expect(result).toBe(42);
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('returns fallback and logs when function throws', () => {
      const err = new Error('fail');
      const fn = () => { throw err; };
      const result = safeExecute(fn, 99);
      expect(result).toBe(99);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      const [msg, passedErr] = errorSpy.mock.calls[0];
      expect(msg).toContain('nuclo: Operation failed');
      expect(passedErr).toBe(err);
    });

    it('returns undefined if function throws and no fallback provided', () => {
      const err = new Error('kaput');
      const fn = () => { throw err; };
      const result = safeExecute(fn);
      expect(result).toBeUndefined();
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleDOMError', () => {
    it('delegates to logError with formatted message', () => {
      const err = new Error('dom issue');
      handleDOMError(err, 'insertBefore');
      expect(errorSpy).toHaveBeenCalledTimes(1);
      const [msg, passedErr] = errorSpy.mock.calls[0];
      expect(msg).toContain('nuclo: DOM insertBefore failed');
      expect(passedErr).toBe(err);
    });
  });
});