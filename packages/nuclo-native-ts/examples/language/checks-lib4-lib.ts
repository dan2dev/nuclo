/** lib4: Number / Math / String library gaps. Every top-level name starts with `l4`. */

export function l4Numbers(): string[] {
  const out: string[] = [];
  const xs = [0, -0, 1, 1.5, -3, 9007199254740991, 9007199254740992, -9007199254740991, NaN, Infinity, -Infinity, 2 ** 60];
  out.push(xs.map((x) => String(Number.isSafeInteger(x))).join(","));
  out.push(xs.map((x) => String(Number.isInteger(x))).join(","));
  out.push([Number.EPSILON, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MIN_VALUE, Number.MAX_VALUE].map((v) => String(v)).join(" "));
  out.push([Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN, 1 + Number.EPSILON > 1 ? 1 : 0].map((v) => String(v)).join(" "));
  const zero = xs[1]!;
  out.push([Object.is(NaN, xs[8]!), Object.is(0, zero), Object.is(zero, -0), Object.is(1, 1), Object.is(1, 2), xs[8]! === xs[8]!, 0 === zero].map((v) => String(v)).join(","));
  return out;
}

export function l4Math(): string[] {
  // 12 significant digits: the JVM's math library may differ from the C one JavaScriptCore calls in the last digit.
  const t = (v: number) => (Number.isFinite(v) && v !== 0 ? v.toPrecision(12) : String(v));
  const out: string[] = [];
  const xs = [0.5, -0.25, 0, -0, 2, 10, 1e-8, 0.999];
  for (const x of xs) {
    out.push([Math.asinh(x), Math.atanh(x), Math.acosh(1 + Math.abs(x)), Math.cbrt(x), Math.sinh(x), Math.cosh(x), Math.tanh(x)].map(t).join(" "));
    out.push([Math.log2(Math.abs(x)), Math.log10(Math.abs(x)), Math.expm1(x), Math.log1p(x), Math.hypot(x), Math.hypot(x, 3), Math.hypot()].map(t).join(" "));
  }
  out.push([Math.acosh(0.5), Math.atanh(1), Math.atanh(-1), Math.atanh(2), 1 / Math.asinh(-0), 1 / Math.atanh(-0), Math.hypot(NaN, Infinity), Math.hypot(-0)].map((v) => String(v)).join(","));
  return out;
}

export function l4Strings(): string[] {
  const out: string[] = [];
  const n = 7;
  out.push(String.raw`a\nb\t${n}\${n}A ${n + 1}`);
  out.push(String.raw`plain \\ text`);
  out.push(String.raw`${n}`);
  const s = "a-b--c-";
  out.push(s.replace("-", (m) => `[${m}]`));
  out.push(s.replaceAll("-", (m, at: number) => `${at}`));
  out.push(s.replaceAll("--", (m: string, at: number, whole: string) => `<${at}/${whole.length}>`));
  out.push(s.replace("x", () => "never"));
  out.push("😀x😀x".replaceAll("x", (m, at: number) => `(${at})`));
  out.push("abc".replaceAll("", (m, at: number) => `${at}`));
  out.push("$&".replace("$", () => "$$"));
  let calls = 0;
  out.push("aaaa".replaceAll("aa", () => `${++calls}`) + ` ${calls}`);
  out.push([" \t a b \n".trimStart(), "|", " a b \n\t".trimEnd(), "|", "ab".padEnd(5, "xy"), "ab".padEnd(1), "ab".padEnd(4)].join(""));
  return out;
}
