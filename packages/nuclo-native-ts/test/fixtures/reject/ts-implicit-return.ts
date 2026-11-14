// expect: Not all code paths return a value
export function sign(n: number) {
  if (n > 0) return 1;
  if (n < 0) return -1;
}
