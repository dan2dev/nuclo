/**
 * @nuclo/native-ts/adapters — typed APIs for what JavaScript does in a way no native target can repeat
 * (locale data, garbage-collector timing, untyped values, lone surrogates, closures in reference cycles).
 *
 * Each one is plain strict TypeScript, compiled with the app like any of its modules: the web target and
 * bun run this file as written (the reference), and Swift, Kotlin and Rust run the compiled form, so every
 * result is the same on every target by construction. Nothing here depends on a platform's locale, time
 * zone database (beyond the machine's local offset, which `Date` already uses) or collector.
 *
 * | JavaScript (rejected)                          | Here                                                   |
 * | ---------------------------------------------- | ------------------------------------------------------ |
 * | `a.localeCompare(b)`, `Intl.Collator`          | `compareText(a, b, options)`, `collator(options)`      |
 * | `n.toLocaleString()`, `Intl.NumberFormat`      | `formatNumber(n, { minFractionDigits, grouping, … })`   |
 * | `d.toString()`, `toLocale…String()`, `Intl.DateTimeFormat` | `formatDate(d, "yyyy-MM-dd HH:mm", { timeZone })` |
 * | `JSON.parse(text)` without a type              | `parseJson(text): Json` with typed accessors           |
 * | strings holding lone surrogates                | `Utf16` (code units, JavaScript's string semantics)    |
 * | `FinalizationRegistry`, `using`                | `Disposable`, `use(resource, body)`, `Disposer`        |
 * | a closure in a reference cycle                 | `bind(owner, fn)`, `Emitter<A>`                        |
 * | `x === null` vs `x === undefined` on one value | `Opt<T>`: `opt(v)`, `optNull()`, `optUndefined()`       |
 */

// ---------------------------------------------------------------------------
// Text comparison
// ---------------------------------------------------------------------------

/** How `compareText` / `collator` compare (Intl.Collator's `sensitivity` and `numeric`, without locale data). */
export interface CompareOptions {
  /**
   * Which differences count: `"base"` letters only (a = á = A), `"accent"` letters and accents (a ≠ á, a = A),
   * `"case"` letters and case (a ≠ A, a = á), `"variant"` (default) every difference.
   */
  sensitivity?: "base" | "accent" | "case" | "variant";
  /** Runs of ASCII digits compare by their value: "item 2" < "item 10". */
  numeric?: boolean;
}

/** UTF-16 code units of `s`. */
function textUnits(s: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
  return out;
}

/** A combining mark (the accents NFD splits off). */
function isMark(u: number): boolean {
  return (u >= 0x300 && u <= 0x36f) || (u >= 0x1ab0 && u <= 0x1aff) || (u >= 0x1dc0 && u <= 0x1dff) || (u >= 0x20d0 && u <= 0x20ff) || (u >= 0xfe20 && u <= 0xfe2f);
}

/** The units `compareText` compares at one level: NFD, then without accents and/or case. */
function textKey(s: string, accents: boolean, cased: boolean): number[] {
  const units = textUnits((cased ? s : s.toLowerCase()).normalize("NFD"));
  return accents ? units : units.filter((u) => !isMark(u));
}

const isDigit = (u: number): boolean => u >= 0x30 && u <= 0x39;

/** -1, 0 or 1: unit by unit, or digit runs by value when `numeric`. */
function compareUnits(a: number[], b: number[], numeric: boolean): number {
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const x = a[i]!;
    const y = b[j]!;
    if (numeric && isDigit(x) && isDigit(y)) {
      while (i < a.length && a[i] === 0x30) i++;
      while (j < b.length && b[j] === 0x30) j++;
      let ei = i;
      let ej = j;
      while (ei < a.length && isDigit(a[ei]!)) ei++;
      while (ej < b.length && isDigit(b[ej]!)) ej++;
      if (ei - i !== ej - j) return ei - i < ej - j ? -1 : 1;
      for (; i < ei; i++, j++) if (a[i] !== b[j]) return a[i]! < b[j]! ? -1 : 1;
      continue;
    }
    if (x !== y) return x < y ? -1 : 1;
    i++;
    j++;
  }
  return i < a.length ? 1 : j < b.length ? -1 : 0;
}

/**
 * Compares two strings the same way on every platform: -1, 0 or 1. Letters first (case and accents folded:
 * lower case, NFD, combining marks dropped), then accents, then case, as `sensitivity` allows; each level by
 * Unicode code unit (not a language's alphabet: "z" < "ä" only differs from a locale where ä sorts after z).
 * Canonically equivalent strings (NFC and NFD) are equal. Use it where JavaScript would use `localeCompare`.
 */
export function compareText(a: string, b: string, options: CompareOptions = {}): number {
  const sensitivity = options.sensitivity ?? "variant";
  const numeric = options.numeric ?? false;
  const base = compareUnits(textKey(a, false, false), textKey(b, false, false), numeric);
  if (base !== 0 || sensitivity === "base") return base;
  if (sensitivity !== "case") {
    const accent = compareUnits(textKey(a, true, false), textKey(b, true, false), numeric);
    if (accent !== 0 || sensitivity === "accent") return accent;
  }
  return compareUnits(textKey(a, sensitivity === "variant", true), textKey(b, sensitivity === "variant", true), numeric);
}

/** `compareText` with these options, for `xs.sort(collator({ numeric: true }))`. */
export function collator(options: CompareOptions = {}): (a: string, b: string) => number {
  return (a: string, b: string) => compareText(a, b, options);
}

// ---------------------------------------------------------------------------
// Number and date formatting
// ---------------------------------------------------------------------------

/** How `formatNumber` writes a number (Intl.NumberFormat's digit options, with the separators given). */
export interface NumberFormat {
  /** Digits after the separator, at least (default 0) … */
  minFractionDigits?: number;
  /** … and at most (default the larger of 3 and minFractionDigits), rounded half away from zero. */
  maxFractionDigits?: number;
  /** Digits before the separator, at least (default 1): zeros are added in front. */
  minIntegerDigits?: number;
  /** Separates thousands (default true). */
  grouping?: boolean;
  /** Default ",". */
  groupSeparator?: string;
  /** Default ".". */
  decimalSeparator?: string;
}

/** Digits of |n| (shortest round-trip, as `String(n)` writes them) and where the point goes. */
function decimalDigits(n: number): { digits: number[]; point: number } {
  const text = String(Math.abs(n));
  const e = text.indexOf("e");
  const mantissa = e < 0 ? text : text.slice(0, e);
  const exponent = e < 0 ? 0 : Number(text.slice(e + 1));
  const dot = mantissa.indexOf(".");
  const digits = textUnits(dot < 0 ? mantissa : mantissa.slice(0, dot) + mantissa.slice(dot + 1)).map((u) => u - 0x30);
  return { digits, point: (dot < 0 ? mantissa.length : dot) + exponent };
}

/**
 * Writes `n` with a fixed format, the same on every platform: `formatNumber(1234.5, { minFractionDigits: 2 })`
 * is "1,234.50". The decimal digits are JavaScript's (`String(n)`), rounded half away from zero; a result
 * that rounds to zero has no sign; NaN is "NaN", infinities "∞" / "-∞". Use it where JavaScript would use
 * `toLocaleString` or `Intl.NumberFormat`.
 */
export function formatNumber(n: number, format: NumberFormat = {}): string {
  if (Number.isNaN(n)) return "NaN";
  if (!Number.isFinite(n)) return n < 0 ? "-∞" : "∞";
  const minFraction = Math.max(0, Math.min(100, Math.trunc(format.minFractionDigits ?? 0)));
  const maxFraction = Math.max(minFraction, Math.min(100, Math.trunc(format.maxFractionDigits ?? Math.max(3, minFraction))));
  const minInteger = Math.max(1, Math.min(100, Math.trunc(format.minIntegerDigits ?? 1)));
  const { digits, point } = decimalDigits(n);
  // The integer digits, then maxFraction + 1 fraction digits (the last one decides the rounding).
  const digit = (i: number): number => (i >= 0 && i < digits.length ? digits[i]! : 0);
  const kept: number[] = [];
  for (let i = 0; i < point; i++) kept.push(digit(i));
  let integerLength = kept.length;
  for (let i = point; i < point + maxFraction; i++) kept.push(digit(i));
  if (digit(point + maxFraction) >= 5) {
    let k = kept.length - 1;
    while (k >= 0 && kept[k] === 9) {
      kept[k] = 0;
      k--;
    }
    if (k >= 0) kept[k] = kept[k]! + 1;
    else {
      kept.unshift(1);
      integerLength++;
    }
  }
  const intDigits = kept.slice(0, integerLength);
  const fraction = kept.slice(integerLength);
  while (fraction.length > minFraction && fraction[fraction.length - 1] === 0) fraction.pop();
  while (intDigits.length < minInteger) intDigits.unshift(0);
  const zero = intDigits.every((d) => d === 0) && fraction.every((d) => d === 0);
  let integer = intDigits.join("");
  if (format.grouping ?? true) {
    const sep = format.groupSeparator ?? ",";
    let grouped = "";
    for (let i = 0; i < integer.length; i++) {
      if (i > 0 && (integer.length - i) % 3 === 0) grouped += sep;
      grouped += integer.charAt(i);
    }
    integer = grouped;
  }
  return `${n < 0 && !zero ? "-" : ""}${integer}${fraction.length ? (format.decimalSeparator ?? ".") + fraction.join("") : ""}`;
}

/** Which clock `formatDate` reads: UTC, the machine's local zone (as `getHours()` does), or a fixed offset in minutes east of UTC. */
export interface DateFormat {
  timeZone?: "UTC" | "local" | number;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function pad(n: number, width: number): string {
  const text = String(Math.abs(n)).padStart(width, "0");
  return n < 0 ? `-${text}` : text;
}

/**
 * Writes a date with a fixed pattern, in English, the same on every platform:
 * `formatDate(d, "EEE d MMM yyyy, HH:mm:ss XXX", { timeZone: "UTC" })` is "Mon 15 Jan 2024, 10:30:00 Z".
 * Letters (a run of one letter is one field): `yyyy` year (`yy` two digits, `y` as is), `MMMM` January,
 * `MMM` Jan, `MM` 01, `M` 1, `dd` / `d` day, `EEEE` Monday, `EEE` Mon, `HH` / `H` 0–23, `hh` / `h` 1–12,
 * `a` AM / PM, `mm` / `m`, `ss` / `s`, `SSS` milliseconds, `XXX` the offset (`Z`, `+05:30`). Other letters
 * and any text in single quotes are written as they are (`''` is a quote). An invalid date is "Invalid Date".
 * `timeZone` is "local" by default. Use it where JavaScript would use `toString`, `toLocale…String` or Intl.
 */
export function formatDate(d: Date, pattern: string, format: DateFormat = {}): string {
  const time = d.getTime();
  if (Number.isNaN(time)) return "Invalid Date";
  const zone = format.timeZone ?? "local";
  const offset = zone === "UTC" ? 0 : zone === "local" ? -d.getTimezoneOffset() : zone;
  const t = new Date(time + offset * 60000);
  let out = "";
  let i = 0;
  while (i < pattern.length) {
    const c = pattern.charAt(i);
    if (c === "'") {
      // Quoted text up to the closing quote; '' is a quote, inside or outside.
      i++;
      if (pattern.charAt(i) === "'") {
        out += "'";
        i++;
        continue;
      }
      while (i < pattern.length) {
        if (pattern.charAt(i) === "'") {
          if (pattern.charAt(i + 1) !== "'") break;
          i++;
        }
        out += pattern.charAt(i);
        i++;
      }
      i++;
      continue;
    }
    let run = 1;
    while (pattern.charAt(i + run) === c) run++;
    i += run;
    const hours = t.getUTCHours();
    switch (c) {
      case "y": {
        const year = t.getUTCFullYear();
        out += run === 2 ? pad(((year % 100) + 100) % 100, 2) : pad(year, run);
        break;
      }
      case "M":
        out += run >= 4 ? MONTHS[t.getUTCMonth()]! : run === 3 ? MONTHS[t.getUTCMonth()]!.slice(0, 3) : pad(t.getUTCMonth() + 1, run);
        break;
      case "d":
        out += pad(t.getUTCDate(), run);
        break;
      case "E":
        out += run >= 4 ? WEEKDAYS[t.getUTCDay()]! : WEEKDAYS[t.getUTCDay()]!.slice(0, 3);
        break;
      case "H":
        out += pad(hours, run);
        break;
      case "h":
        out += pad(hours % 12 === 0 ? 12 : hours % 12, run);
        break;
      case "a":
        out += hours < 12 ? "AM" : "PM";
        break;
      case "m":
        out += pad(t.getUTCMinutes(), run);
        break;
      case "s":
        out += pad(t.getUTCSeconds(), run);
        break;
      case "S":
        out += pad(t.getUTCMilliseconds(), 3).slice(0, run);
        break;
      case "X": {
        const abs = Math.abs(offset);
        out += offset === 0 ? "Z" : `${offset < 0 ? "-" : "+"}${pad(Math.trunc(abs / 60), 2)}:${pad(abs % 60, 2)}`;
        break;
      }
      default:
        out += c.repeat(run);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Untyped JSON
// ---------------------------------------------------------------------------

export type JsonKind = "null" | "boolean" | "number" | "string" | "array" | "object";

/**
 * A JSON value whose shape isn't known when the app is compiled (what `JSON.parse` returns without a type to
 * decode into): read it with the typed accessors, each `undefined` when the value is of another kind.
 * Objects keep their keys in the text's order (a key given twice keeps its first place and its last value).
 */
export class Json {
  readonly kind: JsonKind;
  private readonly bool: boolean;
  private readonly num: number;
  private readonly text: string;
  private readonly items: Json[] | undefined;
  private readonly fields: Map<string, Json> | undefined;

  private constructor(kind: JsonKind, bool: boolean, num: number, text: string, items: Json[] | undefined, fields: Map<string, Json> | undefined) {
    this.kind = kind;
    this.bool = bool;
    this.num = num;
    this.text = text;
    this.items = items;
    this.fields = fields;
  }

  static null(): Json {
    return new Json("null", false, 0, "", undefined, undefined);
  }
  static boolean(value: boolean): Json {
    return new Json("boolean", value, 0, "", undefined, undefined);
  }
  static number(value: number): Json {
    return new Json("number", false, value, "", undefined, undefined);
  }
  static string(value: string): Json {
    return new Json("string", false, 0, value, undefined, undefined);
  }
  /** The array is the value's own (changing it changes the value). */
  static array(items: Json[]): Json {
    return new Json("array", false, 0, "", items, undefined);
  }
  /** The map is the value's own (changing it changes the value). */
  static object(fields: Map<string, Json>): Json {
    return new Json("object", false, 0, "", undefined, fields);
  }

  isNull(): boolean {
    return this.kind === "null";
  }
  asBoolean(): boolean | undefined {
    return this.kind === "boolean" ? this.bool : undefined;
  }
  asNumber(): number | undefined {
    return this.kind === "number" ? this.num : undefined;
  }
  asString(): string | undefined {
    return this.kind === "string" ? this.text : undefined;
  }
  asArray(): Json[] | undefined {
    return this.items;
  }
  asObject(): Map<string, Json> | undefined {
    return this.fields;
  }
  /** An object's field. */
  get(key: string): Json | undefined {
    return this.fields ? this.fields.get(key) : undefined;
  }
  /** An array's element (a negative index counts from the end, as `Array.at`). */
  at(index: number): Json | undefined {
    return this.items?.at(index);
  }
  /** An object's keys, in order (empty for other kinds). */
  keys(): string[] {
    return this.fields ? [...this.fields.keys()] : [];
  }
  /** The number of an array's elements or an object's keys (0 for other kinds). */
  size(): number {
    return this.items ? this.items.length : this.fields ? this.fields.size : 0;
  }

  /** JSON text, as `JSON.stringify(value, null, indent)` writes the same value (`indent` spaces, at most 10). */
  stringify(indent: number = 0): string {
    const gap = " ".repeat(Math.max(0, Math.min(10, Math.trunc(indent))));
    return this.write(gap, "");
  }

  private write(gap: string, prefix: string): string {
    if (this.kind === "null") return "null";
    if (this.kind === "boolean") return this.bool ? "true" : "false";
    if (this.kind === "number") return JSON.stringify(this.num);
    if (this.kind === "string") return JSON.stringify(this.text);
    const inner = prefix + gap;
    const parts: string[] = [];
    if (this.items) {
      for (const item of this.items) parts.push(item.write(gap, inner));
    } else if (this.fields) {
      for (const [key, value] of this.fields) parts.push(`${JSON.stringify(key)}:${gap ? " " : ""}${value.write(gap, inner)}`);
    }
    const [open, close] = this.items ? ["[", "]"] : ["{", "}"];
    if (!parts.length) return open + close;
    return gap ? `${open}\n${inner}${parts.join(`,\n${inner}`)}\n${prefix}${close}` : `${open}${parts.join(",")}${close}`;
  }
}

/** What `parseJson` throws for text that isn't JSON (`name` is "SyntaxError", as JavaScript's). */
export class JsonSyntaxError extends Error {
  override name = "SyntaxError";
}

/** Reads JSON text (RFC 8259, as `JSON.parse` accepts it) into a `Json`; a SyntaxError names the first wrong position. */
export function parseJson(text: string): Json {
  const reader = new JsonReader(text);
  reader.space();
  const value = reader.value(0);
  reader.space();
  if (reader.pos < text.length) reader.fail();
  return value;
}

class JsonReader {
  pos = 0;
  readonly text: string;
  constructor(text: string) {
    this.text = text;
  }

  fail(): never {
    if (this.pos >= this.text.length) throw new JsonSyntaxError("JSON: unexpected end of input");
    throw new JsonSyntaxError(`JSON: unexpected character ${JSON.stringify(this.text.charAt(this.pos))} at position ${this.pos}`);
  }
  unit(): number {
    return this.pos < this.text.length ? this.text.charCodeAt(this.pos) : -1;
  }
  space(): void {
    let u = this.unit();
    while (u === 0x20 || u === 0x0a || u === 0x0d || u === 0x09) {
      this.pos++;
      u = this.unit();
    }
  }
  word(w: string): void {
    if (!this.text.startsWith(w, this.pos)) {
      while (this.text.charAt(this.pos) === w.charAt(0)) {
        this.pos++;
        w = w.slice(1);
      }
      this.fail();
    }
    this.pos += w.length;
  }
  value(depth: number): Json {
    if (depth > 512) throw new JsonSyntaxError("JSON: nested too deeply");
    const u = this.unit();
    if (u === 0x7b) return this.object(depth);
    if (u === 0x5b) return this.array(depth);
    if (u === 0x22) return Json.string(this.string());
    if (u === 0x74) {
      this.word("true");
      return Json.boolean(true);
    }
    if (u === 0x66) {
      this.word("false");
      return Json.boolean(false);
    }
    if (u === 0x6e) {
      this.word("null");
      return Json.null();
    }
    return Json.number(this.number());
  }
  digits(): void {
    const start = this.pos;
    while (isDigit(this.unit())) this.pos++;
    if (this.pos === start) this.fail();
  }
  number(): number {
    const start = this.pos;
    if (this.unit() === 0x2d) this.pos++;
    if (this.unit() === 0x30) this.pos++;
    else this.digits();
    if (this.unit() === 0x2e) {
      this.pos++;
      this.digits();
    }
    if (this.unit() === 0x65 || this.unit() === 0x45) {
      this.pos++;
      if (this.unit() === 0x2b || this.unit() === 0x2d) this.pos++;
      this.digits();
    }
    return Number(this.text.slice(start, this.pos));
  }
  hex(): number {
    let n = 0;
    for (let k = 0; k < 4; k++) {
      const u = this.unit();
      const d = isDigit(u) ? u - 0x30 : u >= 0x61 && u <= 0x66 ? u - 0x57 : u >= 0x41 && u <= 0x46 ? u - 0x37 : -1;
      if (d < 0) this.fail();
      n = n * 16 + d;
      this.pos++;
    }
    return n;
  }
  string(): string {
    this.pos++;
    let out = "";
    let start = this.pos;
    while (true) {
      const u = this.unit();
      if (u === 0x22) break;
      if (u < 0x20) this.fail();
      if (u !== 0x5c) {
        this.pos++;
        continue;
      }
      out += this.text.slice(start, this.pos);
      this.pos++;
      const e = this.unit();
      const simple = e === 0x22 ? '"' : e === 0x5c ? "\\" : e === 0x2f ? "/" : e === 0x62 ? "\b" : e === 0x66 ? "\f" : e === 0x6e ? "\n" : e === 0x72 ? "\r" : e === 0x74 ? "\t" : "";
      if (simple) {
        out += simple;
        this.pos++;
      } else if (e === 0x75) {
        this.pos++;
        const first = this.hex();
        // A pair written as two escapes is one character.
        if (first >= 0xd800 && first < 0xdc00 && this.text.startsWith("\\u", this.pos)) {
          const back = this.pos;
          this.pos += 2;
          const second = this.hex();
          if (second >= 0xdc00 && second < 0xe000) out += String.fromCharCode(first, second);
          else {
            out += String.fromCharCode(first);
            this.pos = back;
          }
        } else out += String.fromCharCode(first);
      } else this.fail();
      start = this.pos;
    }
    out += this.text.slice(start, this.pos);
    this.pos++;
    return out;
  }
  array(depth: number): Json {
    this.pos++;
    const items: Json[] = [];
    this.space();
    if (this.unit() === 0x5d) {
      this.pos++;
      return Json.array(items);
    }
    while (true) {
      this.space();
      items.push(this.value(depth + 1));
      this.space();
      const u = this.unit();
      this.pos++;
      if (u === 0x5d) return Json.array(items);
      if (u !== 0x2c) {
        this.pos--;
        this.fail();
      }
    }
  }
  object(depth: number): Json {
    this.pos++;
    const fields = new Map<string, Json>();
    this.space();
    if (this.unit() === 0x7d) {
      this.pos++;
      return Json.object(fields);
    }
    while (true) {
      this.space();
      if (this.unit() !== 0x22) this.fail();
      const key = this.string();
      this.space();
      if (this.unit() !== 0x3a) this.fail();
      this.pos++;
      this.space();
      fields.set(key, this.value(depth + 1));
      this.space();
      const u = this.unit();
      this.pos++;
      if (u === 0x7d) return Json.object(fields);
      if (u !== 0x2c) {
        this.pos--;
        this.fail();
      }
    }
  }
}

// ---------------------------------------------------------------------------
// UTF-16 code units
// ---------------------------------------------------------------------------

/**
 * A string as JavaScript stores one: UTF-16 code units, lone surrogates included (Swift and Rust strings can't
 * hold those, so a native `string` that would have one has U+FFFD instead). Positions and lengths are in units.
 * Immutable; `toString()` is the well-formed string (each lone surrogate as U+FFFD), the same everywhere.
 */
export class Utf16 {
  private readonly u: number[];
  private constructor(units: number[]) {
    this.u = units;
  }

  static from(s: string): Utf16 {
    return new Utf16(textUnits(s));
  }
  /** Each number's low 16 bits, as `String.fromCharCode` takes them. */
  static fromUnits(units: number[]): Utf16 {
    return new Utf16(units.map((n) => n & 0xffff));
  }

  get length(): number {
    return this.u.length;
  }
  /** The unit at `i` (a negative index counts from the end), as `s.at(i)?.charCodeAt(0)`. */
  at(i: number): number | undefined {
    return this.u.at(i);
  }
  /** As `s.codePointAt(i)`: a surrogate pair's code point, else the unit. */
  codePointAt(i: number): number | undefined {
    const a = this.u[i];
    if (a === undefined) return undefined;
    const b = this.u[i + 1];
    if (a >= 0xd800 && a < 0xdc00 && b !== undefined && b >= 0xdc00 && b < 0xe000) return (a - 0xd800) * 0x400 + (b - 0xdc00) + 0x10000;
    return a;
  }
  /** As `s.slice(start, end)` (negative positions count from the end). */
  slice(start: number = 0, end: number = this.u.length): Utf16 {
    return new Utf16(this.u.slice(start, end));
  }
  concat(other: Utf16): Utf16 {
    return new Utf16(this.u.concat(other.u));
  }
  /** As `s.indexOf(other, from)`. */
  indexOf(other: Utf16, from: number = 0): number {
    const n = other.u.length;
    for (let i = Math.max(0, Math.min(Math.trunc(from), this.u.length)); i + n <= this.u.length; i++) {
      let k = 0;
      while (k < n && this.u[i + k] === other.u[k]) k++;
      if (k === n) return i;
    }
    return -1;
  }
  equals(other: Utf16): boolean {
    return this.compare(other) === 0;
  }
  /** -1, 0 or 1 by code units, as `<` orders strings. */
  compare(other: Utf16): number {
    return compareUnits(this.u, other.u, false);
  }
  /** No lone surrogate (`s.isWellFormed()`). */
  isWellFormed(): boolean {
    for (let i = 0; i < this.u.length; i++) {
      const a = this.u[i]!;
      if (a >= 0xd800 && a < 0xdc00) {
        const b = this.u[i + 1] ?? 0;
        if (b < 0xdc00 || b >= 0xe000) return false;
        i++;
      } else if (a >= 0xdc00 && a < 0xe000) return false;
    }
    return true;
  }
  /** The units, a copy. */
  units(): number[] {
    return this.u.slice();
  }
  /** The well-formed string: each lone surrogate becomes U+FFFD (`s.toWellFormed()`). */
  toString(): string {
    let out = "";
    let chunk: number[] = [];
    for (let i = 0; i < this.u.length; i++) {
      const a = this.u[i]!;
      const b = this.u[i + 1] ?? 0;
      if (a >= 0xd800 && a < 0xdc00 && b >= 0xdc00 && b < 0xe000) {
        chunk.push(a, b);
        i++;
      } else chunk.push(a >= 0xd800 && a < 0xe000 ? 0xfffd : a);
      if (chunk.length >= 4096) {
        out += String.fromCharCode(...chunk);
        chunk = [];
      }
    }
    return out + String.fromCharCode(...chunk);
  }
  /** A JSON string literal of the units, lone surrogates as `\udxxx` (as `JSON.stringify` writes them). */
  toJson(): string {
    let out = '"';
    let start = 0;
    for (let i = 0; i < this.u.length; i++) {
      const a = this.u[i]!;
      const b = this.u[i + 1] ?? 0;
      if (a >= 0xd800 && a < 0xdc00 && b >= 0xdc00 && b < 0xe000) {
        i++;
        continue;
      }
      if (a >= 0xd800 && a < 0xe000) {
        const text = new Utf16(this.u.slice(start, i)).toString();
        out += JSON.stringify(text).slice(1, -1) + `\\u${a.toString(16)}`;
        start = i + 1;
      }
    }
    return out + JSON.stringify(new Utf16(this.u.slice(start)).toString()).slice(1, -1) + '"';
  }
}

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

/** Something released explicitly: what JavaScript would hand to a `FinalizationRegistry` or a `using` declaration. */
export interface Disposable {
  dispose(): void;
}

/** Runs `body` with the resource and disposes of it afterwards, also when `body` throws (`using`'s guarantee). */
export function use<T extends Disposable, R>(resource: T, body: (resource: T) => R): R {
  try {
    return body(resource);
  } finally {
    resource.dispose();
  }
}

/** Collects resources and disposes of them together, the last added first (`DisposableStack`). */
export class Disposer implements Disposable {
  private items: Disposable[] = [];
  private done = false;

  /** Adds a resource. Added after `dispose()`, it is disposed of at once. */
  add(resource: Disposable): void {
    if (this.done) resource.dispose();
    else this.items.push(resource);
  }
  get disposed(): boolean {
    return this.done;
  }
  dispose(): void {
    if (this.done) return;
    this.done = true;
    const items = this.items;
    this.items = [];
    for (let i = items.length - 1; i >= 0; i--) items[i]!.dispose();
  }
}

// ---------------------------------------------------------------------------
// Listeners without hidden captures
// ---------------------------------------------------------------------------

/** A function with its state in fields the cycle collector can see (see `bind`). */
export abstract class Listener<A> {
  abstract call(arg: A): void;
}

class BoundListener<O extends object, A> extends Listener<A> {
  readonly owner: O;
  private readonly fn: (owner: O, arg: A) => void;
  constructor(owner: O, fn: (owner: O, arg: A) => void) {
    super();
    this.owner = owner;
    this.fn = fn;
  }
  override call(arg: A): void {
    this.fn(this.owner, arg);
  }
}

/**
 * A listener that calls `fn(owner, arg)`: the owner is a field, not a capture, so an owner that is also
 * reachable from where the listener is kept (a view listening to its own model) is a cycle Swift and Rust
 * free. `fn` must not capture the owner itself (write `(view, n) => { view.count += n; }`, not `this.count`).
 */
export function bind<O extends object, A>(owner: O, fn: (owner: O, arg: A) => void): Listener<A> {
  return new BoundListener<O, A>(owner, fn);
}

/** Listeners of one event: `emit` calls them in the order added. */
export class Emitter<A> {
  private listeners: Listener<A>[] = [];

  /** Adds a listener; disposing of the subscription removes it. */
  on(listener: Listener<A>): Disposable {
    this.listeners.push(listener);
    return new Subscription<A>(this, listener);
  }
  off(listener: Listener<A>): void {
    const i = this.listeners.indexOf(listener);
    if (i >= 0) this.listeners.splice(i, 1);
  }
  /** Calls every listener added before the call, in order. */
  emit(arg: A): void {
    for (const listener of this.listeners.slice()) listener.call(arg);
  }
  get size(): number {
    return this.listeners.length;
  }
}

class Subscription<A> implements Disposable {
  private readonly emitter: Emitter<A>;
  private readonly listener: Listener<A>;
  constructor(emitter: Emitter<A>, listener: Listener<A>) {
    this.emitter = emitter;
    this.listener = listener;
  }
  dispose(): void {
    this.emitter.off(this.listener);
  }
}

// ---------------------------------------------------------------------------
// null and undefined told apart
// ---------------------------------------------------------------------------

/** Which of its three states an `Opt` is in. */
export type OptState = "value" | "null" | "undefined";

/**
 * A value, `null`, or `undefined`, kept apart: natively an optional has one nil, so a `T | null | undefined` whose
 * code tests `=== null` / `=== undefined` separately is rejected; hold it in an `Opt<T>` instead (`opt(v)`,
 * `optNull()`, `optUndefined()`). Its text and `typeof` are JavaScript's for the value it stands for.
 */
export class Opt<T> {
  readonly state: OptState;
  private readonly held: T | undefined;
  constructor(state: OptState, held: T | undefined) {
    this.state = state;
    this.held = held;
  }
  isValue(): boolean {
    return this.state === "value";
  }
  /** `x === null` */
  isNull(): boolean {
    return this.state === "null";
  }
  /** `x === undefined` */
  isUndefined(): boolean {
    return this.state === "undefined";
  }
  /** `x == null` */
  isNullish(): boolean {
    return this.state !== "value";
  }
  /** The value, or undefined for both null and undefined (`state` tells which). */
  get(): T | undefined {
    return this.held;
  }
  /** `x ?? fallback` */
  or(fallback: T): T {
    return this.held ?? fallback;
  }
  /** `typeof x` ("object" for null, as JavaScript says). */
  typeOf(): string {
    return this.state === "null" ? "object" : this.state === "undefined" ? "undefined" : typeof this.held;
  }
  /** `String(x)` */
  toString(): string {
    return this.state === "null" ? "null" : this.state === "undefined" ? "undefined" : `${this.held}`;
  }
}

/** An `Opt` holding `v`. */
export function opt<T>(v: T): Opt<T> {
  return new Opt<T>("value", v);
}

/** An `Opt` that is `null`. */
export function optNull<T>(): Opt<T> {
  return new Opt<T>("null", undefined);
}

/** An `Opt` that is `undefined`. */
export function optUndefined<T>(): Opt<T> {
  return new Opt<T>("undefined", undefined);
}
