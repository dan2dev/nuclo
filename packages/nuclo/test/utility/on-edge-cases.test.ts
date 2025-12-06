/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, vi } from "vitest";
import { on } from "../../src/utility/on";

describe("on utility edge cases", () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement("button");
    document.body.appendChild(element);
  });

  describe("on function", () => {
    it("should attach event listener", () => {
      const listener = vi.fn();
      const modifier = on("click", listener);
      
      modifier(element, 0);
      
      element.click();
      expect(listener).toHaveBeenCalled();
    });

    it("should handle invalid parent element", () => {
      const listener = vi.fn();
      const modifier = on("click", listener);
      
      // @ts-expect-error - testing invalid input
      modifier(null, 0);
      
      // Should not throw, just return early
      expect(true).toBe(true);
    });

    it("should handle element without addEventListener", () => {
      const listener = vi.fn();
      const modifier = on("click", listener);
      
      const fakeElement = {} as HTMLElement;
      modifier(fakeElement, 0);
      
      // Should not throw
      expect(true).toBe(true);
    });

    it("should wrap listener to handle errors", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const listener = vi.fn(() => {
        throw new Error("listener error");
      });
      const modifier = on("click", listener);
      
      modifier(element, 0);
      element.click();
      
      expect(listener).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("should pass options to addEventListener", () => {
      const listener = vi.fn();
      const modifier = on("click", listener, { once: true });
      
      modifier(element, 0);
      
      element.click();
      element.click(); // Second click should not fire (once: true)
      
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should handle boolean options", () => {
      const listener = vi.fn();
      const modifier = on("click", listener, true); // useCapture = true
      
      modifier(element, 0);
      
      element.click();
      expect(listener).toHaveBeenCalled();
    });

    it("should call listener with correct context", () => {
      let calledContext: any;
      const listener = function(this: HTMLElement) {
        calledContext = this;
      };
      const modifier = on("click", listener);
      
      modifier(element, 0);
      element.click();
      
      expect(calledContext).toBe(element);
    });

    it("should handle custom event types", () => {
      const listener = vi.fn();
      const modifier = on("custom-event", listener);
      
      modifier(element, 0);
      
      element.dispatchEvent(new Event("custom-event"));
      expect(listener).toHaveBeenCalled();
    });

    it("should handle multiple event listeners on same element", () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const modifier1 = on("click", listener1);
      const modifier2 = on("click", listener2);
      
      modifier1(element, 0);
      modifier2(element, 1);
      
      element.click();
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it("should handle typed events correctly", () => {
      const listener = vi.fn((e: MouseEvent) => {
        expect(e.type).toBe("click");
      });
      const modifier = on("click", listener);
      
      modifier(element, 0);
      element.click();
      
      expect(listener).toHaveBeenCalled();
    });
  });
});

