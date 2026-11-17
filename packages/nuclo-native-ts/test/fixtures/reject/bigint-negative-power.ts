// expect: A bigint to a negative power always throws a RangeError
// code: NUCLO2002
export function inverse(b: bigint): bigint {
  return b ** -1n;
}
