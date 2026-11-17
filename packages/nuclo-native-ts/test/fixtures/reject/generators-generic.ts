// expect: Generator methods of generic classes
// code: NUCLO4002
export class Bag<T> {
  constructor(readonly items: T[]) {}
  *each() {
    for (const x of this.items) yield x;
  }
}
