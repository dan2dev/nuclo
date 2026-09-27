import type { PageProps } from "nuclo-pages";
import { addTodo, listTodos, removeTodo, toggleTodo } from "../server/todos";
import { styles } from "../styles";

export const load = () => listTodos();

export const head = () => ({ title: "Todos · Nuclo Pages" });

export default function Todos({ data }: PageProps<typeof load>) {
  const state = { todos: data, error: "" };

  // Server functions are plain async calls; errors thrown on the server arrive here.
  const run = async (action: () => Promise<void>) => {
    state.error = "";
    try {
      await action();
    } catch (e) {
      state.error = (e as Error).message;
    }
    update();
  };

  return section(
    h1("Todos"),
    form(
      styles.form,
      {
        onSubmit: (event: SubmitEvent) => {
          event.preventDefault();
          const form = event.currentTarget as HTMLFormElement;
          const text = String(new FormData(form).get("text"));
          void run(async () => {
            state.todos.push(await addTodo(text));
            form.reset();
          });
        },
      },
      input(styles.input, { name: "text", placeholder: "What needs doing?", autocomplete: "off" }),
      button(styles.button, { type: "submit" }, "Add"),
    ),
    p(styles.error, () => state.error),
    ul(
      styles.list,
      list(
        () => state.todos,
        (todo) =>
          li(
            styles.todo,
            input({ type: "checkbox", checked: () => todo.done, onChange: () => run(async () => void Object.assign(todo, await toggleTodo(todo.id))) }),
            span({ class: () => (todo.done ? styles.done.className : "") }, () => todo.text),
            button(styles.ghost, { "aria-label": "Remove", onClick: () => run(async () => {
              await removeTodo(todo.id);
              state.todos = state.todos.filter((t) => t !== todo);
            }) }, "×"),
          ),
      ),
    ),
    p(styles.muted, () => `${state.todos.filter((t) => !t.done).length} left`),
  );
}
