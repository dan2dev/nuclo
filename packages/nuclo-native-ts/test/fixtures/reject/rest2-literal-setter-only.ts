// expect: has a setter only
// code: NUCLO4004
let seen = 0;
const sink = {
  set value(v: number) {
    seen = v;
  },
};
sink.value = 2;
export const read = `${sink.value} ${seen}`;
