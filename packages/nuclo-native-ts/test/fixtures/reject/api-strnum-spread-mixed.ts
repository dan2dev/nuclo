// expect: fromCharCode() takes either numbers or one spread array natively
// code: NUCLO6001
export function text(codes: number[]): string {
  return String.fromCharCode(65, ...codes);
}
