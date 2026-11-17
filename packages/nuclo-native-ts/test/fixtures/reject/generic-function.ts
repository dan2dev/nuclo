// expect: Declare generic functions at the top level
export function outer(): number {
  function inner<T>(x: T): T {
    return x;
  }
  return inner(1);
}
