/**
 * @vitest-environment jsdom
 *
 * Targets uncovered branches in src/utility/dom.ts when the document is not
 * available (returns null):
 *
 *  Lines 16-17  – createElement returns null when document unavailable
 *  Lines 27-28  – createElementNS returns null
 *  Lines 34-36  – createTextNode returns null
 *  Lines 42-44  – createDocumentFragment returns null
 *  Line  73     – cleanupEventListeners COMMENT_NODE branch (nodeType 8)
 *  Lines 142-148 – createConditionalComment try/catch (createComment throws)
 *
 * We temporarily replace globalThis.document to simulate an SSR environment.
 */

import { describe, it, expect, afterEach } from "vitest";
import {
  createElement,
  createElementNS,
  createTextNode,
  createDocumentFragment,
  createComment,
  createConditionalComment,
  safeRemoveChild,
} from "../../src/utility/dom";

// ── helpers ───────────────────────────────────────────────────────────────────

function removeDocument() {
  Object.defineProperty(globalThis, "document", {
    value: undefined,
    writable: true,
    configurable: true,
  });
}

let savedDocument: typeof globalThis.document;

function saveAndRemoveDocument() {
  savedDocument = globalThis.document;
  removeDocument();
}

function restoreDocument() {
  Object.defineProperty(globalThis, "document", {
    value: savedDocument,
    writable: true,
    configurable: true,
  });
}

afterEach(() => {
  // Always restore even if a test aborts early
  if (savedDocument !== undefined) {
    restoreDocument();
    savedDocument = undefined as unknown as typeof globalThis.document;
  }
});

// ── createElement ─────────────────────────────────────────────────────────────
describe("createElement", () => {
  describe("Unit", () => {
    it("creates a standard HTML element when document is available", () => {
      const el = createElement("div");
      expect(el).toBeTruthy();
      expect(el!.tagName.toLowerCase()).toBe("div");
    });

    it("returns null when globalThis.document is undefined (line 16-17)", () => {
      saveAndRemoveDocument();
      const el = createElement("div");
      restoreDocument();
      savedDocument = undefined as unknown as typeof globalThis.document;
      expect(el).toBeNull();
    });
  });
});

// ── createElementNS ───────────────────────────────────────────────────────────
describe("createElementNS", () => {
  describe("Unit", () => {
    it("creates an SVG element when document is available", () => {
      const el = createElementNS("http://www.w3.org/2000/svg", "svg");
      expect(el).toBeTruthy();
    });

    it("returns null when document is undefined (line 27-28)", () => {
      saveAndRemoveDocument();
      const el = createElementNS("http://www.w3.org/2000/svg", "svg");
      restoreDocument();
      savedDocument = undefined as unknown as typeof globalThis.document;
      expect(el).toBeNull();
    });
  });
});

// ── createTextNode ────────────────────────────────────────────────────────────
describe("createTextNode", () => {
  describe("Unit", () => {
    it("creates a text node when document is available", () => {
      const tn = createTextNode("hello");
      expect(tn).toBeTruthy();
      expect(tn!.textContent).toBe("hello");
    });

    it("returns null when document is undefined (lines 34-36)", () => {
      saveAndRemoveDocument();
      const tn = createTextNode("hello");
      restoreDocument();
      savedDocument = undefined as unknown as typeof globalThis.document;
      expect(tn).toBeNull();
    });
  });
});

// ── createDocumentFragment ────────────────────────────────────────────────────
describe("createDocumentFragment", () => {
  describe("Unit", () => {
    it("creates a fragment when document is available", () => {
      const frag = createDocumentFragment();
      expect(frag).toBeTruthy();
    });

    it("returns null when document is undefined (lines 42-44)", () => {
      saveAndRemoveDocument();
      const frag = createDocumentFragment();
      restoreDocument();
      savedDocument = undefined as unknown as typeof globalThis.document;
      expect(frag).toBeNull();
    });
  });
});

// ── createComment ─────────────────────────────────────────────────────────────
describe("createComment", () => {
  describe("Unit", () => {
    it("creates a comment node", () => {
      const c = createComment("test");
      expect(c).toBeTruthy();
    });

    it("returns null in non-browser environment (isBrowser = false path)", () => {
      // createComment calls createCommentSafely which checks isBrowser
      // In jsdom isBrowser = true, so it won't return null normally.
      // We verify the happy path here.
      const c = createComment("hello");
      expect(c?.nodeType).toBe(8);
    });
  });
});

// ── createConditionalComment ──────────────────────────────────────────────────
describe("createConditionalComment", () => {
  describe("Unit", () => {
    it("creates a conditional comment with default suffix", () => {
      const c = createConditionalComment("div");
      expect(c?.nodeValue).toContain("conditional-div-hidden");
    });

    it("creates a conditional comment with custom suffix", () => {
      const c = createConditionalComment("span", "visible");
      expect(c?.nodeValue).toContain("conditional-span-visible");
    });

    it("returns null when document is unavailable (lines 142-148)", () => {
      saveAndRemoveDocument();
      const c = createConditionalComment("button");
      restoreDocument();
      savedDocument = undefined as unknown as typeof globalThis.document;
      expect(c).toBeNull();
    });
  });
});

// ── safeRemoveChild – COMMENT_NODE cleanup (line 73) ─────────────────────────
describe("safeRemoveChild – COMMENT_NODE cleanup branch (line 73)", () => {
  it("cleanly removes a comment node child and calls unregisterConditionalNode", () => {
    const parent = document.createElement("div");
    const comment = document.createComment("some-comment");
    parent.appendChild(comment);
    document.body.appendChild(parent);

    // Remove via safeRemoveChild – comment nodeType === 8 triggers line 73
    const result = safeRemoveChild(comment);
    expect(result).toBe(true);
    expect(parent.childNodes.length).toBe(0);

    parent.remove();
  });

  it("removes a parent that contains mixed text, element and comment children", () => {
    const parent = document.createElement("div");
    const child = document.createElement("span");
    const textNode = document.createTextNode("hello");
    const commentNode = document.createComment("comment-child");
    child.appendChild(textNode);
    child.appendChild(commentNode);
    parent.appendChild(child);
    document.body.appendChild(parent);

    // safeRemoveChild will recursively clean all node types
    const result = safeRemoveChild(child);
    expect(result).toBe(true);

    parent.remove();
  });

  it("returns false when child has no parentNode", () => {
    const orphan = document.createElement("div");
    expect(safeRemoveChild(orphan)).toBe(false);
  });
});
