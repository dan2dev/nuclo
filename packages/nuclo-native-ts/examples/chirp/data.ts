// Chirp's database, in place of a server's: 100,000 users, a friend graph and a million posts. Nothing is stored
// until it is read: a record is made from its id, so the whole network costs only the records a screen has shown.
// Records are not changed in place: a change swaps in a new one, so every keyed list showing it rebuilds that row.
// Only api.ts reads the lists here; the screens read single records, which stand for the client's cache.
import type { Int } from "../../src/index.ts";

export interface User {
  id: Int;
  name: string;
  handle: string;
  bio: string;
  location: string;
  joined: Int;
  followers: Int;
  tint: string;
  /** A friend of the signed-in user. */
  friend: boolean;
}

/** A post's photos or video (a video is its poster natively: there is no player). */
export interface Media {
  kind: "none" | "photos" | "video";
  srcs: string[];
  poster: string;
  length: string;
}

export interface Post {
  id: Int;
  author: Int;
  text: string;
  topic: string;
  media: Media;
  ago: string;
  replies: Int;
  reposts: Int;
  likes: Int;
  liked: boolean;
  reposted: boolean;
}

export interface Reply {
  author: Int;
  text: string;
}

export const ME = 0;
export const USERS = 100000;
export const POSTS = 1000000;

const firsts = [
  "Ava", "Ben", "Chloe", "Diego", "Emma", "Felix", "Grace", "Hugo", "Iris", "Jonah", "Kira", "Leo", "Maya", "Noah", "Olive", "Pablo",
  "Quinn", "Rosa", "Sami", "Tara", "Uma", "Victor", "Wren", "Xavi", "Yara", "Zane", "Aiko", "Bruno", "Carmen", "Dmitri", "Elif", "Farid",
  "Greta", "Hana", "Ines", "Jamal", "Keiko", "Luca", "Mina", "Nuno",
];
const lasts = [
  "Silva", "Kim", "Okafor", "Novak", "Haddad", "Larsen", "Moreau", "Tanaka", "Rossi", "Patel", "Weber", "Costa", "Ahmed", "Brandt", "Cruz",
  "Dubois", "Eze", "Fischer", "Garcia", "Huang", "Ivanov", "Jensen", "Khan", "Lopez", "Mbeki",
];
/** Distinct names: user ids a whole number of these apart share one, and differ by the number on their handle. */
const NAMES = firsts.length * lasts.length;
const bios = [
  "Coffee, code and long walks.",
  "Film photographer. Mostly 35mm, sometimes medium format.",
  "Building tiny apps that do one thing well.",
  "Trail runner and amateur baker.",
  "Designing for humans since 2014.",
  "Plants, pixels and podcasts.",
  "Maps, trains and anything with a timetable.",
  "Writes release notes people actually read.",
  "Part-time DJ, full-time spreadsheet enjoyer.",
  "Teaching my kids to solder.",
];
const places = ["Lisbon", "Seoul", "Lagos", "Prague", "Beirut", "Oslo", "Lyon", "Osaka", "Milan", "Pune", "Berlin", "Porto", "Cairo", "Austin", "Lima"];
export const tints = ["#4f46e5", "#0891b2", "#16a34a", "#ea580c", "#db2777", "#7c3aed", "#ca8a04", "#2563eb"];
const pictures = ["aurora", "dunes", "lagoon", "forest", "ember", "glacier"];
export const photos = ["assets/aurora.jpg", "assets/dunes.jpg", "assets/lagoon.jpg", "assets/forest.jpg", "assets/ember.jpg", "assets/glacier.jpg"];
export const topics = ["nuclo", "native", "photography", "running", "design", "coffee", "travel", "music"];
const openers = [
  "Shipped the thing.",
  "Hot take:",
  "Sunrise from the ridge this morning.",
  "Rewrote it in half the lines and it's faster.",
  "Note to self:",
  "New camera roll just dropped.",
  "Reading list for the weekend:",
  "Unpopular opinion:",
  "Quick clip from today's ride.",
  "Three years in and",
  "Overheard at the café:",
  "Finally",
];
const middles = [
  "now the real work starts.",
  "the best UI is the one you never notice.",
  "worth the 5am alarm.",
  "deleting code is the best feeling.",
  "tiny ideas deserve a notebook too.",
  "three papers and one very long novel.",
  "a list of ten items never needs a spinner.",
  "native widgets from one codebase still feel like magic.",
  "the second espresso was a mistake.",
  "the slow route had the better view.",
  "the b-side is better than the single.",
  "I should have started with the boring version.",
  "nobody reads the settings screen.",
];

export const picture = (id: Int) => `assets/${pictures[id % pictures.length]!}.jpg`;

// ponytail: records made from their id are kept for good; a long session holds what it has shown (an LRU if that matters).
const users: Record<string, User> = {};
const posts: Record<string, Post> = {};

// Friends are symmetric: i and i ± d for every d. Every user has eight, so friends of friends never run out.
const steps: Int[] = [1, 13, 97, 211];
function base(id: Int): Int[] {
  const out: Int[] = [];
  for (let i = 0; i < steps.length; i++) {
    const d: Int = steps[i]!;
    out.push((id + d) % USERS);
    out.push((id - d + USERS) % USERS);
  }
  return out;
}
const myFriends: Int[] = base(ME);
const isMyFriend = (id: Int) => myFriends.includes(id);

/** A user's friends, the signed-in user's own changes included. */
export function friendsOf(id: Int): Int[] {
  if (id === ME) return myFriends.slice();
  const out = base(id).filter((f) => f !== ME);
  if (isMyFriend(id)) out.push(ME);
  return out;
}

const firstOf = (id: Int) => firsts[id % firsts.length]!;
const lastOf = (id: Int) => lasts[Math.floor(id / firsts.length) % lasts.length]!;
const nameOf = (id: Int) => `${firstOf(id)} ${lastOf(id)}`;
function handleOf(id: Int): string {
  const round = Math.floor(id / NAMES);
  return `@${firstOf(id)}${lastOf(id)}${round > 0 ? String(round + 1) : ""}`.toLowerCase();
}

function makeUser(id: Int): User {
  return {
    id,
    name: id === ME ? "You" : nameOf(id),
    handle: id === ME ? "@you" : handleOf(id),
    bio: id === ME ? "Trying out nuclo-native-ts." : bios[(id * 5 + Math.floor(id / 7)) % bios.length]!,
    location: places[(id * 3) % places.length]!,
    joined: 2012 + (id % 14),
    followers: (id * 7919 + 321) % 90000,
    tint: tints[id % tints.length]!,
    friend: isMyFriend(id),
  };
}

export function user(id: Int): User {
  const hit = users[String(id)];
  if (hit) return hit;
  const made = makeUser(id);
  users[String(id)] = made;
  return made;
}

/** A user record with its own identity: lists showing the old one rebuild that row. */
function copyUser(u: User): User {
  return { id: u.id, name: u.name, handle: u.handle, bio: u.bio, location: u.location, joined: u.joined, followers: u.followers, tint: u.tint, friend: u.friend };
}

export function setFriend(id: Int, on: boolean) {
  const at = myFriends.indexOf(id);
  if (on && at < 0) myFriends.push(id);
  if (!on && at >= 0) myFriends.splice(at, 1);
  const u = copyUser(user(id));
  u.friend = on;
  users[String(id)] = u;
  // The signed-in user's friend count changed: their header rebuilds too.
  users[String(ME)] = copyUser(user(ME));
}

export interface Profile {
  name: string;
  handle: string;
  bio: string;
  location: string;
  tint: string;
}

export function saveProfile(profile: Profile) {
  const u = copyUser(user(ME));
  u.name = profile.name;
  u.handle = profile.handle;
  u.bio = profile.bio;
  u.location = profile.location;
  u.tint = profile.tint;
  users[String(ME)] = u;
  // Their posts show their name and colour: the rows rebuild.
  for (const id of mine) posts[String(id)] = copyPost(post(id));
}

const LETTERS = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";

/** Whether a handle is free: the signed-in user's own, or one no generated user has. */
export function handleFree(handle: string): boolean {
  if (handle === user(ME).handle) return true;
  let at = 1;
  while (at < handle.length && LETTERS.includes(handle.slice(at, at + 1))) at++;
  const letters = handle.slice(1, at);
  const number = handle.slice(at);
  if (!handle.startsWith("@") || letters.length === 0) return false;
  const round = number.length > 0 ? Number(number) - 1 : 0;
  if (round < 0 || (number.length > 0 && round === 0) || round >= USERS / NAMES) return true;
  for (let id = 1; id <= NAMES; id++) if (handleOf(id % NAMES) === `@${letters}`) return false;
  return true;
}

/** Whether a handle has the right shape: @, 3 to 20 letters, up to 4 digits. */
export function handleShaped(handle: string): boolean {
  if (!handle.startsWith("@")) return false;
  let at = 1;
  while (at < handle.length && LETTERS.includes(handle.slice(at, at + 1))) at++;
  const letters = at - 1;
  let digits = 0;
  while (at < handle.length && DIGITS.includes(handle.slice(at, at + 1))) {
    at++;
    digits++;
  }
  return at === handle.length && letters >= 3 && letters <= 20 && digits <= 4;
}

export interface Found {
  ids: Int[];
  total: number;
}

/**
 * The ids of the users whose name or handle has `query`, `limit` of them from the `offset`th, and how many there
 * are. Names repeat every NAMES ids, so the matching names are found once and counted out, not searched for.
 */
export function searchUsers(query: string, offset: Int, limit: Int): Found {
  let q = query.trim().toLowerCase();
  if (q.startsWith("@")) q = q.slice(1);
  const names: Int[] = [];
  for (let id = 0; id < NAMES; id++) if (q.length === 0 || nameOf(id).toLowerCase().includes(q) || handleOf(id).includes(q)) names.push(id);
  const total = names.length * (USERS / NAMES);
  const ids: Int[] = [];
  let k = offset;
  while (k < total && ids.length < limit) {
    const id = Math.floor(k / names.length) * NAMES + names[k % names.length]!;
    if (id !== ME) ids.push(id);
    k++;
  }
  return { ids: ids.slice(), total };
}

// ── Posts ──────────────────────────────────────────────────────────────────

/** The signed-in user's own posts, newest first: their ids run down from -1, above the generated ones. */
const mine: Int[] = [];
/** Replies written here, by post, on top of the generated ones. */
const written: Record<string, Reply[]> = {};

/** Post ids run newest first; user `a` wrote posts a, a + USERS, a + 2 × USERS… */
export const authorOf = (id: Int) => (id < 0 ? ME : id % USERS);
export const postCount = (author: Int) => Math.ceil((POSTS - author) / USERS) + (author === ME ? mine.length : 0);
export function postsBy(author: Int): Int[] {
  const out = author === ME ? mine.slice() : [];
  const count = Math.ceil((POSTS - author) / USERS);
  for (let k = 0; k < count; k++) out.push(author + k * USERS);
  return out;
}

/** The feed after the post `after` (-1: from the newest), `limit` of them: the signed-in user's own, then the rest. */
export function feedAfter(after: Int, limit: Int, first: boolean): Int[] {
  const ids: Int[] = [];
  let at = first ? 0 : after < 0 ? mine.indexOf(after) + 1 : -1;
  if (at >= 0) {
    while (at < mine.length && ids.length < limit) {
      ids.push(mine[at]!);
      at++;
    }
  }
  let id = first || after < 0 ? 0 : after + 1;
  while (id < POSTS && ids.length < limit) {
    ids.push(id);
    id++;
  }
  return ids;
}

const topicOf = (id: Int) => topics[(id * 5 + Math.floor(id / 9)) % topics.length]!;

/** The generated posts on a topic after `after`, newest first. Topics repeat every 72 ids, so few are skipped. */
export function topicAfter(topic: string, after: Int, limit: Int): Int[] {
  const ids: Int[] = [];
  let id = after + 1;
  while (id < POSTS && ids.length < limit) {
    if (topicOf(id) === topic) ids.push(id);
    id++;
  }
  return ids;
}

const capital = (text: string) => text.slice(0, 1).toUpperCase() + text.slice(1);
/** An opener and what follows it: a new sentence after a full stop. */
const sentence = (opener: string, rest: string) => `${opener} ${opener.endsWith(".") ? capital(rest) : rest}`;

const clips = ["aurora", "lagoon", "forest"];
const none = (): Media => ({ kind: "none", srcs: [], poster: "", length: "" });

function mediaOf(id: Int): Media {
  const kind = id % 5;
  if (kind === 1) return { kind: "photos", srcs: [photos[id % photos.length]!], poster: "", length: "" };
  if (kind === 3) return { kind: "photos", srcs: [photos[id % photos.length]!, photos[(id + 1) % photos.length]!], poster: "", length: "" };
  if (kind === 4) return { kind: "video", srcs: [], poster: `assets/${clips[id % clips.length]!}.jpg`, length: "0:06" };
  return none();
}

function makePost(id: Int): Post {
  const topic = topicOf(id);
  return {
    id,
    author: authorOf(id),
    text: `${sentence(openers[(id * 7 + Math.floor(id / USERS)) % openers.length]!, middles[(id * 11 + Math.floor(id / 13)) % middles.length]!)} #${topic}`,
    topic,
    media: mediaOf(id),
    ago: id < 60 ? `${id + 1}m` : id < 1440 ? `${Math.floor(id / 60)}h` : `${Math.floor(id / 1440)}d`,
    replies: (id * 31) % 40,
    reposts: (id * 17) % 120,
    likes: (id * 7919 + 1234) % 2400,
    liked: false,
    reposted: false,
  };
}

export function post(id: Int): Post {
  const hit = posts[String(id)];
  if (hit) return hit;
  const made = makePost(id);
  posts[String(id)] = made;
  return made;
}

function copyPost(p: Post): Post {
  return {
    id: p.id, author: p.author, text: p.text, topic: p.topic, media: p.media, ago: p.ago,
    replies: p.replies, reposts: p.reposts, likes: p.likes, liked: p.liked, reposted: p.reposted,
  };
}

export interface Draft {
  text: string;
  photo: string;
  topic: string;
}

/** The signed-in user's new post: the newest of the feed. */
export function createPost(draft: Draft): number {
  const id = -(mine.length + 1);
  posts[String(id)] = {
    id,
    author: ME,
    text: draft.topic.length > 0 ? `${draft.text} #${draft.topic}` : draft.text,
    topic: draft.topic,
    media: draft.photo.length > 0 ? { kind: "photos", srcs: [draft.photo], poster: "", length: "" } : none(),
    ago: "now",
    replies: 0,
    reposts: 0,
    likes: 0,
    liked: false,
    reposted: false,
  };
  mine.unshift(id);
  users[String(ME)] = copyUser(user(ME)); // their post count changed
  return id;
}

export function setLiked(id: Int, on: boolean) {
  const p = post(id);
  if (p.liked === on) return;
  const next = copyPost(p);
  next.liked = on;
  next.likes = p.likes + (on ? 1 : -1);
  posts[String(id)] = next;
}

export function setReposted(id: Int, on: boolean) {
  const p = post(id);
  if (p.reposted === on) return;
  const next = copyPost(p);
  next.reposted = on;
  next.reposts = p.reposts + (on ? 1 : -1);
  posts[String(id)] = next;
}

/** Replies: the ones written here, then other posts' texts by the author's friends, enough to walk the graph from a thread. */
export function repliesTo(id: Int): Reply[] {
  const out = (written[String(id)] ?? []).slice();
  if (id < 0) return out;
  const friends = friendsOf(authorOf(id)).slice(0, Math.min(6, (id * 31) % 40));
  for (let k = 0; k < friends.length; k++) out.push({ author: friends[k]!, text: capital(middles[(id + k * 3 + 1) % middles.length]!) });
  return out;
}

export function addReply(id: Int, text: string) {
  const list = (written[String(id)] ?? []).slice();
  list.unshift({ author: ME, text });
  written[String(id)] = list.slice();
  const next = copyPost(post(id));
  next.replies = next.replies + 1;
  posts[String(id)] = next;
}

/** Who liked a post: a slice of the user list, long enough to scroll. */
export function likersOf(id: Int, offset: Int, limit: Int): Int[] {
  const out: Int[] = [];
  const count = Math.max(0, Math.min(limit, post(id).likes - offset));
  for (let k = 0; k < count; k++) out.push((Math.abs(id) * 3 + (offset + k) * 7 + 1) % USERS);
  return out;
}

export interface Alert {
  id: Int;
  who: Int;
  what: "liked" | "reposted" | "friended";
  post: Int;
}

export const ALERTS = 2000;
export function alertAt(k: Int): Alert {
  const who = (k * 37 + 5) % USERS;
  return { id: k, who: who === 0 ? 1 : who, what: k % 3 === 0 ? "liked" : k % 3 === 1 ? "reposted" : "friended", post: ME + (k % 10) * USERS };
}
