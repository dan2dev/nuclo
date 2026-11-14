// expect: Rest parameters are not supported
export function sum(...xs: number[]): number {
  let t = 0;
  for (const x of xs) t += x;
  return t;
}
