// Chirp's database, in place of a server's: 100,000 users, a friend graph and a million posts. Nothing is stored
// until it is read: a record is made from its id, so the whole network costs only the records a screen has shown.
// Records are immutable; a change swaps in a new one, so every keyed list showing it rebuilds that row.
// Only api.ts reads the lists here; the screens read single records, which stand for the client's cache.

export interface User {
  id: number;
  name: string;
  handle: string;
  bio: string;
  location: string;
  joined: number;
  followers: number;
  tint: string;
  /** A friend of the signed-in user. */
  friend: boolean;
}

export type Media =
  | { kind: "none" }
  | { kind: "photos"; srcs: string[] }
  | { kind: "video"; src: string; poster: string; length: string };

export interface Post {
  id: number;
  author: number;
  text: string;
  topic: string;
  media: Media;
  ago: string;
  replies: number;
  reposts: number;
  likes: number;
  liked: boolean;
  reposted: boolean;
}

export interface Reply {
  author: number;
  text: string;
}

export const ME = 0;
export const USERS = 100_000;
export const POSTS = 1_000_000;

const firsts =
  "Ava Ben Chloe Diego Emma Felix Grace Hugo Iris Jonah Kira Leo Maya Noah Olive Pablo Quinn Rosa Sami Tara Uma Victor Wren Xavi Yara Zane Aiko Bruno Carmen Dmitri Elif Farid Greta Hana Ines Jamal Keiko Luca Mina Nuno".split(
    " ",
  );
const lasts =
  "Silva Kim Okafor Novak Haddad Larsen Moreau Tanaka Rossi Patel Weber Costa Ahmed Brandt Cruz Dubois Eze Fischer Garcia Huang Ivanov Jensen Khan Lopez Mbeki".split(
    " ",
  );
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
const places = "Lisbon Seoul Lagos Prague Beirut Oslo Lyon Osaka Milan Pune Berlin Porto Cairo Austin Lima".split(" ");
export const tints = ["#4f46e5", "#0891b2", "#16a34a", "#ea580c", "#db2777", "#7c3aed", "#ca8a04", "#2563eb"];
export const photos = ["aurora", "dunes", "lagoon", "forest", "ember", "glacier"].map((name) => `assets/${name}.jpg`);
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

/**
 * Records by id. One made from its id is kept only while lately made: made again, it says the same. One changed
 * here is kept for good. So what the database holds follows what is on screen and what the user did, not how far
 * they have scrolled.
 */
class Records<T> {
  private made = new Map<number, T>();
  private changed = new Map<number, T>();
  get(id: number, make: () => T) {
    let record = this.changed.get(id) ?? this.made.get(id);
    if (!record) {
      // ponytail: the oldest quarter goes when full; a row still showing one of them is rebuilt once.
      if (this.made.size >= 4096) for (const old of [...this.made.keys()].slice(0, 1024)) this.made.delete(old);
      this.made.set(id, (record = make()));
    }
    return record;
  }
  set(id: number, record: T) {
    this.made.delete(id);
    this.changed.set(id, record);
  }
  /** The records held now. */
  all = () => [...this.made, ...this.changed];
}
const users = new Records<User>();
const posts = new Records<Post>();

// Friends are symmetric: i and i ± d for every d. Every user has eight, so friends of friends never run out.
const steps = [1, 13, 97, 211];
const base = (id: number) => steps.flatMap((d) => [(id + d) % USERS, (id - d + USERS) % USERS]);
const myFriends = new Set(base(ME));

/** A user's friends, the signed-in user's own changes included. */
export const friendsOf = (id: number) =>
  id === ME ? [...myFriends] : [...base(id).filter((f) => f !== ME), ...(myFriends.has(id) ? [ME] : [])];

const nameOf = (id: number) => `${firsts[id % firsts.length]} ${lasts[Math.floor(id / firsts.length) % lasts.length]}`;
const handleOf = (id: number) => {
  const round = Math.floor(id / NAMES);
  return `@${nameOf(id).replace(" ", "")}${round ? round + 1 : ""}`.toLowerCase();
};

export const user = (id: number): User =>
  users.get(id, () => ({
    id,
    name: id === ME ? "You" : nameOf(id),
    handle: id === ME ? "@you" : handleOf(id),
    bio: id === ME ? "Trying out nuclo-native." : bios[(id * 5 + Math.floor(id / 7)) % bios.length],
    location: places[(id * 3) % places.length],
    joined: 2012 + (id % 14),
    followers: (id * 7919 + 321) % 90_000,
    tint: tints[id % tints.length],
    friend: myFriends.has(id),
  }));

export function setFriend(id: number, on: boolean) {
  if (on) myFriends.add(id);
  else myFriends.delete(id);
  users.set(id, { ...user(id), friend: on });
  users.set(ME, { ...user(ME) }); // the signed-in user's friend count changed: rebuild their header too
}

export type Profile = Pick<User, "name" | "handle" | "bio" | "location" | "tint">;

export function saveProfile(profile: Profile) {
  users.set(ME, { ...user(ME), ...profile });
  // Their posts show their name and colour: the rows rebuild.
  for (const [id, p] of posts.all()) if (p.author === ME) posts.set(id, { ...p });
}

/** Whether a handle is free: the signed-in user's own, or one no generated user has. */
export function handleFree(handle: string) {
  if (handle === user(ME).handle) return true;
  const [, name, number] = /^@([a-z]+)(\d*)$/.exec(handle) ?? [];
  if (!name) return false;
  const round = number ? Number(number) - 1 : 0;
  if (round < 0 || (number && round === 0) || round >= USERS / NAMES) return true;
  for (let id = 1; id <= NAMES; id++) if (handleOf(id % NAMES) === `@${name}`) return false;
  return true;
}

/**
 * The ids of the users whose name or handle has `query`, `limit` of them from the `offset`th, and how many there
 * are. Names repeat every NAMES ids, so the matching names are found once and counted out, not searched for.
 */
export function searchUsers(query: string, offset: number, limit: number) {
  const q = query.trim().toLowerCase().replace(/^@/, "");
  const names: number[] = [];
  for (let id = 0; id < NAMES; id++) if (!q || nameOf(id).toLowerCase().includes(q) || handleOf(id).includes(q)) names.push(id);
  const total = names.length * (USERS / NAMES);
  const ids: number[] = [];
  for (let k = offset; k < total && ids.length < limit; k++) {
    const id = Math.floor(k / names.length) * NAMES + names[k % names.length];
    if (id !== ME) ids.push(id);
  }
  return { ids, total };
}

// ── Posts ──────────────────────────────────────────────────────────────────

/** The signed-in user's own posts, newest first: their ids run down from -1, above the generated ones. */
const mine: number[] = [];
/** Replies written here, by post, on top of the generated ones. */
const written = new Map<number, Reply[]>();

/** Post ids run newest first; user `a` wrote posts a, a + USERS, a + 2 × USERS… */
export const authorOf = (id: number) => (id < 0 ? ME : id % USERS);
export const postCount = (author: number) => Math.ceil((POSTS - author) / USERS) + (author === ME ? mine.length : 0);
export const postsBy = (author: number) => [
  ...(author === ME ? mine : []),
  ...Array.from({ length: Math.ceil((POSTS - author) / USERS) }, (_, k) => author + k * USERS),
];

/** The feed after the post `after` (none: from the newest), `limit` of them: the signed-in user's own, then the rest. */
export function feedAfter(after: number | undefined, limit: number) {
  const ids: number[] = [];
  let at = after === undefined ? 0 : after < 0 ? mine.indexOf(after) + 1 : -1;
  if (at >= 0) while (at < mine.length && ids.length < limit) ids.push(mine[at++]);
  for (let id = after === undefined || after < 0 ? 0 : after + 1; id < POSTS && ids.length < limit; id++) ids.push(id);
  return ids;
}

const topicOf = (id: number) => topics[(id * 5 + Math.floor(id / 9)) % topics.length];

/** The generated posts on a topic after `after`, newest first. Topics repeat every 72 ids, so few are skipped. */
export function topicAfter(topic: string, after: number | undefined, limit: number) {
  const ids: number[] = [];
  for (let id = (after ?? -1) + 1; id < POSTS && ids.length < limit; id++) if (topicOf(id) === topic) ids.push(id);
  return ids;
}

const capital = (text: string) => text.replace(/^./, (c) => c.toUpperCase());
/** An opener and what follows it: a new sentence after a full stop. */
const sentence = (opener: string, rest: string) => `${opener} ${opener.endsWith(".") ? capital(rest) : rest}`;

const clips = ["aurora", "lagoon", "forest"];
const video = (id: number): Media => {
  const clip = clips[id % clips.length];
  return { kind: "video", src: `assets/${clip}.mp4`, poster: `assets/${clip}.jpg`, length: "0:06" };
};

export const post = (id: number): Post =>
  posts.get(id, () => {
    const kind = id % 5;
    const topic = topicOf(id);
    return {
      id,
      author: authorOf(id),
      text: `${sentence(openers[(id * 7 + Math.floor(id / USERS)) % openers.length], middles[(id * 11 + Math.floor(id / 13)) % middles.length])} #${topic}`,
      topic,
      media:
        kind === 1
          ? { kind: "photos", srcs: [photos[id % photos.length]] }
          : kind === 3
            ? { kind: "photos", srcs: [photos[id % photos.length], photos[(id + 1) % photos.length]] }
            : kind === 4
              ? video(id)
              : { kind: "none" },
      ago: id < 60 ? `${id + 1}m` : id < 1440 ? `${Math.floor(id / 60)}h` : `${Math.floor(id / 1440)}d`,
      replies: (id * 31) % 40,
      reposts: (id * 17) % 120,
      likes: (id * 7919 + 1234) % 2_400,
      liked: false,
      reposted: false,
    };
  });

export interface Draft {
  text: string;
  photo: string;
  topic: string;
}

/** The signed-in user's new post: the newest of the feed. */
export function createPost(draft: Draft) {
  const id = -(mine.length + 1);
  posts.set(id, {
    id,
    author: ME,
    text: draft.topic ? `${draft.text} #${draft.topic}` : draft.text,
    topic: draft.topic,
    media: draft.photo ? { kind: "photos", srcs: [draft.photo] } : { kind: "none" },
    ago: "now",
    replies: 0,
    reposts: 0,
    likes: 0,
    liked: false,
    reposted: false,
  });
  mine.unshift(id);
  users.set(ME, { ...user(ME) }); // their post count changed
  return id;
}

export function setLiked(id: number, on: boolean) {
  const p = post(id);
  if (p.liked !== on) posts.set(id, { ...p, liked: on, likes: p.likes + (on ? 1 : -1) });
}

export function setReposted(id: number, on: boolean) {
  const p = post(id);
  if (p.reposted !== on) posts.set(id, { ...p, reposted: on, reposts: p.reposts + (on ? 1 : -1) });
}

/** Replies: the ones written here, then other posts' texts by the author's friends, enough to walk the graph from a thread. */
export const repliesTo = (id: number): Reply[] => [
  ...(written.get(id) ?? []),
  ...(id < 0
    ? []
    : friendsOf(authorOf(id))
        .slice(0, Math.min(6, (id * 31) % 40))
        .map((author, k) => ({ author, text: capital(middles[(id + k * 3 + 1) % middles.length]) }))),
];

export function addReply(id: number, text: string) {
  written.set(id, [{ author: ME, text }, ...(written.get(id) ?? [])]);
  const p = post(id);
  posts.set(id, { ...p, replies: p.replies + 1 });
}

/** Who liked a post: a slice of the user list, long enough to scroll. */
export const likersOf = (id: number, offset: number, limit: number) =>
  Array.from({ length: Math.max(0, Math.min(limit, post(id).likes - offset)) }, (_, k) => (Math.abs(id) * 3 + (offset + k) * 7 + 1) % USERS);

export interface Alert {
  id: number;
  who: number;
  what: "liked" | "reposted" | "friended";
  post: number;
}

export const ALERTS = 2_000;
export const alertAt = (k: number): Alert => ({
  id: k,
  who: (k * 37 + 5) % USERS || 1,
  what: (["liked", "reposted", "friended"] as const)[k % 3],
  post: ME + (k % 10) * USERS,
});
