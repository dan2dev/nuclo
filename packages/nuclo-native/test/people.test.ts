import { afterAll, expect, test } from "bun:test";

import type { Op } from "../src/dom";
const ops: Op[] = [];
const g = globalThis;
g.__nuclo_host = (json: string) => ops.push(...JSON.parse(json));
// Every leaf is one 18.9 px line: enough for the layout engine to give the screen a content height.
g.__nuclo_measure = (_id: number, max: number) => `${max < 0 ? 80 : Math.min(80, max)} 18.9`;
afterAll(() => delete g.__nuclo_measure);

await import("../src/index");
// Bun runs every test file in one process: start from an empty body.
document.body.textContent = "";
await import("../examples/people/app");

const [screen] = ops.filter((op) => op[0] === "create" && op[2] === "screen").map((op) => op[1]);
const parentOf = (id: number) => ops.findLast((op) => op[0] === "insert" && op[2] === id)![1];
const shows = (text: string) => ops.some((op) => op[0] === "set" && op[2] === "text" && op[3] === text);
const contentHeight = () => ops.findLast((op) => op[0] === "frame" && op[1] === screen)![5] as number;
/** Scrolls the screen (800 tall) to `fromEnd` px above its content's end. */
const scrollTo = (fromEnd: number) => g.__nuclo_event(screen, "scroll", `${contentHeight() - 800 - fromEnd} 800`);

test("the first page fills the screen without loading more", () => {
  g.__nuclo_event(screen, "resize", "375 800 3");
  expect(contentHeight()).toBeGreaterThan(1200);
  expect(shows("Showing 20 of 50,000 · following 0")).toBe(true);
});

test("scrolling far from the end loads nothing", () => {
  const mark = ops.length;
  scrollTo(1000);
  expect(ops.length).toBe(mark);
});

test("half a screen from the end loads the next page, once", () => {
  scrollTo(300);
  expect(shows("Showing 40 of 50,000 · following 0")).toBe(true);
  // Still near the old end, but the content grew: nothing more until it is reached again.
  const mark = ops.length;
  g.__nuclo_event(screen, "scroll", "0 800");
  expect(ops.length).toBe(mark);
});

test("a Follow tap rebuilds only that row", () => {
  const label = ops.find((op) => op[0] === "set" && op[2] === "text" && op[3] === "Follow")![1];
  const button = ops.findLast((op) => op[0] === "insert" && op[2] === label)![1];
  const mark = ops.length;
  g.__nuclo_event(button, "click");
  expect(shows("Showing 40 of 50,000 · following 1")).toBe(true);
  expect(ops.slice(mark).filter((op) => op[0] === "remove").length).toBe(1);
  expect(ops.slice(mark).some((op) => op[0] === "set" && op[3] === "Following")).toBe(true);
});

test("frames laid out incrementally match a full layout", () => {
  for (let i = 0; i < 5; i++) scrollTo(0);
  const frames = () => new Map(ops.filter((op) => op[0] === "frame").map((op) => [op[1], op.slice(2).join(" ")]));
  const before = frames();
  // Another width misses every cache; back at 375, everything is laid out from scratch.
  g.__nuclo_event(screen, "resize", "376 800 3");
  g.__nuclo_event(screen, "resize", "375 800 3");
  const after = frames();
  expect([...after].filter(([id, frame]) => before.get(id) !== frame)).toEqual([]);
});

test("rows far from what shows leave the host, and come back where they were", () => {
  /** The host's views, replaying every op: a remove takes the subtree with it. */
  const onHost = () => {
    const alive = new Set<number>();
    const kids = new Map<number, number[]>();
    const drop = (id: number) => {
      alive.delete(id);
      for (const kid of kids.get(id) ?? []) drop(kid);
      kids.delete(id);
    };
    for (const op of ops) {
      if (op[0] === "create") alive.add(op[1]);
      else if (op[0] === "insert") kids.set(op[1], [...(kids.get(op[1]) ?? []), op[2]]);
      else if (op[0] === "remove") drop(op[1]);
    }
    return alive;
  };
  const handles = (alive: Set<number>) =>
    new Set(ops.filter((op) => op[0] === "set" && String(op[3]).startsWith("@") && alive.has(op[1])).map((op) => op[1]));
  const label = ops.findLast((op) => op[0] === "set" && String(op[3]).startsWith("@ava.silva "))![1]; // the Follow test rebuilt her row
  const row = parentOf(parentOf(label));
  const frameOf = (id: number) => ops.findLast((op) => op[0] === "frame" && op[1] === id)!.slice(2);
  const first = frameOf(row);

  for (let i = 0; i < 20; i++) scrollTo(0);
  const alive = onHost();
  expect(contentHeight()).toBeGreaterThan(40_000);
  expect(alive.has(row)).toBe(false);
  // About five screens of rows stay: the window and a screen past it each way.
  expect(handles(alive).size).toBeLessThan(80);

  g.__nuclo_event(screen, "scroll", "0 800");
  expect(onHost().has(row)).toBe(true);
  expect(frameOf(row)).toEqual(first);
});
