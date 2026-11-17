/**
 * Structural object types: anonymous object types, utility and mapped types, intersections, mixed
 * tuples, object literals with methods and `this`. Every target prints what TypeScript prints.
 */

// ───────────────────────────── Anonymous object types ─────────────────────────────

function makePoint(x: number, y: number) {
  return { x, y };
}

function norm(p: { x: number; y: number }): number {
  return Math.sqrt(p.x * p.x + p.y * p.y);
}

function bounds(xs: number[]): { min: number; max: number; count: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const x of xs) {
    if (x < min) min = x;
    if (x > max) max = x;
  }
  return { min, max, count: xs.length };
}

export function anonymous(): string[] {
  const person = { name: "Alice", age: 30 };
  person.age += 1;
  const out = [`${person.name} ${person.age}`];
  const p = makePoint(3, 4);
  out.push(`${norm(p)} ${norm({ x: 1.5, y: 2 })} ${norm(makePoint(-6, 8))}`);
  // Same shape: one class, one object.
  const q: { x: number; y: number } = p;
  q.x = 0.5;
  out.push(`${p.x} ${p === q} ${p === makePoint(0.5, 4)}`);
  const boxes: { w: number; h: number }[] = [
    { w: 1, h: 2 },
    { w: 3, h: 4.5 },
  ];
  boxes.push({ w: 2, h: 2 });
  out.push(boxes.map((b) => b.w * b.h).join(","));
  const nested = { id: 7, pos: { x: 0.25, y: -1 }, tags: ["a", "b"] };
  nested.pos.y *= 3;
  nested.tags.push("c");
  out.push(`${nested.id} ${nested.pos.x} ${nested.pos.y} ${nested.tags.join("+")}`);
  const opt: { a: number; b?: string } = { a: 1 };
  out.push(`${opt.b ?? "none"} ${opt.a}`);
  opt.b = "set";
  out.push(`${opt.b ?? "none"}`);
  const b = bounds([3, -2, 9.5, 4]);
  out.push(`${b.min} ${b.max} ${b.count}`);
  const { min, max } = bounds([]);
  out.push(`${min} ${max}`);
  return out;
}

// ───────────────────────────── Same shapes, different names ─────────────────────────────

interface Point {
  x: number;
  y: number;
}
interface Vec {
  x: number;
  y: number;
}

function shift(v: Vec, by: number): Vec {
  v.x += by;
  return v;
}

export function sameShape(): string[] {
  // An anonymous result, a Point and a Vec: one shape, so one native class, no copies.
  const p: Point = makePoint(1, 2);
  const v: Vec = p;
  v.y = 7;
  const moved = shift(p, 0.5);
  return [`${p.x} ${p.y} ${p === v} ${moved === p} ${norm(v)}`];
}

// ───────────────────────────── Utility and mapped types ─────────────────────────────

interface Todo {
  id: number;
  title: string;
  done: boolean;
  note?: string;
}
type TodoPreview = Pick<Todo, "id" | "title">;
type TodoDraft = Omit<Todo, "id">;
type Flags = { [K in keyof Todo]?: boolean };
type Sizes = Record<"small" | "large", number>;
type Box<T> = T extends string ? { text: T } : { value: T };

function title(t: TodoPreview): string {
  return `#${t.id} ${t.title}`;
}

export function utility(): string[] {
  const todo: Todo = { id: 1, title: "write", done: false };
  // A wider object into a narrower type: the same object (mutations through either are seen by both).
  const preview: TodoPreview = todo;
  preview.title = "write more";
  const out = [`${todo.title} ${preview.id} ${preview === todo} ${title(todo)}`];
  const previews: TodoPreview[] = [todo, { id: 2, title: "literal" }];
  out.push(previews.map((t) => title(t)).join(", "));
  const draft: TodoDraft = { title: "draft", done: true };
  const partial: Partial<Todo> = { title: "p" };
  const full: Required<Todo> = { id: 2, title: "r", done: true, note: "n" };
  const frozen: Readonly<Todo> = todo;
  todo.done = true;
  out.push(`${draft.title} ${draft.done} ${partial.id ?? -1} ${partial.title ?? "?"} ${full.note} ${frozen === todo} ${frozen.done}`);
  partial.id = 5;
  out.push(`${partial.id}`);
  const flags: Flags = { done: true };
  const sizes: Sizes = { small: 1, large: 2.5 };
  sizes.small += 1;
  out.push(`${flags.done === true} ${flags.id === undefined} ${sizes.small + sizes.large}`);
  const b: Box<number> = { value: 3 };
  const s: Box<string> = { text: "t" };
  out.push(`${b.value} ${s.text}`);
  return out;
}

// ───────────────────────────── Intersections ─────────────────────────────

interface User {
  name: string;
}
interface Admin {
  level: number;
}
type AdminUser = User & Admin;

function greetUser(u: User): string {
  return `hello ${u.name}`;
}

function promote(u: User, level: number): AdminUser {
  return { name: u.name, level };
}

export function intersections(): string[] {
  const root: AdminUser = { name: "root", level: 9 };
  const u: User = root;
  u.name = "ROOT";
  const out = [`${greetUser(root)} ${root.level} ${u === root}`];
  const made = promote({ name: "ann" }, 2);
  const tagged: Todo & { tags: string[] } = { id: 3, title: "t", done: false, tags: ["x"] };
  tagged.tags.push("y");
  out.push(`${made.name}:${made.level} ${title(tagged)} ${tagged.tags.join("")}`);
  return out;
}

// ───────────────────────────── Mixed tuples ─────────────────────────────

function minMax(xs: number[]): [number, number, string] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const x of xs) {
    lo = Math.min(lo, x);
    hi = Math.max(hi, x);
  }
  return [lo, hi, `${xs.length} values`];
}

function entriesOf(e: [string, number, boolean]): string {
  return `${e}`;
}

export function tuples(): string[] {
  const t = minMax([3, 1, 2.5]);
  const [lo, hi, label] = t;
  const out = [`${lo} ${hi} ${label} ${t.length} ${t[0]} ${t[2]}`];
  t[0] = -1;
  const alias = t;
  out.push(`${alias[0]} ${alias === t} ${t} [${String(entriesOf(["k", 0.5, true]))}]`);
  const entries: [string, number][] = [
    ["a", 1],
    ["b", 2.5],
  ];
  entries.push(["c", 3]);
  out.push(entries.map(([k, v]) => `${k}=${v}`).join(","));
  let total = 0;
  for (const [, v] of entries) total += v;
  out.push(`${total}`);
  const pair: [number, number] = [1, 2];
  out.push(`${pair.length} ${pair.map((x) => x * 2).join(",")}`);
  return out;
}

// ───────────────────────────── Object literals with methods ─────────────────────────────

interface Greeter {
  name: string;
  greet(greeting?: string): string;
}

function introduce(g: Greeter): string {
  return g.greet("Hey");
}

export function methods(): string[] {
  const person = {
    name: "Alice",
    greet() {
      return `Hi, I am ${this.name}`;
    },
  };
  const out = [person.greet()];
  person.name = "Bob";
  out.push(person.greet());
  const g: Greeter = {
    name: "G",
    greet(greeting = "Hello") {
      return `${greeting}, ${this.name}`;
    },
  };
  out.push(`${g.greet()} | ${introduce(g)}`);
  const counter = {
    count: 0,
    step: 2,
    inc() {
      this.count += this.step;
      return this.count;
    },
    twice() {
      this.inc();
      return this.inc();
    },
  };
  counter.inc();
  out.push(`${counter.twice()} ${counter.count}`);
  // `this` in an array method's callback (called before the method returns).
  const team = {
    prefix: ">",
    names: ["a", "b"],
    list() {
      return this.names.map((n) => `${this.prefix}${n}`).join(" ");
    },
  };
  team.names.push("c");
  out.push(team.list());
  return out;
}

// ───────────────────────────── Shapes in unions, generics, protocols ─────────────────────────────

type Shape = { kind: "circle"; r: number } | { kind: "square"; side: number };

function area(s: Shape): number {
  return s.kind === "circle" ? Math.PI * s.r * s.r : s.side * s.side;
}

function wrap<T>(value: T) {
  return { value, at: 1 };
}

interface Named {
  name: string;
}

function named(n: Named): string {
  return `<${n.name}>`;
}

function asNamed(g: Greeter): Named {
  return g;
}

interface Tagged {
  id: number;
  title: string;
  tags: string[];
}

function retitle(t: Tagged & { done: boolean }): TodoPreview {
  return t;
}

export function more(): string[] {
  const shapes: Shape[] = [
    { kind: "circle", r: 1 },
    { kind: "square", side: 1.5 },
  ];
  const out = [shapes.map((s) => area(s).toFixed(2)).join(" ")];
  const w = wrap("x");
  const n = wrap(2.5);
  out.push(`${w.value} ${n.value + n.at}`);
  const g: Greeter = { name: "gg", greet: () => "hi" };
  const asN = asNamed(g);
  asN.name = "renamed";
  out.push(`${named(g)} ${g.name} ${asN === g} ${named({ name: "lit" })}`);
  const full = { id: 4, title: "tag", tags: ["a"], done: false };
  const preview = retitle(full);
  preview.title = "TAG";
  out.push(`${full.title} ${preview.id} ${preview === full}`);
  const todo: Todo = { id: 9, title: "nine", done: false };
  const copy: TodoPreview = { ...todo, title: "copy" };
  out.push(`${copy.id} ${copy.title} ${todo.title} ${copy === todo}`);
  const keys = { b: 1, a: "x", c: true };
  out.push(Object.keys(keys).join(","));
  return out;
}

// Spreading an object into a new one of a wider interface copies its fields: no identity to keep.
interface Staff {
  name: string;
  age: number;
}
interface StaffAdmin extends Staff {
  role: string;
}
function promoteStaff(m: Staff): StaffAdmin {
  return { ...m, role: "admin" };
}
export function spreadWider(): string[] {
  const m: Staff = { name: "ana", age: 30 };
  const a = promoteStaff(m);
  a.age = 31;
  return [`${a.name} ${a.role} ${a.age} ${m.age}`];
}
