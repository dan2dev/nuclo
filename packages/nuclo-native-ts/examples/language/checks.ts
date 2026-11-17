/**
 * The TypeScript the compiler translates, one group per feature. Each group returns the lines it
 * prints: every target must print exactly what TypeScript prints (compare with `bun` on this file).
 */
import * as shapes from "./shapes.ts";

// ───────────────────────────── Enums ─────────────────────────────

enum Direction {
  Up,
  Down,
  Left = 10,
  Right,
}
enum Color {
  Red = "red",
  Green = "green",
}

function describeColor(color: Color): string {
  switch (color) {
    case Color.Red:
      return "warm";
    case Color.Green:
      return "fresh";
  }
}

export function enums(): string[] {
  let dir = Direction.Down;
  dir = dir + 1;
  const colors = [Color.Red, Color.Green];
  return [`${Direction.Up} ${dir} ${Direction.Left} ${Direction.Right}`, colors.map((c) => `${c}=${describeColor(c)}`).join(" ")];
}

// ───────────────────────────── Modules ─────────────────────────────

export function namespaces(): string[] {
  const square = shapes.square(3);
  return [`${shapes.unit} area ${shapes.area(square)}`, [1, 2].map(shapes.twice).join(",")];
}

// ───────────────────────────── Destructuring ─────────────────────────────

interface Point {
  x: number;
  y: number;
  label?: string;
}
interface Segment {
  from: Point;
  to: Point;
}

function segmentLength({ from, to }: Segment): number {
  const { x: x1, y: y1 } = from;
  const { x: x2, y: y2 } = to;
  return Math.hypot(x2 - x1, y2 - y1);
}

export function destructuring(): string[] {
  const seg: Segment = { from: { x: 0, y: 0 }, to: { x: 3, y: 4, label: "B" } };
  const {
    to: { label = "?" },
    from: { label: start = "origin" },
  } = seg;
  const [first, , third = 30, ...rest] = [1, 2];
  const [p, q, ...others] = [5, 6, 7, 8];
  const pairs: Point[] = [{ x: 1, y: 2 }, { x: 3, y: 4 }];
  let sum = 0;
  for (const { x, y } of pairs) sum += x * y;
  const ages: Record<string, number> = { ana: 31 };
  const { ana, rui = 0 } = ages;
  return [`length ${segmentLength(seg)} ${start}→${label}`, `first ${first ?? -1} third ${third} rest [${rest.join("+")}] ${p ?? 0}${q ?? 0} ${others.join("+")}`, `sum ${sum} ana ${ana ?? -1} rui ${rui}`];
}

// ───────────────────────────── Spread and rest ─────────────────────────────

interface Settings {
  theme: string;
  size: number;
  bold: boolean;
}

function total(label: string, ...amounts: number[]): string {
  let t = 0;
  for (const a of amounts) t += a;
  return `${label}=${t} (${amounts.length})`;
}

export function spreadAndRest(): string[] {
  const base: Settings = { theme: "light", size: 12, bold: false };
  const dark: Settings = { ...base, theme: "dark" };
  const overridden: Settings = { ...dark, ...base, size: 20 };
  const a = [1, 2];
  const b = [3];
  const all = [0, ...a, ...b, 4];
  const more = a.concat(b, [9]);
  return [
    `${dark.theme} ${dark.size} ${overridden.theme} ${overridden.size}`,
    `${all.join(",")} | ${more.join(",")}`,
    `${total("none")} ${total("three", 1, 2, 3)} ${total("spread", ...all)}`,
  ];
}

// ───────────────────────────── Operators ─────────────────────────────

interface Counter {
  n: number;
}

export function operators(): string[] {
  let i = 0;
  const ids = [i++, i++, ++i, i--];
  const c: Counter = { n: 5 };
  const before = c.n++;
  const after = ++c.n;
  const xs = [10, 20, 30];
  let k = 0;
  const firstTwo = `${xs[k++]!}+${xs[k++]!}`;
  let maybe: string | null = null;
  maybe ??= "set";
  maybe ??= "ignored";
  let flag = false;
  flag ||= true;
  let n = 3;
  n **= 2;
  const power = 2 ** 10;
  const bits = [5 & 3, 5 | 3, 5 ^ 3, ~5, 1 << 4, -16 >> 2, -16 >>> 28, 2147483647 + 1 | 0];
  let mask = 0;
  mask |= 4;
  mask |= 1;
  mask <<= 1;
  return [
    `ids ${ids.join(",")} i ${i} counter ${before} ${after} ${c.n} ${firstTwo}`,
    `${maybe} ${flag} ${n} ${power}`,
    `bits ${bits.join(",")} mask ${mask}`,
    `strings ${"apple" < "banana"} ${"Zebra" < "apple"} ${"b" >= "b"}`,
  ];
}

// ───────────────────────────── Optional calls ─────────────────────────────

interface Hooks {
  onSave: ((name: string) => string) | null;
  log: (message: string) => void;
}

function findHooks(hooks: Hooks | null): Hooks | null {
  return hooks;
}

export function optionalCalls(): string[] {
  const lines: string[] = [];
  const hooks: Hooks = { onSave: null, log: (m: string) => lines.push(`log ${m}`) };
  const none = findHooks(null);
  lines.push(`no handler: ${hooks.onSave?.("a") ?? "skipped"}`);
  hooks.onSave = (name: string) => `saved ${name}`;
  lines.push(`handler: ${hooks.onSave?.("b") ?? "skipped"}`);
  hooks.log("direct");
  none?.log("never");
  const maybeHooks = findHooks(hooks);
  maybeHooks?.log("through optional");
  return lines;
}

// ───────────────────────────── Loops ─────────────────────────────

export function loops(): string[] {
  const out: string[] = [];
  for (let i = 10; i > 0; i -= 3) out.push(`${i}`);
  const evens: number[] = [];
  for (let i = 0; i < 10; i++) {
    if (i % 2 === 1) continue;
    evens.push(i);
  }
  let steps = 0;
  for (let a = 0, b = 10; a < b; a += 2, b -= 2) steps++;
  let tries = 0;
  do {
    tries++;
  } while (tries < 3);
  let once = 0;
  do {
    once++;
  } while (false);
  // The bound changes inside the loop: it is read on every turn.
  const queue = [1, 2, 3];
  let seen = 0;
  for (let i = 0; i < queue.length; i++) {
    seen++;
    if (queue.length < 5) queue.push(i);
  }
  const loopFns: (() => number)[] = [];
  for (let i = 0; i < 3; i++) loopFns.push(() => i * 10);
  return [
    `down ${out.join(",")} evens ${evens.join(",")} steps ${steps}`,
    `do ${tries} ${once} seen ${seen} queue ${queue.join(",")}`,
    `closures ${loopFns.map((f) => f()).join(",")}`,
  ];
}

// ───────────────────────────── Errors ─────────────────────────────

let cleanups = 0;

function risky(fail: boolean): string {
  let state = "start";
  try {
    if (fail) throw new Error("boom");
    state = "ok";
  } catch (e) {
    state = `caught ${e}`;
  } finally {
    cleanups++;
  }
  return state;
}

export function errors(): string[] {
  return [`${risky(false)} / ${risky(true)} / cleanups ${cleanups}`];
}

// ───────────────────────────── Arrays ─────────────────────────────

interface Person {
  name: string;
  age: number;
}

function byAge(a: Person, b: Person): number {
  return a.age - b.age;
}

export function arrays(): string[] {
  const nums = [10, 9, 1, 100, 25];
  const people: Person[] = [
    { name: "rui", age: 30 },
    { name: "ana", age: 25 },
    { name: "eve", age: 30 },
    { name: "bob", age: 25 },
  ];
  const textOrder = nums.slice().sort();
  const numeric = nums.slice().sort((a, b) => a - b);
  const sorted = people.slice().sort(byAge);
  people.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const queue = ["a", "b", "c"];
  const head = queue.shift();
  queue.reverse();
  const sum = nums.reduce((acc, x) => acc + x, 0);
  const names = people.reduce((acc, p) => (acc === "" ? p.name : `${acc}/${p.name}`), "");
  const indexed = nums.map((x, i) => `${i}:${x}`).filter((s, i) => i % 2 === 0);
  const firstBig = nums.findIndex((x, i) => x > 20 && i > 0);
  const words = ["x", "y", "x"];
  return [
    `text ${textOrder.join(",")} numeric ${numeric.join(",")}`,
    `stable ${sorted.map((p) => p.name).join(",")} by name ${people.map((p) => p.name).join(",")}`,
    `shift ${head ?? "-"} rest ${queue.join(",")} last ${nums.at(-1) ?? 0} ${nums.at(9) ?? -1}`,
    `sum ${sum} names ${names} indexed ${indexed.join(" ")} big ${firstBig} lastIndexOf ${words.lastIndexOf("x")}`,
    `joined ${[1.5, 2, -0.25].join(";")} ${[true, false].join()}`,
  ];
}

// ───────────────────────────── Strings ─────────────────────────────

export function strings(): string[] {
  const csv = "a,b,,c,";
  const s = "  héllo wörld  ";
  const emoji = "a😀b";
  return [
    `split ${csv.split(",").length} [${csv.split(",").join("|")}] ${"abc".split("").join("-")}`,
    `replace ${"a-b-c".replace("-", "+")} ${"a-b-c".replaceAll("-", "+")} ${"x".replace("x", "[$&$$]")} ${"ab".replaceAll("", ".")}`,
    `index ${"banana".indexOf("an")} ${"banana".indexOf("an", 2)} ${"banana".lastIndexOf("an")} ${"banana".indexOf("x")}`,
    `pad [${"7".padStart(3, "0")}] [${"ab".padEnd(5, "xy")}] [${"long".padStart(2)}] ${"ab".repeat(3)}`,
    `trim [${s.trim()}] [${s.trimStart()}] [${s.trimEnd()}]`,
    `utf16 ${emoji.length} ${emoji.slice(1, 3) === "😀"} ${emoji.indexOf("b")} ${(42).toString()} ${true.toString()}`,
  ];
}

// ───────────────────────────── Maps ─────────────────────────────

export function maps(): string[] {
  const stock: Record<string, number> = { apple: 3, pear: 0 };
  const had = "pear" in stock;
  delete stock["pear"];
  return [`pear ${had} → ${"pear" in stock}, apple ${"apple" in stock}, kiwi ${"kiwi" in stock}`];
}

// ───────────────────────────── Numbers ─────────────────────────────

export function numbers(): string[] {
  const values = [Math.sign(-3), Math.cbrt(27), Math.log10(1000), Math.round(Math.atan2(1, 1) * 1000)];
  const checks = [Number.isInteger(5), Number.isInteger(5.5), Number.isNaN(0 / 0), isFinite(1 / 0)];
  return [
    `math ${values.join(",")} E ${Math.E.toFixed(5)} max ${Number.MAX_SAFE_INTEGER}`,
    `checks ${checks.join(",")} ${Number.POSITIVE_INFINITY} ${-Infinity} ${NaN}`,
    `format ${0.1 + 0.2} ${1 / 3} ${1e21} ${123456789012} ${-0.5} ${2 ** 53}`,
  ];
}

// ───────────────────────────── Classes ─────────────────────────────

interface Shape {
  readonly name: string;
  area(): number;
  describe(): string;
}

abstract class BaseShape implements Shape {
  static created = 0;
  readonly name: string;
  constructor(name: string) {
    this.name = name;
    BaseShape.created++;
  }
  abstract area(): number;
  describe(): string {
    return `${this.name} ${this.area().toFixed(2)}`;
  }
}

class Rect extends BaseShape {
  constructor(
    private w: number,
    private h: number,
  ) {
    super("rect");
  }
  area(): number {
    return this.w * this.h;
  }
  get perimeter(): number {
    return 2 * (this.w + this.h);
  }
}

class SquareShape extends Rect {
  constructor(side: number) {
    super(side, side);
  }
  override describe(): string {
    return `square ${super.describe()}`;
  }
}

class Circle extends BaseShape {
  constructor(readonly r: number) {
    super("circle");
  }
  area(): number {
    return Math.PI * this.r * this.r;
  }
}

class Tally {
  static instances = 0;
  private count = 0;
  private readonly step: number;
  readonly history: number[] = [];
  constructor(step: number) {
    this.step = step;
    Tally.instances += 1;
  }
  add(): Tally {
    this.count += this.step;
    this.history.push(this.count);
    return this;
  }
  get value(): number {
    return this.count;
  }
  later(): () => number {
    return () => this.count * 2;
  }
  static make(): Tally {
    return new Tally(10);
  }
}

interface Named {
  readonly label: string;
}
interface Account extends Named {
  balance: number;
  deposit(amount: number, note?: string): string;
}
class Savings implements Account {
  balance = 0;
  constructor(
    readonly owner: string,
    private readonly rate: number = 0.5,
  ) {}
  get label(): string {
    return `${this.owner}'s savings`;
  }
  deposit(amount: number, note: string = "cash"): string {
    this.balance += amount + amount * this.rate;
    return `${note} ${this.balance}`;
  }
}
class Kids extends Savings {
  override get label(): string {
    return `${super.deposit(0, "kid")} ${this.owner}`;
  }
}
class Link {
  next: Link | null = null;
  constructor(readonly value: number) {}
  append(value: number): Link {
    const link = new Link(value);
    link.next = this;
    return link;
  }
}

function describeAccount(named: Named): string {
  return named.label;
}

function largest(shapes: Shape[]): Shape | null {
  let best: Shape | null = null;
  for (const s of shapes) if (best === null || s.area() > best.area()) best = s;
  return best;
}

export function classes(): string[] {
  const shapes: Shape[] = [new Rect(2, 3), new SquareShape(2), new Circle(1)];
  const tally = new Tally(2).add().add();
  const made = Tally.make().add();
  const twice = tally.later();
  tally.add();
  const rect = new Rect(1, 4);
  const same: Shape = rect;
  const big = largest(shapes);
  return [
    shapes.map((s) => s.describe()).join(" | "),
    `created ${BaseShape.created} perimeter ${rect.perimeter} same ${same === rect} ${shapes[0] === shapes[1]} largest ${big ? big.name : "none"}`,
    `tally ${tally.value} [${tally.history.join(",")}] made ${made.value} later ${twice()} instances ${Tally.instances}`,
    accounts(),
  ];
}

function accounts(): string {
  const account: Account = new Savings("ana");
  const first = account.deposit(10);
  const second = account.deposit(4, "check");
  account.balance -= 1;
  const kid = new Kids("rui");
  let chain: Link | null = new Link(1).append(2).append(3);
  const values: number[] = [];
  while (chain !== null) {
    values.push(chain.value);
    chain = chain.next;
  }
  return `${first}, ${second}, ${account.balance} | ${describeAccount(account)} | ${describeAccount(kid)} | ${values.join("→")}`;
}
