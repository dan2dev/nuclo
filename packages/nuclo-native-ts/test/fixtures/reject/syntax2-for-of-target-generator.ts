// expect: a for-of with an existing variable (or pattern) over anything but an array
// code: NUCLO6002
function* count(): Generator<number> {
  yield 1;
  yield 2;
}
export function total(): number {
  let n = 0;
  let sum = 0;
  for (n of count()) sum += n;
  return sum;
}
