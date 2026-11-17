// expect: a copy would not be the same object
// code: NUCLO1005
interface Todo {
  id: number;
  title: string;
}
// Natively Partial<Todo> is another class (its fields are optional); JavaScript shares the object.
export function draft(todo: Todo): Partial<Todo> {
  return todo;
}
