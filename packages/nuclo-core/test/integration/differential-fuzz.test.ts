/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it } from "vitest";
import { runSeed, type Mode, type RunOptions } from "./fuzz-harness";

/**
 * Model-based differential fuzzing of render / SSR+hydrate / update /
 * forceUpdate — see ./fuzz-harness.ts. Lifecycle hooks are fuzzed in a
 * separate file so this one also covers the lifecycle-free fast paths
 * (hasActiveLifecycleRegistrations() stays false for the whole file).
 *
 * FUZZ_SEEDS=5000 FUZZ_START=0 widens the search; a failure message carries
 * the seed and mode needed to reproduce it.
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

describe("differential fuzz — DOM always matches the reference model", () => {
  for (const [mode, ssr] of MODES) {
    it(`${mode}${mode === "client" ? "" : ` (SSR on ${ssr})`}: ${SEEDS} random apps`, async () => {
      for (let seed = START; seed < START + SEEDS; seed++) {
        runSeed(seed, mode, { lifecycle: false, ssr });
        // WeakRef targets stay alive until the current job ends — yield so a
        // long run does not retain every tree it ever built.
        if (seed % 50 === 49) await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }, 60_000 + SEEDS * 50);
  }
});
