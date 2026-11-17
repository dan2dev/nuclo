// expect: calls itself
// code: NUCLO6000
export function* walk(n: number) {
  function down(k: number): number {
    return k <= 0 ? 0 : down(k - 1) + 1;
  }
  yield 0;
  yield down(n);
}
