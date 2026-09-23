/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * sync()'s placement phase anchors on survivors that are already correctly
 * ordered and moves only the rest. When nearly every survivor kept its index
 * (e.g. swapping two rows of a large list), it anchors on those pinned rows
 * alone and skips the LIS pass. These tests pin:
 *  - the shortcut moves only the displaced rows (one insertBefore each),
 *  - rows keep their identity (no rebuild) and their handlers,
 *  - a randomized mix of swaps, moves, inserts and removals always converges
 *    on the item order, exercising both the pinned-only and LIS paths.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createListRuntime, sync } from "../../src/list/runtime";
import "../../src/index";

declare const li: ExpandedElementBuilder<"li">;

interface Item {
  id: number;
}

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement("ul");
  document.body.appendChild(container);
});

afterEach(() => {
  container.remove();
});

const makeItems = (n: number, from = 0): Item[] => Array.from({ length: n }, (_, i) => ({ id: from + i }));
const ids = () => Array.from(container.children, (el) => Number(el.textContent));

function countInsertions(run: () => void): number {
  const original = container.insertBefore;
  let calls = 0;
  container.insertBefore = function <T extends Node>(this: HTMLElement, node: T, ref: Node | null): T {
    calls++;
    return original.call(this, node, ref) as T;
  };
  try {
    run();
  } finally {
    container.insertBefore = original;
  }
  return calls;
}

describe("list placement anchored on pinned rows", () => {
  it("swaps two rows of a large list with exactly two moves and no rebuilds", () => {
    let items = makeItems(1000);
    const clicks: number[] = [];
    const runtime = createListRuntime(
      () => items,
      (item: Item) => li({ onClick: () => { clicks.push(item.id); } }, String(item.id)),
      container as never,
      0,
    );
    const before = Array.from(container.children);

    const next = items.slice();
    [next[1], next[998]] = [next[998]!, next[1]!];
    items = next;
    const moves = countInsertions(() => sync(runtime));

    expect(moves).toBe(2);
    expect(ids()).toEqual(items.map((item) => item.id));
    const after = Array.from(container.children);
    expect(after[1]).toBe(before[998]);
    expect(after[998]).toBe(before[1]);
    expect(new Set(after)).toEqual(new Set(before));

    (after[1] as HTMLElement).click();
    (after[998] as HTMLElement).click();
    expect(clicks).toEqual([998, 1]);
  });

  it("moves only the displaced rows when a few survivors change places", () => {
    let items = makeItems(200);
    const runtime = createListRuntime(() => items, (item: Item) => li(String(item.id)), container as never, 0);

    // Three rows rotate among themselves; every other row keeps its index.
    const next = items.slice();
    [next[10], next[100], next[150]] = [next[150]!, next[10]!, next[100]!];
    items = next;
    const moves = countInsertions(() => sync(runtime));

    expect(moves).toBeLessThanOrEqual(3);
    expect(ids()).toEqual(items.map((item) => item.id));
  });

  it("combines pinned-only placement with fresh rows and removals", () => {
    let items = makeItems(100);
    const runtime = createListRuntime(() => items, (item: Item) => li(String(item.id)), container as never, 0);

    const next = items.slice();
    [next[5], next[90]] = [next[90]!, next[5]!];
    next[40] = { id: 5000 }; // replace one row with a fresh item
    next.splice(60, 1); // drop one row (shifts the tail — the suffix trims it)
    items = next;
    sync(runtime);

    expect(ids()).toEqual(items.map((item) => item.id));
    expect(container.children.length).toBe(items.length);
  });

  it("converges on the item order across randomized reorders", () => {
    // Deterministic LCG so a failure is reproducible.
    let seed = 12345;
    const rand = (n: number) => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed % n;
    };
    let nextId = 10000;
    let items = makeItems(120);
    const runtime = createListRuntime(() => items, (item: Item) => li(String(item.id)), container as never, 0);

    for (let round = 0; round < 250; round++) {
      const next = items.slice();
      const ops = 1 + rand(4);
      for (let k = 0; k < ops; k++) {
        const kind = rand(5);
        if (kind === 0 && next.length > 1) {
          const a = rand(next.length), b = rand(next.length);
          [next[a], next[b]] = [next[b]!, next[a]!];
        } else if (kind === 1 && next.length > 1) {
          const [moved] = next.splice(rand(next.length), 1);
          next.splice(rand(next.length + 1), 0, moved!);
        } else if (kind === 2) {
          next.splice(rand(next.length + 1), 0, { id: nextId++ });
        } else if (kind === 3 && next.length > 0) {
          next.splice(rand(next.length), 1);
        } else if (next.length > 2) {
          // reverse a small window
          const start = rand(next.length - 1);
          const end = Math.min(next.length, start + 2 + rand(12));
          next.splice(start, end - start, ...next.slice(start, end).reverse());
        }
      }
      items = next;
      sync(runtime);
      expect(ids()).toEqual(items.map((item) => item.id));
    }
    expect(container.contains(runtime.startMarker)).toBe(true);
    expect(container.contains(runtime.endMarker)).toBe(true);
  });
});
