// expect: which is itself reassigned or reshaped
export function grow(): string {
  const rows: number[][] = [[1], [2]];
  for (const row of rows) row.push(0);
  rows.push([3]);
  return rows.map((r) => r.join("+")).join(" ");
}
