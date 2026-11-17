// expect: the value of a compound assignment to a typed array element
// code: NUCLO3001
export function bump(xs: Uint8Array): number {
  return (xs[0]! += 250);
}
