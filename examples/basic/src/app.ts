import { getTodos, getInputValue, setInputValue, addTodo, toggleTodo, deleteTodo, reorderTodos } from "./todoState.ts";
import { globalStyles as s, cn } from "./styles.ts";
import { sortable } from "./sortable.ts";

let visible = false
let counter = 0;
let intervalId: number | null = null;
const els: any = {};
els.el = document.createElement("div");
els.el.textContent = "Hello, Nuclo!";
document.body.appendChild(els.el);
els.el.addEventListener("click", () => {
  alert("Hello from Nuclo!");
});

document.body.removeChild(els.el);
// delete els.el;

export const app = div(
  s.body,
  div(
    s.container,
    h1(s.header, "📝 Todo List"),

    div(
      s.inputContainer,
      input(
        s.input,
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
        })
      ),
      button(s.addButton, "Add", on("click", addTodo))
    ),
    div(
      input(
        { type: "checkbox", id: "visibilityToggle" },
        on("change", (e) => {
          visible = (e.target as HTMLInputElement).checked;
          update();
        })
      ),
      span("is this visible: "),
      when(() => visible, "yes").else("no"),
    ),
    div(
      s.inputContainer,
      button(
        s.addButton,
        "Play",
        on("click", () => {
          if (intervalId === null) {
            intervalId = setInterval(() => {
              document.getElementById("visibilityToggle")?.click();
            }, 10) as unknown as number;
          }
        })
      ),
      button(
        s.deleteButton,
        "Stop",
        on("click", () => {
          if (intervalId !== null) {
            clearInterval(intervalId);
            intervalId = null;
          }
        })
      )
    ),
    when(() => !visible,
      div(
        button(on("click", () => { counter++; update(); }), "Increment Counter"),
        div("No todos yet! Add one above. Counter: ", () => counter)))
      .else("2"),
    when(() => getTodos().length === 0 || !visible,
      div("No todos yet! Add one above.")
    ).else(
      div(
        // scope("todos"),
        s.todoList,
        list(
          () => getTodos(),
          (todo) =>
            div(
              // sortable(reorderTodos),
              s.todoItem,
              span(
                {
                  "data-drag-handle": "true",
                },
                cn(height("20").cursor("grab").width("20").bg("#ccc").display("inline-block")),
                "⇅"),
              input(
                s.checkbox,
                {
                  type: "checkbox",
                  checked: () => todo.completed,
                },
                on("change", () => toggleTodo(todo.id))
              ),
              span(
                () => (todo.completed ? s.todoTextCompleted : s.todoText),
                () => todo.text
              ),
              button(s.deleteButton, "Delete", on("click", () => deleteTodo(todo.id)))
            )
        )
      ))
  )
);