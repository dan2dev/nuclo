// Chirp's server, faked: every call answers later, as a request would, and can fail. Replies take a varying time,
// so two requests can answer out of order: the client side below is written for that.
import {
  ALERTS,
  type Draft,
  type Profile,
  addReply,
  alertAt,
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
} from "./data";

/** The network the settings screen sets: a reply's usual delay in ms, and whether every third request fails. */
export const network = { latency: 250, failing: false };

let requests = 0;

/** One request: `reply` runs when the server gets to it, between half and one and a half times the latency later. */
function request<T>(reply: () => T): Promise<T> {
  const n = ++requests;
  return new Promise((resolve, reject) => {
    const answer = () => {
      if (network.failing && n % 3 === 0) reject(new Error("Network error"));
      else resolve(reply());
    };
    // A host without timers answers at once.
    if (typeof setTimeout === "function") setTimeout(answer, network.latency * (0.5 + ((n * 37) % 100) / 100));
    else answer();
  });
}

/** A page of a list: its ids, and whether it was the last. */
export interface Page {
  ids: number[];
  done: boolean;
}

const PAGE = 20;
const page = (ids: number[], limit = PAGE): Page => ({ ids, done: ids.length < limit });
const slice = (all: number[], offset: number): Page => page(all.slice(offset, offset + PAGE));

export const api = {
  // Cursors, not offsets: a post written meanwhile moves every offset, but not what comes after a post.
  feed: (after?: number) => request(() => page(feedAfter(after, PAGE))),
  topic: (topic: string, after?: number) => request(() => page(topicAfter(topic, after, PAGE))),
  postsBy: (author: number, mediaOnly: boolean, offset: number) =>
    request(() => slice(postsBy(author).filter((id) => !mediaOnly || post(id).media.kind !== "none"), offset)),
  replies: (id: number) => request(() => repliesTo(id)),
  likers: (id: number, offset: number) => request(() => page(likersOf(id, offset, PAGE))),
  people: (query: string, offset: number) =>
    request(() => {
      const found = searchUsers(query, offset, PAGE);
      return { ids: found.ids, done: offset + PAGE >= found.total, total: found.total };
    }),
  friends: (id: number) => request(() => friendsOf(id)),
  alerts: (offset: number) => request(() => page(Array.from({ length: Math.min(PAGE, ALERTS - offset) }, (_, k) => offset + k))),
  handleFree: (handle: string) => request(() => handleFree(handle)),

  // Changes say what the value becomes, not "toggle": sent twice, or late, they still end where the user left it.
  setLiked: (id: number, on: boolean) => request(() => setLiked(id, on)),
  setReposted: (id: number, on: boolean) => request(() => setReposted(id, on)),
  setFriend: (id: number, on: boolean) => request(() => setFriend(id, on)),
  createPost: (draft: Draft) => request(() => createPost(draft)),
  reply: (id: number, text: string) => request(() => addReply(id, text)),
  saveProfile: (profile: Profile) => request(() => saveProfile(profile)),
};

// ── The client side: what keeps replies that come late, twice or out of order from showing ─────────────────────

/** A list that loads a page at a time. */
export interface Paged {
  ids: number[];
  loading: boolean;
  failed: boolean;
  done: boolean;
  /** Loads the next page, unless one is on its way or there is none. */
  load(): void;
  /** Starts over: a reply still on its way to the old list is dropped. */
  reset(): void;
}

/** `fetch` gets the ids loaded so far, for its cursor or offset. */
export function paged(fetch: (ids: number[]) => Promise<Page>): Paged {
  let version = 0;
  const list: Paged = {
    ids: [],
    loading: false,
    failed: false,
    done: false,
    load() {
      if (list.loading || list.done) return;
      const asked = version;
      list.loading = true;
      list.failed = false;
      fetch(list.ids).then(
        (next) => {
          if (asked !== version) return;
          list.ids.push(...next.ids);
          list.done = next.done;
          list.loading = false;
          update();
        },
        () => {
          if (asked !== version) return;
          list.failed = true;
          list.loading = false;
          update();
        },
      );
    },
    reset() {
      version++;
      list.ids = [];
      list.loading = list.failed = list.done = false;
      list.load();
    },
  };
  return list;
}

/** Runs requests of one kind so that only the latest one's reply counts: an older one that answers late is dropped. */
export function latest() {
  let last = 0;
  return <T>(reply: Promise<T>, then: (value: T) => void, failed: () => void = () => {}) => {
    const asked = ++last;
    reply.then(
      (value) => asked === last && then(value),
      () => asked === last && failed(),
    );
  };
}

/** Runs `fn` once the user has paused for `ms`: each call puts the one before it off. A host without timers runs it now. */
export function debounced(fn: () => void, ms = 250) {
  let timer = 0;
  return () => {
    if (typeof setTimeout !== "function") return fn();
    clearTimeout(timer);
    timer = Number(setTimeout(fn, ms));
  };
}

/** What failed last, for a banner; cleared a few seconds later. */
export const notice = { text: "" };
let noticeTimer = 0;
export function warn(text: string) {
  notice.text = text;
  update();
  if (typeof setTimeout !== "function") return;
  clearTimeout(noticeTimer);
  noticeTimer = Number(
    setTimeout(() => {
      notice.text = "";
      update();
    }, 4000),
  );
}

/** Switches the user flipped while their last request was out: what they chose last. */
const wanted = new Map<string, boolean>();

/**
 * Shows a switch (a like, a friend) flipped at once and tells the server. One request per switch at a time: flipped
 * again meanwhile, the server is told again once it answers, so it ends where the user left it whatever order the
 * replies come in. A failure puts back what the server has.
 */
export function flip(key: string, on: boolean, show: (on: boolean) => void, send: (on: boolean) => Promise<unknown>, what: string) {
  show(on);
  update();
  const busy = wanted.has(key);
  wanted.set(key, on);
  if (busy) return;
  const tell = (sent: boolean): void =>
    void send(sent).then(
      () => {
        const now = wanted.get(key)!;
        if (now !== sent) return tell(now);
        wanted.delete(key);
      },
      () => {
        wanted.delete(key);
        show(!sent);
        warn(`Couldn't reach Chirp: ${what} was undone.`);
      },
    );
  tell(on);
}
