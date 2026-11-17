// Edge cases: control flow, truthiness, destructuring, closures, exceptions, classes, generators. Names start with `ed`.

function edMaybe(n: number): number | undefined {
  return n < 0 ? undefined : n;
}
function edMaybeStr(s: string): string | null {
  return s === "null" ? null : s;
}
function edMaybeBool(n: number): boolean | undefined {
  return n === 0 ? undefined : n > 0;
}
function edD(n: number): number {
  return n;
}

/** Truthiness of every primitive, nullable or not: 0, -0, NaN, "", false, null and undefined are falsy. */
export function edTruthy(): string[] {
  const nums = [0, -0, NaN, 1, -1, 0.5, Infinity].map((n) => edD(n));
  const strs = ["", " ", "0", "false", "null"];
  const opt = [edMaybe(-1), edMaybe(0), edMaybe(2), edMaybe(NaN)];
  const os = strs.map((s) => edMaybeStr(s));
  const ob = [edMaybeBool(0), edMaybeBool(1), edMaybeBool(-1)];
  const ints = [0, 1, -1];
  return [
    nums.map((n) => (n ? "T" : "F")).join("") + " " + nums.map((n) => (!n ? "T" : "F")).join("") + " " + ints.map((n) => (n ? "T" : "F")).join(""),
    strs.map((s) => (s ? "T" : "F")).join("") + " " + os.map((s) => (s ? "T" : "F")).join("") + " " + os.map((s) => (s == null ? "N" : "V")).join(""),
    opt.map((n) => (n ? "T" : "F")).join("") + " " + opt.map((n) => (n !== undefined ? "D" : "U")).join("") + " " + ob.map((b) => (b ? "T" : "F")).join("") + " " + ob.map((b) => (!b ? "T" : "F")).join(""),
    `${opt.filter((n) => !!n).length} ${nums.filter((n) => !!n).length} ${os.filter((s) => !!s).length} ${opt.map((n) => n ?? -1).join()} ${os.map((s) => s ?? "~").join("|")}`,
    `${opt.map((n) => (n || 7)).join()} ${strs.map((s) => s || "-").join("|")} ${ob.map((b) => (b === undefined ? "u" : `${b}`)).join()}`,
  ];
}

/** Loops: fractional ranges, bounds changed by the body, do-while, nested breaks, closures over loop variables. */
export function edLoops(): string[] {
  const out: string[] = [];
  const half = edD(2.5);
  let a = "";
  for (let i = 0.5; i < 3; i++) a += `${i},`;
  for (let i = 0; i < half; i++) a += `${i};`;
  for (let i = 0; i <= half; i++) a += `${i}:`;
  for (let i = edD(-1.5); i < 1; i++) a += `${i}|`;
  out.push(a);
  const fns: (() => number)[] = [];
  for (let i = 0; i < 3; i++) fns.push(() => i * 10);
  const fns2: (() => number)[] = [];
  for (const x of [7, 8, 9]) fns2.push(() => x);
  let k = 0;
  const fns3: (() => number)[] = [];
  while (k < 3) {
    const kk = k;
    fns3.push(() => kk + k);
    k++;
  }
  out.push(`${fns.map((f) => f()).join()} ${fns2.map((f) => f()).join()} ${fns3.map((f) => f()).join()}`);
  let n = 0;
  do n++;
  while (n < 0);
  let found = "";
  for (let i = 0; i < 4; i++) {
    let stop = false;
    for (let j = 0; j < 4; j++) {
      if (j > i) break;
      if ((i + j) % 2 === 1) continue;
      found += `${i}${j} `;
      if (i * j === 4) {
        stop = true;
        break;
      }
    }
    if (stop) break;
  }
  let countdown = "";
  for (let i = 5; i > 0; i -= 2) countdown += i;
  let shrink = "";
  const xs = [1, 2, 3, 4, 5, 6];
  for (let i = 0; i < xs.length; i++) {
    shrink += xs[i]!;
    if (xs[i]! % 2 === 0) xs.pop();
  }
  out.push(`${n} ${found}${countdown} ${shrink} ${xs.length}`);
  let s = 0;
  for (const v of [1, 2, 3]) {
    if (v === 2) continue;
    s += v;
  }
  let left = 10;
  while (true) {
    left -= 3;
    if (left < 0) break;
  }
  out.push(`${s} ${left}`);
  return out;
}

/** switch: strings, numbers, default in the middle, grouped cases, return from inside. */
export function edSwitch(): string[] {
  const kind = (s: string): string => {
    switch (s) {
      case "a":
      case "e":
        return "vowel";
      default:
        return "other";
      case "":
        return "empty";
      case "é":
        return "e-acute";
    }
  };
  const grade = (n: number): string => {
    let g = "?";
    switch (Math.floor(n / 10)) {
      case 10:
      case 9:
        g = "A";
        break;
      case 8:
        g = "B";
        break;
      case -0:
        g = "zero";
        break;
      default:
        g = "F";
    }
    return g;
  };
  return [["a", "e", "x", "", "é", "é"].map(kind).join(" "), [100, 95, 85, 5, -5, 50, 0.5].map(grade).join(" ")];
}

/** Destructuring defaults apply only to undefined, never to null; rest, nesting, swaps. */
export function edDestructure(): string[] {
  const opts: { a?: number; b?: string; c?: number }[] = [{}, { a: 0 }, { a: 1, b: "", c: NaN }];
  const lines = opts.map(({ a = 5, b = "dflt", c = -1 }) => `${a}/${b}/${c}`);
  const [x = 1, y = 2, ...rest] = [edMaybe(-1), edMaybe(0), edMaybe(3), edMaybe(-4)];
  const nested: [number, string, boolean] = [1, "two", false];
  const [one, two, three] = nested;
  let p = 1;
  let q = 2;
  const t = p;
  p = q;
  q = t;
  const [first, ...others] = "abc".split("");
  return [lines.join(" "), `${x} ${y} ${rest.map((r) => r ?? -1).join()} ${one} ${two} ${three} ${p}${q} ${first ?? "?"} ${others.join("")}`];
}

/** try / catch / finally ordering: returns, rethrows, nested finally, loops. */
export function edFinally(): string[] {
  const log: string[] = [];
  const f = (mode: number): number => {
    try {
      log.push(`try${mode}`);
      if (mode === 1) throw new Error("one");
      if (mode === 2) return 2;
      return 0;
    } catch (e) {
      log.push(`catch${mode}`);
      return -1;
    } finally {
      log.push(`finally${mode}`);
    }
  };
  const g = (): string => {
    let s = "";
    for (let i = 0; i < 3; i++) {
      try {
        if (i === 1) continue;
        s += `b${i}`;
      } finally {
        s += `f${i}`;
      }
    }
    return s;
  };
  const h = (): string => {
    let s = "";
    try {
      try {
        throw new Error("inner");
      } finally {
        s += "F1";
      }
    } catch (e) {
      s += `C(${e instanceof Error ? e.message : "?"})`;
    } finally {
      s += "F2";
    }
    return s;
  };
  const results = [f(0), f(1), f(2)];
  return [log.join(" "), `${results.join()} ${g()} ${h()}`];
}

class EdShape {
  static count = 0;
  readonly id: number;
  constructor(public name: string) {
    EdShape.count++;
    this.id = EdShape.count;
  }
  area(): number {
    return 0;
  }
  get label(): string {
    return `${this.name}#${this.id}(${this.area().toFixed(2)})`;
  }
  toString(): string {
    return this.label;
  }
}
class EdCircle extends EdShape {
  constructor(public r: number) {
    super("circle");
  }
  override area(): number {
    return Math.PI * this.r * this.r;
  }
}
class EdSquare extends EdShape {
  private _side = 0;
  constructor(side: number) {
    super("square");
    this.side = side;
  }
  get side(): number {
    return this._side;
  }
  set side(v: number) {
    this._side = Math.max(0, v);
  }
  override area(): number {
    return this.side ** 2;
  }
}

/** Classes: statics, getters/setters, overrides, polymorphic arrays. */
export function edClasses(): string[] {
  const shapes: EdShape[] = [new EdCircle(1), new EdSquare(3), new EdSquare(-2), new EdCircle(0.5)];
  const sq = new EdSquare(2);
  sq.side = sq.side + 1.5;
  sq.side -= 10;
  return [shapes.map((s) => s.label).join(" "), `${EdShape.count} ${sq.side} ${sq.label} ${shapes.reduce((t, s) => t + s.area(), 0).toFixed(4)} ${shapes.map((s) => s instanceof EdCircle).join()}`];
}

/** Generators: lazy, infinite with early exit, return values. */
export function edGenerators(): string[] {
  function* range(start: number, end: number, step: number): Generator<number> {
    for (let v = start; step > 0 ? v < end : v > end; v += step) yield v;
  }
  function* fibs(): Generator<number> {
    let a = 0;
    let b = 1;
    for (;;) {
      yield a;
      const t = a + b;
      a = b;
      b = t;
    }
  }
  const firstFibs: number[] = [];
  for (const f of fibs()) {
    if (f > 100) break;
    firstFibs.push(f);
  }
  return [`${[...range(0, 1, 0.25)].join()} ${[...range(5, 0, -2)].join()} ${[...range(0, 0, 1)].length}`, firstFibs.join()];
}

/** Optional chaining and nullish coalescing on nested optionals. */
export function edOptional(): string[] {
  interface EdLink {
    value: number;
    next?: EdLink;
    tag?: string;
  }
  const list: EdLink = { value: 1, next: { value: 0, next: { value: 3, tag: "" } } };
  const pick = (n: number): EdLink | undefined => (n > 0 ? list : undefined);
  const empty = pick(0);
  const nv = list.next?.value;
  const deep = pick(1)?.next?.value;
  return [
    `${list.next?.value ?? -1} ${list.next?.next?.value ?? -1} ${list.next?.next?.next?.value ?? -9} ${empty?.value ?? -8} ${list.next?.next?.tag ?? "notag"} [${list.next?.next?.tag || "falsy"}]`,
    `${list.next?.value ?? 9} ${nv || 9} ${empty?.next?.value ?? -2} ${deep || -3}`,
  ];
}
