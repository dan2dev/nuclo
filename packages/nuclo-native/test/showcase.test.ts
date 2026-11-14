import { expect, test } from "bun:test";

import type { Op } from "../src/dom";
const ops: Op[] = [];
const g = globalThis;
g.__nuclo_host = (json: string) => ops.push(...JSON.parse(json));

const { router } = await import("../examples/showcase/app");

const textId = (text: string) => ops.findLast((op) => op[0] === "set" && op[2] === "text" && op[3] === text)![1];
const parentOf = (id: number) => ops.findLast((op) => op[0] === "insert" && op[2] === id)![1];
/** Styled buttons are views wrapping a label: the click lands on the view. */
const tap = (text: string) => g.__nuclo_event(parentOf(textId(text)), "click");
const since = (mark: number, op: string, kind?: string) =>
  ops.slice(mark).filter((o) => o[0] === op && (!kind || o[2] === kind));
const shows = (text: string) => ops.some((op) => op[0] === "set" && op[3] === text);
const created = (kind: string) => ops.filter((op) => op[0] === "create" && op[2] === kind).map((op) => op[1]);
const titled = (title: string) => ops.findLast((op) => op[0] === "set" && op[2] === "title" && op[3] === title)![1];

const [tabs] = created("tabs");
const [dashboard, gallery, account] = created("stack");

test("the navigation is the root: tabs, one stack per tab, a root screen each", () => {
  expect(ops).toContainEqual(["insert", 1, tabs, 0]);
  expect([dashboard, gallery, account].map((stack) => parentOf(stack))).toEqual([tabs, tabs, tabs]);
  expect(ops).toContainEqual(["set", gallery, "icon", "photo"]);
  expect(ops).toContainEqual(["set", tabs, "selected", "0"]);
  expect(parentOf(titled("Pulse"))).toBe(dashboard);
  expect(parentOf(titled("Gallery"))).toBe(gallery);
});

test("chart bars resize in place when the range changes", () => {
  const mark = ops.length;
  tap("Month");
  expect(since(mark, "style").some((op) => op[2] === "height")).toBe(true);
  expect(shows("W3")).toBe(true);
});

test("go() pushes a titled screen onto the current tab's stack", () => {
  g.__nuclo_event(tabs, "select", 1);
  expect(router.path).toBe("/gallery");

  const mark = ops.length;
  tap("Soft ridges");
  const [screen] = since(mark, "create", "screen").map((op) => op[1]);
  expect(ops).toContainEqual(["insert", gallery, screen, 0]);
  expect(ops).toContainEqual(["set", screen, "title", "Soft ridges"]);
  expect(since(mark, "remove")).toEqual([]);
  expect(shows("Merzouga, Morocco")).toBe(true);
});

test("tabs keep their own stacks", () => {
  let mark = ops.length;
  g.__nuclo_event(tabs, "select", 2);
  expect(since(mark, "set")).toContainEqual(["set", tabs, "selected", "2"]);
  expect(router.path).toBe("/account");

  mark = ops.length;
  g.__nuclo_event(tabs, "select", 1);
  expect(router.path).toBe("/gallery/dunes");
  expect(since(mark, "remove")).toEqual([]);
});

test("a native back syncs the stack: the host already popped", () => {
  tap("Next: Still water");
  expect(router.path).toBe("/gallery/lagoon");
  const lagoon = titled("Still water");
  const dunes = titled("Soft ridges");

  const mark = ops.length;
  g.__nuclo_event(gallery, "pop", 1);
  expect(router.path).toBe("/gallery");
  expect(since(mark, "remove").map((op) => op[1]).sort()).toEqual([dunes, lagoon].sort());
});

test("back() and reset() pop from JS", () => {
  router.go("/gallery/aurora");
  let mark = ops.length;
  router.back();
  expect(since(mark, "remove").length).toBe(1);

  router.go("/gallery/ember");
  mark = ops.length;
  router.reset("/account");
  expect(router.path).toBe("/account");
  expect(since(mark, "set")).toContainEqual(["set", tabs, "selected", "2"]);
});

test("form validates, then submits", () => {
  const inputs = created("input");
  const [, terms] = created("checkbox");
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
