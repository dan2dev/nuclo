// expect: This array is not a UInt8[]
// code: NUCLO3001
import type { Float32, Int16, Int64, Int8, UInt8 } from "../../../src/index.ts";
export function pack(xs: number[]): UInt8[] {
  return xs;
}
