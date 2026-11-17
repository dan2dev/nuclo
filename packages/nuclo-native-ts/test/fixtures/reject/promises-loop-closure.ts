// expect: declared in a loop that awaits
// code: NUCLO6000
export async function collect(ps: Promise<number>[]): Promise<(() => number)[]> {
  const out: (() => number)[] = [];
  for (const p of ps) {
    const v = await p;
    out.push(() => v);
  }
  return out;
}
