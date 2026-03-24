/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Tests the SSR behaviour of WhenBuilderImpl.render().
 *
 * The builder now gates on `globalThis.document` (not the old `isBrowser`
 * flag).  When `globalThis.document` is absent (pure Node.js, no polyfill)
 * `render()` must return `null`.  When it is present (polyfill loaded) the
 * full marker-based render runs and returns the start-marker Comment node.
 */

describe("when builder SSR branches", () => {
  describe("SSR mode — globalThis.document is undefined (no polyfill)", () => {
    // In @vitest-environment node the polyfill is NOT imported, so
    // globalThis.document is undefined — builder must return null.
    it("should return null when document is not available", async () => {
      const { WhenBuilderImpl } = await import("../../src/when/builder");
      const container = {} as any;
      const builder = new WhenBuilderImpl(() => true, "content");
      const result = builder.render(container, 0);
      expect(result).toBeNull();
    });

    it("should return null with no content when document is not available", async () => {
      const { WhenBuilderImpl } = await import("../../src/when/builder");
      const container = {} as any;
      const builder = new WhenBuilderImpl(() => true);
      const result = builder.render(container, 0);
      expect(result).toBeNull();
    });

    it("should return null with multiple content items when document is not available", async () => {
      const { WhenBuilderImpl } = await import("../../src/when/builder");
      const container = {} as any;
      const builder = new WhenBuilderImpl(() => true, "text1", "text2", "text3");
      const result = builder.render(container, 0);
      expect(result).toBeNull();
    });

    it("should return null even when condition is false and document is not available", async () => {
      const { WhenBuilderImpl } = await import("../../src/when/builder");
      const container = {} as any;
      const builder = new WhenBuilderImpl(() => false, "content");
      const result = builder.render(container, 0);
      expect(result).toBeNull();
    });
  });

  describe("SSR mode — globalThis.document is available (polyfill loaded)", () => {
    let savedDocument: typeof globalThis.document | undefined;

    beforeAll(async () => {
      // Install the polyfill document so the builder takes the full render path.
      savedDocument = (globalThis as any).document;
      const { document } = await import("../../src/polyfill/Document");
      (globalThis as any).document = document;
    });

    afterAll(() => {
      (globalThis as any).document = savedDocument;
    });

    it("should return a Comment node (start marker) when document is available", async () => {
      const { WhenBuilderImpl } = await import("../../src/when/builder");
      const { NucloElement } = await import("../../src/polyfill/Element");
      const host = new NucloElement("div") as any;
      const builder = new WhenBuilderImpl(() => true, "content");
      const result = builder.render(host, 0);
      // Full render path: returns the start-marker Comment
      expect(result).not.toBeNull();
      expect((result as any)?.nodeType).toBe(8);
    });

    it("should return a Comment node even when condition is false (else branch / no render)", async () => {
      const { WhenBuilderImpl } = await import("../../src/when/builder");
      const { NucloElement } = await import("../../src/polyfill/Element");
      const host = new NucloElement("div") as any;
      const builder = new WhenBuilderImpl(() => false, "content");
      const result = builder.render(host, 0);
      // Markers are still created — start marker is returned
      expect(result).not.toBeNull();
      expect((result as any)?.nodeType).toBe(8);
    });

    it("should handle SSR with no content items", async () => {
      const { WhenBuilderImpl } = await import("../../src/when/builder");
      const { NucloElement } = await import("../../src/polyfill/Element");
      const host = new NucloElement("div") as any;
      const builder = new WhenBuilderImpl(() => true);
      const result = builder.render(host, 0);
      expect(result).not.toBeNull();
      expect((result as any)?.nodeType).toBe(8);
    });

    it("should handle SSR with multiple content items", async () => {
      const { WhenBuilderImpl } = await import("../../src/when/builder");
      const { NucloElement } = await import("../../src/polyfill/Element");
      const host = new NucloElement("div") as any;
      const builder = new WhenBuilderImpl(() => true, "text1", "text2", "text3");
      const result = builder.render(host, 0);
      expect(result).not.toBeNull();
      expect((result as any)?.nodeType).toBe(8);
    });

    it("should handle when + else chain", async () => {
      const { WhenBuilderImpl } = await import("../../src/when/builder");
      const { NucloElement } = await import("../../src/polyfill/Element");
      const host = new NucloElement("div") as any;
      const builder = new WhenBuilderImpl(() => false, "if-content");
      builder.else("else-content");
      const result = builder.render(host, 0);
      expect(result).not.toBeNull();
      expect((result as any)?.nodeType).toBe(8);
    });
  });
});
