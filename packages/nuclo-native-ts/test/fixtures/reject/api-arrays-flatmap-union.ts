// expect: flatMap() callbacks return either an array or a value
// code: NUCLO6001
export function spread(xs: number[]): number[] {
  return xs.flatMap((x) => (x > 1 ? [x, x] : x));
}
