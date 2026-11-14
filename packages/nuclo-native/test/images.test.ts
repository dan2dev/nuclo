// A remote image has no size until its host has fetched it: the host then says `load`, and the images showing it
// are laid out again at its natural size (dom.ts).
import { afterAll, expect, test } from "bun:test";

import type { Op } from "../src/dom";
const ops: Op[] = [];
const g = globalThis;
const url = "https://example.test/photo.png";
const sizes = new Map<string, string>([["local.png", "40 30"]]);
g.__nuclo_host = (json: string) => ops.push(...JSON.parse(json));
g.__nuclo_measure = () => "0 0";
g.__nuclo_text_size = () => "50 20";
g.__nuclo_image_size = (src: string) => sizes.get(src) ?? "0 0";
afterAll(() => {
  delete g.__nuclo_measure;
  delete g.__nuclo_text_size;
  delete g.__nuclo_image_size;
});

await import("../src/index");
document.body.textContent = "";
render(() => div({ style: { alignItems: "flex-start" } }, img({ src: "local.png" }), img({ src: url }), span("after")), document.body);
g.__nuclo_event(1, "resize", "300 600 2");

const idOf = (src: string) => ops.find((op) => op[0] === "set" && op[2] === "src" && op[3] === src)![1];
const after = ops.find((op) => op[0] === "set" && op[3] === "after")![1];
const frameOf = (id: number) => ops.findLast((op) => op[0] === "frame" && op[1] === id)!.slice(2);

test("until it arrives a remote image takes no room; a bundled one has its size", () => {
  expect(frameOf(idOf("local.png"))).toEqual([0, 0, 40, 30]);
  expect(frameOf(idOf(url))).toEqual([0, 30, 0, 0]);
  expect(frameOf(after)[1]).toBe(30);
});

test("load: it is laid out at its natural size, and what follows moves down", () => {
  sizes.set(url, "120 80");
  g.__nuclo_event(0, "load", url);
  expect(frameOf(idOf(url))).toEqual([0, 30, 120, 80]);
  expect(frameOf(after)[1]).toBe(110);
});
