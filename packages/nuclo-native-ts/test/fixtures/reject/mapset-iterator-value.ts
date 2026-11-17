// expect: in for…of
// code: NUCLO6002
const m = new Map<string, number>([["a", 1]]);
const it = m.keys();
export const first = it.next().value;
