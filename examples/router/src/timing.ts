/**
 * The withLoad() demo's clock, chunk delay and loader.
 *
 * Eager on purpose: routes.ts hands `loadTimed` to withLoad(), so it has to be
 * in the entry bundle — the whole point is that it runs before the page's
 * chunk has arrived.
 */
import type { DataLoader } from "nuclo-router";

/** When the measured navigation began; 0 means "since page load". */
export const clock = { startedAt: 0 };

/** Called by a button right before its go(), so the numbers are measured from the click. */
export const startClock = (): void => {
  clock.startedAt = performance.now();
};

const since = (): number => Math.round(performance.now() - clock.startedAt);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A chunk held for 600 ms, as if the network were slow. */
export const slowChunk = <T>(chunk: Promise<T>): Promise<T> => sleep(600).then(() => chunk);

export interface Timing {
  /** ms after the click that the data started loading. */
  dataStartedAt: number;
  dataEndedAt: number;
}

/** Data that takes 600 ms, recording when it started. */
export const loadTimed: DataLoader<Timing> = async () => {
  const dataStartedAt = since();
  await sleep(600);
  return { dataStartedAt, dataEndedAt: since() };
};

export const elapsed = since;
