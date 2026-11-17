// expect: a compound assignment or ++ / -- to an object literal's getter / setter
// code: NUCLO4004
const box = {
  n: 1,
  get double(): number {
    return this.n * 2;
  },
  set double(v: number) {
    this.n = v / 2;
  },
};
box.double += 4;
export const shown = `${box.n}`;
