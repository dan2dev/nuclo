// Design patterns corpus: async patterns (retry with backoff, timeout race, sequential vs parallel, async queue,
// debounce). Each check returns a log whose last line is "done".
import { setTimeout } from "../../src/index.ts";
import { PrLog } from "./checks-promises.ts";

const sleep = (ms: number): Promise<void> => new Promise<void>((resolve) => setTimeout(() => resolve(), ms));

/** A flaky operation: fails `failures` times, then succeeds. */
class FlakyService {
  calls = 0;
  constructor(private readonly failures: number) {}
  async fetch(key: string): Promise<string> {
    this.calls++;
    await sleep(1);
    if (this.calls <= this.failures) throw new Error(`503 on ${key} (call ${this.calls})`);
    return `value:${key}`;
  }
}

async function retry(op: () => Promise<string>, attempts: number, baseDelayMs: number, log: PrLog): Promise<string> {
  let lastError = new Error("no attempts");
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await op();
    } catch (e) {
      lastError = e as Error;
      const delay = baseDelayMs * 2 ** (attempt - 1);
      log.push(`attempt ${attempt} failed: ${lastError.message}; retry in ${delay}ms`);
      if (attempt < attempts) await sleep(delay);
    }
  }
  throw lastError;
}

export function retryWithBackoff(): PrLog {
  const log = new PrLog();
  const run = async () => {
    const ok = new FlakyService(2);
    const v = await retry(() => ok.fetch("user/1"), 4, 1, log);
    log.push(`got ${v} after ${ok.calls} calls`);
    const bad = new FlakyService(10);
    try {
      await retry(() => bad.fetch("user/2"), 3, 1, log);
    } catch (e) {
      log.push(`gave up: ${(e as Error).message} after ${bad.calls} calls`);
    }
  };
  run().then(
    () => log.push("done"),
    (e: Error) => log.push(`failed: ${e.message}`),
  );
  return log;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error(`${label} timed out after ${ms}ms`));
      }
    }, ms);
    p.then(
      (v) => {
        if (!settled) {
          settled = true;
          resolve(v);
        }
      },
      (e: Error) => {
        if (!settled) {
          settled = true;
          reject(e);
        }
      },
    );
  });
}

async function delayed(value: number, ms: number): Promise<number> {
  await sleep(ms);
  return value;
}

export function timeoutsAndParallel(): PrLog {
  const log = new PrLog();
  const run = async () => {
    log.push(`fast ${await withTimeout(delayed(1, 1), 50, "fast")}`);
    try {
      await withTimeout(delayed(2, 60), 5, "slow");
    } catch (e) {
      log.push((e as Error).message);
    }
    const all = await Promise.all([delayed(10, 3), delayed(20, 1), delayed(30, 2)]);
    log.push(`all ${all.join(",")}`);
    const first = await Promise.race([delayed(1, 20), delayed(2, 2)]);
    log.push(`race ${first}`);
    const settled = await Promise.allSettled([new FlakyService(0).fetch("a"), new FlakyService(1).fetch("b")]);
    const kinds: string[] = [];
    for (const s of settled) kinds.push(s.status === "fulfilled" ? `ok(${s.value})` : `err(${(s.reason as Error).message})`);
    log.push(`settled ${kinds.join(",")}`);
    let total = 0;
    for (const ms of [3, 1, 2]) {
      const v = await delayed(ms * 10, ms);
      total += v;
    }
    log.push(`sequential total ${total}`);
  };
  run().then(
    () => log.push("done"),
    (e: Error) => log.push(`failed: ${e.message}`),
  );
  return log;
}

/** A queue running at most `limit` tasks at once. */
class TaskQueue {
  private running = 0;
  private readonly waiting: (() => void)[] = [];
  maxSeen = 0;
  constructor(private readonly limit: number) {}

  async run(task: () => Promise<number>): Promise<number> {
    while (this.running >= this.limit) await new Promise<void>((resolve) => this.waiting.push(() => resolve()));
    this.running++;
    this.maxSeen = Math.max(this.maxSeen, this.running);
    try {
      return await task();
    } finally {
      this.running--;
      const wake = this.waiting.shift();
      if (wake) wake();
    }
  }
}

export function asyncQueue(): PrLog {
  const log = new PrLog();
  const queue = new TaskQueue(2);
  // The order printed depends on wall-clock time: jobs 1-4 (35 ms in a row) must end before job 0. A device's main
  // thread stalls longer than a few ms (an app's launch, its first frame, cold code), so job 0 gets a wide margin and
  // the jobs start from a timer, after the launch.
  sleep(0).then(() => {
    const jobs = [500, 5, 15, 10, 5].map((ms, i) =>
      queue.run(async () => {
        log.push(`start ${i}`);
        await sleep(ms);
        log.push(`end ${i}`);
        return i * i;
      }),
    );
    Promise.all(jobs).then(
      (results) => {
        log.push(`results ${results.join(",")} max parallel ${queue.maxSeen}`);
        log.push("done");
      },
      (e: Error) => log.push(`failed: ${e.message}`),
    );
  });
  return log;
}
