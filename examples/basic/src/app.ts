import { getTodos, getInputValue, setInputValue, addTodo, clearCompleted, getSubtaskInput, setSubtaskInput, addSubtask, toggleTask, deleteTask } from "./todoState.ts";
import { TrashIcon, PlusIcon, CircleIcon } from "./icons.ts";
import { cn, globalStyles as s } from "./styles.ts";
const p20 = cn(padding("20px").backgroundColor("#888888").borderRadius("16px").maxWidth("400px"));
const pgBlue = cn(backgroundColor("#0000FF"));

function renderTaskNode(task: any): any {
  return div(
    task.subTasks ? s.todoItem : s.todoItem,
    input(
      s.checkbox,
      { type: "checkbox", checked: () => task.done },
      on("change", () => toggleTask(task.id)),
    ),
    span(() => (task.done ? s.todoTextDone : s.todoText), () => task.text),
    button(s.deleteButton, TrashIcon(), on("click", () => deleteTask(task.id))),

    // Nested subtasks
    when(() => (task.subTasks?.length ?? 0) > 0,
      div(
        s.subtaskList,
        list(
          () => task.subTasks ?? [],
          (st) => renderTaskNode(st),
        ),
      ),
    ),

    // Add subtask input per node
    div(
      s.subtaskInputRow,
      input(
        s.input,
        { type: "text", placeholder: "Add a subtask...", value: () => getSubtaskInput(task.id) },
        on("input", (e) => setSubtaskInput(task.id, (e.target as HTMLInputElement).value)),
        on("keydown", (e) => { if (e.key === "Enter") { addSubtask(task.id); } }),
      ),
      button(s.addButton, PlusIcon(), on("click", () => addSubtask(task.id))),
    ),
  );
}

console.log("App initialized!!!");

export const app = div(
  div(
    "link:",
    a(
      "basic link",
      (el) => {console.dir( el);},
      {
        target: "_blank",
        href: "https://deno.land/x/aleph",
      },
    )
  ),
  s.body,
  div(div(() => (getTodos().length > 0 ? s.blue : s.red), "Box 1")),
  div("olá", p20, () => pgBlue),
  div(
    "Testando múltiplas classes",
    { className: "custom-a" },
    { className: "custom-b" }
  ),
  div(
    s.appWrapper,
    div(
      s.appContainer,
      div(s.header, h1(s.h1Reset, "✨", span("My Tasks"))),
      div(
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
          })
        ),
        button(s.addButton, PlusIcon(), " Add Task", on("click", addTodo))
      ),

      // Stats
      when(
        () => getTodos().length > 0,
        div(
          s.stats,
          span(
            s.statsText,
            () =>
              `📝 ${getTodos().filter((t) => !t.done).length} task${
                getTodos().filter((t) => !t.done).length !== 1 ? "s" : ""
              } remaining`
          ),
          when(
            () => getTodos().some((t) => t.done),
            button(
              s.clearButton,
              "🗑️ Clear Completed",
              on("click", clearCompleted)
            )
          )
        )
      ),

      // Todo list
      when(
        () => getTodos().length > 0,
        div(
          s.todoList,
          list(
            () => getTodos(),
            (todo) => renderTaskNode(todo)
          )
        )
      ).else(
        div(
          s.emptyState,
          CircleIcon(),
          p(s.emptyText, "No tasks yet. Add your first one above!")
        )
      )
    )
  )
);