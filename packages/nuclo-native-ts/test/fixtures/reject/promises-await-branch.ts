// expect: `await` in a branch of ?:
// code: NUCLO6002
export async function pick(fast: boolean, p: Promise<string>): Promise<string> {
  const v = fast ? "now" : await p;
  return v;
}
