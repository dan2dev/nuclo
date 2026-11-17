// Edge cases: arrays, maps (Record) and key order. Every top-level name starts with `ed`.

function edNums(xs: number[]): number[] {
  return xs.slice();
}

/** Array methods on negative, out-of-range and empty arguments. */
export function edArrayEdges(): string[] {
  const xs = edNums([1, 2, 3, 4, 5]);
  const empty = edNums([]);
  const a = xs.slice();
  const removed = a.splice(-2, 1);
  const b = xs.slice();
  const removedB = b.splice(1, 100);
  const c = xs.slice();
  const removedC = c.splice(-100, 2);
  const d = xs.slice();
  const removedD = d.splice(2, 0);
  const e = xs.slice();
  const removedE = e.splice(10, 1);
  return [
    `${xs.slice(-2).join()} ${xs.slice(1, -1).join()} ${xs.slice(3, 1).length} ${xs.slice(-100).length} ${xs.slice(2, 100).join()} ${empty.slice(1).length}`,
    `${a.join()}|${removed.join()} ${b.join()}|${removedB.join()} ${c.join()}|${removedC.join()} ${d.join()}|${removedD.length} ${e.join()}|${removedE.length}`,
    `${xs.at(-1) ?? -1} ${xs.at(0) ?? -1} ${xs.at(-5) ?? -1} ${xs.at(-6) ?? -1} ${xs.at(5) ?? -1} ${empty.at(0) ?? -1} ${xs.at(1.7) ?? -1}`,
    `${xs.indexOf(3)} ${xs.indexOf(9)} ${xs.lastIndexOf(1)} ${xs.includes(5)} ${empty.includes(0)} ${xs.findIndex((x) => x > 3)} ${xs.find((x) => x > 9) ?? -1}`,
    `${empty.join()}|${[0].join("--")}|${xs.join("")}|${xs.join(", ")} ${empty.every((x) => x > 0)} ${empty.some((x) => x > 0)} ${empty.reduce((s, x) => s + x, 0)}`,
    `${xs.reduce((s, x) => s * 10 + x, 0)} ${xs.map((x, i) => x * i).join()} ${xs.filter((x, i) => i % 2 === 0).join()} ${empty.pop() ?? -1} ${empty.shift() ?? -1}`,
  ];
}

/** NaN, -0 and floats: indexOf uses ===, includes uses SameValueZero. */
export function edNaN(): string[] {
  const xs = edNums([NaN, 0, -0, 0.1 + 0.2, 1]);
  return [
    `${xs.indexOf(NaN)} ${xs.includes(NaN)} ${xs.lastIndexOf(NaN)} ${xs.indexOf(-0)} ${xs.includes(-0)} ${xs.indexOf(0.3)} ${xs.indexOf(0.30000000000000004)}`,
    `${xs.findIndex((x) => Number.isNaN(x))} ${xs.filter((x) => x === x).length} ${xs[0]! === xs[0]!} ${xs[1]! === xs[2]!} ${xs.filter((x) => x !== x).length}`,
  ];
}

/** sort(): default order compares text (numbers too), stable with comparator ties, undefined-free. */
export function edSorting(): string[] {
  const nums = edNums([10, 9, 1, 100, -5, 25, 2, -10, 0.5, 1e21, 3e-7]);
  const byText = nums.slice().sort();
  const byValue = nums.slice().sort((a, b) => a - b);
  const desc = nums.slice().sort((a, b) => b - a);
  const words = ["banana", "Apple", "apple", "Banana", "éclair", "zebra", "", "10", "9", "😀", "￿"];
  const people = [
    { name: "Ann", age: 30 },
    { name: "Bob", age: 25 },
    { name: "Cid", age: 30 },
    { name: "Dee", age: 25 },
    { name: "Eve", age: 35 },
    { name: "Fay", age: 30 },
  ];
  const stable = people.slice().sort((p, q) => p.age - q.age).map((p) => p.name);
  const byNameDesc = people.slice().sort((p, q) => (p.name < q.name ? 1 : p.name > q.name ? -1 : 0)).map((p) => p.name);
  const bools = [true, false, true, false].sort();
  // A comparator that returns booleans as numbers, or only ever 0: the order stays as given.
  const zero = edNums([3, 1, 2]).sort(() => 0);
  const big = edNums([0.1, 0.2, 0.3]).sort((a, b) => (a < b ? 1 : -1));
  return [
    byText.join(),
    byValue.join(),
    desc.join(),
    words.slice().sort().join("|"),
    `${stable.join()} ${byNameDesc.join()} ${bools.join()} ${zero.join()} ${big.join()}`,
    `${nums.join()} ${nums.slice().reverse().join()} ${edNums([]).sort().length} ${edNums([1]).sort().join()}`,
  ];
}

/** Map (Record) key order: integer-like keys ascending first, then insertion order; delete + reinsert goes last. */
export function edKeyOrder(): string[] {
  const m: Record<string, number> = {};
  for (const k of ["b", "10", "a", "2", "-1", "01", "1.5", "4294967294", "4294967295", "0", " 1", "1e3", "9007199254740993"]) m[k] = k.length;
  const first = Object.keys(m).join(",");
  delete m["b"];
  m["b"] = 1;
  delete m["2"];
  m["2"] = 2;
  m["a"] = 99;
  const second = Object.keys(m).join(",");
  const counts: Record<string, number> = {};
  for (const w of ["x", "y", "x", "z", "y", "x"]) counts[w] = (counts[w] ?? 0) + 1;
  const lit: Record<string, string> = { z: "1", 5: "2", a: "3", 1: "4" };
  let walked = "";
  for (const k in lit) walked += `${k}=${lit[k]!};`;
  const accents: Record<string, number> = {};
  accents["é"] = 1;
  accents["e\u0301"] = 2;
  const names = ["é", "x"];
  const keyLine = `${Object.keys(accents).length} ${accents["é"] ?? 0} ${names.indexOf("e\u0301")} ${names.includes("e\u0301")} ${"e\u0301" in accents}`;
  return [keyLine, first, second, Object.values(counts).join(), Object.keys(lit).join(), walked, `${"x" in counts} ${"q" in counts} ${counts["q"] ?? -1}`];
}

/** Grid, matrix and nested-array work: no aliasing surprises. */
export function edMatrix(): string[] {
  const n = 4;
  const grid: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) row.push(i * n + j);
    grid.push(row);
  }
  const t: number[][] = [];
  for (let j = 0; j < n; j++) t.push(grid.map((row) => row[j]!));
  const spiral: number[] = [];
  let top = 0;
  let bottom = n - 1;
  let left = 0;
  let right = n - 1;
  while (top <= bottom && left <= right) {
    for (let j = left; j <= right; j++) spiral.push(grid[top]![j]!);
    top++;
    for (let i = top; i <= bottom; i++) spiral.push(grid[i]![right]!);
    right--;
    if (top <= bottom) {
      for (let j = right; j >= left; j--) spiral.push(grid[bottom]![j]!);
      bottom--;
    }
    if (left <= right) {
      for (let i = bottom; i >= top; i--) spiral.push(grid[i]![left]!);
      left++;
    }
  }
  const flat: number[] = [];
  for (const row of grid) for (const v of row) flat.push(v);
  const pascal: number[][] = [[1]];
  for (let i = 1; i < 6; i++) {
    const prev = pascal[i - 1]!.slice();
    const next: number[] = [1];
    for (let j = 1; j < i; j++) next.push(prev[j - 1]! + prev[j]!);
    next.push(1);
    pascal.push(next);
  }
  return [t.map((r) => r.join(",")).join(" "), spiral.join(), `${flat.length} ${flat.reduce((s, x) => s + x, 0)}`, pascal.map((r) => r.join(" ")).join(" | ")];
}
