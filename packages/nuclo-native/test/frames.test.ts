import { afterAll, expect, test } from "bun:test";

import type { Op } from "../src/dom";
const batches: Op[][] = [];
const g = globalThis;
g.__nuclo_host = (json: string) => batches.push(JSON.parse(json));
const texts = new Map<number, string>();
const measured: number[] = [];
// The host measures from what it was sent: 8 px per character, one 18.9 px line.
g.__nuclo_measure = (id: number, max: number) => {
  measured.push(id);
  const width = (texts.get(id) ?? "").length * 8;
  return `${max < 0 ? width : Math.min(width, max)} 18.9`;
};
const host = g.__nuclo_host;
g.__nuclo_host = (json: string) => {
  for (const op of JSON.parse(json) as Op[]) if (op[0] === "set" && op[2] === "text") texts.set(op[1], String(op[3]));
  host(json);
};

await import("../src/index");
// Bun runs every test file in one process: start from an empty body, leave no host behind.
document.body.textContent = "";
afterAll(() => delete g.__nuclo_measure);
let label = "hi";
let wide = false;
const App = () =>
  div(
    { style: { padding: 10, gap: 4, flexDirection: "row" } },
    span(() => label),
    div({ style: () => ({ width: wide ? 50 : 20, height: 20 }) }),
  );
render(App, document.body);

const all = () => batches.flat();
const frames = () => all().filter((op) => op[0] === "frame");
const labelId = all().find((op) => op[0] === "create" && op[2] === "text")![1];
const textId = () => labelId;

test("no frames until the host reports the root's size", () => {
  expect(frames()).toEqual([]);
});

test("a resize lays the root out and sends frames as their own batch", () => {
  batches.length = 0;
  g.__nuclo_event(1, "resize", "200 300");
  expect(batches.length).toBe(1);
  expect(batches[0].every((op) => op[0] === "frame")).toBe(true);
  // body > div(padding 10, row) > [span "hi" (16 wide), div 20×20]
  expect(all()).toContainEqual(["frame", labelId, 10, 10, 16, 20]);
});

test("an update re-sends only the frames that moved, and re-measures only what changed", () => {
  batches.length = 0;
  measured.length = 0;
  wide = true;
  update();
  const moved = frames().map((op) => op[1]);
  expect(moved.length).toBe(1); // the box grew; the span stayed put
  expect(measured).toEqual([]); // no text changed

  batches.length = 0;
  label = "hello";
  update();
  expect(new Set(measured)).toEqual(new Set([textId()]));
  expect(all()).toContainEqual(["frame", textId(), 10, 10, 40, 20]);
});
