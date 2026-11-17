// expect: is optional: natively a field is always there
// code: NUCLO1003
interface A {
  a?: number;
}
interface B {
  b: string;
}
export function isA(v: A | B): boolean {
  return "a" in v;
}
