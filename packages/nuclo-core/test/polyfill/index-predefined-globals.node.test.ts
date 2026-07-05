/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
/**
 * Targets the uncovered "already defined" branches of src/polyfill/index.ts
 * (lines 44-49): when the host environment already provides the globals, the
 * polyfill must NOT overwrite them.
 */
import { describe, it, expect, vi } from "vitest";

describe("polyfill index with predefined globals", () => {
  it("keeps existing globals untouched", async () => {
    vi.resetModules();

    const fakeDocument = { fake: "document" };
    const fakeEvent = class FakeEvent {};
    const fakeCustomEvent = class FakeCustomEvent {};
    const fakeNode = class FakeNode {};
    const fakeElement = class FakeElement {};
    const fakeHtmlElement = class FakeHTMLElement {};

    vi.stubGlobal("document", fakeDocument);
    vi.stubGlobal("Event", fakeEvent);
    vi.stubGlobal("CustomEvent", fakeCustomEvent);
    vi.stubGlobal("Node", fakeNode);
    vi.stubGlobal("Element", fakeElement);
    vi.stubGlobal("HTMLElement", fakeHtmlElement);

    try {
      await import("../../src/polyfill");
      expect(globalThis.document).toBe(fakeDocument);
      expect(globalThis.Event).toBe(fakeEvent);
      expect(globalThis.CustomEvent).toBe(fakeCustomEvent);
      expect(globalThis.Node).toBe(fakeNode);
      expect(globalThis.Element).toBe(fakeElement);
      expect(globalThis.HTMLElement).toBe(fakeHtmlElement);
    } finally {
      vi.unstubAllGlobals();
      vi.resetModules();
    }
  });
});
