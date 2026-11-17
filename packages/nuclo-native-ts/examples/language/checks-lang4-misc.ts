/**
 * Language round 4: object rest destructuring, statements before `super(…)`. Every top-level name starts with `Lg4` / `lg4`.
 */

interface Lg4Item {
  id: number;
  lgName: string;
  lgPrice: number;
  lgTags: string[];
}

export function lg4ObjectRest(): string[] {
  const out: string[] = [];
  const item: Lg4Item = { id: 7, lgName: "lamp", lgPrice: 19.5, lgTags: ["home"] };
  const { id, ...details } = item;
  out.push(`${id} ${details.lgName} ${details.lgPrice} ${details.lgTags === item.lgTags}`);
  out.push(JSON.stringify(details), Object.keys(details).join(","));
  // The rest is a copy: changing it leaves the source alone (its arrays are shared).
  details.lgPrice = 1;
  details.lgTags.push("sale");
  out.push(`${item.lgPrice} ${item.lgTags.join("+")}`);
  const { lgName, lgPrice, ...more } = item;
  out.push(`${lgName} ${lgPrice} ${more.id} ${more.lgTags.length} ${JSON.stringify(more)}`);
  // From a literal, with numbers of both kinds, in a loop and a parameter.
  const { label, ...point } = { label: "p", lgX: 1.5, lgY: 2 };
  out.push(`${label} ${point.lgX + point.lgY} ${JSON.stringify(point)}`);
  const all: Lg4Item[] = [item, { id: 8, lgName: "desk", lgPrice: 120, lgTags: [] }];
  for (const { lgTags, ...plain } of all) out.push(`${plain.id}:${plain.lgName}:${lgTags.length}`);
  const describe = ({ id: key, ...rest }: Lg4Item) => `${key}=${rest.lgName}`;
  out.push(all.map(describe).join(" "));
  return out;
}

class Lg4Shape {
  constructor(
    readonly kind: string,
    readonly size: number,
  ) {}
}

class Lg4Square extends Lg4Shape {
  readonly area: number;
  constructor(side: number) {
    if (side < 0) throw new Error(`negative side ${side}`);
    const rounded = Math.round(side * 10) / 10;
    super(`square ${rounded}`, Math.round(side * 10) / 10);
    this.area = this.size * this.size;
  }
}

class Lg4Named extends Error {
  constructor(parts: string[]) {
    const text = parts.filter((p) => p.length > 0).join(" / ");
    super(text.length ? text : "(empty)");
    this.name = "Named";
  }
}

export function lg4PreSuper(): string[] {
  const out: string[] = [];
  for (const side of [2.04, -1, 3]) {
    try {
      const s = new Lg4Square(side);
      out.push(`${s.kind} ${s.size} ${s.area}`);
    } catch (e) {
      out.push(String(e));
    }
  }
  out.push(String(new Lg4Named(["a", "", "b"])), String(new Lg4Named([])));
  return out;
}

class Lg4Span {
  constructor(
    readonly from: number,
    readonly to: number,
  ) {}
  *[Symbol.iterator](): Generator<number, void, undefined> {
    for (let i = this.from; i < this.to; i++) yield i;
  }
}

class Lg4Tree {
  readonly kids: Lg4Tree[] = [];
  constructor(readonly label: string) {}
  add(label: string): Lg4Tree {
    const kid = new Lg4Tree(label);
    this.kids.push(kid);
    return kid;
  }
  *walk(depth: number): Generator<string, void, undefined> {
    let prefix = "";
    for (let i = 0; i < depth; i++) prefix += "-";
    yield `${prefix}${this.label}`;
    for (const k of this.kids) yield* k.walk(depth + 1);
  }
  // Not a generator itself: it returns one.
  [Symbol.iterator](): Generator<string, void, undefined> {
    return this.walk(0);
  }
}

class Lg4EvenSpan extends Lg4Span {
  override *[Symbol.iterator](): Generator<number, void, undefined> {
    for (const n of new Lg4Span(this.from, this.to)) if (n % 2 === 0) yield n;
  }
}

function* lg4Both(a: Lg4Span, b: Lg4Span): Generator<number, void, undefined> {
  yield* a;
  yield* b;
}

export function lg4Iterables(): string[] {
  const out: string[] = [];
  const span = new Lg4Span(1, 5);
  const seen: number[] = [];
  for (const n of span) {
    if (n === 4) break;
    seen.push(n * 10);
  }
  out.push(seen.join(","), [...span].join(","), `${Array.from(span).length}`, [0, ...new Lg4Span(7, 9), 100].join(","));
  const [first, second, ...others] = span;
  out.push(`${first} ${second} ${others.join("+")}`);
  const tree = new Lg4Tree("root");
  tree.add("a").add("a1");
  tree.add("b");
  out.push([...tree].join(" "));
  for (const line of tree) if (line.startsWith("--")) out.push(`deep ${line}`);
  const evens: Lg4Span = new Lg4EvenSpan(1, 9);
  out.push([...evens].join(","), [...lg4Both(new Lg4Span(0, 2), new Lg4EvenSpan(2, 7))].join(","));
  return out;
}

function lg4Pad(x: string): string;
function lg4Pad(x: number, width: number): string;
function lg4Pad(x: string | number, width?: number): string {
  return typeof x === "string" ? `[${x}]` : String(x).padStart(width ?? 0, "0");
}

function lg4Twice(x: number): number;
function lg4Twice(x: string): string;
function lg4Twice(x: number | string): number | string {
  return typeof x === "number" ? x * 2 : x + x;
}

function lg4First(xs: number[]): number | undefined;
function lg4First(xs: number[], fallback: number): number;
function lg4First(xs: number[], fallback?: number): number | undefined {
  return xs.length ? xs[0] : fallback;
}

class Lg4Formatter {
  constructor(private readonly unit: string) {}
  show(x: number): string;
  show(x: string, upper: boolean): string;
  show(x: number | string, upper?: boolean): string {
    const text = typeof x === "number" ? `${x}${this.unit}` : x;
    return upper ? text.toUpperCase() : text;
  }
  scale(x: number): number;
  scale(x: number[]): number[];
  scale(x: number | number[]): number | number[] {
    return typeof x === "number" ? x * 2 : x.map((v) => v * 2);
  }
}

export function lg4Overloads(): string[] {
  const n: number = lg4Twice(21.5);
  const s: string = lg4Twice("ab");
  const f = new Lg4Formatter("px");
  const scaled: number[] = f.scale([1, 2.5]);
  return [
    `${lg4Pad("a")} ${lg4Pad(7, 3)} ${n} ${s} ${lg4Twice(2) + 1} ${lg4Twice("x").length}`,
    `${lg4First([], 9.5)} ${lg4First([4])} ${lg4First([])} ${[1, 2].map((v) => lg4Twice(v)).join(",")}`,
    `${f.show(3)} ${f.show("ok", true)} ${f.scale(4) + 1} ${scaled.join(",")}`,
  ];
}
