// expect: Comparing two functions
// code: NUCLO6002
let listeners: (() => void)[] = [];
export function off(fn: () => void): void {
  listeners = listeners.filter((l) => l !== fn);
}
