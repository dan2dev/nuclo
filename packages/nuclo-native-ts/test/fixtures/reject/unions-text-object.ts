// expect: into text natively (JavaScript prints an object as [object Object]
// code: NUCLO6002
export function show(v: Record<string, number> | string): string {
  return `${v}`;
}
