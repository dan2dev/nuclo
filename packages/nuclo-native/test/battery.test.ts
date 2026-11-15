import { expect, test } from "bun:test";

import type { Op } from "../src/dom";
const ops: Op[] = [];
const g = globalThis;
g.__nuclo_host = (json: string) => ops.push(...JSON.parse(json));
const asked: string[] = [];
g.__nuclo_device = (name: string) => {
  asked.push(name);
  return name === "battery" ? JSON.stringify({ level: 0.83, state: "discharging", minutes: 192 }) : "";
};

const { router } = await import("../examples/battery/app");

const shows = (text: string) => ops.some((op) => op[0] === "set" && op[2] === "text" && op[3] === text);
const textId = (text: string) => ops.findLast((op) => op[0] === "set" && op[2] === "text" && op[3] === text)![1];
const parentOf = (id: number) => ops.findLast((op) => op[0] === "insert" && op[2] === id)![1];

test("reads the battery from the host", () => {
  expect(asked.filter((name) => name === "battery")).toEqual(["battery"]);
  expect(shows("83%")).toBe(true);
  expect(shows("On battery")).toBe(true);
  expect(shows("3 h 12 min left")).toBe(true);
});

test("a host change updates the reading and the history", () => {
  const mark = ops.length;
  g.__nuclo_device_changed("battery", JSON.stringify({ level: 0.84, state: "charging", minutes: 40 }));
  const later = ops.slice(mark);
  expect(later.some((op) => op[3] === "84%")).toBe(true);
  expect(later.some((op) => op[3] === "40 min until full")).toBe(true);
  expect(later.some((op) => op[3] === "2 readings")).toBe(true);
});

test("readings open on their own screen", () => {
  g.__nuclo_event(parentOf(textId("See all readings")), "click");
  expect(router.path).toBe("/readings");
  router.back();
});

test("no battery reads as unavailable", () => {
  g.__nuclo_device_changed("battery", "");
  expect(shows("No battery")).toBe(true);
});
