/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Targets uncovered line 122 in src/when/builder.ts: hydrating a truncated
 * when() block (no end marker) when createComment is also unavailable —
 * the builder bails out returning the claimed start marker.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { hydrate } from "../../src/render";
import { when } from "../../src/when";
import "../../src";

vi.mock("../../src/shared/dom", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../src/shared/dom")>();
  return {
    ...original,
    // The builder's own createComment import fails; createMarkerPair keeps its
    // internal, working reference for the fresh-render fallback used elsewhere.
    createComment: () => null,
  };
});

describe("when() hydration when the end marker cannot be recreated", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("returns the start marker without crashing", () => {
    container.innerHTML = "<div><!--when-start-0-b0--><span>stale</span></div>";

    const el = hydrate(div(when(() => true, span("fresh"))), container);

    expect(el).toBe(container.firstElementChild);
    // The start marker survived; hydration did not throw.
    const commentTexts = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 8)
      .map((n) => n.textContent ?? "");
    expect(commentTexts.some((t) => t.startsWith("when-start-"))).toBe(true);
  });
});
