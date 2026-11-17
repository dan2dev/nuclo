// expect: Comparing two typed arrays is not supported natively
// code: NUCLO6002
export function same(a: Float32Array, b: Float32Array): boolean {
  return a === b;
}
