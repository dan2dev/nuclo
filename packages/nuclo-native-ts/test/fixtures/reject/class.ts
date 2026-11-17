// expect: A setter needs its getter
export class Counter {
  private count = 0;
  set value(v: number) {
    this.count = v;
  }
}
