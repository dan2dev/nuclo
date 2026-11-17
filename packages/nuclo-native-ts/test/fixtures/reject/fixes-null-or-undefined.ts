// expect: on a value that may be either: natively null and undefined are one nil
// code: NUCLO1004
function pick(xs: (number | null)[], i: number): string {
  const x = xs[i];
  return x === null ? "null" : "other";
}
export const picked = pick([1, null], 1);
