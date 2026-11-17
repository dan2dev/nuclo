// expect: declared before `super(…)`, read after its first argument
// code: NUCLO4004
class Shape {
  constructor(readonly name: string, readonly size: number) {}
}
export class Square extends Shape {
  constructor(side: number) {
    const s = Math.abs(side);
    super("square", s);
  }
}
