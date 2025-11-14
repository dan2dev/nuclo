import "nuclo";
import { width } from "nuclo";
import { getTodos, getInputValue, setInputValue, addTodo, toggleTodo, deleteTodo, clearCompleted } from "./todoState";
import { TrashIcon, PlusIcon, CircleIcon } from "./icons";
import { cn, globalStyles } from "./styles";

const appRoot = document.querySelector<HTMLDivElement>("#app")!;

// Apply body styles
document.body.setAttribute("style", "margin: 0; display: flex; align-items: center; justify-content: center;");

const app = div(
	globalStyles.body,
	div(
		div(globalStyles.box1, "Box 1"),
		div(globalStyles.box2, "Box 2"),
	),
	div(
		globalStyles.appWrapper,
		div(
			globalStyles.appContainer,

			// Header with gradient
			div(globalStyles.header, h1(globalStyles.h1Reset, "✨", span("My Tasks"))),

			// Input section
			div(
				cn(width("100%").bg("#FF0000").padding("1rem"), {
					medium: width("50%")
				}),
				input(
					globalStyles.input,
					{
						type: "text",
						placeholder: "Add a new task...",
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
				button(globalStyles.addButton, PlusIcon(), " Add Task", on("click", addTodo)),
			),

			// Stats
			when(
				() => getTodos().length > 0,
				div(
					globalStyles.stats,
					span(
						globalStyles.statsText,
						() =>
							`📝 ${getTodos().filter((t) => !t.done).length} task${getTodos().filter((t) => !t.done).length !== 1 ? "s" : ""} remaining`,
					),
					when(
						() => getTodos().some((t) => t.done),
						button(globalStyles.clearButton, "🗑️ Clear Completed", on("click", clearCompleted)),
					),
				),
			),

			// Todo list
			when(
				() => getTodos().length > 0,
				div(
					globalStyles.todoList,
					list(
						() => getTodos(),
						(todo) =>
							div(
								globalStyles.todoItem,
								input(
									globalStyles.checkbox,
									{
										type: "checkbox",
										checked: () => todo.done,
									},
									on("change", () => toggleTodo(todo.id)),
								),
								span(
									() => (todo.done ? globalStyles.todoTextDone : globalStyles.todoText),
									() => todo.text,
								),
								button(
									globalStyles.deleteButton,
									TrashIcon(),
									on("click", () => deleteTodo(todo.id)),
								),
							),
					),
				),
			).else(div(globalStyles.emptyState, CircleIcon(), p(globalStyles.emptyText, "No tasks yet. Add your first one above!"))),
		),
	),
);

render(app, appRoot);
