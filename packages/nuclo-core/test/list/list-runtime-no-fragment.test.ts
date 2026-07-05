/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Targets uncovered lines 186-187 and 358-362 in src/list/runtime.ts: when
 * createDocumentFragment is unavailable, buildAndInsert and the keyed-diff
 * placement phase fall back to direct per-node insertBefore calls.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { sync } from "../../src/list/runtime";
import type { ListRuntime } from "../../src/list/types";

vi.mock("../../src/shared/dom", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../src/shared/dom")>();
  return {
    ...original,
    createDocumentFragment: () => null,
  };
});

function liFor(text: string): ExpandedElement<"li"> {
  const el = document.createElement("li");
  el.textContent = text;
  return el as unknown as ExpandedElement<"li">;
}

function makeRuntime(
  host: HTMLElement,
  provider: () => readonly string[],
): ListRuntime<string, "li"> {
  const start = document.createComment("list-start-0");
  const end = document.createComment("list-end");
  host.append(start, end);
  return {
    itemsProvider: provider,
    renderItem: (item) => liFor(item),
    startMarker: start,
    endMarker: end,
    records: [],
    host: host as unknown as ExpandedElement<"li">,
    lastSyncedItems: [],
  };
}

describe("list runtime without DocumentFragment support", () => {
  let host: HTMLDivElement;
  let items: string[];
  let runtime: ListRuntime<string, "li">;

  beforeEach(() => {
    document.body.innerHTML = "";
    host = document.createElement("div");
    document.body.appendChild(host);
    items = ["a", "b"];
    runtime = makeRuntime(host, () => items);
    sync(runtime);
  });

  it("first render inserts each row directly before the anchor", () => {
    const rows = Array.from(host.querySelectorAll("li")).map((n) => n.textContent);
    expect(rows).toEqual(["a", "b"]);
  });

  it("keyed diff inserts fresh rows directly, in order, before the anchor", () => {
    // 'b' is reused, 'c' and 'd' are fresh — exercises the no-fragment branch
    // of the backwards placement phase.
    items = ["b", "c", "d"];
    sync(runtime);

    const rows = Array.from(host.querySelectorAll("li")).map((n) => n.textContent);
    expect(rows).toEqual(["b", "c", "d"]);
  });
});
