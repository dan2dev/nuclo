// algorithms.ts: the engine. Plain generators over a plain array; nothing here
// knows about the DOM or about nuclo. Each one mutates `items` in place and
// yields after every comparison or swap, so whoever drives it (a UI, a test)
// can stop between any two steps and look at the array as it is right now.

export interface Item {
  value: number;
  sorted: boolean; // set by the algorithm once the item is in its final place
}

export type Step =
  | { kind: "compare"; a: Item; b: Item }
  | { kind: "swap"; a: Item; b: Item };

export type Algorithm = (items: Item[]) => Generator<Step, void>;

function* greater(items: Item[], i: number, j: number): Generator<Step, boolean> {
  yield { kind: "compare", a: items[i], b: items[j] };
  return items[i].value > items[j].value;
}

function* swap(items: Item[], i: number, j: number): Generator<Step, void> {
  [items[i], items[j]] = [items[j], items[i]];
  yield { kind: "swap", a: items[i], b: items[j] };
}

export function* bubbleSort(items: Item[]): Generator<Step, void> {
  for (let end = items.length - 1; end > 0; end--) {
    for (let i = 0; i < end; i++) {
      if (yield* greater(items, i, i + 1)) yield* swap(items, i, i + 1);
    }
    items[end].sorted = true;
  }
  items[0].sorted = true;
}

export function* insertionSort(items: Item[]): Generator<Step, void> {
  for (let i = 1; i < items.length; i++) {
    for (let j = i; j > 0 && (yield* greater(items, j - 1, j)); j--) {
      yield* swap(items, j - 1, j);
    }
  }
  for (const item of items) item.sorted = true;
}

export function* selectionSort(items: Item[]): Generator<Step, void> {
  for (let i = 0; i < items.length; i++) {
    let min = i;
    for (let j = i + 1; j < items.length; j++) {
      if (yield* greater(items, min, j)) min = j;
    }
    if (min !== i) yield* swap(items, i, min);
    items[i].sorted = true;
  }
}

export function* quickSort(items: Item[], lo = 0, hi = items.length - 1): Generator<Step, void> {
  if (lo > hi) return;
  let p = lo; // everything before p is smaller than the pivot, items[hi]
  for (let i = lo; i < hi; i++) {
    if (yield* greater(items, hi, i)) {
      if (i !== p) yield* swap(items, i, p);
      p++;
    }
  }
  if (p !== hi) yield* swap(items, p, hi);
  items[p].sorted = true;
  yield* quickSort(items, lo, p - 1);
  yield* quickSort(items, p + 1, hi);
}

export const ALGORITHMS = {
  Bubble: bubbleSort,
  Insertion: insertionSort,
  Selection: selectionSort,
  Quick: quickSort,
} satisfies Record<string, Algorithm>;
