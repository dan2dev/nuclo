// Sized number types (Int8…Float32, `BigInt` = Int64): stored natively in the smallest type, plain numbers in
// JavaScript. Every top-level name starts with `nt` / `Nt` (one native namespace).
import type { BigInt, Float32, Int16, Int32, Int64, Int8, UInt16, UInt32, UInt8 } from "../../src/index.ts";

/** Limits, negative values and the explicit wrapping conversions (JavaScript's own idioms). */
export function ntLimits(): string[] {
  const a: Int8 = -128;
  const b: Int8 = 127;
  const c: Int16 = -32768;
  const d: Int16 = 32767;
  const e: Int32 = -2147483648;
  const f: Int32 = 2147483647;
  const g: UInt8 = 255;
  const h: UInt16 = 65535;
  const i: UInt32 = 4294967295;
  const j: Int64 = 9007199254740991;
  const k: Int64 = -9007199254740991;
  const big: BigInt = 342323;
  return [`${a} ${b} ${c} ${d}`, `${e} ${f}`, `${g} ${h} ${i}`, `${j} ${k} ${big}`, `${a + b} ${e - 1} ${f + 1} ${i + 1} ${j + 1}`];
}

function ntToInt8(x: number): Int8 {
  return (x << 24) >> 24;
}
function ntToUInt8(x: number): UInt8 {
  return x & 0xff;
}
export function ntWrap(): string[] {
  const out: string[] = [];
  const xs = [0, 1, 127, 128, 255, 256, -1, -129, 1000.7, -1000.7, 3e9, -3e9];
  for (const x of xs) {
    const s8: Int8 = (x << 24) >> 24;
    const u8: UInt8 = x & 0xff;
    const s16: Int16 = (x << 16) >> 16;
    const u16: UInt16 = x & 0xffff;
    const s32: Int32 = x | 0;
    const u32: UInt32 = x >>> 0;
    out.push(`${x}: ${s8} ${u8} ${s16} ${u16} ${s32} ${u32} ${ntToInt8(x)} ${ntToUInt8(x)}`);
  }
  return out;
}

/** Float32: only what Math.fround returns; reads print as JavaScript prints the double value. */
function ntHalf(x: Float32): Float32 {
  return Math.fround(x / 2);
}
export function ntFloat32(): string[] {
  const a: Float32 = Math.fround(0.1);
  const b: Float32 = 0.5;
  const c: Float32 = Math.fround(1 / 3);
  const d: Float32 = Math.fround(1e40);
  const e: Float32 = Math.fround(-1e-50);
  const f: Float32 = 16777216;
  const n: UInt8 = 200;
  const g: Float32 = n;
  const sum: Float32 = Math.fround(a + c);
  return [`${a} ${b} ${c}`, `${d} ${e} ${1 / e} ${f} ${g}`, `${sum} ${a + c} ${a * 3} ${ntHalf(a)} ${ntHalf(f)}`, `${a.toFixed(3)} ${a === 0.1} ${a > 0.1} ${Math.floor(c * 100)}`];
}

/** Fields of classes and interfaces, parameter properties, getters, globals. */
interface NtPixel { r: UInt8; g: UInt8; b: UInt8; alpha: Float32 }
class NtCounter {
  count: UInt16 = 0;
  constructor(public readonly id: Int16, public scale: Float32) {}
  bump(by: UInt8): UInt16 {
    this.count = (this.count + by) & 0xffff;
    return this.count;
  }
  get doubled(): Int32 {
    return this.count * 2;
  }
}
let ntTicks: Int8 = 120;
function ntTick(): Int8 {
  ntTicks = ((ntTicks + 5) << 24) >> 24;
  return ntTicks;
}
function ntGray(p: NtPixel): UInt8 {
  return Math.round((p.r + p.g + p.b) / 3) & 0xff;
}
export function ntFields(): string[] {
  const p: NtPixel = { r: 250, g: 128, b: 3, alpha: Math.fround(0.75) };
  const q: NtPixel = { ...p, b: p.r };
  const c = new NtCounter(-300, Math.fround(1.5));
  c.bump(200);
  c.bump(255);
  for (let i = 0; i < 300; i++) c.bump(255);
  return [
    `${p.r} ${p.g} ${p.b} ${p.alpha} ${ntGray(p)} ${ntGray(q)}`,
    `${c.id} ${c.scale} ${c.count} ${c.doubled} ${c.bump(1)}`,
    `${ntTick()} ${ntTick()} ${ntTick()}`,
  ];
}

/** Arrays of them: packed natively. */
function ntSum(xs: UInt8[]): number {
  let total = 0;
  for (let i = 0; i < xs.length; i++) total += xs[i]!;
  return total;
}
function ntRamp(n: number): Int16[] {
  const out: Int16[] = [];
  for (let i = 0; i < n; i++) out.push(((i * 1000) << 16) >> 16);
  return out;
}
export function ntArrays(): string[] {
  const bytes: UInt8[] = [0, 1, 254, 255];
  bytes.push(128);
  bytes.unshift(7);
  bytes[0] = (bytes[0]! * 100) & 0xff;
  const copy: UInt8[] = [...bytes, 9];
  copy.splice(1, 2);
  const ramp = ntRamp(40);
  const floats: Float32[] = [Math.fround(0.1), 2, Math.fround(Math.PI)];
  floats[1] = Math.fround(floats[0]! * floats[2]!);
  const longs: Int64[] = [1, -1, 2147483648, 4294967296 * 1000];
  let text = "";
  for (let i = 0; i < copy.length; i++) text += `${copy[i]!},`;
  return [
    `${bytes.length} ${ntSum(bytes)} ${text}`,
    `${ramp.length} ${ramp[32]!} ${ramp[33]!} ${ramp[39]!}`,
    `${floats[0]!} ${floats[1]!} ${floats[2]!}`,
    `${longs[0]! + longs[1]!} ${longs[2]! * 2} ${longs[3]!}`,
  ];
}

/** Generics, map values and unions take sized types as plain numbers (sound, not packed). */
class NtBox<T> {
  constructor(public value: T) {}
}
function ntFirst<T>(xs: T[]): T | undefined {
  return xs[0];
}
export function ntGenerics(): string[] {
  const box = new NtBox<Int8>(-5);
  const big = new NtBox<UInt32>(4000000000);
  const tally: Record<string, UInt8> = { a: 1, b: 255 };
  tally["c"] = 300;
  const maybe: UInt8 | null = null;
  const nums: Int8[] = [3, -4];
  const first = ntFirst<number>([nums[0]!, nums[1]!]);
  return [`${box.value} ${box.value * 100} ${big.value + 1}`, `${tally["a"] ?? 0} ${tally["b"] ?? 0} ${tally["c"] ?? 0} ${maybe ?? -1} ${first ?? 0}`];
}

/** Mixing with Int and Double, comparisons, Math. */
export function ntMixing(): string[] {
  const a: Int8 = -100;
  const b: UInt8 = 200;
  const c: Int32 = 2000000000;
  const d: UInt32 = 3000000000;
  const e: Int64 = 9007199254740990;
  const half = 0.5;
  const n = 7;
  const lines = [
    `${a + b} ${a * b} ${a - b} ${b / a} ${a % 7} ${b % 7}`,
    `${c + c} ${c * 2} ${d + d} ${d - c} ${e + 1} ${e + 3}`,
    `${a < b} ${b > d} ${a === -100} ${b !== 200} ${c >= d} ${Math.max(a, b)} ${Math.min(a, b, n)}`,
    `${Math.abs(a)} ${Math.sqrt(b)} ${Math.pow(a, 2)} ${a * half} ${a + n} ${Math.sign(a)} ${Math.trunc(d / 7)}`,
    `${a > 0 ? "pos" : "neg"} ${b ? "truthy" : "falsy"} ${-a} ${~b} ${b >> 1} ${b << 30} ${d >>> 1} ${d | 0}`,
  ];
  // Clamps and modulo write back in range.
  const clamped: UInt8 = Math.min(Math.max(a * 3, 0), 255);
  const wrapped: Int8 = a % 100;
  const fromSmall: Int16 = a * b;
  const fromInt: Int32 = n * 1000;
  const fromDouble: UInt16 = Math.floor(Math.min(Math.max(half * 999, 0), 65535));
  const ok: Int64 = c;
  lines.push(`${clamped} ${wrapped} ${fromSmall} ${fromInt} ${fromDouble} ${ok}`);
  return lines;
}

/** A class implementing an interface's sized field, destructuring reads, sized values into Int/Double slots and back. */
interface NtLevel { level: UInt8; name: string }
class NtLamp implements NtLevel {
  level: UInt8 = 10;
  constructor(public name: string) {}
  dim(): void {
    this.level = Math.max(this.level - 30, 0);
  }
}
function ntDescribe(l: NtLevel): string {
  const { level, name } = l;
  return `${name}=${level}`;
}
const ntScale: Float32 = Math.fround(2.5);
export function ntShapes(): string[] {
  const lamp = new NtLamp("desk");
  const before = ntDescribe(lamp);
  lamp.dim();
  const asInt = lamp.level + 1;
  const asDouble = ntScale * 2;
  let back: Int16 = 0;
  back = (asInt * 100) & 0x7fff;
  const levels: NtLevel[] = [lamp, { level: 200, name: "hall" }];
  let total = 0;
  for (const l of levels) total += l.level;
  return [`${before} ${ntDescribe(lamp)} ${asInt} ${asDouble} ${back} ${total} ${ntScale}`];
}
