/**
 * Unions of different types, `typeof`, narrowing and `unknown`. Every target prints what TypeScript prints.
 */

// ───────────────────────────── Primitives ─────────────────────────────

type ID = string | number;

function describe(id: ID): string {
  if (typeof id === "number") return `#${id + 1}`;
  return `@${id.toUpperCase()}`;
}

function width(v: string | number | boolean): number {
  if (typeof v === "string") return v.length;
  if (typeof v === "boolean") return v ? 1 : 0;
  return v * 2;
}

export function primitives(): string[] {
  const ids: ID[] = [1, "ab", 2.5, "", 0, -0, 1e21, 1 / 3];
  const out = [ids.map((x) => describe(x)).join(" ")];
  out.push(ids.map((id) => `${id}`).join("|"));
  out.push(ids.map((id) => String(id)).join("|"));
  out.push(ids.map((id) => typeof id).join(","));
  const mixed: (string | number | boolean)[] = ["xyz", 3, true, false, 0.5];
  out.push(mixed.map((x) => width(x)).join(","));
  out.push(mixed.map((v) => `${v}`).join(","));
  let v: string | number = 7;
  out.push(`${v} ${typeof v}`);
  v = "seven";
  out.push(`${v} ${typeof v}`);
  v = v.length * 1.5;
  out.push(`${v} ${typeof v}`);
  return out;
}

// ───────────────────────────── Truthiness and equality ─────────────────────────────

export function truthiness(): string[] {
  const values: (string | number | boolean)[] = ["", "a", 0, 1, -1, NaN, true, false];
  const out = [values.map((v) => (v ? "T" : "F")).join("")];
  const ids: ID[] = [1, "1", NaN, 0, -0];
  const at = (i: number): ID => ids[i] ?? "none";
  const [a, b] = [at(0), at(1)];
  const c: string | number | boolean = values.length > 100 ? true : 1;
  out.push(`${a === 1} ${a === b} ${b === "1"} ${a !== b} ${c === a} ${c === true}`);
  out.push(`${at(2) === at(2)} ${at(3) === at(4)} ${values.filter((v) => v === 1).length}`);
  const maybe: ID | null = values.length > 3 ? at(3) : null;
  out.push(`${maybe === 4} ${maybe === "4"} ${maybe !== null}`);
  return out;
}

// ───────────────────────────── Discriminated unions ─────────────────────────────

interface Circle {
  kind: "circle";
  radius: number;
}
interface Square {
  kind: "square";
  side: number;
}
interface Line {
  kind: "line";
  length: number;
  label: string;
}
type Shape = Circle | Square | Line;

function area(s: Shape): number {
  switch (s.kind) {
    case "circle":
      return Math.round(Math.PI * s.radius * s.radius * 100) / 100;
    case "square":
      return s.side * s.side;
    case "line":
      return 0;
  }
}

function name(s: Shape): string {
  if (s.kind === "line") return `line ${s.label}`;
  if ("radius" in s) return `circle r=${s.radius}`;
  return `square ${s.side}`;
}

export function discriminated(): string[] {
  const shapes: Shape[] = [
    { kind: "circle", radius: 1.5 },
    { kind: "square", side: 3 },
    { kind: "line", length: 4, label: "ab" },
  ];
  const out = [shapes.map((x) => area(x)).join(" "), shapes.map((x) => name(x)).join(", "), shapes.map((s) => s.kind).join("/")];
  const first = shapes[0]!;
  out.push(`${first === shapes[0]!} ${first === shapes[1]!} ${typeof first}`);
  const big = shapes.filter((s) => s.kind !== "line" && area(s) > 5);
  out.push(`${big.length}`);
  return out;
}

// ───────────────────────────── Classes ─────────────────────────────

class Animal {
  constructor(public name: string) {}
  speak(): string {
    return `${this.name} makes a sound`;
  }
}
class Dog extends Animal {
  override speak(): string {
    return `${this.name} barks`;
  }
  fetch(): string {
    return `${this.name} fetches`;
  }
}
class Rock {
  weight = 3;
}

function act(x: Animal | Rock | string): string {
  if (typeof x === "string") return `text ${x}`;
  if (x instanceof Dog) return x.fetch();
  if (x instanceof Animal) return x.speak();
  return `rock ${x.weight}`;
}

export function classes(): string[] {
  const things: (Animal | Rock | string)[] = [new Dog("rex"), new Animal("cat"), new Rock(), "hi"];
  return [things.map((x) => act(x)).join("; "), things.map((t) => typeof t).join(",")];
}

// ───────────────────────────── Fields, returns, maps, early returns ─────────────────────────────

interface Setting {
  key: string;
  value: string | number | boolean | null;
}

function parse(text: string): number | string {
  const n = Number(text);
  return Number.isNaN(n) ? text : n;
}

function show(s: Setting): string {
  const v = s.value;
  if (v === null) return `${s.key}=null`;
  if (typeof v === "boolean") return `${s.key}=${v ? "yes" : "no"}`;
  return `${s.key}=${v}`;
}

export function fields(): string[] {
  const settings: Setting[] = [
    { key: "a", value: 1 },
    { key: "b", value: "x" },
    { key: "c", value: true },
    { key: "d", value: null },
  ];
  settings[0]!.value = 2.25;
  const parsed = ["12", "x1", "3.5", ""].map((x) => parse(x));
  const byKey: Record<string, number | string> = {};
  for (const p of parsed) byKey[`k${typeof p}`] = p;
  return [settings.map((x) => show(x)).join(" "), parsed.map((p) => `${typeof p}:${p}`).join(" "), `${byKey["knumber"] ?? "none"} ${byKey["kstring"] ?? "none"}`];
}

// ───────────────────────────── unknown ─────────────────────────────

function kind(v: unknown): string {
  if (v === null) return "null!";
  if (typeof v === "number") return `n${v + 1}`;
  if (typeof v === "string") return `s${v.length}`;
  if (typeof v === "boolean") return `b${!v}`;
  return typeof v;
}

export function unknowns(): string[] {
  const vs: unknown[] = [42, "hey", true, null, undefined, 0.5];
  const out = [vs.map((x) => kind(x)).join(" "), vs.map((v) => typeof v).join(" "), vs.map((v) => `${v}`).join(" ")];
  const v: unknown = 42;
  out.push(`${v === 42} ${v === "42"} ${v === null} ${v === undefined} ${v == null}`);
  let message = "";
  try {
    throw new Error("boom");
  } catch (e) {
    message = `${typeof e} ${e instanceof Error ? e.message : "?"}`;
  }
  out.push(message);
  return out;
}

// ───────────────────────────── Optional unions, arrays, protocols, class fields ─────────────────────────────

interface Named {
  label(): string;
}
class Tag implements Named {
  constructor(readonly text: string) {}
  label(): string {
    return `<${this.text}>`;
  }
}

class Cell {
  value: number | string | Tag = 0;
  history: (number | string)[] = [];
  set(v: number | string): void {
    this.history.push(v);
    this.value = v;
  }
}

function flat(v: string | string[] | null): string {
  if (v === null) return "none";
  if (Array.isArray(v)) return v.join("+");
  return v;
}

function label(v: Named | number | undefined): string {
  if (v === undefined) return "undef";
  if (typeof v === "object") return v.label();
  return `${v * 10}`;
}

function size(v?: string | number): string {
  switch (typeof v) {
    case "undefined":
      return "missing";
    case "string":
      return `len ${v.length}`;
    default:
      return `num ${v}`;
  }
}

export function more(): string[] {
  const out = [[flat(null), flat("x"), flat(["a", "b"]), flat([])].join(" ")];
  out.push([label(undefined), label(new Tag("t")), label(1.5)].join(" "));
  out.push([size(), size("abc"), size(4)].join(" "));
  const cell = new Cell();
  out.push(`${typeof cell.value} ${typeof cell.value === "number" ? cell.value + 1 : -1}`);
  cell.set("hi");
  cell.set(2);
  cell.value = new Tag("z");
  const v = cell.value;
  out.push(`${v instanceof Tag ? v.label() : "plain"} ${cell.history.map((h) => typeof h).join(",")}`);
  const maybe: string | number | undefined = cell.history.length > 5 ? "x" : undefined;
  out.push(`${typeof maybe} ${maybe === undefined} ${maybe ?? "dflt"}`);
  const n: string | number = cell.history.length > 1 ? 2 : "two";
  const text = typeof n === "number" ? n.toFixed(2) : n;
  out.push(text);
  const nested: (number | string)[][] = [[1, "a"], [], ["b"]];
  out.push(nested.map((row) => row.map((x) => `${x}`).join("")).join("|"));
  return out;
}
