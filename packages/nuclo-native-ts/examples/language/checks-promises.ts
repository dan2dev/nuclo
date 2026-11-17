// Promises: values, `new Promise`, then / catch / finally, the combinators, and JavaScript's job order
// (microtasks after the synchronous code, before timers, in FIFO order; `await` resumes as a microtask).
// Each check starts its async work and returns its log (an object: the lines arrive later); its last line is "done".
import { type Double, setTimeout } from "../../src/index.ts";

export class PrLog {
  lines: string[] = [];
  push(line: string) {
    this.lines.push(line);
  }
}

function prWait(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

async function prDouble(n: number): Promise<number> {
  await prWait(1);
  return n * 2;
}

async function prFail(message: string): Promise<number> {
  await null;
  throw new Error(message);
}

async function prStep(log: PrLog, name: string, turns: number): Promise<string> {
  for (let i = 0; i < turns; i++) {
    log.push(`${name} ${i}`);
    await undefined;
  }
  return `${name} finished`;
}

function prLater(log: PrLog, ms: number, check: () => Promise<void>) {
  setTimeout(() => {
    check().then(
      () => log.push("done"),
      (e: Error) => log.push(`failed: ${e.message}`),
    );
  }, ms);
}

/** Synchronous code, then microtasks (FIFO, then-chains interleaving with awaits), then timers. */
export function promiseOrder(): PrLog {
  const log = new PrLog();
  log.push("sync start");
  setTimeout(() => log.push("timeout 0"), 0);
  Promise.resolve(1)
    .then((v) => {
      log.push(`then a${v}`);
      return v + 1;
    })
    .then((v) => {
      log.push(`then a${v}`);
    });
  Promise.resolve(10).then((v) => log.push(`then b${v}`));
  const first = prStep(log, "x", 3);
  const second = prStep(log, "y", 2);
  first.then((s) => log.push(s));
  second.then((s) => log.push(s));
  // An async function's body runs synchronously up to its first await.
  const sync = (async () => {
    log.push("arrow body");
    await null;
    log.push("arrow resumed");
  })();
  sync.then(() => log.push("arrow done"));
  setTimeout(() => {
    log.push("timeout 1");
    Promise.resolve(0).then(() => log.push("microtask in timeout"));
  }, 1);
  setTimeout(() => log.push("timeout 2"), 2);
  log.push("sync end");
  prLater(log, 10, async () => {
    // `return promise` from an async function takes two more jobs than `return value`.
    const order: string[] = [];
    const direct = async (): Promise<string> => "direct";
    const adopted = async (): Promise<string> => direct();
    adopted().then((v) => order.push(`${v} via adopted`));
    direct().then((v) => order.push(v));
    Promise.resolve("plain").then((v) => order.push(v));
    await prWait(1);
    log.push(order.join(", "));
  });
  return log;
}

interface PrJob {
  name: string;
  result: Promise<number>;
}

class PrCounter {
  count = 0;
  label: string;
  constructor(label: string) {
    this.label = label;
  }
  async add(n: number): Promise<number> {
    await prWait(1);
    this.count += n;
    return this.count;
  }
  async describe(): Promise<string> {
    const total = await this.add(5);
    return `${this.label} ${total}`;
  }
}

async function prSum(ps: Promise<number>[]): Promise<number> {
  let total = 0;
  for (const p of ps) {
    const v = await p;
    total += v;
  }
  return total;
}

/** Promises as values: kept, awaited later and twice, in arrays and fields, as parameters; async arrows and methods. */
export function promiseValues(): PrLog {
  const log = new PrLog();
  prLater(log, 0, async () => {
    const p = prDouble(4);
    log.push("started");
    const a = await p;
    const b = await p;
    log.push(`twice ${a} ${b}`);
    const ps: Promise<number>[] = [prDouble(1), prDouble(2), Promise.resolve(3)];
    log.push(`sum ${await prSum(ps)}`);
    const jobs: PrJob[] = [
      { name: "one", result: prDouble(10) },
      { name: "two", result: prDouble(20) },
    ];
    for (const job of jobs) {
      const value = await job.result;
      log.push(`${job.name} ${value}`);
    }
    const triple = async (n: number): Promise<number> => (await prDouble(n)) + n;
    log.push(`arrow ${await triple(3)}`);
    const counter = new PrCounter("counter");
    const both = [counter.add(1), counter.add(2)];
    log.push(`adds ${await both[0]!} ${await both[1]!}`);
    log.push(await counter.describe());
    const label = await Promise.resolve("text");
    const flag = await Promise.resolve(true);
    log.push(`${label} ${flag} ${(await prDouble(2.5)) / 2}`);
  });
  return log;
}

/** `new Promise(executor)`: resolve later or at once, only the first settle counts, reject, an executor that throws. */
export function newPromise(): PrLog {
  const log = new PrLog();
  prLater(log, 0, async () => {
    const later = new Promise<string>((resolve) => {
      setTimeout(() => resolve("from a timer"), 2);
    });
    log.push(await later);
    const twice = new Promise<number>((resolve, reject) => {
      resolve(1);
      resolve(2);
      reject(new Error("ignored"));
    });
    log.push(`first wins ${await twice}`);
    const rejected = new Promise<number>((resolve, reject) => {
      reject(new Error("no"));
      resolve(3);
    });
    try {
      await rejected;
      log.push("not reached");
    } catch (e) {
      log.push(`rejected: ${e}`);
    }
    const throwing = new Promise<number>(() => {
      throw new Error("executor threw");
    });
    try {
      log.push(`${await throwing}`);
    } catch (e) {
      log.push(`caught ${e instanceof Error ? e.message : "?"}`);
    }
    // A number a promise holds is a Double natively: a variable keeping `resolve` says so.
    let settle: ((v: Double) => void) | null = null;
    const outside = new Promise<number>((resolve) => {
      settle = resolve;
    });
    setTimeout(() => settle?.(42), 1);
    log.push(`resolved from outside ${await outside}`);
    const order: string[] = [];
    const sync = new Promise<void>((resolve) => {
      order.push("executor");
      resolve();
    });
    order.push("after new");
    await sync;
    order.push("awaited");
    log.push(order.join(", "));
  });
  return log;
}

/** then / catch / finally, chaining, a promise returned from a callback, Promise.resolve / reject. */
export function thenChains(): PrLog {
  const log = new PrLog();
  prLater(log, 0, async () => {
    const text = await prDouble(5)
      .then((n) => n + 1)
      .then((n) => `value ${n}`);
    log.push(text);
    const adopted = await Promise.resolve(2).then((n) => prDouble(n));
    log.push(`adopted ${adopted}`);
    const recovered = await prFail("boom").catch((e: Error) => {
      log.push(`catch ${e.message}`);
      return -1;
    });
    log.push(`recovered ${recovered}`);
    const both = await prFail("bad").then(
      (n) => `ok ${n}`,
      (e: Error) => `handled ${e.message}`,
    );
    log.push(both);
    const skipped = await Promise.reject<number>(new Error("early"))
      .then((n) => n * 100)
      .catch(() => 7);
    log.push(`skipped then ${skipped}`);
    const kept = await prDouble(3).finally(() => log.push("finally ran"));
    log.push(`finally keeps ${kept}`);
    try {
      await prFail("still").finally(() => log.push("finally on rejection"));
    } catch (e) {
      log.push(`after finally: ${e}`);
    }
    try {
      await prDouble(1).finally(() => {
        throw new Error("from finally");
      });
    } catch (e) {
      log.push(`finally threw: ${e}`);
    }
    const thrown = await Promise.resolve(1)
      .then((n): number => {
        if (n > 0) throw new Error(`then threw ${n}`);
        return n;
      })
      .catch((e: Error) => e.message.length);
    log.push(`then threw length ${thrown}`);
    const same = Promise.resolve(9);
    log.push(`resolve keeps the promise ${Promise.resolve(same) === same}`);
    // The callbacks run in the order they were attached, each once, after the promise settles.
    const order: string[] = [];
    const shared = prDouble(1);
    shared.then(() => order.push("first"));
    shared.then(() => order.push("second"));
    shared
      .catch(() => {
        order.push("never");
        return -1;
      })
      .then(() => order.push("third"));
    order.push("attached");
    await shared;
    await null;
    log.push(order.join(", "));
  });
  return log;
}

/** Promise.all / allSettled / race / any. */
export function combinators(): PrLog {
  const log = new PrLog();
  prLater(log, 0, async () => {
    const all = await Promise.all([prDouble(3), Promise.resolve(1), prDouble(2)]);
    log.push(`all ${all.join(" ")}`);
    const none = await Promise.all<number>([]);
    log.push(`all of none ${none.length}`);
    try {
      await Promise.all([prDouble(1), prFail("first failure"), prFail("second failure")]);
    } catch (e) {
      log.push(`all rejected: ${e}`);
    }
    const settled = await Promise.allSettled([prDouble(4), prFail("nope")]);
    for (const r of settled) {
      if (r.status === "fulfilled") log.push(`fulfilled ${r.value}`);
      else log.push(`rejected ${r.reason}`);
    }
    const slow = new Promise<string>((resolve) => setTimeout(() => resolve("slow"), 5));
    const fast = new Promise<string>((resolve) => setTimeout(() => resolve("fast"), 1));
    log.push(`race ${await Promise.race([slow, fast])}`);
    const lost = new Promise<string>((_, reject) => setTimeout(() => reject(new Error("lost")), 1));
    // Far later than `lost` even on a slow device (`slow` above may already be due).
    const later = new Promise<string>((resolve) => setTimeout(() => resolve("later"), 200));
    try {
      await Promise.race([lost, later]);
    } catch (e) {
      log.push(`race rejected: ${e}`);
    }
    log.push(`any ${await Promise.any([prFail("a"), prDouble(6), prDouble(7)])}`);
    try {
      await Promise.any([prFail("x"), prFail("y")]);
    } catch (e) {
      // Only the kind: an AggregateError's message is the engine's own wording.
      log.push(`any rejected: ${String(e).split(":")[0] ?? ""}`);
    }
  });
  return log;
}

async function prRisky(n: number): Promise<string> {
  if (n < 0) throw new Error(`negative ${n}`);
  await prWait(1);
  if (n === 0) throw new Error("zero");
  return `ok ${n}`;
}

/** Errors through awaits: try / catch / finally around awaits, loops, an error before the first await. */
export function asyncErrors(): PrLog {
  const log = new PrLog();
  prLater(log, 0, async () => {
    // An unannotated rejection reason (`any` in TypeScript's lib) is the Error.
    log.push(await new Promise<string>((_, reject) => reject(new Error("plain"))).catch((e) => `caught ${e}`));
    for (const n of [1, 0, -1]) {
      try {
        log.push(await prRisky(n));
      } catch (e) {
        log.push(`caught ${e}`);
      } finally {
        await null;
        log.push(`finally ${n}`);
      }
    }
    // The error of an async function rejects its promise, even before the first await.
    const early = prRisky(-5);
    log.push("call returned");
    log.push(await early.catch((e: Error) => `late catch ${e.message}`));
    let attempts = 0;
    while (true) {
      attempts++;
      try {
        await prRisky(attempts - 2);
        break;
      } catch {
        if (attempts > 5) throw new Error("gave up");
      }
    }
    log.push(`attempts ${attempts}`);
    const results: string[] = [];
    for (let i = 3; i > 0; i--) {
      const r = await prRisky(i).then((s) => s.toUpperCase());
      results.push(r);
      if (i === 2) continue;
      results.push("|");
    }
    log.push(results.join(""));
    switch (await prRisky(4)) {
      case "ok 4":
        log.push("switch on await");
        break;
      default:
        log.push("unexpected");
    }
    const value = await (async () => {
      try {
        return await prRisky(0);
      } catch {
        return "fallback";
      } finally {
        log.push("inner finally");
      }
    })();
    log.push(value);
  });
  return log;
}

interface PrSource {
  next(): Promise<number>;
}

class PrCountdown implements PrSource {
  constructor(private left: number) {}
  async next(): Promise<number> {
    await null;
    return this.left--;
  }
}

/** Loops whose condition awaits, do-while, a protocol's async method, an async function passed where nothing is returned. */
export function asyncLoops(): PrLog {
  const log = new PrLog();
  const tick = async () => {
    log.push("tick ran");
  };
  setTimeout(tick, 0);
  prLater(log, 2, async () => {
    const source: PrSource = new PrCountdown(3);
    const seen: number[] = [];
    while ((await source.next()) > 1) seen.push(seen.length);
    log.push(`while ${seen.join(",")}`);
    let tries = 0;
    do {
      tries++;
      await prWait(1);
    } while (tries < 3);
    log.push(`do-while ${tries}`);
    const values: string[] = [];
    for (let i = 0; i < 3; i++) {
      if (i === 1) continue;
      const tens = await Promise.resolve(i * 10);
      values.push(`${i}:${tens}`);
    }
    log.push(values.join(" "));
  });
  return log;
}
