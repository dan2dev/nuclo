import "./style.css";
import "nuclo";
import {
	getTodos,
	getInputValue,
	setInputValue,
	addTodo,
	toggleTodo,
	deleteTodo,
	clearCompleted,
} from "./todoState";

const appRoot = document.querySelector<HTMLDivElement>("#app")!;

const app = div(
	{ className: "todo-app" },
	h1("Todo List"),
	
	// Input section
	div(
		{ className: "input-section" },
		input({
			type: "text",
			placeholder: "What needs to be done?",
			value: () => getInputValue(),
		}, on("input", (e) => {
			setInputValue((e.target as HTMLInputElement).value);
		}), on("keydown", (e) => {
			if (e.key === "Enter") {
				addTodo();
			}
		})),
		button("Add", on("click", addTodo))
	),

	// Stats
	when(() => getTodos().length > 0,
		div(
			{ className: "stats" },
			span(() => `${getTodos().filter(t => !t.done).length} remaining`),
			when(() => getTodos().some(t => t.done),
				button("Clear completed", on("click", clearCompleted))
			)
		)
	),

	// Todo list
	when(() => getTodos().length > 0,
		div(
			{ className: "todo-list" },
			list(() => getTodos(), (todo) =>
				div(
					{ className: () => todo.done ? "todo-item done" : "todo-item" },
					input(
						{
							type: "checkbox",
							checked: () => todo.done,
						},
						on("change", () => toggleTodo(todo.id))
					),
					span({ className: "todo-text" }, () => todo.text),
					button(
						{ className: "delete-btn" },
						"×",
						on("click", () => deleteTodo(todo.id))
					)
				)
			)
		)
	).else(
		p({ className: "empty-state" }, "No todos yet. Add one above!")
	)
);

render(app, appRoot);
