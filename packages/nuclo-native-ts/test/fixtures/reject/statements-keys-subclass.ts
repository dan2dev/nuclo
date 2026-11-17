// expect: which has subclasses
// code: NUCLO4004
class Shape {
  size = 1;
}
class Square extends Shape {
  side = 2;
}
export function keysOf(s: Shape): string[] {
  return Object.keys(s);
}
export const sq = keysOf(new Square());
