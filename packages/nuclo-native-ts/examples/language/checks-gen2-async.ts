// Async generators (`async function*`), `for await`, and their job order: every check logs events as they happen, a
// ticker interleaves its own microtasks, so the order of the lines proves the microtask order matches bun's.
// Each returns a PrLog whose last line is "done". Top-level names start with G2a / g2a.
import { setTimeout } from "../../src/index.ts";
import { PrLog } from "./checks-promises.ts";

async function g2aTicker(log: PrLog, n: number): Promise<void> {
  for (let i = 0; i < n; i++) {
    log.push(`tick ${i}`);
    await null;
  }
}

function g2aLater(value: number): Promise<number> {
  return Promise.resolve(value);
}

async function* g2aCount(log: PrLog, n: number): AsyncGenerator<number, string, unknown> {
  log.push("gen start");
  for (let i = 0; i < n; i++) {
    const v = await g2aLater(i * 10);
    log.push(`gen yield ${v}`);
    yield v + 1;
  }
  log.push("gen end");
  return "count over";
}

async function g2aConsume(log: PrLog): Promise<void> {
  let total = 0;
  for await (const x of g2aCount(log, 3)) {
    log.push(`got ${x}`);
    total += x;
  }
  log.push(`total ${total}`);
}

export function g2aOrder(): PrLog {
  const log = new PrLog();
  const done = g2aConsume(log);
  g2aTicker(log, 12);
  done.then(() => {
    log.push("done");
  });
  return log;
}

async function* g2aSteps(log: PrLog): AsyncGenerator<string, number | undefined, string> {
  try {
    const a = yield "first";
    log.push(`gen got ${a}`);
    const b = yield `second after ${a}`;
    log.push(`gen got ${b}`);
    return 7;
  } finally {
    log.push("gen finally");
  }
}

export function g2aQueue(): PrLog {
  const log = new PrLog();
  const it = g2aSteps(log);
  // Three requests at once: the generator runs them in order.
  const show = (tag: string, r: IteratorResult<string, number | undefined>) => log.push(r.done ? `${tag} done ${r.value}` : `${tag} value ${r.value}`);
  it.next("ignored").then((r) => show("n1", r));
  it.next("A").then((r) => show("n2", r));
  it.next("B").then((r) => show("n3", r));
  it.next("C").then((r) => show("n4", r));
  g2aTicker(log, 8);
  // return() and throw() of one that never started: it is done at once.
  const fresh = g2aSteps(log);
  fresh.return(5).then((r) => show("fresh return", r));
  fresh.next("x").then((r) => show("fresh next", r));
  const thrown = g2aSteps(log);
  thrown.throw(new Error("boom")).then(
    () => log.push("thrown resolved?"),
    (e: unknown) => log.push(`thrown rejected ${e instanceof Error ? e.message : "?"}`),
  );
  setTimeout(() => log.push("done"), 5);
  return log;
}

async function* g2aGuarded(log: PrLog): AsyncGenerator<number, string | undefined, unknown> {
  let i = 0;
  try {
    while (true) {
      try {
        yield i++;
      } catch (e) {
        log.push(`gen caught ${e instanceof Error ? e.message : "?"}`);
        await null;
        log.push("gen after await in catch");
      }
    }
  } finally {
    log.push("gen cleanup start");
    await g2aLater(0);
    log.push("gen cleanup end");
  }
}

async function g2aControl(log: PrLog): Promise<void> {
  const it = g2aGuarded(log);
  const show = (tag: string, r: IteratorResult<number, string | undefined>) => log.push(r.done ? `${tag} done ${r.value}` : `${tag} value ${r.value}`);
  show("a", await it.next());
  show("b", await it.throw(new Error("e1")));
  show("c", await it.next());
  // return() while suspended: the finally awaits, then it is done with the value given.
  show("d", await it.return("stopped"));
  show("e", await it.next());
  // Leaving a for await early calls return(): the finally runs before the loop's code after it.
  for await (const x of g2aGuarded(log)) {
    log.push(`loop ${x}`);
    if (x === 1) break;
  }
  log.push("after break");
  try {
    for await (const x of g2aGuarded(log)) {
      log.push(`loop2 ${x}`);
      throw new Error("in body");
    }
  } catch (e) {
    log.push(`caught ${e instanceof Error ? e.message : "?"}`);
  }
}

export function g2aControlFlow(): PrLog {
  const log = new PrLog();
  const p = g2aControl(log);
  g2aTicker(log, 30);
  p.then(
    () => log.push("done"),
    (e: unknown) => {
      log.push(`failed ${e instanceof Error ? e.message : "?"}`);
      log.push("done");
    },
  );
  return log;
}

async function* g2aFailing(log: PrLog): AsyncGenerator<string, void, unknown> {
  yield "ok";
  await null;
  log.push("about to fail");
  throw new Error("gen failed");
}

async function g2aArrays(log: PrLog): Promise<void> {
  const ps: Promise<number>[] = [g2aLater(1), Promise.resolve(2), new Promise<number>((r) => setTimeout(() => r(3), 1))];
  for await (const v of ps) log.push(`promise item ${v}`);
  for await (const v of [10, 20]) log.push(`plain item ${v}`);
  for await (const v of [g2aLater(5), g2aLater(6), g2aLater(7)]) {
    log.push(`early ${v}`);
    if (v === 6) break;
  }
  log.push("arrays end");
  try {
    for await (const s of g2aFailing(log)) log.push(`failing ${s}`);
  } catch (e) {
    log.push(`failing threw ${e instanceof Error ? e.message : "?"}`);
  }
  try {
    const bad: Promise<number>[] = [g2aLater(1), Promise.reject(new Error("rejected item"))];
    for await (const v of bad) log.push(`bad item ${v}`);
  } catch (e) {
    log.push(`bad threw ${e instanceof Error ? e.message : "?"}`);
  }
}

export function g2aForAwait(): PrLog {
  const log = new PrLog();
  const p = g2aArrays(log);
  g2aTicker(log, 20);
  p.then(() => log.push("done"));
  return log;
}

class G2aFeed {
  source: AsyncGenerator<string, void, unknown>;
  seen: string[] = [];
  constructor(readonly words: string[]) {
    this.source = this.stream();
  }
  async *stream(): AsyncGenerator<string, void, unknown> {
    for (const w of this.words) {
      yield await Promise.resolve(w.toUpperCase());
      yield `${w.length}`;
    }
  }
  async pull(n: number): Promise<string> {
    for (let i = 0; i < n; i++) {
      const r = await this.source.next();
      if (r.done) break;
      this.seen.push(r.value);
    }
    return this.seen.join(" ");
  }
}

async function g2aFields(log: PrLog): Promise<void> {
  const feed = new G2aFeed(["ab", "cde"]);
  log.push(`pulled ${await feed.pull(3)}`);
  log.push(`pulled ${await feed.pull(5)}`);
  // Two generators interleaved by hand.
  const a = g2aCount(log, 2);
  const b = g2aCount(log, 2);
  const ra = a.next();
  const rb = b.next();
  const [x, y] = await Promise.all([ra, rb]);
  log.push(`pair ${x.done ? "-" : x.value} ${y.done ? "-" : y.value}`);
  const last = await a.return("early");
  log.push(`a returned ${last.done ? last.value : "not done"}`);
}

export function g2aObjects(): PrLog {
  const log = new PrLog();
  const p = g2aFields(log);
  g2aTicker(log, 16);
  p.then(() => log.push("done"));
  return log;
}
