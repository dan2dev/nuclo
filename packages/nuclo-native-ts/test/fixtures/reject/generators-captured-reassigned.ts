// expect: which is reassigned
// code: NUCLO6002
export function counter() {
  let step = 1;
  const steps = function* () {
    yield step;
  };
  step = 2;
  return [...steps()];
}
