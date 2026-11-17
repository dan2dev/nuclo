// rest2: mixed enums, `var` cases, static fields whose initializer can throw.

enum R2Mixed {
  Off = 0,
  On = "on",
  Auto = 2,
  Later = "later",
}

function r2Describe(m: R2Mixed): string {
  switch (m) {
    case R2Mixed.Off:
      return "off";
    case R2Mixed.On:
      return "on!";
    default:
      return `other ${m} ${typeof m}`;
  }
}

export function r2MixedEnums(): string[] {
  const out: string[] = [];
  const all: R2Mixed[] = [R2Mixed.Off, R2Mixed.On, R2Mixed.Auto, R2Mixed.Later];
  for (const m of all) out.push(`${m} ${r2Describe(m)} ${m === R2Mixed.Auto} ${m == R2Mixed.Off}`);
  let cur: R2Mixed = R2Mixed.On;
  out.push(`${cur} ${all.indexOf(cur)} ${all.includes(R2Mixed.Later)}`);
  cur = R2Mixed.Auto;
  out.push(`${cur} ${all.indexOf(cur)} ${all.join("|")}`);
  const byName: Record<string, R2Mixed> = { a: R2Mixed.Later, b: R2Mixed.Off };
  out.push(`${byName["a"]} ${byName["b"]}`);
  return out;
}

// Module-level `var`s declared twice and in a block.
var r2Total = 10;
var r2Seen = "";
for (let i = 0; i < 3; i++) {
  var r2Total = r2Total + i;
  if (i === 1) {
    var r2Seen = `seen ${i}`;
  }
}
var r2Total = r2Total * 2;

function r2LastBig(xs: number[]): number {
  var x = -1;
  for (var x of xs) {
    if (x > 2) break;
  }
  // After the loop x keeps the element it stopped at (the last one without a break).
  return x * 10;
}

function r2Names(): string[] {
  const out: string[] = [];
  const fns: (() => string)[] = [];
  for (var w of ["a", "b", "c"]) {
    fns.push(() => w);
  }
  // One binding for the whole function: every closure sees the last value.
  for (const f of fns) out.push(f());
  var w = "z";
  out.push(w, fns[0]!());
  return out;
}

export function r2Vars(): string[] {
  const out: string[] = [];
  out.push(`${r2Total} ${r2Seen}`);
  out.push(`${r2LastBig([1, 5, 2, 9])} ${r2LastBig([1, 2])}`);
  out.push(...r2Names());
  var count = 0;
  var k = 0;
  for (var k of [3, 4]) count += k;
  var count = count + 1;
  out.push(`${count} ${k}`);
  return out;
}

function r2Strict(text: string): number {
  const n = Number(text);
  if (Number.isNaN(n)) throw new Error(`not a number: ${text}`);
  return n;
}

class R2Config {
  static readonly port = r2Strict("8080");
  static retries = r2Strict("3") + 1;
  static describe(): string {
    return `${R2Config.port}:${R2Config.retries}`;
  }
}

export function r2StaticThrows(): string[] {
  const out = [R2Config.describe()];
  R2Config.retries++;
  out.push(R2Config.describe());
  try {
    r2Strict("x");
  } catch (e) {
    out.push(e instanceof Error ? e.message : "?");
  }
  return out;
}
