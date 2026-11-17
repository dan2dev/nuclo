// expect: `yield*` in an async generator
// code: NUCLO6002
async function* inner(): AsyncGenerator<number, void, unknown> {
  yield 1;
}
export async function* outer(): AsyncGenerator<number, void, unknown> {
  yield* inner();
}
