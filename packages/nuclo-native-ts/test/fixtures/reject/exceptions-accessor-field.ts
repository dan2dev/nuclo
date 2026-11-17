// expect: is a field here and a getter or setter that can throw elsewhere
// code: NUCLO2002
interface Sized {
  readonly size: number;
}
export class Box implements Sized {
  get size(): number {
    throw new Error("unknown size");
  }
}
