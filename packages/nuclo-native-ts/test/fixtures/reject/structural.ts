// expect: same shape in TypeScript, but different native classes
interface A {
  id: number;
}
interface B {
  id: number;
}
export function convert(a: A): B {
  return a;
}
