// expect: which has no title
// code: NUCLO1005
interface Todo {
  id: number;
  title: string;
}
// A cast to a wider type: the object has no `title` natively.
export function widen(p: { id: number }): Todo {
  return p as Todo;
}
