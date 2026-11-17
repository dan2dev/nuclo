// expect: always undefined in Array.from({ length: n }
// code: NUCLO1004
export function values(): string[] {
  return Array.from({ length: 2 }, (v, i) => `${v}${i}`);
}
