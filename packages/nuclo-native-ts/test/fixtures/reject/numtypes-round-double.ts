// expect: may not fit Int16 (-32768…32767)
// code: NUCLO3001
import type { Double, Int16 } from "../../../src/index.ts";
// Math.round(NaN) is NaN: a clamp of a Double is not whole (or a number) until it is masked.
export function snap(d: Double): number {
  const x: Int16 = Math.round(Math.min(Math.max(d, -100), 100));
  return x;
}
