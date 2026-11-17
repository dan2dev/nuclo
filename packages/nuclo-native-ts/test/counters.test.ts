/** Counters (adapters2): one that no loop condition bounds is a Double, so Kotlin's 32-bit Int never wraps past 2^31. */
import { expect, test } from "bun:test";
import * as path from "node:path";
import { emitKotlin } from "../src/compiler/emitKotlin.ts";
import { transpile } from "../src/compiler/transpile.ts";

test("unbounded counters are Doubles, loop indexes Ints", () => {
  const kt = emitKotlin(transpile(path.join(import.meta.dir, "fixtures/counters/App.ts")));
  expect(kt).toMatch(/var ticks: Double/);
  expect(kt).toMatch(/var hits: Double/);
  expect(kt).toContain("for (i in 0 until xs.size)");
  expect(kt).toContain("n: Int");
});
