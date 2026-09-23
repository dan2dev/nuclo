/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Edge cases for sync()'s pinned-only placement shortcut.
 *
 * After the keyed match, survivors that kept their index ("pinned") are an
 * increasing run on their own. When at most PINNED_ONLY_MAX_MOVES (8)
 * survivors are unpinned and at least PINNED_ONLY_MIN_PINNED (32) are pinned,
 * placement anchors on the pinned rows alone and skips the LIS pass; otherwise
 * it computes the LIS. Adjacent swaps make the two strategies observable: the
 * LIS keeps one row of each swapped pair in place (1 move per pair) while
 * pinned-only moves both (2 moves per pair). These tests pin both thresholds
 * exactly, and check the shortcut with fresh rows, duplicates, siblings
 * outside the list, null-rendering rows, neighbouring lists and reactive rows.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createListRuntime, sync } from "../../src/list/runtime";
import { render } from "../../src/render";
import { update } from "../../src/update/update";
import { list } from "../../src/list";
import "../../src/index";

declare const li: ExpandedElementBuilder<"li">;
declare const ul: ExpandedElementBuilder<"ul">;
declare const div: ExpandedElementBuilder<"div">;
declare const span: ExpandedElementBuilder<"span">;

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
const idsOf = (parent: Element) => Array.from(parent.children, (el) => Number(el.textContent));

/** Counts insertBefore calls on `parent`, split into row moves and fragment inserts. */
function trackInsertions(parent: Node, run: () => void): { moves: number; fragments: number } {
  const original = parent.insertBefore;
  const counts = { moves: 0, fragments: 0 };
  parent.insertBefore = function <T extends Node>(this: Node, node: T, ref: Node | null): T {
    if (node.nodeType === 11) counts.fragments++;
    else counts.moves++;
    return original.call(this, node, ref) as T;
  };
  try {
    run();
  } finally {
    parent.insertBefore = original;
  }
  return counts;
}

function swapAdjacent(items: Item[], positions: number[]): Item[] {
  const next = items.slice();
  for (const i of positions) [next[i], next[i + 1]] = [next[i + 1]!, next[i]!];
  return next;
}

function mountPlain(items: () => Item[]) {
  return createListRuntime(items, (item: Item) => li(String(item.id)), container as never, 0);
}

describe("pinned-only thresholds", () => {
  it("uses pinned-only placement at exactly 8 unpinned survivors (moves every one of them)", () => {
    let items = makeItems(200);
    const runtime = mountPlain(() => items);
    const before = Array.from(container.children);

    items = swapAdjacent(items, [10, 60, 120, 180]); // 8 unpinned, 164 pinned
    const { moves } = trackInsertions(container, () => sync(runtime));

    expect(moves).toBe(8);
    expect(idsOf(container)).toEqual(items.map((i) => i.id));
    expect(new Set(container.children)).toEqual(new Set(before));
  });

  it("falls back to the LIS at 9+ unpinned survivors (keeps one row of each pair in place)", () => {
    let items = makeItems(200);
    const runtime = mountPlain(() => items);

    items = swapAdjacent(items, [10, 50, 90, 130, 170]); // 10 unpinned
    const { moves } = trackInsertions(container, () => sync(runtime));

    expect(moves).toBe(5);
    expect(idsOf(container)).toEqual(items.map((i) => i.id));
  });

  it("requires at least 32 pinned rows in the window: 31 pinned uses the LIS", () => {
    let items = makeItems(100);
    const runtime = mountPlain(() => items);

    items = swapAdjacent(items, [10, 43]); // window [10, 45): 4 unpinned, 31 pinned
    const { moves } = trackInsertions(container, () => sync(runtime));

    expect(moves).toBe(2);
    expect(idsOf(container)).toEqual(items.map((i) => i.id));
  });

  it("switches to pinned-only at exactly 32 pinned rows", () => {
    let items = makeItems(100);
    const runtime = mountPlain(() => items);

    items = swapAdjacent(items, [10, 44]); // window [10, 46): 4 unpinned, 32 pinned
    const { moves } = trackInsertions(container, () => sync(runtime));

    expect(moves).toBe(4);
    expect(idsOf(container)).toEqual(items.map((i) => i.id));
  });

  it("never needs more moves than there are displaced rows, across random sparse swaps", () => {
    let seed = 99;
    const rand = (n: number) => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed % n;
    };
    let items = makeItems(300);
    const runtime = mountPlain(() => items);

    for (let round = 0; round < 60; round++) {
      const next = items.slice();
      const swaps = 1 + rand(4);
      for (let k = 0; k < swaps; k++) {
        const a = rand(next.length), b = rand(next.length);
        [next[a], next[b]] = [next[b]!, next[a]!];
      }
      const displaced = next.filter((item, i) => item !== items[i]).length;
      items = next;
      const { moves } = trackInsertions(container, () => sync(runtime));
      expect(moves).toBeLessThanOrEqual(displaced);
      expect(idsOf(container)).toEqual(items.map((i) => i.id));
    }
  });
});

describe("pinned-only placement — window shapes", () => {
  it("swaps the very first and very last rows (window spans the whole list, anchored on the end marker)", () => {
    let items = makeItems(1000);
    const runtime = mountPlain(() => items);
    const first = container.firstElementChild;
    const last = container.lastElementChild;

    const next = items.slice();
    [next[0], next[999]] = [next[999]!, next[0]!];
    items = next;
    const { moves } = trackInsertions(container, () => sync(runtime));

    expect(moves).toBe(2);
    expect(container.firstElementChild).toBe(last);
    expect(container.lastElementChild).toBe(first);
    expect(container.lastChild).toBe(runtime.endMarker);
    expect(idsOf(container)).toEqual(items.map((i) => i.id));
  });

  it("moves no existing row when the window only replaces items with fresh ones", () => {
    let items = makeItems(100);
    const runtime = mountPlain(() => items);
    const before = Array.from(container.children);

    const next = items.slice();
    next[10] = { id: 5010 };
    next[90] = { id: 5090 };
    items = next; // window [10, 91): 79 pinned, 0 unpinned survivors
    const { moves, fragments } = trackInsertions(container, () => sync(runtime));

    expect(moves).toBe(0);
    expect(fragments).toBe(2);
    expect(idsOf(container)).toEqual(items.map((i) => i.id));
    const after = Array.from(container.children);
    for (let i = 0; i < 100; i++) {
      if (i === 10 || i === 90) expect(after[i]).not.toBe(before[i]);
      else expect(after[i]).toBe(before[i]);
    }
  });

  it("keeps each occurrence of a duplicated item on its own node through a pinned-only swap", () => {
    const dup = { id: -1 };
    let items = makeItems(100);
    items[5] = dup;
    items[50] = dup;
    const runtime = mountPlain(() => items);
    const dupNodes = [container.children[5], container.children[50]];

    const next = items.slice();
    [next[20], next[80]] = [next[80]!, next[20]!];
    items = next;
    const { moves } = trackInsertions(container, () => sync(runtime));

    expect(moves).toBe(2);
    expect(idsOf(container)).toEqual(items.map((i) => i.id));
    expect([container.children[5], container.children[50]]).toEqual(dupNodes);
  });

  it("leaves siblings outside the list markers untouched", () => {
    let items = makeItems(100);
    const host = render(ul(li("0-before"), list(() => items, (item: Item) => li(String(item.id))), li("0-after")), container) as HTMLElement;
    const before = host.firstElementChild;
    const after = host.lastElementChild;

    const next = items.slice();
    [next[3], next[96]] = [next[96]!, next[3]!];
    items = next;
    const { moves } = trackInsertions(host, () => update());

    expect(moves).toBe(2);
    expect(host.firstElementChild).toBe(before);
    expect(host.lastElementChild).toBe(after);
    const rows = Array.from(host.children).slice(1, -1).map((el) => Number(el.textContent));
    expect(rows).toEqual(items.map((i) => i.id));
  });

  it("does not disturb a neighbouring list sharing the same parent", () => {
    let left = makeItems(100);
    const right = makeItems(40, 1000);
    const host = render(div(list(() => left, (item: Item) => span(String(item.id))), list(() => right, (item: Item) => span(String(item.id)))), container) as HTMLElement;
    const rightNodes = Array.from(host.children).slice(100);

    const next = left.slice();
    [next[1], next[98]] = [next[98]!, next[1]!];
    left = next;
    update();

    const all = Array.from(host.children);
    expect(all.slice(0, 100).map((el) => Number(el.textContent))).toEqual(left.map((i) => i.id));
    expect(all.slice(100)).toEqual(rightNodes);
    expect(all.slice(100).map((el) => Number(el.textContent))).toEqual(right.map((i) => i.id));
  });

  it("stays correct when some items render to nothing", () => {
    let items = makeItems(120);
    createListRuntime(
      () => items,
      (item: Item) => (item.id % 7 === 0 ? null : li(String(item.id))),
      container as never,
      0,
    );
    const visible = () => items.filter((i) => i.id % 7 !== 0).map((i) => i.id);
    expect(idsOf(container)).toEqual(visible());

    const next = items.slice();
    [next[2], next[117]] = [next[117]!, next[2]!];
    [next[40], next[41]] = [next[41]!, next[40]!];
    items = next;
    update();
    expect(idsOf(container)).toEqual(visible());
  });

  it("keeps converging when a pinned-only swap is followed by removal and appends", () => {
    let items = makeItems(100);
    const runtime = mountPlain(() => items);

    const swapped = items.slice();
    [swapped[5], swapped[95]] = [swapped[95]!, swapped[5]!];
    items = swapped;
    sync(runtime);

    items = items.filter((i) => i.id !== 95 && i.id !== 5);
    sync(runtime);
    items = [...items, ...makeItems(3, 500)];
    sync(runtime);
    items = [makeItems(1, 900)[0]!, ...items];
    sync(runtime);

    expect(idsOf(container)).toEqual(items.map((i) => i.id));
    expect(runtime.records.map((r) => r.item)).toEqual(items);
  });
});

describe("pinned-only placement — template rows", () => {
  it("flushes reactive leaves correctly on rows moved by a pinned-only swap", () => {
    interface Row { id: number; label: string }
    let selected: number | null = null;
    let rows: Row[] = Array.from({ length: 100 }, (_, i) => ({ id: i, label: `L${i}` }));
    const runtime = createListRuntime(
      () => rows,
      (row: Row) => li({ className: () => (selected === row.id ? "on" : "") }, () => row.label),
      container as never,
      0,
    );
    expect(runtime.template).toBeTruthy();

    const next = rows.slice();
    [next[10], next[90]] = [next[90]!, next[10]!];
    rows = next;
    const { moves } = trackInsertions(container, () => sync(runtime));
    expect(moves).toBe(2);

    selected = 90;
    rows[10]!.label = "moved-90";
    rows[90]!.label = "moved-10";
    update();
    const moved = container.children[10]!;
    expect(moved.className).toBe("on");
    expect(moved.textContent).toBe("moved-90");
    expect(container.children[90]!.textContent).toBe("moved-10");
    expect(container.children[90]!.className).toBe("");
  });
});
