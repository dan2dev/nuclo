import { expect, test } from "bun:test";

type Op = [string, number, ...unknown[]];
const ops: Op[] = [];
const g = globalThis as any;
g.__nuclo_host = (json: string) => ops.push(...JSON.parse(json));

await import("../example/app");

const textId = (text: string) => ops.findLast((op) => op[0] === "set" && op[2] === "text" && op[3] === text)![1];
const parentOf = (id: number) => ops.findLast((op) => op[0] === "insert" && op[2] === id)![1] as number;
/** Styled buttons are views wrapping a label: the click lands on the view. */
const tap = (text: string) => g.__nuclo_event(parentOf(textId(text)), "click");
const since = (mark: number, op: string, kind?: string) =>
  ops.slice(mark).filter((o) => o[0] === op && (!kind || o[2] === kind));
const shows = (text: string) => ops.some((op) => op[0] === "set" && op[3] === text);

test("chart bars resize in place when the range changes", () => {
  const mark = ops.length;
  tap("Month");
  expect(since(mark, "style").some((op) => op[2] === "height")).toBe(true);
  expect(shows("W3")).toBe(true);
});

test("routes push, pass params and pop", () => {
  let mark = ops.length;
  tap("Gallery");
  expect(since(mark, "create", "image").length).toBe(6);
  expect(ops).toContainEqual(["set", expect.any(Number), "src", "assets/dunes.jpg"]);

  mark = ops.length;
  tap("Soft ridges");
  expect(since(mark, "remove").length).toBe(1);
  expect(shows("Merzouga, Morocco")).toBe(true);
  expect(shows("Next: Still water")).toBe(true);

  mark = ops.length;
  tap("‹ Gallery");
  expect(since(mark, "create", "image").length).toBe(6);
});

test("form validates, then submits", () => {
  let mark = ops.length;
  tap("Account");
  const inputs = since(mark, "create", "input").map((op) => op[1]);
  const [, terms] = since(mark, "create", "checkbox").map((op) => op[1]);
  expect(ops).toContainEqual(["set", inputs[2], "type", "password"]);

  g.__nuclo_event(terms, "change", true);
  tap("Create account");
  expect(shows("Enter a valid email address.")).toBe(true);

  g.__nuclo_event(inputs[0], "input", "Ada Lovelace");
  g.__nuclo_event(inputs[1], "input", "ada@example.com");
  g.__nuclo_event(inputs[2], "input", "analytical1");
  tap("Create account");
  expect(shows("Welcome aboard 🎉")).toBe(true);
  expect(shows("ada@example.com")).toBe(true);
});
