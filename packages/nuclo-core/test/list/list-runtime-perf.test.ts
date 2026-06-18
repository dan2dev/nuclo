/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createListRuntime, sync } from "../../src/list/runtime";

/**
 * These tests pin the performance characteristics of the keyed list diff:
 *  - swap / reorder move the minimum number of nodes (LIS-based placement),
 *  - clearing and replacing the whole list collapse the range in one operation,
 *  - pure appends touch existing rows zero times and batch the tail insert.
 *
 * They assert observable DOM-operation counts, not just final markup, so a
 * regression to O(n) moves/removals would fail here.
 */
describe("list runtime performance paths", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (container.parentNode) document.body.removeChild(container);
  });

  function makeItems(n: number): Array<{ id: number }> {
    const out: Array<{ id: number }> = new Array(n);
    for (let i = 0; i < n; i++) out[i] = { id: i };
    return out;
  }

  function renderRow(item: { id: number }): HTMLElement {
    const div = document.createElement("div");
    div.dataset.id = String(item.id);
    div.textContent = String(item.id);
    return div as unknown as HTMLElement;
  }

  function ids(): string[] {
    return Array.from(container.querySelectorAll("[data-id]")).map(
      (el) => (el as HTMLElement).dataset.id!,
    );
  }

  it("swaps two rows with exactly two moves and no removals", () => {
    const items = makeItems(50);
    const runtime = createListRuntime(() => items, renderRow, container as any, 0);

    const before = Array.from(container.querySelectorAll("[data-id]"));
    const insertSpy = vi.spyOn(container, "insertBefore");
    const removeSpy = vi.spyOn(container, "removeChild");

    // Swap positions 1 and 48 (the js-framework-benchmark "swap rows" op).
    const tmp = items[1];
    items[1] = items[48];
    items[48] = tmp;
    sync(runtime);

    expect(ids()[1]).toBe("48");
    expect(ids()[48]).toBe("1");
    // Only the two swapped nodes move; the rest stay on the LIS.
    expect(insertSpy).toHaveBeenCalledTimes(2);
    expect(removeSpy).not.toHaveBeenCalled();

    // Every surviving node keeps its identity.
    const after = Array.from(container.querySelectorAll("[data-id]"));
    expect(new Set(after)).toEqual(new Set(before));
  });

  it("reverse reorders with at most n-1 moves and preserves identity", () => {
    const items = makeItems(20);
    const runtime = createListRuntime(() => items, renderRow, container as any, 0);
    const before = Array.from(container.querySelectorAll("[data-id]"));

    const insertSpy = vi.spyOn(container, "insertBefore");
    items.reverse();
    sync(runtime);

    expect(ids()).toEqual(before.map((el) => (el as HTMLElement).dataset.id!).reverse());
    // A full reverse keeps exactly one element fixed (the LIS has length 1).
    expect(insertSpy.mock.calls.length).toBeLessThanOrEqual(items.length - 1);
    expect(new Set(container.querySelectorAll("[data-id]"))).toEqual(new Set(before));
  });

  it("clears all rows via a single range delete", () => {
    let items = makeItems(100);
    const runtime = createListRuntime(() => items, renderRow, container as any, 0);

    const rangeSpy = vi.spyOn(document, "createRange");
    const removeSpy = vi.spyOn(container, "removeChild");

    items = [];
    (runtime as any).itemsProvider = () => items;
    sync(runtime);

    expect(container.querySelectorAll("[data-id]").length).toBe(0);
    // Markers remain; rows are gone.
    expect(container.contains(runtime.startMarker)).toBe(true);
    expect(container.contains(runtime.endMarker)).toBe(true);
    // Bulk clear: range used, no per-node removeChild on the container.
    expect(rangeSpy).toHaveBeenCalled();
    expect(removeSpy).not.toHaveBeenCalled();
    expect(runtime.records.length).toBe(0);
  });

  it("replaces all rows with fresh nodes using bulk clear + one fragment insert", () => {
    let items = makeItems(100);
    const runtime = createListRuntime(() => items, renderRow, container as any, 0);
    const original = new Set(container.querySelectorAll("[data-id]"));

    const rangeSpy = vi.spyOn(document, "createRange");
    const insertSpy = vi.spyOn(container, "insertBefore");

    // All-new object identities → full replace.
    items = makeItems(100).map((it) => ({ id: it.id + 1000 }));
    (runtime as any).itemsProvider = () => items;
    sync(runtime);

    expect(ids()).toEqual(items.map((it) => String(it.id)));
    // None of the original nodes survive.
    const replaced = Array.from(container.querySelectorAll("[data-id]"));
    for (const node of replaced) expect(original.has(node)).toBe(false);
    // Bulk remove (range) + a single batched fragment insertion.
    expect(rangeSpy).toHaveBeenCalled();
    expect(insertSpy).toHaveBeenCalledTimes(1);
  });

  it("appends to a large list without touching existing rows", () => {
    const items = makeItems(100);
    const runtime = createListRuntime(() => items, renderRow, container as any, 0);
    const before = Array.from(container.querySelectorAll("[data-id]"));

    const insertSpy = vi.spyOn(container, "insertBefore");
    const removeSpy = vi.spyOn(container, "removeChild");

    for (let i = 100; i < 200; i++) items.push({ id: i });
    sync(runtime);

    expect(container.querySelectorAll("[data-id]").length).toBe(200);
    expect(ids().slice(0, 100)).toEqual(before.map((el) => (el as HTMLElement).dataset.id!));
    // Existing nodes are reused (same instances), tail batched into one insert.
    const after = Array.from(container.querySelectorAll("[data-id]")).slice(0, 100);
    expect(after).toEqual(before);
    expect(insertSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).not.toHaveBeenCalled();
  });

  it("prepends rows by moving only the survivors that must shift", () => {
    const items = makeItems(10);
    const runtime = createListRuntime(() => items, renderRow, container as any, 0);
    const before = Array.from(container.querySelectorAll("[data-id]"));

    // Insert a new item at the front.
    items.unshift({ id: 999 });
    sync(runtime);

    expect(ids()[0]).toBe("999");
    expect(ids().slice(1)).toEqual(before.map((el) => (el as HTMLElement).dataset.id!));
    // The 10 original nodes are still the same instances, just shifted.
    const after = Array.from(container.querySelectorAll("[data-id]")).slice(1);
    expect(after).toEqual(before);
  });

  it("removes interior rows while keeping neighbours in place", () => {
    const items = makeItems(10);
    const runtime = createListRuntime(() => items, renderRow, container as any, 0);
    const before = Array.from(container.querySelectorAll("[data-id]"));

    // Remove ids 3,4,5.
    const kept = items.filter((it) => it.id < 3 || it.id > 5);
    items.length = 0;
    items.push(...kept);
    sync(runtime);

    expect(ids()).toEqual(["0", "1", "2", "6", "7", "8", "9"]);
    // Surviving nodes keep their identity.
    const survivors = Array.from(container.querySelectorAll("[data-id]"));
    const expected = before.filter((el) => {
      const id = Number((el as HTMLElement).dataset.id);
      return id < 3 || id > 5;
    });
    expect(survivors).toEqual(expected);
  });
});
