// expect: on a static getter / setter inside an expression
class Clock {
  private static ticks = 0;
  static get now(): number {
    return Clock.ticks;
  }
  static set now(value: number) {
    Clock.ticks = value;
  }
}
export const next = Clock.now++;
