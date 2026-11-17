// expect: Destructuring into a sized number
// code: NUCLO3001
import type { Int8 } from "../../../src/index.ts";
export function sized(xs: number[]): number {
  let a: Int8 = 0;
  let b = 0;
  [a, b] = [xs.length, 2];
  return a + b;
}
