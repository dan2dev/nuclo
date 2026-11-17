// expect: map() is not supported on a UInt8[]
// code: NUCLO3001
import type { Float32, Int16, Int64, Int8, UInt8 } from "../../../src/index.ts";
export function doubled(xs: UInt8[]): number[] {
  return xs.map((x) => x * 2);
}
