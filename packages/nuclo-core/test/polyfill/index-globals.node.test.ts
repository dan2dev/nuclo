/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

describe("polyfill index global application", () => {
  it("sets Event and CustomEvent when missing", async () => {
    vi.resetModules();
    vi.stubGlobal("document", undefined as any);
    vi.stubGlobal("Event", undefined as any);
    vi.stubGlobal("CustomEvent", undefined as any);
    vi.stubGlobal("Node", undefined as any);
    vi.stubGlobal("Element", undefined as any);
    vi.stubGlobal("HTMLElement", undefined as any);

    try {
      await import("../../src/polyfill");
      expect(globalThis.document).toBeDefined();
      expect(globalThis.Event).toBeDefined();
      expect(globalThis.CustomEvent).toBeDefined();
      expect(globalThis.Node).toBeDefined();
      expect(globalThis.Element).toBeDefined();
      expect(globalThis.HTMLElement).toBeDefined();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
