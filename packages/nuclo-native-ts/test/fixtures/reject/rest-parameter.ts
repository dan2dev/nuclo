// expect: Spread arguments are supported for a rest parameter only
function add(a: number, b: number): number {
  return a + b;
}
export const xs: number[] = [1, 2];
export const total = add(...(xs as [number, number]));
