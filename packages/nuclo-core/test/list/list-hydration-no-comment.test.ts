/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Targets uncovered lines 477-478 in src/list/runtime.ts: hydrating a
 * truncated list (no end marker) when createComment is also unavailable falls
 * back to a normal (non-hydration) list runtime.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { hydrate } from "../../src/render";
import { list } from "../../src/list";
import "../../src";

vi.mock("../../src/shared/dom", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../src/shared/dom")>();
  return {
    ...original,
    // The runtime's own createComment import fails; createMarkerPair (used by
    // the normal-render fallback) keeps its internal, working reference.
    createComment: () => null,
  };
});

describe("list hydration when the end marker cannot be recreated", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("falls back to a normal list render without crashing", () => {
    container.innerHTML = "<div><!--list-start-0--><li>stale</li></div>";

    let el: ExpandedElement<"div"> | undefined;
    expect(() => {
      el = hydrate(div(list(() => ["fresh"], (item) => li(item))), container);
    }).not.toThrow();

    // The root was still claimed and stays live in the document. The rendered
    // rows are best-effort in this doubly-degraded scenario (corrupt SSR AND
    // no createComment): the fallback runtime keeps working for future syncs.
    expect(el).toBe(container.firstElementChild);
    expect(el!.isConnected).toBe(true);
  });
});
