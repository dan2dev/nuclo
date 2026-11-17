// expect: Comparing a bigint with a number is not supported natively
// code: NUCLO6002
export function over(b: bigint, n: number): boolean {
  return b < n;
}
