import { Page } from "nuclo-pages";
import { addTodo, clearCompleted, listTodos, removeTodo, toggleTodo } from "../server/todos";
import { styles } from "../styles";

export default Page({
  // load and actions only run on the server.
  load: () => listTodos(),
  head: () => ({ title: "Todos · Nuclo Pages" }),
  actions: {
    add: (text: string) => addTodo(text),
    toggle: (id: number) => toggleTodo(id),
    remove: (id: number) => removeTodo(id),
    clearCompleted: () => clearCompleted(),
  },
  // After each action the data reloads and the page re-renders: render can simply compute from data.
  render: ({ data, actions }) => {
    const completed = data.filter((todo) => todo.done).length;
    const state = { error: "" };
    const run = (action: Promise<unknown>) =>
      action.catch((e: Error) => {
        state.error = e.message;
        update();
      });

    return section(
      h1("Todos"),
      form(
        styles.form,
        {
          onSubmit: (event: SubmitEvent) => {
            event.preventDefault();
            void run(actions.add(String(new FormData(event.currentTarget as HTMLFormElement).get("text"))));
          },
        },
        input(styles.input, { name: "text", placeholder: "What needs doing?", autocomplete: "off" }),
        button(styles.button, { type: "submit" }, "Add"),
      ),
      p(styles.error, () => state.error),
      ul(
        styles.list,
        ...data.map((todo) =>
          li(
            styles.todo,
            input({ type: "checkbox", checked: todo.done, onChange: () => run(actions.toggle(todo.id)) }),
            span(todo.done ? styles.done : {}, todo.text),
            button(styles.ghost, { "aria-label": "Remove", onClick: () => run(actions.remove(todo.id)) }, "×"),
          ),
        ),
      ),
      p(styles.muted, `${completed} completed of ${data.length}`),
      button(styles.ghost, { onClick: () => run(actions.clearCompleted()) }, "Clear completed"),
    );
  },
});
