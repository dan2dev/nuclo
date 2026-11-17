/**
 * Language round 4: generic methods, generic functions declared in a block, statics of generic classes.
 * Every top-level name starts with `Lg4` / `lg4`.
 */

class Lg4Store {
  private readonly items: number[];
  constructor(...items: number[]) {
    this.items = items;
  }
  map<U>(f: (x: number) => U): U[] {
    return this.items.map(f);
  }
  reduce<A>(f: (acc: A, x: number) => A, start: A): A {
    let acc = start;
    for (const x of this.items) acc = f(acc, x);
    return acc;
  }
  pair<A, B>(a: A, b: B): string {
    return `${a}/${b}`;
  }
  static of<T>(x: T, n: number): T[] {
    const out: T[] = [];
    for (let i = 0; i < n; i++) out.push(x);
    return out;
  }
}

class Lg4Registry<T> {
  static created = 0;
  static label(): string {
    return `made ${Lg4Registry.created}`;
  }
  readonly items: T[] = [];
  constructor() {
    Lg4Registry.created++;
  }
  add(x: T): this {
    this.items.push(x);
    return this;
  }
}

export function lg4GenericMethods(): string[] {
  const s = new Lg4Store(1, 2, 3);
  const labels = s.map((x) => `#${x}`);
  const halves = s.map((x) => x / 2);
  const flags = s.map((x) => x > 1);
  const total = s.reduce((acc, x) => acc + x, 0.5);
  const text = s.reduce((acc, x) => acc + String(x), "");
  const a = new Lg4Registry<number>().add(1).add(2);
  const b = new Lg4Registry<string>().add("x");
  return [
    labels.join(","),
    halves.join(","),
    flags.join(","),
    `${total} ${text}`,
    `${s.pair(1, "b")} ${s.pair(true, 2.5)} ${s.pair("x", [1, 2].length)}`,
    `${Lg4Store.of("w", 2).join("")} ${Lg4Store.of(1.5, 3).join("+")}`,
    `${Lg4Registry.created} ${Lg4Registry.label()} ${a.items.length + b.items.length}`,
  ];
}

export function lg4LocalGenerics(): string[] {
  const tag = "#";
  function repeat<T>(x: T, n: number): T[] {
    return n <= 0 ? [] : [x, ...repeat(x, n - 1)];
  }
  function count<T>(xs: T[]): string {
    return `${tag}${xs.length}`;
  }
  function firstOr<T>(xs: T[], fallback: T): T {
    return xs.length > 0 ? xs[0]! : fallback;
  }
  const out: string[] = [count(repeat("a", 2)), count(repeat(1.5, 3)), repeat(true, 2).join("-")];
  out.push(`${firstOr([], "none")} ${firstOr([7], 0)} ${firstOr<number>([], 2.5)}`);
  return out;
}
