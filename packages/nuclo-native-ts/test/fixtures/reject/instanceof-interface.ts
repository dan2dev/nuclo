// expect: instanceof works with the app's classes natively
class Item {
  readonly id = 1;
}
export function isDate(value: Item | Date): boolean {
  return value instanceof Date;
}
