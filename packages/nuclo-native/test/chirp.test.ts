import { afterAll, expect, test } from "bun:test";

import type { Op } from "../src/dom";
const ops: Op[] = [];
const g = globalThis;
g.__nuclo_host = (json: string) => ops.push(...JSON.parse(json));
g.__nuclo_measure = (_id: number, max: number) => `${max < 0 ? 80 : Math.min(80, max)} 18.9`;
afterAll(() => delete g.__nuclo_measure);

await import("../src/index");
// Bun runs every test file in one process: start from an empty body.
document.body.textContent = "";
const { router } = await import("../examples/chirp/app");
const { friendsOf, user } = await import("../examples/chirp/data");

const created = (kind: string) => ops.filter((op) => op[0] === "create" && op[2] === kind).map((op) => op[1]);
const textId = (text: string) => ops.findLast((op) => op[0] === "set" && op[2] === "text" && op[3] === text)![1];
const parentOf = (id: number) => ops.findLast((op) => op[0] === "insert" && op[2] === id)![1];
const shows = (text: string) => ops.some((op) => op[0] === "set" && op[2] === "text" && op[3] === text);
const since = (mark: number, op: string, kind?: string) =>
  ops.slice(mark).filter((o) => o[0] === op && (!kind || o[2] === kind));
const click = (id: number) => g.__nuclo_event(id, "click");

const [tabs] = created("tabs");
const [home, explore, , profile] = created("stack");
const [feed] = created("screen");
const contentHeight = () => ops.findLast((op) => op[0] === "frame" && op[1] === feed)![5] as number;

test("four tabs in a bottom bar, each its own stack", () => {
  expect(created("stack").map(parentOf)).toEqual([tabs, tabs, tabs, tabs]);
  expect(["home", "search", "bell", "person"].map((icon) => ops.some((op) => op[0] === "set" && op[2] === "icon" && op[3] === icon))).toEqual([true, true, true, true]);
});

test("a like rebuilds that post wherever it shows", () => {
  g.__nuclo_event(feed, "resize", "375 800 3");
  const heart = ops.find((op) => op[0] === "set" && op[2] === "text" && op[3] === "♡")![1]; // the feed's first post
  const mark = ops.length;
  click(parentOf(heart));
  expect(since(mark, "set").some((op) => op[3] === "♥")).toBe(true);
  // Post 0 is the signed-in user's: its row on the feed and on the Profile tab.
  expect(since(mark, "remove").length).toBe(2);
});

test("the feed loads the next page near its end", () => {
  const byline = (id: number) => `${user(id).handle} · ${id + 1}m`;
  expect([shows(byline(19)), shows(byline(20))]).toEqual([true, false]);
  g.__nuclo_event(feed, "scroll", `${contentHeight() - 800 - 200} 800`);
  expect(shows(byline(20))).toBe(true);
  expect(shows("Loading more…")).toBe(true);
});

test("friends of friends push forever, and a native back pops them all", () => {
  router.reset("/me");
  expect(router.path).toBe("/me");
  let at = 0;
  for (let hop = 0; hop < 12; hop++) {
    // The header's "N friends" link, then the first friend's row.
    click(textId(`${friendsOf(at).length} friends`));
    expect(router.path).toBe(`/user/${at}/friends`);
    const next = friendsOf(at)[0];
    click(parentOf(parentOf(textId(user(next).name))));
    expect(router.path).toBe(`/user/${next}`);
    at = next;
  }
  expect(ops.some((op) => op[0] === "set" && op[2] === "title" && op[3] === user(at).name)).toBe(true);

  const mark = ops.length;
  g.__nuclo_event(profile, "pop", 1);
  expect(router.path).toBe("/me");
  expect(since(mark, "remove").length).toBe(24);
});

test("adding a friend updates both profiles", () => {
  router.go("/user/42");
  expect(user(42).friend).toBe(false);
  click(parentOf(textId("Add friend")));
  expect(user(42).friend).toBe(true);
  expect(friendsOf(42)).toContain(0);
  router.back();
  expect(shows(`${friendsOf(0).length} friends`)).toBe(true);
});

test("an opened video post plays its clip in the platform's player", () => {
  const mark = ops.length;
  router.go("/post/4");
  const [player] = since(mark, "create", "video").map((op) => op[1]);
  expect(ops).toContainEqual(["set", player, "src", "assets/lagoon.mp4"]);
  router.back();
});

test("a post's media opens a third level: post → photo", () => {
  g.__nuclo_event(tabs, "select", 0);
  router.go("/post/1");
  router.go("/media/1/0");
  expect(router.path).toBe("/media/1/0");
  expect(ops.some((op) => op[0] === "set" && op[2] === "title" && op[3] === "Photo")).toBe(true);
  g.__nuclo_event(home, "pop", 1);
  expect(router.path).toBe("/");
  expect(explore).toBeGreaterThan(0);
});
