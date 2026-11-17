// The runtimes' and printers' fast paths (performance work): each must give bun's results exactly, edge cases included.
import type { Int8 } from "../../src/index.ts";

/** Kotlin keeps these locals as StringBuilders (appended in a loop, read only outside it), or not (read inside). */
export function pfBuilders(): string[] {
  const out: string[] = [];
  let s = "start";
  for (let i = 0; i < 5; i++) s += `-${i}`;
  out.push(`${s} ${s.length}`);
  let t = "";
  for (let i = 0; i < 4; i++) {
    t += String(i);
    if (t.length > 2) out.push(`inside ${t}`);
  }
  let u = "";
  for (let r = 0; r < 3; r++) {
    let row = "";
    for (let c = 0; c < 3; c++) row += r * c;
    u += `[${row}]`;
    out.push(row);
  }
  let v = "x";
  v += v;
  for (let i = 0; i < 2; i++) v += 1.5;
  out.push(u, v, `${v.toUpperCase()}`);
  return out;
}

/** toFixed / toPrecision / toExponential at exact ties (half up, JavaScript's rule), where the next double is a whole
 *  digit away, and String(x) / toString(radix) of integers. */
export function pfFormats(): string[] {
  const xs = [707273840904235.875, -707273840904235.875, 2.5, -2.5, 0.125, 9.995, -9.995, 99.5, 0.5, 1.005, 1e21, 4503599627370495.5, 999999999999999.875, 0.375, 1.45, 125, 1250, 5e-7, 123456789012345680000];
  const out: string[] = [];
  for (const x of xs) {
    out.push([x.toFixed(0), x.toFixed(2), x.toPrecision(1), x.toPrecision(2), x.toPrecision(17), x.toExponential(0), x.toExponential(2), String(x)].join(" "));
  }
  out.push([255, -255, 2 ** 40, 0].map((n) => n.toString(16) + "/" + n.toString(2) + "/" + n.toString(36)).join(" "));
  out.push([0.1, 1 / 3, 2 ** -1074, 1e21, 1e-7, 123e-20, 5e-324, 1.7976931348623157e308, 9007199254740993].map((x) => String(x)).join(" "));
  return out;
}

/** Map / Set / Record with many number and string keys, deletes and re-adds: order and lookups. */
export function pfMaps(): string[] {
  const m = new Map<number, number>();
  for (let i = 0; i < 3000; i++) m.set((i * 7919) % 3001, i);
  for (let i = 0; i < 3000; i += 3) m.delete(i);
  m.set(-0, 1).set(0.5, 3);
  let sum = 0;
  for (const [k, v] of m) sum = (sum * 31 + k + v) % 1000003;
  m.set(NaN, 2);
  const s = new Set<string>();
  for (let i = 0; i < 2000; i++) s.add(`key-${i % 1500}-é`);
  for (let i = 0; i < 2000; i += 2) s.delete(`key-${i}-é`);
  let order = "";
  for (const k of s) if (k.length === 9) order += k.slice(4, 5);
  const r: Record<string, number> = {};
  for (let i = 0; i < 500; i++) r[`r${i}`] = i;
  for (let i = 0; i < 500; i += 2) delete r[`r${i}`];
  r["7"] = 7;
  const keys = Object.keys(r);
  return [`map ${m.size} ${sum} ${m.get(0)} ${m.get(NaN)} ${m.has(2999)}`, `set ${s.size} ${order}`, `record ${keys.length} ${keys[0]} ${keys[1]} ${keys[keys.length - 1]}`];
}

/** number[] and Int8[] (packed lists on Kotlin): pushing a list into itself, splice, sort, search, %, |. */
export function pfArrays(): string[] {
  const xs = [3, 1, 2];
  xs.push(...xs);
  xs.unshift(...xs.slice(0, 2));
  xs.splice(1, 2, 9, 8, 7);
  xs.sort((a, b) => a - b);
  const ys = xs.map((x) => x * 1.5).filter((x) => x > 2);
  const zs: number[] = [];
  zs[0] = NaN;
  zs.push(-0, 5);
  const bytes: Int8[] = [1, -2, 3];
  bytes.push(...bytes);
  bytes.splice(0, 1);
  let byteText = "";
  for (let i = 0; i < bytes.length; i++) {
    const b: number = bytes[i]!;
    byteText += `${b},`;
  }
  // Doubles (array elements), so % is fmod natively (Kotlin: Long % for whole operands); -0 when the dividend is negative.
  const ns = [-4, 7.5, -7, 2 ** 60, 5, -0, -6];
  const ds = [2, 2, 3, 7, -3, 5, 0.5];
  const rem = ns.map((n, i) => n % ds[i]!);
  const bits = [2 ** 32 + 5, -(2 ** 31) - 1, 2 ** 53, -1.5, 1e300].map((x) => (x | 0) + " " + (x & 0xff));
  return [
    xs.join(","),
    ys.join(","),
    `${xs.indexOf(7)} ${xs.lastIndexOf(1)} ${xs.includes(9)} ${zs.indexOf(NaN)} ${zs.includes(NaN)} ${zs.indexOf(0)}`,
    byteText,
    rem.map((x) => (Object.is(x, -0) ? "-0" : String(x))).join(" "),
    bits.join(" | "),
  ];
}

/** String searches and slices (Swift/Rust ASCII byte paths and the general UTF-16 ones). */
export function pfStrings(): string[] {
  const a = "the quick brown fox jumps over the lazy fox ".repeat(3);
  const u = "héllo wörld 😀 fox ünïcode fox";
  const out: string[] = [];
  for (const s of [a, u, "", "fox"]) {
    out.push(
      [s.indexOf("fox"), s.indexOf("fox", 20), s.indexOf("fox", 999), s.indexOf(""), s.indexOf("", 3), s.lastIndexOf("fox"), s.indexOf("ö"), s.includes("fox", 40) ? 1 : 0].join(","),
      s.split(" ").length + " " + s.split("o").join("|"),
      `${s.slice(2, 9)}|${s.slice(-6)}|${s.slice(5, 2)}|${s.substring(3, 12)}|${s.trim().length}|${s.charCodeAt(13)}`,
    );
  }
  let built = "";
  for (let i = 0; i < 30; i++) built += String.fromCharCode(97 + (i % 26)) + String.fromCharCode(0xe9);
  out.push(built, `  \t padded \n `.trim(), " x ".trim().length.toString());
  return out;
}
