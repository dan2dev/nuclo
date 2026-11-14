// expect: Unsupported: optional calls
let done: (() => void) | null = null;
export function finish() {
  done?.();
}
