// Object.groupBy / Map.groupBy (ES2024, adapters2): keys in JavaScript's order, groups in item order.

interface Sale {
  region: string;
  amount: number;
}

const sales: Sale[] = [
  { region: "north", amount: 10 },
  { region: "south", amount: 4 },
  { region: "north", amount: 7 },
  { region: "10", amount: 1 },
  { region: "east", amount: 3 },
  { region: "2", amount: 9 },
];

export function ad2GroupBy(): string[] {
  const out: string[] = [];
  const byRegion = Object.groupBy(sales, (s) => s.region);
  for (const [k, v] of Object.entries(byRegion)) out.push(`${k}: ${(v ?? []).map((s) => s.amount).join(",")}`);
  out.push(`keys ${Object.keys(byRegion).join(" ")}`);
  const north = byRegion["north"];
  out.push(`north ${north ? north.length : -1} west ${byRegion["west"] === undefined}`);
  const parity = Object.groupBy([5, 2, 8, 1, 4], (n, i) => String((n + i) % 3));
  out.push(Object.entries(parity).map(([k, v]) => `${k}=[${(v ?? []).join(" ")}]`).join(" "), `${parity["1"]?.length}`);
  const words = Map.groupBy(["apple", "avocado", "banana", "blueberry", "cherry"], (w) => w.length > 5);
  for (const [long, ws] of words) out.push(`${long}: ${ws.join("|")}`);
  const byInitial = Map.groupBy(sales, (s, i) => (i < 3 ? s.region[0] ?? "" : "late"));
  out.push([...byInitial.keys()].join(","), `${byInitial.get("n")?.length} ${byInitial.has("x")}`);
  const empty = Object.groupBy([] as string[], (s) => s);
  out.push(`empty ${Object.keys(empty).length}`);
  return out;
}
