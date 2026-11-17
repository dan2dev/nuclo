// Edge cases: number formatting, parsing and arithmetic. Every top-level name starts with `ed` (one native namespace).

function edNum(n: number): number {
  return n;
}

/** Numbers as text: every target must print exactly what JavaScript prints. */
export function edFormat(): string[] {
  const zero = edNum(0);
  const negZero = -zero;
  const big = edNum(1e21);
  const tiny = edNum(1e-7);
  return [
    `${0.1 + 0.2} ${1 / 3} ${2 / 3} ${10 / 3} ${100} ${-100} ${1.5} ${-1.5}`,
    `${negZero} ${0 * -1} ${String(negZero)} ${[negZero, 0].join(",")} ${negZero === 0}`,
    `${big} ${big * 10} ${big / 10} ${999999999999999900000} ${123456789012345680000}`,
    `${tiny} ${tiny * 10} ${0.000001} ${0.0000012345} ${-tiny} ${1.5e-10}`,
    `${5e-324} ${Number.MAX_VALUE} ${Number.MIN_VALUE} ${Number.EPSILON} ${-Number.MAX_VALUE}`,
    `${2 ** 53} ${2 ** 53 + 1} ${2 ** 64} ${2 ** 31} ${-(2 ** 31)} ${2 ** -1} ${2 ** 0.5}`,
    `${edNum(1) / 0} ${edNum(-1) / 0} ${zero / zero} ${Infinity - Infinity} ${Infinity * 0}`,
    `${123.456} ${0.5} ${-0.25} ${1e300 * 10} ${1.23e-5} ${12345678.9}`,
    `${4.35 * 100} ${1.1 * 1.1} ${0.1 * 3} ${9.95} ${1e16} ${1e15 + 0.5}`,
  ];
}

/** toFixed: rounding of the exact binary value, -0, large values, NaN. */
export function edFixed(): string[] {
  const n = edNum(1.005);
  return [
    `${n.toFixed(2)} ${(1.45).toFixed(1)} ${(1.55).toFixed(1)} ${(2.5).toFixed(0)} ${(3.5).toFixed(0)} ${(-2.5).toFixed(0)}`,
    `${(0).toFixed(2)} ${(-0.001).toFixed(2)} ${(-0).toFixed(1)} ${(0.000001).toFixed(7)} ${(123.456).toFixed(10)}`,
    `${(1e21).toFixed(2)} ${(1e20).toFixed(2)} ${(NaN).toFixed(2)} ${(Infinity).toFixed(1)} ${(-1.5).toFixed(0)}`,
    `${(10).toFixed()} ${(0.5).toFixed()} ${(1.5).toFixed()} ${(-0.5).toFixed()} ${(255.255).toFixed(2)}`,
    `${(1.23456789e-10).toFixed(20)} ${(9.999).toFixed(2)} ${(99.995).toFixed(2)} ${(0.1 + 0.2).toFixed(17)}`,
  ];
}

/** Number(), parseInt(), parseFloat(): every edge input. */
export function edParse(): string[] {
  const out: string[] = [];
  const inputs = ["", " ", "42", " 42 ", "-17", "+5", "3.14", ".5", "5.", "1e3", "1E-2", "0x1f", "0b101", "0o17", "abc", "12px", "Infinity", "-Infinity", "\n\t7\n", "1_000", "--1", "0.0", "-0", "00012", "1e1000"];
  out.push(inputs.map((s) => `${Number(s)}`).join(" "));
  out.push(inputs.map((s) => `${parseInt(s)}`).join(" "));
  out.push(`${parseInt("ff", 16)} ${parseInt("101", 2)} ${parseInt("z", 36)} ${parseInt("12", 3)} ${parseInt("0x10", 16)} ${parseInt("10", 10)}`);
  const n = parseInt("abc");
  out.push(`${Number.isNaN(n)} ${n === n} ${parseInt("9007199254740993")} ${parseInt("123456789012345678901")}`);
  return out;
}

/** Integer-looking arithmetic: division, remainder, rounding, Math edge cases. */
export function edIntMath(): string[] {
  const a = edNum(7);
  const b = edNum(-7);
  const two = edNum(2);
  return [
    `${a / two} ${b / two} ${Math.floor(b / two)} ${Math.trunc(b / two)} ${Math.ceil(b / two)} ${(a / two) | 0} ${(b / two) | 0}`,
    `${a % two} ${b % two} ${a % -two} ${5.5 % 2} ${-5.5 % 2} ${a % 2.5} ${0 % a}`,
    `${Math.round(2.5)} ${Math.round(-2.5)} ${Math.round(0.5)} ${Math.round(-0.5)} ${Math.round(1.4999999999999998)} ${Math.round(-1.5)}`,
    `${Math.max(1, 2, 3)} ${Math.min(1, -2, 3)} ${Math.max(1, NaN)} ${Math.min(-0, 0)} ${Math.max(-0, 0)} ${Math.abs(-0)}`,
    `${Math.sign(-0)} ${Math.sign(-5)} ${Math.sign(NaN)} ${Math.sqrt(-1)} ${Math.pow(0, 0)} ${Math.pow(-8, 1 / 3)} ${(-2) ** 3}`,
    `${Math.floor(-0.5)} ${Math.ceil(-0.5)} ${Math.trunc(-0.9)} ${Math.floor(1e9 + 0.5)} ${Math.hypot(3, 4)} ${Math.cbrt(-27)}`,
    `${1 << 31} ${1 << 32} ${-1 >>> 0} ${~5} ${~-1} ${2 ** 32 + 5 | 0} ${-9 >> 1} ${-9 >>> 28} ${5 & -2} ${5 ^ 3}`,
    `${1.9 | 0} ${-1.9 | 0} ${NaN | 0} ${Infinity | 0} ${2147483648 | 0} ${4294967295 >>> 0} ${0xffffffff & 0xff}`,
    `${a * 1e308 * 10} ${b * 1e308 * 10} ${Number.MAX_SAFE_INTEGER + 2} ${Number.MIN_SAFE_INTEGER - 2}`,
  ];
}

/** Int counters, sums and products that leave 32 bits; integer results used as text and keys. */
export function edIntRanges(): string[] {
  let sum = 0;
  for (let i = 0; i < 100000; i++) sum += i * i;
  let fact = 1;
  for (let i = 1; i <= 25; i++) fact *= i;
  let p = 1;
  for (let i = 0; i < 40; i++) p *= 2;
  let neg = 0;
  for (let i = 0; i < 700; i++) neg -= 40000;
  let h = 0;
  for (const c of [104, 101, 108, 108, 111]) h = (h * 31 + c) | 0;
  let fnv = 2166136261;
  for (const c of [97, 98, 99]) {
    fnv ^= c;
    fnv = (fnv * 16777619) >>> 0;
  }
  return [`${sum} ${fact} ${p} ${p + 1} ${neg} ${h} ${fnv}`];
}

function edRound2(d: number): number {
  return Math.round(d * 100) / 100;
}

/** Math.floor / ceil / round / trunc of NaN, ±Infinity and numbers past 32 bits stay JavaScript's (natively Doubles). */
export function edRounding(): string[] {
  const out: string[] = [];
  const nan = parseInt("x");
  const inf = 1 / parseInt("0");
  const big = parseInt("3000000000") + 0.5;
  out.push(`${Math.floor(nan)} ${Math.ceil(nan)} ${Math.round(nan)} ${Math.trunc(nan)}`);
  out.push(`${Math.floor(inf)} ${Math.ceil(-inf)} ${Math.round(inf)} ${Math.trunc(-inf)}`);
  out.push(`${Math.floor(big)} ${Math.ceil(big)} ${Math.round(big)} ${Math.trunc(-big)} ${Math.floor(-big * 1e10)}`);
  out.push(`${Math.round(-2.5)} ${Math.round(2.5)} ${Math.ceil(-0.5)} ${Math.trunc(-0.7)} ${Math.round(0.49999999999999994)}`);
  // A result kept in a variable, compared and used in arithmetic.
  const k = Math.floor(nan);
  const m = Math.round(big);
  out.push(`${k === k} ${k + 1} ${m - 3000000000} ${m > 2147483647} ${Number.isFinite(Math.floor(inf))}`);
  out.push(`${edRound2(1.005)} ${edRound2(nan)} ${edRound2(-1.235)}`);
  // Provably finite and small: still whole numbers usable as indices.
  const xs = [10, 20, 30, 40, 50];
  const n = xs.length;
  const mid = Math.floor((0 + n - 1) / 2);
  const pick = xs[Math.floor(Math.random() * xs.length)] ?? -1;
  let halves = 0;
  for (let i = 0; i < 9; i++) halves += Math.floor(i / 2) + Math.ceil(i / 4);
  out.push(`${mid} ${xs[mid] ?? -1} ${pick >= 10 && pick <= 50} ${halves} ${Math.round(n / 3)}`);
  return out;
}
