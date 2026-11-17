// rest2: unions compared with == / switch, their text when they hold objects or arrays, indexOf / includes on arrays of them.

class R2Point {
  constructor(
    readonly x: number,
    readonly y: number,
  ) {}
}

class R2Labeled {
  constructor(readonly name: string) {}
  toString(): string {
    return `Named(${this.name})`;
  }
}

class R2Base {
  label(): string {
    return "base";
  }
}

type R2Val = string | number | boolean;
type R2Any = string | number | R2Point | number[];

function r2Loose(a: R2Val, b: R2Val): string {
  return `${a == b}/${a != b}`;
}

function r2Kind(v: R2Val): string {
  switch (v) {
    case "a":
      return "letter a";
    case 1:
    case 2:
      return "one or two";
    case true:
      return "yes";
    default:
      if (typeof v === "number" && v > 100) break;
      return `other ${v}`;
  }
  return "big";
}

let r2Calls = 0;
function r2Tick(n: number): number {
  r2Calls++;
  return n;
}

export function r2UnionEquality(): string[] {
  const out: string[] = [];
  out.push(r2Loose(1, "1"), r2Loose(0, ""), r2Loose(1, true), r2Loose("1", true), r2Loose(0, false), r2Loose("", false));
  out.push(r2Loose(" 2 ", 2), r2Loose("x", 0), r2Loose("abc", "abc"), r2Loose(true, true), r2Loose(NaN, NaN), r2Loose("0x10", 16));
  out.push(r2Loose(-0, 0), r2Loose("1e3", 1000), r2Loose("true", true));
  const p = new R2Point(1, 2);
  const any = (v: R2Any): R2Any => v;
  const q = any(p);
  const r = any("[object Object]");
  const s = any([1, 2]);
  const t = any("1,2");
  const u = any([7]);
  const w = any(7);
  out.push(`${q == r} ${q == q} ${s == t} ${u == w} ${s == s} ${q != r}`);
  for (const v of [1, 2, 3, "a", "b", true, false, 500] as R2Val[]) out.push(r2Kind(v));
  // Case expressions run in order until one matches.
  r2Calls = 0;
  const n: string | number = 2;
  switch (n as string | number) {
    case r2Tick(1):
      out.push("1");
      break;
    case r2Tick(2):
      out.push("2");
      break;
    case r2Tick(3):
      out.push("3");
      break;
  }
  out.push(`calls ${r2Calls}`);
  const pick = (v: string | number | null): string | number | null => v;
  const maybe = pick(null);
  switch (maybe) {
    case null:
      out.push("null case");
      break;
    case 1:
      out.push("one");
      break;
  }
  out.push(`${maybe == null} ${maybe == undefined}`);
  return out;
}

export function r2UnionText(): string[] {
  const out: string[] = [];
  const values: (R2Any | R2Labeled)[] = [new R2Point(1, 2), [1, 2.5, 3], "s", 4, new R2Labeled("n"), []];
  for (const v of values) out.push(`[${v}] ${String(v)}`);
  const nested: (number[] | string)[][] = [[[1, 2], "x"], []];
  out.push(`${nested}|${nested.length}`);
  const objs: R2Point[] = [new R2Point(0, 0), new R2Point(1, 1)];
  out.push(`${objs}`, objs.join(" & "), `${[new R2Labeled("a"), new R2Labeled("b")]}`);
  const named = new R2Labeled("solo");
  out.push(`${named} ${new R2Point(3, 4)} ${new R2Base()}`);
  const maybeObj: R2Point | string | undefined = Math.random() > 2 ? "no" : undefined;
  out.push(`${maybeObj ?? "none"}`);
  return out;
}

export function r2UnionSearch(): string[] {
  const out: string[] = [];
  const p = new R2Point(1, 2);
  const xs: (string | number)[] = [1, "1", 2, NaN, "two", 1];
  out.push(`${xs.indexOf(1)} ${xs.indexOf("1")} ${xs.lastIndexOf(1)} ${xs.indexOf(NaN)} ${xs.includes(NaN)} ${xs.includes("two")} ${xs.includes(3)}`);
  out.push(`${xs.indexOf(1, 1)} ${xs.indexOf(1, -1)} ${xs.lastIndexOf(1, -2)} ${xs.includes(1, 6)} ${xs.indexOf("1", -100)} ${xs.lastIndexOf(2, 100)}`);
  const objs: (R2Point | string)[] = ["a", p, new R2Point(1, 2)];
  out.push(`${objs.indexOf(p)} ${objs.includes(new R2Point(1, 2))} ${objs.indexOf("a")} ${objs.lastIndexOf(p)}`);
  const one: number | string = 2;
  out.push(`${xs.indexOf(one)} ${xs.includes(one)}`);
  return out;
}
