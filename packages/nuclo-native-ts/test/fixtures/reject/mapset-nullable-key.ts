// expect: is not supported natively (a union, a nullable value
// code: NUCLO1004
const s = new Set<string | null>();
s.add(null);
export const n = s.size;
