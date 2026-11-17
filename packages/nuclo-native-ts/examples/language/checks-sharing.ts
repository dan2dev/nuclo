// Arrays and maps are shared references, as in JavaScript: every holder (variable, parameter, field, closure,
// destructured binding, element, captured local) sees a change made through any other, with no copies.

interface ShBag {
  items: number[];
  tags: Record<string, string>;
}

class ShHolder {
  constructor(readonly rows: number[][]) {}
  addTo(row: number[], x: number): void {
    row.push(x);
  }
  first(): number[] {
    return this.rows[0]!;
  }
}

function shPush(xs: number[], x: number): number[] {
  xs.push(x);
  return xs;
}

function shPadAll(rows: number[][]): void {
  for (const row of rows) row.push(0);
}

function shSet(m: Record<string, number>, k: string, v: number): void {
  m[k] = v;
}

function shJoin(xs: number[]): string {
  return xs.join(",");
}

export function shBindings(): string[] {
  const out: string[] = [];
  const a: number[] = [1, 2];
  const b = a;
  b.push(3);
  out.push(`alias ${shJoin(a)} same=${a === b}`);
  let c: number[] = [];
  c = a;
  c[0] = 10;
  out.push(`assigned ${shJoin(a)}`);
  const r = shPush(a, 4);
  out.push(`param ${shJoin(a)} returned same=${r === a}`);
  const [first, second] = [a, b];
  first!.push(5);
  out.push(`destructured ${shJoin(second!)}`);
  const bag: ShBag = { items: a, tags: {} };
  bag.items.push(6);
  out.push(`field ${shJoin(a)}`);
  const { items } = bag;
  items.pop();
  out.push(`object destructuring ${shJoin(bag.items)}`);
  const one = [1];
  const other = [1];
  out.push(`literal identity ${one === other} ${a !== b}`);
  const copy = a.slice();
  copy.push(99);
  out.push(`slice copies ${a.length} ${copy.length} ${copy === a}`);
  const spread = [...a];
  spread[0] = -1;
  out.push(`spread copies ${a[0] ?? 0} ${spread[0] ?? 0}`);
  return out;
}

export function shNested(): string[] {
  const out: string[] = [];
  const grid: number[][] = [[1], [2]];
  const row = grid[0]!;
  row.push(1);
  out.push(`row ${grid.map((r) => r.join("+")).join(" ")}`);
  shPadAll(grid);
  out.push(`padded ${grid.map((r) => r.join("+")).join(" ")}`);
  for (const r of grid) r.push(7);
  grid.push([3]);
  out.push(`for-of then push ${grid.map((r) => r.join("+")).join(" ")}`);
  grid.forEach((r, i) => r.push(i * 10));
  out.push(`forEach ${grid.map((r) => r.join("+")).join(" ")}`);
  const lengths = grid.map((r) => {
    r.push(8);
    return r.length;
  });
  out.push(`map callback ${lengths.join(",")} ${grid[2]!.join("+")}`);
  out.push(`indexOf identity ${grid.indexOf(row)} ${grid.indexOf([1, 1])} ${grid.includes(row)}`);
  const p1: number[] = [1];
  const p2: number[] = [1];
  const pair = [p1, p2];
  const m1: Record<string, number> = {};
  const m2: Record<string, number> = {};
  const maps = [m1, m2];
  out.push(`equal contents ${pair.indexOf(p2)} ${pair.lastIndexOf(p1)} ${maps.indexOf(m2)} ${maps.includes({})}`);
  const holder = new ShHolder(grid);
  holder.addTo(holder.first(), 42);
  out.push(`method ${row.join("+")}`);
  const byName: Record<string, number[]> = { a: row };
  byName["a"]!.push(43);
  out.push(`in map ${row.length} ${byName["a"] === row}`);
  return out;
}

export function shInPlace(): string[] {
  const out: string[] = [];
  const xs: number[] = [3, 1, 2];
  const alias = xs;
  const sorted = alias.sort((p, q) => p - q);
  out.push(`sort ${shJoin(xs)} same=${sorted === xs}`);
  alias.reverse();
  out.push(`reverse ${shJoin(xs)}`);
  const removed = alias.splice(0, 1);
  out.push(`splice ${shJoin(xs)} removed ${shJoin(removed)}`);
  alias.unshift(0);
  alias.shift();
  alias.unshift(9);
  out.push(`unshift ${shJoin(xs)}`);
  xs[xs.length] = 5;
  out.push(`append by index ${shJoin(alias)}`);
  const both = alias.concat(alias);
  out.push(`concat self ${shJoin(both)} ${both === xs}`);
  const seen: number[] = [];
  const grow: number[] = [1, 2];
  for (const x of grow) {
    seen.push(x);
    if (x < 4) grow.push(x + 2);
  }
  out.push(`for-of sees pushes ${shJoin(seen)}`);
  const copySorted = xs.slice().sort((p, q) => q - p);
  out.push(`sorted copy ${shJoin(copySorted)} original ${shJoin(xs)}`);
  return out;
}

function shBatches(sizes: number[][]): number[] {
  const out: number[] = [];
  for (let [batch = []] = sizes; batch.length < 3; ) {
    class ShFiller {
      fill(): void {
        batch.push(batch.length);
      }
    }
    new ShFiller().fill();
    out.push(batch.length);
  }
  return out;
}

export function shClosures(): string[] {
  const out: string[] = [];
  const log: string[] = [];
  const add = (s: string) => log.push(s);
  add("a");
  add("b");
  const view = log;
  out.push(`closure ${view.join("")}`);
  const make = (): (() => number) => {
    const counts: number[] = [];
    return () => counts.push(1);
  };
  const tick = make();
  tick();
  out.push(`captured ${tick()}`);
  class ShCollector {
    put(s: string): void {
      log.push(s);
    }
  }
  new ShCollector().put("c");
  out.push(`nested class ${log.join("")}`);
  function* walk(): Generator<string, void, unknown> {
    for (const s of log) yield s;
  }
  log.push("d");
  const walked: string[] = [];
  for (const s of walk()) walked.push(s);
  out.push(`generator ${walked.join("")}`);
  const given: number[] = [7];
  out.push(`loop array in a class ${shBatches([given]).join(",")} ${given.join(",")} ${shBatches([]).join(",")}`);
  return out;
}

export function shMaps(): string[] {
  const out: string[] = [];
  const m: Record<string, number> = { b: 1 };
  const alias = m;
  alias["a"] = 2;
  shSet(m, "c", 3);
  out.push(`keys ${Object.keys(m).join(",")} same=${m === alias}`);
  delete alias["b"];
  alias["b"] = 4;
  out.push(`order ${Object.keys(m).join(",")} ${m["b"] ?? 0}`);
  const bag: ShBag = { items: [], tags: {} };
  const tags = bag.tags;
  tags["x"] = "y";
  out.push(`field map ${bag.tags["x"] ?? "none"}`);
  const lists: Record<string, string[]> = {};
  const l: string[] = [];
  lists["k"] = l;
  l.push("v");
  out.push(`array in map ${lists["k"]!.join("")}`);
  const empty: Record<string, number> = {};
  const empty2: Record<string, number> = {};
  out.push(`map identity ${empty === empty2} ${empty === empty}`);
  return out;
}

export function shUnions(): string[] {
  const xs: number[] = [1];
  const a: number[] | string = xs;
  const b: number[] | string = xs;
  const c: number[] | string = [1];
  return [`union === ${a === b} ${a === c}`];
}
