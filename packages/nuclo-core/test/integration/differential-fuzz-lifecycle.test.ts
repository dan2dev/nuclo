/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it } from "vitest";
import { runSeed, type Mode, type RunOptions } from "./fuzz-harness";

/**
 * Same differential fuzzing as differential-fuzz.test.ts, with <article>
 * elements carrying mount/destroy hooks mixed into the random trees. On top of
 * the DOM-vs-model comparison, every step asserts the lifecycle invariants:
 * mount fires once, on a connected element; destroy fires once, only after
 * mount; the connected <article>s are exactly the mounted-and-not-destroyed
 * set; every mount-returned cleanup ran with its destroy.
 */
const SEEDS = Number(process.env.FUZZ_SEEDS ?? 120);
const START = Number(process.env.FUZZ_START ?? 0);
const MODES: Array<[Mode, RunOptions["ssr"]]> = [
  ["client", "dom"],
  ["hydrate", "dom"],
  ["hydrate", "polyfill"],
  ["hydrate-mismatch", "dom"],
  ["hydrate-mismatch", "polyfill"],
];

describe("differential fuzz — lifecycle hooks", () => {
  for (const [mode, ssr] of MODES) {
    it(`${mode}${mode === "client" ? "" : ` (SSR on ${ssr})`}: ${SEEDS} random apps`, async () => {
      for (let seed = START; seed < START + SEEDS; seed++) {
        runSeed(seed, mode, { lifecycle: true, ssr });
        // WeakRef targets stay alive until the current job ends — yield so a
        // long run does not retain every tree it ever built.
        if (seed % 50 === 49) await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }, 60_000 + SEEDS * 50);
  }
});
