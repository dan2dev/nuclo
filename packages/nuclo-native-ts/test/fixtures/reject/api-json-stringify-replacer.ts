// expect: A replacer (function or key list) is not supported natively
// code: NUCLO1004
export function write(xs: number[]): string {
  return JSON.stringify(xs, ["a"]);
}
