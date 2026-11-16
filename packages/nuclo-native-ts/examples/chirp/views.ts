// Chirp's screens. Rows are static: a like or a friend request swaps the record in its store (data.ts), and the
// keyed list rebuilds that one row. Single records are shown through a one-item list for the same reason.
// Lists come from the server a page at a time (api.ts): each screen keeps what it has loaded and shows the rest of
// the request's life in its footer: loading, failed (tap to retry) or the end.
import { type Int, type Node, type Params, type Timer, clearTimeout, div, img, input, list, setTimeout, span, update, when } from "../../src/index.ts";
import { type Paged, apiReplies, apiReply, flip, load, notice, paged, reset } from "./api.ts";
import { router } from "./App.ts";
import {
  ALERTS,
  ME,
  POSTS,
  type Post,
  type Reply,
  type User,
  alertAt,
  friendsOf,
  picture,
  post,
  postCount,
  topics,
  user,
} from "./data.ts";
import { action, band, body, chip, css, field, muted, mutedFn, name, nameFn, row } from "./ui.ts";

/** 1234567 → "1,234,567". */
export function grouped(n: Int): string {
  const digits = String(n);
  let out = "";
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += ",";
    out += digits.slice(i, i + 1);
  }
  return out;
}

/** 1234 → "1.2k". */
function short(n: Int): string {
  if (n < 1000) return String(n);
  const k = (n / 1000).toFixed(1);
  return `${k.endsWith(".0") ? k.slice(0, k.length - 2) : k}k`;
}

const go = (path: string) => () => router.go(path);

/** One list per key (a user's posts, a topic's): made, and its first page asked for, when first shown. */
const lists: Record<string, Paged> = {};
function keyed(kind: "feed" | "topic" | "posts" | "media" | "likers" | "people" | "friends" | "alerts", key: string): Paged {
  const id = `${kind}:${key}`;
  const hit = lists[id];
  if (hit) return hit;
  const made = paged(kind, key);
  lists[id] = made;
  load(made);
  return made;
}

// ── Pieces ─────────────────────────────────────────────────────────────────

export const avatar = (u: User, size: number): Node =>
  div(
    { style: { width: size, height: size, borderRadius: size / 2, backgroundColor: u.tint, alignItems: "center", justifyContent: "center" }, onClick: go(`/user/${u.id}`) },
    span(u.name.slice(0, 1), { style: { color: "#ffffff", fontSize: size * 0.4, fontWeight: "bold" } }),
  );

export const pill = (label: string, filled: boolean, onClick: () => void): Node =>
  div(
    {
      style: { py: 7, px: 16, rounded: "pill", items: "center", bg: filled ? "text" : "card", border: filled ? "1px solid text" : "1px solid line" },
      onClick,
    },
    span(label, { style: { color: filled ? "#ffffff" : "text", fontSize: 13, fontWeight: "bold" } }),
  );

const friendButton = (u: User): Node | null =>
  u.id === ME ? null : pill(u.friend ? "Friends ✓" : "Add friend", !u.friend, () => flip("friend", u.id, !u.friend));

/** What a request that failed in the background says, until it clears (api.ts, warn). */
const banner = () =>
  when(
    () => notice.text.length > 0,
    div({ style: { p: 12, bg: "warning" } }, span(() => notice.text, { style: { color: "bad", fontSize: 13, fontWeight: "bold" } })),
  );

/** A list's footer: its request's state, a tap to retry one that failed, and `end` once everything is in. */
const more = (list: () => Paged, end: () => string): Node =>
  div(
    {
      style: { p: 24, items: "center" },
      onClick: () => {
        if (!list().failed) return;
        load(list());
        update();
      },
    },
    mutedFn(() => (list().failed ? "Couldn't load. Tap to try again." : list().done ? end() : "Loading…")),
  );

// ── Media ──────────────────────────────────────────────────────────────────

const badge = css({ position: "absolute", left: 10, bottom: 10, px: 6, py: 2, rounded: 6, bg: "rgba(0,0,0,0.6)" });
const fill = css({ position: "absolute", inset: 0, center: true });

/** A video: its poster and a play badge (there is no player natively). */
const poster = (src: string, length: string, height: number): Node =>
  div(
    { style: { height: height, borderRadius: 14, backgroundColor: "#000000", overflow: "hidden" } },
    img({ src, style: { height: height, opacity: 0.85 } }),
    div(
      fill,
      div({ style: { size: 56, rounded: 28, bg: "rgba(0,0,0,0.55)", center: true } }, span("▶", { style: { color: "#ffffff", fontSize: 22 } })),
    ),
    div(badge, span(length, { style: { color: "#ffffff", fontSize: 12, fontWeight: "bold" } })),
  );

/** A post's photos or video. */
function media(p: Post, height: number): Node | null {
  const m = p.media;
  if (m.kind === "none") return null;
  if (m.kind === "video") return div({ onClick: go(`/media/${p.id}/0`) }, poster(m.poster, m.length, height));
  const tall = m.srcs.length > 1 ? height * 0.8 : height;
  return div(
    { style: { row: true, gap: 4 } },
    list(
      () => m.srcs,
      (src, i) => img({ src, style: { flex: 1, height: tall, borderRadius: 14 }, onClick: go(`/media/${p.id}/${i}`) }),
    ),
  );
}

// ── Posts ──────────────────────────────────────────────────────────────────

const stat = (glyph: string, n: Int, on: boolean, tint: string, onClick: () => void): Node =>
  div(
    { style: { row: true, gap: 6, items: "center", py: 4, pr: 12 }, onClick },
    span(glyph, { style: { color: on ? tint : "#6b7280", fontSize: 15 } }),
    span(short(n), { style: { color: on ? tint : "#6b7280", fontSize: 13 } }),
  );

const actions = (p: Post): Node =>
  div(
    { style: { row: true, justify: "space-between", pr: 24 } },
    stat("↩", p.replies, false, "#4f46e5", go(`/post/${p.id}`)),
    stat("↺", p.reposts, p.reposted, "#16a34a", () => flip("repost", p.id, !p.reposted)),
    stat(p.liked ? "♥" : "♡", p.likes, p.liked, "#e11d48", () => flip("like", p.id, !p.liked)),
  );

const postRow = (p: Post): Node => {
  const u = user(p.author);
  return div(
    band,
    { style: { row: true, gap: 12, p: 14 }, onClick: go(`/post/${p.id}`) },
    avatar(u, 44),
    div(
      { style: { flex: 1, minWidth: 0, gap: 8 } },
      div({ style: { row: true, flexWrap: "wrap", gap: 4, items: "center" }, onClick: go(`/user/${u.id}`) }, name(u.name), muted(`${u.handle} · ${p.ago}`)),
      body(p.text),
      media(p, 190),
      actions(p),
    ),
  );
};

/** A screen's ids as their rows: the ids say what shows, the store says how. */
const posts = (ids: () => Int[]) => list(() => ids().map((id) => post(id)), (p) => postRow(p));

// ── Home ───────────────────────────────────────────────────────────────────

export const feed: Paged = paged("feed", "");
export const loadFeed = (_: Params) => load(feed);

export const Home = (): Node => {
  if (feed.ids.length === 0) load(feed);
  return div(
    banner(),
    list(
      () => [user(ME)],
      (me) =>
        div(
          row,
          band,
          { style: { gap: 12, p: 14 }, onClick: go("/compose") },
          avatar(me, 36),
          div({ style: { flex: 1 } }, muted("What's happening?", 15)),
          pill("Post", true, go("/compose")),
        ),
    ),
    posts(() => feed.ids),
    more(() => feed, () => `You're all caught up: ${grouped(POSTS)} posts.`),
  );
};

export const Topic = (params: Params): Node => {
  const topic = params.name ?? "";
  const found = keyed("topic", topic);
  return div(posts(() => found.ids), more(() => found, () => `That's every post on #${topic}.`));
};
export const loadTopic = (params: Params) => load(keyed("topic", params.name ?? ""));

// ── Thread: /post/:id and who liked it ─────────────────────────────────────

const thread = (p: Post): Node => {
  const u = user(p.author);
  return div(
    band,
    { style: { p: 16, gap: 12 } },
    div(row, { style: { gap: 12 }, onClick: go(`/user/${u.id}`) }, avatar(u, 48), div(name(u.name, 16), muted(u.handle))),
    body(p.text, 18),
    media(p, 260),
    muted(p.ago === "now" ? "Just now" : `${p.ago} ago`),
    div(
      row,
      { style: { gap: 16, py: 10, borderTop: "1px solid line", borderBottom: "1px solid line" } },
      span(`${grouped(p.reposts)} reposts`, { style: { color: "text", fontSize: 14 } }),
      span(`${grouped(p.likes)} likes`, { style: { color: "accent", fontSize: 14, fontWeight: "bold" }, onClick: go(`/post/${p.id}/likes`) }),
    ),
    actions(p),
  );
};

const reply = (r: Reply): Node => {
  const u = user(r.author);
  return div(
    band,
    { style: { row: true, gap: 12, p: 14 } },
    avatar(u, 36),
    div(
      { style: { flex: 1, minWidth: 0, gap: 4 } },
      div({ style: { row: true, flexWrap: "wrap", gap: 4, items: "center" }, onClick: go(`/user/${u.id}`) }, name(u.name, 14), muted(u.handle)),
      body(r.text, 14),
    ),
  );
};

/** A thread's replies as the server last answered, and the reply being written. */
interface ThreadState {
  id: Int;
  replies: Reply[];
  loaded: boolean;
  failed: boolean;
  /** Asked again after the user replies: whichever answer is for the later ask is the one that shows. */
  asked: number;
  draft: string;
  sending: boolean;
  sendFailed: boolean;
}

async function loadReplies(t: ThreadState): Promise<void> {
  t.asked += 1;
  const mine = t.asked;
  t.failed = false;
  try {
    const found = await apiReplies(t.id);
    if (mine !== t.asked) return;
    t.replies = found;
    t.loaded = true;
  } catch (e) {
    if (mine !== t.asked) return;
    t.failed = true;
  }
  update();
}

/** A reply is sent once however often Send is tapped, and the thread asked for again when it is in. */
async function sendReply(t: ThreadState): Promise<void> {
  const text = t.draft.trim();
  if (text.length === 0 || t.sending) return;
  t.sending = true;
  t.sendFailed = false;
  update();
  try {
    await apiReply(t.id, text);
    t.draft = "";
    loadReplies(t);
  } catch (e) {
    t.sendFailed = true;
  }
  t.sending = false;
  update();
}

const replyBox = (t: ThreadState): Node =>
  div(
    band,
    { style: { p: 14, gap: 8 } },
    div(
      row,
      input(field, {
        placeholder: "Post your reply",
        value: () => t.draft,
        disabled: () => t.sending,
        style: { flex: 1, minWidth: 0 },
        onInput: (e) => {
          t.draft = e.target.value;
          update();
        },
        onChange: () => sendReply(t),
      }),
      div({ style: { width: 88 } }, action(() => (t.sending ? "Sending…" : "Reply"), () => sendReply(t), () => t.draft.trim().length > 0 && !t.sending)),
    ),
    when(() => t.sendFailed, span("Couldn't send your reply. Try again.", { style: { color: "bad", fontSize: 13 } })),
  );

export const ThreadScreen = (params: Params): Node => {
  const id = parseInt(params.id ?? "0");
  const t: ThreadState = { id, replies: [], loaded: false, failed: false, asked: 0, draft: "", sending: false, sendFailed: false };
  loadReplies(t);
  return div(
    banner(),
    list(() => [post(id)], (p) => thread(p)),
    replyBox(t),
    list(() => t.replies, (r) => reply(r)),
    div(
      {
        style: { p: 24, items: "center" },
        onClick: () => {
          if (t.failed) loadReplies(t);
        },
      },
      mutedFn(() => (t.failed ? "Couldn't load the replies. Tap to try again." : !t.loaded ? "Loading replies…" : t.replies.length > 0 ? "" : "No replies yet.")),
    ),
  );
};

export const Likes = (params: Params): Node => people(() => keyed("likers", params.id ?? "0"), () => "");
export const loadLikes = (params: Params) => load(keyed("likers", params.id ?? "0"));

// ── People: Explore, friends, likers ───────────────────────────────────────

const userRow = (u: User): Node =>
  div(
    row,
    band,
    { style: { gap: 12, p: 14 }, onClick: go(`/user/${u.id}`) },
    avatar(u, 44),
    div({ style: { flex: 1, gap: 2 } }, name(u.name), muted(`${u.handle} · ${u.location}`), muted(u.bio)),
    friendButton(u),
  );

const people = (found: () => Paged, end: () => string): Node =>
  div(list(() => found().ids.map((id) => user(id)), (u) => userRow(u)), more(found, end));

// Explore: every user, or the ones a search finds. Each query is its own list, so a reply to an earlier query
// lands in a list nobody shows.
let query = "";
/** The query whose results show: the typed one, once the user has paused. */
let searched = "";
let searchTimer: Timer | null = null;

function search() {
  if (searchTimer !== null) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searched = query.trim();
    keyed("people", searched);
    update();
  }, 250);
}

export const loadPeople = (_: Params) => load(keyed("people", searched));

export const Explore = (): Node =>
  div(
    div(
      band,
      { style: { p: 14, gap: 10 } },
      input(field, {
        placeholder: "Search 100,000 people",
        value: () => query,
        onInput: (e) => {
          query = e.target.value;
          update();
          search();
        },
      }),
      name("Trending", 18),
      div({ style: { row: true, flexWrap: "wrap", gap: 8 } }, list(() => topics, (t) => pill(`#${t}`, false, go(`/topic/${t}`)))),
    ),
    div({ style: { p: 14 } }, nameFn(() => (searched.length > 0 ? `People matching "${searched}"` : "Who to follow"), 18)),
    people(
      () => keyed("people", searched),
      () => (keyed("people", searched).ids.length > 0 ? "That's everyone." : "Nobody by that name."),
    ),
  );

export const Friends = (params: Params): Node => {
  const id = parseInt(params.id ?? "0");
  const found = keyed("friends", params.id ?? "0");
  // The signed-in user's friends change as they add and drop them here: once loaded, the list follows.
  const ids = () => (id === ME && found.ids.length > 0 ? friendsOf(ME) : found.ids);
  return div(
    div({ style: { p: 14 } }, mutedFn(() => (found.ids.length > 0 ? `${ids().length} friends · tap one to see theirs` : ""))),
    list(() => ids().map((f) => user(f)), (u) => userRow(u)),
    more(() => found, () => ""),
  );
};

// ── Profile: /me and /user/:id ─────────────────────────────────────────────

const header = (u: User): Node => {
  const friends = friendsOf(u.id);
  return div(
    band,
    img({ src: picture(u.id), style: { height: 120 } }),
    div(
      { style: { p: 16, gap: 10 } },
      div(
        { style: { row: true, flexWrap: "wrap", gap: 10, justify: "space-between", items: "flex-end" } },
        avatar(u, 72),
        u.id === ME
          ? div({ style: { row: true, flexWrap: "wrap", gap: 8 } }, pill("Edit profile", false, go("/me/edit")), pill("Settings", false, go("/me/settings")))
          : friendButton(u),
      ),
      div(name(u.name, 20), muted(u.handle, 14)),
      body(u.bio),
      muted(`${u.location} · Joined ${u.joined} · ${short(u.followers)} followers`),
      div(
        row,
        { style: { gap: 16 } },
        span(`${friends.length} friends`, { style: { color: "accent", fontSize: 14, fontWeight: "bold" }, onClick: go(`/user/${u.id}/friends`) }),
        muted(`${postCount(u.id)} posts`, 14),
      ),
      // The first few friends: one tap away from their profiles, and theirs from them.
      div({ style: { row: true, flexWrap: "wrap", gap: 8 } }, list(() => friends.slice(0, 6), (f) => avatar(user(f), 36))),
    ),
  );
};

/** Which of a profile's tabs shows, by user: the route's onEndReached loads that one's next page. */
const mediaOnly: Record<string, boolean> = {};
const shownPosts = (id: Int) => keyed(mediaOnly[String(id)] === true ? "media" : "posts", String(id));

/** The signed-in user's own posts start over when they write one (forms.ts). */
export function reloadMine() {
  reset(keyed("posts", String(ME)));
  reset(keyed("media", String(ME)));
}

export const ProfileScreen = (params: Params): Node => {
  const id = parseInt(params.id ?? "0");
  const show = (media: boolean) => () => {
    mediaOnly[String(id)] = media;
    update();
  };
  return div(
    list(() => [user(id)], (u) => header(u)),
    div(
      band,
      { style: { row: true, gap: 8, p: 12 } },
      chip("Posts", () => mediaOnly[String(id)] !== true, show(false)),
      chip("Media", () => mediaOnly[String(id)] === true, show(true)),
    ),
    posts(() => shownPosts(id).ids),
    more(() => shownPosts(id), () => (shownPosts(id).ids.length > 0 ? "" : "Nothing here yet.")),
  );
};
export const loadProfile = (params: Params) => load(shownPosts(parseInt(params.id ?? "0")));

export const userTitle = (params: Params) => user(parseInt(params.id ?? "0")).name;
export function friendsTitle(params: Params): string {
  const id = parseInt(params.id ?? "0");
  if (id === ME) return "Your friends";
  const full = user(id).name;
  let end = 0;
  while (end < full.length && full.slice(end, end + 1) !== " ") end++;
  return `${full.slice(0, end)}'s friends`;
}

// ── Media viewer: /media/:id/:index ────────────────────────────────────────

export const Viewer = (params: Params): Node => {
  const p = post(parseInt(params.id ?? "0"));
  const m = p.media;
  const src = m.kind === "video" ? m.poster : (m.srcs[parseInt(params.index ?? "0")] ?? "");
  return div(
    { style: { p: 12, gap: 12 } },
    m.kind === "video" ? poster(m.poster, m.length, 420) : img({ src, style: { height: 420, borderRadius: 14 } }),
    div({ style: { gap: 6 }, onClick: go(`/post/${p.id}`) }, name(user(p.author).name), body(p.text), muted("Open the post →")),
  );
};

export const viewerTitle = (params: Params) => (post(parseInt(params.id ?? "0")).media.kind === "video" ? "Video" : "Photo");

// ── Alerts ─────────────────────────────────────────────────────────────────

export const alerts: Paged = paged("alerts", "");
export const loadAlerts = (_: Params) => load(alerts);

const alertRow = (k: Int): Node => {
  const a = alertAt(k);
  const u = user(a.who);
  const said = a.what === "liked" ? "liked your post" : a.what === "reposted" ? "reposted your post" : "added you as a friend";
  return div(
    band,
    { style: { row: true, gap: 12, p: 14 }, onClick: go(a.what === "friended" ? `/user/${u.id}` : `/post/${a.post}`) },
    span(a.what === "liked" ? "♥" : a.what === "reposted" ? "↺" : "✓", {
      style: { width: 24, fontSize: 18, color: a.what === "liked" ? "like" : a.what === "reposted" ? "repost" : "accent" },
    }),
    div(
      { style: { flex: 1, gap: 6 } },
      avatar(u, 32),
      div({ style: { row: true, gap: 4, flexWrap: "wrap" } }, name(u.name, 14), muted(said, 14)),
      a.what === "friended" ? null : muted(post(a.post).text, 14),
    ),
  );
};

export const Alerts = (): Node => {
  if (alerts.ids.length === 0) load(alerts);
  return div(list(() => alerts.ids, (k) => alertRow(k)), more(() => alerts, () => `That's all ${grouped(ALERTS)} notifications.`));
};
