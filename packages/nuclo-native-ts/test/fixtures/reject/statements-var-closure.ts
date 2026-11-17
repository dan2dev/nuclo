// expect: A closure reads the `var` total where it may not be assigned yet
// code: NUCLO1004
export function later(): number {
  const read = () => total;
  var total = 1;
  return read();
}
