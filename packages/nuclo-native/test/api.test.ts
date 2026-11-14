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

test("events bubble to the ancestors that listen, until one stops them", () => {
  const heard: string[] = [];
  let stop = false;
  const inner = (event: Event) => {
    heard.push("inner");
    if (stop) event.stopPropagation();
  };
  render(() => div(on("click", () => void heard.push("outer")), span("tap me", on("click", inner))), document.body);
  const id = ops.findLast((op) => op[0] === "set" && op[3] === "tap me")![1];
  globalThis.__nuclo_event(id, "click");
  expect(heard).toEqual(["inner", "outer"]);
  stop = true;
  heard.length = 0;
  globalThis.__nuclo_event(id, "click");
  expect(heard).toEqual(["inner"]);
});

test("form controls send their creation mode, accessible name and focus, and preserve line breaks", () => {
  let value = "";
  const start = ops.length;
  render(() => div(
    input({ type: "password", "aria-label": "Password" }),
    textarea({
      rows: 4,
      "aria-label": "Notes",
      onMount: (field) => field.focus(),
      onInput: (event) => { value = event.currentTarget.value; },
    }),
  ), document.body);
  const added = ops.slice(start);
  const secure = added.find((op) => op[0] === "create" && op[3] === "password")![1];
  const multiline = added.find((op) => op[0] === "create" && op[3] === "multiline")![1];
  expect(added).toContainEqual(["set", secure, "aria-label", "Password"]);
  expect(added).toContainEqual(["set", multiline, "aria-label", "Notes"]);
  expect(added).toContainEqual(["set", multiline, "focus", true]);
  globalThis.__nuclo_event(multiline, "input", "first\nsecond");
  expect(value).toBe("first\nsecond");
});

test("a larger system font updates both paint and layout and resets to the declared size", () => {
  globalThis.__nuclo_measure = () => "60 20";
  globalThis.__nuclo_text_size = (_text, fontSize) => `60 ${fontSize}`;
  const start = ops.length;
  render(() => div(span("Scalable", { style: { fontSize: 20 } })), document.body);
  const id = ops.slice(start).find((op) => op[0] === "set" && op[3] === "Scalable")![1];
  globalThis.__nuclo_event(1, "resize", "375 800 3");
  globalThis.__nuclo_event(1, "textScale", 1.5);
  expect(ops.findLast((op) => op[0] === "style" && op[1] === id && op[2] === "fontSize")).toEqual(["style", id, "fontSize", "30"]);
  expect(ops.findLast((op) => op[0] === "frame" && op[1] === id)?.[5]).toBeCloseTo(30);
  globalThis.__nuclo_event(1, "textScale", 1);
  expect(ops.findLast((op) => op[0] === "style" && op[1] === id && op[2] === "fontSize")).toEqual(["style", id, "fontSize", "20"]);
  expect(ops.findLast((op) => op[0] === "frame" && op[1] === id)?.[5]).toBeCloseTo(20);
});
