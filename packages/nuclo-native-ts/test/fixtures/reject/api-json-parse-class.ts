// expect: JSON.parse into T needs T made of interfaces
// code: NUCLO6001
class Point {
  constructor(public x: number) {}
}
export function read(text: string): Point {
  return JSON.parse(text) as Point;
}
