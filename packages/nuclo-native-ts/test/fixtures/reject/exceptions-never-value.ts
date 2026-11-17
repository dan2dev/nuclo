// expect: A call of a function that never returns is supported as a statement
// code: NUCLO4001
function fail(message: string): never {
  throw new Error(message);
}
export function size(text: string | null): string {
  return text ?? fail("no text");
}
