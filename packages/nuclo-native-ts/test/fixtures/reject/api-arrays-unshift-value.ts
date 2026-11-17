// expect: unshift() of several items as a value
// code: NUCLO6002
export function grow(xs: number[]): number {
  return xs.unshift(1, 2);
}
