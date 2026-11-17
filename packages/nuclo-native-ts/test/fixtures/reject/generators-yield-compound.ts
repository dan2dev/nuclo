// expect: a `yield` in a compound assignment
// code: NUCLO6002
function* sums(): Generator<number, void, number> {
  let total = 0;
  total += yield total;
  yield total;
}
export function first(): boolean {
  return sums().next().done ?? false;
}
