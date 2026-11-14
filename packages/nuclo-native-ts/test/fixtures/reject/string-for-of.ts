// expect: for-of over anything but an array
export function count(s: string): number {
  let n = 0;
  for (const c of s) if (c === "a") n++;
  return n;
}
