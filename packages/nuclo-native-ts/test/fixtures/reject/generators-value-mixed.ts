// expect: Test `done` before reading `value`
// code: NUCLO1005
function* parse(): Generator<number, string, unknown> {
  yield 1;
  return "end";
}
export function first(): string {
  const r = parse().next();
  return `${r.value}`;
}
