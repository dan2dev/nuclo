// expect: the field is also read as a value
// code: NUCLO2001
// A closure kept in a field of the object it captures, and read out of the field: the object can't be passed to it.
class Metronome {
  ticks = 0;
  onTick: () => void;
  constructor() {
    this.onTick = () => {
      this.ticks += 1;
    };
  }
}
export function run(): number {
  const c = new Metronome();
  const handlers: (() => void)[] = [c.onTick];
  for (const h of handlers) h();
  return c.ticks;
}
