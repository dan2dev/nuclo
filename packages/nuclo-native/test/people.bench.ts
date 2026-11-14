// Times the people example as its list grows, on a mock host: `bun test/people.bench.ts [rows]` (default 50000).
// Per milestone: ms to load the next page (scroll → update → layout → ops), ms for a Follow tap, ms for an update()
// that changes nothing, and the ops a page sends. The host's own work (parsing, creating views) is not included.
type Op = [string, number, ...unknown[]];
const g = globalThis as any;
const parent = new Map<number, number>();
let follow = 0;
let screen = 0;
let opsSent = 0;
g.__nuclo_host = (json: string) => {
  const ops: Op[] = JSON.parse(json);
  opsSent += ops.length;
  for (const op of ops) {
    if (op[0] === "insert") parent.set(op[2] as number, op[1]);
    else if (op[0] === "create" && op[2] === "screen") screen = op[1];
    else if (op[0] === "set" && op[3] === "Follow") follow = op[1];
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
// Any offset past the end loads one page: dom.ts sends "end" once per content height.
const loadPage = () => g.__nuclo_event(screen, "scroll", "1e9 800");

let rows = 20;
const started = performance.now();
console.log("rows      page ms   tap ms   update ms   ops/page");
for (const milestone of milestones) {
  while (rows < milestone - 20) {
    loadPage();
    rows += 20;
  }
  opsSent = 0;
  const page = time(loadPage);
  rows += 20;
  const pageOps = opsSent;
  const button = parent.get(follow)!; // the newest row's Follow button
  const tap = median(() => g.__nuclo_event(button, "click"));
  const idle = median(() => g.update());
  console.log(
    [rows, page.toFixed(1), tap.toFixed(1), idle.toFixed(1), pageOps].map((v, i) => String(v).padStart(i ? 10 : 6)).join(""),
  );
}
console.log(`total ${((performance.now() - started) / 1000).toFixed(1)} s, heap ${(process.memoryUsage().heapUsed / 1e6).toFixed(0)} MB`);
