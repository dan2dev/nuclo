// One cause, one error each: `eval` (its `any` result is not reported again where it is used) and the filter (with its fix).
// A nested tuple destructured from an array compiles: no `any` and no errors inside TypeScript's lib files.
const pairs: [string, [number, boolean]][] = [["a", [1, true]]];
export function nested(): string {
  const [name, [n, ok]] = pairs[0]!;
  return `${name}${n}${ok}`;
}
export function evaluated(): string {
  const z = eval("1");
  return `${z}`;
}
export function kept(xs: number[]): number[] {
  return xs.filter((x) => x);
}
export const ratio: Float32 = 0.1;
import type { Float32 } from "../../../src/index.ts";
