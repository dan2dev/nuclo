// feeds.ts: the data sources. Stock prices, server load, an order log and a
// clock, each moved one step forward by its own function. They are plain
// numbers and arrays, and none of them knows who shows them or how often.
// The first values come from a hash of an index, so the server and the
// browser start from the same numbers; Math.random() only runs once they tick.

export const HISTORY = 40; // prices kept per ticker
export const SAMPLES = 60; // load samples kept: 15 seconds at 4 a second
const LOG_SIZE = 8; // orders kept

// A small integer hash, as in infinite-scroll/api.ts. unit() maps it to [0, 1).
function hash(n: number) {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return (n ^ (n >>> 16)) >>> 0;
}
const unit = (n: number) => hash(n) / 2 ** 32;
const pick = <T,>(list: T[], id: number, salt: number) => list[hash(id * 31 + salt) % list.length];

// `length` values, each one next() of the one before it, fed a fixed random number.
function series(first: number, length: number, salt: number, next: (prev: number, r: number) => number) {
  const values = [first];
  while (values.length < length) values.push(next(values[values.length - 1], unit(salt + values.length)));
  return values;
}

// Drops the oldest value and appends the newest, in place.
function roll(values: number[], value: number) {
  values.shift();
  values.push(value);
  return value;
}

// ── Tickers: a random walk, one step per tick ────────────────────────────

export interface Ticker {
  symbol: string;
  open: number; // the first price: the change is measured from it
  price: number;
  history: number[]; // the last HISTORY prices, oldest first
}

const walk = (price: number, r: number) => price * (1 + (r - 0.5) * 0.004); // ±0.2% at most

export const tickers: Ticker[] = ["NUCL", "ACME", "BYTE", "CORE", "HTML", "LIST", "NODE", "WHEN"].map((symbol, i) => {
  const history = series(20 + unit(i + 1) * 300, HISTORY, i * 100, walk);
  return { symbol, open: history[0], price: history[HISTORY - 1], history };
});

/** The change since the open, in percent. */
export const change = (t: Ticker) => (t.price / t.open - 1) * 100;

export function stepTickers() {
  for (const t of tickers) t.price = roll(t.history, walk(t.price, Math.random()));
}

// ── Server load: CPU and memory in percent, and requests per second ──────

// Each sample lands up to `step` points away from the last one.
const wander = (step: number) => (prev: number, r: number) => Math.min(98, Math.max(2, prev + (r - 0.5) * 2 * step));
const nextCpu = wander(9);
const nextMemory = wander(1.5);

export const load = { cpu: series(40, SAMPLES, 1000, nextCpu), memory: series(62, SAMPLES, 2000, nextMemory), rps: 1000 };

export function stepLoad() {
  const cpu = roll(load.cpu, nextCpu(load.cpu[SAMPLES - 1], Math.random()));
  roll(load.memory, nextMemory(load.memory[SAMPLES - 1], Math.random()));
  load.rps = Math.round(cpu * 24 + Math.random() * 120); // a busier server is serving more
}

// ── Orders: newest first, the oldest falls off ───────────────────────────

export interface Order {
  id: number;
  who: string;
  qty: number;
  item: string;
  cents: number;
}

const NAMES = ["Ada", "Grace", "Linus", "Margaret", "Dennis", "Barbara", "Ken", "Radia"];
const ITEMS: [string, number][] = [["keyboard", 8900], ["monitor", 24900], ["mouse", 3900], ["desk lamp", 4500], ["headset", 12900], ["webcam", 7900]];

// An order is a fixed function of its id, like a post in infinite-scroll/api.ts.
// Only when the next one arrives is random, and the app's timer decides that.
function order(id: number): Order {
  const [item, price] = pick(ITEMS, id, 1);
  const qty = pick([1, 1, 1, 2, 3], id, 2);
  return { id, who: pick(NAMES, id, 3), qty, item, cents: qty * price };
}

let nextId = 1000;
export const orders: Order[] = Array.from({ length: LOG_SIZE }, () => order(nextId++)).reverse();

export function pushOrder() {
  orders.unshift(order(nextId++));
  if (orders.length > LOG_SIZE) orders.pop();
}

// ── Clock ────────────────────────────────────────────────────────────────

// null until the first tick: the server and the browser have no "now" to agree on.
export const clock = { now: null as Date | null };

export function stepClock() {
  clock.now = new Date();
}
