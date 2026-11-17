// expect: resolving with a promise
// code: NUCLO6002
export function follow(p: Promise<number>): Promise<number> {
  return new Promise<number>((resolve) => {
    resolve(p);
  });
}
