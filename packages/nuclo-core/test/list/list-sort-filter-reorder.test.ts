/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Behavioral contract of the keyed list: every array item owns exactly one DOM
 * element, created the first time the item enters the list and reused for as
 * long as the item stays in it.
 *
 *  - Sorting / reordering must never rebuild a row: no renderItem call, no
 *    document.createElement, same node instances — only moves.
 *  - Filtering removes exactly the dropped items' nodes; survivors keep theirs.
 *  - An item that leaves and re-enters the list gets a fresh element (its old
 *    record was destroyed with it).
 *  - Keying is by item reference (===): value-equal but distinct objects keep
 *    separate nodes, duplicate references keep one node per occurrence.
 *
 * Every node is stamped with a monotonically increasing `data-birth` token at
 * creation, so "was any element recreated?" reduces to comparing birth-token
 * multisets before and after an operation.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { list } from "../../src/list";
import { updateListRuntimes } from "../../src/list/runtime";

interface Row {
  id: number;
  label: string;
}

const row = (id: number, label = `label-${id}`): Row => ({ id, label });

let container: HTMLElement;
let birth: number;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  birth = 0;
});

afterEach(() => {
  vi.restoreAllMocks();
  container.remove();
});

/** Mounts a list of Rows and records every renderItem invocation. */
function mount(provider: () => readonly Row[]) {
  const calls: Array<{ id: number; index: number }> = [];
  const listFn = list(provider, (item: Row, index: number) => {
    calls.push({ id: item.id, index });
    const el = document.createElement("div");
    el.dataset.id = String(item.id);
    el.dataset.birth = String(birth++);
    el.textContent = item.label;
    return el;
  });
  listFn(container, 0);
  return calls;
}

function domNodes(): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>("[data-id]"));
}

function idOrder(): number[] {
  return domNodes().map((n) => Number(n.dataset.id));
}

function birthOrder(): string[] {
  return domNodes().map((n) => n.dataset.birth!);
}

/** id → node instance; only valid while ids are unique. */
function nodesById(): Map<number, HTMLElement> {
  const map = new Map<number, HTMLElement>();
  for (const node of domNodes()) map.set(Number(node.dataset.id), node);
  return map;
}

/** Rendered rows mirror the items array, position by position. */
function expectDomMatches(items: readonly Row[]): void {
  const nodes = domNodes();
  expect(nodes.length).toBe(items.length);
  for (let i = 0; i < items.length; i++) {
    expect(nodes[i].dataset.id).toBe(String(items[i].id));
    expect(nodes[i].textContent).toBe(items[i].label);
  }
}

/** Deterministic Fisher–Yates shuffle (LCG-seeded) so failures reproduce. */
function shuffled(seed: number, source: readonly Row[]): Row[] {
  const out = source.slice();
  let s = seed >>> 0;
  const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

describe("sorting reuses the item's DOM element", () => {
  it("sorts ascending → descending → ascending without creating a single element", () => {
    let items = [row(3), row(1), row(4), row(2), row(5)];
    const calls = mount(() => items);
    expect(calls).toHaveLength(5);
    const original = nodesById();

    // No document.createElement (rows, text, anything) may happen from here on.
    const createSpy = vi.spyOn(document, "createElement");

    items = items.slice().sort((a, b) => a.id - b.id);
    updateListRuntimes();
    expectDomMatches(items);
    expect(idOrder()).toEqual([1, 2, 3, 4, 5]);
    for (const [id, node] of nodesById()) expect(node).toBe(original.get(id));

    items = items.slice().sort((a, b) => b.id - a.id);
    updateListRuntimes();
    expectDomMatches(items);
    expect(idOrder()).toEqual([5, 4, 3, 2, 1]);
    for (const [id, node] of nodesById()) expect(node).toBe(original.get(id));

    items = items.slice().sort((a, b) => a.id - b.id);
    updateListRuntimes();
    expect(idOrder()).toEqual([1, 2, 3, 4, 5]);
    for (const [id, node] of nodesById()) expect(node).toBe(original.get(id));

    expect(createSpy).not.toHaveBeenCalled();
    expect(calls).toHaveLength(5); // renderItem never ran again
  });

  it("sorts by a different field than the one displayed, reusing every node", () => {
    // Label order is intentionally the reverse of id order.
    let items = [row(1, "z"), row(2, "y"), row(3, "x")];
    const calls = mount(() => items);
    const original = nodesById();

    items = items.slice().sort((a, b) => a.label.localeCompare(b.label));
    updateListRuntimes();

    expect(idOrder()).toEqual([3, 2, 1]);
    expectDomMatches(items);
    for (const [id, node] of nodesById()) expect(node).toBe(original.get(id));
    expect(calls).toHaveLength(3);
  });

  it("treats a sort that changes nothing as a no-op (fresh array, same order)", () => {
    let items = [row(1), row(2), row(3)];
    mount(() => items);

    const insertSpy = vi.spyOn(container, "insertBefore");
    const removeSpy = vi.spyOn(container, "removeChild");
    const createSpy = vi.spyOn(document, "createElement");

    items = items.slice().sort((a, b) => a.id - b.id); // new array, identical order
    updateListRuntimes();

    expect(idOrder()).toEqual([1, 2, 3]);
    expect(insertSpy).not.toHaveBeenCalled();
    expect(removeSpy).not.toHaveBeenCalled();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("sorts a list containing duplicate references, keeping one node per occurrence", () => {
    const a = row(1);
    const b = row(2);
    let items = [b, a, b]; // births: b→0, a→1, b→2
    const calls = mount(() => items);
    expect(birthOrder()).toEqual(["0", "1", "2"]);

    items = items.slice().sort((x, y) => x.id - y.id); // [a, b, b]
    updateListRuntimes();

    expect(idOrder()).toEqual([1, 2, 2]);
    // Same three nodes, whatever the duplicate copies' final arrangement.
    expect(birthOrder().slice().sort()).toEqual(["0", "1", "2"]);
    expect(calls).toHaveLength(3);
  });
});

describe("filtering removes exactly the dropped items' nodes", () => {
  it("keeps the surviving items' instances and renders nothing new", () => {
    const all = [row(1), row(2), row(3), row(4), row(5), row(6)];
    let items: Row[] = all;
    const calls = mount(() => items);
    const original = nodesById();

    items = all.filter((r) => r.id % 2 === 1);
    updateListRuntimes();

    expect(idOrder()).toEqual([1, 3, 5]);
    for (const [id, node] of nodesById()) expect(node).toBe(original.get(id));
    expect(container.querySelector('[data-id="2"]')).toBeNull();
    expect(container.querySelector('[data-id="4"]')).toBeNull();
    expect(container.querySelector('[data-id="6"]')).toBeNull();
    expect(calls).toHaveLength(6);
  });

  it("filters progressively down to one row with stable instances at every step", () => {
    const all = [row(1), row(2), row(3), row(4)];
    let items: Row[] = all;
    const calls = mount(() => items);
    const original = nodesById();

    for (const keep of [3, 2, 1]) {
      items = all.slice(0, keep);
      updateListRuntimes();
      expect(idOrder()).toEqual(all.slice(0, keep).map((r) => r.id));
      for (const [id, node] of nodesById()) expect(node).toBe(original.get(id));
    }
    expect(calls).toHaveLength(4);
  });

  it("re-renders an item that left the list and came back (fresh element, same neighbours)", () => {
    const all = [row(1), row(2), row(3)];
    let items: Row[] = all;
    const calls = mount(() => items);
    const original = nodesById();
    const removedBirth = original.get(2)!.dataset.birth;

    items = all.filter((r) => r.id !== 2);
    updateListRuntimes();
    expect(idOrder()).toEqual([1, 3]);

    items = all; // same object for id 2 returns
    updateListRuntimes();

    expect(idOrder()).toEqual([1, 2, 3]);
    const restored = nodesById();
    expect(restored.get(1)).toBe(original.get(1));
    expect(restored.get(3)).toBe(original.get(3));
    // The removed row's element was destroyed with its record: same item, new node.
    expect(restored.get(2)).not.toBe(original.get(2));
    expect(restored.get(2)!.dataset.birth).not.toBe(removedBirth);
    // Exactly one extra render, for the re-entering item at its position.
    expect(calls).toHaveLength(4);
    expect(calls[3]).toEqual({ id: 2, index: 1 });
  });

  it("filter-to-empty then restore rebuilds all rows from scratch", () => {
    const all = [row(1), row(2), row(3)];
    let items: Row[] = all;
    const calls = mount(() => items);

    items = [];
    updateListRuntimes();
    expect(domNodes()).toHaveLength(0);

    items = all;
    updateListRuntimes();

    expectDomMatches(all);
    // Clearing destroyed the records, so restoring renders three new elements.
    expect(calls).toHaveLength(6);
    expect(calls.slice(3)).toEqual([
      { id: 1, index: 0 },
      { id: 2, index: 1 },
      { id: 3, index: 2 },
    ]);
    for (const token of birthOrder()) expect(Number(token)).toBeGreaterThanOrEqual(3);
  });

  it("filtering an item out removes every duplicate occurrence's node", () => {
    const a = row(1);
    const b = row(2);
    let items = [a, b, a];
    mount(() => items);
    expect(idOrder()).toEqual([1, 2, 1]);

    items = items.filter((r) => r !== a);
    updateListRuntimes();

    expect(idOrder()).toEqual([2]);
    expect(container.querySelectorAll('[data-id="1"]')).toHaveLength(0);
  });
});

describe("arbitrary reordering only moves nodes", () => {
  it("rotates the list (first → last) repeatedly with a fixed node set", () => {
    let items = [row(1), row(2), row(3), row(4)];
    const calls = mount(() => items);
    const original = new Set(domNodes());

    for (const expected of [[2, 3, 4, 1], [3, 4, 1, 2], [4, 1, 2, 3], [1, 2, 3, 4]]) {
      items = items.slice(1).concat(items[0]);
      updateListRuntimes();
      expect(idOrder()).toEqual(expected);
      expect(new Set(domNodes())).toEqual(original);
    }
    expect(calls).toHaveLength(4);
  });

  it("moves a middle item to the front and back again", () => {
    let items = [row(1), row(2), row(3), row(4), row(5)];
    const calls = mount(() => items);
    const original = nodesById();

    items = [items[3], ...items.slice(0, 3), items[4]];
    updateListRuntimes();
    expect(idOrder()).toEqual([4, 1, 2, 3, 5]);
    for (const [id, node] of nodesById()) expect(node).toBe(original.get(id));

    items = [items[1], items[2], items[3], items[0], items[4]];
    updateListRuntimes();
    expect(idOrder()).toEqual([1, 2, 3, 4, 5]);
    for (const [id, node] of nodesById()) expect(node).toBe(original.get(id));
    expect(calls).toHaveLength(5);
  });

  it("interleaves two halves without recreating rows", () => {
    let items = Array.from({ length: 10 }, (_, i) => row(i));
    const calls = mount(() => items);
    const original = nodesById();

    const front = items.slice(0, 5);
    const back = items.slice(5);
    items = front.flatMap((r, i) => [r, back[i]]);
    updateListRuntimes();

    expect(idOrder()).toEqual([0, 5, 1, 6, 2, 7, 3, 8, 4, 9]);
    for (const [id, node] of nodesById()) expect(node).toBe(original.get(id));
    expect(calls).toHaveLength(10);
  });

  it("survives repeated seeded shuffles of 50 rows: same nodes, order always mirrors the array", () => {
    let items = Array.from({ length: 50 }, (_, i) => row(i));
    const calls = mount(() => items);
    const original = nodesById();
    const createSpy = vi.spyOn(document, "createElement");

    for (const seed of [11, 23, 37, 51, 73]) {
      items = shuffled(seed, items);
      updateListRuntimes();
      expectDomMatches(items);
      for (const [id, node] of nodesById()) expect(node).toBe(original.get(id));
    }

    expect(createSpy).not.toHaveBeenCalled();
    expect(calls).toHaveLength(50);
  });

  it("reorders and appends in one update: survivors move, only the tail is rendered", () => {
    let items = [row(3), row(1), row(2)];
    const calls = mount(() => items);
    const original = nodesById();

    items = [...items].sort((a, b) => a.id - b.id).concat(row(4), row(5));
    updateListRuntimes();

    expect(idOrder()).toEqual([1, 2, 3, 4, 5]);
    for (const id of [1, 2, 3]) expect(nodesById().get(id)).toBe(original.get(id));
    expect(calls).toHaveLength(5);
    // Each fresh row renders exactly once with its final index (the order the
    // two renders happen in is an implementation detail).
    expect(calls.slice(3).sort((a, b) => a.index - b.index)).toEqual([
      { id: 4, index: 3 },
      { id: 5, index: 4 },
    ]);
  });

  it("filters, sorts and inserts in a single update", () => {
    const all = Array.from({ length: 8 }, (_, i) => row(i + 1));
    let items: Row[] = all;
    const calls = mount(() => items);
    const original = nodesById();
    const fresh = row(99);

    // Drop evens, sort descending, splice a new row into the middle.
    const next = all.filter((r) => r.id % 2 === 1).sort((a, b) => b.id - a.id);
    next.splice(2, 0, fresh);
    items = next;
    updateListRuntimes();

    expect(idOrder()).toEqual([7, 5, 99, 3, 1]);
    expectDomMatches(items);
    for (const id of [1, 3, 5, 7]) expect(nodesById().get(id)).toBe(original.get(id));
    expect(calls).toHaveLength(9);
    expect(calls[8]).toEqual({ id: 99, index: 2 });
  });
});

describe("the element belongs to the item reference, not its value", () => {
  it("value-equal but distinct objects keep their own nodes through a swap", () => {
    const first = row(1, "same");
    const second = row(1, "same"); // equal by value, different reference
    let items = [first, second]; // births: first→0, second→1
    const calls = mount(() => items);

    items = [second, first];
    updateListRuntimes();

    // Node identity follows the reference: the order of birth tokens flips.
    expect(birthOrder()).toEqual(["1", "0"]);
    expect(calls).toHaveLength(2);
  });

  it("keeps each node bound to its item across a null-rendered sibling", () => {
    const rows = [row(1), row(2), row(3)];
    let items = rows;
    let renders = 0;
    const listFn = list(
      () => items,
      (item: Row) => {
        renders++;
        if (item.id === 2) return null; // this item never gets an element
        const el = document.createElement("div");
        el.dataset.id = String(item.id);
        return el;
      },
    );
    listFn(container, 0);
    expect(idOrder()).toEqual([1, 3]);
    const [node1, node3] = domNodes();
    renders = 0;

    items = [rows[2], rows[0], rows[1]]; // [3, 1, 2-null]
    updateListRuntimes();

    expect(idOrder()).toEqual([3, 1]);
    const [movedNode3, movedNode1] = domNodes();
    expect(movedNode3).toBe(node3);
    expect(movedNode1).toBe(node1);
    // Only the null-rendered item may be re-attempted; real rows never re-render.
    expect(renders).toBeLessThanOrEqual(1);
  });
});
