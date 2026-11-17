// expect: take the item and its index natively (not the array)
export const xs: number[] = [1, 2];
export const doubled = xs.map((x, i, all) => x * i * all.length);
