import "nuclo-native";

let count = 0;
let draft = "";
const todos: { id: number; text: string; done: boolean }[] = [];

function add() {
  if (!draft.trim()) return;
  todos.push({ id: Date.now(), text: draft.trim(), done: false });
  draft = "";
  update();
}

const row = { flexDirection: "row", gap: 8, alignItems: "center" };

const App = () =>
  div(
    { style: { padding: 24, gap: 16 } },
    h1("nuclo-native"),
    p(() => `Count: ${count}`, { style: () => ({ color: count < 0 ? "#c0392b" : "#2d7d46", fontSize: 20 }) }),
    div(
      { style: row },
      button("−", { onClick: () => { count--; update(); } }),
      button("+", { onClick: () => { count++; update(); } }),
    ),
    h2("Todos"),
    div(
      { style: row },
      input({
        placeholder: "What needs doing?",
        value: () => draft,
        style: { flex: 1 },
        onInput: (e) => { draft = (e.target as HTMLInputElement).value; update(); },
        onChange: add,
      }),
      button("Add", { onClick: add }),
    ),
    when(
      () => todos.length > 0,
      list(() => todos, (todo) =>
        div(
          { style: row },
          button(() => (todo.done ? "☑" : "☐"), { onClick: () => { todo.done = !todo.done; update(); } }),
          span(() => todo.text, { style: () => ({ flex: 1, opacity: todo.done ? 0.4 : 1 }) }),
          button("✕", { onClick: () => { todos.splice(todos.indexOf(todo), 1); update(); } }),
        ),
      ),
    ).else(p("Nothing to do.", { style: { opacity: 0.6 } })),
  );

render(App, document.body);
