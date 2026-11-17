// expect: it may be null or undefined. Handle that first
// code: NUCLO1004
// A value that may be null or undefined (natively one nil): its text is "null" or "undefined".
export function label(name?: string | null): string {
  return `Hi ${name}`;
}
