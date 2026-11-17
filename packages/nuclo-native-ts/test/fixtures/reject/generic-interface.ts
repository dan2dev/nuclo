// expect: is generic: pass it as a callback that calls it
function wrap<T>(x: T): T[] {
  return [x];
}
export const wrapped = [1, 2].map(wrap);
