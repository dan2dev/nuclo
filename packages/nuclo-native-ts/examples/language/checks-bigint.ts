// bigint and symbol: literals, arithmetic past 64 bits, JavaScript's rounding and errors, conversions, identity.

function factorial(n: bigint): bigint {
  let r = 1n;
  for (let i = 2n; i <= n; i++) r *= i;
  return r;
}

function fib(n: number): bigint {
  let [a, b] = [0n, 1n];
  for (let i = 0; i < n; i++) {
    const t = a + b;
    a = b;
    b = t;
  }
  return a;
}

/** A division that JavaScript can throw from (by 0n). Caught errors print their kind only ("RangeError"): the message is each JavaScript engine's own wording. */
function ratio(a: bigint, b: bigint): string {
  try {
    return `${a / b} r ${a % b}`;
  } catch (e) {
    return `caught ${String(e).split(":")[0] ?? ""}`;
  }
}

function power(a: bigint, b: bigint): string {
  try {
    return String(a ** b);
  } catch (e) {
    return `caught ${String(e).split(":")[0] ?? ""}`;
  }
}

function parsed(text: string): string {
  try {
    return `${BigInt(text)}`;
  } catch (e) {
    return `caught ${String(e).split(":")[0] ?? ""}`;
  }
}

function fromNumber(n: number): string {
  try {
    return BigInt(n).toString();
  } catch (e) {
    return `caught ${String(e).split(":")[0] ?? ""}`;
  }
}

function inRadix(b: bigint, radix: number): string {
  try {
    return b.toString(radix);
  } catch (e) {
    return `caught ${String(e).split(":")[0] ?? ""}`;
  }
}

class Account {
  balance = 0n;
  constructor(readonly owner: string) {}
  deposit(amount: bigint): void {
    this.balance += amount;
  }
}

export function bigLiterals(): string[] {
  const max = 9007199254740991n;
  const out: string[] = [];
  out.push(`${max} ${max + 2n} ${-max - 2n}`);
  out.push(`${0x1fn} ${0o17n} ${0b101n} ${1_000_000n} ${0xffffffffffffffffffffn}`);
  out.push(`${-0n} ${0n === -0n} ${123456789012345678901234567890n}`);
  out.push(String(9223372036854775807n) + " " + String(-9223372036854775808n) + " " + String(9223372036854775808n));
  out.push(`typeof ${typeof max} ${typeof (max * max)}`);
  return out;
}

export function bigArithmetic(): string[] {
  const out: string[] = [];
  const a = 123456789012345678901234567890n;
  const b = -987654321098765432109876543210n;
  out.push(`${a + b} ${a - b} ${a * b}`);
  out.push(`${ratio(b, a)} ${a / 7n} ${-a % 7n}`);
  out.push(`${7n / 2n} ${-7n / 2n} ${7n % -2n} ${-7n % -2n}`);
  out.push(`${2n ** 100n} ${(-3n) ** 41n} ${0n ** 0n}`);
  out.push(`${factorial(30n)}`);
  out.push(`${fib(150)}`);
  const big = 9223372036854775807n;
  out.push(`${big + 1n} ${-big - 2n} ${big * big} ${ratio(big * big, big)} ${ratio(big * big + 5n, -big)}`);
  let acc = 1n;
  acc += 5n;
  acc *= -3n;
  acc -= 2n;
  acc **= 3n;
  acc /= 7n;
  acc %= 1000n;
  acc++;
  acc--;
  --acc;
  out.push(`acc ${acc}`);
  out.push(`${-a} ${-(-a)}`);
  return out;
}

export function bigCompare(): string[] {
  const out: string[] = [];
  const xs = [5n, -2n, 18446744073709551616n, 0n, -18446744073709551616n, 3n];
  out.push(xs.filter((x) => x > 0n).join(" "));
  out.push(`${1n < 2n} ${2n <= 2n} ${-1n > 1n} ${10n ** 30n >= 10n ** 29n}`);
  out.push(`${10n ** 20n === 100000000000000000000n} ${5n !== 5n} ${5n == 5n}`);
  const sorted = xs.slice().sort((p, q) => (p < q ? -1 : p > q ? 1 : 0));
  out.push(sorted.join(","));
  out.push(xs.slice().sort().join(","));
  out.push(`${xs.includes(3n)} ${xs.indexOf(18446744073709551616n)} ${xs.indexOf(7n)}`);
  let zero = 0n;
  const first = xs[0];
  out.push(`${zero ? "truthy" : "falsy"} ${!zero} ${first ? "yes" : "no"}`);
  zero ||= 9n;
  out.push(`${zero}`);
  const maybe: bigint | undefined = xs.find((x) => x < -5n);
  out.push(`${maybe ?? -1n} ${maybe !== undefined ? "found" : "none"}`);
  return out;
}

export function bigBits(): string[] {
  const out: string[] = [];
  const a = 0xf0f0f0f0f0f0f0f0f0n;
  const b = -0x123456789abcdefn;
  out.push(`${a & b} ${a | b} ${a ^ b} ${~a} ${~b}`);
  out.push(`${1n << 100n} ${-1n << 70n} ${a >> 3n} ${b >> 7n} ${b >> 200n} ${a << -4n}`);
  out.push(`${-5n >> 1n} ${-1n >> 1n} ${5n & -2n} ${-6n | 1n} ${~0n}`);
  let x = 1n;
  x <<= 65n;
  x |= 3n;
  x ^= 1n;
  x &= ~2n;
  x >>= 1n;
  out.push(`${x}`);
  out.push(`${BigInt.asIntN(8, 255n)} ${BigInt.asUintN(8, -1n)} ${BigInt.asIntN(64, 2n ** 63n)} ${BigInt.asUintN(64, -1n)} ${BigInt.asIntN(0, 5n)}`);
  return out;
}

export function bigConversions(): string[] {
  const out: string[] = [];
  const n = 42;
  const d = 2 ** 60;
  out.push(`${BigInt(n)} ${BigInt(-7)} ${fromNumber(d)} ${BigInt(1e21)} ${BigInt(true)} ${BigInt(false)}`);
  out.push(`${fromNumber(1.5)} | ${fromNumber(NaN)} | ${fromNumber(-0)} | ${fromNumber(2 ** 70)}`);
  out.push(`${Number(2n ** 53n + 1n)} ${Number(-(2n ** 64n))} ${Number(10n ** 400n)} ${Number(123n) / 2}`);
  out.push(`${parsed("  0x1F  ")} | ${parsed("")} | ${parsed("-12")} | ${parsed("+7")} | ${parsed("1.5")} | ${parsed("0b2")} | ${parsed("-0x1")}`);
  out.push(`${(255n).toString(16)} ${(-255n).toString(2)} ${(2n ** 70n).toString(36)} ${inRadix(35n, 36)} | ${inRadix(35n, 37)} | ${inRadix(1295n, 36.9)}`);
  out.push(`${(10n ** 25n).toString()} ${String(-1n)} ${"n=" + 5n} ${12n}`);
  return out;
}

export function bigErrors(): string[] {
  const out: string[] = [];
  out.push(ratio(17n, 5n));
  out.push(ratio(-17n, 5n));
  out.push(ratio(17n, 0n));
  out.push(power(2n, 10n));
  out.push(power(2n, -1n));
  const acct = new Account("ada");
  acct.deposit(10n ** 20n);
  acct.deposit(-1n);
  out.push(`${acct.owner} ${acct.balance}`);
  const ledger: Record<string, bigint> = { a: 1n };
  ledger["b"] = 2n ** 64n;
  out.push(Object.keys(ledger).map((k) => `${k}=${ledger[k] ?? 0n}`).join(" "));
  return out;
}

export function symbols(): string[] {
  const out: string[] = [];
  // Typed `symbol`: a `const` alone is a `unique symbol`, which TypeScript won't compare with another.
  const a: symbol = Symbol("id");
  const b: symbol = Symbol("id");
  const c = Symbol();
  const e = Symbol("");
  const same = a;
  out.push(`${a === b} ${a === same} ${a !== b} ${c === c}`);
  out.push(`${a.description ?? "none"} ${c.description ?? "none"} [${e.description ?? "none"}]`);
  out.push(`${a.toString()} ${String(c)} ${e.toString()} ${String(Symbol("x y"))}`);
  out.push(`${typeof a} ${typeof c}`);
  const all = [a, b, c];
  out.push(`${all.indexOf(b)} ${all.includes(e)} ${all.filter((s) => s.description === "id").length}`);
  const tags: symbol[] = [];
  for (let i = 0; i < 3; i++) tags.push(Symbol(`tag${i}`));
  out.push(tags.map((t) => String(t)).join(","));
  out.push(`${tags[0] === tags[1]} ${tags[1] === tags[1]}`);
  return out;
}
