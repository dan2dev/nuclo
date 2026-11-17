// expect: natively they are one nil
// code: NUCLO1004
export function kind(v: string | number | null | undefined): string {
  return typeof v;
}
