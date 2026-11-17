// Value classes (values.ts): classes nothing can tell from copies become Swift structs. Every line must equal bun's, both
// for classes that qualify (immutable, no identity) and for look-alikes that must stay shared objects.

class VlVec {
  constructor(
    public x: number,
    public y: number,
  ) {}
  add(o: VlVec): VlVec {
    return new VlVec(this.x + o.x, this.y + o.y);
  }
  scale(k: number): VlVec {
    return k === 1 ? this : new VlVec(this.x * k, this.y * k);
  }
  get len2(): number {
    return this.x * this.x + this.y * this.y;
  }
  static zero(): VlVec {
    return new VlVec(0, 0);
  }
}

class VlTag {
  readonly label: string;
  readonly parts: string[] = [];
  constructor(label: string, n: number) {
    this.label = label.toUpperCase();
    for (let i = 0; i < n; i++) this.parts.push(`${label}${i}`);
  }
  joined(): string {
    return this.parts.join("+");
  }
}

class VlSeg {
  constructor(
    readonly a: VlVec,
    readonly b: VlVec | null,
  ) {}
  mid(): VlVec {
    return this.b === null ? this.a : new VlVec((this.a.x + this.b.x) / 2, (this.a.y + this.b.y) / 2);
  }
}

interface VlHolder {
  name: string;
  at: VlVec;
}

/** Qualifying classes: arithmetic, arrays, optionals, records holding them, shared inner arrays. */
export function vlValues(): string[] {
  const out: string[] = [];
  let v = VlVec.zero();
  const step = new VlVec(1, 2);
  for (let i = 0; i < 5; i++) v = v.add(step);
  out.push(`sum ${v.x},${v.y} len2 ${v.len2} same ${v.scale(1).x}`);
  const vs: VlVec[] = [];
  for (let i = 0; i < 6; i++) vs.push(new VlVec(i, 10 - i * 3));
  const sorted = vs.slice().sort((a, b) => a.y - b.y);
  out.push(`sorted ${sorted.map((p) => `${p.x}:${p.y}`).join(" ")}`);
  out.push(`filtered ${vs.filter((p) => p.y > 0).length} reduced ${vs.reduce((acc, p) => acc + p.x * p.y, 0)}`);
  const maybe: VlVec | null = vs.length > 3 ? vs[3]! : null;
  out.push(`maybe ${maybe?.x ?? -1} ${maybe === null ? "null" : "set"}`);
  const t = new VlTag("ab", 3);
  const t2 = t;
  t2.parts.push("extra");
  out.push(`tag ${t.label} ${t.joined()} ${t2.parts.length}`);
  const seg = new VlSeg(new VlVec(0, 0), new VlVec(4, 6));
  const half = new VlSeg(new VlVec(1, 1), null);
  out.push(`mid ${seg.mid().x},${seg.mid().y} ${half.mid().x},${half.mid().y}`);
  const holders: VlHolder[] = [{ name: "h1", at: v }];
  holders[0]!.at = holders[0]!.at.add(step);
  out.push(`holder ${holders[0]!.name} ${holders[0]!.at.x},${holders[0]!.at.y} v ${v.x},${v.y}`);
  const grid: VlVec[][] = [[v, step], [step]];
  grid[1]!.push(grid[0]![0]!);
  out.push(`grid ${grid.map((row) => row.map((p) => p.x).join("/")).join(" ")}`);
  return out;
}

class VlBox {
  constructor(public v: number) {}
}

class VlPoint {
  constructor(
    readonly x: number,
    readonly y: number,
  ) {}
}

const vlRegistry: VlReg[] = [];
class VlReg {
  a = 0;
  constructor(x: number) {
    vlRegistry.push(this);
    this.a = x;
  }
}

class VlLazy {
  v = 3;
  f: () => number;
  constructor() {
    this.f = () => this.v * 2;
  }
}

class VlKey {
  constructor(readonly id: number) {}
}

class VlFound {
  constructor(readonly id: number) {}
}

function vlSame<T>(a: T, b: T): boolean {
  return a === b;
}

/** Look-alikes that must stay shared objects: written through an alias, compared, keyed, escaping their constructor. */
export function vlObjects(): string[] {
  const out: string[] = [];
  const a = new VlBox(1);
  const b = a;
  b.v = 2;
  out.push(`alias ${a.v} ${b.v}`);
  const p = new VlPoint(1, 2);
  const q = p;
  out.push(`identity ${p === q} ${p === new VlPoint(1, 2)} ${vlSame(p, q)}`);
  const r = new VlReg(7);
  out.push(`registry ${vlRegistry.length} ${vlRegistry[0]!.a} ${r.a}`);
  const lazy = new VlLazy();
  out.push(`lazy ${lazy.f()}`);
  const k1 = new VlKey(1);
  const m = new Map<VlKey, string>();
  m.set(k1, "one");
  m.set(new VlKey(1), "other");
  out.push(`map ${m.size} ${m.get(k1)}`);
  const xs = [new VlFound(1), new VlFound(2)];
  const f = xs[1]!;
  out.push(`indexOf ${xs.indexOf(f)} ${xs.indexOf(new VlFound(2))} ${xs.includes(f)}`);
  return out;
}
