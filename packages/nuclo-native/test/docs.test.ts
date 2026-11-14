import { expect, test } from "bun:test";

import type { Op } from "../src/dom";
const ops: Op[] = [];
const g = globalThis;
g.__nuclo_host = (json: string) => ops.push(...JSON.parse(json));

const { router } = await import("../examples/docs/app");

const textId = (text: string) => ops.findLast((op) => op[0] === "set" && op[2] === "text" && op[3] === text)![1];
const parentOf = (id: number) => ops.findLast((op) => op[0] === "insert" && op[2] === id)![1];
const tap = (text: string) => g.__nuclo_event(parentOf(textId(text)), "click");
const shows = (text: string) => ops.some((op) => op[0] === "set" && op[2] === "text" && op[3] === text);

test("the home page shows the site's hero and its live counter", () => {
  expect(shows("nuclo.")).toBe(true);
  expect(shows("One explicit cycle.")).toBe(true);
  tap("+");
  tap("+");
  expect(shows("2")).toBe(true);
  tap("Reset");
  expect(ops.findLast((op) => op[0] === "set" && op[1] === textId("2"))?.[3]).toBe("0");
});

test("Get started pushes the docs index; a section opens on its own screen", () => {
  tap("Get started");
  expect(router.path).toBe("/docs");
  expect(shows("Nuclo documentation")).toBe(true);
  tap("Overview");
  expect(router.path).toBe("/docs/overview");
  expect(shows("The mental model")).toBe(true);
  // Code keeps its indentation: native text collapses spaces, not non-breaking ones.
  expect(shows("\u00a0\u00a0div")).toBe(true);
  tap("Quick Start →");
  expect(router.path).toBe("/docs/quick-start");
});

test("the filter narrows the index", () => {
  router.reset("/docs");
  const filter = ops.findLast((op) => op[0] === "create" && op[2] === "input")![1];
  const mark = ops.length;
  g.__nuclo_event(filter, "input", "router api");
  // Every other row and group leaves the screen.
  expect(ops.slice(mark).filter((op) => op[0] === "remove").length).toBeGreaterThan(5);
  g.__nuclo_event(filter, "input", "zzz");
  expect(shows("No sections match “zzz”.")).toBe(true);
  g.__nuclo_event(filter, "input", "");
});

test("a docs section embeds its example live, and opens the example", () => {
  router.reset("/docs");
  tap("list()");
  expect(router.path).toBe("/docs/api-list");
  // The list() demo runs inline: Add appends a fruit.
  tap("Add");
  expect(shows("Cherry")).toBe(true);
  tap("Open");
  expect(router.path).toBe("/examples/api-list");
});

test("the examples tab lists every group; an example shows its preview beside its source", () => {
  router.reset("/examples");
  for (const group of ["Basics", "Components", "API", "Styling", "Forms", "SVG", "Routing", "Apps"]) expect(shows(group)).toBe(true);
  tap("Counter");
  expect(router.path).toBe("/examples/counter");
  expect(shows("COUNT")).toBe(true);
  expect(shows("main.ts")).toBe(true);
  tap("Todo List →");
  expect(router.path).toBe("/examples/todo");
});

test("a browser-only example says why, and shows its source file by file", () => {
  router.reset("/examples");
  tap("A Routed App");
  expect(router.path).toBe("/examples/router-app");
  expect(ops.some((op) => op[0] === "set" && op[2] === "text" && String(op[3]).startsWith("This example uses nuclo-router"))).toBe(true);
  const [first, second] = ops.filter((op) => op[0] === "set" && op[2] === "text" && /\.ts$/.test(String(op[3]))).slice(-2).map((op) => op[3] as string);
  tap(second ?? first);
  expect(shows(second ?? first)).toBe(true);
});
