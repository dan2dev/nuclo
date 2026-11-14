// Chirp's screens. Rows are static: a like or a friend request swaps the record in its store (data.ts), and the
// keyed list rebuilds that one row. Single records are shown through a one-item list for the same reason.
import { router } from "./app";
import {
  ME,
  POSTS,
  USERS,
  type Media,
  type Post,
  type User,
  alerts,
  friendsOf,
  likersOf,
  post,
  postsBy,
  repliesTo,
  toggleFriend,
  toggleLike,
  toggleRepost,
  user,
} from "./data";
import { chip, color, muted, row } from "../ui";

const line = "#e5e7eb";
const like = "#e11d48";
const repost = "#16a34a";

const grouped = (n: number) => String(n).replace(/\B(?=(\d{3})+$)/g, ",");
const short = (n: number) => (n < 1000 ? String(n) : `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`);

/** A tap that stays on its own view: on the web events bubble, so a button inside a tappable row stops there. */
const tap = (fn: () => void) => (event: Event) => {
  event.stopPropagation();
  fn();
};
const go = (path: string) => tap(() => router.go(path));
const act = (fn: () => void) =>
  tap(() => {
    fn();
    update();
  });

const name = (text: string, size = 15) => span(text, { style: { color: color.text, fontSize: size, fontWeight: "bold" } });
const text = (value: string, size = 15) => span(value, { style: { color: color.text, fontSize: size } });

const avatar = (u: User, size = 44) =>
  div(
    {
      style: {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: u.tint,
        alignItems: "center",
        justifyContent: "center",
      },
      onClick: go(`/user/${u.id}`),
    },
    span(u.name[0], { style: { color: "#ffffff", fontSize: size * 0.4, fontWeight: "bold" } }),
  );

const pill = (label: string, filled: boolean, onClick: (event: Event) => void) =>
  div(
    {
      style: {
        paddingTop: 7,
        paddingBottom: 7,
        paddingLeft: 16,
        paddingRight: 16,
        borderRadius: 18,
        alignItems: "center",
        backgroundColor: filled ? color.text : color.card,
        border: `1px solid ${filled ? color.text : line}`,
      },
      onClick,
    },
    span(label, { style: { color: filled ? "#ffffff" : color.text, fontSize: 13, fontWeight: "bold" } }),
  );

const friendButton = (u: User) =>
  u.id === ME ? null : pill(u.friend ? "Friends ✓" : "Add friend", !u.friend, act(() => toggleFriend(u.id)));

// ── Media ──────────────────────────────────────────────────────────────────

/** A video in a list: its poster and a play badge. A player per row would hold a decoder per row. */
const poster = (src: string, length: string, height: number) =>
  div(
    { style: { height, borderRadius: 14, backgroundColor: "#000000" } },
    img({ src, style: { height, opacity: 0.85 } }),
    div(
      { style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" } },
      div(
        {
          style: {
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: "rgba(0,0,0,0.55)",
            alignItems: "center",
            justifyContent: "center",
          },
        },
        span("▶", { style: { color: "#ffffff", fontSize: 22 } }),
      ),
    ),
    div(
      { style: { position: "absolute", left: 10, bottom: 10, paddingLeft: 6, paddingRight: 6, paddingTop: 2, paddingBottom: 2, borderRadius: 6, backgroundColor: "rgba(0,0,0,0.6)" } },
      span(length, { style: { color: "#ffffff", fontSize: 12, fontWeight: "bold" } }),
    ),
  );

type Video = Extract<Media, { kind: "video" }>;

/** The platform's own player and its controls, on an opened post. */
const player = (m: Video, height: number) =>
  div(
    // On the web a tap on the controls would bubble up to the post.
    { style: { borderRadius: 14 }, onClick: (event: Event) => event.stopPropagation() },
    video({ src: m.src, poster: m.poster, controls: true, playsInline: true, style: { height } }),
  );

/** A post's photos or video; `playable` puts a player in place of the video's poster. */
const media = (p: Post, height: number, playable = false) => {
  const m = p.media;
  if (m.kind === "none") return null;
  if (m.kind === "video")
    return playable ? player(m, height) : div({ onClick: go(`/media/${p.id}/0`) }, poster(m.poster, m.length, height));
  return div(
    { style: { flexDirection: "row", gap: 4 } },
    ...m.srcs.map((src, i) =>
      img({ src, style: { flex: 1, height: m.srcs.length > 1 ? height * 0.8 : height, borderRadius: 14 }, onClick: go(`/media/${p.id}/${i}`) }),
    ),
  );
};

// ── Posts ──────────────────────────────────────────────────────────────────

const stat = (glyph: string, n: number, on: boolean, tint: string, onClick: (event: Event) => void) =>
  div(
    { style: { ...row, gap: 6, paddingTop: 4, paddingBottom: 4, paddingRight: 12 }, onClick },
    span(glyph, { style: { color: on ? tint : color.muted, fontSize: 15 } }),
    span(short(n), { style: { color: on ? tint : color.muted, fontSize: 13 } }),
  );

const actions = (p: Post) =>
  div(
    { style: { flexDirection: "row", justifyContent: "space-between", paddingRight: 24 } },
    stat("↩", p.replies, false, color.accent, go(`/post/${p.id}`)),
    stat("↺", p.reposts, p.reposted, repost, act(() => toggleRepost(p.id))),
    stat(p.liked ? "♥" : "♡", p.likes, p.liked, like, act(() => toggleLike(p.id))),
  );

const postRow = (p: Post) => {
  const u = user(p.author);
  return div(
    {
      style: { flexDirection: "row", gap: 12, padding: 14, backgroundColor: color.card, borderBottom: `1px solid ${line}` },
      onClick: go(`/post/${p.id}`),
    },
    avatar(u),
    div(
      { style: { flex: 1, gap: 8 } },
      div(
        { style: { ...row, gap: 4 }, onClick: go(`/user/${u.id}`) },
        name(u.name),
        muted(`${u.handle} · ${p.ago}`),
      ),
      text(p.text),
      media(p, 190),
      actions(p),
    ),
  );
};

const footer = (label: () => string) =>
  div({ style: { padding: 24, alignItems: "center" } }, muted(label));

/** Keeps a screen of ids in step with their stores: the ids say what shows, the store says how. */
const posts = (ids: () => number[]) => list(() => ids().map(post), postRow);

// ── Home ───────────────────────────────────────────────────────────────────

const PAGE = 20;
const feed: number[] = Array.from({ length: PAGE }, (_, i) => i);

export function loadFeed() {
  if (feed.length >= POSTS) return;
  feed.push(...Array.from({ length: Math.min(PAGE, POSTS - feed.length) }, (_, k) => feed.length + k));
  update();
}

export const Home = () =>
  div(
    posts(() => feed),
    footer(() => (feed.length < POSTS ? "Loading more…" : `You're all caught up: ${grouped(POSTS)} posts.`)),
  );

// ── Thread: /post/:id and who liked it ─────────────────────────────────────

const thread = (p: Post) => {
  const u = user(p.author);
  return div(
    { style: { padding: 16, gap: 12, backgroundColor: color.card, borderBottom: `1px solid ${line}` } },
    div({ style: { ...row, gap: 12 }, onClick: go(`/user/${u.id}`) }, avatar(u, 48), div(name(u.name, 16), muted(u.handle))),
    text(p.text, 18),
    media(p, 260, true),
    muted(`${p.ago} ago`),
    div(
      { style: { ...row, gap: 16, paddingTop: 10, paddingBottom: 10, borderTop: `1px solid ${line}`, borderBottom: `1px solid ${line}` } },
      span(`${grouped(p.reposts)} reposts`, { style: { color: color.text, fontSize: 14 } }),
      span(`${grouped(p.likes)} likes`, { style: { color: color.accent, fontSize: 14, fontWeight: "bold" }, onClick: go(`/post/${p.id}/likes`) }),
    ),
    actions(p),
  );
};

const reply = (r: { author: number; text: string }) => {
  const u = user(r.author);
  return div(
    { style: { flexDirection: "row", gap: 12, padding: 14, backgroundColor: color.card, borderBottom: `1px solid ${line}` } },
    avatar(u, 36),
    div({ style: { flex: 1, gap: 4 } }, div({ style: { ...row, gap: 4 }, onClick: go(`/user/${u.id}`) }, name(u.name, 14), muted(u.handle)), text(r.text, 14)),
  );
};

export const Thread = ({ id }: Record<string, string>) => {
  const n = Number(id);
  return div(list(() => [post(n)], thread), ...repliesTo(n).map(reply));
};

export const Likes = ({ id }: Record<string, string>) => people(() => likersOf(Number(id)));

// ── People: Explore, friends, likers ───────────────────────────────────────

const userRow = (u: User) =>
  div(
    {
      style: { ...row, gap: 12, padding: 14, backgroundColor: color.card, borderBottom: `1px solid ${line}` },
      onClick: go(`/user/${u.id}`),
    },
    avatar(u),
    div({ style: { flex: 1, gap: 2 } }, name(u.name), muted(u.handle), muted(u.bio)),
    friendButton(u),
  );

const people = (ids: () => number[]) => div(list(() => ids().map(user), userRow));

const explored: number[] = Array.from({ length: 30 }, (_, i) => i + 1);

export function loadUsers() {
  if (explored.length >= USERS - 1) return;
  const from = explored.length + 1;
  explored.push(...Array.from({ length: Math.min(30, USERS - from) }, (_, k) => from + k));
  update();
}

const topics = ["#nuclo", "#native", "#photography", "#running", "#design"];

export const Explore = () =>
  div(
    div(
      { style: { padding: 14, gap: 10, backgroundColor: color.card, borderBottom: `1px solid ${line}` } },
      name("Trending", 18),
      div({ style: { flexDirection: "row", flexWrap: "wrap", gap: 8 } }, ...topics.map((t) => pill(t, false, () => {}))),
    ),
    div({ style: { padding: 14 } }, name("Who to follow", 18)),
    people(() => explored),
    footer(() => (explored.length < USERS - 1 ? "Loading more…" : `That's everyone: ${grouped(USERS - 1)} people.`)),
  );

export const Friends = ({ id }: Record<string, string>) => {
  const n = Number(id);
  return div(
    div({ style: { padding: 14 } }, muted(() => `${friendsOf(n).length} friends · tap one to see theirs`)),
    people(() => friendsOf(n)),
  );
};

// ── Profile: /me and /user/:id ─────────────────────────────────────────────

const header = (u: User) => {
  const friends = friendsOf(u.id);
  return div(
    { style: { backgroundColor: color.card, borderBottom: `1px solid ${line}` } },
    img({ src: `assets/${["aurora", "dunes", "lagoon", "forest", "ember", "glacier"][u.id % 6]}.jpg`, style: { height: 120 } }),
    div(
      { style: { padding: 16, gap: 10 } },
      div({ style: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" } }, avatar(u, 72), friendButton(u)),
      div(name(u.name, 20), muted(u.handle, 14)),
      text(u.bio),
      div(
        { style: { ...row, gap: 16 } },
        span(`${friends.length} friends`, { style: { color: color.accent, fontSize: 14, fontWeight: "bold" }, onClick: go(`/user/${u.id}/friends`) }),
        muted(`${postsBy(u.id).length} posts`, 14),
      ),
      // The first few friends: one tap away from their profiles, and theirs from them.
      div({ style: { flexDirection: "row", gap: 8 } }, ...friends.slice(0, 6).map((f) => avatar(user(f), 36))),
    ),
  );
};

export const Profile = ({ id }: Record<string, string>) => {
  const n = Number(id);
  let tab: "posts" | "media" = "posts";
  const shown = () => postsBy(n).filter((p) => tab === "posts" || post(p).media.kind !== "none");
  return div(
    list(() => [user(n)], header),
    div(
      { style: { flexDirection: "row", gap: 8, padding: 12, backgroundColor: color.card, borderBottom: `1px solid ${line}` } },
      chip("Posts", () => tab === "posts", () => ((tab = "posts"), update())),
      chip("Media", () => tab === "media", () => ((tab = "media"), update())),
    ),
    posts(shown),
  );
};

export const userTitle = ({ id }: Record<string, string>) => user(Number(id)).name;
export const friendsTitle = ({ id }: Record<string, string>) =>
  Number(id) === ME ? "Your friends" : `${user(Number(id)).name.split(" ")[0]}'s friends`;

// ── Media viewer: /media/:id/:index ────────────────────────────────────────

export const Viewer = ({ id, index }: Record<string, string>) => {
  const p = post(Number(id));
  const m: Media = p.media;
  return div(
    { style: { padding: 12, gap: 12 } },
    m.kind === "video"
      ? player(m, 420)
      : m.kind === "photos"
        ? img({ src: m.srcs[Number(index)], style: { height: 420, borderRadius: 14 } })
        : null,
    div({ style: { gap: 6 }, onClick: go(`/post/${p.id}`) }, name(user(p.author).name), text(p.text), muted("Open the post →")),
  );
};

export const viewerTitle = ({ id }: Record<string, string>) => (post(Number(id)).media.kind === "video" ? "Video" : "Photo");

// ── Alerts ─────────────────────────────────────────────────────────────────

const said = { liked: "liked your post", reposted: "reposted your post", friended: "added you as a friend" };

export const Alerts = () =>
  div(
    ...alerts.map((a) => {
      const u = user(a.who);
      return div(
        {
          style: { flexDirection: "row", gap: 12, padding: 14, backgroundColor: color.card, borderBottom: `1px solid ${line}` },
          onClick: go(a.what === "friended" ? `/user/${u.id}` : `/post/${a.post}`),
        },
        span(a.what === "liked" ? "♥" : a.what === "reposted" ? "↺" : "✓", {
          style: { width: 24, fontSize: 18, color: a.what === "liked" ? like : a.what === "reposted" ? repost : color.accent },
        }),
        div(
          { style: { flex: 1, gap: 6 } },
          avatar(u, 32),
          div({ style: { ...row, gap: 4, flexWrap: "wrap" } }, name(u.name, 14), muted(said[a.what], 14)),
          a.what === "friended" ? null : muted(post(a.post).text, 14),
        ),
      );
    }),
  );
