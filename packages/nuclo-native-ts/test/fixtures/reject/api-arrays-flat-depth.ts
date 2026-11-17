// expect: flat() takes a literal depth
// code: NUCLO6001
export function flatten(xs: number[][], depth: 1): number[] {
  return xs.flat(depth);
}
