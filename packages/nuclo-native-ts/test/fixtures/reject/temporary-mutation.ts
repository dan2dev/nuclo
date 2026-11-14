// expect: is a temporary natively
const items: number[] = [];
function all(): number[] {
  return items;
}
export function add() {
  all().push(1);
}
