// expect: JSON.stringify of a value that may be undefined gives undefined
// code: NUCLO1004
export function write(x: string | undefined): string {
  return JSON.stringify(x);
}
