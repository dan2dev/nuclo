// A list's rows that arrive together: the host gets the ones near the screen, never all of them (dom.ts, startsParked).
import { afterAll, expect, test } from "bun:test";

import type { Op } from "../src/dom";
const ops: Op[] = [];
const g = globalThis;
g.__nuclo_host = (json: string) => ops.push(...JSON.parse(json));
// Every text is one 18.9 px line.
g.__nuclo_measure = (_id: number, max: number) => `${max < 0 ? 80 : Math.min(80, max)} 18.9`;
afterAll(() => delete g.__nuclo_measure);

await import("../src/index");
const { createRouter } = await import("../src/router");
// Bun runs every test file in one process: start from an empty body.
document.body.textContent = "";

let rows: { name: string }[] = [];
let fields: string[] = [];
const router = createRouter({
  "/": () =>
    div(
      // A short column beside the list: many children, and it fits.
      div(list(() => fields, (name) => span(name))),
      div(list(() => rows, (row) => div(span(row.name)))),
    ),
});
render(router.outlet, document.body);

const [screen] = ops.filter((op) => op[0] === "create" && op[2] === "screen").map((op) => op[1]);
g.__nuclo_event(screen, "resize", "375 800 3");

/** The host's views, replaying every op: a remove takes the subtree with it. */
function onHost() {
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
}
const textOf = (name: string) => ops.findLast((op) => op[0] === "set" && op[2] === "text" && op[3] === name)?.[1] as number | undefined;
const parentOf = (id: number) => ops.findLast((op) => op[0] === "insert" && op[2] === id)![1];
const frameOf = (id: number) => ops.findLast((op) => op[0] === "frame" && op[1] === id)!.slice(2);
const contentHeight = () => frameOf(screen)[3] as number;

test("a column that takes many children and fits shows them all", () => {
  fields = Array.from({ length: 60 }, (_, i) => `field ${i}`);
  update();
  const alive = onHost();
  expect(fields.every((name) => alive.has(textOf(name)!))).toBe(true);
  expect(contentHeight()).toBeCloseTo(60 * 18.9, 3);
  // Laid out with their column: each where a column puts it.
  expect(frameOf(textOf("field 59")!)[1]).toBeCloseTo(59 * 18.9, 3);
});

test("a thousand rows that arrive together: only those near the screen are created", () => {
  const mark = ops.length;
  rows = Array.from({ length: 1000 }, (_, i) => ({ name: `row ${i}` }));
  update();
  const created = ops.slice(mark).filter((op) => op[0] === "create").length;
  // A row is two views: three screens of them show or wait a screen away, never the thousand.
  expect(created).toBeLessThan(2 * 200);
  expect(onHost().has(textOf("row 0")!)).toBe(true);
  expect(textOf("row 999")).toBeUndefined();
  // The rows not created are taken to be as tall as the ones laid out: the screen scrolls over all of them.
  expect(contentHeight()).toBeCloseTo(1060 * 18.9, 3);
});

test("a far row, scrolled to, is created where a full layout puts it", () => {
  g.__nuclo_event(screen, "scroll", `${(60 + 700) * 18.9} 800`);
  const label = textOf("row 700")!;
  expect(onHost().has(label)).toBe(true);
  // Its row's frame, in the list.
  expect(frameOf(parentOf(label))[1]).toBeCloseTo(700 * 18.9, 3);
  expect(onHost().has(textOf("row 0")!)).toBe(false);
  expect(contentHeight()).toBeCloseTo(1060 * 18.9, 3);
});

test("emptied and filled again, the list starts from its first rows", () => {
  rows = [];
  update();
  g.__nuclo_event(screen, "scroll", "0 800");
  rows = Array.from({ length: 500 }, (_, i) => ({ name: `again ${i}` }));
  const mark = ops.length;
  update();
  expect(ops.slice(mark).filter((op) => op[0] === "create").length).toBeLessThan(2 * 200);
  expect(onHost().has(textOf("again 0")!)).toBe(true);
  expect(contentHeight()).toBeCloseTo(560 * 18.9, 3);
});
