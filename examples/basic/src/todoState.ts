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

export function deleteTask(id: number): void {
	// Try to find node and ancestors
	const res = findNodeAndAncestors(id);
	const node = res.node;
	const ancestors = res.ancestors;
	if (!node) return;
	if (ancestors.length === 0) {
		// Top level
		todos = todos.filter((t) => t.id !== id);
	} else {
		const parent = ancestors[ancestors.length - 1];
		if (parent.subTasks) parent.subTasks = parent.subTasks.filter(s => s.id !== id);
	}
	// Update ancestors done flags after deletion
	for (let i = ancestors.length - 1; i >= 0; i--) {
		const anc = ancestors[i];
		anc.done = anc.subTasks && anc.subTasks.length > 0 ? anc.subTasks.every((s) => s.done) : anc.done;
	}
	update();
}

// Backwards-compatible wrapper: delete subtask given parentId+subId
export function deleteSubtask(parentId: number, subId: number): void {
	const res = findNodeAndAncestors(parentId);
	const node = res.node;
	if (!node || !node.subTasks) return;
	node.subTasks = node.subTasks.filter(s => s.id !== subId);
	update();
}

export function clearCompleted(): void {
	// Remove completed subtasks from all todos
	todos.forEach(t => { if (t.subTasks) t.subTasks = t.subTasks.filter(s => !s.done); });
	// Remove completed parent todos
	todos = todos.filter(t => !t.done);
	update();
}

