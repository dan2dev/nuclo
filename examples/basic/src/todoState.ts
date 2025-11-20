import { update } from "nuclo";

export type Task = { id: number; text: string; done: boolean; subTasks?: Task[] };
export type SubTask = Task;
export type Todo = Task;

let todos: Todo[] = [
	{ id: 0, text: "Learn Nuclo", done: false, subTasks: [] },
	{ id: 1, text: "Build a Todo App", done: false, subTasks: [] },
	{ id: 2, text: "Deploy to Vercel", done: false, subTasks: [] },
];
let nextId = 3;
let inputValue = "";
let subtaskInputs: Record<number, string> = {};

export function getTodos(): Todo[] {
	return todos;
}

// Helper to find a node and its ancestor path in the tree
function findNodeAndAncestors(id: number) : { node: Task | null; ancestors: Task[] } {
	function helper(nodes: Task[], ancestors: Task[]): { node: Task | null; ancestors: Task[] } {
		for (const node of nodes) {
			if (node.id === id) return { node, ancestors };
			if (node.subTasks && node.subTasks.length > 0) {
				const res = helper(node.subTasks, ancestors.concat(node));
				if (res.node) return res;
			}
		}
		return { node: null, ancestors: [] };
	}
	return helper(todos, []);
}

// Recursively set done state for a node and its descendants
function setDoneRecursively(node: Task, done: boolean) {
	node.done = done;
	if (node.subTasks) {
		node.subTasks.forEach((s) => setDoneRecursively(s, done));
	}
}

export function getInputValue(): string {
	return inputValue;
}

export function setInputValue(value: string): void {
	inputValue = value;
	update();
}

export function getSubtaskInput(parentId: number): string {
	return subtaskInputs[parentId] ?? "";
}

export function setSubtaskInput(parentId: number, value: string): void {
	subtaskInputs[parentId] = value;
	update();
}

export function addTodo(): void {
	if (!inputValue.trim()) return;
	todos.push({ id: nextId++, text: inputValue.trim(), done: false, subTasks: [] });
	inputValue = "";
	update();
}

export function addSubtask(parentId: number): void {
	const text = (subtaskInputs[parentId] || "").trim();
	if (!text) return;
	const { node } = findNodeAndAncestors(parentId);
	if (!node) return;
	if (!node.subTasks) node.subTasks = [];
	node.subTasks.push({ id: nextId++, text, done: false, subTasks: [] });
	subtaskInputs[parentId] = "";
	update();
}

// Toggle task at any level (todo or subtask) by id
export function toggleTask(id: number): void {
	const res = findNodeAndAncestors(id);
	const node = res.node;
	const ancestors = res.ancestors;
	if (!node) return;
	const newDone = !node.done;
	setDoneRecursively(node, newDone);
	// Update ancestors: an ancestor is done only if all its children are done
	for (let i = ancestors.length - 1; i >= 0; i--) {
		const anc = ancestors[i];
		anc.done = anc.subTasks && anc.subTasks.length > 0 ? anc.subTasks.every((s) => s.done) : anc.done;
	}
	update();
}

// Backwards-compatible wrapper for top-level toggles
export function toggleTodo(id: number): void { toggleTask(id); }

export function deleteTodo(id: number): void {
	// Delete any task (top level or nested) by id
	deleteTask(id);
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

