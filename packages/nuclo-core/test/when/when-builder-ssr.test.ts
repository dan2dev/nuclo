/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { when } from "../../src/when";

/**
 * SSR behaviour of when(): without a document (no polyfill) rendering throws
 * rather than silently rendering nothing; with the polyfill document it runs
 * the full marker-based render and returns the start-marker comment.
 */

describe("when builder SSR branches", () => {
  it("throws when no document is available (the polyfill is required)", () => {
    expect(() => when(() => true, "content")({} as ExpandedElement<"div">, 0)).toThrow();
  });

  describe("with the polyfill document", () => {
    let savedDocument: typeof globalThis.document | undefined;

    beforeAll(async () => {
      savedDocument = (globalThis as { document?: Document }).document;
      const { document } = await import("../../src/polyfill/Document");
      (globalThis as { document?: unknown }).document = document;
    });

    afterAll(() => {
      (globalThis as { document?: unknown }).document = savedDocument;
    });

    async function host(): Promise<ExpandedElement<"div">> {
      const { NucloElement } = await import("../../src/polyfill/Element");
      return new NucloElement("div") as unknown as ExpandedElement<"div">;
    }

    function texts(el: ExpandedElement<"div">): string[] {
      return ((el as unknown as { children: Array<{ textContent?: string }> }).children).map((c) => c.textContent ?? "");
    }

    it("returns the start marker and renders the active branch", async () => {
      const el = await host();
      const result = when(() => true, "content")(el, 0) as Comment;
      expect(result.nodeType).toBe(8);
      expect(texts(el)).toEqual(["when-start-0-b0", " text-0 ", "content", "when-end"]);
    });

    it("still creates markers when no branch matches", async () => {
      const el = await host();
      const result = when(() => false, "content")(el, 0) as Comment;
      expect(result.nodeType).toBe(8);
      expect(texts(el)).toEqual(["when-start-0-bn", "when-end"]);
    });

    it("renders an empty branch as just the markers", async () => {
      const el = await host();
      when(() => true)(el, 0);
      expect(texts(el)).toEqual(["when-start-0-b0", "when-end"]);
    });

    it("renders every content item of the active branch", async () => {
      const el = await host();
      when(() => true, "text1", "text2", "text3")(el, 0);
      expect(texts(el).filter((t) => t.startsWith("text"))).toEqual(["text1", "text2", "text3"]);
    });

    it("renders the else branch of a when/else chain", async () => {
      const el = await host();
      when(() => false, "if-content").else("else-content")(el, 0);
      expect(texts(el)).toContain("else-content");
      expect(texts(el)).not.toContain("if-content");
      expect(texts(el)[0]).toBe("when-start-0-b-1");
    });
  });
});
