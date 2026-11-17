// expect: This function can throw, and it is stored where natively a function can't
// code: NUCLO2002
import { div, list, p, render } from "../../../src/index.ts";
function label(n: number): string {
  if (n < 0) throw new Error("negative");
  return `item ${n}`;
}
render(() => div(list(() => [1, 2], (n: number) => p(label(n)))));
