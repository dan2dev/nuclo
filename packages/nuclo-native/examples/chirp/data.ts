// Chirp's data: users, a friend graph and posts, generated on first use in place of a server.
// Stores hand out immutable records; a change swaps in a new one, so every keyed list showing it rebuilds that row.

export interface User {
  id: number;
  name: string;
  handle: string;
  bio: string;
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
  media: Media;
  ago: string;
  replies: number;
  reposts: number;
  likes: number;
  liked: boolean;
  reposted: boolean;
}

export const ME = 0;
export const USERS = 500;
export const POSTS = 5_000;

const firsts = "Ava Ben Chloe Diego Emma Felix Grace Hugo Iris Jonah Kira Leo Maya Noah Olive Pablo Quinn Rosa Sami Tara".split(" ");
const lasts = "Silva Kim Okafor Novak Haddad Larsen Moreau Tanaka Rossi Patel Weber Costa".split(" ");
const bios = [
  "Coffee, code and long walks.",
  "Film photographer. Mostly 35mm, sometimes medium format.",
  "Building tiny apps that do one thing well.",
  "Trail runner and amateur baker.",
  "Designing for humans since 2014.",
  "Plants, pixels and podcasts.",
];
const tints = ["#4f46e5", "#0891b2", "#16a34a", "#ea580c", "#db2777", "#7c3aed", "#ca8a04", "#2563eb"];
const photos = ["aurora", "dunes", "lagoon", "forest", "ember", "glacier"].map((name) => `assets/${name}.jpg`);
const lines = [
  "Shipped the thing. Now the real work starts.",
  "Hot take: the best UI is the one you never notice.",
  "Sunrise from the ridge this morning. Worth the 5am alarm.",
  "Rewrote it in half the lines and it's faster. Deleting code is the best feeling.",
  "Anyone else keep a notebook of tiny ideas that never ship?",
  "New camera roll just dropped.",
  "Reading list for the weekend: three papers and one very long novel.",
  "If your app needs a loading spinner for a list of ten items, something went wrong.",
  "Quick clip from today's ride.",
  "Native widgets, one codebase. Still feels like magic.",
];

const users = new Map<number, User>();
const posts = new Map<number, Post>();

// Friends are symmetric: i and i ± d for every d. Every user has eight, so friends of friends never run out.
const steps = [1, 13, 97, 211];
const base = (id: number) => steps.flatMap((d) => [(id + d) % USERS, (id - d + USERS) % USERS]);
const myFriends = new Set(base(ME));

/** A user's friends, the signed-in user's own changes included. */
export const friendsOf = (id: number) =>
  id === ME ? [...myFriends] : [...base(id).filter((f) => f !== ME), ...(myFriends.has(id) ? [ME] : [])];

export function user(id: number): User {
  let u = users.get(id);
  if (!u) {
    const first = firsts[id % firsts.length];
    const last = lasts[Math.floor(id / firsts.length) % lasts.length];
    const round = Math.floor(id / (firsts.length * lasts.length));
    u = {
      id,
      name: id === ME ? "You" : `${first} ${last}`,
      handle: id === ME ? "@you" : `@${first}${last}${round ? round + 1 : ""}`.toLowerCase(),
      bio: id === ME ? "Trying out nuclo-native." : bios[(id * 5 + Math.floor(id / 7)) % bios.length],
      tint: tints[id % tints.length],
      friend: myFriends.has(id),
    };
    users.set(id, u);
  }
  return u;
}

export function toggleFriend(id: number) {
  const u = user(id);
  if (u.friend) myFriends.delete(id);
  else myFriends.add(id);
  users.set(id, { ...u, friend: !u.friend });
  users.set(ME, { ...user(ME) }); // the signed-in user's friend count changed: rebuild their header too
}

/** Post ids run newest first; user `a` wrote posts a, a + USERS, a + 2 × USERS… */
export const authorOf = (id: number) => id % USERS;
export const postsBy = (author: number) =>
  Array.from({ length: Math.ceil((POSTS - author) / USERS) }, (_, k) => author + k * USERS);

const clips = ["aurora", "lagoon", "forest"];
const video = (id: number): Media => {
  const clip = clips[id % clips.length];
  return { kind: "video", src: `assets/${clip}.mp4`, poster: `assets/${clip}.jpg`, length: "0:06" };
};

export function post(id: number): Post {
  let p = posts.get(id);
  if (!p) {
    const kind = id % 5;
    p = {
      id,
      author: authorOf(id),
      text: lines[(id * 7 + Math.floor(id / USERS)) % lines.length],
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
    posts.set(id, p);
  }
  return p;
}

export function toggleLike(id: number) {
  const p = post(id);
  posts.set(id, { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) });
}

export function toggleRepost(id: number) {
  const p = post(id);
  posts.set(id, { ...p, reposted: !p.reposted, reposts: p.reposts + (p.reposted ? -1 : 1) });
}

/** Replies are other posts' texts by the author's friends: enough to walk the graph from a thread. */
export const repliesTo = (id: number) =>
  friendsOf(authorOf(id))
    .slice(0, Math.min(6, post(id).replies))
    .map((author, k) => ({ author, text: lines[(id + k * 3 + 1) % lines.length] }));

/** Who liked a post: a slice of the user list, so the list of likers is long enough to scroll. */
export const likersOf = (id: number) => Array.from({ length: 30 }, (_, k) => (id * 3 + k * 7 + 1) % USERS);

export interface Alert {
  who: number;
  what: "liked" | "reposted" | "friended";
  post: number;
}

export const alerts: Alert[] = Array.from({ length: 30 }, (_, k) => ({
  who: friendsOf(ME)[k % 8],
  what: (["liked", "reposted", "friended"] as const)[k % 3],
  post: postsBy(ME)[k % postsBy(ME).length],
}));
