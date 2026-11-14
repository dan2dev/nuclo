import { afterAll, expect, test } from "bun:test";

type Op = [string, number, ...unknown[]];
const ops: Op[] = [];
const g = globalThis as any;
g.__nuclo_host = (json: string) => ops.push(...JSON.parse(json));
// Every leaf is one 18.9 px line: enough for the layout engine to give the screen a content height.
g.__nuclo_measure = (_id: number, max: number) => `${max < 0 ? 80 : Math.min(80, max)} 18.9`;
afterAll(() => delete g.__nuclo_measure);

await import("../src/index");
// Bun runs every test file in one process: start from an empty body.
document.body.textContent = "";
await import("../examples/people/app");

const [screen] = ops.filter((op) => op[0] === "create" && op[2] === "screen").map((op) => op[1]);
const shows = (text: string) => ops.some((op) => op[0] === "set" && op[2] === "text" && op[3] === text);
const contentHeight = () => ops.findLast((op) => op[0] === "frame" && op[1] === screen)![5] as number;
/** Scrolls the screen (800 tall) to `fromEnd` px above its content's end. */
const scrollTo = (fromEnd: number) => g.__nuclo_event(screen, "scroll", `${contentHeight() - 800 - fromEnd} 800`);

test("the first page fills the screen without loading more", () => {
  g.__nuclo_event(screen, "resize", "375 800 3");
  expect(contentHeight()).toBeGreaterThan(1200);
  expect(shows("Showing 20 of 200 · following 0")).toBe(true);
});

test("scrolling far from the end loads nothing", () => {
  const mark = ops.length;
  scrollTo(1000);
  expect(ops.length).toBe(mark);
});

test("half a screen from the end loads the next page, once", () => {
  scrollTo(300);
  expect(shows("Showing 40 of 200 · following 0")).toBe(true);
  // Still near the old end, but the content grew: nothing more until it is reached again.
  const mark = ops.length;
  g.__nuclo_event(screen, "scroll", "0 800");
  expect(ops.length).toBe(mark);
});

test("keeps loading to the last page, then stops", () => {
  for (let i = 0; i < 20; i++) scrollTo(0);
  expect(shows("That's everyone: 200 people.")).toBe(true);
  const mark = ops.length;
  scrollTo(0);
  expect(ops.length).toBe(mark);
});
