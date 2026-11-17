// expect: is read before its declaration runs
// code: NUCLO2002
// JavaScript throws a ReferenceError at load: `total()` runs before `rate` is declared.
function total(): number {
  return rate * 2;
}

export const first = total();
export const rate = 21;
