// expect: whose keys are listed
// code: NUCLO3002
interface Item {
  name: string;
  note?: string;
}
export function keys(): string {
  const item: Item = { name: "a", note: "b" };
  delete item.note;
  return Object.keys(item).join(",");
}
