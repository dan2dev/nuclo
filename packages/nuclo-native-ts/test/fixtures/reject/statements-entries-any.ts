// expect: TypeScript types these values `any`
// code: NUCLO1001
interface Pt {
  x: number;
  y: number;
}
const p: Pt = { x: 1, y: 2 };
export const values = Object.values(p).length;
