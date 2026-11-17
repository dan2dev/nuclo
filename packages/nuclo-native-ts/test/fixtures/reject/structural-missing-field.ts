// expect: which has no done
// code: NUCLO1005
interface Todo {
  id: number;
  title: string;
  done?: boolean;
}
// The result's class has no `done` field: JavaScript would share the object (reading undefined).
function make() {
  return { id: 1, title: "x" };
}
export const todo: Todo = make();
