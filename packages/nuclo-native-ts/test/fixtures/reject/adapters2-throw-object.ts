// expect: throwing anything but an Error or a primitive
// code: NUCLO2002
interface Point {
  x: number;
}
export function check(p: Point) {
  if (p.x < 0) throw p;
}
