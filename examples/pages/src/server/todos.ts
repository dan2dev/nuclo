import { DatabaseSync } from "node:sqlite";
import { error, notFound } from "nuclo-pages";

export interface Todo {
  id: number;
  text: string;
  done: boolean;
}

// Stored in todos.db, in the directory the server runs from. Set up in a single
// declaration so the browser build drops it along with the node:sqlite import.
const db = (() => {
  const db = new DatabaseSync("todos.db");
  // A new file gets the table and the demo todos.
  if (!db.prepare("SELECT 1 FROM sqlite_schema WHERE name = 'todos'").get()) {
    db.exec(`
      CREATE TABLE todos (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0);
      INSERT INTO todos (text, done) VALUES ('Try Nuclo Pages', 1), ('Call a server function', 0);
    `);
  }
  return db;
})();

// SQLite has no booleans: done is stored as 0 or 1.
const toTodo = ({ id, text, done }: Record<string, unknown>) => ({ id, text, done: done === 1 }) as Todo;

export const listTodos = $server(async () => db.prepare("SELECT * FROM todos ORDER BY id").all().map(toTodo));

export const addTodo = $server(async (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) error(400, "A todo needs some text");
  return toTodo(db.prepare("INSERT INTO todos (text) VALUES (?) RETURNING *").get(trimmed)!);
});

export const toggleTodo = $server(async (id: number) =>
  toTodo(db.prepare("UPDATE todos SET done = NOT done WHERE id = ? RETURNING *").get(id) ?? notFound()),
);

export const removeTodo = $server(async (id: number) => {
  db.prepare("DELETE FROM todos WHERE id = ?").run(id);
});
