// expect: A rest parameter typed by a type parameter
// code: NUCLO4002
function logged<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  return (...args: A): R => fn(...args);
}
export const add = logged((a: number, b: number) => a + b);
