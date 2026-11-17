// expect: can't be a member of one
// code: NUCLO1003
export function show(v: bigint | string): string {
  return typeof v === "string" ? v : v.toString();
}
