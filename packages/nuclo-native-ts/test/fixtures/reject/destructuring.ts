// expect: Destructuring is not supported
interface P {
  x: number;
}
export function getX(p: P): number {
  const { x } = p;
  return x;
}
