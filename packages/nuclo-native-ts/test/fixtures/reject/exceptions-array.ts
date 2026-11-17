// expect: This function can throw, and it is stored where natively a function can't
// code: NUCLO2002
function check(n: number): number {
  if (n < 0) throw new Error("negative");
  return n;
}
export const checks: ((n: number) => number)[] = [(n) => check(n) * 2];
