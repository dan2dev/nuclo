// expect: `continue` out of a try block with `finally` in this `for` loop
// code: NUCLO3001
export function steps(): string[] {
  const out: string[] = [];
  for (let i = 0; i < 10; i += 3) {
    try {
      if (i === 3) continue;
      out.push(String(i));
    } finally {
      out.push(`after ${i}`);
    }
  }
  return out;
}
