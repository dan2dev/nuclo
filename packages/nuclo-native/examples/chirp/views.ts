// Chirp's screens. Rows are static: a like or a friend request swaps the record in its store (data.ts), and the
// keyed list rebuilds that one row. Single records are shown through a one-item list for the same reason.
// Lists come from the server a page at a time (api.ts): each screen keeps what it has loaded and shows the rest of
// the request's life in its footer: loading, failed (tap to retry) or the end.
import { windowed } from "nuclo-native";
import { type Paged, api, debounced, flip, notice, paged } from "./api";
import { router } from "./app";
import {
  ALERTS,
  ME,
  POSTS,
  type Media,
  type Post,
  type Reply,
  type User,
  alertAt,
  friendsOf,
  post,
  postCount,
  setFriend,
  setLiked,
  setReposted,
  topics,
  user,
} from "./data";
import { action, chip, color, muted, row } from "../ui";

export const line = "#e5e7eb";
const like = "#e11d48";
const repost = "#16a34a";

export const grouped = (n: number) => String(n).replace(/\B(?=(\d{3})+$)/g, ",");
const short = (n: number) => (n < 1000 ? String(n) : `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`);

/** A tap that stays on its own view: on the web events bubble, so a button inside a tappable row stops there. */
const tap = (fn: () => void) => (event: Event) => {
  event.stopPropagation();
  fn();
};
const go = (path: string) => tap(() => router.go(path));

type Text = string | (() => string);
export const name = (text: Text, size = 15) => span(text, { style: { color: color.text, fontSize: size, fontWeight: "bold" } });
export const field = { backgroundColor: color.field, color: color.text, borderRadius: 10, padding: 10, fontSize: 15 };
const text = (value: string, size = 15) => span(value, { style: { color: color.text, fontSize: size } });

export const avatar = (u: User, size = 44) =>
  div(
    {
      style: {
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: size / 2,
        backgroundColor: u.tint,
        alignItems: "center",
        justifyContent: "center",
      },
      onClick: go(`/user/${u.id}`),
    },
    span(u.name[0], { style: { color: "#ffffff", fontSize: size * 0.4, fontWeight: "bold" } }),
  );

export const pill = (label: string, filled: boolean, onClick: (event: Event) => void) =>
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
  u.id === ME
    ? null
    : pill(
        u.friend ? "Friends ✓" : "Add friend",
        !u.friend,
        tap(() => flip(`friend:${u.id}`, !u.friend, (on) => setFriend(u.id, on), (on) => api.setFriend(u.id, on), "the friend request")),
      );

/** What a request that failed in the background says, until it clears (api.ts, warn). */
const banner = () =>
  when(
    () => !!notice.text,
    div({ style: { padding: 12, backgroundColor: "#fee2e2" } }, span(() => notice.text, { style: { color: color.bad, fontSize: 13, fontWeight: "bold" } })),
  );

/** A list's footer: its request's state, a tap to retry one that failed, and `end` once everything is in. */
const more = (list: () => Paged, end: () => string) =>
  div(
    {
      style: { padding: 24, alignItems: "center" },
      onClick: () => {
        if (!list().failed) return;
        list().load();
        update();
      },
    },
    muted(() => (list().failed ? "Couldn't load. Tap to try again." : list().done ? end() : "Loading…")),
  );

/** One list per key (a user's posts, a topic's): made, and its first page asked for, when first shown. */
function keyed(make: (key: string) => Paged) {
  const lists = new Map<string, Paged>();
  return (key: string) => {
    let list = lists.get(key);
    if (!list) {
      lists.set(key, (list = make(key)));
      list.load();
    }
    return list;
  };
}

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
    stat(
      "↺",
      p.reposts,
      p.reposted,
      repost,
      tap(() => flip(`repost:${p.id}`, !p.reposted, (on) => setReposted(p.id, on), (on) => api.setReposted(p.id, on), "your repost")),
    ),
    stat(
      p.liked ? "♥" : "♡",
      p.likes,
      p.liked,
      like,
      tap(() => flip(`like:${p.id}`, !p.liked, (on) => setLiked(p.id, on), (on) => api.setLiked(p.id, on), "your like")),
    ),
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
      { style: { flex: 1, minWidth: 0, gap: 8 } },
      div(
        { style: { ...row, flexWrap: "wrap", gap: 4 }, onClick: go(`/user/${u.id}`) },
        name(u.name),
        muted(`${u.handle} · ${p.ago}`),
      ),
      text(p.text),
      media(p, 190),
      actions(p),
    ),
  );
};

/**
 * A screen's ids as their rows: the ids say what shows, the store says how. Only the rows near what the screen shows
 * exist (windowed), so a feed scrolled a long way costs no more than one just opened.
 */
const posts = (ids: () => number[]) => windowed(ids, post, postRow);

// ── Home ───────────────────────────────────────────────────────────────────

/** The feed, by cursor. A post the user just wrote is put on top here (forms.ts): a page that also has it skips it. */
export const feed: Paged = paged((ids) =>
  api.feed(ids.at(-1)).then((page) => ({ ...page, ids: page.ids.filter((id) => id >= 0 || !feed.ids.includes(id)) })),
);

export const Home = () => {
  if (!feed.ids.length) feed.load();
  return div(
    banner(),
    list(
      () => [user(ME)],
      (me) =>
        div(
          { style: { ...row, gap: 12, padding: 14, backgroundColor: color.card, borderBottom: `1px solid ${line}` }, onClick: go("/compose") },
          avatar(me, 36),
          div({ style: { flex: 1 } }, muted("What's happening?", 15)),
          pill("Post", true, go("/compose")),
        ),
    ),
    posts(() => feed.ids),
    more(() => feed, () => `You're all caught up: ${grouped(POSTS)} posts.`),
  );
};

const topicPosts = keyed((topic) => paged((ids) => api.topic(topic, ids.at(-1))));

export const Topic = ({ name: topic }: Record<string, string>) => {
  const found = topicPosts(topic);
  return div(posts(() => found.ids), more(() => found, () => `That's every post on #${topic}.`));
};
export const loadTopic = ({ name: topic }: Record<string, string>) => topicPosts(topic).load();

// ── Thread: /post/:id and who liked it ─────────────────────────────────────

const thread = (p: Post) => {
  const u = user(p.author);
  return div(
    { style: { padding: 16, gap: 12, backgroundColor: color.card, borderBottom: `1px solid ${line}` } },
    div({ style: { ...row, gap: 12 }, onClick: go(`/user/${u.id}`) }, avatar(u, 48), div(name(u.name, 16), muted(u.handle))),
    text(p.text, 18),
    media(p, 260, true),
    muted(p.ago === "now" ? "Just now" : `${p.ago} ago`),
    div(
      { style: { ...row, gap: 16, paddingTop: 10, paddingBottom: 10, borderTop: `1px solid ${line}`, borderBottom: `1px solid ${line}` } },
      span(`${grouped(p.reposts)} reposts`, { style: { color: color.text, fontSize: 14 } }),
      span(`${grouped(p.likes)} likes`, { style: { color: color.accent, fontSize: 14, fontWeight: "bold" }, onClick: go(`/post/${p.id}/likes`) }),
    ),
    actions(p),
  );
};

const reply = (r: Reply) => {
  const u = user(r.author);
  return div(
    { style: { flexDirection: "row", gap: 12, padding: 14, backgroundColor: color.card, borderBottom: `1px solid ${line}` } },
    avatar(u, 36),
    div({ style: { flex: 1, minWidth: 0, gap: 4 } }, div({ style: { ...row, flexWrap: "wrap", gap: 4 }, onClick: go(`/user/${u.id}`) }, name(u.name, 14), muted(u.handle)), text(r.text, 14)),
  );
};

/** A reply to a post: sent once however often Send is tapped, and the thread asked for again when it is in. */
const replyBox = (id: number, sent: () => void) => {
  let draft = "";
  let sending = false;
  let failed = false;
  const send = () => {
    const text = draft.trim();
    if (!text || sending) return;
    sending = true;
    failed = false;
    update();
    api.reply(id, text).then(
      () => {
        draft = "";
        sent();
      },
      () => (failed = true),
    ).then(() => {
      sending = false;
      update();
    });
  };
  return div(
    { style: { padding: 14, gap: 8, backgroundColor: color.card, borderBottom: `1px solid ${line}` } },
    div(
      { style: { ...row, flexWrap: "wrap" } },
      input({
        placeholder: "Post your reply",
        value: () => draft,
        disabled: () => sending,
        style: { ...field, flex: "1 1 180px", minWidth: 0 },
        onInput: (e) => {
          draft = (e.target as HTMLInputElement).value;
          update();
        },
        onChange: send,
      }),
      div({ style: { width: 88, flexShrink: 0 } }, action(() => (sending ? "Sending…" : "Reply"), send, () => !!draft.trim() && !sending)),
    ),
    when(() => failed, span("Couldn't send your reply. Try again.", { style: { color: color.bad, fontSize: 13 } })),
  );
};

export const Thread = ({ id }: Record<string, string>) => {
  const n = Number(id);
  let replies: Reply[] | undefined;
  let failed = false;
  // Asked again after the user replies: whichever answer is for the later ask is the one that shows.
  let asked = 0;
  const load = () => {
    const mine = ++asked;
    failed = false;
    api.replies(n).then(
      (found) => {
        if (mine !== asked) return;
        replies = found;
        update();
      },
      () => {
        if (mine !== asked) return;
        failed = true;
        update();
      },
    );
  };
  load();
  return div(
    banner(),
    list(() => [post(n)], thread),
    replyBox(n, load),
    list(() => replies ?? [], reply),
    div(
      { style: { padding: 24, alignItems: "center" }, onClick: () => failed && (load(), update()) },
      muted(() => (failed ? "Couldn't load the replies. Tap to try again." : !replies ? "Loading replies…" : replies.length ? "" : "No replies yet.")),
    ),
  );
};

const likers = keyed((id) => paged((ids) => api.likers(Number(id), ids.length)));

export const Likes = ({ id }: Record<string, string>) => people(() => likers(id), () => "");
export const loadLikes = ({ id }: Record<string, string>) => likers(id).load();

// ── People: Explore, friends, likers ───────────────────────────────────────

const userRow = (u: User) =>
  div(
    {
      style: { ...row, gap: 12, padding: 14, backgroundColor: color.card, borderBottom: `1px solid ${line}` },
      onClick: go(`/user/${u.id}`),
    },
    avatar(u),
    div({ style: { flex: 1, gap: 2 } }, name(u.name), muted(`${u.handle} · ${u.location}`), muted(u.bio)),
    friendButton(u),
  );

const people = (found: () => Paged, end: () => string) => div(windowed(() => found().ids, user, userRow), more(found, end));

// Explore: every user, or the ones a search finds. Each query is its own list, so a reply to an earlier query
// lands in a list nobody shows.
let query = "";
const searches = keyed((q) => paged((ids) => api.people(q, ids.length)));
/** The query whose results show: the typed one, once the user has paused. */
let searched = "";
const search = debounced(() => {
  searched = query.trim();
  searches(searched);
  update();
});
export const loadPeople = () => searches(searched).load();

export const Explore = () =>
  div(
    div(
      { style: { padding: 14, gap: 10, backgroundColor: color.card, borderBottom: `1px solid ${line}` } },
      input({
        placeholder: "Search 100,000 people",
        value: () => query,
        style: field,
        onInput: (e) => {
          query = (e.target as HTMLInputElement).value;
          update();
          search();
        },
      }),
      name("Trending", 18),
      div({ style: { flexDirection: "row", flexWrap: "wrap", gap: 8 } }, ...topics.map((t) => pill(`#${t}`, false, go(`/topic/${t}`)))),
    ),
    div({ style: { padding: 14 } }, name(() => (searched ? `People matching "${searched}"` : "Who to follow"), 18)),
    people(
      () => searches(searched),
      () => (searches(searched).ids.length ? "That's everyone." : "Nobody by that name."),
    ),
  );

const friends = keyed((id) => paged(() => api.friends(Number(id)).then((ids) => ({ ids, done: true }))));

export const Friends = ({ id }: Record<string, string>) => {
  const n = Number(id);
  const found = friends(id);
  // The signed-in user's friends change as they add and drop them here: once loaded, the list follows.
  const ids = () => (n === ME && found.ids.length ? friendsOf(ME) : found.ids);
  return div(
    div({ style: { padding: 14 } }, muted(() => (found.ids.length ? `${ids().length} friends · tap one to see theirs` : ""))),
    div(windowed(ids, user, userRow), more(() => found, () => "")),
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
      div(
        { style: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between", alignItems: "flex-end" } },
        avatar(u, 72),
        u.id === ME
          ? div({ style: { flexDirection: "row", flexWrap: "wrap", gap: 8 } }, pill("Edit profile", false, go("/me/edit")), pill("Settings", false, go("/me/settings")))
          : friendButton(u),
      ),
      div(name(u.name, 20), muted(u.handle, 14)),
      text(u.bio),
      muted(`${u.location} · Joined ${u.joined} · ${short(u.followers)} followers`),
      div(
        { style: { ...row, gap: 16 } },
        span(`${friends.length} friends`, { style: { color: color.accent, fontSize: 14, fontWeight: "bold" }, onClick: go(`/user/${u.id}/friends`) }),
        muted(`${postCount(u.id)} posts`, 14),
      ),
      // The first few friends: one tap away from their profiles, and theirs from them.
      div({ style: { flexDirection: "row", flexWrap: "wrap", gap: 8 } }, ...friends.slice(0, 6).map((f) => avatar(user(f), 36))),
    ),
  );
};

/** Which of a profile's tabs shows, by user: the route's onEndReached loads that one's next page. */
const mediaOnly = new Set<number>();
const userPosts = keyed((key) => {
  const [id, tab] = key.split(" ");
  return paged((ids) => api.postsBy(Number(id), tab === "media", ids.length));
});
const shownPosts = (id: number) => userPosts(`${id} ${mediaOnly.has(id) ? "media" : "posts"}`);

/** The signed-in user's own posts start over when they write one (forms.ts). */
export const reloadMine = () => ["posts", "media"].forEach((tab) => userPosts(`${ME} ${tab}`).reset());

export const Profile = ({ id }: Record<string, string>) => {
  const n = Number(id);
  const show = (media: boolean) => () => {
    if (media) mediaOnly.add(n);
    else mediaOnly.delete(n);
    update();
  };
  return div(
    list(() => [user(n)], header),
    div(
      { style: { flexDirection: "row", gap: 8, padding: 12, backgroundColor: color.card, borderBottom: `1px solid ${line}` } },
      chip("Posts", () => !mediaOnly.has(n), show(false)),
      chip("Media", () => mediaOnly.has(n), show(true)),
    ),
    posts(() => shownPosts(n).ids),
    more(() => shownPosts(n), () => (shownPosts(n).ids.length ? "" : "Nothing here yet.")),
  );
};
export const loadProfile = ({ id = "0" }: Record<string, string>) => shownPosts(Number(id)).load();

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
export const alerts = paged((ids) => api.alerts(ids.length));

const alertRow = (k: number) => {
  const a = alertAt(k);
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
};

export const Alerts = () => {
  if (!alerts.ids.length) alerts.load();
  return div(windowed(() => alerts.ids, (k) => k, alertRow), more(() => alerts, () => `That's all ${grouped(ALERTS)} notifications.`));
};
