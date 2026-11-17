// expect: `await` in a compound assignment
// code: NUCLO6002
let total = 0;
export async function add(p: Promise<number>) {
  total += await p;
}
