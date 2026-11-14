// expect: callbacks take one parameter natively
export const xs: number[] = [1, 2];
export const doubled = xs.map((x, i) => x * i);
