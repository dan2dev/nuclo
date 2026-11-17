// expect: a rest element in object destructuring
// code: NUCLO6002
interface Point {
  x: number;
  y: number;
}
export function rest(p: Point): number {
  let x = 0;
  let others: { y: number } = { y: 0 };
  ({ x, ...others } = p);
  return x + others.y;
}
