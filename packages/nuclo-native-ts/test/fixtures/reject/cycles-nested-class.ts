// expect: stores into the variable "current", which a class declared in its function uses
// code: NUCLO2001
// A class declared in a function keeps the function's reassigned local in a box; storing its own object there loops.
export function latest(): string {
  let current: Item | null = null;
  class Item {
    constructor(readonly label: string) {}
    describe(): string {
      return `${this.label} (current: ${current?.label ?? "none"})`;
    }
  }
  current = new Item("a");
  return current.describe();
}
