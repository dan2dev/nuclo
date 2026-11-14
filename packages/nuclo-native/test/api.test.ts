import { expect, test } from "bun:test";
import type { Op } from "../src/dom";

// nuclo-core's API on the native DOM: lifecycle, when/else, list, region/into, scope, forceUpdate.
const ops: Op[] = [];
globalThis.__nuclo_host = (json) => ops.push(...JSON.parse(json));
await import("../src/index");

const texts = () => {
  const shown = new Map<number, string>();
  const alive = new Set<number>();
  for (const op of ops) {
    if (op[0] === "create") alive.add(op[1]);
    else if (op[0] === "remove") alive.delete(op[1]);
    else if (op[0] === "set" && op[2] === "text") shown.set(op[1], String(op[3]));
  }
  return [...alive].flatMap((id) => (shown.has(id) ? [shown.get(id)!] : []));
};

let show = true;
let items = ["a", "b"];
let count = 0;
let scoped = 0;
let lang = "en";
const lifecycle: string[] = [];
render(
  () =>
    div(
      when(() => show, span("on", on("mount", () => void lifecycle.push("mount")), on("destroy", () => void lifecycle.push("destroy")))).else(span("off")),
      list(() => items, (item) => span(`item ${item}`)),
      span(() => `count ${count}`),
      span(lang === "en" ? "Hello" : "Olá"),
      div(scope("panel"), span(() => `scoped ${scoped}`)),
      region({ id: "slot" }),
    ),
  document.body,
);

test("mount and destroy run on the native DOM", () => {
  expect(lifecycle).toEqual(["mount"]);
  show = false;
  update();
  expect(lifecycle).toEqual(["mount", "destroy"]);
  expect(texts()).toContain("off");
  expect(texts()).not.toContain("on");
});

test("list() keeps rows in order", () => {
  items = ["b", "c", "a"];
  update();
  expect(document.body.textContent).toContain("item bitem citem a");
});

test("update(scope) touches only that scope", () => {
  count = 1;
  scoped = 1;
  update("panel");
  expect(texts()).toContain("scoped 1");
  expect(texts()).toContain("count 0");
  update();
  expect(texts()).toContain("count 1");
});

test("into() fills a region", () => {
  render(() => into("slot", span("in the slot")), document.body);
  expect(texts()).toContain("in the slot");
});

test("forceUpdate() calls the components again, static values included", () => {
  lang = "pt";
  forceUpdate();
  expect(texts()).toContain("Olá");
  expect(texts()).not.toContain("Hello");
  expect(texts()).toContain("count 1");
});
