// expect: which has subclasses
// code: NUCLO4004
class Shape {
  kind = "shape";
}
class Square extends Shape {
  side = 1;
}
export function write(s: Shape): string {
  return JSON.stringify(s) + String(new Square().side);
}
