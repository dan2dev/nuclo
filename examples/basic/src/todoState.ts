import { update } from "nuclo";

export type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

let todos: Todo[] = [
  { id: 1, text: "Learn Nuclo", completed: false },
  { id: 2, text: "Build a Todo App", completed: false },
  { id: 3, text: "Deploy to Production", completed: false },
];
let nextId = 4;
let inputValue = "";

export function getTodos(): Todo[] {
  return todos;
}

export function getInputValue(): string {
  return inputValue;
}

export function setInputValue(value: string): void {
  inputValue = value;
  update();
}

export function addTodo(): void {
  if (!inputValue.trim()) return;
  todos.push({ id: nextId++, text: inputValue.trim(), completed: false });
  inputValue = "";
  update();
}

export function toggleTodo(id: number): void {
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    update();
  }
}

export function deleteTodo(id: number): void {
  todos = todos.filter((t) => t.id !== id);
  update();
}

export function reorderTodos(fromIndex: number, toIndex: number): void {
  const [movedTodo] = todos.splice(fromIndex, 1);
  todos.splice(toIndex, 0, movedTodo);
  update("todos");
}

