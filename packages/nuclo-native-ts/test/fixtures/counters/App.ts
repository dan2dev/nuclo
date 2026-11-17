// Counters (adapters2): an Int only where a loop bounds it by an Int; Kotlin's Int is 32 bits.
import { div, p, render } from "../../../src/index.ts";

let ticks = 0;
export function tick(): number {
  ticks++;
  return ticks;
}

export function count(xs: number[], n: number): number {
  let hits = 0;
  for (let i = 0; i < xs.length; i++) for (let j = 0; j < n; j++) if (xs[i]! > j) hits++;
  return hits;
}

render(() => div(p(`${tick()} ${count([1, 2], 2)}`)));
