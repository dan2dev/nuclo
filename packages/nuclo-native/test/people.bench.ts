// Times the people example as its list grows, on a mock host: `bun test/people.bench.ts [rows]` (default 50000).
// Per milestone: ms to load the next page (scroll → update → layout → ops), ms for a Follow tap, ms for an update()
// that changes nothing, ms for a 400 px scroll step, the views the host holds, and the live JS heap.
// The host's own work (parsing, creating views) is not included.
import type { Op } from "../src/dom";
const g = globalThis;
const parent = new Map<number, number>();
// The host's views: created, and gone with their subtree on remove.
const alive = new Set<number>();
const kidsOf = new Map<number, number[]>();
const drop = (id: number) => {
  alive.delete(id);
  for (const kid of kidsOf.get(id) ?? []) drop(kid);
  kidsOf.delete(id);
};
/** Follow labels, newest last; and every handle shown (each row once, however often it comes back). */
const follows: number[] = [];
const handles = new Set<string>();
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
    if (op[0] === "create" && op[2] === "screen") screen = op[1];
    else if (op[0] === "set" && (op[3] === "Follow" || op[3] === "Following")) follows.push(op[1]);
    else if (op[0] === "set" && String(op[3]).startsWith("@")) handles.add(String(op[3]).split(" ")[0]);
    else if (op[0] === "frame" && op[1] === screen) content = op[5];
  }
};
g.__nuclo_measure = (_id: number, max: number) => `${max < 0 ? 80 : Math.min(80, max)} 18.9`;

await import("../src/index");
await import("../examples/people/app");
g.__nuclo_event(screen, "resize", "390 800 3");

const target = Number(process.argv[2] ?? 50_000);
const milestones = [100, 1_000, 5_000, 10_000, 20_000, 50_000].filter((n) => n <= target);
const time = (fn: () => void) => {
  const start = performance.now();
  fn();
  return performance.now() - start;
};
const median = (fn: () => void, runs = 5) => [...Array(runs)].map(() => time(fn)).sort((a, b) => a - b)[runs >> 1];
// Scrolled to the bottom, as a host reports it: loads one page.
const loadPage = () => g.__nuclo_event(screen, "scroll", `${content - 800} 800`);

let rows = 20;
const loaded = () => handles.size;
const started = performance.now();
console.log("rows      page ms   tap ms   update ms   scroll ms   host views   live MB");
for (const milestone of milestones) {
  while (loaded() < milestone - 20) loadPage();
  const page = time(loadPage);
  rows = loaded();
  // The newest Follow button still on the host (far rows are parked); a tap rebuilds its row, so look it up each time.
  const tap = median(() => g.__nuclo_event(parent.get(follows.findLast((id) => alive.has(id))!)!, "click"));
  const idle = median(() => update());
  let y = content - 800;
  const scroll = median(() => g.__nuclo_event(screen, "scroll", `${(y -= 400)} 800`));
  Bun.gc(true);
  const heap = (process.memoryUsage().heapUsed / 1e6).toFixed(0);
  console.log(
    [rows, page.toFixed(1), tap.toFixed(1), idle.toFixed(1), scroll.toFixed(1), alive.size, heap]
      .map((v, i) => String(v).padStart(i ? 12 : 6))
      .join(""),
  );
}
console.log(`total ${((performance.now() - started) / 1000).toFixed(1)} s`);
