// expect: a reviver is not supported natively
// code: NUCLO6001
export function read(text: string): number[] {
  return JSON.parse(text, (_k, v: number) => v * 2) as number[];
}
