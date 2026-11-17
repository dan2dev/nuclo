// expect: an `await` (or `yield`) in an assignment used as a value
// code: NUCLO6002
export async function next(p: Promise<number>): Promise<number> {
  let n = 0;
  return (n = await p) + 1;
}
