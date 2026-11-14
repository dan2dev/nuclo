// expect: Function overloads are not supported
export function size(x: string): number;
export function size(x: string[]): number;
export function size(x: string | string[]): number {
  return x.length;
}
