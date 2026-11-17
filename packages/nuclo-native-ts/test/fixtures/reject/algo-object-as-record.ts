// expect: is used as a Record (a map)
// code: NUCLO1005
function total(m: Record<string, number>): number {
  let s = 0;
  for (const k in m) s += m[k]!;
  return s;
}
const env = { x: 3, y: 4 };
export const t = total(env);
