// expect: A generic method that a subclass overrides is not supported natively
// code: NUCLO4002
class Mapper {
  apply<T>(x: T): T {
    return x;
  }
}
export class Loud extends Mapper {
  override apply<T>(x: T): T {
    return x;
  }
}
