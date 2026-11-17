/**
 * Language round 4: assignments and `++` / `--` used as values. Every top-level name starts with `Lg4` / `lg4`.
 */

class Lg4Reader {
  private i = 0;
  constructor(private readonly items: string[]) {}
  next(): string | null {
    return this.i < this.items.length ? this.items[this.i++]! : null;
  }
}

class Lg4Counter {
  static created = 0;
  static get total(): number {
    return Lg4Counter.created * 10;
  }
  static set total(v: number) {
    Lg4Counter.created = v / 10;
  }
  count = 0;
  last = "";
  readonly log: string[] = [];
  bump(): number {
    return ++this.count;
  }
}

let lg4Calls = 0;
function lg4Index(i: number): number {
  lg4Calls++;
  return i;
}

export function lg4AssignValues(): string[] {
  const out: string[] = [];
  // while ((x = next()) !== null)
  const r = new Lg4Reader(["a", "b", "c"]);
  let line: string | null;
  let seen = "";
  while ((line = r.next()) !== null) seen += line.toUpperCase();
  out.push(seen, `${line}`);
  // a = b = c, chained through fields and elements
  let a = 0;
  let b = 0;
  const c = new Lg4Counter();
  a = b = c.count = 7;
  out.push(`${a} ${b} ${c.count}`);
  const xs = [1, 2, 3];
  xs[0] = xs[2] = a + 0.5;
  out.push(xs.join(","));
  // f(x = 1), template, condition, return
  const show = (n: number, s: string) => `${s}=${n}`;
  let n = 1;
  out.push(show((n = 41 + n), "n"), `${(n = n * 2)}`, `${n}`);
  if ((n = 0)) out.push("never");
  else out.push(`zero ${n}`);
  // compound assignments as values
  let total = 0;
  const parts: number[] = [];
  for (const v of [5, 10, 20]) parts.push((total += v));
  out.push(parts.join(","), `${total}`);
  let s = "x";
  out.push(`${(s += "y")}${(s += "z")} ${s}`);
  let d = 10;
  out.push(`${(d /= 4)} ${(d *= 3)} ${(d -= 0.5)} ${(d %= 2)} ${(d **= 2)}`);
  let bits = 6;
  out.push(`${(bits |= 1)} ${(bits &= 5)} ${(bits <<= 2)} ${(bits >>= 1)} ${(bits ^= 3)}`);
  // logical assignments as values
  let maybe: string | null = null;
  out.push(`${(maybe ??= "first")} ${(maybe ??= "second")}`);
  let flag = 0;
  out.push(`${(flag ||= 3)} ${(flag &&= 9)} ${flag}`);
  // assignment into a nullable slot: the value is the right side's
  let slot: number | null = null;
  const got = (slot = 3) + 1;
  out.push(`${got} ${slot}`);
  // object and string values
  let current = new Lg4Counter();
  const prev = current;
  out.push(`${(current = new Lg4Counter()) === prev} ${current.bump()} ${prev.count}`);
  let word = "";
  const words = ["one", "two"].map((w) => (word = w + "!"));
  out.push(words.join(" "), word);
  return out;
}

export function lg4Increments(): string[] {
  const out: string[] = [];
  const xs = [10, 20, 30];
  lg4Calls = 0;
  // ++ / += on computed targets: object and index evaluated once, first
  const a = xs[lg4Index(1)]!++;
  const b = ++xs[lg4Index(2)]!;
  const c = (xs[lg4Index(0)]! += 5);
  out.push(`${a} ${b} ${c} ${xs.join(",")} calls ${lg4Calls}`);
  const counters = [new Lg4Counter(), new Lg4Counter()];
  const k = counters[lg4Index(1)]!.count++;
  out.push(`${k} ${counters[1]!.count} calls ${lg4Calls}`);
  // a static getter / setter
  Lg4Counter.created = 2;
  const t1 = Lg4Counter.total++;
  const t2 = Lg4Counter.total--;
  out.push(`${t1} ${t2} ${Lg4Counter.created} ${Lg4Counter.total}`);
  // bigints
  let big = 9007199254740993n;
  const b1 = big++;
  const b2 = --big;
  out.push(`${b1} ${b2} ${big}`);
  // map entries
  const m: Record<string, number> = { a: 1 };
  const before = m["a"]!++;
  out.push(`${before} ${m["a"]}`);
  // in loop conditions and indexes
  let i = 0;
  const seen: number[] = [];
  while (i++ < 3) seen.push(i);
  const ys = [0, 0, 0, 0];
  let j = 0;
  ys[j++] = j;
  ys[j++] = j;
  out.push(seen.join(","), ys.join(","), `${i} ${j}`);
  return out;
}

export function lg4Destructure(): string[] {
  const out: string[] = [];
  let x = 1;
  let y = 2;
  const pair = ([x, y] = [y, x]);
  out.push(`${x} ${y} ${pair.join("/")}`);
  let p = 0;
  let q = 0;
  const point = { p: 5, q: 6 };
  const same = ({ p, q } = point);
  out.push(`${p} ${q} ${same === point}`);
  // As an argument; a typed array element as a value (converted as the array stores it).
  const show = (xs: number[]) => xs.join(",");
  out.push(show(([x, y] = [y, x])), `${x} ${y}`);
  const bytes = new Uint8Array([255, 7]);
  const was = bytes[0]!++;
  const now = bytes[1]!--;
  out.push(`${was} ${bytes[0]} ${now} ${bytes[1]} ${(bytes[0] = 300)} ${bytes[0]}`);
  return out;
}
