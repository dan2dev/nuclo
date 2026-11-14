// Todo list: add, check off, filter and edit tasks; each task opens on its own screen.
import "nuclo-native";
import { createRouter } from "nuclo-native/router";
import { action, body, card, chip, color, heading, muted, row } from "../ui";

interface Task {
  id: string;
  title: string;
  notes: string;
  done: boolean;
}

let nextId = 1;
const task = (title: string, notes = "", done = false): Task => ({ id: String(nextId++), title, notes, done });
const tasks: Task[] = [
  task("Buy oat milk"),
  task("Book the dentist", "Ask for a morning slot."),
  task("Water the plants", "", true),
];

const filters = { All: () => true, Active: (t: Task) => !t.done, Done: (t: Task) => t.done };
type Filter = keyof typeof filters;
let filter: Filter = "All";
let draft = "";

const shown = () => tasks.filter(filters[filter]);
const left = () => tasks.filter((t) => !t.done).length;
const find = (id: string) => tasks.find((t) => t.id === id);

function add() {
  const title = draft.trim();
  if (!title) return;
  tasks.unshift(task(title));
  draft = "";
  update();
}

const field = { backgroundColor: color.field, color: color.text, borderRadius: 10, padding: 10, fontSize: 15 };

const checkbox = (t: Task) =>
  input({
    type: "checkbox",
    checked: () => t.done,
    onChange: (e) => {
      t.done = (e.target as HTMLInputElement).checked;
      update();
    },
  });

const item = (t: Task) =>
  div(
    { style: { ...row, backgroundColor: color.card, borderRadius: 12, padding: 12 } },
    checkbox(t),
    div(
      { style: { flex: 1, gap: 2 }, onClick: () => router.go(`/task/${t.id}`) },
      span(() => t.title, {
        style: () => ({ color: t.done ? color.muted : color.text, fontSize: 15, opacity: t.done ? 0.6 : 1 }),
      }),
      when(() => !!t.notes, muted(() => t.notes, 12)),
    ),
    muted("›", 20),
  );

const Tasks = () =>
  div(
    { style: { padding: 16, gap: 12 } },
    div(
      { style: row },
      input({
        placeholder: "Add a task",
        value: () => draft,
        style: { ...field, flex: 1 },
        onInput: (e) => {
          draft = (e.target as HTMLInputElement).value;
          update();
        },
        onChange: add,
      }),
      div({ style: { width: 72 } }, action("Add", add, () => !!draft.trim())),
    ),
    div(
      { style: { flexDirection: "row", gap: 8 } },
      ...(Object.keys(filters) as Filter[]).map((name) =>
        chip(name, () => filter === name, () => {
          filter = name;
          update();
        }),
      ),
    ),
    when(() => shown().length > 0, div({ style: { gap: 8 } }, list(shown, item))).else(
      card(muted(() => (filter === "Done" ? "Nothing finished yet." : filter === "Active" ? "All done. 🎉" : "No tasks yet."))),
    ),
    div(
      { style: row },
      div({ style: { flex: 1 } }, muted(() => `${left()} ${left() === 1 ? "task" : "tasks"} left`)),
      when(
        () => tasks.some((t) => t.done),
        div(
          {
            onClick: () => {
              for (const done of tasks.filter((t) => t.done)) tasks.splice(tasks.indexOf(done), 1);
              update();
            },
          },
          span("Clear done", { style: { color: color.accent, fontSize: 14, fontWeight: "bold" } }),
        ),
      ),
    ),
  );

const TaskDetail = ({ id }: Record<string, string>) => {
  const t = find(id);
  if (!t) return div({ style: { padding: 16 } }, muted("This task was deleted."));
  return div(
    { style: { padding: 16, gap: 14 } },
    card(
      muted("Title"),
      input({
        value: () => t.title,
        style: field,
        onInput: (e) => {
          t.title = (e.target as HTMLInputElement).value;
          update();
        },
      }),
      muted("Notes"),
      input({
        placeholder: "Add a note",
        value: () => t.notes,
        style: field,
        onInput: (e) => {
          t.notes = (e.target as HTMLInputElement).value;
          update();
        },
      }),
      div({ style: row }, checkbox(t), body(() => (t.done ? "Done" : "Not done yet"))),
    ),
    div(
      {
        style: { backgroundColor: "#fee2e2", borderRadius: 10, padding: 12, alignItems: "center" },
        onClick: () => {
          tasks.splice(tasks.indexOf(t), 1);
          router.back();
        },
      },
      span("Delete task", { style: { color: color.bad, fontSize: 15, fontWeight: "bold" } }),
    ),
    heading(() => (t.done ? "✓ Finished" : ""), 14),
  );
};

export const router = createRouter({
  "/": { view: Tasks, title: "Todos" },
  "/task/:id": { view: TaskDetail, title: ({ id }) => find(id)?.title ?? "Task" },
});

document.body.style.backgroundColor = color.page;
render(router.outlet, document.body);
