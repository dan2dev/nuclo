// Statements and literal forms: `<T>x` assertions, `var` scoping and hoisting, number literal forms, values typed
// exactly null / undefined, `for…in` and Object.keys / values / entries in JavaScript's key order.

export function assertions(): string[] {
  const text: string | null = "abc";
  const s = <string>text;
  const n = <number>(<unknown>7) as number;
  const half = <number>7 / 2;
  return [`${s} ${s.length}`, `${n + 1}`, `${half}`, `${(text as string).toUpperCase()} ${(<string>text).toUpperCase()}`];
}

function varAfterBlock(c: boolean): string {
  if (c) {
    var picked = "then";
  } else {
    var picked = "else";
  }
  return picked;
}

function varLoop(n: number): number {
  var last = -1;
  for (var i = 0; i < n; i++) {
    var last = i * 2;
  }
  return i * 100 + last;
}

function varClosures(): string {
  const out: number[] = [];
  const reads: (() => number)[] = [];
  for (var k = 0; k < 3; k++) {
    var twice = k * 2;
    reads.push(() => twice + k);
  }
  for (const r of reads) out.push(r());
  return out.join(",");
}

function varRedeclared(): number {
  var x = 1;
  var x = x + 10;
  {
    var y = x * 2;
  }
  return y;
}

function varNullable(c: boolean): string {
  if (c) {
    var found: string | undefined = "yes";
  }
  return found ?? "none";
}

function varWhile(): string {
  let n = 0;
  var acc: number[] = [9];
  while (n < 3) {
    var acc: number[] = [];
    acc.push(n);
    n++;
  }
  return `${acc.length} ${acc[0] ?? -1}`;
}

function varSwitch(k: number): number {
  switch (k) {
    case 1:
      var r = 10;
      break;
    default:
      r = 20;
  }
  return r;
}

function varCounter(): () => number {
  var count = 0;
  return () => {
    count += 1;
    return count;
  };
}

export function vars(): string[] {
  const next = varCounter();
  next();
  return [
    varAfterBlock(true), varAfterBlock(false), `${varLoop(4)}`, `${varLoop(0)}`, varClosures(), `${varRedeclared()}`,
    varNullable(true), varNullable(false), varWhile(), `${varSwitch(1)} ${varSwitch(2)}`, `${next()}`,
  ];
}

export function numberLiterals(): string[] {
  const bin = 0b1010;
  const oct = 0o744;
  const big = 1_000_000;
  const hex = 0xff_ff;
  const exp = 1e3;
  const small = 2.5e-3;
  const huge = 1e21;
  const wide = 3e9;
  const frac = 1_0.5_5;
  const odd = 0B11 + 0O17;
  const mixed = bin * oct + big / 4;
  let count = 0b1;
  count += 0o10;
  return [
    `${bin} ${oct} ${big} ${hex} ${exp}`, `${small} ${huge} ${wide} ${frac} ${odd}`, `${mixed} ${count}`,
    `${bin / 4} ${oct % 7} ${exp / 7}`, `${Number.isInteger(exp)} ${0x7fff_ffff} ${0x8000_0000}`,
  ];
}

export function nullTyped(): string[] {
  const n: null = null;
  let u: undefined;
  let m: null = null;
  m = null;
  const maybe: string | null = n;
  const pick = (s: string | null) => s ?? "default";
  const items: (number | null)[] = [1, n, 3];
  return [
    `${n} ${u} ${m}`, `${n === null} ${u === undefined} ${n == undefined} ${n !== null}`, `${maybe ?? "nothing"}`,
    pick(n), `${items.length} ${items.filter((x) => x === null).length}`, `${n ?? 5}`, `${u ?? "u"}`, `${n ? "truthy" : "falsy"}`,
  ];
}

interface Point {
  x: number;
  y: number;
  label: string;
}

type Size = {
  w: number;
  h: number;
};

type Names = {
  first: string;
  last: string;
};

class Counted {
  static made = 0;
  total = 0;
  note?: string;
  #secret = 1;
  step = 0.5;
  get doubled(): number {
    return this.step * 2 + this.#secret;
  }
  constructor(public start: number) {}
}

class Base {
  total = 0;
  constructor(public start: number) {}
}

class Labeled extends Base {
  tag = "t";
  constructor() {
    super(3);
  }
}

export function mapKeys(): string[] {
  const m: Record<string, number> = { b: 1, "10": 2, a: 3, "2": 4, "-1": 5, "01": 6, "4294967294": 7, "4294967295": 8, "1.5": 9, 0: 10 };
  const out: string[] = [Object.keys(m).join(","), Object.values(m).join(",")];
  delete m["b"];
  m["b"] = 11;
  m["a"] = 12;
  m["7"] = 13;
  out.push(Object.keys(m).join(","), Object.values(m).join(","));
  const seen: string[] = [];
  for (const k in m) {
    if (k === "10") delete m["a"];
    if (k === "b") m["late"] = 1;
    seen.push(`${k}=${m[k] ?? -1}`);
  }
  out.push(seen.join(" "), `${"late" in m} ${Object.keys(m).length}`);
  const pairs: string[] = [];
  for (const [k, v] of Object.entries(m)) {
    m[k] = v * 2;
    pairs.push(`${k}:${v}`);
  }
  out.push(pairs.join(" "), Object.values(m).join(","));
  const words: Record<string, string> = {};
  words["z"] = "last";
  words["3"] = "three";
  words["y"] = "why";
  out.push(Object.entries(words).map(([k, v]) => `${k}->${v}`).join(" "));
  const empty: Record<string, boolean> = {};
  for (const k in empty) out.push(`never ${k}`);
  out.push(`${Object.keys(empty).length}`);
  // Many deletes: the native map compacts its slots and keeps the order.
  const many: Record<string, number> = {};
  for (let i = 0; i < 40; i++) many[`k${i}`] = i;
  for (let i = 0; i < 35; i++) delete many[`k${i}`];
  many["k0"] = 100;
  out.push(`${Object.keys(many).join(",")} ${many["k37"] ?? -1} ${"k3" in many}`);
  return out;
}

function describe(p: Point): string {
  const parts: string[] = [];
  for (const k in p) parts.push(k);
  return parts.join("|");
}

export function objectKeys(): string[] {
  const p: Point = { x: 1, y: 2.5, label: "p" };
  const q: Point = { ...p, y: 4 };
  const s: Size = { w: 3, h: 4 };
  const n: Names = { first: "Ada", last: "Lovelace" };
  const c = new Counted(7);
  const l = new Labeled();
  const keys: string[] = [];
  for (const k in s) keys.push(k);
  const sizes: string[] = [];
  for (const [k, v] of Object.entries(s)) sizes.push(`${k}=${v * 2}`);
  return [
    Object.keys(p).join(","), describe(q), keys.join(","), Object.values(s).join(","), sizes.join(" "),
    Object.entries(n).map(([k, v]) => `${k}=${v}`).join(" "), Object.values(n).join(" "),
    Object.keys(c).join(","), `${c.total}`, Object.keys(l).join(","),
  ];
}
