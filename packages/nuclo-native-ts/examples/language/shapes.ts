/** A module read through `import * as shapes`: natively its names join the app's. */
export const unit = "cm";

export interface Square {
  side: number;
}

export function square(side: number): Square {
  return { side: side };
}

export function area(s: Square): number {
  return s.side * s.side;
}

export function twice(n: number): number {
  return n * 2;
}
