// expect: returns a promise on some paths and a value on others
// code: NUCLO6002
export function twice(p: Promise<number>, cached: boolean): Promise<number> {
  return p.then((n) => (cached ? n : Promise.resolve(n * 2)));
}
