// Generators (`function*`): every line is something a generator computes; bun is the reference.
// Top-level names start with Gn / gn (one native namespace with the other checks).

class GnLog {
  lines: string[] = [];
  add(s: string) {
    this.lines.push(s);
  }
}

function* gnCount(from: number, to: number) {
  for (let i = from; i <= to; i++) yield i;
}

function* gnNaturals() {
  let i = 0;
  while (true) yield i++;
}

function* gnWithReturn(n: number): Generator<number, string, unknown> {
  for (let i = 0; i < n; i++) yield i * 10;
  return `done after ${n}`;
}

function* gnEmpty(): Generator<string, void, unknown> {
  // yields nothing
}

function* gnUndefined(): Generator<number | undefined, void, unknown> {
  yield 1;
  yield;
  yield 3;
}

export function gnBasics(): string[] {
  const out: string[] = [];
  const xs: number[] = [];
  for (const x of gnCount(1, 4)) xs.push(x);
  out.push(`for-of ${xs.join(",")}`);
  out.push(`spread ${[...gnCount(3, 6)].join(",")}`);
  out.push(`spread mixed ${[0, ...gnCount(1, 2), 9].join(",")}`);
  out.push(`Array.from ${Array.from(gnCount(5, 7)).join(",")}`);
  const [a, b] = gnNaturals();
  out.push(`destructure ${a ?? -1} ${b ?? -1}`);
  const [first, ...rest] = gnCount(1, 5);
  out.push(`rest ${first ?? -1} ${rest.join(",")}`);
  const [p, q, missing] = gnCount(1, 2);
  out.push(`short ${p ?? -1} ${q ?? -1} ${missing === undefined ? "undefined" : missing}`);
  let sum = 0;
  for (const n of gnNaturals()) {
    if (n > 100) break;
    sum += n;
  }
  out.push(`infinite until 100: ${sum}`);
  const gen = gnWithReturn(2);
  const r1 = gen.next();
  out.push(`next ${r1.done} ${r1.done ? "" : r1.value}`);
  const r2 = gen.next();
  out.push(`next ${r2.done} ${r2.done ? "" : r2.value}`);
  const r3 = gen.next();
  out.push(`next ${r3.done} ${r3.done ? r3.value : ""}`);
  const r4 = gen.next();
  out.push(`after ${r4.done} ${r4.done ? `${r4.value ?? "undefined"}` : ""}`);
  out.push(`empty ${[...gnEmpty()].length} ${gnEmpty().next().done}`);
  const us: string[] = [];
  for (const u of gnUndefined()) us.push(u === undefined ? "undefined" : `${u}`);
  out.push(`yield without value ${us.join(",")}`);
  const e = gnEmpty().next();
  out.push(`empty next done=${e.done}`);
  return out;
}

function* gnLazy(log: GnLog, name: string) {
  log.add(`${name}: start`);
  yield 1;
  log.add(`${name}: after 1`);
  yield 2;
  log.add(`${name}: end`);
}

export function gnLaziness(): string[] {
  const log = new GnLog();
  const g = gnLazy(log, "a");
  log.add("called");
  const r = g.next();
  log.add(`got ${r.done ? "done" : r.value}`);
  for (const v of g) log.add(`loop ${v}`);
  log.add(`again ${g.next().done}`);
  const h = gnLazy(log, "b");
  const closed = h.return();
  log.add(`return before start: ${closed.done}`);
  log.add(`then ${h.next().done}`);
  return log.lines;
}

function* gnGuarded(log: GnLog, n: number) {
  try {
    for (let i = 0; i < n; i++) {
      log.add(`yield ${i}`);
      yield i;
    }
  } finally {
    log.add("finally");
  }
}

function* gnCleanupYields(log: GnLog): Generator<number, number, unknown> {
  try {
    yield 1;
    yield 2;
  } finally {
    log.add("cleanup");
    yield 99;
    log.add("cleanup done");
  }
  return 7;
}

function* gnRelay(log: GnLog) {
  for (const v of gnGuarded(log, 5)) yield v + 0.5;
}

function* gnJumps(log: GnLog) {
  for (let i = 0; i < 4; i++) {
    try {
      try {
        yield i;
        if (i === 2) break;
        if (i === 0) continue;
        log.add(`body ${i}`);
      } finally {
        log.add(`inner ${i}`);
      }
    } finally {
      log.add(`outer ${i}`);
    }
  }
  log.add("after loop");
}

function* gnReturnThrough(log: GnLog): Generator<number, string, unknown> {
  try {
    try {
      yield 1;
      return "early";
    } finally {
      log.add("f1");
    }
  } finally {
    log.add("f2");
  }
}

function gnFindFirst(log: GnLog, over: number): number {
  for (const v of gnGuarded(log, 10)) {
    if (v > over) return v;
  }
  return -1;
}

export function gnEarlyExit(): string[] {
  const log = new GnLog();
  for (const v of gnGuarded(log, 5)) {
    if (v === 1) break;
    log.add(`body ${v}`);
  }
  log.add("after break");
  log.add(`found ${gnFindFirst(log, 2)}`);
  const [x] = gnGuarded(log, 3);
  log.add(`destructured ${x ?? -1}`);
  const g = gnCleanupYields(log);
  log.add(`first ${g.next().done}`);
  const r = g.return(5);
  log.add(`return() gave ${r.done} ${r.done ? r.value : r.value}`);
  const r2 = g.next();
  log.add(`then ${r2.done} ${r2.done ? r2.value : r2.value}`);
  log.add(`then ${g.next().done}`);
  const all = [...gnGuarded(log, 2)];
  log.add(`all ${all.join(",")}`);
  for (const v of gnRelay(log)) {
    log.add(`relay ${v}`);
    if (v > 1) break;
  }
  log.add(`jumps ${[...gnJumps(log)].join(",")}`);
  const j = gnJumps(log);
  j.next();
  j.next();
  log.add(`jumps return() ${j.return().done}`);
  const rt = gnReturnThrough(log);
  const a1 = rt.next();
  const a2 = rt.next();
  log.add(`return through ${a1.done} ${a2.done} ${a2.done ? a2.value : ""}`);
  const rt2 = gnReturnThrough(log);
  rt2.next();
  const a3 = rt2.return("stopped");
  log.add(`return() through ${a3.done} ${a3.done ? a3.value : ""}`);
  return log.lines;
}

// Its own shape (TReturn boolean): a shape some generator of which can throw makes every consumer of it throwing natively.
function* gnFails(log: GnLog, at: number): Generator<number, boolean, unknown> {
  for (let i = 0; i < 5; i++) {
    if (i === at) throw new Error(`failed at ${i}`);
    log.add(`yield ${i}`);
    yield i;
  }
  return true;
}

function* gnCatches(log: GnLog) {
  try {
    yield 1;
    throw new Error("inside");
  } catch (e) {
    log.add(`caught ${e instanceof Error ? e.message : ""}`);
    yield 2;
  } finally {
    log.add("finally");
  }
  yield 3;
}

function* gnCatchesConsumer(log: GnLog) {
  try {
    for (const v of gnFails(log, 1)) yield v * 100;
  } catch (e) {
    log.add(`outer caught ${e instanceof Error ? e.message : ""}`);
  }
  yield -1;
}

export function gnErrors(): string[] {
  const log = new GnLog();
  const g = gnFails(log, 2);
  try {
    for (const v of g) log.add(`got ${v}`);
  } catch (e) {
    log.add(`error ${e instanceof Error ? e.message : ""}`);
  }
  try {
    log.add(`done after throw: ${g.next().done}`);
  } catch {
    log.add("not reached");
  }
  log.add(`catches ${[...gnCatches(log)].join(",")}`);
  log.add(`consumer ${[...gnCatchesConsumer(log)].join(",")}`);
  const h = gnFails(log, 0);
  try {
    h.next();
    log.add("not reached");
  } catch (e) {
    log.add(`next threw ${e instanceof Error ? e.message : ""}`);
  }
  return log.lines;
}

function* gnInner(log: GnLog): Generator<number, string, unknown> {
  try {
    yield 1;
    yield 2;
  } finally {
    log.add("inner finally");
  }
  return "inner result";
}

function* gnOuter(log: GnLog) {
  yield 0;
  const r = yield* gnInner(log);
  log.add(`yield* gave ${r}`);
  yield* [10, 20];
  yield* gnCount(30, 31);
}

export function gnDelegation(): string[] {
  const log = new GnLog();
  log.add(`all ${[...gnOuter(log)].join(",")}`);
  for (const v of gnOuter(log)) {
    log.add(`v ${v}`);
    if (v === 1) break;
  }
  return log.lines;
}

function* gnAccumulate(): Generator<number, number, number> {
  let total = 0;
  while (true) {
    const x = yield total;
    if (x < 0) return total;
    total += x;
  }
}

function* gnEcho(): Generator<string, void, string> {
  let last = "start";
  for (let i = 0; i < 3; i++) {
    last = yield `echo ${last}`;
  }
}

export function gnSend(): string[] {
  const out: string[] = [];
  const acc = gnAccumulate();
  acc.next();
  for (const n of [5, 10, 20]) {
    const r = acc.next(n);
    out.push(`total ${r.done ? "done" : r.value}`);
  }
  const end = acc.next(-1);
  out.push(`end ${end.done} ${end.done ? end.value : ""}`);
  const echo = gnEcho();
  out.push(`${echo.next().value ?? "-"}`);
  out.push(`${echo.next("a").value ?? "-"}`);
  out.push(`${echo.next("b").value ?? "-"}`);
  out.push(`${echo.next("c").done}`);
  return out;
}

class GnTree {
  constructor(
    readonly value: number,
    readonly children: GnTree[],
  ) {}
  *walk(): Generator<number, void, unknown> {
    yield this.value;
    for (const c of this.children) yield* c.walk();
  }
  *pairs(): Generator<string, void, unknown> {
    let i = 0;
    for (const v of this.walk()) {
      yield `${i}:${v}`;
      i++;
    }
  }
}

function* gnClosures(): Generator<() => number, void, unknown> {
  for (let i = 0; i < 3; i++) {
    const doubled = i * 2;
    yield () => doubled + i;
  }
  let shared = 1;
  const read = () => shared;
  yield read;
  shared = 50;
  yield read;
}

function gnMakeRange(step: number) {
  const scale = step * 10;
  // A generator function expression reading a local of its function.
  const range = function* (n: number) {
    for (let i = 0; i < n; i++) yield i * scale;
  };
  return [...range(3)];
}

function* gnSwitchy(xs: string[]) {
  for (const x of xs) {
    if (x === "skip") continue;
    switch (x) {
      case "a":
        yield 1;
        break;
      case "end":
        return;
      default:
        yield 0;
    }
    yield 9;
  }
}

function* gnNested(n: number) {
  let count = 0;
  for (let i = 0; i < n; i++) {
    let j = 0;
    while (j < i) {
      count++;
      yield `${i}.${j}`;
      j++;
    }
  }
  return count;
}

export function gnMore(): string[] {
  const out: string[] = [];
  const tree = new GnTree(1, [new GnTree(2, [new GnTree(3, [])]), new GnTree(4, [])]);
  out.push(`tree ${[...tree.walk()].join(",")}`);
  out.push(`pairs ${[...tree.pairs()].join(" ")}`);
  out.push(`closures ${[...gnClosures()].map((f) => f()).join(",")}`);
  out.push(`nested fn ${gnMakeRange(2).join(",")}`);
  out.push(`switch ${[...gnSwitchy(["a", "skip", "b", "end", "a"])].join(",")}`);
  out.push(`nested loops ${[...gnNested(4)].join(" ")}`);
  const g = gnCount(1, 3);
  const h = gnCount(1, 3);
  out.push(`independent ${g.next().value ?? -1} ${g.next().value ?? -1} ${h.next().value ?? -1}`);
  return out;
}
