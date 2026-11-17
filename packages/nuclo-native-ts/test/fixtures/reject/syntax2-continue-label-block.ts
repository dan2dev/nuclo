// expect: `continue` to a label that isn't directly on its loop
// code: NUCLO6002
export function nested(): number {
  let n = 0;
  a: b: for (let i = 0; i < 3; i++) {
    if (i === 1) continue a;
    if (i === 2) break b;
    n += i;
  }
  return n;
}
