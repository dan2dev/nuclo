/**
 * Round 5 bug fixes: each check covers a bug that compiled to invalid native code or printed something else than bun.
 * Every top-level name starts with `Bg` / `bg`. See bugs.md in the notes folder.
 */
import { BgShape } from "./bugs-types-only.ts";
import { PrLog } from "./checks-promises.ts";
import { setTimeout } from "../../src/index.ts";

/** M2: what bugs-types-only.ts (imported here only for a type) would log if it were evaluated. */
export const bgModuleLog: string[] = [];

export function bgTypesOnly(): string[] {
  const s: BgShape = { bgW: 2 };
  return [`${s.bgW} [${bgModuleLog.join(", ")}]`];
}

function bgPick(a: number | undefined, fallback?: number): number {
  const v = a ?? fallback;
  return v ?? -1;
}

function bgPick2(a: number | undefined, fallback?: number): number | undefined {
  return a ?? fallback;
}

/** B1: `a ?? b` where `b` is an optional number parameter. */
export function bgCoalesce(): string[] {
  const out: string[] = [];
  out.push(`${bgPick(2)} ${bgPick(undefined, 2.5)} ${bgPick(undefined)} ${bgPick(1, 7)}`);
  out.push(`${bgPick2(undefined, 1.5)} ${bgPick2(4)} ${bgPick2(undefined)}`);
  return out;
}

/** B2: destructuring an array of string arrays (a literal) in for-of. */
export function bgForOfPairs(): string[] {
  const out: string[] = [];
  for (const [x, y] of [["a", "b"], ["c", "d"]]) out.push(`${x}${y}`);
  const pairs = [["k", "v"], ["k2", "v2"]];
  for (const [k, v] of pairs) out.push(`${k}=${v}`);
  for (const [n, m] of [[1, 2.5], [3, 4]]) out.push(`${n! + m!}`);
  return out;
}

/** B3, B4, B5: local functions and closures calling each other, or reading a local declared after them. */
export function bgLocalFns(): string[] {
  const out: string[] = [];
  function bgEven(n: number): boolean {
    return n === 0 ? true : bgOdd(n - 1);
  }
  function bgOdd(n: number): boolean {
    return n === 0 ? false : bgEven(n - 1);
  }
  out.push(`${bgEven(10)} ${bgOdd(7)} ${bgEven(3)}`);
  function twice(): number {
    return base * 2;
  }
  const base = 21;
  out.push(`${twice()}`);
  const parseOr = (s: string[]): number => (s.length > 2 ? parseAnd(s.slice(1)) : s.length);
  const parseAnd = (s: string[]): number => (s.length > 0 ? parseOr(s.slice(1)) + 10 : 0);
  out.push(`${parseOr(["a", "b", "c", "d", "e"])} ${parseAnd(["x"])}`);
  return out;
}

/** B6: user names the generated code also uses. */
export function bgNames(): string[] {
  const out: string[] = [];
  const it = 5;
  const self = 3;
  const xs = [1, 2, 3].map((x) => x + it + self);
  out.push(xs.join(","));
  const items = ["p", "q"];
  for (const it of items) out.push(it.toUpperCase());
  return out;
}

/** B7: a function-typed variable taking a number gets a fraction. */
export function bgFnVar(): string[] {
  const out: string[] = [];
  let cb: (v: number) => void = (v) => {
    out.push(`first ${v}`);
  };
  cb(1);
  cb = (v) => {
    out.push(`second ${v}`);
  };
  cb(1.5);
  return out;
}

/** N3, N4: remainders. */
export function bgRemainders(): string[] {
  const out: string[] = [];
  let z = 0;
  for (let i = 0; i < 3; i++) z = z * 2;
  const n = 7;
  out.push(`${n % z} ${-4 % 2} ${Object.is(-4 % 2, -0)} ${1 / (-4 % 2)}`);
  let k = -6;
  const d = 3;
  out.push(`${1 / (k % d)} ${Object.is(k % d, -0)}`);
  k = 7;
  out.push(`${k % d}`);
  return out;
}

/** N1: counters past 2^31. */
export function bgCounters(): string[] {
  const out: string[] = [];
  let c = 2147483640;
  for (let i = 0; i < 20; i++) c++;
  out.push(`${c}`);
  let big = 1;
  for (let i = 0; i < 40; i++) big = big * 2;
  out.push(`${big}`);
  let m = 65536;
  const q = m * m;
  out.push(`${q} ${m * 70000}`);
  m += 1;
  return out;
}

function bgOr(a?: number, b?: number): number {
  return a ?? b ?? 0;
}

function bgOrMaybe(a: number | undefined, b?: number): number | undefined {
  const r = a ?? b;
  return r;
}

/** B1: `??` between an Int optional and a Double optional parameter. */
export function bgCoalesceKinds(): string[] {
  const out: string[] = [];
  out.push(`${bgOr(1)} ${bgOr(undefined, 2.5)} ${bgOr()} ${bgOrMaybe(3, 1.5)} ${bgOrMaybe(undefined, 0.5)} ${bgOrMaybe(undefined)}`);
  let total: number | undefined = undefined;
  for (let i = 0; i < 3; i++) total = (total ?? 0) + i;
  const frac: number | undefined = total === 3 ? 0.25 : undefined;
  out.push(`${total ?? frac} ${frac ?? total} ${(frac ?? 1) * 2}`);
  return out;
}

function* bgInner(log: string[]): Generator<number, string, undefined> {
  try {
    yield 1;
    yield 2;
  } finally {
    log.push("inner finally");
  }
  return "inner done";
}

function* bgInnerOverride(log: string[]): Generator<number, string, undefined> {
  try {
    yield 1;
  } finally {
    log.push("override finally");
    // eslint-disable-next-line no-unsafe-finally
    return "overridden";
  }
}

function* bgInnerYields(log: string[]): Generator<number, string, undefined> {
  try {
    yield 1;
  } finally {
    log.push("yields in finally");
    yield 99;
  }
  return "after";
}

function* bgOuter(log: string[], which: number): Generator<number, string, undefined> {
  try {
    let r = "";
    if (which === 0) r = yield* bgInner(log);
    else if (which === 1) r = yield* bgInnerOverride(log);
    else r = yield* bgInnerYields(log);
    log.push(`outer got ${r}`);
  } finally {
    log.push("outer finally");
  }
  return "outer done";
}

/** G1: `return()` while delegating. */
export function bgReturnDelegating(): string[] {
  const out: string[] = [];
  for (let which = 0; which < 3; which++) {
    const log: string[] = [];
    const g = bgOuter(log, which);
    const a = g.next();
    const b = g.return("stop");
    const c = g.next();
    const d = g.next();
    out.push(`${which}: ${a.done ? "D" : a.value} | ${b.done ? `D ${b.value}` : b.value} | ${c.done ? `D ${c.value ?? "-"}` : c.value} | ${d.done ? "D" : d.value} | ${log.join(", ")}`);
  }
  return out;
}

class BgBoom extends Error {}

function* bgThrowingReturn(): Generator<number, void, undefined> {
  try {
    yield 1;
    yield 2;
  } finally {
    // eslint-disable-next-line no-unsafe-finally
    throw new BgBoom("from return");
  }
}

/** G2: a for-of body throws and the generator's `return()` throws too: the body's error wins. */
export function bgThrowingClose(): string[] {
  const out: string[] = [];
  try {
    for (const v of bgThrowingReturn()) {
      out.push(`v ${v}`);
      throw new Error("from body");
    }
  } catch (e) {
    out.push(`caught ${e instanceof Error ? e.message : "?"}`);
  }
  try {
    for (const v of bgThrowingReturn()) {
      out.push(`v ${v}`);
      break;
    }
  } catch (e) {
    out.push(`caught ${e instanceof Error ? e.message : "?"}`);
  }
  return out;
}

/** B7: a Promise<number>'s `resolve` kept in a `(v: number) => void` variable, resolved with a fraction. */
export function bgResolveKept(): PrLog {
  const log = new PrLog();
  let keep: (v: number) => void = () => {};
  const p = new Promise<number>((resolve) => {
    keep = resolve;
  });
  p.then((v) => {
    log.push(`resolved ${v}`);
    log.push("done");
  });
  keep(2.5);
  log.push("sync end");
  return log;
}

class BgPoint {
  constructor(public bgX: number) {}
}

interface BgHolder {
  bgName: string;
  bgPoint: BgPoint;
}

/** O5: an interface with a field of a class type (no JSON decoder can be made for it). */
export function bgClassField(): string[] {
  const h: BgHolder = { bgName: "h", bgPoint: new BgPoint(1.5) };
  return [`${h.bgName} ${h.bgPoint.bgX}`];
}

/** T1: invalid array lengths throw a RangeError JavaScript can catch. */
export function bgArrayLength(): string[] {
  const out: string[] = [];
  for (const n of [-1, 2.5, NaN, 3]) {
    try {
      const xs = new Array<number>(n).fill(0);
      out.push(`len ${xs.length}`);
    } catch (e) {
      out.push(`${e instanceof RangeError ? "RangeError" : "other"}`);
    }
  }
  return out;
}

function bgPad(s: string, n: number): string {
  return s + "-".repeat(n);
}

function bgCells(n: number): number[] {
  return new Array<number>(n).fill(1);
}

function bgFixed(x: number, digits: number): string {
  return bgPad(x.toFixed(digits), 0);
}

/** T2: library RangeErrors thrown in a function whose caller catches them. */
export function bgCaughtInCaller(): string[] {
  const out: string[] = [];
  for (const n of [2, -1]) {
    try {
      out.push(`${bgPad("a", n)} ${bgCells(n + 1).length}`);
    } catch (e) {
      out.push(`caught ${e instanceof RangeError ? "RangeError" : "other"}`);
    }
  }
  for (const d of [1, 101]) {
    try {
      out.push(bgFixed(2.25, d));
    } catch (e) {
      out.push(`caught ${e instanceof RangeError ? "RangeError" : "other"}`);
    }
  }
  out.push(bgPad("ok", 1));
  return out;
}

/** A1: timers run by due time, then in the order they were set (equal deadlines; an earlier one set later). */
export function bgTimerOrder(): PrLog {
  const log = new PrLog();
  const order: string[] = [];
  for (const name of ["a", "b", "c"]) setTimeout(() => order.push(name), 20);
  setTimeout(() => order.push("early"), 5);
  setTimeout(() => {
    log.push(order.join(" "));
    log.push("done");
  }, 60);
  return log;
}

/** `Number(x)` of a number (Int or Double), a boolean and text. */
export function bgNumberOf(): string[] {
  let n = 0;
  for (let i = 0; i < 4; i++) n += i;
  const d = n / 4;
  const flag = n > 3;
  return [`${Number(n)} ${Number(d)} ${Number(flag)} ${Number("0x1f")} ${Number(n) / 4}`];
}
