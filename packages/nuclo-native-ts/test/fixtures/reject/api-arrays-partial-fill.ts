// expect: makes an array of n holes
// code: NUCLO6001
export function partial(n: number): number[] {
  return new Array<number>(n).fill(0, 1);
}
