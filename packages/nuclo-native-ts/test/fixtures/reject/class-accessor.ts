// expect: Override the getter and the setter together
// code: NUCLO4004
class Box {
  private size = 1;
  get value(): number {
    return this.size;
  }
  set value(v: number) {
    this.size = v;
  }
}
export class Doubled extends Box {
  override get value(): number {
    return 2;
  }
}
