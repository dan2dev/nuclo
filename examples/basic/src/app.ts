import { getTodos, getInputValue, setInputValue, addTodo, toggleTodo, deleteTodo } from "./todoState.ts";
import { globalStyles as s } from "./styles.ts";

export const app = div(
  s.body,
  div(
    s.container,
    // Header
    h1(s.header, "📝 Todo List"),

    // Input section
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

    // Todo list
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
    )
  )
);