// expect: which holds the objects in a value the cycle collector doesn't look into
// code: NUCLO2001
// Objects linked through a union-typed field: the collector doesn't look into unions, so it can't free the pair.
class Cell {
  link: Cell | string = "empty";
  constructor(readonly id: number) {}
}
export function pair(): number {
  const a = new Cell(1);
  const b = new Cell(2);
  a.link = b;
  b.link = a;
  return a.id + b.id;
}
