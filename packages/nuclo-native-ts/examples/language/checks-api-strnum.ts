/**
 * Number and string APIs: parseFloat, toString(radix), toPrecision, toExponential, Math.imul / clz32, and the
 * string methods by UTF-16 units (charAt…, substring, substr, fromCharCode, normalize, split limits, positions).
 */

function caught(f: () => string): string {
  try {
    return f();
  } catch (e) {
    return `${e}`;
  }
}

export function snParse(): string[] {
  const inputs = ["3.14abc", "  -0.5e3x", ".5", "5.", "-.5e-3", "1e", "1e+", "+Infinityx", "-Infinity", "abc", "", "  ", "0x10", "1_0", "\n\t42", "-0", "1.7976931348623159e308", "5e-325", "00012", "1.2.3"];
  const out: string[] = [];
  for (const s of inputs) out.push(`<${s}> ${parseFloat(s)} ${Number.parseFloat(s)} ${1 / parseFloat(s) === -Infinity}`);
  out.push(`${Number.parseInt("0x1f")} ${Number.parseInt("z", 36)} ${Number.parseInt("12.9")} ${parseInt("-12", 8)}`);
  return out;
}

export function snRadix(): string[] {
  // Arguments that aren't literals in range can throw a RangeError: the caller would have to catch it.
  try {
    const xs = [0, -0, 1, -1, 255, -255, 0.5, 0.1, -0.75, 1 / 3, 255.255, 123.456, Math.PI, 1e21, 2 ** 53, 2 ** 60, 1e-7, 4503599627370495.5, 0.9999999999999999, 2 ** 52 + 0.5, NaN, Infinity, -Infinity];
    const out: string[] = [];
    for (const r of [2, 3, 5, 7, 8, 11, 16, 20, 36]) out.push(`${r}: ${xs.map((x) => x.toString(r)).join(" ")}`);
    let radix = 10;
    out.push(`${(255).toString(radix)} ${(1.5).toString(radix)} ${(5e-324).toString(2).length} ${(1.7976931348623157e308).toString(36).length}`);
    for (const bad of [1, 37, 2.9, NaN]) {
      radix = bad;
      out.push(caught(() => (7.5).toString(radix)));
    }
    return out;
  } catch (e) {
    return [`${e}`];
  }
}

export function snPrecision(): string[] {
  // Arguments that aren't literals in range can throw a RangeError: the caller would have to catch it.
  try {
    const xs = [0, -0, 2.5, 1.25, 1.35, 0.5, 1.45, 125, -125, 1e21, 123456, 0.000001, 0.0000001, 1.005, 9.995, 99.5, 0.1, 1 / 3, 5e-324, 1.7976931348623157e308, NaN, -Infinity];
    const out: string[] = [];
    for (const p of [1, 2, 3, 6, 21]) out.push(`P${p}: ${xs.map((x) => x.toPrecision(p)).join(" ")}`);
    out.push(`P100: ${(1.5).toPrecision(100)}`);
    out.push(`Pnone: ${xs.map((x) => x.toPrecision()).join(" ")}`);
    for (const f of [0, 1, 2, 5, 20]) out.push(`E${f}: ${xs.map((x) => x.toExponential(f)).join(" ")}`);
    out.push(`E60: ${(0.1).toExponential(60)}`);
    out.push(`Enone: ${xs.map((x) => x.toExponential()).join(" ")}`);
    let p = 0;
    out.push(caught(() => (1).toPrecision(p)));
    p = 101;
    out.push(caught(() => (1).toExponential(p)));
    out.push(caught(() => NaN.toPrecision(p)));
    p = 2.9;
    out.push(caught(() => (3.14159).toPrecision(p)) + " " + caught(() => (3.14159).toExponential(p)));
    return out;
  } catch (e) {
    return [`${e}`];
  }
}

export function snIntMath(): string[] {
  const pairs: [number, number][] = [[3, 4], [-5, 12], [0xffffffff, 5], [0x7fffffff, 2], [2 ** 32 + 3, 7], [1.9, 2.9], [NaN, 3], [Infinity, 2], [123456789, 987654321]];
  const out: string[] = [pairs.map((ab) => Math.imul(ab[0], ab[1])).join(" ")];
  out.push([0, 1, -1, 0.5, 2 ** 31, 2 ** 32, 2 ** 32 + 1, NaN, Infinity, 255, -0].map((x) => Math.clz32(x)).join(" "));
  // FNV-1a over a string: imul in a hot loop, Int all the way.
  let h = 0x811c9dc5 | 0;
  const text = "hello, wörld 😀";
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  out.push(`${h >>> 0} ${Math.fround(5.5)} ${Math.fround(0.1)}`);
  return out;
}

export function snChars(): string[] {
  const s = "aé😀b";
  const out: string[] = [];
  const idx = [0, 1, 2, 3, 4, 5, -1, 1.7, NaN, Infinity];
  // Half of a surrogate pair is U+FFFD on Swift and Rust (their strings can't hold one): only its length here.
  out.push(idx.map((i) => (i === 2 || i === 3 ? `#${s.charAt(i).length}` : `<${s.charAt(i)}>`)).join(" "));
  out.push(idx.map((i) => s.charCodeAt(i)).join(" "));
  out.push(idx.map((i) => {
    const c = s.codePointAt(i);
    return c === undefined ? "undefined" : `${c}`;
  }).join(" "));
  out.push(idx.map((i) => (i === 2 || i === 3 ? `#${(s.at(i) ?? "").length}` : `${s.at(i) ?? "undefined"}`)).join(" "));
  out.push(`${"".charAt(0) === ""} ${isNaN("".charCodeAt(0))} ${"".at(-1) === undefined} ${"".codePointAt(0) === undefined}`);
  const last = s.at(-1);
  out.push(last !== undefined ? last.toUpperCase() : "none");
  return out;
}

export function snSubstrings(): string[] {
  const s = "Hello, world";
  const out: string[] = [];
  const pairs: [number, number][] = [[0, 5], [5, 0], [-3, 4], [7, 100], [NaN, 3], [3, NaN], [2.7, 6.2], [Infinity, 1], [4, 4]];
  out.push(pairs.map((ab) => s.substring(ab[0], ab[1])).join("|"));
  out.push([0, 7, -5, 100, NaN, -100].map((a) => s.substring(a)).join("|"));
  out.push(pairs.map((ab) => s.substr(ab[0], ab[1])).join("|"));
  out.push([0, 7, -5, 100, NaN, -100, -Infinity].map((a) => s.substr(a)).join("|"));
  out.push(`${"😀x".substring(0, 2)} ${"😀x".substr(-1)} ${"😀x".substring(2)}`);
  return out;
}

export function snFromCodes(): string[] {
  // Arguments that aren't literals in range can throw a RangeError: the caller would have to catch it.
  try {
    const out: string[] = [];
    out.push(String.fromCharCode(72, 105, 33));
    out.push(String.fromCharCode(0xd83d, 0xde00) + " " + String.fromCharCode(65 + 65536, 66.9, -65471));
    out.push(`${String.fromCharCode().length} ${String.fromCharCode(NaN, Infinity).length} ${String.fromCharCode(0xd83d, 0xde00).length}`);
    const codes: number[] = [0xd83d, 0xde00, 0x41];
    codes.push(0x2603);
    out.push(String.fromCharCode(...codes));
    out.push(String.fromCodePoint(0x1f600, 0x41, 0xe9, 0x10ffff).length + " " + String.fromCodePoint(0x1f600, 0x41, 0xe9));
    const points: number[] = [128512, 9731];
    out.push(String.fromCodePoint(...points));
    for (const bad of [-1, 1.5, 0x110000, NaN]) out.push(caught(() => String.fromCodePoint(bad)));
    let cp = 0x1f600;
    out.push(caught(() => String.fromCodePoint(cp)));
    cp = 0x110000;
    out.push(caught(() => String.fromCodePoint(65, cp)));
    return out;
  } catch (e) {
    return [`${e}`];
  }
}

function units(s: string): string {
  const out: string[] = [];
  for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i).toString(16));
  return out.join(".");
}

export function snNormalize(): string[] {
  const out: string[] = [];
  const words = ["é", "é", "ﬁ", "Å", "Ω", "ẛ̣", "가", "①"];
  for (const w of words) {
    const forms = [w.normalize(), w.normalize("NFC"), w.normalize("NFD"), w.normalize("NFKC"), w.normalize("NFKD")];
    out.push(forms.map((f) => `${f.length}:${units(f)}`).join(" "));
  }
  out.push(`${"é".normalize() === "é"} ${"é".normalize("NFD") === "é"}`);
  return out;
}

export function snSplit(): string[] {
  const out: string[] = [];
  const show = (xs: string[]) => `${xs.length}[${xs.join("|")}]`;
  out.push(show("".split("")) + " " + show("".split(",")) + " " + show(",".split(",")));
  out.push(`${"a😀b".split("").length} ${show("aéb".split(""))}`);
  for (const lim of [0, 1, 2, 5, -1, 2.5, NaN, 2 ** 32 + 1]) out.push(`${lim}: ${show("a,b,c".split(",", lim))} ${show("abc".split("", lim))}`);
  return out;
}

export function snPositions(): string[] {
  const s = "abcabc";
  const out: string[] = [];
  const at = [0, 1, 3, 6, 7, -1, NaN, 2.5, Infinity, -Infinity];
  out.push(at.map((p) => `${s.startsWith("abc", p)}`).join(" "));
  out.push(at.map((p) => `${s.endsWith("abc", p)}`).join(" "));
  out.push(at.map((p) => `${s.includes("bc", p)}`).join(" "));
  out.push(at.map((p) => `${s.indexOf("bc", p)}`).join(" "));
  out.push(at.map((p) => `${s.lastIndexOf("bc", p)}`).join(" "));
  out.push(at.map((p) => `${s.lastIndexOf("", p)} ${s.startsWith("", p)} ${s.endsWith("", p)}`).join(" "));
  out.push(`${"😀x".startsWith("x", 2)} ${"😀x".endsWith("😀", 2)} ${"😀x".includes("x", 3)}`);
  out.push(`${s.concat("!", "?")} ${"n=".concat(`${1.5}`, "", "x")} ${"".concat()} ${"a".concat(String(2), `${true}`)}`);
  return out;
}

/** Literals: `10 ** -20` may differ by an ulp between platforms' pow (not what this checks). */
const SCALES = [1e-20, 1e-12, 1e-7, 0.001, 1, 7, 1000, 1e9, 1e15, 1e20];

/** Many generated numbers through toString(radix) / toPrecision / toExponential, one FNV-1a hash per format. */
export function snFuzz(): string[] {
  const hash = (text: string, h: number): number => {
    let x = h;
    for (let i = 0; i < text.length; i++) x = Math.imul(x ^ text.charCodeAt(i), 16777619);
    return x;
  };
  const xs: number[] = [];
  let seed = 12345;
  for (let i = 0; i < 300; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const unit = seed / 2147483648;
    const scale = SCALES[i % SCALES.length]!;
    xs.push(unit * scale, -unit * 1000, Math.floor(unit * 1e6) / 1024, unit * 2 ** 52 + 0.5);
  }
  // Shortest digits with two equally near candidates take the even one (Rust's formatter took the upper).
  const ties = [860.8474731445312, -860.8474731445312, 0.5 + 2 ** -40, 1.5 + 2 ** -45];
  const out: string[] = [ties.map((x) => `${x} ${x.toExponential()}`).join(" ")];
  try {
    fuzzFormats(xs, hash, out);
  } catch (e) {
    out.push(`${e}`);
  }
  return out;
}

function fuzzFormats(xs: number[], hash: (text: string, h: number) => number, out: string[]): void {
  for (let r = 2; r <= 36; r += 1) {
    let h = 0x811c9dc5 | 0;
    for (const x of xs) h = hash(x.toString(r), h);
    out.push(`r${r} ${h >>> 0}`);
  }
  for (let p = 1; p <= 21; p += 4) {
    let h = 0x811c9dc5 | 0;
    for (const x of xs) h = hash(x.toPrecision(p) + x.toExponential(p - 1), h);
    out.push(`p${p} ${h >>> 0}`);
  }
  let h = 0x811c9dc5 | 0;
  for (const x of xs) h = hash(x.toExponential() + String(parseFloat(String(x))), h);
  out.push(`auto ${h >>> 0}`);
}
