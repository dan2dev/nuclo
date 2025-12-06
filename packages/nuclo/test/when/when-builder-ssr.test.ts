/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// This test file specifically tests the SSR branch in builder.ts
// by mocking the isBrowser constant before the module is imported

describe("when builder SSR branches", () => {
  describe("SSR mode (!isBrowser = true)", () => {
    beforeEach(() => {
      // Clear all module caches before each test
      vi.resetModules();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.resetModules();
    });

    it("should return comment in SSR mode when createComment succeeds", async () => {
      // Mock isBrowser to be false BEFORE importing the builder module
      vi.doMock("../../src/utility/environment", () => ({
        isBrowser: false
      }));

      // Mock createComment to return a comment node
      const mockComment = {
        nodeType: 8,
        nodeName: "#comment",
        textContent: "when-ssr",
        data: "when-ssr"
      };

      vi.doMock("../../src/utility/dom", async (importOriginal) => {
        const actual = await importOriginal<typeof import("../../src/utility/dom")>();
        return {
          ...actual,
          createComment: vi.fn(() => mockComment),
          createMarkerPair: actual.createMarkerPair
        };
      });

      // Now import the builder module - it will use the mocked isBrowser
      const { WhenBuilderImpl } = await import("../../src/when/builder");

      // Create a mock container
      const container = { appendChild: vi.fn() } as any;

      // Create builder and render
      const builder = new WhenBuilderImpl(() => true, "content");
      const result = builder.render(container, 0);

      // In SSR mode with successful comment creation, should return the comment
      expect(result).toBe(mockComment);
      expect(result?.nodeType).toBe(8);
    });

    it("should return null in SSR mode when createComment returns null", async () => {
      // Mock isBrowser to be false
      vi.doMock("../../src/utility/environment", () => ({
        isBrowser: false
      }));

      // Mock createComment to return null
      vi.doMock("../../src/utility/dom", async (importOriginal) => {
        const actual = await importOriginal<typeof import("../../src/utility/dom")>();
        return {
          ...actual,
          createComment: vi.fn(() => null),
          createMarkerPair: actual.createMarkerPair
        };
      });

      // Import the builder module with mocked dependencies
      const { WhenBuilderImpl } = await import("../../src/when/builder");

      // Create a mock container
      const container = { appendChild: vi.fn() } as any;

      // Create builder and render
      const builder = new WhenBuilderImpl(() => true, "content");
      const result = builder.render(container, 0);

      // In SSR mode with createComment returning null, should return null
      expect(result).toBe(null);
    });

    it("should return null in SSR mode when createComment returns undefined", async () => {
      // Mock isBrowser to be false
      vi.doMock("../../src/utility/environment", () => ({
        isBrowser: false
      }));

      // Mock createComment to return undefined
      vi.doMock("../../src/utility/dom", async (importOriginal) => {
        const actual = await importOriginal<typeof import("../../src/utility/dom")>();
        return {
          ...actual,
          createComment: vi.fn(() => undefined),
          createMarkerPair: actual.createMarkerPair
        };
      });

      // Import the builder module with mocked dependencies
      const { WhenBuilderImpl } = await import("../../src/when/builder");

      // Create a mock container
      const container = { appendChild: vi.fn() } as any;

      // Create builder and render
      const builder = new WhenBuilderImpl(() => true, "content");
      const result = builder.render(container, 0);

      // In SSR mode with createComment returning undefined, should return null (undefined || null)
      expect(result).toBe(null);
    });

    it("should return comment in SSR mode with falsy comment that's not null/undefined", async () => {
      // Mock isBrowser to be false
      vi.doMock("../../src/utility/environment", () => ({
        isBrowser: false
      }));

      // Mock createComment to return empty string (falsy but not null)
      vi.doMock("../../src/utility/dom", async (importOriginal) => {
        const actual = await importOriginal<typeof import("../../src/utility/dom")>();
        return {
          ...actual,
          createComment: vi.fn(() => "" as any),
          createMarkerPair: actual.createMarkerPair
        };
      });

      // Import the builder module with mocked dependencies
      const { WhenBuilderImpl } = await import("../../src/when/builder");

      // Create a mock container
      const container = { appendChild: vi.fn() } as any;

      // Create builder and render
      const builder = new WhenBuilderImpl(() => true, "content");
      const result = builder.render(container, 0);

      // Empty string is falsy, so "" || null should return null
      expect(result).toBe(null);
    });
  });

  // Note: Browser mode (isBrowser = true) is already tested extensively in
  // when-builder-edge-cases.test.ts and when-builder-coverage.test.ts
  // We don't need to duplicate those tests here since this file focuses on SSR branches

  describe("Edge cases with different content types", () => {
    beforeEach(() => {
      vi.resetModules();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.resetModules();
    });

    it("should handle SSR with no content", async () => {
      vi.doMock("../../src/utility/environment", () => ({
        isBrowser: false
      }));

      const mockComment = { nodeType: 8, textContent: "when-ssr" };

      vi.doMock("../../src/utility/dom", async (importOriginal) => {
        const actual = await importOriginal<typeof import("../../src/utility/dom")>();
        return {
          ...actual,
          createComment: vi.fn(() => mockComment),
          createMarkerPair: actual.createMarkerPair
        };
      });

      const { WhenBuilderImpl } = await import("../../src/when/builder");
      const container = { appendChild: vi.fn() } as any;

      // Create builder with no content
      const builder = new WhenBuilderImpl(() => true);
      const result = builder.render(container, 0);

      expect(result).toBe(mockComment);
    });

    it("should handle SSR with multiple content items", async () => {
      vi.doMock("../../src/utility/environment", () => ({
        isBrowser: false
      }));

      const mockComment = { nodeType: 8, textContent: "when-ssr" };

      vi.doMock("../../src/utility/dom", async (importOriginal) => {
        const actual = await importOriginal<typeof import("../../src/utility/dom")>();
        return {
          ...actual,
          createComment: vi.fn(() => mockComment),
          createMarkerPair: actual.createMarkerPair
        };
      });

      const { WhenBuilderImpl } = await import("../../src/when/builder");
      const container = { appendChild: vi.fn() } as any;

      // Create builder with multiple content items
      const builder = new WhenBuilderImpl(() => true, "text1", "text2", "text3");
      const result = builder.render(container, 0);

      expect(result).toBe(mockComment);
    });
  });
});
