// expect: an `unknown` holds strings, numbers, booleans, null and undefined natively
// code: NUCLO1003
interface Point {
  x: number;
}
const p: Point = { x: 1 };
export const v: unknown = p;
