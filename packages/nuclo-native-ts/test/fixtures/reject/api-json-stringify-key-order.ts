// expect: give every property, in this order: a, b
// code: NUCLO6000
interface Pair {
  a: number;
  b: number;
}
const p: Pair = { b: 1, a: 2 };
export const text = JSON.stringify(p);
