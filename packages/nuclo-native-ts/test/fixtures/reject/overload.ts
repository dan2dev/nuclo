// expect: overloaded
// code: NUCLO1003
function size(x: string): number;
function size(x: string[]): number;
function size(x: string | string[]): number {
  return typeof x === "string" ? x.length : x.length;
}
export const measure = size;
