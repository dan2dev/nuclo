// Fixes: behavior bugs other features found. Every top-level name starts with `fx` (one native namespace).

/** 1. A `break` in the middle of a case leaves the switch, not the loop around it. */
export function fxSwitchBreak(): string[] {
  const out: string[] = [];
  for (let i = 0; i < 4; i++) {
    switch (i) {
      case 1:
        out.push("one");
        if (i === 1) break;
        out.push("not reached");
        break;
      case 2: {
        for (let j = 0; j < 5; j++) {
          if (j === 2) break;
          out.push(`j${j}`);
        }
        out.push("two");
        break;
      }
      default:
        if (i === 3) {
          out.push("three");
          break;
        }
        out.push(`d${i}`);
    }
    out.push(`after ${i}`);
  }
  // A switch in a switch, `continue` from a switch, a string switch, a computed-case switch.
  let k = 0;
  while (k < 4) {
    k++;
    switch (k % 2) {
      case 0:
        switch (k) {
          case 2:
            out.push("inner two");
            if (k > 0) break;
            out.push("not reached");
            break;
          default:
            out.push(`inner ${k}`);
        }
        out.push(`outer even ${k}`);
        break;
      default:
        if (k === 3) continue;
        out.push(`odd ${k}`);
    }
    out.push(`end ${k}`);
  }
  const words = ["stop", "go", "skip", "go"];
  for (const w of words) {
    switch (w) {
      case "go":
        out.push("going");
        break;
      case "skip":
        if (w.length > 0) break;
        out.push("not reached");
        break;
      default:
        out.push(`other ${w}`);
    }
  }
  const limit = 2;
  for (let n = 0; n < 4; n++) {
    switch (n) {
      case limit:
        if (n === 2) break;
        out.push("not reached");
        break;
      case limit + 1:
        out.push("limit+1");
        break;
    }
    out.push(`n ${n}`);
  }
  // A `break` out of a try with finally, inside a case.
  for (let t = 0; t < 2; t++) {
    switch (t) {
      case 0:
        try {
          if (t === 0) break;
          out.push("not reached");
        } finally {
          out.push("finally 0");
        }
        out.push("not reached");
        break;
      default:
        out.push(`t ${t}`);
    }
    out.push(`after t ${t}`);
  }
  return out;
}

/** 2. An element of an array of optionals tested against null. */
export function fxOptionalElements(): string[] {
  const out: string[] = [];
  const xs: (number | null)[] = [1, null, 3];
  for (let i = 0; i < xs.length; i++) out.push(xs[i] === null ? "gap" : "set");
  for (let i = 0; i < xs.length; i++) out.push(xs[i] == null ? "gap" : `v${xs[i] ?? 0}`);
  out.push(xs[1] !== null ? "set" : "gap");
  out.push(xs[5] === undefined ? "missing" : "present");
  out.push(xs[1] === undefined ? "missing" : "present");
  const names: (string | null)[] = ["a", null];
  out.push(names[1] === null ? "no name" : "name");
  out.push(`${names[0] ?? "none"} ${names[1] ?? "none"}`);
  const first = xs[1];
  out.push(first == null ? "first null" : `first ${first}`);
  out.push(xs[3] === undefined ? "past the end" : "in");
  const i = 2;
  out.push(xs[i] !== undefined && xs[i] !== null ? "two set" : "two unset");
  return out;
}

/** 3. Whole-number arithmetic beyond 32 bits is exact, as JavaScript's doubles are. */
export function fxIntBoundary(): string[] {
  const out: string[] = [];
  const max = 0x7fffffff;
  out.push(`${max + 1}`);
  let n = 2147483647;
  n += 1;
  out.push(`${n}`);
  let m = 65536;
  m = m * 65536;
  out.push(`${m}`);
  let p = 1;
  for (let i = 0; i < 40; i++) p *= 3;
  out.push(`${p}`);
  const neg = -2147483648;
  out.push(`${neg - 1}`);
  let count = 0;
  for (let i = 0; i < 10; i++) count++;
  out.push(`${count}`);
  const side = 50000;
  const area = side * side;
  out.push(`${area} ${65536 * 65536} ${side * 2}`);
  let total = 0;
  for (const x of [2000000000, 2000000000]) total += x;
  out.push(`${total}`);
  let fact = 1;
  for (let i = 2; i <= 20; i++) fact *= i;
  out.push(`${fact}`);
  return out;
}

function fxApply(f: (n: number) => number, x: number): number {
  return f(x);
}
function fxForward(f: (n: number) => number): number {
  return fxApply(f, 3);
}

function fxTwice(f: (x: number) => number, x: number): number {
  return f(x) + f(x / 2);
}
function fxForwardTwice(f: (x: number) => number): number {
  return fxTwice(f, 3);
}
function fxForwardCopy(f: (x: number) => number): number {
  const g = f;
  return fxTwice(g, 5) + f(1);
}
function fxApplyAll(xs: number[], f: (x: number) => number): number[] {
  const out: number[] = [];
  for (const x of xs) out.push(f(x));
  return out;
}
function fxForwardAll(xs: number[], f: (x: number) => number): number[] {
  return fxApplyAll(xs, f);
}

/** 4. A callback parameter passed on to another function keeps one number kind. */
export function fxForwardCallback(): string[] {
  const out: string[] = [];
  out.push(`${fxForward((n) => n + 1)}`);
  out.push(`${fxForward((n) => n / 2)}`);
  out.push(`${fxForwardTwice((x) => x + 1)}`);
  out.push(`${fxForwardCopy((x) => x * 3)}`);
  const inc = (n: number) => n + 1;
  out.push(`${fxForwardTwice(inc)} ${inc(2)}`);
  out.push(fxForwardAll([1, 2.5], (x) => x + 1).join(","));
  return out;
}

/** B. A local function reads locals declared before it; JavaScript hoists it above them. */
export function fxHoisted(): string[] {
  const out: string[] = [];
  out.push(`early ${fxDouble(3)}`);
  const base = 10;
  let count = 0;
  function addBase(n: number): number {
    count++;
    return n + base + fxDouble(0);
  }
  function fxDouble(n: number): number {
    return n * 2;
  }
  const later = () => addBase(1);
  out.push(`${addBase(5)} ${later()} ${count}`);
  {
    const inner = "in";
    function tag(s: string): string {
      return `${inner}:${s}`;
    }
    out.push(tag("block"));
  }
  return out;
}

function fxAttempt(fail: boolean): Error | null {
  try {
    if (fail) throw new Error("boom");
  } catch (e) {
    if (e instanceof Error) return e;
  }
  return null;
}

/** 5. `?.message` on an `Error | null`. */
export function fxOptionalError(): string[] {
  const out: string[] = [];
  for (const fail of [false, true]) {
    const err = fxAttempt(fail);
    out.push(`${err?.message ?? "no error"}`);
    out.push(err?.message === "boom" ? "is boom" : "not boom");
  }
  return out;
}

/** 6. `??` whose result is a union of the two sides. */
export function fxCoalesceUnion(): string[] {
  const out: string[] = [];
  const flags: (boolean | undefined)[] = [true, undefined];
  for (const f of flags) {
    const v = f ?? "unset";
    out.push(`${v}`);
  }
  const nums: (number | null)[] = [2.5, null];
  for (const x of nums) out.push(`${x ?? "none"}`);
  return out;
}

function fxFirstOrNull<T>(xs: T[]): T | null {
  return xs[0] ?? null;
}

/** 7. `xs[0] ?? null` in a generic function. */
export function fxGenericCoalesce(): string[] {
  const n = fxFirstOrNull([4, 5]);
  return [`${n ?? "null"}`, `${fxFirstOrNull<string>([]) ?? "null"}`, `${fxFirstOrNull(["a"]) ?? "null"}`];
}

/** 8. Mutating each element of a for-of. */
export function fxForOfMutate(): string[] {
  const rows: number[][] = [[1], [2, 3]];
  for (const row of rows) row.push(0);
  return rows.map((r) => r.join(","));
}
