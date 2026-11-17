// expect: A setter needs its getter
// code: NUCLO4004
export class Counter {
  private count = 0;
  set value(v: number) {
    this.count = v;
  }
}
