// expect: has a type without a zero value
// code: NUCLO1002
interface Pt {
  x: number;
}
export function pick(c: boolean): number {
  var p: Pt = { x: 1 };
  if (c) {
    var p: Pt = { x: 2 };
  }
  return p.x;
}
