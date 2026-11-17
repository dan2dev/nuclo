// Algorithms corpus: numeric (sieve, gcd/lcm, modular exponentiation, big numbers by digits, matrices, Fibonacci, sums).

function sieve(limit: number): number[] {
  const composite = new Array<boolean>(limit + 1).fill(false);
  const primes: number[] = [];
  for (let i = 2; i <= limit; i++) {
    if (composite[i]) continue;
    primes.push(i);
    for (let j = i * i; j <= limit; j += i) composite[j] = true;
  }
  return primes;
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return false;
  return true;
}

function factorize(n: number): Map<number, number> {
  const factors = new Map<number, number>();
  for (let p = 2; p * p <= n; p++) {
    while (n % p === 0) {
      factors.set(p, (factors.get(p) ?? 0) + 1);
      n /= p;
    }
  }
  if (n > 1) factors.set(n, (factors.get(n) ?? 0) + 1);
  return factors;
}

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const lcm = (a: number, b: number): number => (a / gcd(a, b)) * b;

function extendedGcd(a: number, b: number): [number, number, number] {
  if (b === 0) return [a, 1, 0];
  const [g, x, y] = extendedGcd(b, a % b);
  return [g, y, x - Math.floor(a / b) * y];
}

/** Modular exponentiation with bigint (exact for big moduli). */
function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base %= mod;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    base = (base * base) % mod;
    exp >>= 1n;
  }
  return result;
}

/** Same with numbers, safe while mod² < 2^53. */
function modPowNum(base: number, exp: number, mod: number): number {
  let r = 1;
  base %= mod;
  while (exp > 0) {
    if (exp % 2 === 1) r = (r * base) % mod;
    base = (base * base) % mod;
    exp = Math.floor(exp / 2);
  }
  return r;
}

function modInverse(a: number, m: number): number | null {
  const [g, x] = extendedGcd(a, m);
  return g !== 1 ? null : ((x % m) + m) % m;
}

function millerRabin(n: bigint): boolean {
  if (n < 2n) return false;
  for (const p of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) {
    if (n === p) return true;
    if (n % p === 0n) return false;
  }
  let d = n - 1n;
  let s = 0;
  while (d % 2n === 0n) {
    d /= 2n;
    s++;
  }
  outer: for (const a of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) {
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    for (let r = 1; r < s; r++) {
      x = (x * x) % n;
      if (x === n - 1n) continue outer;
    }
    return false;
  }
  return true;
}

// It calls code that can throw (a RangeError from BigInt / bigint `%`, or the app's own errors): a check made at
// load time catches what it doesn't expect, as an error natively can't leave a top-level initializer.
export function numberTheory(): string[] {
  try {
    return numberTheoryLines();
  } catch (e) {
    return [`unexpected ${(e as Error).message}`];
  }
}

function numberTheoryLines(): string[] {
  const primes = sieve(100);
  const f = factorize(360360);
  return [
    `sieve ${primes.length} last ${primes.at(-1)} sum ${primes.reduce((a, b) => a + b, 0)}`,
    `isPrime ${[0, 1, 2, 3, 4, 97, 7919, 1_000_003, 2_147_483_647].map((n) => (isPrime(n) ? 1 : 0)).join("")}`,
    `factorize 360360 = ${[...f].map(([p, e]) => (e > 1 ? `${p}^${e}` : `${p}`)).join("·")}`,
    `factorize prime ${[...factorize(9_999_991).keys()].join(",")}`,
    `gcd ${gcd(48, 18)} ${gcd(17, 5)} ${gcd(0, 9)} ${gcd(-12, 8)} lcm ${lcm(4, 6)} ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].reduce(lcm, 1)}`,
    `egcd ${extendedGcd(240, 46).join(",")} inverse ${modInverse(3, 11)} ${modInverse(10, 17)} ${modInverse(6, 9)}`,
    `modpow ${modPow(2n, 10n, 1000n)} ${modPow(3n, 200n, 1_000_000_007n)} ${modPow(123456789n, 987654321n, 998244353n)}`,
    `modpow num ${modPowNum(2, 30, 1_000_000_007)} ${modPowNum(7, 1e6, 13)} ${modPowNum(5, 0, 7)}`,
    `miller-rabin ${[561n, 1_000_000_007n, 2_305_843_009_213_693_951n, 2_305_843_009_213_693_953n].map(millerRabin).join(",")}`,
  ];
}

// ───── Big numbers as digit arrays ─────

function parseDigits(s: string): number[] {
  return s.split("").reverse().map((d) => Number(d));
}

function showDigits(d: number[]): string {
  let i = d.length - 1;
  while (i > 0 && d[i] === 0) i--;
  return d.slice(0, i + 1).reverse().join("");
}

function addBig(a: string, b: string): string {
  const x = parseDigits(a);
  const y = parseDigits(b);
  const out: number[] = [];
  let carry = 0;
  for (let i = 0; i < Math.max(x.length, y.length) || carry; i++) {
    const s = (x[i] ?? 0) + (y[i] ?? 0) + carry;
    out.push(s % 10);
    carry = Math.floor(s / 10);
  }
  return showDigits(out);
}

function mulBig(a: string, b: string): string {
  const x = parseDigits(a);
  const y = parseDigits(b);
  const out = new Array<number>(x.length + y.length).fill(0);
  for (let i = 0; i < x.length; i++) {
    for (let j = 0; j < y.length; j++) {
      out[i + j]! += x[i]! * y[j]!;
      out[i + j + 1]! += Math.floor(out[i + j]! / 10);
      out[i + j]! %= 10;
    }
  }
  return showDigits(out);
}

function factorialBig(n: number): string {
  let acc = "1";
  for (let i = 2; i <= n; i++) acc = mulBig(acc, String(i));
  return acc;
}

function compareBig(a: string, b: string): number {
  if (a.length !== b.length) return a.length < b.length ? -1 : 1;
  return a === b ? 0 : a < b ? -1 : 1;
}

// It calls code that can throw (a RangeError from BigInt / bigint `%`, or the app's own errors): a check made at
// load time catches what it doesn't expect, as an error natively can't leave a top-level initializer.
export function bigDigits(): string[] {
  try {
    return bigDigitsLines();
  } catch (e) {
    return [`unexpected ${(e as Error).message}`];
  }
}

function bigDigitsLines(): string[] {
  const f30 = factorialBig(30);
  return [
    `add ${addBig("99999999999999999999", "1")} ${addBig("0", "0")} ${addBig("123456789123456789", "987654321987654321")}`,
    `mul ${mulBig("12345678901234567890", "98765432109876543210")} ${mulBig("0", "12345")}`,
    `30! ${f30} digits ${f30.length}`,
    `agrees with bigint ${f30 === String(Array.from({ length: 30 }, (_, i) => i).reduce((acc, i) => acc * BigInt(i + 1), 1n))}`,
    `compare ${compareBig("100", "99")} ${compareBig("123", "124")} ${compareBig("5", "5")}`,
    `digit sum 2^100 ${String(2n ** 100n).split("").reduce((s, d) => s + Number(d), 0)}`,
  ];
}

// ───── Matrices, Fibonacci, floating point ─────

type Matrix = number[][];

function matMul(a: Matrix, b: Matrix): Matrix {
  const rows = a.length;
  const cols = b[0]!.length;
  const inner = b.length;
  const out: Matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));
  for (let i = 0; i < rows; i++)
    for (let k = 0; k < inner; k++) {
      const aik = a[i]![k]!;
      for (let j = 0; j < cols; j++) out[i]![j]! += aik * b[k]![j]!;
    }
  return out;
}

function identity(n: number): Matrix {
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
}

function matPow(m: Matrix, p: number): Matrix {
  let result = identity(m.length);
  let base = m;
  while (p > 0) {
    if (p & 1) result = matMul(result, base);
    base = matMul(base, base);
    p >>= 1;
  }
  return result;
}

function transpose(m: Matrix): Matrix {
  return m[0]!.map((_, c) => m.map((row) => row[c]!));
}

function determinant(m: Matrix): number {
  const n = m.length;
  const a = m.map((r) => [...r]);
  let det = 1;
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(a[r]![col]!) > Math.abs(a[pivot]![col]!)) pivot = r;
    if (a[pivot]![col] === 0) return 0;
    if (pivot !== col) {
      [a[pivot], a[col]] = [a[col]!, a[pivot]!];
      det = -det;
    }
    det *= a[col]![col]!;
    for (let r = col + 1; r < n; r++) {
      const factor = a[r]![col]! / a[col]![col]!;
      for (let c = col; c < n; c++) a[r]![c]! -= factor * a[col]![c]!;
    }
  }
  return det;
}

function fibIter(n: number): number {
  let [a, b] = [0, 1];
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;
}

function fibFastDoubling(n: bigint): [bigint, bigint] {
  if (n === 0n) return [0n, 1n];
  const [a, b] = fibFastDoubling(n / 2n);
  const c = a * (2n * b - a);
  const d = a * a + b * b;
  return n % 2n === 0n ? [c, d] : [d, c + d];
}

function kahanSum(xs: number[]): number {
  let sum = 0;
  let c = 0;
  for (const x of xs) {
    const y = x - c;
    const t = sum + y;
    c = t - sum - y;
    sum = t;
  }
  return sum;
}

function newtonSqrt(x: number): number {
  let g = x / 2 || 1;
  for (let i = 0; i < 50; i++) {
    const next = (g + x / g) / 2;
    if (Math.abs(next - g) < 1e-15 * g) break;
    g = next;
  }
  return g;
}

export function matricesAndFloats(): string[] {
  const a: Matrix = [[1, 2, 3], [4, 5, 6]];
  const b: Matrix = [[7, 8], [9, 10], [11, 12]];
  const fibM = matPow([[1, 1], [1, 0]], 50);
  const tenths = new Array<number>(10).fill(0.1);
  const many = Array.from({ length: 1000 }, (_, i) => 1 / (i + 1));
  return [
    `matmul ${matMul(a, b).map((r) => r.join(" ")).join(" / ")}`,
    `transpose ${transpose(a).map((r) => r.join("")).join(",")}`,
    `det ${determinant([[2, -3, 1], [2, 0, -1], [1, 4, 5]])} ${determinant([[1, 2], [2, 4]])} ${determinant([[0, 1], [1, 0]])}`,
    `fib matrix 50 = ${fibM[0]![1]} iter ${fibIter(50)} ${fibIter(78)} ${fibIter(90)}`,
    `fib doubling 100 = ${fibFastDoubling(100n)[0]} 300 = ${fibFastDoubling(300n)[0]}`,
    `sum 0.1×10 naive ${tenths.reduce((s, x) => s + x, 0)} kahan ${kahanSum(tenths)}`,
    `harmonic ${many.reduce((s, x) => s + x, 0)} kahan ${kahanSum(many)}`,
    `0.1+0.2 ${0.1 + 0.2} ${(0.1 + 0.2).toFixed(2)} eq ${0.1 + 0.2 === 0.3} eps ${Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON}`,
    `sqrt ${newtonSqrt(2)} ${newtonSqrt(1e10)} ${newtonSqrt(0.25)} vs ${Math.sqrt(2)}`,
    `rounding ${[1.005, 2.5, -2.5, 0.5, 1234.5678].map((x) => `${Math.round(x)}/${x.toFixed(1)}`).join(" ")}`,
    `pow ${[[1.07, 10], [1.0001, 1000], [1.0001, 1001], [-2.5, 3], [1.1, -3], [2, 0.5], [1, Infinity], [-1, -Infinity], [NaN, 0], [0, -1], [-0, -1], [2, -1074], [7.3, 33]].map(([b, e]) => b! ** e!).join(" ")}`,
    `pow ${Math.pow(1.23456789, 17)} ${1.000001 ** 999} ${(-1.5) ** 1000} ${10 ** 22} ${10 ** 23}`,
    `ints ${Number.MAX_SAFE_INTEGER + 2} ${2 ** 53 === 2 ** 53 + 1} ${(-7) % 3} ${7 % -3} ${-7 / 2} ${Math.trunc(-7 / 2)}`,
  ];
}

// ───── Statistics and bit tricks ─────

function stats(xs: number[]): { mean: number; median: number; mode: number; stddev: number } {
  const sorted = [...xs].sort((a, b) => a - b);
  const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
  const mid = sorted.length >> 1;
  const median = sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
  const counts = new Map<number, number>();
  let mode = sorted[0]!;
  for (const x of xs) {
    const c = (counts.get(x) ?? 0) + 1;
    counts.set(x, c);
    if (c > counts.get(mode)!) mode = x;
  }
  const variance = xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length;
  return { mean, median, mode, stddev: Math.sqrt(variance) };
}

const popcount = (n: number): number => {
  let count = 0;
  for (let x = n >>> 0; x; x &= x - 1) count++;
  return count;
};

function nextPowerOfTwo(n: number): number {
  if (n <= 1) return 1;
  return 2 ** Math.ceil(Math.log2(n));
}

function grayCode(bits: number): number[] {
  return Array.from({ length: 1 << bits }, (_, i) => i ^ (i >> 1));
}

function reverseBits(n: number): number {
  let r = 0;
  for (let i = 0; i < 32; i++) {
    r = (r << 1) | (n & 1);
    n >>>= 1;
  }
  return r >>> 0;
}

export function statsAndBits(): string[] {
  const s = stats([2, 4, 4, 4, 5, 5, 7, 9]);
  const t = stats([1.5, 2.5, 10]);
  return [
    `stats ${s.mean} ${s.median} ${s.mode} ${s.stddev}`,
    `stats ${t.mean.toFixed(4)} ${t.median} ${t.mode} ${t.stddev.toFixed(6)}`,
    `popcount ${[0, 1, 255, 1023, -1, 0x80000000, 2 ** 32 + 3].map(popcount).join(",")}`,
    `next pow2 ${[0, 1, 2, 3, 17, 1024, 1025].map(nextPowerOfTwo).join(",")}`,
    `gray ${grayCode(3).map((g) => g.toString(2).padStart(3, "0")).join(" ")}`,
    `reverse bits ${reverseBits(1)} ${reverseBits(43261596)} ${reverseBits(0xffffffff)}`,
    `masks ${(0b1010 & 0b0110).toString(2)} ${(0b1010 | 0b0110).toString(2)} ${(0b1010 ^ 0b0110).toString(2)} ${~5} ${-16 >> 2} ${-16 >>> 28} ${1 << 31} ${(1 << 31) >>> 0}`,
    `is pow2 ${[0, 1, 6, 64, 96].map((n) => n > 0 && (n & (n - 1)) === 0).join(",")}`,
  ];
}
