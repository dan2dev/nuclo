/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Targets uncovered line 70 in src/element/modifiers.ts: during hydration,
 * claimTextAfterMarker finds no text node after the marker (parser dropped an
 * empty text node) and createTextNode also fails — the claim returns null
 * without inserting anything.
 */
import { describe, it, expect, afterEach } from "vitest";
import { applyNodeModifier } from "../../src/element/modifiers";
import { startHydration, endHydration } from "../../src/hydration";
import { vi } from "vitest";

vi.mock("../../src/shared/dom", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../src/shared/dom")>();
  return {
    ...original,
    createTextNode: () => null,
  };
});

afterEach(() => {
  endHydration();
});

describe("claimTextAfterMarker with unavailable createTextNode", () => {
  it("static text: returns null without crashing when the text node cannot be created", () => {
    const parent = document.createElement("div") as unknown as ExpandedElement<"div">;
    (parent as unknown as Node).appendChild(document.createComment(" text-0 "));

    startHydration();
    const produced = applyNodeModifier(parent, "hello" as NodeMod<"div">, 0);
    endHydration();

    expect(produced).toBeNull();
    // The marker was claimed but no text node could be inserted.
    expect((parent as unknown as Element).childNodes.length).toBe(1);
  });

  it("reactive text: skips registration when the text node cannot be created", () => {
    const parent = document.createElement("div") as unknown as ExpandedElement<"div">;
    (parent as unknown as Node).appendChild(document.createComment(" text-0 "));

    startHydration();
    const produced = applyNodeModifier(parent, (() => "dynamic") as NodeModifierFn, 0);
    endHydration();

    expect(produced).toBeNull();
  });

  it("wrapTextNode keeps the marker but skips the null text node (no marker to claim)", () => {
    // Hydrating a parent with no text marker: the static text goes through
    // createStaticTextChild → wrapTextNode with a null text node — the marker
    // comment is emitted alone.
    const parent = document.createElement("div") as unknown as ExpandedElement<"div">;

    startHydration();
    const produced = applyNodeModifier(parent, "orphan" as NodeMod<"div">, 0);
    endHydration();

    expect(produced).not.toBeNull();
    expect(produced!.nodeType).toBe(11); // DocumentFragment with only the marker
    expect(produced!.childNodes.length).toBe(1);
    expect(produced!.firstChild!.nodeType).toBe(8);
  });
});

type NodeModifierFn = NodeMod<"div"> | NodeModFn<"div">;
