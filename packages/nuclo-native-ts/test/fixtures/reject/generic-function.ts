// expect: Generic functions are supported at the top level of a module and as function declarations in a block
// code: NUCLO4002
export function outer(): number {
  const inner = <T>(x: T): T => x;
  return inner(1);
}
