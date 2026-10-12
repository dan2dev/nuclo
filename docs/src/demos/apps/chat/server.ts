// server.ts: a fake chat backend and its socket. The channel's history is
// 5,000 messages generated from their id, so the same cursor always returns
// the same page. Requests take a moment, and sending sometimes fails. The socket brings
// what other people post, after showing that they are typing, and a bot
// answers what you send. Nothing here knows about the UI.

export interface Message {
  id: number;
  author: string;
  text: string;
  at: number; // ms since the epoch
}

export type ChannelEvent =
  | { type: "typing"; author: string }
  | { type: "message"; message: Message }
  | { type: "online"; count: number };

export const ME = "you";
const BOT = "nuclo-bot";
const HISTORY = 5000;
const PAGE = 30;
const GAP = 4 * 60_000; // ms between two history messages, on average

const AUTHORS = ["Ada", "Grace", "Linus", "Margaret", "Dennis", "Barbara", "Ken", "Radia"];
const SHORT = ["+1", "lgtm", "nice!", "on it", "ha, same", "thanks!", "which branch?", "merged", "brb, coffee", "can't reproduce"];
const OPENERS = ["Pushed a fix for", "Reviewed", "Reverted", "Finally fixed", "Still debugging", "Benchmarked", "Rewrote", "Deleted half of", "Paired on", "Wrote tests for"];
const SUBJECTS = ["the list diff", "the router", "the docs build", "hydration", "the style engine", "the flaky test", "the update loop", "the scroll anchoring", "the composer", "the fake socket"];
const ENDINGS = ["today.", "before lunch.", "on main.", "with half the code.", "in one update() call.", "without a store.", "if anyone wants to look.", "for the next release.", "with Ada.", "this morning."];
const REPLIES = ["Noted.", "Agreed.", "Tell me more.", "Filed under #general.", "Everyone saw that after one update()."];

// A small integer hash: every field of a history message is a function of its id.
function hash(n: number) {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return (n ^ (n >>> 16)) >>> 0;
}
const pick = <T,>(list: T[], n: number, salt: number) => list[hash(n * 31 + salt) % list.length];
const random = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

const sentence = (n: number) => `${pick(OPENERS, n, 2)} ${pick(SUBJECTS, n, 3)} ${pick(ENDINGS, n, 4)}`;

// Any number makes a message: a short reply, or one to three sentences.
function say(n: number) {
  const h = hash(n);
  if (h % 4 === 0) return pick(SHORT, n, 1);
  return Array.from({ length: 1 + ((h % 7) % 3) }, (_, i) => sentence(n * 3 + i)).join(" ");
}

const opened = Date.now(); // the history ends when this module loads; everything after arrives live

function archived(id: number): Message {
  // Messages come in bursts: most of a block of four share an author.
  const author = pick(AUTHORS, hash(id) % 5 === 0 ? id : id >> 2, 5);
  // Each message gets a slot GAP wide and a random spot in it, so time only moves forward.
  return { id, author, text: say(id), at: opened - (HISTORY - id) * GAP + (hash(id + 7) % GAP) };
}

/** The messages before `before` (the id of the oldest one you have), oldest first. Empty at the beginning of the channel. */
export function fetchHistory(before = HISTORY): Promise<Message[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const from = Math.max(0, before - PAGE);
      resolve(Array.from({ length: before - from }, (_, i) => archived(from + i)));
    }, 300 + Math.random() * 400);
  });
}

let nextId = HISTORY;
let online = 9;
let listener: ((e: ChannelEvent) => void) | null = null;
const timers = new Set<ReturnType<typeof setTimeout>>();

const emit = (e: ChannelEvent) => listener?.(e);
const stamp = (author: string, text: string): Message => ({ id: nextId++, author, text, at: Date.now() });

// A timer the socket owns: disconnecting clears every one still pending.
function later(ms: number, fn: () => void) {
  const timer = setTimeout(() => { timers.delete(timer); fn(); }, ms);
  timers.add(timer);
}

function typeThenPost(author: string, text: string, ms: number) {
  emit({ type: "typing", author });
  later(ms, () => emit({ type: "message", message: stamp(author, text) }));
}

// Other people, now and then: someone types and posts, someone comes or goes.
function chatter() {
  if (Math.random() < 0.3) {
    online = Math.max(3, online + (Math.random() < 0.5 ? -1 : 1));
    emit({ type: "online", count: online });
  }
  typeThenPost(random(AUTHORS), say(Math.floor(Math.random() * 1e9)), 1500 + Math.random() * 2500);
  later(5000 + Math.random() * 7000, chatter);
}

/** Stores your message. It takes a moment and fails about one time in seven; then the bot answers on the socket. */
export function send(text: string): Promise<Message> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.15) return reject(new Error("Not delivered."));
      resolve(stamp(ME, text));
      const quote = text.length > 48 ? `${text.slice(0, 48)}…` : text;
      later(600, () => typeThenPost(BOT, `“${quote}”: ${random(REPLIES)}`, 1200));
    }, 400 + Math.random() * 600);
  });
}

/** Opens the socket: `onEvent` hears typing, messages and the online count. Returns the disconnect. */
export function connect(onEvent: (e: ChannelEvent) => void) {
  listener = onEvent;
  emit({ type: "online", count: online });
  later(2000, chatter);
  return () => {
    listener = null;
    timers.forEach(clearTimeout);
    timers.clear();
  };
}
