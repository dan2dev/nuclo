/**
 * @vitest-environment jsdom
 *
 * Targets uncovered lines in src/core/modifierProcessor.ts:
 *
 *  Line 99  – createReactiveTextFragment: createDocumentFragment returns null
 *             (document unavailable) → throws "Failed to create document fragment"
 *  Line 111 – createStaticTextFragment: same condition
 *
 * Also covers the non-zero-arity NodeModFn branches (lines 74-81):
 *  - Function returning a primitive (line 76)
 *  - Function returning a Node (line 77)
 *  - Function returning an object with attributes (line 78-80)
 *
 * For the null-document test we temporarily null out globalThis.document.
 */

import { describe, it, expect, afterEach } from "vitest";
import { applyNodeModifier } from "../../src/core/modifierProcessor";

// ── helpers ───────────────────────────────────────────────────────────────────

function makeParent() {
  return document.createElement("div") as unknown as ExpandedElement<"div">;
}

let savedDocument: typeof globalThis.document | undefined;

function removeDocument() {
  savedDocument = globalThis.document;
  Object.defineProperty(globalThis, "document", {
    value: undefined,
    writable: true,
    configurable: true,
  });
}

function restoreDocument() {
  Object.defineProperty(globalThis, "document", {
    value: savedDocument,
    writable: true,
    configurable: true,
  });
  savedDocument = undefined;
}

afterEach(() => {
  if (savedDocument !== undefined) restoreDocument();
});

// ── Unit: null/undefined modifiers ───────────────────────────────────────────
describe("applyNodeModifier – null/undefined inputs", () => {
  it("returns null for null modifier", () => {
    const parent = makeParent();
    expect(
      applyNodeModifier(parent, null as unknown as NodeModifier<"div">, 0),
    ).toBeNull();
  });

  it("returns null for undefined modifier", () => {
    const parent = makeParent();
    expect(
      applyNodeModifier(parent, undefined as unknown as NodeModifier<"div">, 0),
    ).toBeNull();
  });
});

// ── Unit: non-zero-arity function modifiers ───────────────────────────────────
describe("applyNodeModifier – NodeModFn (non-zero-arity functions)", () => {
  it("returns a fragment when NodeModFn returns a primitive string (line 76)", () => {
    const parent = makeParent();
    const modifier = (_el: ExpandedElement<"div">, _i: number) => "hello";
    const result = applyNodeModifier(parent, modifier as NodeModFn<"div">, 0);
    // createStaticTextFragment returns a DocumentFragment
    expect(result).toBeTruthy();
    expect(result?.nodeType).toBe(Node.DOCUMENT_FRAGMENT_NODE);
  });

  it("returns a fragment when NodeModFn returns a number (line 76)", () => {
    const parent = makeParent();
    const modifier = () => 42;
    const result = applyNodeModifier(
      parent,
      modifier as unknown as NodeModFn<"div">,
      0,
    );
    expect(result?.nodeType).toBe(Node.DOCUMENT_FRAGMENT_NODE);
  });

  it("returns a fragment when NodeModFn returns boolean (line 76)", () => {
    const parent = makeParent();
    const modifier = () => true;
    const result = applyNodeModifier(
      parent,
      modifier as unknown as NodeModFn<"div">,
      0,
    );
    expect(result?.nodeType).toBe(Node.DOCUMENT_FRAGMENT_NODE);
  });

  it("returns the node when NodeModFn returns a DOM Node (line 77)", () => {
    const parent = makeParent();
    const childSpan = document.createElement("span");
    // Must have 2 params to be treated as non-zero-arity (isZeroArityFunction checks length)
    const modifier = (_el: ExpandedElement<"div">, _i: number) => childSpan;
    const result = applyNodeModifier(parent, modifier as NodeModFn<"div">, 0);
    expect(result).toBe(childSpan);
  });

  it("returns null and applies attributes when NodeModFn returns an object (line 78-80)", () => {
    const parent = makeParent();
    const modifier = (_el: ExpandedElement<"div">) => ({
      className: "my-class",
    });
    const result = applyNodeModifier(parent, modifier as NodeModFn<"div">, 0);
    expect(result).toBeNull();
    expect((parent as HTMLElement).className).toContain("my-class");
  });

  it("returns null when NodeModFn returns null", () => {
    const parent = makeParent();
    const modifier = () => null;
    const result = applyNodeModifier(parent, modifier as NodeModFn<"div">, 0);
    expect(result).toBeNull();
  });

  it("returns null when NodeModFn returns undefined", () => {
    const parent = makeParent();
    const modifier = () => undefined;
    const result = applyNodeModifier(
      parent,
      modifier as unknown as NodeModFn<"div">,
      0,
    );
    expect(result).toBeNull();
  });
});

// ── Unit: zero-arity function modifiers ─────────────────────────────────────
describe("applyNodeModifier – zero-arity reactive functions", () => {
  it("creates a reactive text fragment for a zero-arity primitive resolver", () => {
    const parent = makeParent();
    const resolver = () => "reactive text";
    const result = applyNodeModifier(parent, resolver as NodeModFn<"div">, 0);
    // Should return a DocumentFragment with a text node
    expect(result).toBeTruthy();
    expect(result?.nodeType).toBe(Node.DOCUMENT_FRAGMENT_NODE);
  });

  it("returns null for zero-arity function that returns null primitive", () => {
    const parent = makeParent();
    const resolver = () => null;
    const result = applyNodeModifier(
      parent,
      resolver as unknown as NodeModFn<"div">,
      0,
    );
    // null is primitive but null != null check → returns null
    expect(result).toBeNull();
  });

  it("handles zero-arity function that throws on first probe", () => {
    const parent = makeParent();
    const badResolver = () => {
      throw new Error("probe error");
    };
    expect(() => {
      applyNodeModifier(parent, badResolver as unknown as NodeModFn<"div">, 0);
    }).not.toThrow();
  });

  it("applies className attribute for cn() result objects", () => {
    const parent = makeParent();
    const cnResolver = () => ({ className: "dynamic-class" });
    applyNodeModifier(parent, cnResolver as unknown as NodeModFn<"div">, 0);
    // Parent should have className set
    expect((parent as HTMLElement).className).toContain("dynamic-class");
  });
});

// ── Unit: primitive modifier (non-function) ───────────────────────────────────
describe("applyNodeModifier – primitive modifiers", () => {
  it("creates a text fragment for string modifier", () => {
    const parent = makeParent();
    const result = applyNodeModifier(
      parent,
      "hello world" as unknown as NodeModFn<"div">,
      0,
    );
    expect(result?.nodeType).toBe(Node.DOCUMENT_FRAGMENT_NODE);
  });

  it("creates a text fragment for number modifier", () => {
    const parent = makeParent();
    const result = applyNodeModifier(
      parent,
      100 as unknown as NodeModFn<"div">,
      1,
    );
    expect(result?.nodeType).toBe(Node.DOCUMENT_FRAGMENT_NODE);
  });

  it("applies attributes for plain object modifier", () => {
    const parent = makeParent();
    applyNodeModifier(
      parent,
      { id: "test-id" } as unknown as NodeModFn<"div">,
      0,
    );
    expect((parent as HTMLElement).id).toBe("test-id");
  });
});

// ── Unit: createDocumentFragment null – throws (lines 99, 111) ────────────────
describe("applyNodeModifier – createDocumentFragment returns null (lines 99, 111)", () => {
  it("throws when document is unavailable and a text fragment is needed (line 99)", () => {
    removeDocument();
    const parent = {} as unknown as ExpandedElement<"div">;
    const resolver = () => "text";
    expect(() => {
      applyNodeModifier(parent, resolver as unknown as NodeModFn<"div">, 0);
    }).toThrow(/document/i);
    restoreDocument();
    savedDocument = undefined;
  });

  it("throws when document is unavailable and a static text fragment is needed (line 111)", () => {
    removeDocument();
    const parent = {} as unknown as ExpandedElement<"div">;
    expect(() => {
      applyNodeModifier(
        parent,
        "static text" as unknown as NodeModFn<"div">,
        0,
      );
    }).toThrow(/document/i);
    restoreDocument();
    savedDocument = undefined;
  });
});
