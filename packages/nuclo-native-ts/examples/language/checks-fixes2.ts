// Fixes, round 2: behavior that differed natively. Every top-level name starts with `f2` / `F2` (one native namespace).

/** 1. Top-level variables are initialized at module load, in source order, interleaved with top-level statements. */
const f2Log: string[] = [];
function f2Note(s: string): number {
  f2Log.push(s);
  return f2Log.length;
}
const f2First = f2Note("first");
f2Note("statement");
let f2Second = f2Note("second") * 10;
f2Second += 1;
const f2Third = f2Second + f2Note("third");
class F2Statics {
  static made = f2Note("static");
  static readonly label = `label ${F2Statics.made}`;
}
const [f2A, f2B] = [f2Note("destructured"), f2Note("again")];
// Never read anywhere: JavaScript runs its initializer anyway.
const f2Unread = f2Note("unread");
if (f2Unread > 0) f2Note("if");

export function f2GlobalOrder(): string[] {
  return [...f2Log, `${f2First} ${f2Second} ${f2Third}`, `${F2Statics.made} ${F2Statics.label}`, `${f2A} ${f2B}`];
}

/** 2. Arithmetic of runtime Int values past 32 bits (Kotlin) and past 2^53 (Swift, Rust). */
function f2Mul(a: number, b: number): number {
  return a * b;
}
function f2Add3(a: number, b: number, c: number): number {
  return a + b + c;
}
function f2Int(n: number): number {
  return n;
}
export function f2IntMath(): string[] {
  const out: string[] = [];
  // Int slots (never reassigned `let`s and Int parameters hold whole numbers natively).
  let a = 46341;
  let b = 65536;
  let c = 100000;
  let d = 94906267;
  let e = 1000000000;
  out.push(`${a * a} ${b * b} ${c * c} ${a * b} ${-a * a}`);
  // Past 2^53: JavaScript rounds to the nearest double.
  out.push(`${d * d} ${d * d - d * d} ${d * d + 1}`);
  out.push(`${f2Mul(c, c)} ${f2Mul(d, d)} ${f2Mul(f2Int(3), 7)}`);
  out.push(`${e + e} ${e + e + e} ${-e - e - e} ${f2Add3(e, e, e)} ${e - -e}`);
  // An index product stays usable as an index.
  const grid = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const width = f2Int(3);
  let sum = 0;
  for (let row = 0; row < 3; row++) for (let col = 0; col < width; col++) sum += grid[row * width + col]!;
  out.push(`${sum} ${grid[width * 2]!} ${grid.length * grid.length}`);
  const twice = a * 2;
  const big = e * 3;
  out.push(`${twice} ${big} ${big % 7} ${(c * c) % 1000007} ${e * 2 + e * 2}`);
  let k = 0;
  for (let i = 0; i < 5; i++) k = i * 1000000000;
  out.push(`${k} ${k / 2}`);
  // `%` of a sum that may pass 32 bits stays an Int (computed in 64 bits); `%` binds tighter than `+`, also on Doubles.
  let h = 7;
  for (let i = 0; i < 1000; i++) h = (h * 31 + i * 1000) % 1000003;
  let f = 0.5;
  for (let i = 0; i < 10; i++) f = (f + i * 2.5) % 7.25;
  out.push(`${h} ${f} ${(d * 3 - e) % 97} ${(e - d * 3) % 97} ${f2Int(5) + (c * c) % 7}`);
  return out;
}

/** 3. `push` / `unshift` as a value: the new length. */
export function f2PushValue(): string[] {
  const out: string[] = [];
  const xs: number[] = [1, 2];
  const n = xs.push(3);
  out.push(`${n} ${xs.push(4, 5)} ${xs.unshift(0)} ${xs.length}`);
  if (xs.push(6) > 6) out.push("grew");
  const words: string[] = [];
  const add = (w: string) => words.push(w);
  out.push(`${add("a")} ${add("b")} ${words.join(",")}`);
  let total = 0;
  for (let i = 0; i < 3; i++) total += words.push(`w${i}`);
  out.push(`${total} ${words.length}`);
  out.push(`${xs.join(",")}`);
  return out;
}

/** 4. A function-typed variable takes the number kinds of the functions stored in it. */
class F2Waiter {
  done: (v: number) => void = () => {};
  waiting = true;
  readonly result: Promise<number>;
  constructor() {
    this.result = new Promise<number>((resolve) => {
      this.done = resolve;
    });
    this.waiting = false;
  }
}
let f2Keep: (v: number) => void = () => {};
const f2Promised = new Promise<number>((resolve) => {
  f2Keep = resolve;
});
export function f2FnSlots(): string[] {
  const out: string[] = [];
  let show: (v: number) => string = (v) => `int ${v}`;
  out.push(show(3));
  const half = (v: number): string => `half ${v / 2}`;
  show = half;
  out.push(show(3));
  let apply: (v: number) => number = (v) => v + 1;
  out.push(`${apply(2)}`);
  apply = (v) => v * 0.5;
  out.push(`${apply(3)}`);
  const fns: ((v: number) => string)[] = [(v) => `a ${v}`];
  fns.push((v) => `b ${v / 4}`);
  for (const f of fns) out.push(f(2));
  // Called with a non-whole number: the slot's parameter is a Double.
  let twice: (v: number) => number = (v) => v * 2;
  out.push(`${twice(1.25)}`);
  let log: (v: number) => void = (v) => {
    out.push(`log ${v}`);
  };
  log(1);
  const later = new Promise<number>((resolve) => {
    log = resolve;
  });
  // Only ever called with whole numbers, but holding a Promise<number>'s resolve, which takes a Double.
  log(2);
  const f2Box = new F2Waiter();
  f2Box.done(3);
  out.push(`${later === later} ${f2Box.waiting}`);
  f2Keep(2.5);
  out.push(`${f2Promised === f2Promised}`);
  return out;
}

/** 5. An interface holding an app class instance: built and read, not decoded from JSON. */
class F2Person {
  constructor(public name: string) {}
  greet(): string {
    return `hi ${this.name}`;
  }
}
interface F2Holder {
  title: string;
  owner: F2Person;
  others: F2Person[];
}
interface F2Plain {
  id: number;
  tags: string[];
}
export function f2ClassField(): string[] {
  const h: F2Holder = { title: "t", owner: new F2Person("ann"), others: [new F2Person("bo")] };
  const plain: F2Plain = { id: 1, tags: ["x"] };
  return [`${h.title} ${h.owner.greet()} ${h.others.length}`, `${plain.id} ${plain.tags.join(",")}`];
}

/** 6. Optional function-typed fields: tested against null, and called optionally inside a longer chain. */
interface F2Hooks {
  label?: () => string;
  count: number;
}
class F2Widget {
  onTap: (() => void) | null = null;
  render: ((n: number) => string) | null = null;
  taps = 0;
}
export function f2OptionalFns(): string[] {
  const out: string[] = [];
  const w = new F2Widget();
  out.push(`${w.onTap !== null} ${w.render === null}`);
  w.onTap = () => {
    w.taps++;
  };
  if (w.onTap !== null) {
    out.push(`set ${w.onTap !== null}`);
    w.onTap();
  }
  w.render = (n) => `r${n}`;
  if (w.render) out.push(`${w.render !== null} ${w.render(2)}`);
  const hooks: F2Hooks = { count: 1 };
  out.push(`${hooks.label?.().length ?? 0} ${hooks.label === undefined}`);
  hooks.label = () => "four";
  out.push(`${hooks.label?.().length ?? 0} ${hooks.label?.().toUpperCase() ?? "-"} ${w.render?.(3).length ?? -1}`);
  out.push(`${w.taps}`);
  return out;
}

/** 7. A default parameter that runs the app's code (makes an object, calls a function, reads a global): each call. */
interface F2Pizza {
  size: string;
  toppings: string[];
  extraCheese: boolean;
}
let f2Made = 0;
function f2Size(): string {
  f2Made++;
  return f2Made > 1 ? "l" : "m";
}
function f2Describe(order: F2Pizza = { size: f2Size(), toppings: [], extraCheese: false }, note: string = `#${f2Made}`, count = 1): string {
  order.toppings.push("x");
  return `${order.size} ${order.toppings.length} ${order.extraCheese} ${note} ${count}`;
}
function f2Size2(order: F2Pizza = { size: f2Size(), toppings: [], extraCheese: true }): string {
  return order.size;
}
export function f2Defaults(): string[] {
  const mine: F2Pizza = { size: "s", toppings: ["a"], extraCheese: true };
  const out = [f2Describe(), f2Describe(), f2Describe(mine), f2Describe(mine, "n"), f2Describe(undefined, "u", 2), `${mine.toppings.length} ${f2Made}`];
  // Passed and kept as a function value: called with an argument, so no default.
  const sizeOf: (p: F2Pizza) => string = f2Size2;
  out.push([mine].map(f2Size2).join(","), sizeOf(mine), f2Size2(), `${f2Made}`);
  return out;
}

/** 7. A variable named like one holding an object elsewhere, reassigned: no false cycle (scope-aware). */
export function f2ShadowedOwner(): string[] {
  let w = 1;
  for (let i = 0; i < 3; i++) w = w * 2;
  const tapped = new F2Widget();
  const x = tapped;
  x.onTap = () => {
    x.taps++;
  };
  x.onTap();
  return [`${w} ${tapped.taps}`];
}
