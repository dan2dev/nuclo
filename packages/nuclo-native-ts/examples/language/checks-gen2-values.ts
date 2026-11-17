// Generators, round 2 (values): generators kept in fields / arrays / maps, generic generators, generator methods of
// object literals, `yield*` of any iterable. bun is the reference. Top-level names start with G2 / g2.

class G2VLog {
  lines: string[] = [];
  add(s: string) {
    this.lines.push(s);
  }
}

class G2Tokens {
  private pos = 0;
  constructor(readonly src: string[]) {}
  *tokens(): Generator<string, void, unknown> {
    while (this.pos < this.src.length) yield this.src[this.pos++]!;
  }
}

class G2Reader {
  it: Generator<string, void, unknown>;
  read = 0;
  constructor(readonly toks: G2Tokens) {
    this.it = toks.tokens();
  }
  take(): string {
    const r = this.it.next();
    if (r.done) return "<eof>";
    this.read++;
    return r.value;
  }
}

class G2Self {
  current: Generator<number, void, unknown> | null = null;
  label = "self";
  *items(): Generator<number, void, unknown> {
    yield this.label.length;
    yield this.label.length * 2;
  }
  start() {
    // The generator holds this object, this object holds the generator: a cycle the collector frees.
    this.current = this.items();
  }
}

function* g2Range(from: number, to: number): Generator<number, void, unknown> {
  for (let i = from; i < to; i++) yield i;
}

export function g2Fields(): string[] {
  const out: string[] = [];
  const r = new G2Reader(new G2Tokens(["let", "x", "=", "1"]));
  out.push(`${r.take()} ${r.take()}`);
  out.push(`${r.take()} ${r.take()} ${r.take()} read=${r.read}`);
  for (let i = 0; i < 3; i++) {
    const s = new G2Self();
    s.label = "x".repeat(i + 1);
    s.start();
    const c = s.current;
    if (c) out.push(`self ${[...c].join(",")}`);
  }
  // Generators in arrays and maps, advanced in turn.
  const gens: Generator<number, void, unknown>[] = [g2Range(0, 3), g2Range(10, 12), g2Range(20, 24)];
  const merged: number[] = [];
  let live = gens.length;
  while (live > 0) {
    live = 0;
    for (const g of gens) {
      const n = g.next();
      if (!n.done) {
        merged.push(n.value);
        live++;
      }
    }
  }
  out.push(`round robin ${merged.join(",")}`);
  const byName = new Map<string, Generator<number, void, unknown>>();
  byName.set("a", g2Range(1, 3));
  byName.set("b", g2Range(5, 6));
  for (const [name, g] of byName) out.push(`${name}: ${[...g].join(",")}`);
  const later = byName.get("a");
  out.push(`drained ${later ? `${later.next().done}` : "none"}`);
  out.push(`churn ${g2Churn(4)} ${g2Churn(7)}`);
  return out;
}

function* g2Repeat<T>(value: T, n: number): Generator<T, number, unknown> {
  for (let i = 0; i < n; i++) yield value;
  return n;
}

function* g2Pairs<A, B>(as: A[], bs: B[]): Generator<string, void, unknown> {
  for (let i = 0; i < Math.min(as.length, bs.length); i++) yield `${as[i]}:${bs[i]}`;
}

// The callback may throw: this generator's shapes (`Generator<U, number>`) throw, not the others'.
function* g2MapGen<T, U>(src: Generator<T, void, unknown>, f: (x: T) => U): Generator<U, number, unknown> {
  let n = 0;
  for (const x of src) {
    yield f(x);
    n++;
  }
  return n;
}

export function g2Generic(): string[] {
  const out: string[] = [];
  out.push(`repeat num ${[...g2Repeat(7, 3)].join(",")}`);
  out.push(`repeat str ${[...g2Repeat("ab", 2)].join(",")}`);
  const it = g2Repeat(true, 1);
  const a = it.next();
  const b = it.next();
  out.push(`repeat bool ${a.done ? "" : a.value} ${b.done ? b.value : ""}`);
  out.push(`pairs ${[...g2Pairs([1, 2, 3], ["x", "y"])].join(" ")}`);
  out.push(`mapped ${[...g2MapGen(g2Range(1, 4), (x: number) => `<${x * x}>`)].join("")}`);
  out.push(`mapped str ${[...g2MapGen(g2Pairs(["ab", "c"], [10, 200]), (s: string) => s.length)].join(",")}`);
  return out;
}

interface G2Bag {
  name: string;
  items(): Generator<string, void, unknown>;
}

export function g2Literal(): string[] {
  const out: string[] = [];
  const bag: G2Bag = {
    name: "bag",
    *items() {
      yield `${this.name}-1`;
      yield `${this.name}-2`;
    },
  };
  out.push([...bag.items()].join(","));
  bag.name = "renamed";
  out.push([...bag.items()].join(","));
  const counter = {
    n: 3,
    *down(): Generator<number, void, unknown> {
      while (this.n > 0) yield this.n--;
    },
  };
  out.push(`down ${[...counter.down()].join(",")} left ${counter.n}`);
  return out;
}

class G2Deck {
  constructor(readonly cards: string[]) {}
  *[Symbol.iterator](): Generator<string, void, unknown> {
    for (const c of this.cards) yield c;
  }
}

function* g2All(log: G2VLog): Generator<string, void, unknown> {
  yield* "héllo😀";
  const m = new Map<string, number>([
    ["a", 1],
    ["b", 2],
  ]);
  yield* m.keys();
  for (const v of m.values()) yield `${v}`;
  const s = new Set<string>(["x", "y", "x"]);
  yield* s;
  yield* new G2Deck(["K", "Q"]);
  yield* ["arr1", "arr2"];
  log.add("all end");
}

function* g2Entries(m: Map<string, number>): Generator<[string, number], void, unknown> {
  yield* m;
}

export function g2Iterables(): string[] {
  const log = new G2VLog();
  log.add([...g2All(log)].join("|"));
  const m = new Map<string, number>([
    ["one", 1],
    ["two", 2],
  ]);
  for (const [k, v] of g2Entries(m)) log.add(`entry ${k}=${v}`);
  // A Map iterated through `yield*` is live: an entry added meanwhile is seen.
  const it = g2Entries(m);
  const first = it.next();
  if (!first.done) log.add(`first ${first.value[0]}`);
  m.set("three", 3);
  log.add(`rest ${[...it].map((e) => e[0]).join(",")}`);
  return log.lines;
}

/** Objects holding their own (sync and async) generators, which hold them back: cycles the collector frees (test/leaks). */
class G2Loop {
  gen: Generator<number, void, unknown> | null = null;
  agen: AsyncGenerator<number, void, unknown> | null = null;
  peers: G2Loop[] = [];
  constructor(readonly id: number) {}
  *walk(): Generator<number, void, unknown> {
    for (const p of this.peers) yield p.id * 10 + this.id;
  }
  async *later(): AsyncGenerator<number, void, unknown> {
    yield this.id;
  }
}

export function g2Churn(n: number): number {
  let sum = 0;
  const all: G2Loop[] = [];
  for (let i = 0; i < n; i++) all.push(new G2Loop(i));
  for (const l of all) {
    l.peers = all;
    l.gen = l.walk();
    l.agen = l.later();
    const r = l.gen.next();
    if (!r.done) sum += r.value;
    const r2 = l.gen.next();
    if (!r2.done) sum += r2.value;
  }
  return sum;
}
