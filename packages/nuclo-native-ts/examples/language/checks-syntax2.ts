// Syntax round 2: labelled break / continue, destructuring assignment, && / || values and logical assignments,
// optional chaining on arrays, strings and calls. Every line must print exactly what bun prints.
import { PrLog } from "./checks-promises.ts";

/** Labelled `break` / `continue` on every loop kind, labelled blocks, through switch and finally. */
export function sxLabels(): string[] {
  const out: string[] = [];
  // for (range) in for (range)
  const pairs: string[] = [];
  outer: for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (j === 2) continue outer;
      if (i === 3) break outer;
      pairs.push(`${i}${j}`);
    }
  }
  out.push(`range ${pairs.join(" ")}`);
  // for with a step that isn't a range (the step runs before a labelled continue)
  const steps: string[] = [];
  let n = 0;
  grow: for (let k = 1; k < 50; k = k * 2 + 1) {
    let m = 0;
    while (true) {
      m++;
      n++;
      if (m > 2) continue grow;
      if (k > 20) break grow;
      steps.push(`${k}.${m}`);
    }
  }
  out.push(`step ${steps.join(" ")} n=${n}`);
  // for-of, while, do-while
  const words = ["ab", "cd", "", "ef"];
  const seen: string[] = [];
  letters: for (const w of words) {
    let i = 0;
    while (i < w.length) {
      const c = w.slice(i, i + 1);
      i++;
      if (c === "d") continue letters;
      if (w === "") break letters;
      seen.push(c);
    }
    seen.push("|");
  }
  out.push(`for-of ${seen.join("")}`);
  let x = 0;
  const trail: number[] = [];
  spin: do {
    x++;
    let y = 0;
    do {
      y++;
      if (y === 2) continue spin;
      trail.push(x * 10 + y);
    } while (y < 5);
  } while (x < 3);
  out.push(`do-while ${trail.join(",")} x=${x}`);
  let turn = 0;
  const ws: number[] = [];
  top: while (turn < 10) {
    turn++;
    for (const v of [1, 2, 3]) {
      if (v * turn === 6) continue top;
      if (v + turn > 7) break top;
      ws.push(v * turn);
    }
  }
  out.push(`while ${ws.join(",")} w=${turn}`);
  // for-in over a map
  const scores: Record<string, number> = { a: 1, b: 2, c: 3 };
  const keys: string[] = [];
  keyLoop: for (const key in scores) {
    for (let t = 0; t < 3; t++) {
      if (scores[key] === 2) continue keyLoop;
      if (key === "c" && t === 1) break keyLoop;
      keys.push(`${key}${t}`);
    }
  }
  out.push(`for-in ${keys.join(" ")}`);
  // labelled block
  const blockLog: string[] = [];
  for (const v of [1, 2, 3]) {
    check: {
      if (v === 2) break check;
      blockLog.push(`in${v}`);
      if (v === 3) {
        blockLog.push("three");
        break check;
      }
      blockLog.push(`end${v}`);
    }
    blockLog.push(`after${v}`);
  }
  out.push(`block ${blockLog.join(" ")}`);
  // through a switch
  const sw: string[] = [];
  scan: for (let i = 0; i < 6; i++) {
    switch (i % 3) {
      case 0:
        sw.push(`zero${i}`);
        break;
      case 1:
        if (i > 3) break scan;
        continue scan;
      default:
        sw.push(`two${i}`);
    }
    sw.push(`end${i}`);
  }
  out.push(`switch ${sw.join(" ")}`);
  // through try / finally: the finally blocks run
  const fin: string[] = [];
  rows: for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      try {
        if (j === 1) continue rows;
        if (i === 2) break rows;
        fin.push(`body${i}${j}`);
      } finally {
        fin.push(`fin${i}${j}`);
      }
    }
  }
  out.push(`finally ${fin.join(" ")}`);
  const nested: string[] = [];
  outerTry: for (const a of [1, 2]) {
    try {
      for (const b of [1, 2]) {
        try {
          if (b === 2) continue outerTry;
          nested.push(`${a}${b}`);
        } finally {
          nested.push(`f${a}${b}`);
        }
      }
    } finally {
      nested.push(`F${a}`);
    }
  }
  out.push(`nested finally ${nested.join(" ")}`);
  // a labelled block left from a try with finally
  const lb: string[] = [];
  done: {
    try {
      lb.push("try");
      if (lb.length > 0) break done;
      lb.push("not reached");
    } finally {
      lb.push("finally");
    }
    lb.push("after try");
  }
  out.push(`block finally ${lb.join(" ")}`);
  out.push(`found ${findPair([3, 9, 4, 8], 12)} ${findPair([1, 2], 9)}`);
  // a `continue` inside a labelled block inside a loop
  const cb: string[] = [];
  for (let i = 0; i < 4; i++) {
    inner: {
      if (i === 1) continue;
      if (i === 2) break inner;
      cb.push(`a${i}`);
    }
    cb.push(`b${i}`);
  }
  out.push(`block continue ${cb.join(" ")}`);
  // leaving a for-of over a generator by a label: the generator's finally runs
  const gl: string[] = [];
  walk: for (const a of [1, 2]) {
    for (const v of sxCounted(gl)) {
      if (v === a) continue walk;
      gl.push(`v${v}`);
    }
  }
  out.push(`generator ${gl.join(" ")}`);
  return out;
}

function* sxCounted(log: string[]): Generator<number> {
  try {
    yield 0;
    yield 1;
    yield 2;
  } finally {
    log.push("closed");
  }
}

function findPair(xs: number[], sum: number): string {
  let found = "none";
  search: for (let i = 0; i < xs.length; i++) {
    for (let j = i + 1; j < xs.length; j++) {
      if (xs[i]! + xs[j]! === sum) {
        found = `${i}+${j}`;
        break search;
      }
    }
  }
  return found;
}

function* sxGen(limit: number): Generator<string> {
  outer: for (let i = 0; i < limit; i++) {
    for (let j = 0; j < limit; j++) {
      if (j > i) continue outer;
      if (i + j > 4) break outer;
      yield `${i}${j}`;
    }
  }
  yield "end";
}

/** Labelled loops in a generator (around a `yield`). */
export function sxLabelsGen(): string[] {
  return [[...sxGen(4)].join(" ")];
}

/** Destructuring assignment to existing targets. */
export function sxDestructure(): string[] {
  const out: string[] = [];
  let a = 1;
  let b = 2;
  [a, b] = [b, a];
  out.push(`swap ${a} ${b}`);
  let c = 3;
  [a, b, c] = [c, a, b];
  out.push(`rotate ${a} ${b} ${c}`);
  const point = { x: 5, y: 7 };
  let x = 0;
  let y = 0;
  ({ x, y } = point);
  out.push(`object ${x} ${y}`);
  let px = 0;
  let py = 0;
  ({ x: px, y: py } = { x: y, y: x });
  out.push(`renamed ${px} ${py}`);
  // nested, defaults, holes, rest
  let p = 0;
  let q = 0;
  let r = 0;
  [p, [q, r]] = [1, [2, 3]];
  out.push(`nested ${p} ${q} ${r}`);
  const xs: number[] = [10, 20];
  let d1 = 0;
  let d2 = 0;
  let d3 = 0;
  [d1 = 1, d2 = 2, d3 = 3] = xs;
  out.push(`defaults ${d1} ${d2} ${d3}`);
  let first = 0;
  let rest: number[] = [];
  [first, ...rest] = [4, 5, 6];
  out.push(`rest ${first} [${rest.join(",")}]`);
  [, first] = [7, 8, 9];
  out.push(`hole ${first}`);
  interface Opts {
    size?: number;
    name: string;
    inner: { deep: number };
  }
  const opts: Opts = { name: "n", inner: { deep: 4 } };
  let size = 0;
  let name = "";
  let deep = 0;
  ({ size = 12, name, inner: { deep } } = opts);
  out.push(`object defaults ${size} ${name} ${deep}`);
  // as a value: the right side
  let s1 = 0;
  let s2 = 0;
  const value = ([s1, s2] = [s2 + 1, s1 + 2]);
  out.push(`value ${s1} ${s2} [${value.join(",")}]`);
  let o1 = 0;
  const same = ({ x: o1 } = point);
  out.push(`object value ${o1} ${same === point}`);
  // chained
  let c1 = 0;
  let c2 = 0;
  let c3 = 0;
  let c4 = 0;
  [c1, c2] = [c3, c4] = [5, 6];
  out.push(`chain ${c1} ${c2} ${c3} ${c4}`);
  return out;
}

class SxVec {
  x = 1;
  y = 2;
  flip(): string {
    [this.x, this.y] = [this.y, this.x];
    return `${this.x},${this.y}`;
  }
}

/** Targets that are fields, elements, captured locals and boxes; for-of heads. */
export function sxDestructureTargets(): string[] {
  const out: string[] = [];
  const v = new SxVec();
  out.push(`fields ${v.flip()} ${v.flip()}`);
  const arr = [1, 2, 3];
  [arr[0], arr[2]] = [arr[2]!, arr[0]!];
  out.push(`elements ${arr.join(",")}`);
  const o = { a: 1, b: 2 };
  [o.a, o.b] = [o.b, o.a];
  out.push(`props ${o.a} ${o.b}`);
  const m: Record<string, number> = {};
  [m["k"], m["j"]] = [3, 4];
  out.push(`map ${m["k"]} ${m["j"]}`);
  let lo = 1;
  let hi = 9;
  const swap = () => {
    [lo, hi] = [hi, lo];
  };
  swap();
  out.push(`captured ${lo} ${hi}`);
  const readLater = () => `${lo}-${hi}`;
  [lo, hi] = [lo * 2, hi * 2];
  out.push(`boxed ${readLater()}`);
  // the element targets are evaluated after the right side, left to right
  let i = 0;
  const slots = [0, 0, 0, 0];
  [slots[i++], slots[i++]] = [i + 10, i + 20];
  out.push(`order ${slots.join(",")} i=${i}`);
  // for-of heads
  const entries: [string, number][] = [["a", 1], ["b", 2]];
  let k = "";
  let n = 0;
  const seen: string[] = [];
  for ([k, n] of entries) seen.push(`${k}${n}`);
  out.push(`for-of ${seen.join(" ")} last=${k}${n}`);
  let px = 0;
  let total = 0;
  for ({ x: px } of [{ x: 3 }, { x: 4 }]) total += px;
  out.push(`for-of object ${total} ${px}`);
  let item = "";
  for (item of ["p", "q"]) seen.push(item);
  out.push(`for-of plain ${item} ${seen.length}`);
  // swaps by computed indexes (a bubble sort)
  const sorted = [5, 1, 4, 2, 3];
  for (let a = 0; a < sorted.length; a++) {
    for (let b = 0; b + 1 < sorted.length - a; b++) {
      if (sorted[b]! > sorted[b + 1]!) [sorted[b], sorted[b + 1]] = [sorted[b + 1]!, sorted[b]!];
    }
  }
  out.push(`sorted ${sorted.join(",")}`);
  // from calls returning tuples
  let q = 0;
  let r = 0;
  [q, r] = sxDivmod(17, 5);
  let label = "";
  let count = 0;
  [label, count] = sxPair();
  out.push(`tuples ${q} ${r} ${label} ${count}`);
  SxCounter.total = 0;
  [SxCounter.total, q] = [q + 0.5, SxCounter.total];
  out.push(`static ${SxCounter.total} ${q}`);
  return out;
}

class SxCounter {
  static total = 0;
}

function sxDivmod(a: number, b: number): [number, number] {
  return [Math.floor(a / b), a % b];
}

function sxPair(): [string, number] {
  return ["seven", 7];
}

function sxCount(log: string[], v: number): number {
  log.push(`f${v}`);
  return v;
}

function sxText(log: string[], v: string): string {
  log.push(`t${v}`);
  return v;
}

interface SxNode {
  val: number;
  next?: SxNode;
  label?: string;
}

/** && / || returning their operands, ??, short-circuiting, single evaluation. */
export function sxLogical(): string[] {
  const out: string[] = [];
  const zero = 0;
  const two = 2;
  const half = 0.5;
  const nan = NaN;
  const negZero = -0;
  out.push(`num && ${zero && 9} ${two && 9} ${half && 7} ${nan && 1} ${1 / (negZero && 5)}`);
  out.push(`num || ${zero || 9} ${two || 9} ${nan || 3} ${half || 4}`);
  const empty = "";
  const word = "hi";
  out.push(`str ${empty || "default"} ${word || "default"} [${empty && "x"}] ${word && "x"}`);
  const yes = true;
  const no = false;
  // mixed types: a union
  const mixed1 = zero && "text";
  const mixed2 = two && "text";
  const mixed3 = no || 42;
  const mixed4 = word && 3;
  out.push(`mixed ${mixed1} ${mixed2} ${mixed3} ${mixed4} ${yes && "y"} ${no && "y"}`);
  const node: SxNode = { val: 1, next: { val: 2, label: "two" } };
  const none: SxNode | undefined = node.next?.next;
  out.push(`objects ${node && node.val} ${none && none.val} ${node.next && node.next.label} ${(none || node).val}`);
  const maybe: string | undefined = node.next?.label;
  const missing: string | null = null as string | null;
  out.push(`nullable ${maybe || "x"} ${missing || "fallback"} ${maybe && maybe.length} ${missing && missing.length}`);
  // chains
  const chain = zero || empty || two || 5;
  const chain2 = two && word && "last";
  const chain3 = (zero || nan) ?? 8;
  out.push(`chains ${chain} ${chain2} ${chain3} ${missing ?? empty ?? "z"}`);
  // short-circuit and single evaluation
  const log: string[] = [];
  const r1 = sxCount(log, 0) && sxCount(log, 1);
  const r2 = sxCount(log, 2) && sxCount(log, 3);
  const r3 = sxCount(log, 4) || sxCount(log, 5);
  const r4 = sxCount(log, 0) || sxCount(log, 6);
  const r5 = sxText(log, "") || sxText(log, "b");
  const r6 = sxText(log, "a") || sxText(log, "c");
  const r7 = sxText(log, "a") && sxCount(log, 7);
  out.push(`once ${r1} ${r2} ${r3} ${r4} ${r5} ${r6} ${r7} ${log.join(",")}`);
  const r8 = sxText(log, "") || sxCount(log, 8);
  const r9 = sxCount(log, 0) || sxText(log, "z") || sxCount(log, 9);
  out.push(`once mixed ${r8} ${r9} ${log.slice(11).join(",")}`);
  // in conditions and as arguments
  const counts: number[] = [];
  for (const v of [0, 1, 2]) counts.push(v && v * 10);
  out.push(`args ${counts.join(",")} ${Math.max(zero || 3, two && 1)}`);
  return out;
}

class SxBag {
  count = 0;
  label = "";
  items: number[] = [];
  next?: SxBag;
}

/** &&=, ||=, ??= on locals, fields, elements, map entries, captured locals and computed targets. */
export function sxLogicalAssign(): string[] {
  const out: string[] = [];
  let a = 0;
  let b = 3;
  let s = "";
  let t = "x";
  a ||= 5;
  b ||= 5;
  s ||= "filled";
  t &&= "replaced";
  let u: number | undefined;
  let v: number | undefined = 0;
  u ??= 7;
  v ??= 7;
  out.push(`locals ${a} ${b} ${s} ${t} ${u} ${v}`);
  const bag = new SxBag();
  bag.count ||= 2;
  bag.label ||= "named";
  bag.next ??= new SxBag();
  bag.next.count &&= 9;
  out.push(`fields ${bag.count} ${bag.label} ${bag.next.count}`);
  const xs = [0, 1, 2];
  xs[0] ||= 10;
  xs[1] &&= 20;
  out.push(`elements ${xs.join(",")}`);
  const m: Record<string, number> = { a: 0 };
  m["a"] ||= 1;
  m["b"] ??= 2;
  m["b"] ??= 3;
  out.push(`map ${m["a"]} ${m["b"]}`);
  let captured = "";
  const set = () => {
    captured ||= "set once";
  };
  set();
  captured &&= `${captured}!`;
  out.push(`captured ${captured}`);
  // computed targets are evaluated once
  const log: string[] = [];
  const bags = [new SxBag(), new SxBag()];
  let i = 0;
  bags[i++]!.count ||= 4;
  xs[sxCount(log, 2)] &&= 30;
  bags[sxCount(log, 1)]!.label ??= "never";
  bags[sxCount(log, 1)]!.label ||= "computed";
  out.push(`computed ${bags[0]!.count} ${bags[1]!.label} ${xs.join(",")} i=${i} ${log.join(",")}`);
  // the right side runs only when assigned
  let calls = 0;
  const next = (): number => ++calls;
  let k = 1;
  k ||= next();
  k &&= next();
  out.push(`lazy ${k} ${calls}`);
  return out;
}

/** Optional chaining on arrays, strings, calls and methods; delete of an optional field. */
export function sxOptional(): string[] {
  const out: string[] = [];
  const list: number[] | undefined = [1, 2, 3];
  const noList: number[] | undefined = undefined as number[] | undefined;
  out.push(`length ${list?.length} ${noList?.length} ${noList?.length ?? -1}`);
  const text: string | null = "hello";
  const noText: string | null = null as string | null;
  out.push(`str ${text?.length} ${noText?.length} ${text?.toUpperCase()} ${noText?.toUpperCase()}`);
  out.push(`index ${list?.[1]} ${noList?.[1]} ${list?.[7]}`);
  const fn: ((n: number) => number) | undefined = (n: number) => n * 2;
  const noFn: ((n: number) => number) | undefined = undefined as ((n: number) => number) | undefined;
  out.push(`calls ${fn?.(4)} ${noFn?.(4)}`);
  const bag: SxBag | undefined = new SxBag();
  bag.items.push(5);
  const noBag: SxBag | undefined = bag.next;
  out.push(`methods ${bag?.items.join("-")} ${noBag?.items.join("-")} ${bag?.items?.length} ${noBag?.items.length}`);
  const nested: { list?: number[] } = {};
  out.push(`nested ${nested.list?.length} ${nested.list?.[0]}`);
  nested.list = [9];
  out.push(`nested2 ${nested.list?.length} ${nested.list?.[0]}`);
  let evaluated = 0;
  const idx = (): number => {
    evaluated++;
    return 0;
  };
  out.push(`short ${noList?.[idx()]} ${evaluated} ${list?.[idx()]} ${evaluated}`);
  const node: SxNode = { val: 1, label: "one" };
  delete node.label;
  out.push(`delete ${node.label} ${node.label === undefined}`);
  return out;
}

/** Labelled loops around an `await`; && / || / ??= in async code. */
export function sxAsync(): PrLog {
  const log = new PrLog();
  const run = async () => {
    const seen: string[] = [];
    outer: for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const v = await Promise.resolve(i * 10 + j);
        if (j === 1) continue outer;
        if (i === 2) break outer;
        seen.push(`${v}`);
      }
    }
    log.push(`labels ${seen.join(",")}`);
    let s = "";
    s ||= await Promise.resolve("awaited");
    log.push(`or ${s}`);
    const v = (await Promise.resolve("")) || "fallback";
    const w = (await Promise.resolve(0)) && 5;
    log.push(`values ${v} ${w}`);
  };
  run().then(
    () => log.push("done"),
    (e: Error) => log.push(`failed: ${e.message}`),
  );
  return log;
}
