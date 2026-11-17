// expect: give every property, in this order: x, y
// code: NUCLO6000
interface Pt {
  x: number;
  y: number;
}
const a: Pt = { x: 1, y: 2 };
const b: Pt = { y: 3, x: 4 };
export const keys = [...Object.keys(a), ...Object.keys(b)];
