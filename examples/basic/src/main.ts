import "./style.css";
import "nuclo";
import { getTodos, getInputValue, setInputValue, addTodo, toggleTodo, deleteTodo, clearCompleted } from "./todoState";
import { TrashIcon, PlusIcon, CircleIcon } from "./icons";

const appRoot = document.querySelector<HTMLDivElement>("#app")!;

const cn = createBreakpoints({
	small: "(max-width: 600px)",
	medium: "(min-width: 601px) and (max-width: 1024px)",
	large: "(min-width: 1025px)",
});

const styles = {
	header: cn({
		small: bg("#FF0000").fontSize("20px").flex().center().bold(),
		medium: bg("#00FF00").fontSize("40px").flex().center().bold(),
		large: bg("#0000FF").fontSize("50px").flex().center().bold(),
	}),
};

const app = div(
	{ className: "todo-app" },
	h1("Todo List"),
	styles.header,
	// Input section
	div(
		{ className: "input-section" },
		cn(),
		input(
			cn({
				small: bg("#FF0000"),
			}),
			{
				type: "text",
				placeholder: "What needs to be done?",
				value: () => getInputValue(),
			},
			on("input", (e) => {
				setInputValue((e.target as HTMLInputElement).value);
			}),
			on("keydown", (e) => {
				if (e.key === "Enter") {
					addTodo();
				}
			}),
		),
		button({ className: "add-btn" }, PlusIcon(), " Add", on("click", addTodo)),
	),

	// Stats
	when(
		() => getTodos().length > 0,
		div(
			{ className: "stats" },
			span(() => `${getTodos().filter((t) => !t.done).length} remaining`),
			when(() => getTodos().some((t) => t.done), button("Clear completed", on("click", clearCompleted))),
		),
	),

	// Todo list
	when(
		() => getTodos().length > 0,
		div(
			{ className: "todo-list" },
			list(
				() => getTodos(),
				(todo) =>
					div(
						{ className: () => (todo.done ? "todo-item done" : "todo-item") },
						input(
							{
								type: "checkbox",
								checked: () => todo.done,
							},
							on("change", () => toggleTodo(todo.id)),
						),
						span({ className: "todo-text" }, () => todo.text),
						button(
							{ className: "delete-btn" },
							TrashIcon(),
							on("click", () => deleteTodo(todo.id)),
						),
					),
			),
		),
	).else(div({ className: "empty-state" }, CircleIcon(), p("No todos yet. Add one above!"))),
);

render(app, appRoot);
