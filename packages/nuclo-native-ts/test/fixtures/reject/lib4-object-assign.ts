// expect: Object.assign() is not supported natively
// code: NUCLO6002
interface P { a: number; b?: number }
export function merge(t: P, s: P): P {
  return Object.assign(t, s);
}
