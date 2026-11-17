// expect: ArrayIterator<number> has no native equivalent
// code: NUCLO1002
export function keys(xs: string[]): number {
  const ks = xs.keys();
  let n = 0;
  for (const k of ks) n += k;
  return n;
}
