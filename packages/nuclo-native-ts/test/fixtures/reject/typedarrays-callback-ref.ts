// expect: Pass a typed array method an arrow function natively
// code: NUCLO6001
function twice(x: number): number {
  return x * 2;
}
export const doubled = Int16Array.of(1, 2).map(twice);
