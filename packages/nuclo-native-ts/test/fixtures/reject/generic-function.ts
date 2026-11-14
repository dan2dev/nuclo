// expect: Generic functions are not supported
export function first<T>(xs: T[]): T | undefined {
  return xs[0];
}
