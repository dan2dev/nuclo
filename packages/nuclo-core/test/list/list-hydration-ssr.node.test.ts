/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
/**
 * Targets the non-browser branch of hydrateListRuntime (src/list/runtime.ts
 * line 527): hydrating in an SSR-like environment must skip the runtime
 * registration that only matters for client-side update() calls.
 *
 * A minimal synthetic host provides the firstChild/nextSibling pointers the
 * hydration cursor walks; no DOM mutations happen because the renderer
 * resolves to nothing and the claim cursor lands exactly on the end marker.
 */
import { describe, it, expect, afterEach } from "vitest";
import { startHydration, endHydration } from "../../src/hydration";
import { createListRuntime } from "../../src/list/runtime";

afterEach(() => {
  endHydration();
});

describe("list hydration outside the browser", () => {
  it("claims markers and skips registration when isBrowser is false", () => {
    const host: Record<string, unknown> = {};
    const endComment = {
      nodeType: 8,
      textContent: "list-end",
      nextSibling: null,
      parentNode: host,
    };
    const startComment = {
      nodeType: 8,
      textContent: "list-start-0",
      nextSibling: endComment,
      parentNode: host,
    };
    host.firstChild = startComment;

    startHydration();
    const runtime = createListRuntime(
      () => ["a"],
      () => null, // renderer resolves to nothing — no DOM writes needed
      host as unknown as ExpandedElement,
      0,
    );
    endHydration();

    expect(runtime.startMarker).toBe(startComment);
    expect(runtime.endMarker).toBe(endComment);
    expect(runtime.records).toEqual([]);
    expect(runtime.lastSyncedItems).toEqual(["a"]);
  });
});
