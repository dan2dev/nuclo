// expect: callbacks must return a boolean natively
// code: NUCLO6001
export function present(xs: (number | undefined)[]): number {
  return xs.filter((x) => x).length;
}
