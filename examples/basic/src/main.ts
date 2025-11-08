import "nuclo";
import { getTodos, getInputValue, setInputValue, addTodo, toggleTodo, deleteTodo, clearCompleted } from "./todoState";
import { TrashIcon, PlusIcon, CircleIcon } from "./icons";
import { globalStyles } from "./styles";

const appRoot = document.querySelector<HTMLDivElement>("#app")!;

// Apply global body styles
createCSSClass("body-styles", {
	margin: "0",
	padding: "1rem",
	"min-height": "100vh",
	display: "flex",
	"place-items": "center",
	"font-family": "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
	"line-height": "1.6",
	color: "#2d3748",
	background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
	"-webkit-font-smoothing": "antialiased",
	"-moz-osx-font-smoothing": "grayscale",
});

createCSSClass("app-wrapper", {
	width: "100%",
	"max-width": "700px",
	margin: "0 auto",
});

createCSSClass("todo-item-hover", {
	transition: "all 0.3s ease",
	"box-shadow": "0 2px 4px rgba(0, 0, 0, 0.05)",
});

createCSSClass("todo-item-hover:hover", {
	"box-shadow": "0 4px 12px rgba(0, 0, 0, 0.1)",
	transform: "translateY(-2px)",
});

createCSSClass("input-focus", {
	transition: "all 0.3s ease",
	"box-shadow": "0 2px 4px rgba(0, 0, 0, 0.05)",
});

createCSSClass("input-focus:focus", {
	outline: "none",
	"border-color": "#667eea",
	"box-shadow": "0 4px 12px rgba(102, 126, 234, 0.2)",
	transform: "translateY(-1px)",
});

createCSSClass("button-hover", {
	transition: "all 0.3s ease",
	"box-shadow": "0 4px 12px rgba(102, 126, 234, 0.3)",
	"font-weight": "600",
});

createCSSClass("button-hover:hover", {
	transform: "translateY(-2px)",
	"box-shadow": "0 6px 20px rgba(102, 126, 234, 0.4)",
});

createCSSClass("button-hover:active", {
	transform: "translateY(0)",
});

createCSSClass("delete-button-hover", {
	transition: "all 0.2s ease",
});

createCSSClass("delete-button-hover:hover", {
	transform: "scale(1.05)",
	"box-shadow": "0 2px 8px rgba(229, 62, 62, 0.3)",
});

createCSSClass("checkbox-style", {
	"accent-color": "#667eea",
});

createCSSClass("todo-text-done", {
	"text-decoration": "line-through",
});

// Apply body styles to document
document.body.className = "body-styles";

const app = div(
	{ className: "app-wrapper" },
	globalStyles.appContainer,

	// Header with gradient
	div(
		globalStyles.header,
		h1("✨ My Tasks"),
	),

	// Input section
	div(
		globalStyles.inputSection,
		input(
			globalStyles.input,
			{ className: "input-focus" },
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
		button(
			globalStyles.addButton,
			{ className: "button-hover" },
			PlusIcon(),
			" Add Task",
			on("click", addTodo)
		),
	),

	// Stats
	when(
		() => getTodos().length > 0,
		div(
			globalStyles.stats,
			span(
				globalStyles.statsText,
				() => `📝 ${getTodos().filter((t) => !t.done).length} task${getTodos().filter((t) => !t.done).length !== 1 ? 's' : ''} remaining`
			),
			when(
				() => getTodos().some((t) => t.done),
				button(
					globalStyles.clearButton,
					{ className: "delete-button-hover" },
					"🗑️ Clear Completed",
					on("click", clearCompleted)
				)
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
						{ className: "todo-item-hover" },
						input(
							globalStyles.checkbox,
							{ className: "checkbox-style" },
							{
								type: "checkbox",
								checked: () => todo.done,
							},
							on("change", () => toggleTodo(todo.id)),
						),
						span(
							() => todo.done ? globalStyles.todoTextDone : globalStyles.todoText,
							() => todo.done ? { className: "todo-text-done" } : {},
							() => todo.text
						),
						button(
							globalStyles.deleteButton,
							{ className: "delete-button-hover" },
							TrashIcon(),
							on("click", () => deleteTodo(todo.id)),
						),
					),
			),
		),
	).else(
		div(
			globalStyles.emptyState,
			CircleIcon(),
			p(
				globalStyles.emptyText,
				"✨ No tasks yet. Add your first one above!"
			)
		)
	),
);

render(app, appRoot);
