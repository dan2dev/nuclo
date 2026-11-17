// expect: a rest element in object destructuring
interface P {
  x: number;
  y: number;
}
export function getX(p: P): number {
  const { x, ...rest } = p;
  return x + rest.y;
}
