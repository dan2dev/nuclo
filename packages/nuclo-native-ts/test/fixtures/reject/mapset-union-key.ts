// expect: is not supported natively (a union, a nullable value
// code: NUCLO6002
const m = new Map<string | number, number>();
m.set(1, 1);
export const n = m.size;
