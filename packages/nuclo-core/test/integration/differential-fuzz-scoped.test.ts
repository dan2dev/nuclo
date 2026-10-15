/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it } from "vitest";
import { runScopedSeed } from "./fuzz-harness";

/**
 * Model-based fuzzing of scope() + update(id) over changing structure — see
 * runScopedSeed() in ./fuzz-harness.ts. Each seed renders a random tree
 * (nested elements, when() chains, keyed and primitive lists, SVG, buttons,
 * optional lifecycle hooks) with <nav>/<aside> scope roots anywhere in it —
 * inside branches, inside rows, nested in each other — then applies a long
 * run of random data mutations, each followed by a scoped update naming some
 * of the roots and only rarely a full update(). After every step the DOM
 * must match a reference model in which each node shows the state of the
 * last update that covered it, so nodes a scoped update creates (a branch
 * that opens, rows that arrive, roots inside them) are checked to keep
 * following later scoped updates.
 *
 * FUZZ_SEEDS=2000 FUZZ_START=0 widens the search; a failure message carries
 * the seed and step needed to reproduce it.
 */
const SEEDS = Number(process.env.FUZZ_SEEDS ?? 200);
const START = Number(process.env.FUZZ_START ?? 0);

describe("differential fuzz — scoped updates over changing structure", () => {
  for (const lifecycle of [false, true]) {
    it(`${lifecycle ? "with" : "without"} lifecycle hooks: ${SEEDS} random apps`, async () => {
      for (let seed = START; seed < START + SEEDS; seed++) {
        runScopedSeed(seed, { lifecycle, rounds: 16 });
        if (seed % 50 === 49) await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }, 60_000 + SEEDS * 100);
  }
});
