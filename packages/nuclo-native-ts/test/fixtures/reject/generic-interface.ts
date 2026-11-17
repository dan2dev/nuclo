// expect: is generic: pass it as a callback that calls it
// code: NUCLO4002
function wrap<T>(x: T): T[] {
  return [x];
}
export const wrapped = [1, 2].map(wrap);
