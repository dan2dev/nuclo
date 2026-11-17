// expect: A bigint division by 0n always throws a RangeError
// code: NUCLO2002
export function half(b: bigint): bigint {
  return b / 0n;
}
