// expect: Cannot turn Record<string, number>[] into text natively
// code: NUCLO6002
export function text(ps: Record<string, number>[]): string {
  return `${ps}`;
}
