import { update } from "nuclo";

export type Todo = { id: number; text: string; done: boolean };

let todos: Todo[] = [];
let nextId = 1;
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
	todos.push({ id: nextId++, text: inputValue.trim(), done: false });
	inputValue = "";
	update();
}

export function toggleTodo(id: number): void {
	const todo = todos.find(t => t.id === id);
	if (todo) {
		todo.done = !todo.done;
		update();
	}
}

export function deleteTodo(id: number): void {
	todos = todos.filter(t => t.id !== id);
	update();
}

export function clearCompleted(): void {
	todos = todos.filter(t => !t.done);
	update();
}

