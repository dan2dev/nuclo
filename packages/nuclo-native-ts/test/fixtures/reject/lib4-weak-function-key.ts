// expect: weakly held keys are objects
// code: NUCLO4004
export const seen = new WeakSet<() => void>();
