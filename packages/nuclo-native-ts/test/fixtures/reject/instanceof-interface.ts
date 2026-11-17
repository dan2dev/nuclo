// expect: instanceof works with the app's classes natively
// code: NUCLO6001
class Item {
  readonly id = 1;
}
export function isDate(value: Item | Date): boolean {
  return value instanceof Date;
}
