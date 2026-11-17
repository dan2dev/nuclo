// expect: may not fit Int8 (-128…127) (it can be -256…254)
// code: NUCLO3001
import type { Float32, Int16, Int64, Int8, UInt8 } from "../../../src/index.ts";
export function twice(a: Int8): number {
  const b: Int8 = a + a;
  return b;
}
