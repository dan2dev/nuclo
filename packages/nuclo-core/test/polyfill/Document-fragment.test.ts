/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Targets uncovered lines 15-20 in src/polyfill/Document.ts: the
 * SSRDocumentFragment firstChild/lastChild getters (empty and populated).
 */
import { describe, it, expect } from "vitest";
import { NucloDocument } from "../../src/polyfill/Document";
import { NucloText } from "../../src/polyfill/Text";

describe("SSRDocumentFragment firstChild/lastChild", () => {
  it("returns null on an empty fragment", () => {
    const doc = new NucloDocument();
    const fragment = doc.createDocumentFragment();
    expect(fragment.firstChild).toBeNull();
    expect(fragment.lastChild).toBeNull();
  });

  it("returns the first and last child of a populated fragment", () => {
    const doc = new NucloDocument();
    const fragment = doc.createDocumentFragment();
    const a = new NucloText("a") as unknown as Node;
    const b = new NucloText("b") as unknown as Node;
    fragment.appendChild(a);
    fragment.appendChild(b);

    expect(fragment.firstChild).toBe(a);
    expect(fragment.lastChild).toBe(b);
  });
});

describe("SSRDocumentFragment removeChild/replaceChild misses", () => {
  it("removeChild of a non-child is a no-op that still detaches the node", () => {
    const doc = new NucloDocument();
    const fragment = doc.createDocumentFragment();
    const inside = new NucloText("in") as unknown as Node;
    const orphan = new NucloText("out") as unknown as Node;
    fragment.appendChild(inside);

    expect(() => fragment.removeChild(orphan)).not.toThrow();
    expect(fragment.childNodes.length).toBe(1);
    expect(fragment.firstChild).toBe(inside);
  });

  it("replaceChild with a missing oldChild does not alter the child list", () => {
    const doc = new NucloDocument();
    const fragment = doc.createDocumentFragment();
    const inside = new NucloText("in") as unknown as Node;
    const ghost = new NucloText("ghost") as unknown as Node;
    const replacement = new NucloText("new") as unknown as Node;
    fragment.appendChild(inside);

    expect(() => fragment.replaceChild(replacement, ghost)).not.toThrow();
    expect(fragment.childNodes.length).toBe(1);
    expect(fragment.firstChild).toBe(inside);
  });
});
