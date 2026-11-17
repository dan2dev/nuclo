// expect: whose name is not a field
// code: NUCLO1005
class Person {
  get name(): string {
    return "p";
  }
}
function show(n: { name: string }): string {
  return n.name;
}
export const shown = show(new Person());
