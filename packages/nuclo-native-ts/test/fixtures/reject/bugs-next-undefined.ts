// expect: next() without a value, where the generator reads what next(v) sends
// code: NUCLO1004
// JavaScript: `x` is undefined after the second `next()`; natively a number can't hold it.
function* sum(): Generator<number, void, number> {
  let total = 0;
  while (true) {
    const x = yield total;
    total += x;
  }
}

export function run(): string {
  const g = sum();
  g.next();
  g.next(2);
  return `${g.next().value}`;
}
