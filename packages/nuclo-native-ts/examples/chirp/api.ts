// Chirp's server, faked: every call answers later, as a request would, and can fail. Replies take a varying time,
// so two requests can answer out of order: the client side below is written for that.
import { type Int, type Timer, clearTimeout, delay, setTimeout, update } from "../../src/index.ts";
import {
  ALERTS,
  type Draft,
  type Profile,
  type Reply,
  addReply,
  createPost,
  feedAfter,
  friendsOf,
  handleFree,
  likersOf,
  post,
  postsBy,
  repliesTo,
  saveProfile,
  searchUsers,
  setFriend,
  setLiked,
  setReposted,
  topicAfter,
} from "./data.ts";

export interface Network {
  /** A reply's usual delay, in ms. */
  latency: number;
  /** Every third request fails. */
  failing: boolean;
}

/** The network the settings screen sets. */
export const network: Network = { latency: 250, failing: false };

let requests = 0;

/** One request: it answers between half and one and a half times the latency later, or fails. */
async function request(): Promise<void> {
  requests += 1;
  const n = requests;
  await delay(network.latency * (0.5 + ((n * 37) % 100) / 100));
  if (network.failing && n % 3 === 0) throw new Error("Network error");
}

/** A page of a list: its ids, and whether it was the last. */
export interface Page {
  ids: Int[];
  done: boolean;
}

const PAGE = 20;
const page = (ids: Int[]): Page => ({ ids, done: ids.length < PAGE });

// Cursors, not offsets: a post written meanwhile moves every offset, but not what comes after a post.
async function feed(after: Int, first: boolean): Promise<Page> {
  await request();
  return page(feedAfter(after, PAGE, first));
}
async function topic(name: string, after: Int): Promise<Page> {
  await request();
  return page(topicAfter(name, after, PAGE));
}
async function byAuthor(author: Int, mediaOnly: boolean, offset: Int): Promise<Page> {
  await request();
  const all = postsBy(author).filter((id) => !mediaOnly || post(id).media.kind !== "none");
  return page(all.slice(offset, offset + PAGE));
}
async function likers(id: Int, offset: Int): Promise<Page> {
  await request();
  return page(likersOf(id, offset, PAGE));
}
async function people(query: string, offset: Int): Promise<Page> {
  await request();
  const found = searchUsers(query, offset, PAGE);
  return { ids: found.ids, done: offset + PAGE >= found.total };
}
async function friends(id: Int): Promise<Page> {
  await request();
  return { ids: friendsOf(id), done: true };
}
async function alerts(offset: Int): Promise<Page> {
  await request();
  const ids: Int[] = [];
  for (let k = offset; k < Math.min(ALERTS, offset + PAGE); k++) ids.push(k);
  return page(ids);
}

export async function apiReplies(id: Int): Promise<Reply[]> {
  await request();
  return repliesTo(id);
}
export async function apiHandleFree(handle: string): Promise<boolean> {
  await request();
  return handleFree(handle);
}
export async function apiCreatePost(draft: Draft): Promise<number> {
  await request();
  return createPost(draft);
}
export async function apiReply(id: Int, text: string): Promise<void> {
  await request();
  addReply(id, text);
}
export async function apiSaveProfile(profile: Profile): Promise<void> {
  await request();
  saveProfile(profile);
}

// ── The client side: what keeps replies that come late, twice or out of order from showing ─────────────────────

/** A list that loads a page at a time: what it is (`kind`, `key`), what it has, and its request's state. */
export interface Paged {
  kind: "feed" | "topic" | "posts" | "media" | "likers" | "people" | "friends" | "alerts";
  key: string;
  ids: Int[];
  loading: boolean;
  failed: boolean;
  done: boolean;
  /** Bumped by reset(): a reply to an older version is dropped. */
  version: number;
}

export function paged(kind: "feed" | "topic" | "posts" | "media" | "likers" | "people" | "friends" | "alerts", key: string): Paged {
  return { kind, key, ids: [], loading: false, failed: false, done: false, version: 0 };
}

const last = (ids: Int[]) => (ids.length > 0 ? ids[ids.length - 1]! : -1);

async function next(list: Paged): Promise<Page> {
  switch (list.kind) {
    case "feed":
      return await feed(last(list.ids), list.ids.length === 0);
    case "topic":
      return await topic(list.key, last(list.ids));
    case "posts":
      return await byAuthor(parseInt(list.key), false, list.ids.length);
    case "media":
      return await byAuthor(parseInt(list.key), true, list.ids.length);
    case "likers":
      return await likers(parseInt(list.key), list.ids.length);
    case "people":
      return await people(list.key, list.ids.length);
    case "friends":
      return await friends(parseInt(list.key));
    default:
      return await alerts(list.ids.length);
  }
}

/** Loads the next page, unless one is on its way or there is none. */
export function load(list: Paged) {
  if (list.loading || list.done) return;
  list.loading = true;
  list.failed = false;
  fetchInto(list);
}

async function fetchInto(list: Paged): Promise<void> {
  const asked = list.version;
  try {
    const more = await next(list);
    if (asked !== list.version) return;
    // A post the user just wrote is put on top of the feed at once (forms.ts): a page that also has it skips it.
    for (const id of more.ids) if (id >= 0 || !list.ids.includes(id)) list.ids.push(id);
    list.done = more.done;
  } catch (e) {
    if (asked !== list.version) return;
    list.failed = true;
  }
  list.loading = false;
  update();
}

/** Starts over: a reply still on its way to the old list is dropped. */
export function reset(list: Paged) {
  list.version += 1;
  list.ids = [];
  list.loading = false;
  list.failed = false;
  list.done = false;
  load(list);
}

/** What failed last, for a banner; cleared a few seconds later. */
export interface Notice {
  text: string;
}
export const notice: Notice = { text: "" };
let noticeTimer: Timer | null = null;

export function warn(text: string) {
  notice.text = text;
  update();
  if (noticeTimer !== null) clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    notice.text = "";
    update();
  }, 4000);
}

/** Switches the user flipped while their last request was out: what they chose last, and whether one is out. */
const wanted: Record<string, boolean> = {};
const busy: Record<string, boolean> = {};

/** What a switch is, here and on the server. */
function show(kind: "like" | "repost" | "friend", id: Int, on: boolean) {
  if (kind === "like") setLiked(id, on);
  else if (kind === "repost") setReposted(id, on);
  else setFriend(id, on);
}

async function tell(kind: "like" | "repost" | "friend", id: Int, sent: boolean): Promise<void> {
  const key = `${kind}:${id}`;
  try {
    await request();
    show(kind, id, sent);
  } catch (e) {
    busy[key] = false;
    show(kind, id, !sent);
    warn(`Couldn't reach Chirp: ${kind === "like" ? "your like" : kind === "repost" ? "your repost" : "the friend request"} was undone.`);
    return;
  }
  const now = wanted[key] ?? sent;
  if (now !== sent) {
    await tell(kind, id, now);
    return;
  }
  busy[key] = false;
}

/**
 * Shows a switch (a like, a friend) flipped at once and tells the server. One request per switch at a time: flipped
 * again meanwhile, the server is told again once it answers, so it ends where the user left it whatever order the
 * replies come in. A failure puts back what the server has.
 */
export function flip(kind: "like" | "repost" | "friend", id: Int, on: boolean) {
  show(kind, id, on);
  update();
  const key = `${kind}:${id}`;
  wanted[key] = on;
  if (busy[key] === true) return;
  busy[key] = true;
  tell(kind, id, on);
}
