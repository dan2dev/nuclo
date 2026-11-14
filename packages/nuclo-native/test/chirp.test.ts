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
const { api, network, notice, paged, flip, latest } = await import("../examples/chirp/api");
// The server answers on the next timer, in the order asked, unless a test says otherwise.
network.latency = 0;
const { router } = await import("../examples/chirp/app");
const { POSTS, friendsOf, post, searchUsers, user, handleFree } = await import("../examples/chirp/data");
const { feed } = await import("../examples/chirp/views");

/** Until the server has answered everything asked so far. */
const answered = (ms = 5) => new Promise((resolve) => setTimeout(resolve, ms));

const created = (kind: string) => ops.filter((op) => op[0] === "create" && op[2] === kind).map((op) => op[1]);
const textId = (text: string) => ops.findLast((op) => op[0] === "set" && op[2] === "text" && op[3] === text)![1];
const parentOf = (id: number) => ops.findLast((op) => op[0] === "insert" && op[2] === id)![1];
const shows = (text: string, from = 0) => ops.slice(from).some((op) => op[0] === "set" && op[2] === "text" && op[3] === text);
const since = (mark: number, op: string, kind?: string) =>
  ops.slice(mark).filter((o) => o[0] === op && (!kind || o[2] === kind));
const click = (id: number) => g.__nuclo_event(id, "click");
/** Types into the input created last with this placeholder. */
const type = (placeholder: string, value: string) =>
  g.__nuclo_event(ops.findLast((op) => op[0] === "set" && op[2] === "placeholder" && op[3] === placeholder)![1], "input", value);

const [tabs] = created("tabs");
const [home, explore, , profile] = created("stack");
const [feedScreen] = created("screen");
const contentHeight = () => ops.findLast((op) => op[0] === "frame" && op[1] === feedScreen)![5] as number;
const byline = (id: number) => `${user(id % 100_000).handle} · ${post(id).ago}`;

test("four tabs in a bottom bar, each its own stack", () => {
  expect(created("stack").map(parentOf)).toEqual([tabs, tabs, tabs, tabs]);
  expect(["home", "search", "bell", "person"].map((icon) => ops.some((op) => op[0] === "set" && op[2] === "icon" && op[3] === icon))).toEqual([true, true, true, true]);
});

test("the feed shows it is loading, then its first page", async () => {
  g.__nuclo_event(feedScreen, "resize", "375 800 3");
  expect(shows("Loading…")).toBe(true);
  await answered();
  expect([shows(byline(0)), shows(byline(20)), feed.ids.length]).toEqual([true, false, 20]);
});

test("a like shows at once, wherever the post is", async () => {
  const heart = ops.find((op) => op[0] === "set" && op[2] === "text" && op[3] === "♡")![1]; // the feed's first post
  const mark = ops.length;
  click(parentOf(heart));
  expect(since(mark, "set").some((op) => op[3] === "♥")).toBe(true);
  expect(post(0).liked).toBe(true);
  await answered();
});

test("the feed loads the next page near its end, once however often it is asked", async () => {
  g.__nuclo_event(feedScreen, "scroll", `${contentHeight() - 800 - 200} 800`);
  feed.load();
  feed.load();
  await answered();
  expect([shows(byline(20)), feed.ids.length]).toEqual([true, 40]);
});

test("a page that fails says so, and a tap asks again", async () => {
  const fetches: (() => void)[] = [];
  const list = paged(() => new Promise((resolve, reject) => fetches.push(() => (fetches.length === 1 ? reject(new Error()) : resolve({ ids: [1], done: true })))));
  list.load();
  fetches[0]();
  await answered();
  expect([list.failed, list.loading, list.ids]).toEqual([true, false, []]);
  list.load();
  fetches[1]();
  await answered();
  expect([list.failed, list.done, list.ids]).toEqual([false, true, [1]]);
});

test("a reply to a list that was reset meanwhile is dropped", async () => {
  const replies: ((ids: number[]) => void)[] = [];
  const list = paged(() => new Promise((resolve) => replies.push((ids) => resolve({ ids, done: true }))));
  list.load();
  list.reset();
  replies[1]([2]); // the newer request answers first
  replies[0]([1]);
  await answered();
  expect(list.ids).toEqual([2]);
});

test("only the latest request of a kind counts, whatever order they answer in", async () => {
  const got: string[] = [];
  const only = latest();
  const slow = new Promise<string>((resolve) => setTimeout(() => resolve("old"), 10));
  only(slow, (value) => got.push(value));
  only(Promise.resolve("new"), (value) => got.push(value));
  await answered(20);
  expect(got).toEqual(["new"]);
});

test("a switch flipped while its request is out ends where the user left it", async () => {
  const sent: boolean[] = [];
  let shown = false;
  const send = (on: boolean) => new Promise<void>((resolve) => (sent.push(on), setTimeout(resolve, 5)));
  const set = (on: boolean) => flip("test", on, (now) => (shown = now), send, "it");
  set(true);
  set(false);
  set(true);
  set(false);
  await answered(30);
  // One request at a time: the first, then one more for where it ended.
  expect([sent, shown]).toEqual([[true, false], false]);
});

test("a change the server refuses is undone, with a notice", async () => {
  let shown = false;
  flip("refused", true, (now) => (shown = now), () => Promise.reject(new Error()), "your like");
  expect(shown).toBe(true);
  await answered();
  expect(shown).toBe(false);
  expect(notice.text).toBe("Couldn't reach Chirp: your like was undone.");
});

test("a new post is checked, sent once, and tops the feed", async () => {
  router.go("/compose");
  expect(router.path).toBe("/compose");
  type("What's happening?", "x".repeat(281));
  expect(shows("That's too long to post.")).toBe(true);
  type("What's happening?", "Hello from the test");
  const button = parentOf(textId("Post"));
  click(button);
  click(button); // while the first is out
  expect(shows("Posting…")).toBe(true);
  await answered();
  expect(router.path).toBe("/");
  expect(feed.ids.slice(0, 2)).toEqual([-1, 0]);
  expect(shows("Hello from the test")).toBe(true);
  // The next page continues after the last post, wherever the new one went.
  feed.load();
  await answered();
  expect(new Set(feed.ids).size).toBe(feed.ids.length);
});

test("a post that comes back after the user left its form does not move them", async () => {
  router.go("/compose");
  type("What's happening?", "Sent, then left");
  click(parentOf(textId("Post")));
  router.back();
  router.go("/post/3");
  await answered();
  expect(router.path).toBe("/post/3");
  expect(feed.ids[0]).toBe(-2);
  router.back();
});

test("a thread loads its replies, and a reply sent shows in it", async () => {
  router.go("/post/7");
  expect(shows("Loading replies…")).toBe(true);
  await answered();
  const replies = post(7).replies;
  type("Post your reply", "Nice one");
  click(parentOf(textId("Reply")));
  await answered();
  expect(shows("Nice one")).toBe(true);
  expect(post(7).replies).toBe(replies + 1);
  router.back();
});

test("friends of friends push forever, and a native back pops them all", async () => {
  router.reset("/me");
  expect(router.path).toBe("/me");
  let at = 0;
  for (let hop = 0; hop < 6; hop++) {
    // The header's "N friends" link, then the first friend's row.
    click(textId(`${friendsOf(at).length} friends`));
    expect(router.path).toBe(`/user/${at}/friends`);
    await answered();
    const next = friendsOf(at)[0];
    click(parentOf(parentOf(textId(user(next).name))));
    expect(router.path).toBe(`/user/${next}`);
    at = next;
  }
  expect(ops.some((op) => op[0] === "set" && op[2] === "title" && op[3] === user(at).name)).toBe(true);

  const mark = ops.length;
  g.__nuclo_event(profile, "pop", 1);
  expect(router.path).toBe("/me");
  expect(since(mark, "remove").length).toBe(12);
});

test("the profile form checks the handle with the server and saves", async () => {
  router.go("/me/edit");
  const mark = ops.length;
  const input = (value: string) => ops.findLast((op) => op[0] === "set" && op[2] === "value" && op[3] === value)![1];
  const handle = input("@you");
  g.__nuclo_event(handle, "input", "@ab");
  expect(shows("@, then 3 to 20 letters, then up to 4 digits.")).toBe(true);
  // Typed quickly: only the handle the user ended on is asked about, and only its answer shows.
  g.__nuclo_event(handle, "input", "@avasilva");
  g.__nuclo_event(handle, "input", "@nuclofan");
  await answered(300);
  expect([shows("That handle is taken."), shows("✓ Available")]).toEqual([false, true]);
  g.__nuclo_event(handle, "input", "@avasilva");
  await answered(300);
  expect(shows("That handle is taken.")).toBe(true);
  g.__nuclo_event(handle, "input", "@nuclofan");
  g.__nuclo_event(input("You"), "input", "Nuclo Fan");
  await answered(300);
  click(parentOf(textId("Save")));
  await answered();
  expect(router.path).toBe("/me");
  expect([user(0).name, user(0).handle]).toEqual(["Nuclo Fan", "@nuclofan"]);
  expect(shows("Nuclo Fan")).toBe(true);
  // Their posts carry the new handle too, not only the header.
  expect(ops.slice(mark).some((op) => op[0] === "set" && String(op[3]).startsWith("@nuclofan · "))).toBe(true);
});

test("the search asks once the typing pauses, and shows the last query's people", async () => {
  g.__nuclo_event(tabs, "select", 1);
  const mark = ops.length;
  type("Search 100,000 people", "z");
  type("Search 100,000 people", "za");
  type("Search 100,000 people", "zane kim");
  await answered(300);
  expect(shows('People matching "zane kim"', mark)).toBe(true);
  expect(shows('People matching "za"', mark)).toBe(false);
  const found = searchUsers("zane kim", 0, 20);
  expect(found.total).toBe(100);
  expect(found.ids.every((id) => user(id).name === "Zane Kim")).toBe(true);
  expect(shows(user(found.ids[0]).handle + " · " + user(found.ids[0]).location, mark)).toBe(true);
});

test("the settings slow the server down and make it fail", async () => {
  g.__nuclo_event(tabs, "select", 3);
  router.go("/me/settings");
  click(parentOf(textId("Slow")));
  expect(network.latency).toBe(1500);
  click(parentOf(textId("Instant")));
  expect(network.latency).toBe(0);
  router.back();
});

test("the database makes records on demand: a million posts cost nothing until read", () => {
  expect(POSTS).toBe(1_000_000);
  expect(post(999_999).author).toBe(99_999);
  expect(handleFree(user(99_999).handle)).toBe(false);
  expect(handleFree("@nobodyhasthis")).toBe(true);
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
  expect(api).toBeDefined();
});
