// Generators, round 2 (sync): `yield` inside expressions, `it.throw(e)`, generators kept in fields / arrays / maps,
// generic generators, generator methods of object literals, `yield*` of any iterable. bun is the reference.
// Top-level names start with G2 / g2 (one native namespace with the other checks).

class G2Log {
  lines: string[] = [];
  add(s: string) {
    this.lines.push(s);
  }
}

function g2Id(log: G2Log, tag: string, v: number): number {
  log.add(`eval ${tag}`);
  return v;
}

function* g2Sums(log: G2Log): Generator<number, number, number> {
  // Operands left of a `yield` are evaluated before it, the call after every argument.
  const a = g2Id(log, "a", 1) + (yield 10);
  log.add(`a=${a}`);
  const b = Math.max(yield a, g2Id(log, "m", 5), yield a + 1);
  log.add(`b=${b}`);
  const t = `<${yield 20}|${g2Id(log, "t", 7)}|${yield 30}>`;
  log.add(`t=${t}`);
  if ((yield 40) > 3) log.add("big");
  else log.add("small");
  const c = (yield 50) > 0 ? yield 60 : g2Id(log, "c", 9);
  log.add(`c=${c}`);
  return (yield 70) * 2;
}

class G2Counter {
  total = 0;
  *feed(): Generator<string, void, number> {
    // `this.total` is read before the pause; the consumer changes it meanwhile.
    this.total = this.total + (yield "first");
    this.total = this.total + (yield `total ${this.total}`);
  }
}

function* g2Args(): Generator<string, string, string> {
  const parts: string[] = [];
  parts.push(yield "p1");
  parts.push((yield "p2").toUpperCase());
  const ok = (yield "q") === "yes" && (yield "q2") === "yes";
  return `${parts.join("+")} ok=${ok}`;
}

export function g2YieldExpr(): string[] {
  const log = new G2Log();
  const it = g2Sums(log);
  const sends = [0, 2, 3, 4, 5, 6, 1, 8, 9, 21];
  let r = it.next(0);
  let i = 1;
  while (!r.done) {
    log.add(`yielded ${r.value}`);
    r = it.next(sends[i++] ?? 0);
  }
  log.add(`returned ${r.value}`);
  const c = new G2Counter();
  const f = c.feed();
  log.add(`${f.next(0).value}`);
  c.total = 100;
  log.add(`${f.next(5).value}`);
  log.add(`done ${f.next(7).done} total ${c.total}`);
  const g = g2Args();
  const seen: string[] = [];
  let s = g.next("");
  const answers = ["a", "b", "yes", "no"];
  let k = 0;
  while (!s.done) {
    seen.push(s.value);
    s = g.next(answers[k++] ?? "");
  }
  log.add(`args ${seen.join(",")} -> ${s.value}`);
  return log.lines;
}

function* g2Guarded(log: G2Log): Generator<number, string, unknown> {
  let n = 0;
  try {
    while (true) {
      try {
        yield n++;
      } catch (e) {
        log.add(`inner caught ${e instanceof Error ? e.message : "?"}`);
        if (n > 2) throw new Error(`rethrown at ${n}`);
      }
    }
  } catch (e) {
    log.add(`outer caught ${e instanceof Error ? e.message : "?"}`);
    yield 100;
    return "recovered";
  } finally {
    log.add("finally");
  }
}

function* g2Plain(log: G2Log): Generator<number, void, unknown> {
  try {
    yield 1;
    yield 2;
  } finally {
    log.add("plain finally");
  }
}

function* g2Delegating(log: G2Log): Generator<number, string, unknown> {
  const inner = yield* g2Guarded(log);
  log.add(`inner returned ${inner}`);
  yield 7;
  return "outer";
}

export function g2Throw(): string[] {
  const log = new G2Log();
  const it = g2Guarded(log);
  const show = (r: IteratorResult<number, string>) => log.add(r.done ? `done ${r.value}` : `value ${r.value}`);
  show(it.next());
  show(it.throw(new Error("one")));
  show(it.throw(new Error("two")));
  show(it.throw(new Error("three")));
  show(it.next());
  log.add(`after end ${it.next().done}`);
  // Not started: it ends at once, the error comes out.
  const fresh = g2Plain(log);
  try {
    fresh.throw(new Error("early"));
  } catch (e) {
    log.add(`fresh threw ${e instanceof Error ? e.message : "?"}`);
  }
  log.add(`fresh after ${fresh.next().done}`);
  // Uncaught inside: finally runs, the error leaves, the generator is done.
  const p = g2Plain(log);
  p.next();
  try {
    p.throw(new Error("out"));
  } catch (e) {
    log.add(`plain threw ${e instanceof Error ? e.message : "?"}`);
  }
  log.add(`plain after ${p.next().done}`);
  // Through yield*: the inner generator's catch sees it.
  const d = g2Delegating(log);
  show(d.next());
  show(d.throw(new Error("deleg")));
  show(d.throw(new Error("deleg2")));
  show(d.throw(new Error("deleg3")));
  show(d.next());
  show(d.next());
  log.add(`after end ${d.next().done}`);
  return log.lines;
}
