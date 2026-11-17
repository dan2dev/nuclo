// expect: is a bigint (JavaScript throws a TypeError)
// code: NUCLO6001
interface Big {
  n: bigint;
}
export function write(b: Big): string {
  return JSON.stringify(b);
}
