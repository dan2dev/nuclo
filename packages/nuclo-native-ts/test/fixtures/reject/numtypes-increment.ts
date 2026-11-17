// expect: may leave UInt8's range
// code: NUCLO3001
import type { Float32, Int16, Int64, Int8, UInt8 } from "../../../src/index.ts";
export function count(n: number): number {
  let c: UInt8 = 0;
  for (let i = 0; i < n; i++) c++;
  return c;
}
