import { expect, test } from "bun:test";

type Op = [string, number, ...unknown[]];
const batches: Op[][] = [];
const history: Op[] = [];
const g = globalThis as any;
g.__nuclo_host = (json: string) => {
  batches.push(JSON.parse(json));
  history.push(...batches.at(-1)!);
};

await import("../examples/basics/app");

const all = () => batches.flat();
const idOf = (text: string) => history.findLast((op) => op[0] === "set" && op[2] === "text" && op[3] === text)![1];
const click = (text: string) => g.__nuclo_event(idOf(text), "click");

test("initial render is one batch of host-visible nodes only", () => {
  expect(batches.length).toBe(1);
  const kinds = batches[0].filter((op) => op[0] === "create").map((op) => op[2]);
  expect(kinds).toEqual(["view", "text", "text", "view", "button", "button", "text", "view", "input", "button", "text"]);
  expect(batches[0]).toContainEqual(["set", idOf("Count: 0"), "text", "Count: 0"]);
});

test("update() sends only what changed", () => {
  batches.length = 0;
  click("+");
  expect(batches).toEqual([[["set", idOf("Count: 1"), "text", "Count: 1"]]]);
});

test("input, list and when drive native inserts and removes", () => {
  const input = history.find((op) => op[0] === "create" && op[2] === "input")![1];
  const empty = idOf("Nothing to do.");
  batches.length = 0;
  g.__nuclo_event(input, "input", "Ship POC");
  g.__nuclo_event(input, "change");
  const ops = all();
  expect(ops).toContainEqual(["remove", empty]);
  expect(ops).toContainEqual(["set", idOf("Ship POC"), "text", "Ship POC"]);
  expect(ops).toContainEqual(["set", input, "value", ""]);

  const row = ops.find((op) => op[0] === "create" && op[2] === "view")![1];
  batches.length = 0;
  click("✕");
  expect(all().filter((op) => op[0] === "remove")).toEqual([["remove", row]]);
  expect(all().some((op) => op[0] === "set" && op[3] === "Nothing to do.")).toBe(true);
});
