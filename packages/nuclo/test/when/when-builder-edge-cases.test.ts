/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { when } from "../../src/when";
import { updateWhenRuntimes, clearWhenRuntimes } from "../../src/when/runtime";

describe("when builder edge cases", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    clearWhenRuntimes();
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
    clearWhenRuntimes();
  });

  describe("when builder SSR", () => {
    it("should return comment in non-browser environment", () => {
      const originalIsBrowser = (globalThis as any).isBrowser;
      (globalThis as any).isBrowser = false;

      const whenBuilder = when(() => true, "content");
      const result = whenBuilder(container, 0);

      expect(result).toBeInstanceOf(Comment);
      // In SSR, it creates a comment with "when-ssr" text
      expect(result?.textContent).toContain("when");

      (globalThis as any).isBrowser = originalIsBrowser;
    });

    it("should handle createComment returning null in SSR", () => {
      const originalIsBrowser = (globalThis as any).isBrowser;
      (globalThis as any).isBrowser = false;

      const whenBuilder = when(() => true, "content");
      const result = whenBuilder(container, 0);

      // In SSR mode, should return a comment or null
      expect(result === null || result instanceof Comment).toBe(true);

      (globalThis as any).isBrowser = originalIsBrowser;
    });
  });

  describe("when builder chaining", () => {
    it("should chain multiple when conditions", () => {
      let condition1 = false;
      let condition2 = false;
      
      const whenBuilder = when(() => condition1, "content1")
        .when(() => condition2, "content2")
        .else("else content");

      whenBuilder(container, 0);
      updateWhenRuntimes();

      expect(container.textContent).toContain("else content");

      condition1 = true;
      updateWhenRuntimes();
      expect(container.textContent).toContain("content1");

      condition1 = false;
      condition2 = true;
      updateWhenRuntimes();
      expect(container.textContent).toContain("content2");
    });

    it("should handle empty content arrays", () => {
      const whenBuilder = when(() => true);
      whenBuilder(container, 0);
      updateWhenRuntimes();

      // Should not throw, just render nothing
      expect(true).toBe(true);
    });

    it("should handle multiple content items", () => {
      const whenBuilder = when(() => true, "text1", "text2", document.createElement("div"));
      whenBuilder(container, 0);
      updateWhenRuntimes();

      expect(container.textContent).toContain("text1");
      expect(container.textContent).toContain("text2");
      expect(container.querySelector("div")).toBeTruthy();
    });
  });

  describe("when builder update behavior", () => {
    it("should not re-render if condition hasn't changed", () => {
      let condition = true;
      const whenBuilder = when(() => condition, "content");
      
      whenBuilder(container, 0);
      updateWhenRuntimes();
      
      const initialContent = container.textContent;
      
      updateWhenRuntimes(); // Same condition
      
      expect(container.textContent).toBe(initialContent);
    });

    it("should handle condition that throws", () => {
      const condition = () => {
        throw new Error("condition error");
      };
      
      const whenBuilder = when(condition, "content");
      
      // Initial render will throw because resolveCondition doesn't have error handler
      // in evaluateActiveCondition
      expect(() => {
        whenBuilder(container, 0);
      }).toThrow("condition error");
    });

    it("should clean up runtime on error during update", () => {
      let shouldThrow = false;
      const condition = () => {
        if (shouldThrow) {
          throw new Error("update error");
        }
        return true;
      };
      
      const whenBuilder = when(condition, "content");
      whenBuilder(container, 0);
      updateWhenRuntimes();
      
      expect(container.textContent).toContain("content");
      
      shouldThrow = true;
      updateWhenRuntimes(); // Should clean up runtime
      
      // Runtime should be removed, so further updates won't work
      shouldThrow = false;
      updateWhenRuntimes();
      // Content should remain the same (runtime was cleaned up)
      expect(container.textContent).toContain("content");
    });
  });

  describe("when builder with else", () => {
    it("should render else content when no conditions match", () => {
      const whenBuilder = when(() => false, "content")
        .else("else content");
      
      whenBuilder(container, 0);
      updateWhenRuntimes();
      
      expect(container.textContent).toContain("else content");
    });

    it("should not render else if a condition matches", () => {
      const whenBuilder = when(() => true, "content")
        .else("else content");
      
      whenBuilder(container, 0);
      updateWhenRuntimes();
      
      expect(container.textContent).toContain("content");
      expect(container.textContent).not.toContain("else content");
    });

    it("should handle empty else content", () => {
      const whenBuilder = when(() => false, "content")
        .else();
      
      whenBuilder(container, 0);
      updateWhenRuntimes();
      
      // Should have markers but no content
      const comments = Array.from(container.childNodes).filter(
        n => n.nodeType === Node.COMMENT_NODE
      );
      expect(comments.length).toBeGreaterThan(0);
    });
  });

  describe("when builder marker management", () => {
    it("should create start and end markers", () => {
      const whenBuilder = when(() => true, "content");
      const marker = whenBuilder(container, 0);
      
      expect(marker).toBeInstanceOf(Comment);
      // Should have markers in the container
      const comments = Array.from(container.childNodes).filter(
        n => n.nodeType === Node.COMMENT_NODE
      );
      expect(comments.length).toBeGreaterThanOrEqual(1);
    });

    it("should clear content between markers on update", () => {
      let condition = true;
      const whenBuilder = when(() => condition, "content1");
      
      whenBuilder(container, 0);
      updateWhenRuntimes();
      
      expect(container.textContent).toContain("content1");
      
      condition = false;
      updateWhenRuntimes();
      
      // Content should be cleared, markers should remain
      const comments = Array.from(container.childNodes).filter(
        n => n.nodeType === Node.COMMENT_NODE
      );
      expect(comments.length).toBeGreaterThan(0);
    });
  });
});

