// Exceptions: `throw` anywhere, propagation through every kind of function, catch / finally on every path.

function exFail(message: string): never {
  throw new Error(message);
}

function exParsePositive(text: string): number {
  const n = Number(text);
  if (Number.isNaN(n)) throw new Error(`not a number: ${text}`);
  if (n <= 0) exFail(`not positive: ${text}`);
  return n;
}

function exSumAll(texts: string[]): number {
  let total = 0;
  for (const t of texts) total += exParsePositive(t);
  return total;
}

function exDescribe(texts: string[]): string {
  try {
    return `sum ${exSumAll(texts)}`;
  } catch (e) {
    return e instanceof Error ? `caught ${e.message}` : "caught something";
  }
}

/** A function that never returns ends a path that would need a value. */
function exPick(kind: string): number {
  if (kind === "a") return 1;
  if (kind === "b") return 2;
  exFail(`unknown kind ${kind}`);
}

export function syncThrows(): string[] {
  const out: string[] = [];
  out.push(exDescribe(["1", "2", "3.5"]));
  out.push(exDescribe(["1", "x", "3"]));
  out.push(exDescribe(["1", "-2"]));
  out.push(exDescribe([]));
  try {
    out.push(`pick ${exPick("a")}`);
    out.push(`pick ${exPick("z")}`);
    out.push("not reached");
  } catch (e) {
    out.push(`pick failed: ${e}`);
  }
  // A local function, and catch without a binding.
  const check = (n: number): number => {
    if (n > 10) throw new Error(`too big ${n}`);
    return n * 2;
  };
  let done = 0;
  for (const n of [1, 20, 3]) {
    try {
      out.push(`check ${check(n)}`);
      done++;
    } catch {
      out.push(`check failed for ${n}`);
    }
  }
  out.push(`done ${done}`);
  // State changed before the throw stays changed.
  const log: string[] = [];
  try {
    log.push("one");
    check(99);
    log.push("two");
  } catch (e) {
    log.push(`err ${e instanceof Error ? e.message : ""}`);
  }
  out.push(log.join(","));
  // Rethrow, and an error kept in a variable.
  let kept: Error | null = null;
  try {
    try {
      check(50);
    } catch (e) {
      out.push("inner caught, rethrowing");
      throw e;
    }
  } catch (e) {
    if (e instanceof Error) kept = e;
  }
  out.push(`kept ${kept !== null ? kept.message : "none"}`);
  try {
    throw new Error();
  } catch (e) {
    out.push(`empty message [${e instanceof Error ? e.message : "?"}] ${e}`);
  }
  return out;
}

class ExAccount {
  private balanceValue = 0;
  readonly owner: string;
  constructor(owner: string, opening: number) {
    if (opening < 0) throw new Error(`negative opening for ${owner}`);
    this.owner = owner;
    this.balanceValue = opening;
  }
  get balance(): number {
    if (this.balanceValue > 1000) throw new Error("balance too big to show");
    return this.balanceValue;
  }
  set balance(value: number) {
    if (value < 0) throw new Error(`overdraft to ${value}`);
    this.balanceValue = value;
  }
  withdraw(amount: number): number {
    this.balance = this.balance - amount;
    return this.balance;
  }
  static open(owner: string): ExAccount {
    return new ExAccount(owner, owner.length > 3 ? 10 : -1);
  }
}

class ExSavings extends ExAccount {
  constructor(owner: string) {
    super(owner, 100);
  }
  override withdraw(amount: number): number {
    if (amount > 50) throw new Error(`savings limit ${amount}`);
    return super.withdraw(amount);
  }
}

interface ExShape {
  area(): number;
}

class ExSquare implements ExShape {
  constructor(private side: number) {}
  area(): number {
    if (this.side < 0) throw new Error("negative side");
    return this.side * this.side;
  }
}

class ExCircle implements ExShape {
  constructor(private r: number) {}
  area(): number {
    return Math.round(3 * this.r * this.r);
  }
}

export function classThrows(): string[] {
  const out: string[] = [];
  const attempt = (label: string, f: () => string) => {
    try {
      out.push(`${label}: ${f()}`);
    } catch (e) {
      out.push(`${label} failed: ${e instanceof Error ? e.message : ""}`);
    }
  };
  attempt("open", () => new ExAccount("ann", 5).owner);
  attempt("negative", () => new ExAccount("bob", -5).owner);
  attempt("static", () => ExAccount.open("bo").owner);
  attempt("static ok", () => ExAccount.open("carla").owner);
  let made: ExAccount | null = null;
  try {
    made = new ExAccount("dee", 40);
  } catch {
    return out;
  }
  const acc: ExAccount = made;
  attempt("withdraw", () => String(acc.withdraw(15)));
  attempt("overdraw", () => String(acc.withdraw(100)));
  attempt("after", () => String(acc.balance));
  attempt("setter", () => {
    acc.balance = 2000;
    return "set";
  });
  attempt("getter", () => String(acc.balance));
  let savings: ExSavings | null = null;
  try {
    savings = new ExSavings("eve");
  } catch {
    return out;
  }
  const s: ExSavings = savings;
  attempt("savings", () => String(s.withdraw(30)));
  attempt("savings limit", () => String(s.withdraw(60)));
  attempt("savings overdraft", () => String(s.withdraw(50) + s.withdraw(50)));
  attempt("savings after", () => String(s.balance));
  const shapes: ExShape[] = [new ExCircle(2), new ExSquare(3), new ExSquare(-1), new ExCircle(1)];
  let total = 0;
  for (const shape of shapes) {
    try {
      total += shape.area();
    } catch (e) {
      out.push(`shape: ${e instanceof Error ? e.message : ""}`);
    }
  }
  out.push(`total ${total}`);
  return out;
}

function exApplyAll(xs: number[], f: (x: number) => number): number[] {
  const out: number[] = [];
  for (const x of xs) out.push(f(x));
  return out;
}

function exEachText(xs: string[], f: (s: string) => string): string {
  let out = "";
  for (const x of xs) out += f(x);
  return out;
}

/** A callback passed on: its parameter holds what the caller's does. */
function exForward(xs: string[], f: (s: string) => string): string {
  return exEachText(xs, f);
}

function exTwice(f: (x: number) => number, x: number): number {
  return f(x) + f(x / 2);
}

interface ExRule {
  name: string;
  test: (x: number) => boolean;
}

class ExValidator {
  private rules: ExRule[] = [];
  add(rule: ExRule) {
    this.rules.push(rule);
  }
  run(x: number): string {
    return this.rules.filter((r) => r.test(x)).map((r) => r.name).join("+");
  }
}

export function callbackThrows(): string[] {
  const out: string[] = [];
  const strict = (x: number): number => {
    if (Math.floor(x / 2) * 2 !== x) throw new Error(`odd ${x}`);
    return x / 2;
  };
  const run = (label: string, f: () => string) => {
    try {
      out.push(`${label} ${f()}`);
    } catch (e) {
      out.push(`${label} threw ${e instanceof Error ? e.message : ""}`);
    }
  };
  run("map", () => [2, 4, 6].map(strict).join(","));
  run("map odd", () => [2, 3, 6].map((x) => strict(x)).join(","));
  const seen: number[] = [];
  run("forEach", () => {
    [2, 4, 5, 6].forEach((x) => {
      seen.push(strict(x));
    });
    return "done";
  });
  out.push(`seen ${seen.join(",")}`);
  run("filter", () => [4, 8, 7].filter((x) => strict(x) > 2).join(","));
  run("some", () => String([2, 8, 9].some((x) => strict(x) === 4)));
  run("every", () => String([2, 3].every((x) => strict(x) > 0)));
  run("find", () => String([2, 6, 1].find((x) => strict(x) === 3) ?? -1));
  run("findIndex", () => String([1, 6].findIndex((x) => strict(x) === 3)));
  run("reduce", () => String([2, 4, 6].reduce((acc, x) => acc + strict(x), 0)));
  run("map index", () => [4, 2].map((x, i) => strict(x + i)).join(","));
  const items = [3, 1, 2];
  run("sort", () => {
    items.sort((a, b) => {
      if (a === 2 || b === 2) throw new Error("cannot compare 2");
      return a - b;
    });
    return items.join(",");
  });
  out.push(`items ${items.join(",")}`);
  run("sort ok", () => [3, 1, 2].sort((a, b) => strict(a * 2) - strict(b * 2)).join(","));
  run("applyAll", () => exApplyAll([2, 4], strict).join(","));
  run("applyAll odd", () => exApplyAll([2, 5], (x) => strict(x) + 1).join(","));
  run("twice", () => String(exTwice(strict, 8)));
  run("twice odd", () => String(exTwice(strict, 9)));
  run("applyAll safe", () => exApplyAll([1, 2], (x) => x * 10).join(","));
  const shout = (t: string): string => {
    if (t === "") throw new Error("empty text");
    return t.toUpperCase();
  };
  run("forward", () => exForward(["a", "b"], shout));
  run("forward empty", () => exForward(["a", "", "c"], shout));
  const v = new ExValidator();
  v.add({ name: "positive", test: (x) => x > 0 });
  v.add({ name: "even", test: (x) => strict(x) >= 0 });
  run("rules", () => v.run(4));
  run("rules odd", () => v.run(3));
  return out;
}

class ExLog {
  lines: string[] = [];
  add(line: string) {
    this.lines.push(line);
  }
}

function exWithFinally(mode: string, out: ExLog): string {
  try {
    if (mode === "return") return "from try";
    if (mode === "throw") throw new Error("from try");
    out.add("try ran");
  } catch (e) {
    if (mode === "throw") return `from catch (${e instanceof Error ? e.message : ""})`;
  } finally {
    out.add(`finally ${mode}`);
  }
  return "after";
}

function exFinallyOverrides(): number {
  try {
    return 1;
  } finally {
    return 2;
  }
}

function exNoCatch(out: ExLog, fail: boolean): number {
  try {
    if (fail) throw new Error("no catch");
    return 10;
  } finally {
    out.add(`cleanup ${fail}`);
  }
}

function exNested(out: ExLog): string {
  try {
    try {
      throw new Error("deep");
    } finally {
      out.add("inner finally");
    }
  } catch (e) {
    out.add(`outer caught ${e instanceof Error ? e.message : ""}`);
    return "returned from catch";
  } finally {
    out.add("outer finally");
  }
}

function exThrowInCatch(out: ExLog): string {
  try {
    try {
      throw new Error("first");
    } catch (e) {
      throw new Error(`second after ${e instanceof Error ? e.message : ""}`);
    } finally {
      out.add("finally after catch threw");
    }
  } catch (e) {
    return e instanceof Error ? e.message : "";
  }
}

export function finallyPaths(): string[] {
  const out = new ExLog();
  out.add(exWithFinally("return", out));
  out.add(exWithFinally("throw", out));
  out.add(exWithFinally("normal", out));
  out.add(`override ${exFinallyOverrides()}`);
  try {
    out.add(`noCatch ${exNoCatch(out, false)}`);
    exNoCatch(out, true);
  } catch (e) {
    out.add(`noCatch threw ${e instanceof Error ? e.message : ""}`);
  }
  out.add(exNested(out));
  out.add(exThrowInCatch(out));
  // break and continue out of try and catch, through finally, in loops.
  const steps: string[] = [];
  for (const i of [1, 2, 3, 4, 5]) {
    try {
      if (i === 2) continue;
      if (i === 4) throw new Error("four");
      if (i === 5) break;
      steps.push(`t${i}`);
    } catch {
      steps.push("c4");
      continue;
    } finally {
      steps.push(`f${i}`);
    }
    steps.push(`end${i}`);
  }
  out.add(steps.join(" "));
  let k = 0;
  const loop: string[] = [];
  while (k < 10) {
    k++;
    try {
      if (k % 3 === 0) continue;
      if (k > 7) break;
      loop.push(String(k));
    } finally {
      loop.push("f");
    }
  }
  out.add(`${loop.join("")} k=${k}`);
  for (let i = 0; i < 3; i++) {
    try {
      if (i === 1) continue;
      out.add(`range ${i}`);
    } finally {
      out.add(`range finally ${i}`);
    }
  }
  // A `continue` in a finally block discards the error the try block threw.
  function firstQuiet(): number {
    for (const x of [1, 2]) {
      try {
        if (x === 1) throw new Error("x1");
      } finally {
        if (x === 1) continue;
      }
      return x * 100;
    }
    return -1;
  }
  try {
    out.add(`found ${firstQuiet()}`);
  } catch {
    out.add("not found");
  }
  return out.lines;
}

interface ExParser {
  parse(text: string): number;
}

class ExFixedParser implements ExParser {
  parse(text: string): number {
    return text === "" ? 0 : 7;
  }
}

class ExConfig {
  static current = "";
  static get mode(): string {
    if (ExConfig.current === "") throw new Error("no mode set");
    return ExConfig.current;
  }
  get size(): number {
    throw new Error("size unknown");
  }
}

function exFirstOf<T>(xs: T[], test: (x: T) => boolean): T {
  for (const x of xs) if (test(x)) return x;
  throw new Error(`none of ${xs.length} matched`);
}

class ExJob {
  done = 0;
  constructor(private readonly onStep: (n: number) => void) {}
  run(count: number) {
    for (let i = 0; i < count; i++) {
      this.onStep(i);
      this.done++;
    }
  }
}

function exClassify(n: number): string {
  try {
    switch (n) {
      case 1:
        return "one";
      case 2:
        throw new Error("two is bad");
      case 9:
        break;
      default:
        return "small";
    }
    return "big";
  } finally {
    ExConfig.current = `classified ${n}`;
  }
}

export function moreThrows(): string[] {
  const out: string[] = [];
  const strict: ExParser = {
    parse(text: string): number {
      const n = Number(text);
      if (Number.isNaN(n)) throw new Error(`bad number ${text}`);
      return n;
    },
  };
  const loose: ExParser = { parse: (text: string) => text.length };
  for (const p of [strict, loose, new ExFixedParser()]) {
    try {
      out.push(`parsed ${p.parse("12")} ${p.parse("x")}`);
    } catch (e) {
      out.push(`parser threw ${e instanceof Error ? e.message : ""}`);
    }
  }
  try {
    out.push(ExConfig.mode);
  } catch (e) {
    out.push(`mode: ${e instanceof Error ? e.message : ""}`);
  }
  ExConfig.current = "dark";
  try {
    out.push(`mode ${ExConfig.mode}`);
    out.push(`size ${new ExConfig().size}`);
  } catch (e) {
    out.push(`config: ${e instanceof Error ? e.message : ""}`);
  }
  try {
    out.push(`first ${exFirstOf(["a", "bb", "ccc"], (s) => s.length > 1)}`);
    out.push(`first ${exFirstOf([1, 2], (n) => n > 5)}`);
  } catch (e) {
    out.push(`firstOf: ${e instanceof Error ? e.message : ""}`);
  }
  const task = new ExJob((n) => {
    if (n === 2) throw new Error(`step ${n} failed`);
    out.push(`step ${n}`);
  });
  try {
    task.run(4);
  } catch (e) {
    out.push(`task: ${e instanceof Error ? e.message : ""} after ${task.done}`);
  }
  for (const n of [1, 2, 3, 9]) {
    try {
      out.push(`${n} is ${exClassify(n)} (${ExConfig.current})`);
    } catch (e) {
      out.push(`${n} threw ${e instanceof Error ? e.message : ""} (${ExConfig.current})`);
    }
  }
  // break and continue out of a try block without finally; a local function called before its declaration.
  const kept: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    try {
      if (i === 1) continue;
      if (i === 4) break;
      kept.push(String(risky(i)));
    } catch {
      kept.push("x");
    }
  }
  out.push(`kept ${kept.join(",")}`);
  function risky(i: number): number {
    if (i === 2) throw new Error("two");
    return i * 10;
  }
  // An optional callback that can throw.
  const notify = (message: string, onError?: (m: string) => void): string => {
    if (message === "") {
      if (onError) onError("empty message");
      return "skipped";
    }
    return `sent ${message}`;
  };
  const strictly = (m: string) => {
    throw new Error(`refused: ${m}`);
  };
  try {
    out.push(notify("hi", strictly));
    out.push(notify("", undefined));
    // A variable holding a function that doesn't throw, given where one may.
    let quiet: ((m: string) => void) | undefined = undefined;
    if (out.length > 0) quiet = (m: string) => kept.push(`quiet ${m}`);
    out.push(`${notify("", quiet)} ${kept.at(-1) ?? ""}`);
    out.push(notify("", strictly));
  } catch (e) {
    out.push(`notify: ${e instanceof Error ? e.message : ""}`);
  }
  // A try statement in a closure, returning from it.
  const safeLength = (text: string): number => {
    try {
      if (text === "boom") throw new Error("boom");
      return text.length;
    } catch {
      return -1;
    } finally {
      kept.push("closure finally");
    }
  };
  out.push(`lengths ${safeLength("abc")} ${safeLength("boom")} ${kept.length}`);
  return out;
}
