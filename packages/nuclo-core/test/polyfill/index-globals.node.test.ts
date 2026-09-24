/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

describe("polyfill index global application", () => {
  it("installs document, Node, Element and HTMLElement when missing", async () => {
    vi.resetModules();
    vi.stubGlobal("document", undefined as any);
    vi.stubGlobal("Node", undefined as any);
    vi.stubGlobal("Element", undefined as any);
    vi.stubGlobal("HTMLElement", undefined as any);

    try {
      const polyfill = await import("../../src/polyfill");
      expect(globalThis.document).toBe(polyfill.document);
      expect(globalThis.Node).toBe(polyfill.NucloNode);
      expect(globalThis.Element).toBe(polyfill.NucloElement);
      expect(globalThis.HTMLElement).toBe(polyfill.NucloElement);
      // Event/CustomEvent are the runtime's own globals, re-exported as-is.
      expect(polyfill.Event).toBe(globalThis.Event);
      expect(polyfill.CustomEvent).toBe(globalThis.CustomEvent);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
