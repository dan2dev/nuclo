// expect: `for await` over anything but an async generator or an array
// code: NUCLO6002
function* nums(): Generator<number, void, unknown> {
  yield 1;
}
export async function total(): Promise<number> {
  let sum = 0;
  for await (const n of nums()) sum += n;
  return sum;
}
