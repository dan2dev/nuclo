import { describe, it, expect, beforeEach, vi } from "vitest";
import { dispatchGlobalUpdateEvent } from "../../src/utility/events";

describe("events utility edge cases", () => {
  describe("dispatchGlobalUpdateEvent", () => {
    it("should dispatch update event on document.body and document", () => {
      const bodyListener = vi.fn();
      const documentListener = vi.fn();
      
      document.body.addEventListener("update", bodyListener);
      document.addEventListener("update", documentListener);

      dispatchGlobalUpdateEvent();

      expect(bodyListener).toHaveBeenCalled();
      expect(documentListener).toHaveBeenCalled();

      document.body.removeEventListener("update", bodyListener);
      document.removeEventListener("update", documentListener);
    });

    it("should handle document.body being null", () => {
      const originalBody = document.body;
      Object.defineProperty(document, "body", {
        value: null,
        configurable: true,
        writable: true,
      });

      const documentListener = vi.fn();
      document.addEventListener("update", documentListener);

      dispatchGlobalUpdateEvent();

      expect(documentListener).toHaveBeenCalled();

      Object.defineProperty(document, "body", {
        value: originalBody,
        configurable: true,
        writable: true,
      });

      document.removeEventListener("update", documentListener);
    });

    it("should handle dispatchEvent errors gracefully", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      
      // Mock dispatchEvent to throw
      const originalDispatch = document.body.dispatchEvent;
      document.body.dispatchEvent = () => {
        throw new Error("dispatch error");
      };

      dispatchGlobalUpdateEvent();

      expect(consoleErrorSpy).toHaveBeenCalled();

      document.body.dispatchEvent = originalDispatch;
      consoleErrorSpy.mockRestore();
    });

    it("should work in non-browser environment (no document)", () => {
      const originalDocument = global.document;
      // @ts-expect-error - testing non-browser
      global.document = undefined;

      // Should not throw
      dispatchGlobalUpdateEvent();

      global.document = originalDocument;
    });

    it("should create bubbling events", () => {
      const listener = vi.fn();
      document.addEventListener("update", listener);

      dispatchGlobalUpdateEvent();

      const event = listener.mock.calls[0][0];
      expect(event.bubbles).toBe(true);

      document.removeEventListener("update", listener);
    });
  });
});

