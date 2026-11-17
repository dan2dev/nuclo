// expect: take the item and its index natively (not the array)
// code: NUCLO6001
export const xs: number[] = [1, 2];
export const doubled = xs.map((x, i, all) => x * i * all.length);
