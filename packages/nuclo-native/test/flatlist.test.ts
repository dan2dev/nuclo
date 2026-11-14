// flatList(): list()'s call for a long list. Only the rows near the screen are built, however many items arrive.
import { afterAll, expect, test } from "bun:test";

import type { Op } from "../src/dom";
const ops: Op[] = [];
const g = globalThis;
g.__nuclo_host = (json: string) => ops.push(...JSON.parse(json));
g.__nuclo_measure = (_id: number, max: number) => `${max < 0 ? 80 : Math.min(80, max)} 18.9`;
afterAll(() => delete g.__nuclo_measure);

const { flatList } = await import("../src/index");
const { createRouter } = await import("../src/router");
document.body.textContent = "";

let rows: { name: string }[] = [];
const router = createRouter({ "/": () => div(flatList(() => rows, (row) => div(span(row.name)))) });
render(router.outlet, document.body);
const [screen] = ops.filter((op) => op[0] === "create" && op[2] === "screen").map((op) => op[1]);
g.__nuclo_event(screen, "resize", "375 800 3");
const built = (name: string) => ops.some((op) => op[0] === "set" && op[2] === "text" && op[3] === name);
const contentHeight = () => ops.findLast((op) => op[0] === "frame" && op[1] === screen)![5] as number;

test("ten thousand items build a few screens of rows, and the content is as tall as with them all", () => {
  rows = Array.from({ length: 10_000 }, (_, i) => ({ name: `row ${i}` }));
  const mark = ops.length;
  update();
  // Three screens past the 800 px that show, 18.9 px a row: a few hundred rows, of two views each.
  expect(ops.slice(mark).filter((op) => op[0] === "create").length).toBeLessThan(2 * 400);
  expect(built("row 0")).toBe(true);
  expect(built("row 9999")).toBe(false);
  // Rows not built count at the mean of those laid out so far: about as tall as with them all.
  expect(Math.abs(contentHeight() / (10_000 * 18.9) - 1)).toBeLessThan(0.1);
});

test("scrolled far down, the rows there are built", () => {
  const mark = ops.length;
  g.__nuclo_event(screen, "scroll", `${5000 * 18.9} 800`);
  const names = ops.slice(mark).flatMap((op) => (op[0] === "set" && op[2] === "text" ? [Number(String(op[3]).slice(4))] : []));
  expect(names.length).toBeGreaterThan(40);
  // Where the estimate puts that offset: around row 5,000, give or take the tenth above.
  expect(Math.min(...names)).toBeGreaterThan(4000);
  expect(Math.max(...names)).toBeLessThan(6000);
});
