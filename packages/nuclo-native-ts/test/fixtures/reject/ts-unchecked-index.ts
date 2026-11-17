// expect: is not assignable to type 'number'
// code: TS2322
export const xs: number[] = [1];
export const first: number = xs[0];
