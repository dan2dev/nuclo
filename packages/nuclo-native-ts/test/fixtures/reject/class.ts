// expect: Setters are not supported natively
export class Counter {
  private count = 0;
  set value(v: number) {
    this.count = v;
  }
  get value(): number {
    return this.count;
  }
}
