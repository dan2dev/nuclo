// expect: takes an array of promises
// code: NUCLO6001
export function both(p: Promise<number>): Promise<number[]> {
  return Promise.all([p, 5]);
}
