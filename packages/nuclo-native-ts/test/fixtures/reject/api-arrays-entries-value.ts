// expect: entries() as a value gives [index, item] pairs
// code: NUCLO6001
export function pairs(xs: number[]): number {
  return [...xs.entries()].length;
}
