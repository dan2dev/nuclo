// A windowed list keeps only the rows near what the screen shows, in JS as on the host, and nothing moves as its
// window does: every row on the host sits where it would with all the rows there.
import { afterAll, expect, test } from "bun:test";

import type { Op } from "../src/dom";
const g = globalThis;
/** The host's views: their parent, their frame, and the text of the labels. */
const parent = new Map<number, number>();
const frames = new Map<number, number[]>();
const texts = new Map<number, string>();
const kidsOf = new Map<number, Set<number>>();
const drop = (id: number) => {
  for (const kid of kidsOf.get(id) ?? []) drop(kid);
  kidsOf.delete(id);
  kidsOf.get(parent.get(id)!)?.delete(id);
  parent.delete(id);
  frames.delete(id);
  texts.delete(id);
};
let screen = 0;
const apply = (json: string) => {
  for (const op of JSON.parse(json) as Op[]) {
    if (op[0] === "create" && op[2] === "screen") screen = op[1];
    else if (op[0] === "insert") {
      kidsOf.get(parent.get(op[2])!)?.delete(op[2]);
      parent.set(op[2], op[1]);
      if (!kidsOf.has(op[1])) kidsOf.set(op[1], new Set());
      kidsOf.get(op[1])!.add(op[2]);
    } else if (op[0] === "remove") drop(op[1]);
    else if (op[0] === "set" && op[2] === "text") texts.set(op[1], String(op[3]));
    else if (op[0] === "frame") frames.set(op[1], op.slice(2) as number[]);
  }
};
g.__nuclo_host = apply;
g.__nuclo_measure = (_id: number, max: number) => `${max < 0 ? 60 : Math.min(60, max)} 18.9`;
afterAll(() => {
  document.body.textContent = "";
  delete g.__nuclo_measure;
});

const { windowed } = await import("../src/index");
const { createRouter } = await import("../src/router");
document.body.textContent = "";

const HEADER = 50;
const VIEW = 800;
const heightOf = (i: number) => 40 + (i % 7) * 12;
const keys = Array.from({ length: 3000 }, (_, i) => i);
/** Where row `i` is with every row there: under the header and the rows before it. */
const offsetOf = (i: number) => HEADER + keys.slice(0, keys.indexOf(i)).reduce((sum, k) => sum + heightOf(k), 0);
const records = new Map<number, { id: number }>();
const record = (id: number) => records.get(id) ?? (records.set(id, { id }), records.get(id)!);

const router = createRouter({
  "/": () =>
    div(
      div({ style: { height: HEADER } }),
      windowed(() => keys, record, (r) => div({ style: { height: heightOf(r.id) } }, span(`Row ${r.id}`))),
    ),
});
render(router.outlet, document.body);
g.__nuclo_event(screen, "resize", `375 ${VIEW} 3`);

/** A view's y in its screen's content. */
const yOf = (id: number): number => (id === screen || !parent.has(id) ? 0 : (frames.get(id)?.[1] ?? 0) + yOf(parent.get(id)!));
/** The rows the host has: [index, y of its box]. A row's label sits in the row, in the window's wrapper. */
const onHost = () =>
  [...texts].filter(([id]) => parent.has(id)).map(([id, text]) => [Number(text.slice(4)), yOf(parent.get(id)!)] as const);
/** The rows JS holds: the window container's children. */
const inJs = () => {
  const find = (node: Node): Element | null => {
    if ((node as Element).getAttribute?.("data-window")) return node as Element;
    for (const kid of node.childNodes) {
      const found = find(kid);
      if (found) return found;
    }
    return null;
  };
  return [...find(document.body)!.childNodes].filter((kid) => kid.nodeType === 1).length;
};
const scrollTo = (y: number) => g.__nuclo_event(screen, "scroll", `${y} ${VIEW}`);
/** Every row on the host is where it belongs, and the visible part is covered by rows. */
const check = (y: number) => {
  const rows = onHost();
  for (const [i, at] of rows) expect([i, at]).toEqual([i, offsetOf(i)]);
  const shown = rows.filter(([i, at]) => at < y + VIEW && at + heightOf(i) > y).sort((a, b) => a[1] - b[1]);
  expect(shown.length).toBeGreaterThan(5);
  expect(shown[0]![1]).toBeLessThanOrEqual(Math.max(y, HEADER));
  shown.forEach(([i, at], k) => k && expect(at).toBe(shown[k - 1]![1] + heightOf(shown[k - 1]![0])));
};
const contentHeight = () => frames.get(screen)![3];
const total = HEADER + keys.reduce((sum, k) => sum + heightOf(k), 0);

test("only the rows near the screen exist, and they are where they belong", () => {
  check(0);
  expect(inJs()).toBeLessThan(120);
  expect(onHost().some(([i]) => i === 0)).toBe(true);
});

test("scrolled down a screen at a time, the window follows and no row moves", () => {
  let most = 0;
  for (let y = 0; y <= 60_000; y += 700) {
    scrollTo(y);
    check(y);
    most = Math.max(most, inJs());
  }
  // A window of seven screens of rows, whatever the list's length.
  expect(most).toBeLessThan(160);
  expect(onHost().some(([i]) => i === 0)).toBe(false);
});

test("scrolled back up, the rows come back where they were, and the content is as tall as with them all", () => {
  for (let y = 60_000; y >= 0; y -= 650) {
    scrollTo(y);
    check(y);
  }
  scrollTo(0);
  check(0);
  expect(inJs()).toBeLessThan(120);
  // The rows after the window count at the mean of those laid out so far.
  expect(Math.abs(contentHeight() - total) / total).toBeLessThan(0.02);
});

test("a row that changes is rebuilt in place, and rows added at the end extend the list", () => {
  records.set(3, { id: 3 });
  keys.push(...Array.from({ length: 50 }, (_, i) => 3000 + i));
  update();
  check(0);
  expect(onHost().filter(([i]) => i === 3).length).toBe(1);
  expect(Math.abs(contentHeight() - (total + 50 * 76)) / total).toBeLessThan(0.02);
});

test("a jump far away shows rows there, and back at the start the first rows are in place", () => {
  scrollTo(150_000);
  const rows = onHost().filter(([, at]) => at < 150_000 + VIEW && at > 150_000 - 100);
  expect(rows.length).toBeGreaterThan(5);
  expect(inJs()).toBeLessThan(160);
  scrollTo(0);
  check(0);
});

test("a row put first moves the rest down, as in any list", () => {
  keys.unshift(-1);
  update();
  check(0);
  expect(onHost().find(([i]) => i === 0)![1]).toBe(HEADER + heightOf(-1));
});
