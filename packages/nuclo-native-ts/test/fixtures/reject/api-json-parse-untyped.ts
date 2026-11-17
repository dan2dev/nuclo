// expect: JSON.parse needs the type it decodes into natively
// code: NUCLO6001
export function size(text: string): number {
  const xs = JSON.parse(text) as unknown;
  return xs === null ? 0 : 1;
}
