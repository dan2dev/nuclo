// A host that sizes text and images by content (host.ts) is asked once per content; and rows added to a long list
// far from the screen start parked at a guessed size, created only when scrolled to.
import { afterAll, expect, test } from "bun:test";

import type { Op } from "../src/dom";
const ops: Op[] = [];
const g = globalThis;
// A height frames do not keep exactly: they are sent rounded.
const size = (max: number) => `${max < 0 ? 80 : Math.min(80, max)} 18.912345`;
let asked = 0;
g.__nuclo_host = (json: string) => ops.push(...JSON.parse(json));
g.__nuclo_measure = (_id: number, max: number) => size(max);
g.__nuclo_text_size = (_text: string, _size: number, _bold: boolean, _system: boolean, max: number) => (asked++, size(max));
g.__nuclo_image_size = () => "0 0";
afterAll(() => {
  document.body.textContent = "";
  delete g.__nuclo_measure;
  delete g.__nuclo_text_size;
  delete g.__nuclo_image_size;
});

await import("../src/index");
const { createRouter } = await import("../src/router");
// Bun runs every test file in one process: start from an empty body.
document.body.textContent = "";

const rows = Array.from({ length: 100 }, (_, i) => i);
const mark = ops.length;
const router = createRouter({
  "/": () => div(list(() => rows, (i) => div({ style: { padding: 10 } }, span(`Row ${i}`), span("Same on every row")))),
});
render(router.outlet, document.body);
const screen = ops.slice(mark).find((op) => op[0] === "create" && op[2] === "screen")![1];
const contentHeight = () => ops.findLast((op) => op[0] === "frame" && op[1] === screen)![5] as number;
const created = (from: number, text: string) => ops.slice(from).some((op) => op[0] === "set" && op[3] === text);
g.__nuclo_event(screen, "resize", "375 800 3");
const row = contentHeight() / 100;

test("a text measured once serves every row that shows it", () => {
  // "Same on every row" at one width, and "Row 0" … "Row 99".
  expect(asked).toBe(101);
});

test("rows appended far from the screen take a guessed size, and are not created", () => {
  const from = ops.length;
  rows.push(100, 101, 102);
  update();
  expect(contentHeight()).toBeCloseTo(row * 103);
  expect(ops.slice(from).filter((op) => op[0] === "create")).toEqual([]);
});

test("they are created and laid out when scrolled to", () => {
  const from = ops.length;
  g.__nuclo_event(screen, "scroll", `${contentHeight() - 800} 800`);
  expect(created(from, "Row 102")).toBe(true);
  expect(contentHeight()).toBeCloseTo(row * 103);
  const id = ops.slice(from).find((op) => op[0] === "set" && op[3] === "Row 102")![1];
  const parentOf = (child: number) => ops.findLast((op) => op[0] === "insert" && op[2] === child)![1];
  const frame = ops.findLast((op) => op[0] === "frame" && op[1] === parentOf(id))!;
  expect(frame[3]).toBeCloseTo(row * 102);
});

test("a row added where the screen shows is created at once", () => {
  const from = ops.length;
  rows.push(103);
  update();
  expect(created(from, "Row 103")).toBe(true);
});

test("a row parked far away comes back with its children placed", () => {
  // The screen is at the end of the list: row 0 is parked. Back at the top it is created again.
  const from = ops.length;
  g.__nuclo_event(screen, "scroll", "0 800");
  const back = ops.slice(from);
  const text = back.find((op) => op[0] === "set" && op[3] === "Row 0")![1];
  expect(back.some((op) => op[0] === "frame" && op[1] === text)).toBe(true);
});

test("rows on the screen that swap places move, and stay on the host", () => {
  const from = ops.length;
  [rows[0], rows[1]] = [rows[1], rows[0]];
  update();
  const moved = ops.slice(from);
  expect(moved.some((op) => op[0] === "insert")).toBe(true);
  expect(moved.filter((op) => op[0] === "create" || op[0] === "remove")).toEqual([]);
  // Nothing left to bring back: a scroll that shows the same rows sends nothing.
  const settled = ops.length;
  g.__nuclo_event(screen, "scroll", "1 800");
  expect(ops.length).toBe(settled);
});
