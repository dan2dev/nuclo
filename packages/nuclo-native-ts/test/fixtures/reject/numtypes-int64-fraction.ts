// expect: may not fit Int64 (a whole number under 2^63) (it may not be a whole number)
// code: NUCLO3001
import type { Float32, Int16, Int64, Int8, UInt8 } from "../../../src/index.ts";
export function half(t: number): number {
  const h: Int64 = t / 2;
  return h;
}
