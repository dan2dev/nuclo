// expect: compound assignment to a typed array element with a computed array or index
// code: NUCLO6002
export function bump(xs: Int32Array, i: number) {
  xs[i + 1]! += 2;
}
