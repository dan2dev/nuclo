// expect: an element of the parameter "rows"
export function pad(rows: number[][]): number[][] {
  for (const row of rows) {
    class Padder {
      pad(): void {
        row.push(0);
      }
    }
    new Padder().pad();
  }
  return rows;
}
