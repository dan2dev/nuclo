// expect: a `yield` in the condition of a do-while or for loop
// code: NUCLO6002
function* ask(): Generator<string, void, boolean> {
  for (let i = 0; yield `again ${i}`; i++) {}
}
export function first(): boolean {
  return ask().next().done ?? false;
}
