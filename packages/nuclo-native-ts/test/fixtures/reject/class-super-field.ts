// expect: reaches a base class's getter only
// code: NUCLO4004
class Base {
  size(): number {
    return 1;
  }
}
export class Child extends Base {
  sizer(): () => number {
    return super.size;
  }
}
