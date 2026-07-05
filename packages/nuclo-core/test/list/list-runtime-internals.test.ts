/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Targets uncovered branches in src/list/runtime.ts by driving sync() with
 * hand-built runtimes:
 *  - line 9:      arraysEqual identity fast path (same array reference)
 *  - lines 108/217: bulkClearRecords bails when markers are not children of
 *                 the resolved parent → per-record removal fallback
 *  - lines 314-315: keyed diff with zero reuse falls back to per-record
 *                 removal when bulk clear is not possible
 */
import { describe, it, expect, beforeEach } from "vitest";
import { sync } from "../../src/list/runtime";
import type { ListRuntime } from "../../src/list/types";
import "../../src";

function makeRecordElement(text: string): ExpandedElement<"li"> {
  const el = document.createElement("li");
  el.textContent = text;
  return el as unknown as ExpandedElement<"li">;
}

describe("sync() — hand-built runtimes", () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    host = document.createElement("div");
    document.body.appendChild(host);
  });

  it("returns early when the provider returns the exact lastSyncedItems array", () => {
    const items = ["a"];
    const start = document.createComment("list-start-0");
    const end = document.createComment("list-end");
    host.append(start, end);

    let renderCalls = 0;
    const runtime: ListRuntime<string, "li"> = {
      itemsProvider: () => items,
      renderItem: (item) => {
        renderCalls++;
        return makeRecordElement(item);
      },
      startMarker: start,
      endMarker: end,
      records: [],
      host: host as unknown as ExpandedElement<"li">,
      lastSyncedItems: items,
    };

    sync(runtime);

    // Identity fast path: nothing rendered, nothing changed.
    expect(renderCalls).toBe(0);
    expect(host.querySelectorAll("li").length).toBe(0);
  });

  it("bulk clear skips records whose element was already detached", () => {
    const start = document.createComment("list-start-0");
    const end = document.createComment("list-end");
    const attached = makeRecordElement("attached");
    const detached = makeRecordElement("detached"); // never inserted
    host.append(start, attached as unknown as Node, end);

    const runtime: ListRuntime<string, "li"> = {
      itemsProvider: () => [],
      renderItem: (item) => makeRecordElement(item),
      startMarker: start,
      endMarker: end,
      records: [
        { item: "attached", element: attached },
        { item: "detached", element: detached },
      ],
      host: host as unknown as ExpandedElement<"li">,
      lastSyncedItems: ["attached", "detached"],
    };

    expect(() => sync(runtime)).not.toThrow();
    expect(host.querySelectorAll("li").length).toBe(0);
    expect(runtime.records).toEqual([]);
  });

  it("clears per-record when the start marker is detached (bulk clear impossible)", () => {
    // Markers never inserted into the host → parent falls back to host and
    // bulkClearRecords returns false.
    const start = document.createComment("list-start-0");
    const end = document.createComment("list-end");

    const el = makeRecordElement("a");
    host.appendChild(el as unknown as Node);

    const runtime: ListRuntime<string, "li"> = {
      itemsProvider: () => [],
      renderItem: (item) => makeRecordElement(item),
      startMarker: start,
      endMarker: end,
      records: [{ item: "a", element: el }],
      host: host as unknown as ExpandedElement<"li">,
      lastSyncedItems: ["a"],
    };

    sync(runtime);

    expect(host.querySelectorAll("li").length).toBe(0);
    expect(runtime.records).toEqual([]);
    expect(runtime.lastSyncedItems).toEqual([]);
  });

  it("keyed diff with zero reuse removes stale rows per-record when bulk clear is impossible", () => {
    // Start marker detached (bulk clear fails), end marker attached so the
    // placement phase still has a valid anchor.
    const start = document.createComment("list-start-0");
    const end = document.createComment("list-end");

    const elA = makeRecordElement("a");
    const elB = makeRecordElement("b");
    host.appendChild(elA as unknown as Node);
    host.appendChild(elB as unknown as Node);
    host.appendChild(end);

    const runtime: ListRuntime<string, "li"> = {
      itemsProvider: () => ["c", "d"],
      renderItem: (item) => makeRecordElement(item),
      startMarker: start,
      endMarker: end,
      records: [
        { item: "a", element: elA },
        { item: "b", element: elB },
      ],
      host: host as unknown as ExpandedElement<"li">,
      lastSyncedItems: ["a", "b"],
    };

    sync(runtime);

    const rows = Array.from(host.querySelectorAll("li")).map((n) => n.textContent);
    expect(rows).toEqual(["c", "d"]);
    expect(runtime.records.length).toBe(2);
  });
});
