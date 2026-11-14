// Valid code with the constructs most likely to differ natively. It must compile and build on both targets.
import { type Node, div, list, render, setTimeout, span, update } from "../../src/index.ts";

interface Base {
  id: number;
}
interface Item extends Base {
  name: string;
  tags: string[];
  price?: number;
}
interface Other {
  id: number;
}

let items: Item[] = [];
let total = 0;
let maybe: Item | null = null;
let onDone: (() => void) | null = null;
const lookup: Record<string, number> = {};

function withDefault(x: number = 2, y?: string): string {
  return `${x}${y ?? ""}`;
}
function addTo(item: Item) {
  items.push(item);
}
function copied(): Item[] {
  const copy = items.slice(0);
  copy.push({ id: 1, name: "x", tags: [] });
  return copy;
}
function fresh(): Item[] {
  const out: Item[] = [];
  out.push({ id: 2, name: "y", tags: [] });
  return out;
}
function replace() {
  items = fresh();
  items.push({ id: 4, name: "w", tags: ["t"] });
}
function structural(): Other {
  const i: Item = { id: 3, name: "z", tags: [] };
  return { id: i.id };
}
function bang(): string {
  return items[0]!.name;
}
function chain(): number {
  return maybe?.tags.length ?? 0;
}
function callNullable() {
  if (onDone) onDone();
}
function localFn(): number {
  const twice = (n: number) => n * 2;
  return helper(3) + twice(2);
  function helper(n: number): number {
    return n + 1;
  }
}
function recur(): number {
  const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
  return fact(5);
}
function useMap(): number {
  lookup["a"] = 1;
  return (lookup["a"] ?? 0) + (lookup.b ?? 0);
}
function tick() {
  total += 0.5;
}
function half(n: number): number {
  return n / 2;
}
function renderItem(item: Item, i: number): Node {
  return div(`${half(i)}: ${item.name}`);
}
function nested(): number {
  const grid: number[][] = [[1, 2], [3]];
  const row = grid[0];
  if (row === undefined) return 0;
  return row[1] ?? 0;
}
function narrowedIndex(): string {
  const first = items[0];
  if (first === undefined) return "";
  return first.name;
}

const App = () =>
  div(
    span(() => `${withDefault()} ${withDefault(3, "a")} ${bang()} ${chain()} ${localFn()} ${recur()} ${useMap()} ${nested()}`),
    span(() => `${structural().id} ${narrowedIndex()} ${total}`),
    list(() => items, renderItem),
    {
      onClick: () => {
        addTo({ id: 9, name: "n", tags: [] });
        total += copied().length;
        replace();
        callNullable();
        setTimeout(tick, 10);
        update();
      },
    },
  );

render(App);
