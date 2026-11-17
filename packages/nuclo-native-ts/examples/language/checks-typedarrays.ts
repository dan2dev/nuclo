// Typed arrays: packed native buffers with JavaScript's conversions on write (wrapping, clamping, fround), views
// sharing memory (subarray) and copies (slice), numeric sort and JavaScript's number formatting.

function show(name: string, values: string): string {
  return `${name}: ${values}`;
}

export function taConstruct(): string[] {
  const out: string[] = [];
  const a = new Uint8Array(4);
  out.push(show("zeros", a.join(",")), `length ${a.length} bytes ${a.byteLength} per ${Uint8Array.BYTES_PER_ELEMENT}`);
  const b = new Int16Array([1, -2, 40000, 3.9]);
  out.push(show("from literal", b.join(" ")));
  const xs: number[] = [0.5, 1.5, 2.5, -1];
  out.push(show("from array", String(new Int32Array(xs))));
  out.push(show("of", Float64Array.of(1, 0.1, -0, 1e21).join("|")));
  out.push(show("from", Uint16Array.from(xs).join(",")));
  out.push(show("from map", Float32Array.from(xs, (x: number, i: number) => x * 10 + i).join(",")));
  const c = new Float64Array(b);
  out.push(show("copy of typed", `${c}`), `bpe ${Int8Array.BYTES_PER_ELEMENT} ${Int16Array.BYTES_PER_ELEMENT} ${Float32Array.BYTES_PER_ELEMENT} ${Float64Array.BYTES_PER_ELEMENT}`);
  const empty = new Float32Array(0);
  out.push(show("empty", `[${empty.join(",")}] ${empty.length}`));
  return out;
}

export function taWrap(): string[] {
  const out: string[] = [];
  const i8 = new Int8Array(6);
  i8[0] = 127;
  i8[1] = 128;
  i8[2] = -129;
  i8[3] = 255.9;
  i8[4] = -0.5;
  i8[5] = 1000;
  out.push(show("int8", i8.join(",")));
  const u8 = new Uint8Array(6);
  u8[0] = -1;
  u8[1] = 256;
  u8[2] = 3.7;
  u8[3] = -3.7;
  u8[4] = 1e10;
  u8[5] = 2 ** 53;
  out.push(show("uint8", u8.join(",")));
  const i16 = Int16Array.of(32767, 32768, -32769, 65535);
  const u16 = Uint16Array.of(-1, 65536, 70000, 1.5);
  out.push(show("int16", i16.join(",")), show("uint16", u16.join(",")));
  const i32 = Int32Array.of(2147483647, 2147483648, -2147483649, 4294967296 + 5, 1e20);
  const u32 = Uint32Array.of(-1, 4294967295, 4294967296, -2147483648, 3e9);
  out.push(show("int32", i32.join(",")), show("uint32", u32.join(",")));
  const nan = Int32Array.of(NaN, Infinity, -Infinity, -0);
  out.push(show("int specials", nan.join(",")));
  // Int arithmetic stored back wraps as JavaScript's ToInt32 does.
  const acc = new Int32Array(1);
  acc[0] = 2147483647;
  acc[0] += 1;
  out.push(`wrapped ${acc[0]}`);
  acc[0] -= 1;
  out.push(`back ${acc[0]}`);
  acc[0] *= 3;
  out.push(`times ${acc[0]}`);
  const n = new Uint8Array(2);
  n[0] = 250;
  for (let k = 0; k < 10; k++) n[0]!++;
  n[1]!--;
  out.push(`counted ${n[0]!} ${n[1]!}`);
  const big = new Uint32Array(1);
  big[0] = 4000000000;
  big[0] += 500000000;
  out.push(`uint32 sum ${big[0]}`);
  return out;
}

export function taClamped(): string[] {
  const c = new Uint8ClampedArray(10);
  const values = [-5, 300, 1.5, 2.5, 0.5, 254.5, 253.5, NaN, Infinity, 127.49999];
  for (let i = 0; i < values.length; i++) c[i] = values[i]!;
  const out = [show("clamped", c.join(","))];
  c[0] = 250;
  c[0] += 10;
  out.push(`clamped add ${c[0]}`);
  c[1] = 3;
  c[1] -= 10;
  out.push(`clamped sub ${c[1]}`);
  out.push(show("clamped of", Uint8ClampedArray.of(-0.4, 0.6, 1e9).join(",")));
  return out;
}

export function taFloats(): string[] {
  const out: string[] = [];
  const f = Float32Array.of(0.1, 1 / 3, 16777217, 3.4028235e38, 1e39, -1e-46, 1e-45, NaN, -0);
  out.push(show("float32", f.join(",")));
  const first = f[0]!;
  out.push(`read ${first} ${first === 0.1}`);
  out.push(`string ${String(f.subarray(0, 3))}`);
  const d = Float64Array.of(0.1 + 0.2, 1e21, 1e-7, 123456789012345680000, -0, NaN, Infinity);
  out.push(show("float64", d.join(" ")));
  out.push(`template ${d.subarray(4)}`);
  const sum = new Float32Array(1);
  for (let i = 0; i < 10; i++) sum[0]! += 0.1;
  out.push(`float32 sum ${sum[0]!}`);
  return out;
}

export function taReads(): string[] {
  const out: string[] = [];
  const a = Int16Array.of(10, -20, 30);
  const missing = a[5];
  out.push(`missing ${missing === undefined} ${a[3] ?? -1} ${a[-1] ?? -2}`);
  out.push(`at ${a.at(0)!} ${a.at(-1)!} ${a.at(-3)!} ${a.at(3) ?? -1} ${a.at(-4) ?? -1} ${a.at(1.7)!} ${a.at(-0.5)!}`);
  a[7] = 99;
  a[-1] = 5;
  out.push(`ignored ${a.join(",")} ${a.length}`);
  let total = 0;
  for (let i = 0; i < a.length; i++) total += a[i]!;
  out.push(`total ${total}`);
  const x = a[1];
  if (x !== undefined) out.push(`narrowed ${x * 2}`);
  const u = Uint32Array.of(4294967295);
  const big = u[0]!;
  out.push(`uint32 read ${big + 1} ${big * 2}`);
  const i = Int32Array.of(-2147483648, 2147483647);
  const lo = i[0]!;
  const hi = i[1]!;
  out.push(`int32 reads ${lo - 1} ${hi + hi} ${lo * hi}`);
  const idx = Uint8Array.of(2, 0, 1);
  const names = ["a", "b", "c"];
  out.push(`as index ${names[idx[0]!]!} ${idx[idx[2]!]!}`);
  return out;
}

export function taViews(): string[] {
  const out: string[] = [];
  const base = Int8Array.of(1, 2, 3, 4, 5, 6, 7, 8);
  const view = base.subarray(2, 6);
  view[0] = 100;
  view[3] = -1;
  out.push(show("base", base.join(",")), show("view", view.join(",")), `view ${view.length} offset ${view.byteOffset}`);
  const inner = view.subarray(1, -1);
  inner.fill(9);
  out.push(show("inner", inner.join(",")), show("base after", base.join(",")));
  const copy = base.slice(1, 3);
  copy[0] = 0;
  out.push(show("copy", copy.join(",")), show("base kept", base.join(",")));
  out.push(show("neg", base.subarray(-2).join(",")), show("empty", `[${base.subarray(5, 2).join(",")}]`), show("slice neg", base.slice(-3, -1).join(",")));
  const alias = base;
  alias[0] = 42;
  out.push(`alias ${base[0]!}`);
  // set() from an overlapping view of the same memory copies as if through a temporary.
  const s = Uint8Array.of(1, 2, 3, 4, 5, 6);
  s.set(s.subarray(0, 4), 2);
  out.push(show("set overlap", s.join(",")));
  const t = Uint8Array.of(1, 2, 3, 4, 5, 6);
  t.set(t.subarray(2), 0);
  out.push(show("set overlap back", t.join(",")));
  const f = new Float32Array(4);
  f.set([1.5, 300, -0.1]);
  f.set(Int16Array.of(-7), 3);
  out.push(show("set mixed", f.join(",")));
  const u = new Uint8Array(3);
  u.set(Float64Array.of(-1, 256.5, 3.99));
  out.push(show("set converts", u.join(",")));
  const cw = Int16Array.of(1, 2, 3, 4, 5);
  cw.copyWithin(0, 3);
  out.push(show("copyWithin", cw.join(",")));
  cw.copyWithin(1, 0, 3);
  out.push(show("copyWithin fwd", cw.join(",")));
  cw.copyWithin(-2, -4, -3);
  out.push(show("copyWithin neg", cw.join(",")));
  const sub = Float64Array.of(1, 2, 3, 4);
  const sv = sub.subarray(1, 3);
  sv.reverse();
  out.push(show("reverse view", sub.join(",")));
  return out;
}

export function taMethods(): string[] {
  const out: string[] = [];
  const a = Int16Array.of(5, -3, 8, 0, 8, 2);
  out.push(show("map", a.map((x: number) => x * 1000).join(",")), show("map i", a.map((x: number, i: number) => x + i).join(",")));
  out.push(show("filter", a.filter((x: number) => x > 0).join(",")), `filter type ${a.filter((x: number, i: number) => i % 2 === 0).length}`);
  out.push(`reduce ${a.reduce((s: number, x: number) => s + x, 0)} ${a.reduce((s: string, x: number) => s + x, "#")}`);
  let seen = "";
  a.forEach((x: number, i: number) => {
    seen += `${i}=${x};`;
  });
  out.push(`forEach ${seen}`);
  out.push(`some ${a.some((x: number) => x < 0)} ${a.some((x: number) => x > 100)} every ${a.every((x: number) => x > -10)} ${a.every((x: number, i: number) => i < 3)}`);
  out.push(`find ${a.find((x: number) => x > 6)!} ${a.find((x: number) => x > 60) ?? -1} findIndex ${a.findIndex((x: number) => x === 8)} ${a.findIndex((x: number) => x === 9)}`);
  out.push(`indexOf ${a.indexOf(8)} ${a.indexOf(8, 3)} ${a.indexOf(8, -2)} ${a.indexOf(7)} ${a.indexOf(8.5)} last ${a.lastIndexOf(8)} ${a.lastIndexOf(8, 3)} ${a.lastIndexOf(5, -7)}`);
  out.push(`includes ${a.includes(0)} ${a.includes(-0)} ${a.includes(1)} ${a.includes(5, 1)}`);
  const f = Float64Array.of(NaN, 1, -0);
  out.push(`nan ${f.indexOf(NaN)} ${f.includes(NaN)} ${f.indexOf(0)} ${f.includes(0)} ${f.lastIndexOf(-0)}`);
  out.push(`join ${a.join()} | ${a.join("")} | ${a.join(" - ")}`);
  const filled = new Uint8Array(6).fill(7).fill(300, 1, 3).fill(1.9, -2);
  out.push(show("fill", filled.join(",")));
  const r = Uint8Array.of(1, 2, 3);
  const same = r.reverse();
  same[0] = 9;
  out.push(show("reverse", r.join(",")));
  const mapped = Uint8Array.of(200, 100).map((x: number) => x * 2);
  out.push(show("map wraps", mapped.join(",")));
  const clampedMap = Uint8ClampedArray.of(200, 100).map((x: number) => x * 2);
  out.push(show("map clamps", clampedMap.join(",")));
  return out;
}

export function taSort(): string[] {
  const out: string[] = [];
  const a = Int32Array.of(10, 9, 1, -5, 100, 2);
  a.sort();
  out.push(show("numeric", a.join(",")));
  const f = Float64Array.of(3, NaN, -Infinity, 0, -0, 2.5, NaN, -1, Infinity);
  f.sort();
  out.push(show("floats", f.join(",")), `signs ${1 / f[2]!} ${1 / f[3]!}`);
  const d = Uint16Array.of(5, 1, 4, 2, 3);
  d.sort((x: number, y: number) => y - x);
  out.push(show("descending", d.join(",")));
  const parity = Int8Array.of(5, 2, 7, 4, 1, 6, 3);
  parity.sort((x: number, y: number) => (x % 2) - (y % 2));
  out.push(show("stable", parity.join(",")));
  const v = Float32Array.of(9, 8, 7, 6, 5);
  v.subarray(1, 4).sort();
  out.push(show("sort view", v.join(",")));
  const sorted = Uint8Array.of(3, 1, 2).sort().map((x: number) => x * 10);
  out.push(show("chained", sorted.join(",")));
  return out;
}

export function taIterate(): string[] {
  const out: string[] = [];
  const a = Uint8Array.of(3, 1, 4, 1, 5);
  let text = "";
  for (const x of a) text += `${x};`;
  out.push(`for-of ${text}`);
  const live = Int16Array.of(1, 2, 3);
  let sum = 0;
  for (const x of live) {
    if (x === 1) live[2] = 30;
    sum += x;
  }
  out.push(`live ${sum}`);
  const spread: number[] = [...a, 9];
  out.push(`spread ${spread.length} ${spread.join(",")}`);
  const f = Float32Array.of(0.1, 0.5);
  const fs = [...f];
  out.push(`spread floats ${fs.join(",")}`);
  let count = 0;
  for (const _ of new Float64Array(3)) count++;
  out.push(`count ${count}`);
  return out;
}

class Pixels {
  readonly data: Uint8ClampedArray;
  constructor(readonly width: number, readonly height: number) {
    this.data = new Uint8ClampedArray(width * height * 4);
  }
  set(x: number, y: number, r: number, g: number, b: number) {
    const i = (y * this.width + x) * 4;
    this.data[i] = r;
    this.data[i + 1] = g;
    this.data[i + 2] = b;
    this.data[i + 3] = 255;
  }
  row(y: number): Uint8ClampedArray {
    return this.data.subarray(y * this.width * 4, (y + 1) * this.width * 4);
  }
}

function histogram(values: Float64Array, buckets: number): Uint32Array {
  const h = new Uint32Array(buckets);
  for (const v of values) {
    const b = Math.min(buckets - 1, Math.floor(v * buckets));
    h[b]!++;
  }
  return h;
}

export function taObjects(): string[] {
  const out: string[] = [];
  const p = new Pixels(2, 2);
  p.set(1, 0, 300, -5, 127.5);
  p.set(0, 1, 1, 2, 3);
  out.push(show("pixels", p.data.join(",")), show("row 1", p.row(1).join(",")));
  p.row(0).fill(0);
  out.push(show("cleared", p.data.join(",")));
  const values = Float64Array.of(0.05, 0.15, 0.95, 0.5, 0.51, 0.99);
  out.push(show("histogram", histogram(values, 4).join(",")));
  let maybe: Int32Array | null = null;
  out.push(`null ${maybe === null}`);
  maybe = Int32Array.of(1);
  out.push(`set ${maybe !== null ? maybe.length : -1}`);
  const list: Float32Array[] = [Float32Array.of(1), Float32Array.of(2, 3)];
  list[1]![0] = 0.25;
  out.push(`in array ${list.map((t: Float32Array) => t.join("+")).join(" ")}`);
  return out;
}
