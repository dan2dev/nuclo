/**
 * Language round 4: custom error classes (`class E extends Error`). Every top-level name starts with `Lg4` / `lg4`.
 */

export class Lg4ValidationError extends Error {
  constructor(
    message: string,
    readonly field: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class Lg4NotFound extends Lg4ValidationError {
  code = 404;
  constructor(what: string) {
    super(`${what} not found`, "id");
    this.name = "NotFound";
  }
}

/** Keeps Error's name ("Error") and constructor. */
class Lg4Plain extends Error {}

/** A field initializer naming the error, and an own toString(). */
class Lg4Timeout extends Error {
  override name = "TimeoutError";
  constructor(readonly ms: number) {
    super(`after ${ms}ms`);
  }
}

class Lg4Loud extends Error {
  override toString(): string {
    return `!! ${this.message.toUpperCase()}`;
  }
}

/** Carries a value that isn't an error (what `throw value` would throw). */
class Lg4Failure extends Error {
  constructor(readonly value: number) {
    super(`failed with ${value}`);
    this.name = "Failure";
  }
}

function lg4Check(n: number): number {
  if (n < 0) throw new Lg4ValidationError(`negative: ${n}`, "n");
  if (n === 0) throw new Lg4NotFound("zero");
  if (n === 7) throw new Lg4Timeout(70);
  if (n === 8) throw new Lg4Failure(8);
  if (n > 100) throw new Error("too big");
  return n * 2;
}

function lg4Describe(e: Error): string {
  if (e instanceof Lg4NotFound) return `notfound ${e.code} ${e.field} ${e.message} ${e.name}`;
  if (e instanceof Lg4ValidationError) return `invalid ${e.field}: ${e.message}`;
  if (e instanceof Lg4Timeout) return `timeout ${e.ms} ${e.name}`;
  if (e instanceof Lg4Failure) return `failure ${e.value + 1}`;
  return `error ${e.name} ${e.message}`;
}

export function lg4CustomErrors(): string[] {
  const out: string[] = [];
  for (const n of [5, -1, 0, 7, 8, 101]) {
    try {
      out.push(`ok ${lg4Check(n)}`);
    } catch (e) {
      if (e instanceof Error) out.push(lg4Describe(e));
      out.push(String(e));
      out.push(`${e}`);
      if (e instanceof Error) out.push(`${e.name}/${e.message}`);
    }
  }
  return out;
}

export function lg4ErrorValues(): string[] {
  const out: string[] = [];
  const p = new Lg4Plain("plain");
  out.push(p.name, p.message, String(p), `${p}`, `${p instanceof Error} ${p instanceof Lg4Plain}`);
  const empty = new Lg4Plain();
  out.push(`[${empty.message}]`, String(empty));
  empty.name = "";
  out.push(String(empty));
  empty.message = "only message";
  out.push(String(empty));
  const v = new Lg4ValidationError("bad", "f");
  out.push(`${v instanceof Lg4NotFound} ${v instanceof Lg4ValidationError} ${v instanceof Error}`);
  const t = new Lg4Timeout(5);
  out.push(t.name, `${t}`, `${t.ms}`);
  const loud = new Lg4Loud("quiet");
  out.push(`${loud}`, String(loud), loud.name);
  const errs: Error[] = [new Error("a"), new Lg4NotFound("b"), v, loud];
  for (const e of errs) out.push(`${e.name}|${e.message}|${e instanceof Lg4ValidationError}|${e instanceof Lg4NotFound}|${String(e)}`);
  return out;
}

function lg4Catch(f: () => void): Error | null {
  try {
    f();
  } catch (e) {
    if (e instanceof Error) return e;
  }
  return null;
}

export function lg4Rethrow(): string[] {
  const out: string[] = [];
  // Rethrown, the error keeps its class; changed after it was thrown, readers see the change.
  try {
    try {
      lg4Check(0);
    } catch (e) {
      if (e instanceof Lg4NotFound) {
        e.code = 410;
        e.message = "gone";
      }
      throw e;
    }
  } catch (e) {
    if (e instanceof Error) out.push(lg4Describe(e));
    out.push(String(e));
  }
  // Thrown from a method and a constructor, through finally.
  class Lg4Box {
    constructor(readonly n: number) {
      if (n > 9) throw new Lg4ValidationError("too wide", "n");
    }
    open(): number {
      if (this.n === 3) throw new Lg4Failure(this.n);
      return this.n;
    }
  }
  for (const n of [1, 3, 12]) {
    let finished = false;
    try {
      out.push(`opened ${new Lg4Box(n).open()}`);
    } catch (e) {
      out.push(`caught ${e instanceof Error ? lg4Describe(e) : "?"}`);
    } finally {
      finished = true;
    }
    out.push(`finally ${finished}`);
  }
  // Kept in a variable and thrown later; a caught error kept as an Error.
  const later: Lg4Failure = new Lg4Failure(42);
  const kept = lg4Catch(() => {
    throw later;
  });
  out.push(kept === null ? "none" : `${kept.name} ${kept instanceof Lg4Failure} ${kept.message}`);
  const none = lg4Catch(() => {});
  out.push(none === null ? "none" : none.name);
  return out;
}
