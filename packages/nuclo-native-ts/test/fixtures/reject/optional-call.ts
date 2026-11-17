// expect: ?.() on a computed function
function handler(): (() => void) | null {
  return null;
}
export function finish() {
  handler()?.();
}
