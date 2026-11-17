// expect: takes an array of numbers natively (write [...source]
// code: NUCLO6001
export const scaled = Float64Array.from(Uint8Array.of(1, 2), (x: number) => x / 2);
