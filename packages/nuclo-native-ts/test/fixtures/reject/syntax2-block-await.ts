// expect: a labelled block around an `await`
// code: NUCLO6002
export async function waits(): Promise<number> {
  let n = 0;
  block: {
    n = await Promise.resolve(1);
    if (n > 0) break block;
    n = 2;
  }
  return n;
}
