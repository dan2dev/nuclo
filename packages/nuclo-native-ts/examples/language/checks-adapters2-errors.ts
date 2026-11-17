// Thrown values that aren't Errors and an error's `cause` (adapters2): carried in a native error, narrowed as in JavaScript.

function fail(kind: number): void {
  if (kind === 0) throw "boom";
  if (kind === 1) throw 404;
  if (kind === 2) throw 1.5;
  if (kind === 3) throw false;
  if (kind === 4) throw null;
  if (kind === 5) throw undefined;
  if (kind === 6) throw new Error("plain");
  if (kind === 7) throw "";
}

function describe(e: unknown): string {
  if (typeof e === "string") return `string ${e.length} [${e.toUpperCase()}]`;
  if (typeof e === "number") return `number ${e + 1}`;
  if (typeof e === "boolean") return `boolean ${!e}`;
  if (e instanceof Error) return `error ${e.message}`;
  return `other ${typeof e}`;
}

export function ad2Thrown(): string[] {
  const out: string[] = [];
  for (let k = 0; k < 8; k++) {
    try {
      fail(k);
      out.push("no throw");
    } catch (e) {
      out.push(`${k}: ${typeof e} ${String(e)} | ${e instanceof Error} | ${describe(e)} | \`${e}\``);
    }
  }
  // Caught values kept as `unknown`, thrown again from there.
  const kept: unknown[] = [];
  for (const k of [0, 1, 6, 4]) {
    try {
      fail(k);
    } catch (e) {
      kept.push(e);
    }
  }
  for (const u of kept) {
    try {
      throwAgain(u);
    } catch (e) {
      out.push(`again ${typeof e} ${String(e)} ${e instanceof Error} ${u instanceof Error}`);
    }
  }
  return out;
}

function throwAgain(u: unknown): never {
  throw u;
}

class Failure extends Error {
  constructor(message: string, readonly code: number, cause: unknown) {
    super(message, { cause });
    this.name = "Failure";
  }
}

function parse(text: string): number {
  const n = Number(text);
  if (Number.isNaN(n)) throw `not a number: ${text}`;
  return n;
}

function load(text: string): number {
  try {
    return parse(text);
  } catch (e) {
    throw new Error(`load failed`, { cause: e });
  }
}

export function ad2Cause(): string[] {
  const out: string[] = [];
  try {
    load("x1");
  } catch (e) {
    if (e instanceof Error) {
      out.push(`${e.message} / ${typeof e.cause} / ${String(e.cause)}`);
      if (typeof e.cause === "string") out.push(`cause text ${e.cause.length}`);
    }
  }
  out.push(`loaded ${load("42")}`);
  const inner = new Error("inner");
  const outer = new Error("outer", { cause: inner });
  out.push(`${String(outer)} <- ${outer.cause instanceof Error ? outer.cause.message : "?"}`);
  const none = new Error("none");
  out.push(`no cause: ${typeof none.cause} ${String(none.cause)} ${none.cause instanceof Error}`);
  const numeric = new Error("n", { cause: 7 });
  out.push(`numeric: ${typeof numeric.cause} ${typeof numeric.cause === "number" ? numeric.cause * 6 : 0}`);
  try {
    throw new Failure("bad input", 400, outer);
  } catch (e) {
    if (e instanceof Failure) {
      const c = e.cause;
      out.push(`${e.name} ${e.code} ${String(e)} <- ${c instanceof Error ? String(c) : "?"}`);
    }
  }
  try {
    try {
      throw 3;
    } catch (e) {
      throw e;
    }
  } catch (again) {
    out.push(`rethrown ${typeof again} ${String(again)}`);
  }
  return out;
}
