// expect: shared in JavaScript but copied natively
export const items: number[] = [];
export function addCopy() {
  const view = items;
  view.push(1);
}
