// JavaScript's Map and Set: insertion order, SameValueZero keys (NaN is NaN, -0 is 0), objects by identity, live
// iteration (entries deleted before their turn are skipped, ones added during the loop are visited), shared references.

class MsNode {
  constructor(readonly name: string) {}
}

class MsGraph {
  readonly edges = new Map<string, Set<string>>();
  link(a: string, b: string): void {
    if (!this.edges.has(a)) this.edges.set(a, new Set());
    this.edges.get(a)!.add(b);
  }
}

function msCount(words: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
  return counts;
}

function msFill(m: Map<string, number>, n: number): void {
  for (let i = 0; i < n; i++) m.set(`k${i}`, i);
}

function* msPositive(m: Map<string, number>): Generator<string> {
  for (const [k, v] of m) if (v > 0) yield k;
}

function msShow(m: Map<string, number>): string {
  const parts: string[] = [];
  m.forEach((v, k) => parts.push(`${k}=${v}`));
  return parts.join(" ");
}

export function msBasics(): string[] {
  const out: string[] = [];
  const m = new Map<string, number>();
  m.set("b", 2).set("a", 1).set("c", 3);
  out.push(`size ${m.size} a ${m.get("a") ?? -1} z ${m.get("z") === undefined} twice ${m.size * 2}`);
  m.set("b", 20);
  out.push(`has ${m.has("b")} ${m.has("x")} delete ${m.delete("a")} ${m.delete("a")} size ${m.size}`);
  m.set("a", 5);
  out.push(msShow(m));
  out.push(`keys ${[...m.keys()].join(",")} values ${[...m.values()].join(",")}`);
  // Integer-like keys stay in insertion order (an object would list them first).
  const order = new Map<string, string>([["2", "x"], ["1", "y"], ["b", "z"], ["0", "w"]]);
  out.push([...order.keys()].join(","));
  const e = Array.from(order).map(([k, v]) => `${k}:${v}`);
  out.push(e.join(" "));
  out.push(`${m} ${String(new Set<number>())} ${`${new Set([1])}`}`);
  m.clear();
  out.push(`cleared ${m.size} ${[...m.keys()].length} ${m.get("b") ?? -1}`);
  const same = m;
  same.set("q", 9);
  out.push(`alias ${m.get("q")!} ${m === same} ${new Map<string, number>() === new Map<string, number>()}`);
  return out;
}

export function msKeys(): string[] {
  const out: string[] = [];
  const nums = new Map<number, string>();
  nums.set(NaN, "nan").set(-0, "zero").set(1, "one").set(1.5, "x");
  out.push(`${nums.get(NaN)!} ${nums.get(0)!} ${nums.get(-0)!} ${nums.get(1.0)!} ${nums.has(2)} ${nums.size}`);
  // -0 is stored as +0.
  for (const k of nums.keys()) out.push(`key ${k} ${1 / k}`);
  nums.set(0 / 0, "nan2");
  out.push(`${nums.size} ${nums.get(NaN)!}`);
  const a = new MsNode("a");
  const a2 = new MsNode("a");
  const objs = new Map<MsNode, number>([[a, 1]]);
  objs.set(a2, 2);
  out.push(`objs ${objs.size} ${objs.get(a)!} ${objs.get(a2)!} ${objs.has(new MsNode("a"))}`);
  const arr = [1, 2];
  const byArr = new Map<number[], string>();
  byArr.set(arr, "arr");
  out.push(`arrays ${byArr.get(arr)!} ${byArr.has([1, 2])}`);
  const flags = new Map<boolean, number>();
  flags.set(true, 1).set(false, 0).set(true, 2);
  out.push(`bools ${flags.get(true)!} ${flags.get(false)!} ${flags.size}`);
  const bigs = new Map<bigint, string>();
  bigs.set(10n, "ten").set(2n ** 70n, "huge");
  out.push(`bigint ${bigs.get(5n * 2n)!} ${bigs.get(2n ** 70n)!} ${bigs.has(11n)}`);
  // Strings are compared unit for unit: "é" and "é" are two keys.
  const text = new Map<string, number>([["é", 1], ["é", 2]]);
  out.push(`text ${text.size} ${text.get("é") ?? -1} ${text.get("é") ?? -1} ${text.get("") ?? -1}`);
  const maps = new Map<Map<string, number>, number>();
  maps.set(text, 1);
  out.push(`map key ${maps.get(text)!} ${maps.has(new Map<string, number>())}`);
  return out;
}

export function msSets(): string[] {
  const out: string[] = [];
  const s = new Set([3, 1, 3, 2, 1]);
  out.push(`set ${[...s].join(",")} size ${s.size}`);
  s.add(4).add(1);
  out.push(`add ${Array.from(s).join(",")} has ${s.has(4)} ${s.has(9)} delete ${s.delete(3)} ${s.delete(3)}`);
  const special = new Set([NaN, NaN, 0, -0, 1]);
  out.push(`special ${special.size} ${special.has(NaN)} ${special.has(-0)}`);
  const words = new Set<string>();
  for (const w of ["b", "a", "b", "c", "a"]) words.add(w);
  const seen: string[] = [];
  words.forEach((w) => seen.push(w.toUpperCase()));
  out.push(`words ${seen.join("")} ${[...words].join("")}`);
  const a = new Set([1, 2, 3, 4]);
  const b = new Set([3, 4, 5]);
  const union = new Set([...a, ...b]);
  const inter: number[] = [];
  for (const x of a) if (b.has(x)) inter.push(x);
  const diff = [...a].filter((x) => !b.has(x));
  out.push(`ops ${[...union].join(",")} ${inter.join(",")} ${diff.join(",")}`);
  const nodes = new Set<MsNode>();
  const n = new MsNode("n");
  nodes.add(n).add(n).add(new MsNode("n"));
  out.push(`nodes ${nodes.size} ${nodes.has(n)}`);
  const copy = new Set(a);
  copy.add(99);
  out.push(`copy ${a.size} ${copy.size} ${copy === a}`);
  s.clear();
  out.push(`cleared ${s.size}`);
  return out;
}

export function msConstruct(): string[] {
  const out: string[] = [];
  const pairs: [string, number][] = [["x", 1], ["y", 2], ["x", 3]];
  const m = new Map(pairs);
  out.push(`pairs ${msShow(m)}`);
  const copy = new Map(m);
  copy.set("z", 26);
  copy.delete("x");
  out.push(`copy ${msShow(m)} | ${msShow(copy)}`);
  const rec: Record<string, number> = { b: 2, a: 1, "1": 0 };
  const fromRec = new Map(Object.entries(rec));
  out.push(`record ${msShow(fromRec)}`);
  const keys = new Set(m.keys());
  out.push(`keys set ${[...keys].join(",")}`);
  const annotated: Map<string, number> = new Map();
  annotated.set("n", 1);
  const strs = new Map<string, string>([["k", "v"]]);
  const entries = [...strs.entries()];
  out.push(`annotated ${annotated.size} entries ${entries.length} ${entries[0]![0]}${entries[0]![1]}`);
  const counts = msCount(["a", "b", "a", "c", "a", "b"]);
  out.push(`counts ${msShow(counts)}`);
  return out;
}

export function msIteration(): string[] {
  const out: string[] = [];
  const m = new Map<string, number>([["a", 1], ["b", 2], ["c", 3], ["d", 4]]);
  const seen: string[] = [];
  for (const [k, v] of m) {
    seen.push(`${k}${v}`);
    if (k === "a") {
      m.delete("b");
      m.set("e", 5);
    }
    if (k === "c" && v === 3) {
      m.delete("c");
      m.set("c", 30);
    }
  }
  out.push(`live ${seen.join(" ")}`);
  const fe: string[] = [];
  m.forEach((v, k) => {
    fe.push(k);
    if (k === "a") m.set("f", 6);
    if (k === "d") m.delete("e");
  });
  out.push(`forEach ${fe.join("")} ${[...m.keys()].join("")}`);
  // Clearing during the loop: only what is added after it is visited.
  const c = new Map<number, number>([[1, 1], [2, 2], [3, 3]]);
  const cs: number[] = [];
  for (const [k] of c) {
    cs.push(k);
    if (k === 1) {
      c.clear();
      c.set(7, 7);
    }
  }
  out.push(`clear ${cs.join(",")}`);
  // Many deletions while iterating (the storage is compacted under the loop).
  const big = new Map<string, number>();
  msFill(big, 100);
  const kept: number[] = [];
  for (const [k, v] of big) {
    if (v === 0) for (let i = 1; i < 95; i++) big.delete(`k${i}`);
    if (v === 97) big.set("late", 1000);
    kept.push(v);
  }
  out.push(`compact ${kept.join(",")} size ${big.size}`);
  // Nested loops over one map.
  const pairs: string[] = [];
  const small = new Map<string, number>([["p", 1], ["q", 2]]);
  for (const [k1] of small) for (const [k2] of small) pairs.push(k1 + k2);
  out.push(`nested ${pairs.join(",")}`);
  // Sets: delete ahead, add behind, re-add the current one.
  const s = new Set([1, 2, 3]);
  const ss: number[] = [];
  for (const x of s) {
    ss.push(x);
    if (x === 1) s.delete(2);
    if (x === 3 && ss.length < 6) {
      s.delete(3);
      s.add(3);
    }
    if (ss.length > 10) break;
  }
  out.push(`set live ${ss.join(",")}`);
  let total = 0;
  for (const [, v] of m) {
    if (v > 4) continue;
    total += v;
  }
  out.push(`values ${total}`);
  for (const v of m.values()) total += v;
  out.push(`more ${total}`);
  return out;
}

export function msShared(): string[] {
  const out: string[] = [];
  const groups = new Map<string, number[]>();
  for (const x of [1, 2, 3, 4, 5, 6]) {
    const k = x % 2 === 0 ? "even" : "odd";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(x);
  }
  for (const [k, xs] of groups) out.push(`${k} ${xs.join(",")}`);
  const g = new MsGraph();
  g.link("a", "b");
  g.link("a", "c");
  g.link("b", "c");
  g.link("a", "b");
  for (const [k, to] of g.edges) out.push(`edge ${k} -> ${[...to].join(",")}`);
  const filled = new Map<string, number>();
  msFill(filled, 3);
  out.push(`param ${msShow(filled)}`);
  const nested = new Map<string, Map<string, number>>();
  nested.set("inner", filled);
  nested.get("inner")!.set("k9", 9);
  out.push(`nested ${filled.size} ${nested.get("inner") === filled}`);
  const fns = new Map<string, (x: number) => number>();
  fns.set("double", (x) => x * 2).set("square", (x) => x * x);
  out.push(`fns ${fns.get("double")!(4)} ${fns.get("square")!(5)}`);
  const signs = new Map<string, number>([["p", 1], ["n", -1], ["q", 2]]);
  const lazy: string[] = [];
  for (const k of msPositive(signs)) {
    lazy.push(k);
    signs.set("late", 3);
  }
  out.push(`generator ${lazy.join(",")}`);
  let captured = "";
  const fs: (() => string)[] = [];
  for (const [k] of signs) fs.push(() => k);
  for (const f of fs) captured += f();
  out.push(`closures ${captured}`);
  return out;
}
