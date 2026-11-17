// expect: a map that may hold undefined
// code: NUCLO6001
export function write(m: Record<string, number | undefined>): string {
  return JSON.stringify(m);
}
