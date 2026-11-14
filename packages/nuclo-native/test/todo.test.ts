import { expect, test } from "bun:test";

import type { Op } from "../src/dom";
const ops: Op[] = [];
const g = globalThis;
g.__nuclo_host = (json: string) => ops.push(...JSON.parse(json));

const { router } = await import("../examples/todo/app");

const textId = (text: string) => ops.findLast((op) => op[0] === "set" && op[2] === "text" && op[3] === text)![1];
const parentOf = (id: number) => ops.findLast((op) => op[0] === "insert" && op[2] === id)![1];
const tap = (text: string) => g.__nuclo_event(parentOf(textId(text)), "click");
const since = (mark: number, op: string, kind?: string) =>
  ops.slice(mark).filter((o) => o[0] === op && (!kind || o[2] === kind));
const shows = (text: string) => ops.findLast((op) => op[0] === "set" && op[2] === "text" && op[3] === text) !== undefined;
const created = (kind: string) => ops.filter((op) => op[0] === "create" && op[2] === kind).map((op) => op[1]);
const [addInput] = created("input");

test("starts with three tasks, two left", () => {
  expect(shows("Buy oat milk")).toBe(true);
  expect(shows("2 tasks left")).toBe(true);
  expect(created("checkbox").length).toBe(3);
});

test("Enter adds the draft as a task", () => {
  g.__nuclo_event(addInput, "input", "Call mum");
  g.__nuclo_event(addInput, "change");
  expect(shows("Call mum")).toBe(true);
  expect(shows("3 tasks left")).toBe(true);
  expect(ops).toContainEqual(["set", addInput, "value", ""]);
});

test("checking a task off counts it as done", () => {
  const [newest] = created("checkbox").slice(-1);
  g.__nuclo_event(newest, "change", true);
  expect(shows("2 tasks left")).toBe(true);
});

test("filters show only matching tasks", () => {
  const mark = ops.length;
  tap("Done");
  // Two done tasks stay, the two active ones leave the list.
  expect(since(mark, "remove").length).toBe(2);
  tap("All");
});

test("a task opens on its own screen and can be deleted from there", () => {
  let mark = ops.length;
  tap("Book the dentist");
  const [screen] = since(mark, "create", "screen").map((op) => op[1]);
  expect(ops).toContainEqual(["set", screen, "title", "Book the dentist"]);
  expect(router.path).toBe("/task/2");

  mark = ops.length;
  tap("Delete task");
  expect(router.path).toBe("/");
  expect(since(mark, "remove").map((op) => op[1])).toContain(screen);
});

test("Clear done removes finished tasks, then hides itself", () => {
  const button = parentOf(textId("Clear done"));
  const mark = ops.length;
  tap("Clear done");
  expect(shows("2 tasks left")).toBe(true);
  expect(since(mark, "remove").map((op) => op[1])).toContain(button);
});
