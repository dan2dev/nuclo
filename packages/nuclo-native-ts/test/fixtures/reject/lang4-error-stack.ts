// expect: an error's `stack` natively
// code: NUCLO4004
export function where(e: Error): string {
  return e.stack ?? "";
}
