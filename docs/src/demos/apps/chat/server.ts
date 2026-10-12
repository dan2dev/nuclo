// server.ts: a fake multi-channel chat backend and its socket. Each channel's
// history is generated from its message ids, so the same cursor always returns
// the same page. Requests take a moment, and sending sometimes fails. The
// socket brings what other people post — per channel — after showing that they
// are typing; a bot answers what you send, and once in a while someone reacts
// to a message. Nothing here knows about the UI.

export interface Message {
  id: number;
  author: string;
  text: string;
  at: number; // ms since the epoch
}

export interface ChannelInfo {
  id: string;
  name: string; // "# general"
  topic: string;
}

export type ChannelEvent =
  | { type: "typing"; channel: string; author: string }
  | { type: "message"; channel: string; message: Message }
  | { type: "reaction"; channel: string; messageId: number; emoji: string }
  | { type: "online"; channel: string; count: number };

export const ME = "you";
const BOT = "nuclo-bot";
const PAGE = 30;
const GAP = 4 * 60_000; // ms between two history messages, on average

// Each channel: how much history it has, and a salt so its archive differs.
export const CHANNELS: ChannelInfo[] = [
  { id: "general", name: "# general", topic: "The build, the demos and everything in between" },
  { id: "random", name: "# random", topic: "Off-topic: lunch, keyboards, compilers" },
  { id: "nuclo", name: "# nuclo", topic: "One update() call at a time" },
];
const SIZE: Record<string, number> = { general: 5000, random: 3000, nuclo: 2000 };
const SALT: Record<string, number> = { general: 1, random: 2, nuclo: 3 };

const AUTHORS = ["Ada", "Grace", "Linus", "Margaret", "Dennis", "Barbara", "Ken", "Radia"];
const SHORT = ["+1", "lgtm", "nice!", "on it", "ha, same", "thanks!", "which branch?", "merged", "brb, coffee", "can't reproduce"];
const OPENERS = ["Pushed a fix for", "Reviewed", "Reverted", "Finally fixed", "Still debugging", "Benchmarked", "Rewrote", "Deleted half of", "Paired on", "Wrote tests for"];
const SUBJECTS = ["the list diff", "the router", "the docs build", "hydration", "the style engine", "the flaky test", "the update loop", "the scroll anchoring", "the composer", "the fake socket"];
const ENDINGS = ["today.", "before lunch.", "on main.", "with half the code.", "in one update() call.", "without a store.", "if anyone wants to look.", "for the next release.", "with Ada.", "this morning."];
const REPLIES = ["Noted.", "Agreed.", "Tell me more.", "Filed under #general.", "Everyone saw that after one update()."];

// #nuclo posts are markdown-heavy, so the demo shows code spans, bold, links
// and @mentions; #random is short and loud.
const MD = [
  "**merged** the router after `list()` matched every row by identity.",
  "`update()` twice, no store: the message showed before the server had it, and Retry just calls `send()` again.",
  "Pushed a fix for the **hydration** edge case: `scope()` ids are cleaned up now.",
  "see https://nuclo.dev/docs/api-list for how a `list()` reconciles.",
  "@you have you tried **Shift+Enter** in the composer? `field-sizing` grows it for you.",
  "Benchmarked the style engine: `css()` compiles once, `cx()` just compares class strings.",
  "Rewrote the update loop with `queueMicrotask`: every `update()` in one tick coalesces.",
  "`unshift()` the older page, grow `scrollTop` by the height it added: nothing on screen moves.",
  "The typing line is `when(() => typing.size > 0, …)`: one update() and it is there.",
];
const RANDOM = [
  "lunch was **tacos** 🌮", "brb, coffee ☕", "anyone tried `nuclo@next` yet?",
  "ship it 🚀", "**weekend** plans: rewrite the router in 300 lines", "🎉 it passed on main",
  "the demo ate my `localStorage`, nice", "keyboard arrived, typing **+11%** faster",
];

// A small integer hash: every field of a history message is a function of its id.
function hash(n: number) {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return (n ^ (n >>> 16)) >>> 0;
}
const pick = <T,>(list: T[], n: number, salt: number) => list[hash(n * 31 + salt) % list.length];
const random = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

const sentence = (ch: ChannelInfo, n: number) => `${pick(OPENERS, n, SALT[ch.id] + 2)} ${pick(SUBJECTS, n, SALT[ch.id] + 3)} ${pick(ENDINGS, n, SALT[ch.id] + 4)}`;

// Any number makes a message: a short reply, or one to three sentences.
function say(ch: ChannelInfo, n: number) {
  const h = hash(n * 31 + SALT[ch.id]);
  if (ch.id === "nuclo") return h % 4 === 0 ? pick(SHORT, n, SALT[ch.id]) : pick(MD, n, SALT[ch.id] + 7);
  if (ch.id === "random") return h % 3 === 0 ? pick(SHORT, n, SALT[ch.id]) : pick(RANDOM, n, SALT[ch.id] + 7);
  if (h % 4 === 0) return pick(SHORT, n, SALT[ch.id]);
  return Array.from({ length: 1 + ((h % 7) % 3) }, (_, i) => sentence(ch, n * 3 + i)).join(" ");
}

const opened = Date.now(); // the history ends when this module loads; everything after arrives live

function archived(ch: ChannelInfo, id: number): Message {
  // Messages come in bursts: most of a block of four share an author.
  const author = pick(AUTHORS, hash(id * 7 + SALT[ch.id]) % 5 === 0 ? id : id >> 2, 5);
  // Each message gets a slot GAP wide and a random spot in it, so time only moves forward.
  return { id, author, text: say(ch, id), at: opened - (SIZE[ch.id] - id) * GAP + (hash(id + SALT[ch.id]) % GAP) };
}

/** The messages before `before` (the id of the oldest one you have), oldest first. Empty at the beginning of the channel. */
export function fetchHistory(channelId: string, before = SIZE[channelId]): Promise<Message[]> {
  const ch = CHANNELS.find((c) => c.id === channelId) ?? CHANNELS[0];
  return new Promise((resolve) => {
    setTimeout(() => {
      const from = Math.max(0, before - PAGE);
      resolve(Array.from({ length: before - from }, (_, i) => archived(ch, from + i)));
    }, 300 + Math.random() * 400);
  });
}

const EMOJIS = ["👍", "🚀", "😂", "❤️", "🔥"];
const nextId: Record<string, number> = { general: 5000, random: 3000, nuclo: 2000 };
const online: Record<string, number> = { general: 9, random: 5, nuclo: 4 };
let listener: ((e: ChannelEvent) => void) | null = null;
const timers = new Set<ReturnType<typeof setTimeout>>();

const emit = (e: ChannelEvent) => listener?.(e);
const stamp = (channelId: string, author: string, text: string): Message => ({ id: nextId[channelId]++, author, text, at: Date.now() });

// A timer the socket owns: disconnecting clears every one still pending.
function later(ms: number, fn: () => void) {
  const timer = setTimeout(() => { timers.delete(timer); fn(); }, ms);
  timers.add(timer);
}

function typeThenPost(ch: ChannelInfo, author: string, text: string, ms: number) {
  emit({ type: "typing", channel: ch.id, author });
  later(ms, () => {
    const message = stamp(ch.id, author, text);
    emit({ type: "message", channel: ch.id, message });
    if (Math.random() < 0.3) {
      later(900 + Math.random() * 1500, () => emit({ type: "reaction", channel: ch.id, messageId: message.id, emoji: random(EMOJIS) }));
    }
  });
}

// Other people, now and then: someone types and posts, someone comes or goes.
function chatter(ch: ChannelInfo) {
  if (Math.random() < 0.3) {
    online[ch.id] = Math.max(2, online[ch.id] + (Math.random() < 0.5 ? -1 : 1));
    emit({ type: "online", channel: ch.id, count: online[ch.id] });
  }
  typeThenPost(ch, random(AUTHORS), say(ch, Math.floor(Math.random() * 1e9)), 1500 + Math.random() * 2500);
  later(5000 + Math.random() * 7000, () => chatter(ch));
}

/** Stores your message. It takes a moment and fails about one time in seven; then the bot answers and someone may react. */
export function send(channelId: string, text: string): Promise<Message> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.15) return reject(new Error("Not delivered."));
      const message = stamp(channelId, ME, text);
      resolve(message);
      const quote = text.length > 48 ? `${text.slice(0, 48)}…` : text;
      later(600, () => typeThenPost(CHANNELS.find((c) => c.id === channelId) ?? CHANNELS[0], BOT, `“${quote}”: ${random(REPLIES)}`, 1200));
      if (Math.random() < 0.7) {
        later(1500 + Math.random() * 1800, () => emit({ type: "reaction", channel: channelId, messageId: message.id, emoji: random(EMOJIS) }));
      }
    }, 400 + Math.random() * 600);
  });
}

/** Opens the socket: `onEvent` hears typing, messages, reactions and the online count of every channel. Returns the disconnect. */
export function connect(onEvent: (e: ChannelEvent) => void) {
  listener = onEvent;
  for (const ch of CHANNELS) {
    emit({ type: "online", channel: ch.id, count: online[ch.id] });
    later(1500 + Math.random() * 2500, () => chatter(ch));
  }
  return () => {
    listener = null;
    timers.forEach(clearTimeout);
    timers.clear();
  };
}
