/**
 * lib4: JavaScript's errors where JavaScript throws them (RangeError of `with`, `new Array(n)`, `repeat`, `toFixed`…),
 * caught and printed, and `%` by a divisor that may be 0 (NaN, never a trap). Every top-level name starts with `l4`.
 */

function l4Try(out: string[], label: string, f: () => string): void {
  try {
    out.push(`${label}: ${f()}`);
  } catch (e) {
    out.push(`${label}: ${String(e)}`);
  }
}

export function l4RangeErrors(): string[] {
  const out: string[] = [];
  const xs = [1, 2, 3];
  const idx = [5, -4, 1.7, NaN, -1, Infinity, 0, 2, -3];
  for (const i of idx) {
    try {
      out.push(`with(${i}): ${xs.with(i, 9).join(",")}`);
    } catch (e) {
      out.push(`with(${i}): ${String(e)}`);
    }
  }
  out.push(xs.join(","));
  // repeat / toFixed / new Array(n) throw to a catch around them (elsewhere a bad argument stops the program).
  const counts = [2, 0, 2.9, NaN, -0.5, -1, Infinity];
  for (const n of counts) {
    try {
      out.push(`repeat(${n}): ${"ab".repeat(n)}`);
    } catch (e) {
      out.push(`repeat(${n}): ${String(e)}`);
    }
  }
  try {
    out.push("".repeat(counts[6]!));
  } catch (e) {
    out.push(`empty repeat(Infinity): ${String(e)}`);
  }
  const digits = [0, 2, 1.9, NaN, 100, 100.5, -0.5, 101, -1];
  for (const d of digits) {
    try {
      out.push(`toFixed(${d}): ${(1.25).toFixed(d)}`);
    } catch (e) {
      out.push(`toFixed(${d}): ${String(e)}`);
    }
  }
  try {
    out.push(NaN.toFixed(digits[7]! * 2));
  } catch (e) {
    out.push(`NaN.toFixed(202): ${String(e)}`);
  }
  const lengths = [3, 0, -1, 2.5, NaN, 4294967296, -0];
  for (const n of lengths) {
    try {
      out.push(`new Array(${n}): ${new Array<number>(n).fill(7).join(",")}`);
    } catch (e) {
      out.push(`new Array(${n}): ${String(e)}`);
    }
  }
  l4Try(out, "fromCodePoint", () => String.fromCodePoint(lengths[2]!));
  // Valid arguments outside a try block: no error to catch.
  const k = xs.length - 1;
  out.push(`${"-".repeat(k)} ${(2.5).toFixed(k)} ${new Array<string>(k).fill("x").join("")}`);
  return out;
}

/** An error thrown out of a helper reaches the caller's catch; a finally still runs. */
function l4Pick(xs: string[], i: number): string {
  try {
    return xs.with(i, "x").join("");
  } catch (e) {
    throw e;
  }
}

export function l4Propagate(): string[] {
  const out: string[] = [];
  let ran = 0;
  for (const i of [0, 3, -3, -4]) {
    try {
      out.push(l4Pick(["a", "b", "c"], i));
    } catch (e) {
      out.push(`caught ${String(e)}`);
    } finally {
      ran++;
    }
  }
  out.push(`finally ${ran}`);
  return out;
}

export function l4Remainders(): string[] {
  const out: string[] = [];
  let zero = 0;
  let five = 5;
  for (let k = 0; k < 3; k++) {
    zero = zero * k;
    five = five + 0 * k;
  }
  const divisors = [zero, five, 3, -3];
  for (const d of divisors) {
    let acc = 17;
    acc %= d;
    out.push(`17 % ${d} = ${17 % d}, -17 % ${d} = ${-17 % d}, acc ${acc}, 1/(−6 % ${d}) = ${1 / (-6 % d)}`);
  }
  for (let i = -2; i <= 2; i++) out.push(`${i} % zero = ${i % zero}, ${i} % five = ${i % five}`);
  const n = divisors.length - 4;
  out.push(`len % 0: ${divisors.length % n}`);
  return out;
}
