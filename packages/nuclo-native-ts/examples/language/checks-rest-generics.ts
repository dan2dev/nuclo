// Remaining rejected constructs (rest): generic methods of generic classes.

class RsBox<T> {
  constructor(readonly value: T) {}
  map<U>(f: (v: T) => U): RsBox<U> {
    return new RsBox<U>(f(this.value));
  }
  pair<U>(other: U): [T, U] {
    return [this.value, other];
  }
  twice<U>(f: (v: T) => U): U[] {
    return [this.map(f).value, f(this.value)];
  }
  show(): string {
    return `Box(${String(this.value)})`;
  }
}

class RsList<T> {
  private items: T[] = [];
  add(x: T): RsList<T> {
    this.items.push(x);
    return this;
  }
  map<U>(f: (x: T, i: number) => U): RsList<U> {
    const out = new RsList<U>();
    this.items.forEach((x, i) => out.add(f(x, i)));
    return out;
  }
  reduce<A>(f: (acc: A, x: T) => A, init: A): A {
    let acc = init;
    for (const x of this.items) acc = f(acc, x);
    return acc;
  }
  join(sep: string): string {
    return this.items.map((x) => String(x)).join(sep);
  }
}

export function rsGenericMethods(): string[] {
  const out: string[] = [];
  const b = new RsBox(21);
  out.push(b.map((x) => x * 2).show(), b.map((x) => `n${x}`).map((s) => s.length).show());
  const [l, r] = b.pair("right");
  out.push(`${l} ${r} ${b.twice((x) => x + 0.5).join(",")}`);
  const s = new RsBox("hey");
  out.push(s.map((x) => x.toUpperCase()).show(), `${s.pair(true)[0]}/${s.pair(false)[1]}`);
  const list = new RsList<number>().add(1).add(2).add(3);
  out.push(list.map((x, i) => `${i}=${x}`).join(" "), `${list.reduce((a, x) => a + x, 0)}`, list.reduce((a, x) => a + String(x), ">"));
  return out;
}
