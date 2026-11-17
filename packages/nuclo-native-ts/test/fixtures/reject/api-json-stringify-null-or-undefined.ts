// expect: may be null or undefined, one nil natively
// code: NUCLO6001
interface Row {
  note?: string | null;
}
export function write(r: Row): string {
  return JSON.stringify(r);
}
