// Design patterns corpus: behavioral (chain of responsibility, command with undo, interpreter, iterator, mediator,
// memento, observer / event emitter, state, strategy, template method, visitor).

// ───── Chain of responsibility ─────

interface SupportTicket {
  severity: number;
  topic: string;
}

abstract class Handler {
  private next: Handler | null = null;
  setNext(h: Handler): Handler {
    this.next = h;
    return h;
  }
  handle(t: SupportTicket): string {
    return this.next ? this.next.handle(t) : `unhandled ${t.topic}`;
  }
}

class Bot extends Handler {
  override handle(t: SupportTicket): string {
    return t.severity <= 1 && t.topic === "faq" ? `bot answered ${t.topic}` : super.handle(t);
  }
}
class Agent extends Handler {
  override handle(t: SupportTicket): string {
    return t.severity <= 3 ? `agent took ${t.topic}` : super.handle(t);
  }
}
class Engineer extends Handler {
  override handle(t: SupportTicket): string {
    return t.topic === "outage" || t.severity >= 5 ? `engineer paged for ${t.topic}` : super.handle(t);
  }
}

/** Function chain: each handler returns a result or undefined to pass on. */
type Rule = (amount: number) => string | undefined;
const approvalChain: Rule[] = [
  (a) => (a < 100 ? "auto-approved" : undefined),
  (a) => (a < 1000 ? "manager" : undefined),
  (a) => (a < 10_000 ? "director" : undefined),
];
const approve = (amount: number): string => {
  for (const rule of approvalChain) {
    const r = rule(amount);
    if (r !== undefined) return r;
  }
  return "board";
};

export function chainOfResponsibility(): string[] {
  const chain = new Bot();
  chain.setNext(new Agent()).setNext(new Engineer());
  const tickets: SupportTicket[] = [
    { severity: 1, topic: "faq" },
    { severity: 2, topic: "billing" },
    { severity: 4, topic: "outage" },
    { severity: 4, topic: "feature" },
    { severity: 9, topic: "data loss" },
  ];
  return [...tickets.map((t) => chain.handle(t)), [50, 500, 5000, 50_000].map(approve).join(" ")];
}

// ───── Command with undo / redo ─────

interface Command {
  readonly label: string;
  execute(): void;
  undo(): void;
}

class TextDocument {
  text = "";
}

class InsertCommand implements Command {
  constructor(
    private readonly doc: TextDocument,
    private readonly at: number,
    private readonly piece: string,
  ) {}
  get label(): string {
    return `insert "${this.piece}"@${this.at}`;
  }
  execute(): void {
    this.doc.text = this.doc.text.slice(0, this.at) + this.piece + this.doc.text.slice(this.at);
  }
  undo(): void {
    this.doc.text = this.doc.text.slice(0, this.at) + this.doc.text.slice(this.at + this.piece.length);
  }
}

class DeleteCommand implements Command {
  private removed = "";
  constructor(
    private readonly doc: TextDocument,
    private readonly from: number,
    private readonly count: number,
  ) {}
  get label(): string {
    return `delete ${this.count}@${this.from}`;
  }
  execute(): void {
    this.removed = this.doc.text.substr(this.from, this.count);
    this.doc.text = this.doc.text.slice(0, this.from) + this.doc.text.slice(this.from + this.count);
  }
  undo(): void {
    this.doc.text = this.doc.text.slice(0, this.from) + this.removed + this.doc.text.slice(this.from);
  }
}

class CommandHistory {
  private done: Command[] = [];
  private undone: Command[] = [];
  run(c: Command): void {
    c.execute();
    this.done.push(c);
    this.undone = [];
  }
  undo(): string {
    const c = this.done.pop();
    if (!c) return "nothing to undo";
    c.undo();
    this.undone.push(c);
    return `undid ${c.label}`;
  }
  redo(): string {
    const c = this.undone.pop();
    if (!c) return "nothing to redo";
    c.execute();
    this.done.push(c);
    return `redid ${c.label}`;
  }
}

/** Commands as closures: a counter with an undo stack of inverse operations. */
function counterWithUndo() {
  let value = 0;
  const undoStack: (() => void)[] = [];
  const apply = (delta: number) => {
    value += delta;
    undoStack.push(() => {
      value -= delta;
    });
  };
  return {
    add: (n: number) => apply(n),
    double: () => apply(value),
    undo: () => {
      const inverse = undoStack.pop();
      if (inverse) inverse();
    },
    value: () => value,
  };
}

export function command(): string[] {
  const doc = new TextDocument();
  const history = new CommandHistory();
  const log: string[] = [];
  history.run(new InsertCommand(doc, 0, "Hello"));
  history.run(new InsertCommand(doc, 5, " world"));
  history.run(new DeleteCommand(doc, 0, 1));
  log.push(doc.text);
  log.push(history.undo(), doc.text);
  log.push(history.undo(), doc.text);
  log.push(history.redo(), doc.text);
  history.run(new InsertCommand(doc, 5, ","));
  log.push(doc.text, history.redo(), history.undo(), history.undo(), history.undo(), history.undo(), `"${doc.text}"`);
  const c = counterWithUndo();
  c.add(5);
  c.double();
  c.add(-3);
  const peak = c.value();
  c.undo();
  c.undo();
  c.undo();
  c.undo();
  log.push(`counter peak ${peak} after undo ${c.value()}`);
  return log;
}

// ───── Interpreter (boolean rule language) ─────

interface Context {
  vars: Map<string, boolean>;
}

abstract class BoolExpr {
  abstract evaluate(ctx: Context): boolean;
  abstract toString(): string;
}

class VarRef extends BoolExpr {
  constructor(readonly name: string) {
    super();
  }
  evaluate(ctx: Context): boolean {
    return ctx.vars.get(this.name) ?? false;
  }
  toString(): string {
    return this.name;
  }
}

class Not extends BoolExpr {
  constructor(readonly e: BoolExpr) {
    super();
  }
  evaluate(ctx: Context): boolean {
    return !this.e.evaluate(ctx);
  }
  toString(): string {
    return `¬${this.e.toString()}`;
  }
}

class And extends BoolExpr {
  constructor(readonly l: BoolExpr, readonly r: BoolExpr) {
    super();
  }
  evaluate(ctx: Context): boolean {
    return this.l.evaluate(ctx) && this.r.evaluate(ctx);
  }
  toString(): string {
    return `(${this.l.toString()} ∧ ${this.r.toString()})`;
  }
}

class Or extends BoolExpr {
  constructor(readonly l: BoolExpr, readonly r: BoolExpr) {
    super();
  }
  evaluate(ctx: Context): boolean {
    return this.l.evaluate(ctx) || this.r.evaluate(ctx);
  }
  toString(): string {
    return `(${this.l.toString()} ∨ ${this.r.toString()})`;
  }
}

/** Parses "a & !b | c" (| lowest, then &, then !). Methods, not local closures calling each other (Kotlin can't). */
class RuleParser {
  private pos = 0;
  private readonly tokens: string[];
  constructor(src: string) {
    this.tokens = src.replaceAll("(", " ( ").replaceAll(")", " ) ").replaceAll("!", " ! ").replaceAll("&", " & ").replaceAll("|", " | ").split(" ").filter((t) => t !== "");
  }
  or(): BoolExpr {
    let e = this.and();
    while (this.tokens[this.pos] === "|") {
      this.pos++;
      e = new Or(e, this.and());
    }
    return e;
  }
  and(): BoolExpr {
    let e = this.not();
    while (this.tokens[this.pos] === "&") {
      this.pos++;
      e = new And(e, this.not());
    }
    return e;
  }
  not(): BoolExpr {
    const t = this.tokens[this.pos++];
    if (t === "!") return new Not(this.not());
    if (t === "(") {
      const e = this.or();
      this.pos++;
      return e;
    }
    if (t === undefined) throw new Error("unexpected end");
    return new VarRef(t);
  }
}

function parseRule(src: string): BoolExpr {
  return new RuleParser(src).or();
}

// It calls code that can throw (a RangeError from BigInt / bigint `%`, or the app's own errors): a check made at
// load time catches what it doesn't expect, as an error natively can't leave a top-level initializer.
export function interpreterPattern(): string[] {
  try {
    return interpreterPatternLines();
  } catch (e) {
    return [`unexpected ${(e as Error).message}`];
  }
}

function interpreterPatternLines(): string[] {
  const rule = parseRule("admin | (member & !banned & verified)");
  const users: [string, Record<string, boolean>][] = [
    ["root", { admin: true }],
    ["ann", { member: true, verified: true }],
    ["bob", { member: true, verified: true, banned: true }],
    ["cid", { member: true }],
  ];
  const lines = [rule.toString()];
  for (const [name, flags] of users) {
    const vars = new Map<string, boolean>();
    for (const k of Object.keys(flags)) vars.set(k, flags[k]!);
    lines.push(`${name}: ${rule.evaluate({ vars })}`);
  }
  try {
    parseRule("a & ");
  } catch (e) {
    lines.push(`error ${(e as Error).message}`);
  }
  return lines;
}

// ───── Iterator ─────

class NumberRange {
  constructor(
    private readonly start: number,
    private readonly end: number,
    private readonly step = 1,
  ) {}
  *values(): Generator<number> {
    for (let i = this.start; this.step > 0 ? i < this.end : i > this.end; i += this.step) yield i;
  }
}

class Playlist {
  private readonly songs: string[] = [];
  add(...s: string[]): this {
    this.songs.push(...s);
    return this;
  }
  *shuffled(seed: number): Generator<string> {
    const order = this.songs.map((_, i) => i);
    let x = seed;
    for (let i = order.length - 1; i > 0; i--) {
      x = (x * 1103515245 + 12345) % 2147483648;
      const j = x % (i + 1);
      [order[i], order[j]] = [order[j]!, order[i]!];
    }
    for (const i of order) yield this.songs[i]!;
  }
  *values(): Generator<string> {
    yield* this.songs;
  }
}

/** A hand-written iterator object (no generators): the protocol by hand. */
function countdown(from: number): { next(): { done: boolean; value: number } } {
  let n = from;
  return {
    next() {
      return n < 0 ? { done: true, value: -1 } : { done: false, value: n-- };
    },
  };
}

function* fibonacci(): Generator<number> {
  let [a, b] = [0, 1];
  for (;;) {
    yield a;
    [a, b] = [b, a + b];
  }
}

export function iterator(): string[] {
  const evens: number[] = [];
  for (const x of new NumberRange(0, 10, 2).values()) evens.push(x);
  const playlist = new Playlist().add("intro", "verse", "chorus", "bridge", "outro");
  const iter = countdown(3);
  const counted: number[] = [];
  for (let r = iter.next(); !r.done; r = iter.next()) counted.push(r.value);
  const fib: number[] = [];
  for (const f of fibonacci()) {
    if (f > 100) break;
    fib.push(f);
  }
  return [
    `range ${evens.join(",")} down ${[...new NumberRange(5, 0, -2).values()].join(",")}`,
    `playlist ${[...playlist.values()].join(" ")} shuffled ${[...playlist.shuffled(42)].join(" ")}`,
    `countdown ${counted.join(",")} fib ${fib.join(",")}`,
  ];
}

// ───── Mediator ─────

interface ChatMember {
  readonly name: string;
  inbox: string[];
}

class ChatRoom {
  private readonly members = new Map<string, ChatMember>();
  private readonly muted = new Set<string>();
  join(name: string): ChatMember {
    const m: ChatMember = { name, inbox: [] };
    this.members.set(name, m);
    this.broadcast("system", `${name} joined`);
    return m;
  }
  mute(name: string): void {
    this.muted.add(name);
  }
  broadcast(from: string, text: string): number {
    if (this.muted.has(from)) return 0;
    let delivered = 0;
    for (const m of this.members.values()) {
      if (m.name === from) continue;
      m.inbox.push(`${from}: ${text}`);
      delivered++;
    }
    return delivered;
  }
  direct(from: string, to: string, text: string): boolean {
    const target = this.members.get(to);
    if (!target || this.muted.has(from)) return false;
    target.inbox.push(`${from} (dm): ${text}`);
    return true;
  }
}

export function mediator(): string[] {
  const room = new ChatRoom();
  const ann = room.join("ann");
  const bob = room.join("bob");
  const cid = room.join("cid");
  room.broadcast("ann", "hi all");
  room.direct("bob", "ann", "hey ann");
  room.mute("cid");
  const sent = room.broadcast("cid", "spam");
  const dm = room.direct("ann", "zed", "anyone?");
  return [`ann ${ann.inbox.join(" | ")}`, `bob ${bob.inbox.join(" | ")}`, `cid ${cid.inbox.join(" | ")}`, `muted sent ${sent} dm to zed ${dm}`];
}

// ───── Memento ─────

interface EditorState {
  readonly text: string;
  readonly cursor: number;
  readonly selection: readonly [number, number] | null;
}

class Editor {
  private text = "";
  private cursor = 0;
  private selection: [number, number] | null = null;

  type(s: string): void {
    this.text = this.text.slice(0, this.cursor) + s + this.text.slice(this.cursor);
    this.cursor += s.length;
    this.selection = null;
  }
  select(a: number, b: number): void {
    this.selection = [a, b];
  }
  save(): EditorState {
    return { text: this.text, cursor: this.cursor, selection: this.selection ? [this.selection[0], this.selection[1]] : null };
  }
  restore(m: EditorState): void {
    this.text = m.text;
    this.cursor = m.cursor;
    this.selection = m.selection ? [m.selection[0], m.selection[1]] : null;
  }
  show(): string {
    const sel = this.selection ? ` sel=${this.selection[0]}..${this.selection[1]}` : "";
    return `"${this.text}" @${this.cursor}${sel}`;
  }
}

class Caretaker {
  private readonly snapshots: EditorState[] = [];
  push(s: EditorState): void {
    this.snapshots.push(s);
  }
  pop(): EditorState | undefined {
    return this.snapshots.pop();
  }
  get depth(): number {
    return this.snapshots.length;
  }
}

export function memento(): string[] {
  const ed = new Editor();
  const history = new Caretaker();
  const out: string[] = [];
  ed.type("Hello");
  history.push(ed.save());
  ed.type(" there");
  ed.select(0, 5);
  history.push(ed.save());
  ed.type("!!!");
  out.push(ed.show());
  ed.restore(history.pop()!);
  out.push(ed.show());
  ed.restore(history.pop()!);
  out.push(ed.show(), `depth ${history.depth} empty ${history.pop() === undefined}`);
  const snapshot = ed.save();
  ed.type(" again");
  out.push(`snapshot kept ${snapshot.text} vs ${ed.show()}`);
  return out;
}

// ───── Observer / event emitter ─────

type Listener<T> = (payload: T) => void;

/** One typed event: a signal per event type (a `keyof Events`-keyed emitter needs generic methods). */
// Listeners are removed by id: comparing functions (`l !== fn`) isn't supported natively.
class Signal<T> {
  private listeners: { id: number; fn: Listener<T> }[] = [];
  private nextId = 0;
  on(fn: Listener<T>): () => void {
    const id = ++this.nextId;
    this.listeners.push({ id, fn });
    return () => this.off(id);
  }
  off(id: number): void {
    this.listeners = this.listeners.filter((l) => l.id !== id);
  }
  emit(payload: T): number {
    const list = this.listeners;
    for (const l of list) l.fn(payload);
    return list.length;
  }
}

interface Quote {
  symbol: string;
  price: number;
}

class StockEvents {
  readonly price = new Signal<Quote>();
  readonly halt = new Signal<string>();
}

/** Observer, class-based with an explicit subscriber interface. */
interface PriceObserver {
  update(symbol: string, price: number): void;
}

class Ticker {
  private observers: PriceObserver[] = [];
  private prices = new Map<string, number>();
  attach(o: PriceObserver): void {
    this.observers.push(o);
  }
  detach(o: PriceObserver): void {
    this.observers = this.observers.filter((x) => x !== o);
  }
  set(symbol: string, price: number): void {
    if (this.prices.get(symbol) === price) return;
    this.prices.set(symbol, price);
    for (const o of this.observers) o.update(symbol, price);
  }
}

class PriceLog implements PriceObserver {
  readonly lines: string[] = [];
  update(symbol: string, price: number): void {
    this.lines.push(`${symbol}=${price}`);
  }
}

class Threshold implements PriceObserver {
  alerts = 0;
  constructor(private readonly limit: number) {}
  update(_symbol: string, price: number): void {
    if (price > this.limit) this.alerts++;
  }
}

export function observer(): string[] {
  const bus = new StockEvents();
  const seen: string[] = [];
  const offPrice = bus.price.on(({ symbol, price }) => seen.push(`${symbol}:${price.toFixed(2)}`));
  bus.halt.on((reason) => seen.push(`halt(${reason})`));
  bus.price.emit({ symbol: "ACME", price: 12.5 });
  bus.halt.emit("volatility");
  offPrice();
  const delivered = bus.price.emit({ symbol: "ACME", price: 13 });
  const ticker = new Ticker();
  const log = new PriceLog();
  const alarm = new Threshold(100);
  ticker.attach(log);
  ticker.attach(alarm);
  ticker.set("XYZ", 99);
  ticker.set("XYZ", 99);
  ticker.set("XYZ", 101);
  ticker.detach(log);
  ticker.set("XYZ", 150);
  return [`emitter ${seen.join(" ")} after off ${delivered}`, `ticker ${log.lines.join(" ")} alerts ${alarm.alerts}`];
}

// ───── State ─────

interface DocState {
  readonly name: string;
  publish(doc: Doc): string;
  reject(doc: Doc): string;
}

class Doc {
  state: DocState = Draft;
  revisions = 0;
  constructor(readonly author: string, readonly isAdmin: boolean) {}
  publish(): string {
    return this.state.publish(this);
  }
  reject(): string {
    return this.state.reject(this);
  }
}

const Draft: DocState = {
  name: "draft",
  publish(doc) {
    doc.state = doc.isAdmin ? Published : Moderation;
    return `draft → ${doc.state.name}`;
  },
  reject: () => "draft: nothing to reject",
};

const Moderation: DocState = {
  name: "moderation",
  publish(doc) {
    doc.state = Published;
    return "moderation → published";
  },
  reject(doc) {
    doc.state = Draft;
    doc.revisions++;
    return `moderation → draft (rev ${doc.revisions})`;
  },
};

const Published: DocState = {
  name: "published",
  publish: () => "already published",
  reject(doc) {
    doc.state = Draft;
    return "published → draft";
  },
};

export function state(): string[] {
  const doc = new Doc("ann", false);
  const admin = new Doc("root", true);
  return [doc.publish(), doc.reject(), doc.reject(), doc.publish(), doc.publish(), doc.publish(), doc.reject(), `final ${doc.state.name}`, admin.publish(), admin.publish()];
}

// ───── Strategy ─────

type ShippingStrategy = (weightKg: number, km: number) => number;

const strategies: Record<string, ShippingStrategy> = {
  flat: () => 9.99,
  weight: (kg) => 2 + kg * 1.5,
  distance: (kg, km) => Math.max(5, km * 0.05 + kg * 0.2),
  express: (kg, km) => 15 + km * 0.1 + Math.ceil(kg) * 2,
};

interface Compressor {
  name: string;
  compress(data: number[]): number[];
}

class DeltaCompressor implements Compressor {
  name = "delta";
  compress(data: number[]): number[] {
    return data.map((x, i) => (i === 0 ? x : x - data[i - 1]!));
  }
}

class DedupeCompressor implements Compressor {
  name = "dedupe";
  compress(data: number[]): number[] {
    return data.filter((x, i) => i === 0 || x !== data[i - 1]);
  }
}

class Archiver {
  constructor(private strategy: Compressor) {}
  setStrategy(s: Compressor): void {
    this.strategy = s;
  }
  archive(data: number[]): string {
    return `${this.strategy.name}: ${this.strategy.compress(data).join(",")}`;
  }
}

export function strategy(): string[] {
  const quotes = Object.keys(strategies).map((k) => `${k}=${strategies[k]!(3.2, 420).toFixed(2)}`);
  const cheapest = Object.keys(strategies).reduce((best, k) => (strategies[k]!(3.2, 420) < strategies[best]!(3.2, 420) ? k : best), "flat");
  const archiver = new Archiver(new DeltaCompressor());
  const data = [10, 10, 11, 11, 11, 15, 20, 20];
  const a = archiver.archive(data);
  archiver.setStrategy(new DedupeCompressor());
  return [quotes.join(" "), `cheapest ${cheapest}`, a, archiver.archive(data)];
}

// ───── Template method ─────

abstract class Report {
  generate(rows: [string, number][]): string[] {
    const filtered = rows.filter((r) => this.include(r));
    return [this.header(), ...filtered.map((r) => this.row(r)), this.footer(filtered)];
  }
  protected include(_row: [string, number]): boolean {
    return true;
  }
  protected abstract header(): string;
  protected abstract row(row: [string, number]): string;
  protected footer(rows: [string, number][]): string {
    return `total ${rows.reduce((s, [, v]) => s + v, 0)}`;
  }
}

class CsvReport extends Report {
  protected header(): string {
    return "name,value";
  }
  protected row([name, value]: [string, number]): string {
    return `${name},${value}`;
  }
}

class MarkdownReport extends Report {
  protected override include([, value]: [string, number]): boolean {
    return value >= 10;
  }
  protected header(): string {
    return "| name | value |";
  }
  protected row([name, value]: [string, number]): string {
    return `| ${name.padEnd(6)} | ${String(value).padStart(5)} |`;
  }
  protected override footer(rows: [string, number][]): string {
    return `${super.footer(rows)} (${rows.length} rows ≥ 10)`;
  }
}

export function templateMethod(): string[] {
  const rows: [string, number][] = [["apples", 12], ["kiwis", 3], ["plums", 40]];
  return [...new CsvReport().generate(rows), ...new MarkdownReport().generate(rows)];
}

// ───── Visitor ─────
// Classic double dispatch with a visitor that accumulates (a generic `accept<R>` would be a generic method).

interface ShapeVisitor {
  circle(c: Circle): void;
  rect(r: Rect): void;
  group(g: Group): void;
}

interface Visitable {
  accept(v: ShapeVisitor): void;
}

class Circle implements Visitable {
  constructor(readonly r: number) {}
  accept(v: ShapeVisitor): void {
    v.circle(this);
  }
}

class Rect implements Visitable {
  constructor(readonly w: number, readonly h: number) {}
  accept(v: ShapeVisitor): void {
    v.rect(this);
  }
}

class Group implements Visitable {
  constructor(readonly items: Visitable[]) {}
  accept(v: ShapeVisitor): void {
    v.group(this);
  }
}

class AreaVisitor implements ShapeVisitor {
  total = 0;
  circle(c: Circle): void {
    this.total += Math.PI * c.r * c.r;
  }
  rect(r: Rect): void {
    this.total += r.w * r.h;
  }
  group(g: Group): void {
    for (const i of g.items) i.accept(this);
  }
}

class SvgVisitor implements ShapeVisitor {
  out = "";
  circle(c: Circle): void {
    this.out += `<circle r="${c.r}"/>`;
  }
  rect(r: Rect): void {
    this.out += `<rect w="${r.w}" h="${r.h}"/>`;
  }
  group(g: Group): void {
    this.out += "<g>";
    g.items.forEach((i) => i.accept(this));
    this.out += "</g>";
  }
}

/** The same with a visitor object literal and a counting closure. */
function countKinds(root: Visitable): string {
  const counts: Record<string, number> = { circle: 0, rect: 0, group: 0 };
  const counter: ShapeVisitor = {
    circle: () => {
      counts["circle"]! += 1;
    },
    rect: () => {
      counts["rect"]! += 1;
    },
    group(g) {
      counts["group"]! += 1;
      g.items.forEach((i) => i.accept(this));
    },
  };
  root.accept(counter);
  return Object.keys(counts).map((k) => `${k}=${counts[k]}`).join(" ");
}

export function visitor(): string[] {
  const scene = new Group([new Circle(1), new Rect(2, 3), new Group([new Circle(0.5), new Rect(1, 1)])]);
  const area = new AreaVisitor();
  scene.accept(area);
  const svg = new SvgVisitor();
  scene.accept(svg);
  return [`area ${area.total.toFixed(4)}`, svg.out, countKinds(scene)];
}
