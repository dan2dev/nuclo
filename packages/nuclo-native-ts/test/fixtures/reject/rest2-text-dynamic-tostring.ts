// expect: Cannot turn Shape into text natively
// code: NUCLO6002
class Shape {}
class Circle extends Shape {
  override toString(): string {
    return "circle";
  }
}
const s: Shape = new Circle();
export const text = `${s}`;
