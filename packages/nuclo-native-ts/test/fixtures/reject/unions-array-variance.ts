// expect: of a union is expected: natively they are different types
// code: NUCLO1003
const nums: number[] = [1, 2];
export const mixed: (string | number)[] = nums;
