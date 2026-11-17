// Array APIs: flat / flatMap, fill, copyWithin, splice with items, indexOf / includes / lastIndexOf from an index,
// spread arguments, Array.from / Array.of / new Array(n).fill(v), arrays as text, entries / keys / values, reduceRight.

class AaBox {
  constructor(public n: number) {}
}

export function aaFlat(): string[] {
  const nested: number[][] = [[1, 2], [], [3]];
  const deep: number[][][] = [[[1], [2, 3]], [], [[4]]];
  const words = ["a b", "", "c"];
  const flat0 = nested.flat(0);
  const out = [
    `flat ${nested.flat().join(",")} len ${nested.flat().length} depth0 ${flat0.length} ${flat0[0] === nested[0]}`,
    `deep1 ${deep.flat().length} ${deep.flat().map((r) => r.join("+")).join("|")} deep2 ${deep.flat(2).join(",")} deep5 ${deep.flat(5).join(",")}`,
    `flatMap ${words.flatMap((w) => w.split(" ")).join("/")} ${[1, 2, 3].flatMap((x) => [x, x * 10]).join(",")}`,
    `flatMap scalar ${[1, 2].flatMap((x) => x + 0.5).join(",")} index ${["x", "y"].flatMap((s, i) => [s, `${i}`]).join("")}`,
    `flatMap empty ${[1, 2, 3].flatMap((x) => (x % 2 === 0 ? [] : [x])).join(",")} nested ${[[1], [2]].flatMap((r) => [r]).length}`,
  ];
  const strs: string[][] = [["p"], ["q", "r"]];
  out.push(`strings ${strs.flat().join("")} ${[[true], [false]].flat().join(",")}`);
  return out;
}

export function aaFill(): string[] {
  const a = [1, 2, 3, 4, 5];
  const same = a.fill(0, 1, 3) === a;
  const out = [`fill ${a.join(",")} same ${same}`];
  out.push(`fill all ${[1, 2, 3].fill(7).join(",")} start ${[1, 2, 3].fill(9, 1).join(",")} neg ${[1, 2, 3, 4].fill(8, -2).join(",")}`);
  out.push(`fill neg end ${[1, 2, 3, 4].fill(6, 0, -1).join(",")} empty ${[1, 2, 3].fill(5, 2, 1).join(",")} out ${[1, 2].fill(4, 5, 9).join(",")} far ${[1, 2, 3].fill(3, -9, 9).join(",")}`);
  out.push(`fill frac ${[1, 2, 3, 4].fill(0, 1.7, 3.2).join(",")}`);
  const boxes = new Array<AaBox>(3).fill(new AaBox(1));
  boxes[0]!.n = 5;
  out.push(`fill shared ${boxes.map((b) => b.n).join(",")} ${boxes[1] === boxes[2]}`);
  const n = 4;
  const zeros = new Array<number>(n).fill(0);
  zeros[2] = 1;
  const grid = Array<string>(2).fill("-");
  const squares = Array<number>(4).fill(0).map((_, i) => i * i);
  const rows: number[][] = new Array<number[]>(2).fill([]);
  rows[0]!.push(1);
  out.push(`new Array ${zeros.join(",")} Array() ${grid.join("")} map ${squares.join(",")} rows ${rows[1]!.length} empty ${new Array<number>(0).fill(1).length}`);
  return out;
}

export function aaCopyWithin(): string[] {
  const c = (xs: number[], t: number, s: number, e?: number) => (e === undefined ? xs.copyWithin(t, s) : xs.copyWithin(t, s, e)).join(",");
  const a = [1, 2, 3, 4, 5];
  const r = a.copyWithin(0, 3);
  return [
    `copyWithin ${a.join(",")} same ${r === a}`,
    `${c([1, 2, 3, 4, 5], 1, 0)} ${c([1, 2, 3, 4, 5], 0, 1, 3)} ${c([1, 2, 3, 4, 5], -2, 0)} ${c([1, 2, 3, 4, 5], 2, -3, -1)}`,
    `${c([1, 2, 3], 5, 0)} ${c([1, 2, 3], 0, 2, 1)} ${c([1, 2, 3, 4, 5], 1, 0, 9)} ${c([1, 2, 3, 4], 0.9, 2.9)}`,
    `strings ${["a", "b", "c", "d"].copyWithin(1, 2).join("")}`,
  ];
}

export function aaSplice(): string[] {
  const a = ["a", "b", "c", "d", "e"];
  const removed = a.splice(1, 2, "X", "Y", "Z");
  const out = [`splice ${a.join("")} removed ${removed.join("")}`];
  const b = [1, 2, 3];
  const none = b.splice(1, 0, 9);
  out.push(`insert ${b.join(",")} removed ${none.length}`);
  const c = [1, 2, 3, 4, 5];
  const tail = c.splice(2);
  out.push(`no count ${c.join(",")} tail ${tail.join(",")}`);
  const d = [1, 2, 3, 4, 5];
  d.splice(-2, 1, 7, 8);
  out.push(`negative ${d.join(",")}`);
  const e = [1, 2, 3];
  const extra = [8, 9];
  e.splice(1, 1, ...extra);
  e.splice(e.length, 0, ...e);
  out.push(`spread ${e.join(",")}`);
  const f = [1, 2, 3];
  f.splice(10, 5, 4);
  f.splice(-10, 1);
  out.push(`clamped ${f.join(",")} big count ${[1, 2, 3].splice(1, 100).join(",")} zero ${[1, 2].splice(0, -1).length}`);
  return out;
}

export function aaSearch(): string[] {
  const xs = [1, 2, 3, 1, 2, 3];
  const ws = ["a", "b", "a"];
  const boxes = [new AaBox(1), new AaBox(2)];
  const b0 = boxes[0]!;
  return [
    `indexOf ${xs.indexOf(1, 1)} ${xs.indexOf(3, -2)} ${xs.indexOf(1, -100)} ${xs.indexOf(1, 99)} ${xs.indexOf(2, 2.5)}`,
    `lastIndexOf ${xs.lastIndexOf(3, 4)} ${xs.lastIndexOf(1, -4)} ${xs.lastIndexOf(1, -100)} ${xs.lastIndexOf(3, 99)} ${xs.lastIndexOf(1, 0)}`,
    `includes ${xs.includes(1, 4)} ${xs.includes(3, -1)} ${xs.includes(1, -100)} ${[NaN, 1].includes(NaN, 1)} ${[1, NaN].includes(NaN, -1)}`,
    `strings ${ws.indexOf("a", 1)} ${ws.lastIndexOf("a", 1)} ${ws.includes("b", 2)} objects ${boxes.indexOf(b0, 1)} ${boxes.lastIndexOf(b0, 1)} ${boxes.includes(b0, -2)}`,
  ];
}

export function aaSpread(): string[] {
  const xs = [1, 2];
  const ys = [3, 4];
  xs.push(...ys);
  xs.push(0, ...ys, 5);
  const n = xs.push(...ys);
  const out = [`push ${xs.join(",")} len ${n}`];
  const twice = [1, 2];
  twice.push(...twice);
  twice.unshift(...twice);
  out.push(`self ${twice.join(",")}`);
  const u = [3];
  u.unshift(1, 2);
  u.unshift(...[-1, 0]);
  out.push(`unshift ${u.join(",")}`);
  const strs: string[] = [];
  strs.push(..."ab".split(""), "c");
  out.push(`strings ${strs.join("")} ${strs.length}`);
  const none: number[] = [];
  out.push(`Math ${Math.max(...xs)} ${Math.min(0, ...ys)} ${Math.max(...none)} ${Math.min(...none)} ${Math.max(...[1, NaN])} ${Math.min(...[0, -0])} ${aaSum(...ys)}`);
  return out;
}

function aaSum(...xs: number[]): number {
  return xs.reduce((a, x) => a + x, 0);
}

function aaCheck(i: number): number {
  if (i > 1) throw new Error(`bad ${i}`);
  return i * 2;
}

export function aaFrom(): string[] {
  const n = 5;
  const squares = Array.from({ length: n }, (_, i) => i * i);
  const xs = ["a", "b"];
  const copy = Array.from(xs);
  copy.push("c");
  const out = [
    `from length ${squares.join(",")} ${Array.from({ length: 3 }, () => "x").join("")} ${Array.from({ length: 0 }, (_, i) => i).length}`,
    `from array ${copy.join("")} ${xs.join("")} ${copy !== xs} mapped ${Array.from(xs, (s) => s.toUpperCase()).join("")} ${Array.from(xs, (s, i) => `${s}${i}`).join(",")}`,
    `of ${Array.of(1, 2, 3).join(",")} ${Array.of("z").length} ${Array.of<number>().length}`,
    `new ${new Array<number>().length} ${Array.from({ length: 2.7 }, (_, i) => i).length}`,
  ];
  const grid = Array.from({ length: 2 }, (_, r) => Array.from({ length: 3 }, (_, c) => r * 3 + c));
  grid[0]!.push(9);
  out.push(`grid ${grid.map((row) => row.join(" ")).join(" | ")} ${grid[0] !== grid[1]}`);
  try {
    out.push(`ok ${Array.from({ length: 2 }, (_, i) => aaCheck(i)).join(",")}`);
    out.push(`never ${Array.from({ length: 3 }, (_, i) => aaCheck(i)).join(",")}`);
  } catch (e) {
    if (e instanceof Error) out.push(`caught ${e.message}`);
  }
  try {
    out.push(`${[0, 1, 2].flatMap((x) => [aaCheck(x)]).length} ${[3, 1].reduceRight((a, x) => a + aaCheck(x), 0)}`);
  } catch (e) {
    if (e instanceof Error) out.push(`caught ${e.message}`);
  }
  return out;
}

export function aaText(): string[] {
  const nums = [1, 2.5, -0, NaN, 1e21, 0.1 + 0.2];
  const nested: number[][] = [[1, 2], [3], []];
  const deep: number[][][] = [[[1, 2]], [[3], []]];
  const maybe: (number | null)[] = [1, null, 3];
  const opt: (string | undefined)[] = ["a", undefined, "b"];
  const bools = [true, false];
  const bigs = [1n, -2n];
  return [
    `template ${nums} | ${nested} | ${deep}`,
    `String ${String(nums)} | ${String(nested)} | ${String([] as number[])} | ${String([[], []] as number[][])}`,
    `toString ${nums.toString()} | ${nested.toString()} | ${maybe.toString()} | ${opt.toString()}`,
    `join ${maybe.join()} | ${opt.join("-")} | ${nested.join(";")} | ${deep.join(" ")} | ${bools.join()} | ${bigs}`,
    `strings ${["a", "b"]} ${[["x"], ["y", "z"]]}`,
    "concat " + [1, 2] + " " + nested,
  ];
}

export function aaIter(): string[] {
  const xs = ["a", "b", "c"];
  const out: string[] = [];
  const pairs: string[] = [];
  for (const [i, x] of xs.entries()) pairs.push(`${i}=${x}`);
  const keys: number[] = [];
  for (const k of xs.keys()) keys.push(k);
  const vals: string[] = [];
  for (const v of xs.values()) vals.push(v);
  out.push(`entries ${pairs.join(" ")} keys ${keys.join(",")} values ${vals.join("")}`);
  const live = [1, 2];
  const seen: string[] = [];
  for (const [i, v] of live.entries()) {
    if (v === 2 && live.length < 4) live.push(3, 4);
    if (i === 0) continue;
    seen.push(`${i}:${v}`);
  }
  out.push(`live ${seen.join(" ")}`);
  out.push(`spread ${[...xs.keys()].join(",")} ${[...xs.values()].join("")} from ${Array.from(xs.keys()).join("")}`);
  let total = 0;
  for (let [i, x] of [10, 20].entries()) {
    i += 1;
    x += i;
    total += x;
  }
  out.push(`let ${total}`);
  return out;
}

export function aaReduceRight(): string[] {
  const xs = ["a", "b", "c"];
  return [
    `reduceRight ${xs.reduceRight((acc, x) => acc + x, "")} ${[1, 2, 3].reduceRight((acc, x) => acc * 10 + x, 0)} ${([] as number[]).reduceRight((a, x) => a + x, 7)}`,
    `nested ${[[1, 2], [3]].reduceRight((acc: number[], r) => acc.concat(r), []).join(",")}`,
  ];
}

function aaIsOdd(x: number): boolean {
  return x % 2 === 1;
}

export function aaEs2023(): string[] {
  const xs = [5, 1, 4, 3, 2];
  const words = ["b", "a", "c"];
  const boxes = [new AaBox(1), new AaBox(2), new AaBox(3)];
  const sorted = xs.toSorted((a, b) => a - b);
  const reversed = xs.toReversed();
  const spliced = xs.toSpliced(1, 2, 9, 9);
  const replaced = xs.with(-1, 0);
  const out = [
    `findLast ${xs.findLast((x) => x > 3) ?? -1} ${xs.findLast((x) => x > 9) ?? -1} ${xs.findLast((x, i) => i < 2) ?? -1} ${xs.findLast(aaIsOdd) ?? -1}`,
    `findLastIndex ${xs.findLastIndex((x) => x > 3)} ${xs.findLastIndex((x) => x > 9)} ${xs.findLastIndex((_, i) => i % 2 === 0)} ${xs.findLastIndex(aaIsOdd)}`,
    `toSorted ${sorted.join(",")} text ${[10, 9, 1].toSorted().join(",")} ${words.toSorted().join("")} source ${xs.join(",")} ${sorted !== xs}`,
    `toReversed ${reversed.join(",")} ${xs.join(",")} empty ${([] as number[]).toReversed().length}`,
    `toSpliced ${spliced.join(",")} ${xs.toSpliced(2).join(",")} ${xs.toSpliced(-1, 1).join(",")} ${xs.toSpliced(0, 0, ...words.map((w) => w.length)).join(",")} ${xs.toSpliced(9, 1).join(",")} source ${xs.length}`,
    `with ${replaced.join(",")} ${xs.with(0, 7).join(",")} ${words.with(1, "z").join("")} source ${xs.join(",")} ${words.join("")}`,
    `objects ${boxes.findLast((b) => b.n < 3)?.n ?? 0} ${boxes.toReversed()[0] === boxes[2]} ${boxes.with(0, boxes[2]!)[0]!.n}`,
  ];
  try {
    out.push(`throws ${xs.findLastIndex((x) => aaCheck(x) > 0)}`);
  } catch (e) {
    if (e instanceof Error) out.push(`caught ${e.message}`);
  }
  return out;
}
