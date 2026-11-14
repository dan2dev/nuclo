import { expect, test } from "bun:test";
import { type LayoutNode, type Measure, layout } from "../src/layout";

// A stub font: 7 px per character at 14 px, wrapping at the available width.
const measure: Measure = (node, maxWidth) => {
  if (node.kind === "image") return { w: 400, h: 300 };
  const size = parseFloat(node.style.fontSize ?? "14");
  const text = node.style.text ?? "";
  const width = (text.length * 7 * size) / 14;
  const lines = Math.max(1, Math.ceil(width / Math.max(1, maxWidth)));
  return { w: Math.min(width, maxWidth), h: lines * size * 1.35 };
};

let next = 1;
const node = (kind: string, style: Record<string, string | number>, ...children: LayoutNode[]): LayoutNode => ({
  id: next++,
  kind,
  style: Object.fromEntries(Object.entries(style).map(([k, v]) => [k, String(v)])),
  children,
});
const box = (style: Record<string, string | number>, ...children: LayoutNode[]) => node("view", style, ...children);
const text = (value: string, style: Record<string, string | number> = {}) => node("text", { ...style, text: value });

const close = (actual: number[] | undefined, expected: number[]) => {
  expect(actual).toBeDefined();
  actual!.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 2));
};

test("a column stretches children, with padding and gap", () => {
  const a = box({ height: 20 });
  const b = box({ height: 30 });
  const root = box({ padding: 10, gap: 5 }, a, b);
  const { frames, height } = layout(root, 300, undefined, measure);
  close(frames.get(a.id), [10, 10, 280, 20]);
  close(frames.get(b.id), [10, 35, 280, 30]);
  expect(height).toBeCloseTo(75);
});

test("flex grows from a basis of 0: equal shares whatever the content", () => {
  const a = box({ flex: 1 }, text("short"));
  const b = box({ flex: 1 }, text("a much much longer text"));
  const root = box({ flexDirection: "row", gap: 10 }, a, b);
  const { frames } = layout(root, 310, undefined, measure);
  expect(frames.get(a.id)![2]).toBeCloseTo(150);
  expect(frames.get(b.id)![2]).toBeCloseTo(150);
  expect(frames.get(b.id)![0]).toBeCloseTo(160);
});

test("flex ratios share what fixed siblings leave", () => {
  const a = box({ flex: 1 });
  const fixed = box({ width: 50 });
  const b = box({ flex: 2 });
  const root = box({ flexDirection: "row", gap: 10 }, a, fixed, b);
  const { frames } = layout(root, 300, undefined, measure);
  close(frames.get(a.id), [0, 0, 230 / 3, 0]);
  close(frames.get(fixed.id), [230 / 3 + 10, 0, 50, 0]);
  expect(frames.get(b.id)![2]).toBeCloseTo((230 * 2) / 3);
});

test("a row is as tall as its tallest child; alignItems places the others", () => {
  const small = box({ width: 20, height: 10 });
  const tall = box({ width: 20, height: 40 });
  const stretched = box({ width: 20 });
  for (const [align, y] of [["flex-start", 0], ["center", 15], ["flex-end", 30]] as const) {
    const root = box({ flexDirection: "row", alignItems: align }, small, tall);
    const { frames, height } = layout(root, 100, undefined, measure);
    expect(frames.get(small.id)![1]).toBeCloseTo(y);
    expect(height).toBeCloseTo(40);
  }
  const root = box({ flexDirection: "row" }, tall, stretched);
  close(layout(root, 100, undefined, measure).frames.get(stretched.id), [20, 0, 20, 40]);
});

test("centered column children are fit-content and wrap past the container", () => {
  const short = text("hello");
  const long = text("x".repeat(40));
  const root = box({ alignItems: "center" }, short, long);
  const { frames } = layout(root, 200, undefined, measure);
  close(frames.get(short.id), [82.5, 0, 35, 18.9]);
  close(frames.get(long.id), [0, 18.9, 200, 37.8]);
});

test("a definite column height is shared by flex children", () => {
  const header = box({ height: 100 });
  const body = box({ flex: 1 }, box({ flex: 1 }));
  const root = box({}, header, body);
  const { frames } = layout(root, 300, 400, measure);
  close(frames.get(body.id), [0, 100, 300, 300]);
  // In a column of auto height, flex children keep their content height.
  close(layout(box({}, header, body), 300, undefined, measure).frames.get(body.id), [0, 100, 300, 0]);
});

test("controls have contract boxes", () => {
  const check = node("checkbox", {});
  const field = node("input", {});
  const padded = node("input", { padding: 4, fontSize: 20 });
  const button = node("button", { text: "Go" });
  const root = box({ alignItems: "flex-start", gap: 0 }, check, field, padded, button);
  const { frames } = layout(root, 300, undefined, measure);
  close(frames.get(check.id), [0, 0, 24, 24]);
  close(frames.get(field.id), [0, 24, 160, 14 * 1.35 + 16]);
  expect(frames.get(padded.id)![3]).toBeCloseTo(20 * 1.35 + 8);
  close(frames.get(button.id), [0, 24 + 34.9 + 35, 14 + 32, 18.9 + 16]);
});

test("images keep their aspect unless sized", () => {
  const free = node("image", {});
  const sized = node("image", { height: 50 });
  const root = box({}, free, sized);
  const { frames } = layout(root, 200, undefined, measure);
  close(frames.get(free.id), [0, 0, 200, 150]);
  close(frames.get(sized.id), [0, 150, 200, 50]);
});

test("text with padding measures inside it", () => {
  const label = text("x".repeat(20), { padding: 10 });
  const { frames } = layout(box({}, label), 100, undefined, measure);
  // 140 px of text in 80 px of room: two lines.
  close(frames.get(label.id), [0, 0, 100, 2 * 18.9 + 20]);
});

test("containers of a set height still lay their children out", () => {
  const inColumn = box({ width: 20 });
  const inRow = box({ width: 30, height: 10 });
  const column = box({ height: 50, alignItems: "center" }, inColumn);
  const row = box({ height: 40, flexDirection: "row" }, inRow);
  const { frames } = layout(box({}, column, row), 100, undefined, measure);
  close(frames.get(inColumn.id), [40, 0, 20, 0]);
  close(frames.get(inRow.id), [0, 0, 30, 10]);
});

test("a column laid out again reuses unchanged children and moves the ones below a change", () => {
  const [a, b, c] = [box({ height: 10 }), box({ height: 20 }), box({ height: 30 })];
  const first = box({ gap: 4 }, a, b, c);
  layout(first, 100, undefined, measure);
  // dom.ts rebuilds a changed node as a new object that points at the one it replaces.
  const again = (prev: LayoutNode, ...children: LayoutNode[]): LayoutNode => ({ ...node("view", { gap: 4 }, ...children), id: first.id, prev });
  // Nothing moved: the same children at the same places get no frames.
  const same = again(first, a, b, c);
  expect(layout(same, 100, undefined, measure).frames.size).toBe(0);
  // `a` grew: `b` and `c` are the same nodes, but lower.
  const grown = { ...node("view", { height: 15 }), id: a.id };
  const { frames, height } = layout(again(same, grown, b, c), 100, undefined, measure);
  expect([...frames.keys()]).toEqual([a.id, b.id, c.id]);
  close(frames.get(b.id), [0, 19, 100, 20]);
  close(frames.get(c.id), [0, 43, 100, 30]);
  expect(height).toBeCloseTo(73);
});
