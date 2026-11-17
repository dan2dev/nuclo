// expect: `var` in a for-in head
// code: NUCLO6002
export function lastKey(m: Record<string, number>): string {
  for (var k in m) {
    if (m[k] === 0) break;
  }
  return "";
}
