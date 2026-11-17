// expect: Not all code paths return a value
// code: TS7030
export function sign(n: number) {
  if (n > 0) return 1;
  if (n < 0) return -1;
}
