// expect: can't be passed as a function value natively
// code: NUCLO3001
import type { Float32, Int16, Int64, Int8, UInt8 } from "../../../src/index.ts";
function clampByte(x: number): UInt8 {
  return Math.min(Math.max(x | 0, 0), 255);
}
export function all(xs: number[]): number[] {
  return xs.map(clampByte);
}
