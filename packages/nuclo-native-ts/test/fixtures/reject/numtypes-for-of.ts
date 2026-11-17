// expect: for…of over an Int8[]
// code: NUCLO3001
import type { Float32, Int16, Int64, Int8, UInt8 } from "../../../src/index.ts";
export function sum(xs: Int8[]): number {
  let total = 0;
  for (const x of xs) total += x;
  return total;
}
