// expect: `continue` out of a try block with `finally` in this `for` loop
// code: NUCLO3001
export function steps(): number {
  let n = 0;
  outer: for (let i = 1; i < 100; i *= 2) {
    for (const j of [1, 2]) {
      try {
        if (j === i) continue outer;
        n += j;
      } finally {
        n++;
      }
    }
  }
  return n;
}
