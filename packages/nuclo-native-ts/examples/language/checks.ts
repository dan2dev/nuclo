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
  private static stepSize = 1;
  private static tag = "t";
  static get defaultStep(): number {
    return Tally.stepSize;
  }
  static set defaultStep(value: number) {
    Tally.stepSize = Math.max(1, value);
  }
  static get tagged(): string {
    return Tally.tag;
  }
  static set tagged(value: string) {
    Tally.tag = value.toUpperCase();
  }
  static get banner(): string {
    return `${Tally.tagged} x${Tally.defaultStep}`;
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

interface Dial {
  level: number;
}
class Thermostat implements Dial {
  private celsius = 20;
  readonly log: string[] = [];
  get level(): number {
    return this.celsius;
  }
  set level(value: number) {
    this.celsius = Math.max(10, Math.min(30, value));
    this.log.push(`${this.celsius}`);
  }
  get fahrenheit(): number {
    return (this.level * 9) / 5 + 32;
  }
  set fahrenheit(value: number) {
    // Through `this.level`: a subclass's setter runs.
    this.level = ((value - 32) * 5) / 9;
  }
}
class StepThermostat extends Thermostat {
  private steps = 0;
  override get level(): number {
    return this.steps * 5;
  }
  override set level(value: number) {
    this.steps = Math.round(value / 5);
  }
}

class BoostThermostat extends Thermostat {
  boosts = 0;
  // Through `super.level`: the base's getter and setter, on this object.
  override get level(): number {
    return super.level + 0.5;
  }
  override set level(value: number) {
    super.level = value;
    super.level += 1;
    this.boosts++;
  }
}

function thermostats(): string {
  const t = new Thermostat();
  t.level = 35;
  t.level -= 4;
  t.fahrenheit = 50;
  t.level++;
  const dial: Dial = t;
  dial.level += 0.5;
  const stepped: Dial = new StepThermostat();
  stepped.level = 22;
  const hot = new StepThermostat();
  hot.fahrenheit = 212;
  const boost: Dial = new BoostThermostat();
  boost.level = 12;
  boost.level += 40;
  const boosted = new BoostThermostat();
  boosted.fahrenheit = 59;
  return `${t.level} ${t.fahrenheit} [${t.log.join(",")}] steps ${stepped.level} ${hot.level} ${hot.fahrenheit} [${hot.log.length}] boost ${boost.level} ${boosted.level} ${boosted.fahrenheit} [${boosted.log.join(",")}] ${boosted.boosts}`;
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
    thermostats(),
    statics(),
    privates(),
    kinds([new Rect(1, 2), new SquareShape(3), new Circle(0.5), new Rect(2, 2)]),
    classExpressions(),
    `${scoreRows([30, 12.5])} | ${nameRows(["ana", "rui"])} | ${capturedCells("$", 1.5)} | ${sharedLocals(5)}`,
    `${loopClasses()} | ${loopReassigned()}`,
    `${destructuredShared([{ name: "ana", age: 30 }, { name: "rui", age: 7 }])} | ${patternLoops([3], { name: "eve", age: 3 })} | ${arrayLoops()}`,
    `${elementLoops()} | ${paramElements()}`,
    methodElements(),
  ];
}

// #private members belong to the class that declares them: a subclass's #count is another field.
class Vault {
  static #opened = 0;
  #count = 0;
  readonly #owner: string;
  constructor(owner: string) {
    this.#owner = owner;
  }
  get #secret(): string {
    return `${this.#owner}:${this.#count}`;
  }
  set #secret(value: string) {
    this.#count = value.length;
  }
  #bump(by: number): void {
    this.#count += by;
  }
  open(code: string): string {
    Vault.#opened++;
    this.#bump(2);
    this.#secret = code;
    return this.#secret;
  }
  get count(): number {
    return this.#count;
  }
  static get opened(): number {
    return Vault.#opened;
  }
}
class AuditedVault extends Vault {
  #count = 100;
  override open(code: string): string {
    this.#count++;
    return `${super.open(code)} audit ${this.#count}`;
  }
}

function privates(): string {
  const vault = new Vault("ana");
  const audited = new AuditedVault("rui");
  return `${vault.open("abc")} ${vault.count} | ${audited.open("x")} ${audited.open("yz")} ${audited.count} | opened ${Vault.opened}`;
}

// instanceof tests the object's class (or a subclass), and narrows it: a subclass member can be read.
function kinds(shapes: Shape[]): string {
  const out: string[] = [];
  for (const s of shapes) {
    if (s instanceof SquareShape) out.push(`square ${s.perimeter}`);
    else if (s instanceof Rect) out.push(`rect ${s.perimeter}`);
    else if (s instanceof Circle) out.push(`circle r=${s.r}`);
    else out.push("other");
  }
  const first = shapes[0] ?? null;
  const missing: Shape | null = shapes.length > 9 ? first : null;
  const base: BaseShape = new Circle(2);
  let message = "";
  try {
    throw new Error("bad shape");
  } catch (e) {
    message = e instanceof Error ? e.message : "unknown";
  }
  return `${out.join(", ")} | ${first instanceof BaseShape} ${first instanceof Circle} ${missing instanceof Rect} ${base instanceof Rect} ${base instanceof Circle ? base.r : 0} | ${message}`;
}

// Class expressions: a class held by a `const`, or written where it is used (one native class each).
const Greeter = class {
  static made = 0;
  constructor(readonly name: string) {
    Greeter.made++;
  }
  greet(): string {
    return `hi ${this.name}`;
  }
};
const LoudGreeter = class Loud extends Greeter {
  override greet(): string {
    return `${super.greet().toUpperCase()}!`;
  }
};

function anonymousShapes(): Shape[] {
  const UnitShape = class extends BaseShape {
    constructor() {
      super("unit");
    }
    area(): number {
      return 1;
    }
  };
  const inline = new (class implements Shape {
    readonly name = "inline";
    area(): number {
      return 2;
    }
    describe(): string {
      return `${this.name} ${this.area()}`;
    }
  })();
  return [new UnitShape(), inline];
}

// Classes declared inside functions: one native class each, even when two functions use one name.
function scoreRows(scores: number[]): string {
  class Row {
    constructor(
      readonly rank: number,
      readonly score: number,
    ) {}
    text(): string {
      return `#${this.rank}=${this.score}`;
    }
  }
  const rows = scores.map((score, i) => new Row(i + 1, score));
  return rows.map((r) => r.text()).join(" ");
}

function nameRows(names: string[]): string {
  class Row extends Greeter {
    override greet(): string {
      return `[${super.greet()}]`;
    }
  }
  class Plain implements Named {
    readonly label = "plain";
  }
  const rows: Named[] = [new Plain()];
  const greeted = names.map((n) => new Row(n));
  const first = greeted[0];
  return `${greeted.map((r) => r.greet()).join(" ")} ${first instanceof Row} ${first instanceof Greeter} ${rows[0]?.label ?? "-"}`;
}

// Nested classes using the function's locals: natively each is passed to the constructor.
function capturedCells(prefix: string, scale: number): string {
  // An object is shared with the classes (an array would be copied: Swift arrays are values).
  const seen: Counter = { n: 0 };
  function format(n: number): string {
    return `${prefix}${n * scale}`;
  }
  class Cell {
    constructor(readonly value: number) {}
    text(): string {
      seen.n++;
      return format(this.value);
    }
  }
  class BoldCell extends Cell {
    override text(): string {
      return `**${super.text()}**`;
    }
  }
  // Captures nothing itself, but makes cells: it passes their locals on.
  class Sheet {
    cells(): Cell[] {
      return [new Cell(1), new BoldCell(2)];
    }
  }
  const tag = new (class {
    label = `${prefix}!`;
  })();
  const cells = new Sheet().cells();
  return `${cells.map((c) => c.text()).join(" ")} ${tag.label} seen ${seen.n}`;
}

// Locals a nested class shares with its function while either reassigns or mutates them: one box natively.
function sharedLocals(start: number): string {
  let total = start;
  let label = "first";
  const log: string[] = [];
  class Adder {
    add(n: number): number {
      total += n;
      log.push(`${label}+${n}`);
      return total;
    }
    first(): number {
      return start;
    }
  }
  const read = () => total;
  const adder = new Adder();
  adder.add(2);
  label = "second";
  total *= 10;
  log.push("x10");
  start = -1;
  return `${adder.add(1)} ${read()} [${log.join(",")}] ${adder.first()}`;
}

// A loop's variable in a nested class: each object keeps the turn it was made in, as in JavaScript.
function loopClasses(): string {
  const items: Named[] = [];
  for (let i = 0; i < 6; i += 2) {
    class Slot implements Named {
      readonly label = `slot${i}`;
    }
    items.push(new Slot());
  }
  for (let i = 1; i <= 2; i++) items.push(new (class implements Named {
    readonly label = `range${i}`;
  })());
  for (const word of ["a", "b"]) {
    class Word implements Named {
      get label(): string {
        return word.toUpperCase();
      }
    }
    items.push(new Word());
  }
  const later: (() => Named)[] = [];
  for (let i = 0; i < 2; i++) {
    class Tag implements Named {
      readonly label = `later${i}`;
    }
    later.push(() => new Tag());
  }
  return [...items, ...later.map((make) => make())].map((n) => n.label).join(" ");
}

// A loop variable the body (or the class) reassigns: each turn's own, shared by the turn's objects.
function loopReassigned(): string {
  const out: Named[] = [];
  for (let i = 0; i < 10; i++) {
    class Step implements Named {
      get label(): string {
        return `s${i}`;
      }
      skip(): void {
        i += 2;
      }
    }
    const step = new Step();
    step.skip();
    out.push(step);
    if (i > 6) continue;
    i++;
  }
  for (let word of ["a", "b"]) {
    class Shout implements Named {
      get label(): string {
        return word;
      }
    }
    const shout = new Shout();
    word = `${word}!`;
    out.push(shout);
  }
  return out.map((n) => n.label).join(" ");
}

// Destructured bindings a nested class shares while something reassigns them: each in its own box.
function destructuredShared(people: Person[]): string {
  const out: Named[] = [];
  for (let { name, age } of people) {
    class Entry implements Named {
      get label(): string {
        return `${name}:${age}`;
      }
      birthday(): void {
        age++;
      }
    }
    const entry = new Entry();
    entry.birthday();
    name = name.toUpperCase();
    out.push(entry);
  }
  let { label: title } = out[0] ?? { label: "none" };
  let [first = "?", second = "?"] = title.split(":");
  class Title implements Named {
    get label(): string {
      return `${title} (${first}/${second})`;
    }
  }
  const heading = new Title();
  title = `${title}!`;
  second = "x";
  return `${out.map((e) => e.label).join(" ")} | ${heading.label}`;
}

// A `for` loop's initializer that destructures: its bindings are loop variables like any other.
function patternLoops(starts: number[], person: Person): string {
  const out: Named[] = [];
  for (let [n = 3, step = 1] = starts; n > 0; n -= step) {
    class Tick implements Named {
      readonly label = `t${n}`;
    }
    out.push(new Tick());
  }
  for (let { name: who, age } = person; age > 0; age--) {
    class Year implements Named {
      get label(): string {
        return `${who}${age}`;
      }
      skip(): void {
        age--;
      }
    }
    const year = new Year();
    if (age === 2) year.skip();
    out.push(year);
    who = who.toUpperCase();
  }
  return out.map((n) => n.label).join(" ");
}

// An array a `for` loop declares and a nested class mutates: every turn's binding is the same array.
function arrayLoops(): string {
  const out: Named[] = [];
  for (let batch: string[] = []; batch.length < 3; ) {
    class Filler implements Named {
      get label(): string {
        return batch.join("");
      }
      fill(): void {
        batch.push(`${batch.length}`);
      }
    }
    const filler = new Filler();
    filler.fill();
    out.push(filler);
  }
  return out.map((n) => n.label).join(" ");
}

// Mutating the element a for-of gives (an array in an array): natively it is reached by its index.
interface Padded {
  readonly label: string;
  pad(n: number): void;
}
function elementLoops(): string {
  const rows: number[][] = [[1], [2, 2], []];
  const pads: Padded[] = [];
  for (const row of rows) {
    class Padder implements Padded {
      get label(): string {
        return row.join("+");
      }
      pad(n: number): void {
        row.push(n);
      }
    }
    const padder = new Padder();
    padder.pad(0);
    row.push(row.length);
    pads.push(padder);
  }
  for (const p of pads) p.pad(9);
  return `${pads.map((p) => p.label).join(" ")} | ${rows.map((r) => r.join("+")).join(" ")}`;
}

// Mutating the elements of an array parameter changes the caller's array: natively the caller shares it in a box.
function padAll(rows: number[][], fill: number): void {
  for (const row of rows) row.push(fill);
}
function stamp(rows: number[][]): Padded[] {
  const out: Padded[] = [];
  for (const row of rows) {
    class Stamp implements Padded {
      get label(): string {
        return row.join("+");
      }
      pad(n: number): void {
        row.push(n);
      }
    }
    out.push(new Stamp());
  }
  padAll(rows, 7);
  return out;
}
function paramElements(): string {
  const grid: number[][] = [[1], [2]];
  padAll(grid, 0);
  const stamps = stamp(grid);
  for (const s of stamps) s.pad(5);
  return `${grid.map((r) => r.join("+")).join(" ")} | ${stamps.map((s) => s.label).join(" ")}`;
}

// The same through methods (an interface's, a class's, an override, an object literal's) and forEach callbacks.
interface Grid {
  fill(rows: number[][], n: number): void;
}
class RowFiller implements Grid {
  fill(rows: number[][], n: number): void {
    for (const row of rows) row.push(n);
  }
}
class LoudFiller extends RowFiller {
  override fill(rows: number[][], n: number): void {
    super.fill(rows, n * 10);
  }
}
const firstRowDoubler: Grid = {
  fill: (rows: number[][], n: number) => {
    rows.forEach((row, i) => {
      if (i > 0) return;
      row.push(n, n);
    });
  },
};
function methodElements(): string {
  const grid: number[][] = [[1], [2]];
  const fillers: Grid[] = [new RowFiller(), new LoudFiller(), firstRowDoubler];
  for (const f of fillers) f.fill(grid, 3);
  const plain: number[][] = [[0], [5, 5]];
  plain.forEach((row) => row.push(row.length));
  return `${grid.map((r) => r.join("+")).join(" ")} | ${plain.map((r) => r.join("+")).join(" ")}`;
}

function classExpressions(): string {
  const ana = new Greeter("ana");
  const rui = new LoudGreeter("rui");
  return `${ana.greet()} ${rui.greet()} ${rui instanceof Greeter} ${ana instanceof LoudGreeter} made ${Greeter.made} | ${anonymousShapes().map((s) => s.describe()).join(", ")}`;
}

function statics(): string {
  Tally.defaultStep = 0;
  const low = Tally.defaultStep;
  Tally.defaultStep += 2;
  Tally.defaultStep++;
  Tally.defaultStep *= 1.5;
  Tally.tagged = "x";
  Tally.tagged += "ally";
  return `static ${low} ${Tally.defaultStep} ${Tally.banner}`;
}

function accounts(): string {
  const account: Account = new Savings("ana");
  const first = account.deposit(10);
  const second = account.deposit(4, "check");
  account.balance -= 1;
  const kid = new Kids("rui");
  // A literal of an interface a class implements, with an inherited field and a method.
  let saved = 0;
  const jar: Account = {
    label: "jar",
    balance: 2,
    deposit: (amount: number, note: string = "coins") => {
      saved += amount;
      return `${note} ${saved}`;
    },
  };
  const coins = `${jar.deposit(3)} ${jar.deposit(0.5, "note")} ${jar.balance + saved}`;
  let chain: Link | null = new Link(1).append(2).append(3);
  const values: number[] = [];
  while (chain !== null) {
    values.push(chain.value);
    chain = chain.next;
  }
  return `${first}, ${second}, ${account.balance} | ${describeAccount(account)} | ${describeAccount(kid)} | ${values.join("→")} | ${describeAccount(jar)} ${coins}`;
}

// ───────────────────────────── Generics ─────────────────────────────
// Compiled once per instantiation: Stack<string> and Stack<number> are two native classes.

function identity<T>(x: T): T {
  return x;
}

function firstOr<T>(xs: T[], fallback: T): T {
  return xs[0] ?? fallback;
}

function mapAll<T, U>(xs: T[], f: (x: T) => U): U[] {
  const out: U[] = [];
  for (const x of xs) out.push(f(x));
  return out;
}

interface Pair<A, B> {
  first: A;
  second: B;
}

const pairUp = <A, B>(a: A, b: B): Pair<A, B> => ({ first: a, second: b });

interface Page<T> {
  items: T[];
  total: number;
  next: Page<T> | null;
}

type Outcome<T> = { ok: boolean; value: T | null; error: string };

function ok<T>(value: T): Outcome<T> {
  return { ok: true, value: value, error: "" };
}

function fail<T>(error: string): Outcome<T> {
  return { ok: false, value: null, error: error };
}

function describeResult<T>(r: Outcome<T>, show: (v: T) => string): string {
  return r.ok && r.value !== null ? `ok ${show(r.value)}` : `error ${r.error}`;
}

class Stack<T> {
  private items: T[] = [];
  push(item: T): void {
    this.items.push(item);
  }
  pop(): T | undefined {
    return this.items.pop();
  }
  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }
  get size(): number {
    return this.items.length;
  }
}

interface Container<T> {
  get(): T;
  describe(): string;
}

class Cell<T> implements Container<T> {
  constructor(
    private value: T,
    private label: string,
  ) {}
  get(): T {
    return this.value;
  }
  describe(): string {
    return this.label;
  }
}

class CounterCell extends Cell<number> {
  constructor() {
    super(3, "counter");
  }
  override describe(): string {
    return `${super.describe()}=${this.get()}`;
  }
}

function showContainer<T>(c: Container<T>): string {
  return c.describe();
}

class Emitter<T> {
  private listeners: ((value: T) => void)[] = [];
  on(listener: (value: T) => void): void {
    this.listeners.push(listener);
  }
  emit(value: T): number {
    for (const l of this.listeners) l(value);
    return this.listeners.length;
  }
}

function bestBy<T>(xs: T[], score: (x: T) => number): T | null {
  let best: T | null = null;
  let bestScore = -Infinity;
  for (const x of xs) {
    const s = score(x);
    if (s > bestScore) {
      best = x;
      bestScore = s;
    }
  }
  return best;
}

export function generics(): string[] {
  const s = new Stack<string>();
  s.push("a");
  s.push("b");
  const n = new Stack<number>();
  n.push(1.5);
  n.push(2);
  const top = s.pop() ?? "-";
  const pair = pairUp("x", 3);
  const page: Page<string> = { items: ["p1"], total: 2, next: { items: ["p2"], total: 2, next: null } };
  const words = mapAll([1, 2, 3], (x) => `#${x}`);
  const lengths = mapAll(["ab", "cde"], (w) => w.length);
  const emitter = new Emitter<string>();
  const heard: string[] = [];
  emitter.on((v) => heard.push(`1:${v}`));
  emitter.on((v) => heard.push(`2:${v}`));
  const reached = emitter.emit("go");
  const people: Person[] = [
    { name: "ana", age: 31 },
    { name: "rui", age: 40 },
  ];
  const oldest = bestBy(people, (p) => p.age);
  return [
    `identity ${identity(5)} ${identity("s")} ${identity(true)} firstOr ${firstOr([] as number[], 7)} ${firstOr(["z"], "y")}`,
    `stack ${top} ${s.size} ${n.peek() ?? 0} ${n.size}`,
    `pair ${pair.first} ${pair.second} page ${page.items.join()} then ${page.next !== null ? page.next.items.join() : "-"} of ${page.total}`,
    `results ${describeResult(ok(42), (v) => `${v}`)} ${describeResult(fail<string>("nope"), (v) => v)}`,
    `map ${words.join(",")} ${lengths.join(",")}`,
    `cells ${showContainer(new Cell("hello", "greeting"))} ${showContainer(new CounterCell())} ${new Cell(2.5, "x").get()}`,
    `emitter ${reached} ${heard.join(" ")} oldest ${oldest !== null ? oldest.name : "-"}`,
  ];
}
