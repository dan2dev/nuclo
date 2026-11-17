// expect: Object.fromEntries() is not supported natively
// code: NUCLO6002
export function rec(pairs: Map<string, number>): Record<string, number> {
  return Object.fromEntries(pairs);
}
