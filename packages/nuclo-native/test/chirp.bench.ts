// Times chirp's feed as it grows, on a mock host: `bun test/chirp.bench.ts [posts]` (default 20000).
// Per milestone: ms for the page's reply to show (update → layout → ops), ms for a like, ms for an update() that
// changes nothing, ms for a 400 px scroll step, the views the host holds, and the live JS heap.
// The server answers at once; the host's own work (parsing, creating views) is not included.
import type { Op } from "../src/dom";
const g = globalThis;
const parent = new Map<number, number>();
const alive = new Set<number>();
const kidsOf = new Map<number, number[]>();
const drop = (id: number) => {
  alive.delete(id);
  for (const kid of kidsOf.get(id) ?? []) drop(kid);
  kidsOf.delete(id);
};
const hearts: number[] = [];
let screen = 0;
let content = 0;
g.__nuclo_host = (json: string) => {
  const ops: Op[] = JSON.parse(json);
  for (const op of ops) {
    if (op[0] === "insert") {
      parent.set(op[2], op[1]);
      const kids = kidsOf.get(op[1]);
      if (kids) kids.push(op[2]);
      else kidsOf.set(op[1], [op[2]]);
    } else if (op[0] === "remove") drop(op[1]);
    else if (op[0] === "create") alive.add(op[1]);
    if (op[0] === "create" && op[2] === "screen") screen ||= op[1];
    else if (op[0] === "set" && (op[3] === "♡" || op[3] === "♥")) hearts.push(op[1]);
    else if (op[0] === "frame" && op[1] === screen) content = op[5];
  }
};
g.__nuclo_measure = (_id: number, max: number) => `${max < 0 ? 80 : Math.min(80, max)} 18.9`;

await import("../src/index");
const { network } = await import("../examples/chirp/api");
network.latency = 0;
await import("../examples/chirp/app");
const { feed } = await import("../examples/chirp/views");
g.__nuclo_event(screen, "resize", "390 800 3");

const target = Number(process.argv[2] ?? 20_000);
const milestones = [100, 1_000, 5_000, 10_000, 20_000, 50_000].filter((n) => n <= target);
const time = (fn: () => void) => {
  const start = performance.now();
  fn();
  return performance.now() - start;
};
const median = (fn: () => void, runs = 5) => [...Array(runs)].map(() => time(fn)).sort((a, b) => a - b)[runs >> 1];
/** The next page: asked for, then timed from its reply (the reply's update is the work). */
const loadPage = async () => {
  const before = feed.ids.length;
  feed.load();
  let spent = 0;
  const real = g.update;
  g.update = ((...args: Parameters<typeof real>) => void (spent += time(() => real(...args)))) as typeof real;
  while (feed.ids.length === before) await new Promise((resolve) => setTimeout(resolve, 0));
  g.update = real;
  return spent;
};

await loadPage();
const started = performance.now();
console.log(" posts     page ms  like ms   update ms   scroll ms   host views   live MB");
for (const milestone of milestones) {
  while (feed.ids.length < milestone - 20) await loadPage();
  g.__nuclo_event(screen, "scroll", `${content - 800} 800`);
  const page = await loadPage();
  g.__nuclo_event(screen, "scroll", `${content - 1600} 800`);
  // The newest heart still on the host (far rows are parked); a like rebuilds its row, so look it up each time.
  const like = median(() => g.__nuclo_event(parent.get(hearts.findLast((id) => alive.has(id))!)!, "click"));
  const idle = median(() => update());
  let y = content - 800;
  const scroll = median(() => g.__nuclo_event(screen, "scroll", `${(y -= 400)} 800`));
  Bun.gc(true);
  const heap = (process.memoryUsage().heapUsed / 1e6).toFixed(0);
  console.log(
    [feed.ids.length, page.toFixed(1), like.toFixed(1), idle.toFixed(1), scroll.toFixed(1), alive.size, heap]
      .map((v, i) => String(v).padStart(i ? 12 : 6))
      .join(""),
  );
}
console.log(`total ${((performance.now() - started) / 1000).toFixed(1)} s`);
process.exit(0);
