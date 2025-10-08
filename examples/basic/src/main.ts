import "./style.css";
import "nuclo";

type Todo = {
  id: number;
  title: string;
  done: boolean;
};

type Filter = "all" | "active" | "completed";

// State
let todos: Todo[] = [];
let nextId = 1;
let filter: Filter = "all";
let newTitle = "";

// Actions
function rerender() {
  update();
}

function addTodo(title: string) {
  const t = title.trim();
  if (!t) return;
  todos.push({ id: nextId++, title: t, done: false });
  newTitle = "";
  rerender();
}

function removeTodo(id: number) {
  const i = todos.findIndex((t) => t.id === id);
  if (i >= 0) {
    todos.splice(i, 1);
    rerender();
  }
}

function toggleTodo(id: number, done?: boolean) {
  const t = todos.find((x) => x.id === id);
  if (!t) return;
  t.done = typeof done === "boolean" ? done : !t.done;
  rerender();
}

function clearCompleted() {
  todos = todos.filter((t) => !t.done);
  rerender();
}

function setFilter(f: Filter) {
  filter = f;
  rerender();
}

// Derived
function remainingCount() {
  return todos.filter((t) => !t.done).length;
}

function completedCount() {
  return todos.filter((t) => t.done).length;
}

function filteredTodos(): Todo[] {
  if (filter === "active") return todos.filter((t) => !t.done);
  if (filter === "completed") return todos.filter((t) => t.done);
  return todos;
}
//

// w("200px");

// UI
const root = document.getElementById("app") as HTMLElement;
console.time("render");
const app = div(
  {
    className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4",
  },
  h1("nuclo", {
    className: "font-bold text-3xl text-center mb-4",
  }),
  div(
  "text1",
  "test2"
  ),
  div(
    {
      className: "max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden",
    },

    // Header
    div(
      { className: "bg-gradient-to-r from-blue-500 to-indigo-600 p-6" },
      h1("Todo List", {
        className: "text-3xl font-bold text-white text-center mb-4",
      }),
      div(
        { className: "flex gap-2" },
        input(
          {
            type: "text",
            placeholder: "What needs to be done?",
            className: "flex-1 px-4 py-2 rounded-lg border-2 border-transparent focus:border-white focus:outline-none",
            value: () => newTitle,
          },
          on("input", (e) => {
            newTitle = e.currentTarget.value;
            update();
          }),
          on("change", (e) => {
            newTitle = e.currentTarget.value;
            update();
          }),
          on("keydown", (e) => {
            if (e.key === "Enter") {
              addTodo(newTitle);
            } else if (e.key === "Escape") {
              newTitle = "";
              update();
            }
          }),
        ),
        button(
          {
            disabled: () => newTitle.trim().length === 0,
            className: () =>
              "px-6 py-2 rounded-lg font-semibold transition-all " +
              (newTitle.trim().length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-white text-indigo-600 hover:bg-indigo-50"),
          },
          "Add",
          on("click", () => addTodo(newTitle)),
        ),
      ),
    ),

    // Controls
    when(
      () => todos.length > 0,
      div(
        { className: "flex items-center justify-between p-4 border-b" },
        // Left counters
        div(
          { className: "flex items-center gap-3 text-sm text-gray-600" },
          div(() => `${remainingCount()} item${remainingCount() === 1 ? "" : "s"} left`),
          div("•"),
          div(() => `${completedCount()} completed`),
        ),
        // Middle: filters
        div(
          { className: "flex gap-2" },
          button(
            {
              className: () =>
                "px-3 py-1 rounded-md text-sm font-medium transition-colors " +
                (filter === "all" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"),
            },
            "All",
            on("click", () => setFilter("all")),
          ),
          button(
            {
              className: () =>
                "px-3 py-1 rounded-md text-sm font-medium transition-colors " +
                (filter === "active" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"),
            },
            "Active",
            on("click", () => setFilter("active")),
          ),
          button(
            {
              className: () =>
                "px-3 py-1 rounded-md text-sm font-medium transition-colors " +
                (filter === "completed" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"),
            },
            "Completed",
            on("click", () => setFilter("completed")),
          ),
        ),
        // Right: clear completed
        when(
          () => completedCount() > 0,
          button(
            {
              className: "px-3 py-1 text-sm text-red-600 hover:text-red-700 font-medium",
            },
            "Clear completed",
            on("click", clearCompleted),
          ),
        ),
      ),
    ),

    // List section
    div(
      { className: "p-4" },
      when(
        () => filteredTodos().length > 0,
        div(
          { className: "space-y-2" },
          list(
            () => filteredTodos(),
            (todo, index) =>
              div(
                {
                  className: "flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors",
                },
                input(
                  {
                    type: "checkbox",
                    className: "w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500",
                    checked: () => !!todo.done,
                  },
                  on("change", (e) => {
                    const checked = e.currentTarget.checked;
                    toggleTodo(todo.id, checked);
                  }),
                ),
                div(
                  {
                    className: () => "flex-1 " + (todo.done ? "line-through text-gray-400" : "text-gray-800"),
                    title: () => todo.title,
                  },
                  () => `${index + 1}`,
                  () => todo.title,
                ),
                button(
                  {
                    className: "px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors",
                    title: "Delete todo",
                  },
                  "Delete",
                  on("click", () => removeTodo(todo.id)),
                ),
              ),
          ),
        ),
      ).else(div({ className: "text-center py-12 text-gray-400" }, "No todos yet. Add one above!")),
    ),
  ),
)(root, 0);
root.appendChild(app as Node);
console.timeEnd("render");
