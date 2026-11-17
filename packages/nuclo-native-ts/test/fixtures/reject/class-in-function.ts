// expect: a loop's variable that is mutated
export function batches(sizes: number[][]): number[] {
  const out: number[] = [];
  for (let [batch = []] = sizes; batch.length < 3; ) {
    class Filler {
      fill(): void {
        batch.push(batch.length);
      }
    }
    new Filler().fill();
    out.push(batch.length);
  }
  return out;
}
