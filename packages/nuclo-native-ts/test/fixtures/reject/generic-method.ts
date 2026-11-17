// expect: A generic static method of a generic class is not supported natively
// code: NUCLO4002
export class Box<T> {
  constructor(readonly value: T) {}
  static of<U>(v: U): Box<U> {
    return new Box(v);
  }
}
