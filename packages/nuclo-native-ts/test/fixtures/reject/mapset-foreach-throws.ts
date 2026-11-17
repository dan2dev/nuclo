// expect: callback that can throw is not supported natively
// code: NUCLO2002
const m = new Map<string, number>([["a", 1]]);
m.forEach((v) => {
  if (v > 0) throw new Error("positive");
});
