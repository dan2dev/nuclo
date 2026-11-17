// expect: A frozen object
// code: NUCLO6002
interface Point {
  x: number;
}
function move(p: Point): void {
  p.x += 1;
}
const origin = Object.freeze({ x: 0 });
move(origin);
export const x = origin.x;
