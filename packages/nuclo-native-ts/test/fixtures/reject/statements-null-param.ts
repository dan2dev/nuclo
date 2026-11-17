// expect: A value typed only `null` has no native type here
// code: NUCLO1004
export function show(x: null): string {
  return `${x}`;
}
