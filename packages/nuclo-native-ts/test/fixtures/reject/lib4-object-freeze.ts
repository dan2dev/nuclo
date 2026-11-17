// expect: Object.freeze() is supported natively on a literal only
// code: NUCLO6001
const values = [1, 2];
export const frozen = Object.freeze(values);
