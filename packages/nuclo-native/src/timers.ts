/**
 * setTimeout and setInterval for the bare engines (Hermes, QuickJS, Jint), which have none. The host has
 * one call, __nuclo_timer(id, ms), and answers once, at least `ms` later, with __nuclo_event(id, "timer"). A cleared
 * timer is only forgotten here: the host fires it into nothing.
 */
const g = globalThis as unknown as Record<string, unknown>;
/** Each waiting timer's callback, and its period when it repeats. */
const waiting = new Map<number, [run: () => void, every?: number]>();
let last = 0;

type Callback = (...args: unknown[]) => void;

function start(run: () => void, ms = 0, every?: number) {
  waiting.set(++last, [run, every]);
  globalThis.__nuclo_timer!(last, Math.max(0, Number(ms) || 0));
  return last;
}

/** The host's answer: runs the timer, and arms it again when it repeats. */
export function fire(id: number) {
  const timer = waiting.get(id);
  if (!timer) return;
  if (timer[1] === undefined) waiting.delete(id);
  else globalThis.__nuclo_timer!(id, timer[1]);
  timer[0]();
}

if (typeof g.setTimeout !== "function" && typeof globalThis.__nuclo_timer === "function") {
  g.setTimeout = (fn: Callback, ms?: number, ...args: unknown[]) => start(() => fn(...args), ms);
  g.setInterval = (fn: Callback, ms?: number, ...args: unknown[]) => start(() => fn(...args), ms, Math.max(0, Number(ms) || 0));
  g.clearTimeout = g.clearInterval = (id: number) => void waiting.delete(id);
}
