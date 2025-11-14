import "nuclo";
import { width } from "nuclo";
import { getTodos, getInputValue, setInputValue, addTodo, toggleTodo, deleteTodo, clearCompleted } from "./todoState";
import { TrashIcon, PlusIcon, CircleIcon } from "./icons";
import { cn, globalStyles as s } from "./styles";

const appRoot = document.querySelector<HTMLDivElement>("#app")!;

const app = div(
	s.body,
	div(div(s.box1, "Box 1"), div(s.box2, "Box 2")),
	div(
		s.appWrapper,
		div(
			s.appContainer,
			div(s.header, h1(s.h1Reset, "✨", span("My Tasks"))),
			div(
				cn(width("100%").bg("#FF0000").padding("1rem"), {
					medium: width("50%"),
				}),
				input(
					s.input,
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
				button(s.addButton, PlusIcon(), " Add Task", on("click", addTodo)),
			),

			// Stats
			when(
				() => getTodos().length > 0,
				div(
					s.stats,
					span(
						s.statsText,
						() =>
							`📝 ${getTodos().filter((t) => !t.done).length} task${getTodos().filter((t) => !t.done).length !== 1 ? "s" : ""} remaining`,
					),
					when(() => getTodos().some((t) => t.done), button(s.clearButton, "🗑️ Clear Completed", on("click", clearCompleted))),
				),
			),

			// Todo list
			when(
				() => getTodos().length > 0,
				div(
					s.todoList,
					list(
						() => getTodos(),
						(todo) =>
							div(
								s.todoItem,
								input(
									s.checkbox,
									{
										type: "checkbox",
										checked: () => todo.done,
									},
									on("change", () => toggleTodo(todo.id)),
								),
								span(
									() => (todo.done ? s.todoTextDone : s.todoText),
									() => todo.text,
								),
								button(
									s.deleteButton,
									TrashIcon(),
									on("click", () => deleteTodo(todo.id)),
								),
							),
					),
				),
			).else(div(s.emptyState, CircleIcon(), p(s.emptyText, "No tasks yet. Add your first one above!"))),
		),
	),
);

render(app, appRoot);
